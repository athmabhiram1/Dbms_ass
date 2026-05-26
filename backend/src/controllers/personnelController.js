const { pool } = require('../config/db');

exports.listPersonnel = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM personnel ORDER BY role, name');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.listOfficers = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM personnel WHERE role = 'officer' AND is_active = true ORDER BY name");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.listProsecutors = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM personnel WHERE role = 'prosecutor' AND is_active = true ORDER BY name");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.listDefense = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM personnel WHERE role = 'defense_attorney' AND is_active = true ORDER BY name");
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

exports.createPersonnel = async (req, res, next) => {
  try {
    const { name, badge_number, department, unit, contact, role } = req.body;
    const result = await pool.query(
      `INSERT INTO personnel (name, badge_number, department, unit, contact, role)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, badge_number, department || null, unit || null, contact || null, role || 'officer']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.updatePersonnel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, badge_number, department, unit, contact, role, is_active } = req.body;
    const result = await pool.query(
      `UPDATE personnel SET name = COALESCE($1, name), badge_number = COALESCE($2, badge_number),
       department = COALESCE($3, department), unit = COALESCE($4, unit),
       contact = COALESCE($5, contact), role = COALESCE($6, role),
       is_active = COALESCE($7, is_active)
       WHERE personnel_id = $8 RETURNING *`,
      [name, badge_number, department, unit, contact, role, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Personnel not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.deactivatePersonnel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE personnel SET is_active = false WHERE personnel_id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Personnel not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};
