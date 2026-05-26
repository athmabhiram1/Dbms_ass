-- ============================================================================
-- CUSTODYCORE — Audit VIEW
-- Phase 4: vw_evidence_audit_trail
-- ============================================================================

-- ============================================================================
-- VIEW: vw_evidence_audit_trail
-- Purpose: Court-admissible custody history for any evidence item.
-- Composition: 6-table JOIN: evidence_items → cases → evidence_types →
--              custody_transfers → personnel (from) → personnel (to) →
--              storage_locations.
-- Ordering: Chronological by transfer_timestamp within each evidence item.
-- Index dependency: idx_custody_transfers_evidence_item_id
-- ============================================================================

CREATE OR REPLACE VIEW vw_evidence_audit_trail AS
SELECT
    ei.asset_tag,
    c.case_number,
    ct.transfer_timestamp,
    fp.name AS from_officer_name,
    fp.badge_number AS from_officer_badge,
    tp.name AS to_officer_name,
    tp.badge_number AS to_officer_badge,
    sl.room AS location_room,
    sl.locker AS location_locker,
    ct.transfer_type,
    ct.notes,
    et.type_name AS evidence_type,
    ei.description AS evidence_description,
    c.case_priority,
    c.status AS case_status
FROM custody_transfers ct
JOIN evidence_items ei ON ct.evidence_item_id = ei.evidence_item_id
JOIN cases c ON ei.case_id = c.case_id
JOIN evidence_types et ON ei.evidence_type_id = et.evidence_type_id
LEFT JOIN personnel fp ON ct.from_personnel_id = fp.personnel_id
JOIN personnel tp ON ct.to_personnel_id = tp.personnel_id
LEFT JOIN storage_locations sl ON ct.storage_location_id = sl.storage_location_id
ORDER BY ei.asset_tag, ct.transfer_timestamp;

COMMENT ON VIEW vw_evidence_audit_trail IS
    'Court-admissible custody chain. 6-table JOIN with chronological ordering. Relies on idx_custody_transfers_evidence_item_id.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show audit trail for all evidence (limited output)
SELECT asset_tag, case_number, transfer_timestamp,
       from_officer_name, to_officer_name, transfer_type
FROM vw_evidence_audit_trail
ORDER BY asset_tag, transfer_timestamp
LIMIT 20;

-- Count transfers per evidence item
SELECT asset_tag, COUNT(*) AS transfer_count
FROM vw_evidence_audit_trail
GROUP BY asset_tag
ORDER BY transfer_count DESC;
