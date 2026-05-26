const { pool } = require('../config/db');

exports.listEvidence = async (req, res, next) => {
  try {
    let query = `
      SELECT e.*, c.case_number, et.type_name
      FROM evidence_items e
      LEFT JOIN cases c ON e.case_id = c.case_id
      LEFT JOIN evidence_types et ON e.evidence_type_id = et.evidence_type_id
    `;
    const values = [];
    if (req.query.search) {
      query += ` WHERE e.asset_tag ILIKE $1 OR c.case_number ILIKE $1 OR e.description ILIKE $1 `;
      values.push(`%${req.query.search}%`);
    }
    query += ` ORDER BY e.collected_date DESC`;
    
    const result = await pool.query(query, values);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.getAuditTrail = async (req, res, next) => {
  try {
    const { tag } = req.params;
    const evCheck = await pool.query('SELECT 1 FROM evidence_items WHERE asset_tag = $1', [tag]);
    if (evCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Asset tag not found' });
    }
    const result = await pool.query(`
      SELECT * FROM vw_evidence_audit_trail WHERE asset_tag = $1 ORDER BY transfer_timestamp ASC
    `, [tag]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.createEvidence = async (req, res, next) => {
  try {
    const { asset_tag, description, case_id, evidence_type_id, collected_date, crime_scene_location, collected_by } = req.body;
    const result = await pool.query(`
      INSERT INTO evidence_items (asset_tag, description, case_id, evidence_type_id, collected_date, crime_scene_location, current_status, collected_by)
      VALUES ($1, $2, $3, $4, $5, $6, 'collected', $7)
      RETURNING *
    `, [asset_tag, description, case_id, evidence_type_id, collected_date, crime_scene_location, collected_by]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
