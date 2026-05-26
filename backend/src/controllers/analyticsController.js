const { pool } = require('../config/db');

exports.backlog = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT p.name AS prosecutor_name, c.case_priority,
        COUNT(*) AS case_count,
        ROUND(AVG((CURRENT_DATE - c.opened_date)::numeric), 1) AS avg_days_open
      FROM cases c
      JOIN personnel p ON c.prosecutor_id = p.personnel_id
      WHERE c.status IN ('open', 'active')
      GROUP BY p.name, c.case_priority
      ORDER BY p.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.labTurnaround = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT test_type,
        COUNT(*) AS completed_count,
        ROUND(AVG((completion_date - request_date)::numeric), 1) AS avg_days
      FROM lab_tests
      WHERE status = 'completed' AND completion_date IS NOT NULL
      GROUP BY test_type
      ORDER BY avg_days DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.storageUtilization = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT sl.room, sl.locker, sl.access_level, ei.current_status, COUNT(*) AS item_count
      FROM storage_locations sl
      JOIN custody_transfers ct ON sl.storage_location_id = ct.storage_location_id
      JOIN evidence_items ei ON ct.evidence_item_id = ei.evidence_item_id
      GROUP BY sl.storage_location_id, sl.room, sl.locker, sl.access_level, ei.current_status
      ORDER BY sl.access_level, sl.room
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.prosecutorWorkload = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT p.name,
        COUNT(DISTINCT c.case_id) AS total_cases,
        COUNT(DISTINCT e.evidence_item_id) AS total_evidence,
        COUNT(DISTINCT lt.lab_test_id) FILTER (WHERE lt.status != 'completed') AS pending_tests
      FROM personnel p
      LEFT JOIN cases c ON p.personnel_id = c.prosecutor_id AND c.status IN ('open', 'active')
      LEFT JOIN evidence_items e ON c.case_id = e.case_id
      LEFT JOIN lab_tests lt ON e.evidence_item_id = lt.evidence_item_id AND lt.status != 'completed'
      WHERE p.role = 'prosecutor'
      GROUP BY p.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};
