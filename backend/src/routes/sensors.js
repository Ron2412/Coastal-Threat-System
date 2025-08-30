const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { insertSensorData, getSensorData } = require('../services/supabase');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads (if needed for sensor calibration files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    if (file.mimetype === 'application/json' || 
        file.mimetype === 'text/csv' || 
        file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new ValidationError('Invalid file type. Only JSON, CSV, and binary files are allowed.'));
    }
  }
});

// Validation schemas
const sensorDataSchema = Joi.object({
  sensor_id: Joi.string().required().min(1).max(100),
  type: Joi.string().valid('water_level', 'wind', 'rainfall', 'temperature', 'humidity', 'pressure').required(),
  value: Joi.number().required(),
  unit: Joi.string().required().max(20),
  location: Joi.string().required().max(200),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).optional(),
  metadata: Joi.object({
    accuracy: Joi.number().min(0).max(100).optional(),
    battery_level: Joi.number().min(0).max(100).optional(),
    signal_strength: Joi.number().min(0).max(100).optional(),
    maintenance_due: Joi.boolean().optional(),
    last_calibration: Joi.date().iso().optional()
  }).optional(),
  timestamp: Joi.date().iso().default(() => new Date().toISOString())
});

const sensorDataBatchSchema = Joi.object({
  sensors: Joi.array().items(sensorDataSchema).min(1).max(100).required()
});

