const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { calculateVoyageCost, calculateRouteComparison } = require('../utils/calculations');

/**
 * POST /api/analytics/voyage-cost
 * Calculate comprehensive voyage economics: fuel burn, charter hire, canal tolls, and emissions.
 */
router.post('/voyage-cost', (req, res, next) => {
  try {
    const {
      distanceNm,
      vesselType,
      speedKnots,
      dailyFuelBurnTons,
      fuelPricePerTon,
      dailyCharterRate,
      canalToll,
      portDues,
      cargoTeuOrTons,
    } = req.body;

    if (!distanceNm || Number(distanceNm) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid distanceNm (e.g., 8400 for SHA-RTM).',
      });
    }

    const calculation = calculateVoyageCost({
      distanceNm: Number(distanceNm),
      vesselType,
      speedKnots,
      dailyFuelBurnTons,
      fuelPricePerTon,
      dailyCharterRate,
      canalToll,
      portDues,
      cargoTeuOrTons,
    });

    res.json({
      success: true,
      data: calculation,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/analytics/route-compare
 * Direct side-by-side comparison between two maritime routing options (e.g., Suez Canal vs Cape Diversion).
 */
router.post('/route-compare', (req, res, next) => {
  try {
    const { routeA, routeB, vesselType, fuelPrice } = req.body;

    const defaultRouteA = routeA || {
      name: 'Shanghai to Rotterdam via Suez Canal',
      distanceNm: 8400,
      canalToll: 350000,
      portDues: 55000,
      riskLevel: 'ELEVATED',
    };

    const defaultRouteB = routeB || {
      name: 'Shanghai to Rotterdam via Cape of Good Hope',
      distanceNm: 11800,
      canalToll: 0,
      portDues: 55000,
      riskLevel: 'LOW',
    };

    const comparison = calculateRouteComparison(
      defaultRouteA,
      defaultRouteB,
      vesselType || 'CONTAINER',
      fuelPrice || 628
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/chokepoints
 * Global maritime chokepoints, daily transits, and risk statuses.
 */
router.get('/chokepoints', (req, res, next) => {
  try {
    const chokepoints = dataService.getChokepoints();
    res.json({
      success: true,
      count: chokepoints.length,
      data: chokepoints,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/analytics/incidents
 * Critical maritime casualties, sinkings, and casualty reports.
 */
router.get('/incidents', (req, res, next) => {
  try {
    const incidents = dataService.getIncidents();
    res.json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
