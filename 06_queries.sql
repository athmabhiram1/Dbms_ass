-- ============================================================================
-- CUSTODYCORE — Query Portfolio (10 Queries)
-- Phase 5: Analytical & Operational Query Suite
-- ============================================================================

-- ============================================================================
-- AUDIT & INTEGRITY QUERIES
-- ============================================================================

-- --------------------------------------------------------------------------
-- Q1: Full custody audit trail for a given evidence item
-- Uses: vw_evidence_audit_trail (6-table JOIN encapsulated in VIEW)
-- --------------------------------------------------------------------------
SELECT asset_tag, case_number, transfer_timestamp,
       from_officer_name, from_officer_badge,
       to_officer_name, to_officer_badge,
       location_room, location_locker,
       transfer_type, notes
FROM vw_evidence_audit_trail
WHERE asset_tag = 'TAG-001001'  -- Replace with any asset tag
ORDER BY transfer_timestamp;

-- --------------------------------------------------------------------------
-- Q2: Evidence items with custody gaps or orphan status
-- Items where most recent transfer is > 24h old and status != disposed,
-- OR items with zero transfer records after collected_date.
-- Uses: Subquery (LAG-like pattern via MAX), anti-join
-- --------------------------------------------------------------------------
WITH latest_transfer AS (
    SELECT evidence_item_id, MAX(transfer_timestamp) AS last_transfer
    FROM custody_transfers
    GROUP BY evidence_item_id
)
SELECT ei.asset_tag, ei.description, ei.current_status,
       ei.collected_date,
       lt.last_transfer,
       CASE
           WHEN lt.last_transfer IS NULL THEN 'No transfers recorded'
           WHEN lt.last_transfer < CURRENT_TIMESTAMP - INTERVAL '24 hours'
                AND ei.current_status != 'disposed'
           THEN 'Custody gap > 24h'
           ELSE 'OK'
       END AS custody_status
FROM evidence_items ei
LEFT JOIN latest_transfer lt ON ei.evidence_item_id = lt.evidence_item_id
WHERE lt.last_transfer IS NULL
   OR (lt.last_transfer < CURRENT_TIMESTAMP - INTERVAL '24 hours'
       AND ei.current_status != 'disposed')
ORDER BY ei.collected_date;

-- ============================================================================
-- ANALYTICAL / AGGREGATE QUERIES
-- ============================================================================

-- --------------------------------------------------------------------------
-- Q3: Case backlog by prosecutor
-- Count of open cases, average days open, broken down by case_priority.
-- Uses: GROUP BY, AVG, COUNT, FILTER for non-closed cases
-- --------------------------------------------------------------------------
SELECT
    p.personnel_id,
    p.name AS prosecutor_name,
    c.case_priority,
    COUNT(*) AS case_count,
    ROUND(AVG((CURRENT_DATE - c.opened_date)::numeric), 1) AS avg_days_open
FROM cases c
JOIN personnel p ON c.prosecutor_id = p.personnel_id
WHERE c.status != 'closed'
GROUP BY p.personnel_id, p.name, c.case_priority
ORDER BY p.name, c.case_priority;

-- --------------------------------------------------------------------------
-- Q4: Lab turnaround time
-- AVG(completion_date - request_date) by test type, filtered for completed
-- tests only.
-- --------------------------------------------------------------------------
SELECT
    test_type,
    COUNT(*) AS completed_tests,
    ROUND(AVG(completion_date - request_date), 1) AS avg_turnaround_days,
    MIN(completion_date - request_date) AS min_days,
    MAX(completion_date - request_date) AS max_days
FROM lab_tests
WHERE status = 'completed'
  AND completion_date IS NOT NULL
GROUP BY test_type
ORDER BY avg_turnaround_days DESC;

-- --------------------------------------------------------------------------
-- Q5: Contamination / integrity flags
-- Count of evidence items with lab test status inconclusive or custody gaps
-- (reuses Q2 logic as CTE).
-- Uses: CTE, UNION, COUNT with DISTINCT
-- --------------------------------------------------------------------------
WITH custody_gaps AS (
    SELECT ei.evidence_item_id, ei.asset_tag
    FROM evidence_items ei
    LEFT JOIN (
        SELECT evidence_item_id, MAX(transfer_timestamp) AS last_transfer
        FROM custody_transfers
        GROUP BY evidence_item_id
    ) lt ON ei.evidence_item_id = lt.evidence_item_id
    WHERE lt.last_transfer IS NULL
       OR (lt.last_transfer < CURRENT_TIMESTAMP - INTERVAL '24 hours'
           AND ei.current_status != 'disposed')
),
flagged_evidence AS (
    SELECT evidence_item_id, asset_tag, 'Custody gap' AS flag_reason
    FROM custody_gaps
    UNION
    SELECT DISTINCT ei.evidence_item_id, ei.asset_tag, 'Inconclusive lab test'
    FROM evidence_items ei
    JOIN lab_tests lt ON ei.evidence_item_id = lt.evidence_item_id
    WHERE lt.results_summary IS NULL
       OR lt.results_summary = ''
)
SELECT flag_reason, COUNT(DISTINCT evidence_item_id) AS evidence_count
FROM flagged_evidence
GROUP BY flag_reason;

