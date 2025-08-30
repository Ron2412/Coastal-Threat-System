const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const { insertCitizenReport, getCitizenReports } = require('../services/supabase');
const { requireRole, requireCitizen } = require('../middleware/auth');

const router = express.Router();

// Configure multer for media uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow image and video files
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new ValidationError('Invalid file type. Only images, videos, and PDFs are allowed.'));
    }
  }
});

// Validation schemas
const reportSchema = Joi.object({
  type: Joi.string().valid('flooding', 'erosion', 'storm_damage', 'water_quality', 'other').required(),
  description: Joi.string().required().min(10).max(1000),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  location: Joi.string().required().max(200),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).optional(),
  media_urls: Joi.array().items(Joi.string().uri()).max(10).optional()
});

const reportUpdateSchema = Joi.object({
  description: Joi.string().min(10).max(1000).optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  status: Joi.string().valid('pending', 'verified', 'investigating', 'resolved', 'false_alarm').optional()
});

const reportQuerySchema = Joi.object({
  citizen_id: Joi.string().optional(),
  type: Joi.string().valid('flooding', 'erosion', 'storm_damage', 'water_quality', 'other').optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  status: Joi.string().valid('pending', 'verified', 'investigating', 'resolved', 'false_alarm').optional(),
  location: Joi.string().optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0)
});

/**
 * @route POST /api/data/reports
 * @desc Create new citizen report
 * @access Private (Citizens and Authorities)
 */
