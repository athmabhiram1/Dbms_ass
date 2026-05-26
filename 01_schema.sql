-- ============================================================================
-- CUSTODYCORE — Forensic Evidence Chain of Custody
-- Schema Architecture | Phase 1
-- PostgreSQL 17 | Single Jurisdiction
-- 3NF Compliant | v2.0
-- ============================================================================

-- Drop everything if re-running (idempotent rebuild)
DROP VIEW IF EXISTS vw_evidence_audit_trail CASCADE;

DROP FUNCTION IF EXISTS fn_auto_dispose_on_case_close();
DROP FUNCTION IF EXISTS fn_validate_custody_sequence();
DROP TABLE IF EXISTS ai_summaries CASCADE;
DROP TABLE IF EXISTS disclosure_logs CASCADE;
DROP TABLE IF EXISTS evidence_requests CASCADE;
DROP TABLE IF EXISTS lab_tests CASCADE;
DROP TABLE IF EXISTS custody_transfers CASCADE;
DROP TABLE IF EXISTS evidence_items CASCADE;
DROP TABLE IF EXISTS storage_locations CASCADE;
DROP TABLE IF EXISTS evidence_types CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS personnel CASCADE;
DROP TABLE IF EXISTS courts CASCADE;

-- Drop ENUMs if they exist
DROP TYPE IF EXISTS case_priority;
DROP TYPE IF EXISTS case_status;
DROP TYPE IF EXISTS personnel_role;
DROP TYPE IF EXISTS evidence_status;
DROP TYPE IF EXISTS transfer_type;
DROP TYPE IF EXISTS lab_test_type;
DROP TYPE IF EXISTS lab_test_status;
DROP TYPE IF EXISTS request_status;
DROP TYPE IF EXISTS view_type;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE personnel_role AS ENUM (
    'officer',
    'lab_technician',
    'prosecutor',
    'defense_attorney',
    'court_clerk'
);

CREATE TYPE case_status AS ENUM (
    'open',
    'active',
    'closed'
);

CREATE TYPE case_priority AS ENUM (
    'critical',
    'major',
    'minor'
);

CREATE TYPE evidence_status AS ENUM (
    'collected',
    'in_storage',
    'in_transit',
    'at_lab',
    'in_court',
    'disposed'
);

CREATE TYPE transfer_type AS ENUM (
    'collection',
    'transport',
    'lab_submission',
    'lab_return',
    'court_delivery',
    'disposal',
    'defense_viewing'
);

CREATE TYPE lab_test_type AS ENUM (
    'dna',
    'fingerprint',
    'toxicology',
    'ballistics',
    'digital_forensics'
);

CREATE TYPE lab_test_status AS ENUM (
    'requested',
    'in_progress',
    'completed'
);

CREATE TYPE request_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'fulfilled'
);

CREATE TYPE view_type AS ENUM (
    'physical_inspection',
    'certified_copy',
    'digital_copy'
);

-- ============================================================================
-- LOOKUP TABLES
-- ============================================================================

