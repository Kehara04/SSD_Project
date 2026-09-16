const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const aiRoutes = require('./routes/aiRoutes');

const app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'ai-service' });
});

app.use('/api/ai', aiRoutes);

module.exports = app;
