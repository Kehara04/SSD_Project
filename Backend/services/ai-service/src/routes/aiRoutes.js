const express = require('express');
const router = express.Router();
const { analyzeSymptoms } = require('../controllers/aiController');

// POST /api/ai/symptoms
router.post('/symptoms', analyzeSymptoms);

module.exports = router;
