const express = require('express');
const Joi = require('joi');
const axios = require('axios');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { insertPrediction, getPredictions } = require('../services/supabase');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// ML service configuration
const ML_SERVICE_URL = process.env.FLASK_ML_SERVICE_URL || 'http://localhost:5000';

// Validation schemas
const predictionQuerySchema = Joi.object({
  type: Joi.string().valid('flooding', 'erosion', 'storm_damage', 'water_level', 'wind', 'rainfall').optional(),
  location: Joi.string().optional(),
  confidence_min: Joi.number().min(0).max(100).optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0)
});

const waterLevelPredictionSchema = Joi.object({
  hours_ahead: Joi.number().integer().min(1).max(168).default(24) // Max 1 week
});

const anomalyDetectionSchema = Joi.object({
  sensor_data: Joi.array().items(Joi.object({
    timestamp: Joi.string().required(),
    type: Joi.string().required(),
    value: Joi.number().required(),
    location: Joi.string().optional()
  })).min(1).required()
});

/**
 * @route GET /api/predictions
 * @desc Get AI predictions with filters
 * @access Private (Citizens and Authorities)
 */
router.get('/', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = predictionQuerySchema.validate(req.query);
    if (error) {
      throw new ValidationError('Invalid query parameters', error.details);
    }

    // Get predictions from database
    const predictions = await getPredictions(value);

    res.status(200).json({
      success: true,
      data: predictions,
      pagination: {
        count: predictions.length,
        limit: value.limit,
        offset: value.offset
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route POST /api/predictions/water-levels
 * @desc Get water level predictions from ML service
 * @access Private (Citizens and Authorities)
 */
router.post('/water-levels', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const { error, value } = waterLevelPredictionSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid prediction request', error.details);
    }

    // Call ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict/water-levels`, {
      hours_ahead: value.hours_ahead
    });

    if (mlResponse.status !== 200) {
      throw new Error('ML service returned error');
    }

    const predictionData = mlResponse.data.data;

    // Store prediction in database
    const prediction = {
      type: 'water_level',
      location: 'Miami Coastal Area', // Default location
      predicted_value: predictionData.flood_risk.max_predicted_level,
      confidence: predictionData.flood_risk.confidence,
      predicted_time: new Date(Date.now() + value.hours_ahead * 60 * 60 * 1000).toISOString(),
      risk_level: predictionData.flood_risk.risk_level,
      factors: {
        water_levels: predictionData.predictions,
        flood_risk: predictionData.flood_risk
      },
      recommendations: [
        'Monitor water levels closely',
        'Prepare emergency supplies if risk is high',
        'Follow local authority guidance'
      ],
      model_version: '1.0.0'
    };

    const insertedPrediction = await insertPrediction(prediction);

    res.status(200).json({
      success: true,
      data: {
        prediction: insertedPrediction,
        ml_service_response: predictionData
      }
    });

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('ML service is not available. Please try again later.');
    }
    throw error;
  }
}));

/**
 * @route POST /api/predictions/anomalies
 * @desc Detect anomalies in sensor data using ML service
 * @access Private (Citizens and Authorities)
 */
router.post('/anomalies', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const { error, value } = anomalyDetectionSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid sensor data', error.details);
    }

    // Call ML service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/detect/anomalies`, {
      sensor_data: value.sensor_data
    });

    if (mlResponse.status !== 200) {
      throw new Error('ML service returned error');
    }

    const anomalyData = mlResponse.data.data;

    res.status(200).json({
      success: true,
      data: anomalyData
    });

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('ML service is not available. Please try again later.');
    }
    throw error;
  }
}));

/**
 * @route POST /api/predictions/flood-risk
 * @desc Get comprehensive flood risk assessment
 * @access Private (Citizens and Authorities)
 */
router.post('/flood-risk', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { current_data, location } = req.body;

    // Call ML service for flood risk assessment
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict/flood-risk`, {
      current_data: current_data || {},
      location: location || 'Miami Coastal Area'
    });

    if (mlResponse.status !== 200) {
      throw new Error('ML service returned error');
    }

    const floodRiskData = mlResponse.data.data;

    // Store prediction in database
    const prediction = {
      type: 'flooding',
      location: location || 'Miami Coastal Area',
      predicted_value: null, // Not applicable for risk assessment
      confidence: floodRiskData.overall_risk.confidence,
      predicted_time: new Date().toISOString(),
      risk_level: floodRiskData.overall_risk.level,
      factors: {
        water_level_risk: floodRiskData.water_level_risk,
        additional_factors: floodRiskData.additional_factors,
        overall_risk: floodRiskData.overall_risk
      },
      recommendations: floodRiskData.recommendations,
      model_version: '1.0.0'
    };

    const insertedPrediction = await insertPrediction(prediction);

    res.status(200).json({
      success: true,
      data: {
        prediction: insertedPrediction,
        flood_risk_assessment: floodRiskData
      }
    });

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('ML service is not available. Please try again later.');
    }
    throw error;
  }
}));

/**
 * @route GET /api/predictions/type/:type
 * @desc Get predictions by type
 * @access Private (Citizens and Authorities)
 */
router.get('/type/:type', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { type } = req.params;
    const { location, limit = 100 } = req.query;

    // Validate prediction type
    const validTypes = ['flooding', 'erosion', 'storm_damage', 'water_level', 'wind', 'rainfall'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid prediction type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Get predictions by type
    const predictions = await getPredictions({
      type,
      location,
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: predictions,
      type,
      count: predictions.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/predictions/location/:location
 * @desc Get predictions by location
 * @access Private (Citizens and Authorities)
 */
router.get('/location/:location', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { location } = req.params;
    const { type, limit = 100 } = req.query;

    // Validate location
    if (!location || location.trim().length === 0) {
      throw new ValidationError('Location is required');
    }

    // Get predictions by location
    const predictions = await getPredictions({
      location: decodeURIComponent(location),
      type,
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: predictions,
      location: decodeURIComponent(location),
      count: predictions.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/predictions/latest
 * @desc Get latest predictions
 * @access Private (Citizens and Authorities)
 */
router.get('/latest', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { type, location, limit = 10 } = req.query;

    // Get latest predictions
    const predictions = await getPredictions({
      type,
      location,
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: predictions,
      count: predictions.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/predictions/ml-status
 * @desc Get ML service status
 * @access Private (Citizens and Authorities)
 */
router.get('/ml-status', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Check ML service health
    const healthResponse = await axios.get(`${ML_SERVICE_URL}/health`);
    
    res.status(200).json({
      success: true,
      data: {
        ml_service_status: 'healthy',
        ml_service_response: healthResponse.data,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(200).json({
      success: true,
      data: {
        ml_service_status: 'unavailable',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}));

module.exports = router;
