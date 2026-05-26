const { pool } = require('../config/db');

exports.listRequests = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT er.*, e.asset_tag, ra.name AS requesting_attorney_name, ab.name AS approved_by_name
      FROM evidence_requests er
      JOIN evidence_items e ON er.evidence_item_id = e.evidence_item_id
      JOIN personnel ra ON er.requesting_attorney_id = ra.personnel_id
      LEFT JOIN personnel ab ON er.approved_by_id = ab.personnel_id
      ORDER BY er.request_date DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    const { evidence_item_id, requesting_attorney_id } = req.body;
    const result = await pool.query(`
      INSERT INTO evidence_requests (evidence_item_id, requesting_attorney_id, status, request_date)
      VALUES ($1, $2, 'pending', CURRENT_DATE)
      RETURNING *
    `, [evidence_item_id, requesting_attorney_id]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.logDisclosure = async (req, res, next) => {
  try {
    const { evidence_item_id, evidence_request_id, viewing_attorney_id, supervising_officer_id, view_date, view_type } = req.body;
    const result = await pool.query(`
      INSERT INTO disclosure_logs (evidence_item_id, evidence_request_id, viewing_attorney_id, supervising_officer_id, view_date, view_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [evidence_item_id, evidence_request_id, viewing_attorney_id, supervising_officer_id, view_date, view_type]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
