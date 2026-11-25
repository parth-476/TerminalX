const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

/**
 * GET /api/ports
 * List all ports with optional filtering by country or congestion status.
 */
router.get('/', (req, res, next) => {
  try {
    const { country, status } = req.query;
    const ports = dataService.getAllPorts({ country, status });
    res.json({
      success: true,
      count: ports.length,
      data: ports,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ports/congestion
 * Get ranked port congestion indicators and bottleneck warnings.
 */
router.get('/congestion', (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const congested = dataService.getTopCongestedPorts(limit);
    res.json({
      success: true,
      count: congested.length,
      data: congested,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/ports/:id
 * Retrieve details for a specific port by code or ID.
 */
router.get('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const port = dataService.getPortById(id);
    if (!port) {
      return res.status(404).json({
        success: false,
        error: `Port with identifier '${id}' not found.`,
      });
    }
    res.json({
      success: true,
      data: port,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
