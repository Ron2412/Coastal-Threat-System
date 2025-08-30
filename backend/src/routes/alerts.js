const express = require('express');
const Joi = require('joi');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { insertAlert, getActiveAlerts } = require('../services/supabase');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const alertSchema = Joi.object({
  type: Joi.string().valid('flooding', 'erosion', 'storm_damage', 'water_quality', 'anomaly', 'other').required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  description: Joi.string().required().min(10).max(500),
  location: Joi.string().required().max(200),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).optional(),
  source: Joi.string().valid('sensor', 'citizen', 'ai', 'authority').required(),
  source_id: Joi.string().max(100).optional(),
  expires_at: Joi.date().iso().optional()
});

const alertUpdateSchema = Joi.object({
  status: Joi.string().valid('active', 'acknowledged', 'resolved', 'expired').optional(),
  description: Joi.string().min(10).max(500).optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
});

const alertQuerySchema = Joi.object({
  type: Joi.string().valid('flooding', 'erosion', 'storm_damage', 'water_quality', 'anomaly', 'other').optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  status: Joi.string().valid('active', 'acknowledged', 'resolved', 'expired').optional(),
  source: Joi.string().valid('sensor', 'citizen', 'ai', 'authority').optional(),
  location: Joi.string().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * @route POST /api/alerts
 * @desc Create new alert
 * @access Private (Authorities and Admins)
 */
router.post('/', requireRole(['authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const { error, value } = alertSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid alert data', error.details);
    }

    // Create alert object
    const alert = {
      ...value,
      created_by: req.user.uid,
      coordinates: value.coordinates || null,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // Insert alert
    const insertedAlert = await insertAlert(alert);

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: insertedAlert
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/alerts
 * @desc Get alerts with filters
 * @access Private (Citizens and Authorities)
 */
router.get('/', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = alertQuerySchema.validate(req.query);
    if (error) {
      throw new ValidationError('Invalid query parameters', error.details);
    }

    // Get alerts
    const alerts = await getActiveAlerts(value);

    res.status(200).json({
      success: true,
      data: alerts,
      pagination: {
        count: alerts.length,
        limit: value.limit,
        offset: value.offset
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/alerts/active
 * @desc Get active alerts only
 * @access Private (Citizens and Authorities)
 */
router.get('/active', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { type, severity, location, limit = 100 } = req.query;

    // Get active alerts
    const alerts = await getActiveAlerts({
      status: 'active',
      type,
      severity,
      location,
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: alerts,
      count: alerts.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/alerts/type/:type
 * @desc Get alerts by type
 * @access Private (Citizens and Authorities)
 */
router.get('/type/:type', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { type } = req.params;
    const { severity, location, limit = 100 } = req.query;

    // Validate alert type
    const validTypes = ['flooding', 'erosion', 'storm_damage', 'water_quality', 'anomaly', 'other'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid alert type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Get alerts by type
    const alerts = await getActiveAlerts({
      type,
      severity,
      location,
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: alerts,
      type,
      count: alerts.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/alerts/severity/:severity
 * @desc Get alerts by severity
 * @access Private (Citizens and Authorities)
 */
router.get('/severity/:severity', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { severity } = req.params;
    const { type, location, limit = 100 } = req.query;

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      throw new ValidationError(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`);
    }

    // Get alerts by severity
    const alerts = await getActiveAlerts({
      severity,
      type,
      location,
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: alerts,
      severity,
      count: alerts.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/alerts/location/:location
 * @desc Get alerts by location
 * @access Private (Citizens and Authorities)
 */
router.get('/location/:location', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { location } = req.params;
    const { type, severity, limit = 100 } = req.query;

    // Validate location
    if (!location || location.trim().length === 0) {
      throw new ValidationError('Location is required');
    }

    // Get alerts by location
    const alerts = await getActiveAlerts({
      location: decodeURIComponent(location),
      type,
      severity,
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: alerts,
      location: decodeURIComponent(location),
      count: alerts.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route POST /api/alerts/:alertId/acknowledge
 * @desc Acknowledge an alert (Authorities only)
 * @access Private (Authorities and Admins)
 */
router.post('/:alertId/acknowledge', requireRole(['authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { alertId } = req.params;
    const { acknowledgment_notes } = req.body;

    // Validate alert ID
    if (!alertId || alertId.trim().length === 0) {
      throw new ValidationError('Alert ID is required');
    }

    // Get current alert
    const alerts = await getActiveAlerts({ id: alertId, limit: 1 });

    if (alerts.length === 0) {
      throw new NotFoundError(`Alert ${alertId} not found`);
    }

    const currentAlert = alerts[0];

    // Update alert status
    const updatedAlert = {
      ...currentAlert,
      status: 'acknowledged',
      acknowledged_by: req.user.uid,
      acknowledged_at: new Date().toISOString(),
      acknowledgment_notes: acknowledgment_notes || null,
      updated_at: new Date().toISOString()
    };

    // In a real implementation, you would update the database
    res.status(200).json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: updatedAlert
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route POST /api/alerts/:alertId/resolve
 * @desc Resolve an alert (Authorities only)
 * @access Private (Authorities and Admins)
 */
router.post('/:alertId/resolve', requireRole(['authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution_notes, action_taken } = req.body;

    // Validate alert ID
    if (!alertId || alertId.trim().length === 0) {
      throw new ValidationError('Alert ID is required');
    }

    // Get current alert
    const alerts = await getActiveAlerts({ id: alertId, limit: 1 });

    if (alerts.length === 0) {
      throw new NotFoundError(`Alert ${alertId} not found`);
    }

    const currentAlert = alerts[0];

    // Update alert status
    const updatedAlert = {
      ...currentAlert,
      status: 'resolved',
      resolved_by: req.user.uid,
      resolved_at: new Date().toISOString(),
      resolution_notes: resolution_notes || null,
      action_taken: action_taken || null,
      updated_at: new Date().toISOString()
    };

    // In a real implementation, you would update the database
    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
      data: updatedAlert
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/alerts/summary
 * @desc Get alert summary statistics
 * @access Private (Citizens and Authorities)
 */
router.get('/summary', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { location } = req.query;

    // Get all active alerts for summary
    const alerts = await getActiveAlerts({
      status: 'active',
      location,
      limit: 1000
    });

    // Calculate summary statistics
    const summary = {
      total_alerts: alerts.length,
      by_type: {},
      by_severity: {},
      by_location: {},
      recent_alerts: alerts.slice(0, 5) // Last 5 alerts
    };

    // Count by type
    alerts.forEach(alert => {
      summary.by_type[alert.type] = (summary.by_type[alert.type] || 0) + 1;
      summary.by_severity[alert.severity] = (summary.by_severity[alert.severity] || 0) + 1;
      summary.by_location[alert.location] = (summary.by_location[alert.location] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    throw error;
  }
}));

module.exports = router;
