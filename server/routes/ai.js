const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

/**
 * POST /api/ai/chat
 * Query the AI Maritime Analyst Copilot.
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { prompt, history } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a non-empty prompt.',
      });
    }

    const result = await aiService.generateInsight(prompt.trim(), history || []);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/ai/analyze-route
 * Generate targeted AI insight for a specific shipping lane or route.
 */
router.post('/analyze-route', async (req, res, next) => {
  try {
    const { origin, destination, vesselType, distanceNm } = req.body;
    const prompt = `Analyze shipping route from ${origin || 'Shanghai'} to ${destination || 'Rotterdam'} for a ${vesselType || 'Container'} vessel (estimated ${distanceNm || 8400} nm). Explain route risks, canal alternatives (Suez vs Cape of Good Hope), and bunker fuel considerations.`;

    const result = await aiService.generateInsight(prompt);
    res.json({
      success: true,
      route: { origin, destination, vesselType, distanceNm },
      insight: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
