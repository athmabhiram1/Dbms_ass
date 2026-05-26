const { pool } = require('../config/db');

exports.listTests = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT lt.*, e.asset_tag, e.description, fp.name AS requested_by_name, tp.name AS technician_name
      FROM lab_tests lt
      JOIN evidence_items e ON lt.evidence_item_id = e.evidence_item_id
      JOIN personnel fp ON lt.requested_by = fp.personnel_id
      LEFT JOIN personnel tp ON lt.lab_technician = tp.personnel_id
      ORDER BY lt.request_date DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.createTest = async (req, res, next) => {
  try {
    const { evidence_item_id, test_type, requested_by } = req.body;
    const result = await pool.query(`
      INSERT INTO lab_tests (evidence_item_id, test_type, requested_by, status, request_date)
      VALUES ($1, $2, $3, 'requested', CURRENT_DATE)
      RETURNING *
    `, [evidence_item_id, test_type, requested_by]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.completeTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { results_summary } = req.body;
    const result = await pool.query(`
      UPDATE lab_tests
      SET status = 'completed', results_summary = $1, completion_date = CURRENT_DATE
      WHERE lab_test_id = $2
      RETURNING *
    `, [results_summary, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Lab test not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
