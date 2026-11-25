const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

/**
 * GET /api/market/assets
 * Returns all monitored financial assets, freight indices, commodities, and FX.
 */
router.get('/assets', (req, res, next) => {
  try {
    const assets = dataService.getAllAssets();
    res.json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/rates
 * Returns global freight lane spot rates with optional vessel type filter.
 */
router.get('/rates', (req, res, next) => {
  try {
    const { type } = req.query;
    const lanes = dataService.getFreightLanes(type);
    res.json({
      success: true,
      count: lanes.length,
      data: lanes,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/compare
 * Compare multiple freight lanes side by side.
 * Query: ?codes=FE-EUR-01,FE-EUR-CAPE,TP-WC-01
 */
router.get('/compare', (req, res, next) => {
  try {
    const codes = req.query.codes ? req.query.codes.split(',').map((c) => c.trim()) : [];
    const comparison = dataService.compareFreightRates(codes);
    res.json({
      success: true,
      data: comparison,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/market/trends/:code
 * Returns 30-day statistics, moving averages, and volatility for a lane.
 */
router.get('/trends/:code', (req, res, next) => {
  try {
    const { code } = req.params;
    const trends = dataService.getLaneTrends(code);
    if (!trends) {
      return res.status(404).json({
        success: false,
        error: `Freight lane with code '${code}' not found.`,
      });
    }
    res.json({
      success: true,
      data: trends,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/market/orders
 * Submit an order ticket to the terminal order blotter.
 */
router.post('/orders', (req, res, next) => {
  try {
    const { ticker, side, price, quantity, type } = req.body;
    if (!ticker || !side || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required order parameters: ticker, side, price.',
      });
    }
    const order = dataService.createOrder({ ticker, side, price, quantity, type });
    res.status(201).json({
      success: true,
      message: 'Order executed successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
