const { Router } = require('express');
const ctrl = require('../controllers/analyticsController');
const { pool } = require('../config/db');

const router = Router();

router.get('/backlog', ctrl.backlog);
router.get('/lab-turnaround', ctrl.labTurnaround);
router.get('/storage', ctrl.storageUtilization);
router.get('/prosecutor-workload', ctrl.prosecutorWorkload);

router.get('/ai/summaries', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.case_number, c.title AS case_title
      FROM ai_summaries s
      JOIN cases c ON s.case_id = c.case_id
      ORDER BY s.generated_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/ai/summarise/:caseId', async (req, res, next) => {
  try {
    const { caseId } = req.params;
    const { provider } = req.body;
    let finalCaseId = parseInt(caseId, 10);
    
    // If it's not a pure number, maybe it's a case_number string
    if (isNaN(finalCaseId) || !/^\d+$/.test(caseId.toString().trim())) {
      const caseRes = await pool.query('SELECT case_id FROM cases WHERE case_number = $1', [caseId.toString().trim()]);
      if (caseRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Case not found for the given case number' });
      }
      finalCaseId = caseRes.rows[0].case_id;
    }

    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const payload = { case_id: finalCaseId };
    if (provider) payload.provider = provider;
    const response = await fetch(`${aiUrl}/summarise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ success: false, error: errBody });
    }
    const data = await response.json();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