-- --------------------------------------------------------------------------
-- Q6: Storage utilization
-- Count of items per storage location, grouped by access_level and
-- current_status.
-- --------------------------------------------------------------------------
SELECT
    sl.storage_location_id,
    sl.room || COALESCE(' / ' || sl.locker, '') || COALESCE(' / ' || sl.refrigerator, '') || COALESCE(' / ' || sl.vault, '') AS location_name,
    sl.access_level,
    ei.current_status,
    COUNT(*) AS item_count
FROM storage_locations sl
LEFT JOIN custody_transfers ct ON sl.storage_location_id = ct.storage_location_id
LEFT JOIN evidence_items ei ON ct.evidence_item_id = ei.evidence_item_id
GROUP BY sl.storage_location_id, location_name, sl.access_level, ei.current_status
ORDER BY sl.access_level, sl.storage_location_id, ei.current_status;

-- ============================================================================
-- JOIN-HEAVY OPERATIONAL QUERIES
-- ============================================================================

-- --------------------------------------------------------------------------
-- Q7: Evidence currently in court
-- 6-table JOIN: evidence_items + cases + personnel (prosecutor) +
-- personnel (defense) + courts + custody_transfers
-- --------------------------------------------------------------------------
SELECT DISTINCT
    ei.asset_tag,
    ei.description AS evidence_description,
    c.case_number,
    c.hearing_date,
    pros.name AS prosecutor_name,
    def.name AS defense_attorney_name,
    cr.court_name,
    ct.transfer_timestamp AS court_delivery_time
FROM evidence_items ei
JOIN cases c ON ei.case_id = c.case_id
JOIN personnel pros ON c.prosecutor_id = pros.personnel_id
JOIN personnel def ON c.defense_id = def.personnel_id
JOIN courts cr ON c.court_id = cr.court_id
JOIN custody_transfers ct ON ei.evidence_item_id = ct.evidence_item_id
WHERE ct.transfer_type = 'court_delivery'
  AND c.status IN ('active', 'open')
  AND ct.transfer_timestamp = (
      SELECT MAX(ct2.transfer_timestamp)
      FROM custody_transfers ct2
      WHERE ct2.evidence_item_id = ei.evidence_item_id
        AND ct2.transfer_type = 'court_delivery'
  )
ORDER BY c.hearing_date;

-- --------------------------------------------------------------------------
-- Q8: Defense disclosure history
-- 5-table JOIN: evidence_items → evidence_requests → disclosure_logs →
-- personnel (defense) → personnel (supervising)
-- --------------------------------------------------------------------------
SELECT
    ei.asset_tag,
    ei.description AS evidence_description,
    def_atty.name AS defense_attorney,
    er.status AS request_status,
    er.request_date,
    er.decision_date,
    dl.view_date,
    dl.view_type,
    sup_officer.name AS supervising_officer
FROM evidence_requests er
JOIN evidence_items ei ON er.evidence_item_id = ei.evidence_item_id
JOIN personnel def_atty ON er.requesting_attorney_id = def_atty.personnel_id
LEFT JOIN disclosure_logs dl ON er.evidence_request_id = dl.evidence_request_id
LEFT JOIN personnel sup_officer ON dl.supervising_officer_id = sup_officer.personnel_id
ORDER BY er.request_date DESC;

-- --------------------------------------------------------------------------
-- Q9: Pending lab submissions
-- Evidence awaiting test results, sorted by case_priority
-- 4-table JOIN: cases + evidence_items + lab_tests + personnel (technician)
-- --------------------------------------------------------------------------
SELECT
    c.case_priority,
    c.case_number,
    ei.asset_tag,
    ei.description AS evidence_description,
    lt.test_type,
    lt.status AS lab_status,
    lt.request_date,
    p.name AS technician_name
FROM lab_tests lt
JOIN evidence_items ei ON lt.evidence_item_id = ei.evidence_item_id
JOIN cases c ON ei.case_id = c.case_id
LEFT JOIN personnel p ON lt.lab_technician = p.personnel_id
WHERE lt.status IN ('requested', 'in_progress')
ORDER BY
    CASE c.case_priority
        WHEN 'critical' THEN 1
        WHEN 'major' THEN 2
        WHEN 'minor' THEN 3
    END,
    lt.request_date;

-- --------------------------------------------------------------------------
-- Q10: Prosecutor workload dashboard
-- 4-table JOIN with correlated subquery for lab test counts.
-- Shows: cases + evidence count + pending lab tests + upcoming hearings
-- --------------------------------------------------------------------------
SELECT
    p.name AS prosecutor_name,
    c.case_number,
    c.case_priority,
    c.status,
    c.hearing_date,
    COUNT(DISTINCT ei.evidence_item_id) AS evidence_count,
    (
        SELECT COUNT(*)
        FROM lab_tests lt
        JOIN evidence_items ei2 ON lt.evidence_item_id = ei2.evidence_item_id
        WHERE ei2.case_id = c.case_id
          AND lt.status IN ('requested', 'in_progress')
    ) AS pending_lab_tests
FROM personnel p
JOIN cases c ON p.personnel_id = c.prosecutor_id
LEFT JOIN evidence_items ei ON c.case_id = ei.case_id
WHERE p.role = 'prosecutor'
GROUP BY p.personnel_id, p.name, c.case_id, c.case_number,
         c.case_priority, c.status, c.hearing_date
ORDER BY
    CASE c.case_priority
        WHEN 'critical' THEN 1
        WHEN 'major' THEN 2
        WHEN 'minor' THEN 3
    END,
    c.hearing_date NULLS LAST;