-- courts: Single jurisdiction placeholder. Court name, address, contact.
CREATE TABLE courts (
    court_id        SERIAL PRIMARY KEY,
    court_name      VARCHAR(200) NOT NULL,
    address         TEXT NOT NULL,
    contact_phone   VARCHAR(30),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE courts IS '3NF: Court details isolated from cases. No transitive dependency.';

-- evidence_types: Lookup for evidence classification.
CREATE TABLE evidence_types (
    evidence_type_id   SERIAL PRIMARY KEY,
    type_name          VARCHAR(50) NOT NULL UNIQUE,
    description        TEXT
);

-- Seed the standard types immediately
INSERT INTO evidence_types (type_name, description) VALUES
    ('weapon', 'Firearms, knives, blunt objects, or other instruments used in a crime'),
    ('biological', 'DNA samples, blood, tissue, hair, or other biological material'),
    ('digital', 'Computers, phones, hard drives, memory cards, or digital media'),
    ('narcotic', 'Controlled substances, drugs, or paraphernalia'),
    ('document', 'Papers, records, contracts, or written evidence'),
    ('firearm', 'Guns, ammunition, shell casings, or gunshot residue'),
    ('currency', 'Cash, coins, or monetary instruments'),
    ('controlled_substance', 'Prescription drugs or scheduled chemicals');

COMMENT ON TABLE evidence_types IS '3NF: Evidence type descriptions isolated from evidence_items. No transitive dependency.';

-- storage_locations: Physical storage for evidence.
CREATE TABLE storage_locations (
    storage_location_id  SERIAL PRIMARY KEY,
    room                 VARCHAR(100) NOT NULL,
    locker               VARCHAR(100),
    refrigerator         VARCHAR(100),
    vault                VARCHAR(100),
    climate_notes        TEXT,
    access_level         VARCHAR(50) NOT NULL DEFAULT 'restricted',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE storage_locations IS '3NF: Location data separated from custody_transfers.';

-- ============================================================================
-- CORE LEGAL ENTITIES
-- ============================================================================

-- personnel: Unified actor registry for all system users.
CREATE TABLE personnel (
    personnel_id   SERIAL PRIMARY KEY,
    name           VARCHAR(200) NOT NULL,
    badge_number   VARCHAR(50) NOT NULL UNIQUE,
    department     VARCHAR(200),
    unit           VARCHAR(200),
    contact        VARCHAR(200),
    role           personnel_role NOT NULL,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE personnel IS '3NF: department/unit are direct attributes of personnel. No transitive dependency.';

-- cases: The legal container for evidence.
CREATE TABLE cases (
    case_id         SERIAL PRIMARY KEY,
    case_number     VARCHAR(20) NOT NULL UNIQUE
                    CHECK (case_number ~ '^\d{4}-CR-\d{3}$'),
    case_priority   case_priority NOT NULL DEFAULT 'major',
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    status          case_status NOT NULL DEFAULT 'open',
    prosecutor_id   INTEGER REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    defense_id      INTEGER REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    court_id        INTEGER REFERENCES courts(court_id) ON DELETE RESTRICT,
    hearing_date    DATE,
    opened_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    closed_date     DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_prosecutor ON cases(prosecutor_id);
CREATE INDEX idx_cases_defense ON cases(defense_id);

COMMENT ON TABLE cases IS '3NF: case_priority is a direct attribute. case_number is formatted YYYY-CR-NNN.';

-- ============================================================================
-- EVIDENCE CORE
-- ============================================================================

-- evidence_items: The physical evidence tracked through the system.
CREATE TABLE evidence_items (
    evidence_item_id     SERIAL PRIMARY KEY,
    asset_tag            VARCHAR(50) NOT NULL UNIQUE,
    description          TEXT NOT NULL,
    case_id              INTEGER NOT NULL REFERENCES cases(case_id) ON DELETE RESTRICT,
    evidence_type_id     INTEGER NOT NULL REFERENCES evidence_types(evidence_type_id) ON DELETE RESTRICT,
    collected_date       TIMESTAMPTZ NOT NULL,
    crime_scene_location TEXT,
    current_status       evidence_status NOT NULL DEFAULT 'collected',
    disposal_date        DATE,
    collected_by         INTEGER NOT NULL REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_disposal_date_after_collected
        CHECK (disposal_date IS NULL OR disposal_date >= collected_date::DATE),
    CONSTRAINT chk_disposed_has_date
        CHECK ((current_status = 'disposed' AND disposal_date IS NOT NULL)
               OR current_status != 'disposed')
);

CREATE INDEX idx_evidence_items_case_id ON evidence_items(case_id);
CREATE INDEX idx_evidence_items_status ON evidence_items(current_status);
CREATE INDEX idx_evidence_items_collected_by ON evidence_items(collected_by);

COMMENT ON TABLE evidence_items IS '3NF: collected_date/crime_scene_location direct temporal/geospatial attributes. Case data lives in cases.';

-- ============================================================================
-- CHAIN OF CUSTODY
-- ============================================================================

-- custody_transfers: The critical audit table — backbone of the system.
CREATE TABLE custody_transfers (
    transfer_id          SERIAL PRIMARY KEY,
    evidence_item_id     INTEGER NOT NULL REFERENCES evidence_items(evidence_item_id) ON DELETE RESTRICT,
    from_personnel_id    INTEGER REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    to_personnel_id      INTEGER NOT NULL REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    transfer_timestamp   TIMESTAMPTZ NOT NULL,
    storage_location_id  INTEGER REFERENCES storage_locations(storage_location_id) ON DELETE RESTRICT,
    transfer_type        transfer_type NOT NULL,
    notes                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_no_future_transfer
        CHECK (transfer_timestamp <= CURRENT_TIMESTAMP)
);

CREATE INDEX idx_custody_transfers_evidence_item_id
    ON custody_transfers(evidence_item_id);
CREATE INDEX idx_custody_transfers_timestamp
    ON custody_transfers(evidence_item_id, transfer_timestamp);

COMMENT ON TABLE custody_transfers IS '3NF: Provenance stored as rows. Personnel attributes live in personnel table.';

-- ============================================================================
-- LAB INTEGRATION
-- ============================================================================

-- lab_tests: Simplified lab test tracking for evidence items.
CREATE TABLE lab_tests (
    lab_test_id      SERIAL PRIMARY KEY,
    evidence_item_id INTEGER NOT NULL REFERENCES evidence_items(evidence_item_id) ON DELETE RESTRICT,
    test_type        lab_test_type NOT NULL,
    requested_by     INTEGER NOT NULL REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    lab_technician   INTEGER REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    status           lab_test_status NOT NULL DEFAULT 'requested',
    results_summary  TEXT,
    request_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    completion_date  DATE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_completion_after_request
        CHECK (completion_date IS NULL OR completion_date >= request_date)
);

CREATE INDEX idx_lab_tests_evidence ON lab_tests(evidence_item_id);
CREATE INDEX idx_lab_tests_status ON lab_tests(status);

COMMENT ON TABLE lab_tests IS '3NF: Lab test details isolated from evidence_items.';

-- ============================================================================
-- DEFENSE / DISCLOSURE
-- ============================================================================

-- evidence_requests: Defense attorney requests for evidence access.
CREATE TABLE evidence_requests (
    evidence_request_id   SERIAL PRIMARY KEY,
    evidence_item_id      INTEGER NOT NULL REFERENCES evidence_items(evidence_item_id) ON DELETE RESTRICT,
    requesting_attorney_id INTEGER NOT NULL REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    status                request_status NOT NULL DEFAULT 'pending',
    request_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    decision_date         DATE,
    approved_by_id        INTEGER REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    denial_reason         TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_decision_after_request
        CHECK (decision_date IS NULL OR decision_date >= request_date),
    CONSTRAINT chk_denial_reason_if_denied
        CHECK ((status = 'denied' AND denial_reason IS NOT NULL)
               OR status != 'denied')
);

CREATE INDEX idx_evidence_requests_item ON evidence_requests(evidence_item_id);
CREATE INDEX idx_evidence_requests_attorney ON evidence_requests(requesting_attorney_id);

COMMENT ON TABLE evidence_requests IS '3NF: Request data separate from disclosure_logs.';

-- disclosure_logs: Records actual viewing events by defense.
CREATE TABLE disclosure_logs (
    disclosure_log_id     SERIAL PRIMARY KEY,
    evidence_item_id      INTEGER NOT NULL REFERENCES evidence_items(evidence_item_id) ON DELETE RESTRICT,
    evidence_request_id   INTEGER NOT NULL REFERENCES evidence_requests(evidence_request_id) ON DELETE RESTRICT,
    viewing_attorney_id   INTEGER NOT NULL REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    supervising_officer_id INTEGER NOT NULL REFERENCES personnel(personnel_id) ON DELETE RESTRICT,
    view_date             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    view_type             view_type NOT NULL,
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disclosure_logs_item ON disclosure_logs(evidence_item_id);
CREATE INDEX idx_disclosure_logs_request ON disclosure_logs(evidence_request_id);

COMMENT ON TABLE disclosure_logs IS '3NF: Viewing events logged with view_type enum for legal precision.';

-- ============================================================================
-- AI SUMMARISATION (Stretch Goal — empty structure for Phase 8)
-- ============================================================================

CREATE TABLE ai_summaries (
    summary_id      SERIAL PRIMARY KEY,
    case_id         INTEGER NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    summary_text    TEXT NOT NULL,
    model_used      VARCHAR(100),
    prompt_version  VARCHAR(50),
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_summaries_case ON ai_summaries(case_id);

COMMENT ON TABLE ai_summaries IS 'Stretch goal: Populated by external Python script, not DB triggers.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_type, table_name;
