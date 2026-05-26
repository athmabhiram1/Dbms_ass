const { pool } = require('../config/db');

exports.listTransfers = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT ct.*, e.asset_tag, fp.name AS from_name, tp.name AS to_name, sl.room
      FROM custody_transfers ct
      JOIN evidence_items e ON ct.evidence_item_id = e.evidence_item_id
      JOIN personnel fp ON ct.from_personnel_id = fp.personnel_id
      JOIN personnel tp ON ct.to_personnel_id = tp.personnel_id
      LEFT JOIN storage_locations sl ON ct.storage_location_id = sl.storage_location_id
      ORDER BY ct.transfer_timestamp DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.createTransfer = async (req, res, next) => {
  try {
    const { evidence_item_id, from_personnel_id, to_personnel_id, transfer_timestamp, storage_location_id, transfer_type, notes } = req.body;
    const result = await pool.query(`
      INSERT INTO custody_transfers (evidence_item_id, from_personnel_id, to_personnel_id, transfer_timestamp, storage_location_id, transfer_type, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [evidence_item_id, from_personnel_id, to_personnel_id, transfer_timestamp, storage_location_id, transfer_type, notes]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
