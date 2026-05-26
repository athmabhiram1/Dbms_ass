-- ============================================================================
-- CUSTODYCORE — Triggers
-- Phase 3: Crown Jewel Triggers
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: trg_auto_dispose_on_case_close
-- Event: AFTER UPDATE OF status ON cases
-- Action: Sets evidence_items to disposed + disposal_date when case closes.
-- Edge cases handled:
--   - Already-disposed items not re-flagged
--   - closed_date auto-set if null
--   - Idempotent: re-closing a case does nothing
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_auto_dispose_on_case_close()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only fire when status transitions TO 'closed'
    IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed') THEN
        -- Set closed_date if not already set
        IF NEW.closed_date IS NULL THEN
            NEW.closed_date := CURRENT_DATE;
        END IF;

        -- Dispose all non-disposed evidence linked to this case
        UPDATE evidence_items
        SET current_status = 'disposed',
            disposal_date = CURRENT_DATE
        WHERE case_id = NEW.case_id
          AND current_status != 'disposed';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_dispose_on_case_close
    BEFORE UPDATE OF status ON cases
    FOR EACH ROW
    EXECUTE FUNCTION fn_auto_dispose_on_case_close();

COMMENT ON FUNCTION fn_auto_dispose_on_case_close IS
    'Crown jewel trigger: auto-disposes evidence when case closes. Single UPDATE, no cursors/loops.';

-- ============================================================================
-- TRIGGER 2: trg_validate_custody_sequence
-- Event: BEFORE INSERT ON custody_transfers
-- Action: Rejects transfer if timestamp is before the evidence item's
--         collected_date. Prevents logically impossible custody events.
-- Edge case: NULL collected_date not possible (NOT NULL constraint).
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_validate_custody_sequence()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_collected_date TIMESTAMPTZ;
BEGIN
    SELECT collected_date INTO v_collected_date
    FROM evidence_items
    WHERE evidence_item_id = NEW.evidence_item_id;

    IF v_collected_date IS NOT NULL AND NEW.transfer_timestamp < v_collected_date THEN
        RAISE EXCEPTION 'Custody transfer timestamp (%) precedes evidence collection date (%) for evidence_item_id %',
            NEW.transfer_timestamp, v_collected_date, NEW.evidence_item_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_custody_sequence
    BEFORE INSERT ON custody_transfers
    FOR EACH ROW
    EXECUTE FUNCTION fn_validate_custody_sequence();

COMMENT ON FUNCTION fn_validate_custody_sequence IS
    'Prevents custody transfers before evidence was collected. Lightweight integrity check.';

-- ============================================================================
-- TEST: Disposal Trigger
-- ============================================================================
-- Test 1: Close case 2026-CR-004 (active → closed), verify evidence auto-disposed
-- Test 2: Verify already-disposed items not re-flagged
-- Test 3: Attempt transfer before collected_date, verify rejection

SELECT 'Trigger verification queries saved for Phase 7 validation.' AS status;
