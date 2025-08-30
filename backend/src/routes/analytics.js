const express = require('express');
const Joi = require('joi');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { getSensorData, getCitizenReports, getActiveAlerts, getPredictions } = require('../services/supabase');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const analyticsQuerySchema = Joi.object({
  location: Joi.string().optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().optional(),
  sensor_types: Joi.array().items(Joi.string()).optional(),
  threat_types: Joi.array().items(Joi.string()).optional()
});

const timeRangeSchema = Joi.object({
  start_time: Joi.date().iso().required(),
  end_time: Joi.date().iso().required()
});

/**
 * @route GET /api/analytics/overview
 * @desc Get overview analytics for coastal threats
 * @access Private (Citizens and Authorities)
 */
router.get('/overview', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = analyticsQuerySchema.validate(req.query);
    if (error) {
      throw new ValidationError('Invalid query parameters', error.details);
    }

    const { location, start_time, end_time } = value;

    // Get data for analytics
    const [sensorData, reports, alerts, predictions] = await Promise.all([
      getSensorData({ location, start_time, end_time, limit: 1000 }),
      getCitizenReports({ location, start_time, end_time, limit: 1000 }),
      getActiveAlerts({ location, limit: 1000 }),
      getPredictions({ location, limit: 1000 })
    ]);

    // Calculate overview statistics
    const overview = {
      total_sensor_readings: sensorData.length,
      total_citizen_reports: reports.length,
      active_alerts: alerts.length,
      total_predictions: predictions.length,
      data_timeline: {
        start: start_time || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: end_time || new Date().toISOString()
      }
    };

    // Sensor data breakdown
    const sensorBreakdown = {};
    sensorData.forEach(reading => {
      const type = reading.type;
      if (!sensorBreakdown[type]) {
        sensorBreakdown[type] = { count: 0, locations: new Set() };
      }
      sensorBreakdown[type].count++;
      sensorBreakdown[type].locations.add(reading.location);
    });

    // Convert Sets to arrays
    Object.keys(sensorBreakdown).forEach(type => {
      sensorBreakdown[type].locations = Array.from(sensorBreakdown[type].locations);
    });

    overview.sensor_breakdown = sensorBreakdown;

    // Citizen reports breakdown
    const reportBreakdown = {};
    reports.forEach(report => {
      const type = report.type;
      if (!reportBreakdown[type]) {
        reportBreakdown[type] = { count: 0, severity_distribution: {} };
      }
      reportBreakdown[type].count++;
      reportBreakdown[type].severity_distribution[report.severity] = 
        (reportBreakdown[type].severity_distribution[report.severity] || 0) + 1;
    });

    overview.report_breakdown = reportBreakdown;

    // Alert breakdown
    const alertBreakdown = {};
    alerts.forEach(alert => {
      const type = alert.type;
      if (!alertBreakdown[type]) {
        alertBreakdown[type] = { count: 0, severity_distribution: {} };
      }
      alertBreakdown[type].count++;
      alertBreakdown[type].severity_distribution[alert.severity] = 
        (alertBreakdown[type].severity_distribution[alert.severity] || 0) + 1;
    });

    overview.alert_breakdown = alertBreakdown;

    res.status(200).json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/analytics/threat-trends
 * @desc Get threat trends over time
 * @access Private (Citizens and Authorities)
 */
router.get('/threat-trends', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate query parameters
    const { error, value } = timeRangeSchema.validate(req.query);
    if (error) {
      throw new ValidationError('Invalid time range parameters', error.details);
    }

    const { start_time, end_time } = value;

    // Get data for trend analysis
    const [sensorData, reports, alerts] = await Promise.all([
      getSensorData({ start_time, end_time, limit: 10000 }),
      getCitizenReports({ start_time, end_time, limit: 10000 }),
      getActiveAlerts({ limit: 10000 })
    ]);

    // Group data by time periods (hourly for last 24 hours, daily for longer periods)
    const timeDiff = new Date(end_time) - new Date(start_time);
    const isLast24Hours = timeDiff <= 24 * 60 * 60 * 1000;
    const timeFormat = isLast24Hours ? 'hour' : 'day';

    const trends = {
      time_period: {
        start: start_time,
        end: end_time,
        format: timeFormat
      },
      sensor_trends: {},
      report_trends: {},
      alert_trends: {}
    };

    // Process sensor data trends
    const sensorByTime = {};
    sensorData.forEach(reading => {
      const timestamp = new Date(reading.timestamp);
      const timeKey = isLast24Hours ? 
        timestamp.toISOString().slice(0, 13) + ':00:00.000Z' : // Hour
        timestamp.toISOString().slice(0, 10); // Day

      if (!sensorByTime[timeKey]) {
        sensorByTime[timeKey] = {};
      }

      const type = reading.type;
      if (!sensorByTime[timeKey][type]) {
        sensorByTime[timeKey][type] = { count: 0, values: [] };
      }

      sensorByTime[timeKey][type].count++;
      sensorByTime[timeKey][type].values.push(reading.value);
    });

    // Calculate averages and convert to array
    Object.keys(sensorByTime).forEach(timeKey => {
      Object.keys(sensorByTime[timeKey]).forEach(type => {
        const data = sensorByTime[timeKey][type];
        const avgValue = data.values.reduce((sum, val) => sum + val, 0) / data.values.length;
        
        if (!trends.sensor_trends[type]) {
          trends.sensor_trends[type] = [];
        }

        trends.sensor_trends[type].push({
          timestamp: timeKey,
          count: data.count,
          average_value: Math.round(avgValue * 1000) / 1000
        });
      });
    });

    // Process citizen report trends
    const reportsByTime = {};
    reports.forEach(report => {
      const timestamp = new Date(report.timestamp);
      const timeKey = isLast24Hours ? 
        timestamp.toISOString().slice(0, 13) + ':00:00.000Z' : // Hour
        timestamp.toISOString().slice(0, 10); // Day

      if (!reportsByTime[timeKey]) {
        reportsByTime[timeKey] = { count: 0, by_type: {}, by_severity: {} };
      }

      reportsByTime[timeKey].count++;
      
      // Count by type
      const type = report.type;
      reportsByTime[timeKey].by_type[type] = (reportsByTime[timeKey].by_type[type] || 0) + 1;
      
      // Count by severity
      const severity = report.severity;
      reportsByTime[timeKey].by_severity[severity] = (reportsByTime[timeKey].by_severity[severity] || 0) + 1;
    });

    // Convert to array format
    Object.keys(reportsByTime).forEach(timeKey => {
      trends.report_trends[timeKey] = reportsByTime[timeKey];
    });

    // Process alert trends
    const alertsByTime = {};
    alerts.forEach(alert => {
      const timestamp = new Date(alert.created_at);
      const timeKey = isLast24Hours ? 
        timestamp.toISOString().slice(0, 13) + ':00:00.000Z' : // Hour
        timestamp.toISOString().slice(0, 10); // Day

      if (!alertsByTime[timeKey]) {
        alertsByTime[timeKey] = { count: 0, by_type: {}, by_severity: {} };
      }

      alertsByTime[timeKey].count++;
      
      // Count by type
      const type = alert.type;
      alertsByTime[timeKey].by_type[type] = (alertsByTime[timeKey].by_type[type] || 0) + 1;
      
      // Count by severity
      const severity = alert.severity;
      alertsByTime[timeKey].by_severity[severity] = (alertsByTime[timeKey].by_severity[severity] || 0) + 1;
    });

    // Convert to array format
    Object.keys(alertsByTime).forEach(timeKey => {
      trends.alert_trends[timeKey] = alertsByTime[timeKey];
    });

    res.status(200).json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/analytics/risk-assessment
 * @desc Get comprehensive risk assessment
 * @access Private (Citizens and Authorities)
 */
router.get('/risk-assessment', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { location } = req.query;

    // Get recent data for risk assessment
    const [recentSensorData, recentReports, activeAlerts, recentPredictions] = await Promise.all([
      getSensorData({ location, limit: 100 }),
      getCitizenReports({ location, limit: 100 }),
      getActiveAlerts({ location, limit: 100 }),
      getPredictions({ location, limit: 50 })
    ]);

    // Calculate risk scores
    const riskAssessment = {
      location: location || 'Miami Coastal Area',
      timestamp: new Date().toISOString(),
      overall_risk: 'low',
      risk_score: 0,
      factors: {},
      recommendations: []
    };

    // Water level risk
    const waterLevelData = recentSensorData.filter(d => d.type === 'water_level');
    if (waterLevelData.length > 0) {
      const maxWaterLevel = Math.max(...waterLevelData.map(d => d.value));
      let waterLevelRisk = 'low';
      let waterLevelScore = 0;

      if (maxWaterLevel > 1.5) {
        waterLevelRisk = 'critical';
        waterLevelScore = 10;
      } else if (maxWaterLevel > 1.2) {
        waterLevelRisk = 'high';
        waterLevelScore = 7;
      } else if (maxWaterLevel > 0.8) {
        waterLevelRisk = 'medium';
        waterLevelScore = 4;
      } else {
        waterLevelRisk = 'low';
        waterLevelScore = 1;
      }

      riskAssessment.factors.water_level = {
        risk: waterLevelRisk,
        score: waterLevelScore,
        max_level: maxWaterLevel,
        readings_count: waterLevelData.length
      };
      riskAssessment.risk_score += waterLevelScore;
    }

    // Wind risk
    const windData = recentSensorData.filter(d => d.type === 'wind');
    if (windData.length > 0) {
      const maxWindSpeed = Math.max(...windData.map(d => d.value));
      let windRisk = 'low';
      let windScore = 0;

      if (maxWindSpeed > 30) {
        windRisk = 'critical';
        windScore = 8;
      } else if (maxWindSpeed > 20) {
        windRisk = 'high';
        windScore = 6;
      } else if (maxWindSpeed > 15) {
        windRisk = 'medium';
        windScore = 3;
      } else {
        windRisk = 'low';
        windScore = 1;
      }

      riskAssessment.factors.wind = {
        risk: windRisk,
        score: windScore,
        max_speed: maxWindSpeed,
        readings_count: windData.length
      };
      riskAssessment.risk_score += windScore;
    }

    // Rainfall risk
    const rainfallData = recentSensorData.filter(d => d.type === 'rainfall');
    if (rainfallData.length > 0) {
      const maxRainfall = Math.max(...rainfallData.map(d => d.value));
      let rainfallRisk = 'low';
      let rainfallScore = 0;

      if (maxRainfall > 80) {
        rainfallRisk = 'critical';
        rainfallScore = 9;
      } else if (maxRainfall > 50) {
        rainfallRisk = 'high';
        rainfallScore = 6;
      } else if (maxRainfall > 25) {
        rainfallRisk = 'medium';
        rainfallScore = 3;
      } else {
        rainfallRisk = 'low';
        rainfallScore = 1;
      }

      riskAssessment.factors.rainfall = {
        risk: rainfallRisk,
        score: rainfallScore,
        max_intensity: maxRainfall,
        readings_count: rainfallData.length
      };
      riskAssessment.risk_score += rainfallScore;
    }

    // Citizen reports risk
    const criticalReports = recentReports.filter(r => r.severity === 'critical');
    const highReports = recentReports.filter(r => r.severity === 'high');
    
    let reportScore = 0;
    if (criticalReports.length > 0) {
      reportScore = 5;
    } else if (highReports.length > 2) {
      reportScore = 3;
    } else if (highReports.length > 0) {
      reportScore = 2;
    }

    riskAssessment.factors.citizen_reports = {
      score: reportScore,
      critical_count: criticalReports.length,
      high_count: highReports.length,
      total_count: recentReports.length
    };
    riskAssessment.risk_score += reportScore;

    // Active alerts risk
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
    const highAlerts = activeAlerts.filter(a => a.severity === 'high');
    
    let alertScore = 0;
    if (criticalAlerts.length > 0) {
      alertScore = 6;
    } else if (highAlerts.length > 1) {
      alertScore = 4;
    } else if (highAlerts.length > 0) {
      alertScore = 2;
    }

    riskAssessment.factors.active_alerts = {
      score: alertScore,
      critical_count: criticalAlerts.length,
      high_count: highAlerts.length,
      total_count: activeAlerts.length
    };
    riskAssessment.risk_score += alertScore;

    // Determine overall risk level
    if (riskAssessment.risk_score >= 25) {
      riskAssessment.overall_risk = 'critical';
    } else if (riskAssessment.risk_score >= 18) {
      riskAssessment.overall_risk = 'high';
    } else if (riskAssessment.risk_score >= 12) {
      riskAssessment.overall_risk = 'medium';
    } else {
      riskAssessment.overall_risk = 'low';
    }

    // Generate recommendations
    if (riskAssessment.overall_risk === 'critical') {
      riskAssessment.recommendations = [
        'Immediate evacuation recommended',
        'Emergency services should be notified',
        'Avoid all coastal areas',
        'Monitor official emergency broadcasts'
      ];
    } else if (riskAssessment.overall_risk === 'high') {
      riskAssessment.recommendations = [
        'Prepare for potential evacuation',
        'Secure outdoor items',
        'Avoid unnecessary travel to coastal areas',
        'Stay informed about weather conditions'
      ];
    } else if (riskAssessment.overall_risk === 'medium') {
      riskAssessment.recommendations = [
        'Monitor weather conditions',
        'Prepare emergency supplies',
        'Stay away from flood-prone areas',
        'Follow local authority guidance'
      ];
    } else {
      riskAssessment.recommendations = [
        'Normal conditions - no immediate action required',
        'Continue monitoring weather updates',
        'Be aware of changing conditions'
      ];
    }

    res.status(200).json({
      success: true,
      data: riskAssessment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/analytics/location/:location
 * @desc Get analytics for specific location
 * @access Private (Citizens and Authorities)
 */
router.get('/location/:location', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const { location } = req.params;
    const { start_time, end_time } = req.query;

    // Validate location
    if (!location || location.trim().length === 0) {
      throw new ValidationError('Location is required');
    }

    // Get location-specific analytics
    const [sensorData, reports, alerts, predictions] = await Promise.all([
      getSensorData({ location: decodeURIComponent(location), start_time, end_time, limit: 1000 }),
      getCitizenReports({ location: decodeURIComponent(location), start_time, end_time, limit: 1000 }),
      getActiveAlerts({ location: decodeURIComponent(location), limit: 1000 }),
      getPredictions({ location: decodeURIComponent(location), limit: 1000 })
    ]);

    const locationAnalytics = {
      location: decodeURIComponent(location),
      timestamp: new Date().toISOString(),
      sensor_data: {
        total_readings: sensorData.length,
        by_type: {}
      },
      citizen_reports: {
        total_reports: reports.length,
        by_type: {},
        by_severity: {}
      },
      alerts: {
        total_alerts: alerts.length,
        by_type: {},
        by_severity: {}
      },
      predictions: {
        total_predictions: predictions.length,
        by_type: {},
        by_risk_level: {}
      }
    };

    // Process sensor data
    sensorData.forEach(reading => {
      const type = reading.type;
      if (!locationAnalytics.sensor_data.by_type[type]) {
        locationAnalytics.sensor_data.by_type[type] = { count: 0, values: [] };
      }
      locationAnalytics.sensor_data.by_type[type].count++;
      locationAnalytics.sensor_data.by_type[type].values.push(reading.value);
    });

    // Calculate averages for sensor data
    Object.keys(locationAnalytics.sensor_data.by_type).forEach(type => {
      const data = locationAnalytics.sensor_data.by_type[type];
      data.average_value = Math.round((data.values.reduce((sum, val) => sum + val, 0) / data.values.length) * 1000) / 1000;
      delete data.values; // Remove raw values to reduce response size
    });

    // Process citizen reports
    reports.forEach(report => {
      const type = report.type;
      const severity = report.severity;
      
      if (!locationAnalytics.citizen_reports.by_type[type]) {
        locationAnalytics.citizen_reports.by_type[type] = 0;
      }
      if (!locationAnalytics.citizen_reports.by_severity[severity]) {
        locationAnalytics.citizen_reports.by_severity[severity] = 0;
      }
      
      locationAnalytics.citizen_reports.by_type[type]++;
      locationAnalytics.citizen_reports.by_severity[severity]++;
    });

    // Process alerts
    alerts.forEach(alert => {
      const type = alert.type;
      const severity = alert.severity;
      
      if (!locationAnalytics.alerts.by_type[type]) {
        locationAnalytics.alerts.by_type[type] = 0;
      }
      if (!locationAnalytics.alerts.by_severity[severity]) {
        locationAnalytics.alerts.by_severity[severity] = 0;
      }
      
      locationAnalytics.alerts.by_type[type]++;
      locationAnalytics.alerts.by_severity[severity]++;
    });

    // Process predictions
    predictions.forEach(prediction => {
      const type = prediction.type;
      const riskLevel = prediction.risk_level;
      
      if (!locationAnalytics.predictions.by_type[type]) {
        locationAnalytics.predictions.by_type[type] = 0;
      }
      if (!locationAnalytics.predictions.by_risk_level[riskLevel]) {
        locationAnalytics.predictions.by_risk_level[riskLevel] = 0;
      }
      
      locationAnalytics.predictions.by_type[type]++;
      locationAnalytics.predictions.by_risk_level[riskLevel]++;
    });

    res.status(200).json({
      success: true,
      data: locationAnalytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    throw error;
  }
}));

module.exports = router;