const sensorQuerySchema = Joi.object({
  sensor_id: Joi.string().optional(),
  type: Joi.string().valid('water_level', 'wind', 'rainfall', 'temperature', 'humidity', 'pressure').optional(),
  location: Joi.string().optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * @route POST /api/data/sensors
 * @desc Add new sensor data
 * @access Private (Citizens and Authorities)
 */
router.post('/', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const { error, value } = sensorDataSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid sensor data', error.details);
    }

    // Add user context to the sensor data
    const sensorData = {
      ...value,
      reported_by: req.user.uid,
      reported_at: new Date().toISOString()
    };

    // Insert sensor data
    const insertedData = await insertSensorData(sensorData);

    res.status(201).json({
      success: true,
      message: 'Sensor data added successfully',
      data: insertedData
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route POST /api/data/sensors/batch
 * @desc Add multiple sensor data points
 * @access Private (Authorities and Admins only)
 */
router.post('/batch', requireRole(['authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const { error, value } = sensorDataBatchSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid sensor data batch', error.details);
    }

    const { sensors } = value;
    const insertedData = [];

    // Insert each sensor data point
    for (const sensorData of sensors) {
      const dataWithContext = {
        ...sensorData,
        reported_by: req.user.uid,
        reported_at: new Date().toISOString()
      };

      const inserted = await insertSensorData(dataWithContext);
      insertedData.push(inserted);
    }

    res.status(201).json({
      success: true,
      message: `${insertedData.length} sensor data points added successfully`,
      data: insertedData
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/sensors
 * @desc Get sensor data with filters
 * @access Private (Citizens and Authorities)
 */
router.get('/', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = sensorQuerySchema.validate(req.query);
    if (error) {
      throw new ValidationError('Invalid query parameters', error.details);
    }

    // Get sensor data with filters
    const sensorData = await getSensorData(value);

    res.status(200).json({
      success: true,
      data: sensorData,
      pagination: {
        count: sensorData.length,
        limit: value.limit,
        offset: value.offset
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/sensors/:sensorId
 * @desc Get sensor data for specific sensor
 * @access Private (Citizens and Authorities)
 */
router.get('/:sensorId', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { limit = 100, start_time, end_time } = req.query;

    // Validate sensor ID
    if (!sensorId || sensorId.trim().length === 0) {
      throw new ValidationError('Sensor ID is required');
    }

    // Get sensor data for specific sensor
    const sensorData = await getSensorData({
      sensor_id: sensorId,
      limit: parseInt(limit),
      start_time,
      end_time
    });

    if (sensorData.length === 0) {
      throw new NotFoundError(`No data found for sensor ${sensorId}`);
    }

    res.status(200).json({
      success: true,
      data: sensorData,
      sensor: {
        id: sensorId,
        data_count: sensorData.length
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/sensors/type/:type
 * @desc Get sensor data by type
 * @access Private (Citizens and Authorities)
 */
router.get('/type/:type', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { type } = req.params;
    const { location, limit = 100, start_time, end_time } = req.query;

    // Validate sensor type
    const validTypes = ['water_level', 'wind', 'rainfall', 'temperature', 'humidity', 'pressure'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid sensor type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Get sensor data by type
    const sensorData = await getSensorData({
      type,
      location,
      limit: parseInt(limit),
      start_time,
      end_time
    });

    res.status(200).json({
      success: true,
      data: sensorData,
      type,
      count: sensorData.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/sensors/location/:location
 * @desc Get sensor data by location
 * @access Private (Citizens and Authorities)
 */
router.get('/location/:location', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { location } = req.params;
    const { type, limit = 100, start_time, end_time } = req.query;

    // Validate location
    if (!location || location.trim().length === 0) {
      throw new ValidationError('Location is required');
    }

    // Get sensor data by location
    const sensorData = await getSensorData({
      location: decodeURIComponent(location),
      type,
      limit: parseInt(limit),
      start_time,
      end_time
    });

    res.status(200).json({
      success: true,
      data: sensorData,
      location: decodeURIComponent(location),
      count: sensorData.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/sensors/latest/:type
 * @desc Get latest sensor data by type
 * @access Private (Citizens and Authorities)
 */
router.get('/latest/:type', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { type } = req.params;
    const { location } = req.query;

    // Validate sensor type
    const validTypes = ['water_level', 'wind', 'rainfall', 'temperature', 'humidity', 'pressure'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid sensor type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Get latest sensor data by type
    const sensorData = await getSensorData({
      type,
      location,
      limit: 1
    });

    if (sensorData.length === 0) {
      throw new NotFoundError(`No data found for sensor type ${type}`);
    }

    res.status(200).json({
      success: true,
      data: sensorData[0],
      type
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route POST /api/data/sensors/upload
 * @desc Upload sensor data file (CSV, JSON, etc.)
 * @access Private (Authorities and Admins only)
 */
router.post('/upload', requireRole(['authority', 'admin']), upload.single('file'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    // Parse file content based on type
    let sensorDataArray = [];
    const fileContent = req.file.buffer.toString();

    if (req.file.mimetype === 'application/json') {
      try {
        const jsonData = JSON.parse(fileContent);
        sensorDataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
      } catch (parseError) {
        throw new ValidationError('Invalid JSON file format');
      }
    } else if (req.file.mimetype === 'text/csv') {
      // Simple CSV parsing (you might want to use a proper CSV parser)
      const lines = fileContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        sensorDataArray.push(row);
      }
    }

    if (sensorDataArray.length === 0) {
      throw new ValidationError('No valid data found in file');
    }

    // Validate and insert each sensor data point
    const insertedData = [];
    for (const sensorData of sensorDataArray) {
      const { error, value } = sensorDataSchema.validate(sensorData);
      if (error) {
        logger.warn(`Skipping invalid sensor data: ${error.message}`);
        continue;
      }

      const dataWithContext = {
        ...value,
        reported_by: req.user.uid,
        reported_at: new Date().toISOString()
      };

      try {
        const inserted = await insertSensorData(dataWithContext);
        insertedData.push(inserted);
      } catch (insertError) {
        logger.warn(`Failed to insert sensor data: ${insertError.message}`);
      }
    }

    res.status(201).json({
      success: true,
      message: `File processed successfully. ${insertedData.length} data points inserted.`,
      data: {
        total_processed: sensorDataArray.length,
        successfully_inserted: insertedData.length,
        failed: sensorDataArray.length - insertedData.length
      }
    });

  } catch (error) {
    throw error;
  }
}));

module.exports = router;
