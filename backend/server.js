require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');

const casesRoutes = require('./src/routes/cases');
const evidenceRoutes = require('./src/routes/evidence');
const custodyRoutes = require('./src/routes/custody');
const personnelRoutes = require('./src/routes/personnel');
const labRoutes = require('./src/routes/lab');
const disclosureRoutes = require('./src/routes/disclosure');
const analyticsRoutes = require('./src/routes/analytics');
const databaseRoutes = require('./src/routes/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:8080'], credentials: true }));
app.use(express.json());

app.use('/api/cases', casesRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/custody', custodyRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/disclosure', disclosureRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/database', databaseRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'custodycore-backend' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CustodyCore API running on http://localhost:${PORT}`);
});
