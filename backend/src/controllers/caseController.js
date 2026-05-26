const { pool } = require('../config/db');

exports.listCases = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT c.*, p.name AS prosecutor_name, d.name AS defense_name, ct.court_name
      FROM cases c
      LEFT JOIN personnel p ON c.prosecutor_id = p.personnel_id
      LEFT JOIN personnel d ON c.defense_id = d.personnel_id
      LEFT JOIN courts ct ON c.court_id = ct.court_id
      ORDER BY c.opened_date DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM evidence_items WHERE case_id = c.case_id) AS evidence_count
      FROM cases c WHERE c.case_id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.closeCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const check = await pool.query('SELECT status FROM cases WHERE case_id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }
    if (check.rows[0].status === 'closed') {
      return res.status(409).json({ success: false, error: 'Case is already closed' });
    }
    const result = await pool.query(`
      UPDATE cases SET status = 'closed', closed_date = CURRENT_DATE
      WHERE case_id = $1 AND status != 'closed'
      RETURNING *
    `, [id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.getCaseEvidence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT e.*, et.type_name
      FROM evidence_items e
      JOIN evidence_types et ON e.evidence_type_id = et.evidence_type_id
      WHERE e.case_id = $1
    `, [id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};
