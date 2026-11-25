const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

/**
 * GET /api/vessels
 * List active vessels with search & filtering by type, status, name, IMO, or operator.
 */
router.get('/', (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    const vessels = dataService.getAllVessels({ type, status, search });
    res.json({
      success: true,
      count: vessels.length,
      data: vessels,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/vessels/:imo
 * Retrieve detailed vessel telemetry and position by IMO or ID.
 */
router.get('/:imo', (req, res, next) => {
  try {
    const { imo } = req.params;
    const vessel = dataService.getVesselByImo(imo);
    if (!vessel) {
      return res.status(404).json({
        success: false,
        error: `Vessel with IMO or ID '${imo}' not found.`,
      });
    }
    res.json({
      success: true,
      data: vessel,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/vessels/match
 * Intelligently match and rank candidate vessels to an origin port and route.
 * Body: { vesselType: 'CONTAINER', originPortCode: 'CNSHA', maxDistanceNm: 2000 }
 */
router.post('/match', (req, res, next) => {
  try {
    const { vesselType, originPortCode, maxDistanceNm } = req.body;
    if (!originPortCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: originPortCode (e.g. "CNSHA", "port-sha").',
      });
    }

    const matches = dataService.matchVesselsToRoute({
      vesselType,
      originPortCode,
      maxDistanceNm: Number(maxDistanceNm) || 3000,
    });

    res.json({
      success: true,
      originPort: originPortCode,
      vesselType: vesselType || 'ALL',
      matchCount: matches.length,
      data: matches,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
