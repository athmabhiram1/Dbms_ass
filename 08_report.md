# CUSTODYCORE — Forensic Evidence Chain of Custody

## 1. Problem Statement

Law enforcement agencies require a tamper-evident, auditable system to track
physical evidence from crime scene collection through lab analysis to courtroom
presentation and final disposition. Manual paper-based chain-of-custody forms
are prone to errors, gaps, and tampering. CUSTODYCORE provides a relational
database solution enforcing zero-gap chain of custody with automated disposal
on case closure, full audit trail generation, defense access logging, and an
extensible AI summarisation module.

## 2. Schema Design (3NF)

### Entity Model (11 Tables)

| Table | Type | Description |
|-------|------|-------------|
| `courts` | Lookup | Court name, address, contact — single jurisdiction |
| `evidence_types` | Lookup | 8 types: weapon, biological, digital, narcotic, etc. |
| `storage_locations` | Lookup | Room, locker, refrigerator, vault, access level |
| `personnel` | Core | 15 actors with role ENUM, department, unit |
| `cases` | Core | Legal container with formatted case_number, priority ENUM |
| `evidence_items` | Core | Physical items with asset_tag, status, timestamps |
| `custody_transfers` | Audit | 148 transfer records — backbone of the system |
| `lab_tests` | Lab | DNA, fingerprint, toxicology, ballistics, digital |
| `evidence_requests` | Defense | Attorney requests for evidence access |
| `disclosure_logs` | Defense | Actual viewing events with view_type ENUM |
| `ai_summaries` | Stretch | LLM-generated case narratives |

### Normalization (3NF Justification)

**1NF**: All columns atomic. No repeating groups. Provenance events stored as
rows in `custody_transfers`. Departments/units are atomic strings.

**2NF**: All non-key attributes fully dependent on PK. `evidence_items`
contains only item-specific data; case data lives in `cases`. Personnel
attributes live in `personnel`.

**3NF**: No transitive dependencies. Personnel names and departments live in
`personnel`, not duplicated in `custody_transfers`. Evidence type descriptions
live in `evidence_types`. Court details live in `courts`. Case priority is a
direct attribute of `cases`, not derived from `case_number` or `status`.

### Key Design Decisions

- **`cases.case_number`**: Formatted `YYYY-CR-NNN` — human-readable, sortable,
  court-standard. Enforced via CHECK constraint with regex.
- **`cases.case_priority`**: ENUM (`critical`, `major`, `minor`) — enables
  priority-based analytical slicing.
- **`evidence_items.asset_tag`**: UNIQUE constraint — every evidence item
  must have a unique identifier.
- **`custody_transfers`**: Indexed on `evidence_item_id` — critical for
  audit VIEW performance (plan required this index).
- **`ON DELETE RESTRICT`**: Prevents deletion of referenced rows (e.g., cannot
  delete a case with linked evidence).

## 3. Trigger Explanation

### `trg_auto_dispose_on_case_close` (Crown Jewel)

- **Event**: `BEFORE UPDATE OF status ON cases`
- **Action**: When a case status transitions TO `'closed'`:
  1. Sets `NEW.closed_date = CURRENT_DATE` if null
  2. Updates all linked `evidence_items` SET `current_status = 'disposed'`,
     `disposal_date = CURRENT_DATE` where not already disposed
- **Edge cases**: Idempotent — re-closing does nothing. Already-disposed items
  are not re-flagged. Single UPDATE statement (no cursors/loops).
- **Tested**: Case 2026-CR-004 closure moved 4 evidence items to disposed.

### `trg_validate_custody_sequence`

- **Event**: `BEFORE INSERT ON custody_transfers`
- **Action**: Rejects any transfer where `transfer_timestamp` precedes the
  evidence item's `collected_date`. Prevents logically impossible custody events.
- **Tested**: Transfer with timestamp `2025-01-01` for item collected
  `2026-01-20` was correctly rejected with descriptive error message.

## 4. View Explanation

### `vw_evidence_audit_trail`

- **Purpose**: Court-admissible custody history for any evidence item
- **JOIN**: 6 tables — `custody_transfers` → `evidence_items` → `cases` →
  `evidence_types` → `personnel` (from) → `personnel` (to) → `storage_locations`
- **Ordering**: Chronological by `transfer_timestamp` within each asset tag
- **Rows**: 148 (one per custody transfer record)
- **Index dependency**: Relies on `idx_custody_transfers_evidence_item_id`
  for performance (plan-required index).

## 5. Query Descriptions (10 Queries)

| # | Name | JOINs | Features |
|---|------|-------|----------|
| Q1 | Full custody audit trail | Uses VIEW (6 tables) | Single-item chain |
| Q2 | Custody gaps / orphans | Subquery + anti-join | LAG-like MAX pattern |
| Q3 | Prosecutor backlog | 2 tables + GROUP BY | AVG days open by priority |
| Q4 | Lab turnaround time | 1 table + GROUP BY | AVG, MIN, MAX by test type |
| Q5 | Contamination flags | CTE + UNION | Reuses Q2 logic |
| Q6 | Storage utilization | 3 tables + GROUP BY | By access_level + status |
| Q7 | Evidence in court | 6-table JOIN | Subquery for latest delivery |
| Q8 | Defense disclosure | 5-table JOIN | Full request-to-view history |
| Q9 | Pending lab tests | 4-table JOIN | Ordered by priority |
| Q10 | Prosecutor dashboard | 4-table JOIN | Correlated subquery for lab count |

## 6. AI Summariser (Stretch Goal)

- **Provider**: `09_ai_summariser.py` — standalone Python script
- **Backends**: Ollama (local), Claude (Anthropic), OpenAI, Template (fallback)
- **Config**: `summariser_config.json` for provider, model, endpoint, API key
- **Fallback**: Template-based summary using `CONCAT`/`FORMAT` when LLM unavailable
- **Tested**: 4 closed cases summarised with template provider, stored in
  `ai_summaries`

## 7. Validation Results

| Check | Result |
|-------|--------|
| Tables created | 11/11 |
| ENUMs created | 9/9 |
| Indexes created | 24 |
| FK violations | 0 |
| Chronological violations | 0 |
| Future transfers | 0 |
| Duplicate asset tags | 0 |
| Invalid case numbers | 0 |
| Disposal trigger | 4 evidence auto-disposed |
| Custody sequence trigger | Rejects pre-collection transfers |
| Audit VIEW rows | 148 |
| All 10 queries | Execute without error |

## 8. Deliverables Checklist

- [x] `01_schema.sql` — Schema with constraints, comments, indexes
- [x] `02_seed_generator.py` — Python generator script
- [x] `03_data.sql` — Generated seed data (226+ rows)
- [x] `04_triggers.sql` — Auto-disposal + custody validation triggers
- [x] `05_views.sql` — Audit trail VIEW
- [x] `06_queries.sql` — 10 analytical/operational queries
- [x] `07_er_diagram.png` — Visual schema (crow's foot)
- [x] `08_report.md` — This documentation
- [x] `09_ai_summariser.py` — AI summarisation (template + LLM backends)
