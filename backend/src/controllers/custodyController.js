const { pool } = require('../config/db');

function mapTransferTypeToStatus(transferType) {
  switch (transferType) {
    case 'collection': return 'collected';
    case 'transport': return 'in_transit';
    case 'lab_submission': return 'at_lab';
    case 'lab_return': return 'in_storage';
    case 'court_delivery': return 'in_court';
    case 'disposal': return 'disposed';
    case 'defense_viewing': return 'in_storage';
    default: return 'in_storage';
  }
}

exports.listTransfers = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT ct.*, e.asset_tag, fp.name AS from_name, tp.name AS to_name, sl.room
      FROM custody_transfers ct
      JOIN evidence_items e ON ct.evidence_item_id = e.evidence_item_id
      LEFT JOIN personnel fp ON ct.from_personnel_id = fp.personnel_id
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
  const client = await pool.connect();
  try {
    const { evidence_item_id, from_personnel_id, to_personnel_id, transfer_timestamp, storage_location_id, transfer_type, notes } = req.body;
    
    await client.query('BEGIN');
    
    // 1. Insert custody transfer record
    const result = await client.query(`
      INSERT INTO custody_transfers (evidence_item_id, from_personnel_id, to_personnel_id, transfer_timestamp, storage_location_id, transfer_type, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [evidence_item_id, from_personnel_id, to_personnel_id, transfer_timestamp, storage_location_id, transfer_type, notes]);

    // 2. Automatically sync the evidence_items current_status
    const targetStatus = mapTransferTypeToStatus(transfer_type);
    await client.query(`
      UPDATE evidence_items
      SET current_status = $1
      WHERE evidence_item_id = $2
    `, [targetStatus, evidence_item_id]);

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