router.post('/', requireCitizen, upload.array('media', 10), asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const { error, value } = reportSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid report data', error.details);
    }

    // Process uploaded media files
    let mediaUrls = value.media_urls || [];
    if (req.files && req.files.length > 0) {
      // In a real implementation, you would upload these to cloud storage
      // For now, we'll just store the file information
      mediaUrls = req.files.map(file => ({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        // In production, this would be a cloud storage URL
        url: `mock://uploads/${file.originalname}`
      }));
    }

    // Create report object
    const report = {
      ...value,
      citizen_id: req.user.uid,
      media_urls: mediaUrls,
      coordinates: value.coordinates || null,
      timestamp: new Date().toISOString()
    };

    // Insert report
    const insertedReport = await insertCitizenReport(report);

    res.status(201).json({
      success: true,
      message: 'Citizen report created successfully',
      data: insertedReport
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/reports
 * @desc Get citizen reports with filters
 * @access Private (Citizens and Authorities)
 */
router.get('/', requireCitizen, asyncHandler(async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = reportQuerySchema.validate(req.query);
    if (error) {
      throw new ValidationError('Invalid query parameters', error.details);
    }

    // Add user-specific filters for citizens
    if (req.user.role === 'citizen') {
      value.citizen_id = req.user.uid;
    }

    // Get reports
    const reports = await getCitizenReports(value);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        count: reports.length,
        limit: value.limit,
        offset: value.offset
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/reports/:reportId
 * @desc Get specific citizen report
 * @access Private (Citizens and Authorities)
 */
router.get('/:reportId', requireCitizen, asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;

    // Validate report ID
    if (!reportId || reportId.trim().length === 0) {
      throw new ValidationError('Report ID is required');
    }

    // Get report
    const reports = await getCitizenReports({ id: reportId, limit: 1 });

    if (reports.length === 0) {
      throw new NotFoundError(`Report ${reportId} not found`);
    }

    const report = reports[0];

    // Check if user can access this report
    if (req.user.role === 'citizen' && report.citizen_id !== req.user.uid) {
      throw new ValidationError('You can only view your own reports');
    }

    res.status(200).json({
      success: true,
      data: report
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route PUT /api/data/reports/:reportId
 * @desc Update citizen report
 * @access Private (Citizens and Authorities)
 */
router.put('/:reportId', requireCitizen, asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;

    // Validate report ID
    if (!reportId || reportId.trim().length === 0) {
      throw new ValidationError('Report ID is required');
    }

    // Validate request body
    const { error, value } = reportUpdateSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid update data', error.details);
    }

    // Get current report
    const reports = await getCitizenReports({ id: reportId, limit: 1 });

    if (reports.length === 0) {
      throw new NotFoundError(`Report ${reportId} not found`);
    }

    const currentReport = reports[0];

    // Check if user can update this report
    if (req.user.role === 'citizen' && currentReport.citizen_id !== req.user.uid) {
      throw new ValidationError('You can only update your own reports');
    }

    // Only citizens can update certain fields
    if (req.user.role === 'citizen') {
      delete value.status; // Citizens cannot change status
    }

    // Update report
    const updatedReport = {
      ...currentReport,
      ...value,
      updated_at: new Date().toISOString()
    };

    // In a real implementation, you would update the database
    // For now, we'll return the updated report
    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: updatedReport
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/reports/type/:type
 * @desc Get reports by type
 * @access Private (Citizens and Authorities)
 */
router.get('/type/:type', requireCitizen, asyncHandler(async (req, res) => {
  try {
    const { type } = req.params;
    const { location, limit = 100, start_time, end_time } = req.query;

    // Validate report type
    const validTypes = ['flooding', 'erosion', 'storm_damage', 'water_quality', 'other'];
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid report type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Get reports by type
    const reports = await getCitizenReports({
      type,
      location,
      limit: parseInt(limit),
      start_time,
      end_time
    });

    res.status(200).json({
      success: true,
      data: reports,
      type,
      count: reports.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/reports/severity/:severity
 * @desc Get reports by severity
 * @access Private (Citizens and Authorities)
 */
router.get('/severity/:severity', requireCitizen, asyncHandler(async (req, res) => {
  try {
    const { severity } = req.params;
    const { type, location, limit = 100, start_time, end_time } = req.query;

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      throw new ValidationError(`Invalid severity. Must be one of: ${validSeverities.join(', ')}`);
    }

    // Get reports by severity
    const reports = await getCitizenReports({
      severity,
      type,
      location,
      limit: parseInt(limit),
      start_time,
      end_time
    });

    res.status(200).json({
      success: true,
      data: reports,
      severity,
      count: reports.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/reports/location/:location
 * @desc Get reports by location
 * @access Private (Citizens and Authorities)
 */
router.get('/location/:location', requireCitizen, asyncHandler(async (req, res) => {
  try {
    const { location } = req.params;
    const { type, severity, limit = 100, start_time, end_time } = req.query;

    // Validate location
    if (!location || location.trim().length === 0) {
      throw new ValidationError('Location is required');
    }

    // Get reports by location
    const reports = await getCitizenReports({
      location: decodeURIComponent(location),
      type,
      severity,
      limit: parseInt(limit),
      start_time,
      end_time
    });

    res.status(200).json({
      success: true,
      data: reports,
      location: decodeURIComponent(location),
      count: reports.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/data/reports/status/:status
 * @desc Get reports by status
 * @access Private (Citizens and Authorities)
 */
router.get('/status/:status', requireCitizen, asyncHandler(async (req, res) => {
  try {
    const { status } = req.params;
    const { type, severity, location, limit = 100, start_time, end_time } = req.query;

    // Validate status
    const validStatuses = ['pending', 'verified', 'investigating', 'resolved', 'false_alarm'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Get reports by status
    const reports = await getCitizenReports({
      status,
      type,
      severity,
      location,
      limit: parseInt(limit),
      start_time,
      end_time
    });

    res.status(200).json({
      success: true,
      data: reports,
      status,
      count: reports.length
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route POST /api/data/reports/:reportId/verify
 * @desc Verify a citizen report (Authorities only)
 * @access Private (Authorities and Admins)
 */
router.post('/:reportId/verify', requireRole(['authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;
    const { verification_notes, status } = req.body;

    // Validate report ID
    if (!reportId || reportId.trim().length === 0) {
      throw new ValidationError('Report ID is required');
    }

    // Get current report
    const reports = await getCitizenReports({ id: reportId, limit: 1 });

    if (reports.length === 0) {
      throw new NotFoundError(`Report ${reportId} not found`);
    }

    const currentReport = reports[0];

    // Update report status
    const updatedReport = {
      ...currentReport,
      status: status || 'verified',
      verified_by: req.user.uid,
      verified_at: new Date().toISOString(),
      verification_notes: verification_notes || null,
      updated_at: new Date().toISOString()
    };

    // In a real implementation, you would update the database
    res.status(200).json({
      success: true,
      message: 'Report verified successfully',
      data: updatedReport
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route POST /api/data/reports/:reportId/resolve
 * @desc Resolve a citizen report (Authorities only)
 * @access Private (Authorities and Admins)
 */
router.post('/:reportId/resolve', requireRole(['authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { reportId } = req.params;
    const { resolution_notes, action_taken } = req.body;

    // Validate report ID
    if (!reportId || reportId.trim().length === 0) {
      throw new ValidationError('Report ID is required');
    }

    // Get current report
    const reports = await getCitizenReports({ id: reportId, limit: 1 });

    if (reports.length === 0) {
      throw new NotFoundError(`Report ${reportId} not found`);
    }

    const currentReport = reports[0];

    // Update report status
    const updatedReport = {
      ...currentReport,
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
      message: 'Report resolved successfully',
      data: updatedReport
    });

  } catch (error) {
    throw error;
  }
}));

module.exports = router;
