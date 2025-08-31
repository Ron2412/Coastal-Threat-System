const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

let supabase = null;
let supabaseAdmin = null;

/**
 * Initialize Supabase client
 */
const initializeSupabase = async () => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project')) {
      logger.warn('Supabase credentials not configured. Running in demo mode with mock data only.');
      logger.warn('To enable database features, set SUPABASE_URL and SUPABASE_ANON_KEY');
      supabase = null;
      supabaseAdmin = null;
      return { supabase: null, supabaseAdmin: null };
    }

    // Initialize regular client
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false
      }
    });

    // Initialize admin client for service operations
    if (supabaseServiceRoleKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: false
        }
      });
    }

    logger.info('Supabase initialized successfully');
    return { supabase, supabaseAdmin };
  } catch (error) {
    logger.error('Failed to initialize Supabase:', error);
    logger.warn('Continuing without Supabase in demo mode');
    return { supabase: null, supabaseAdmin: null };
  }
};

/**
 * Get Supabase client instance
 */
const getClient = () => {
  if (!supabase) {
    logger.warn('Supabase not available - returning mock client');
    return null;
  }
  return supabase;
};

/**
 * Get Supabase admin client instance
 */
const getAdminClient = () => {
  if (!supabaseAdmin) {
    logger.warn('Supabase admin not available - returning mock client');
    return null;
  }
  return supabaseAdmin;
};

/**
 * Insert sensor data
 */
const insertSensorData = async (sensorData) => {
  try {
    if (!supabase) {
      logger.warn('Supabase not available - sensor data not stored');
      return { id: `mock_${Date.now()}`, ...sensorData };
    }

    const { data, error } = await supabase
      .from('sensor_data')
      .insert([sensorData])
      .select()
      .single();

    if (error) {
      logger.error('Failed to insert sensor data:', error);
      throw error;
    }

    logger.info(`Sensor data inserted: ${data.id}`);
    return data;
  } catch (error) {
    logger.error('Sensor data insertion error:', error);
    throw error;
  }
};

/**
 * Insert citizen report
 */
const insertCitizenReport = async (report) => {
  try {
    if (!supabase) {
      logger.warn('Supabase not available - citizen report not stored');
      return { id: `mock_report_${Date.now()}`, ...report };
    }

    const { data, error } = await supabase
      .from('citizen_reports')
      .insert([report])
      .select()
      .single();

    if (error) {
      logger.error('Failed to insert citizen report:', error);
      throw error;
    }

    logger.info(`Citizen report inserted: ${data.id}`);
    return data;
  } catch (error) {
    logger.error('Citizen report insertion error:', error);
    throw error;
  }
};

/**
 * Get sensor data with filters
 */
const getSensorData = async (filters = {}) => {
  try {
    if (!supabase) {
      logger.warn('Supabase not available - returning mock sensor data');
      // Return mock data for demo
      return [
        {
          id: 'mock_sensor_001',
          sensor_id: 'sensor_001',
          type: 'water_level',
          value: 0.8,
          unit: 'meters',
          location: 'Miami Beach Pier',
          coordinates: { lat: 25.7617, lng: -80.1918 },
          timestamp: new Date().toISOString()
        },
        {
          id: 'mock_sensor_002',
          sensor_id: 'sensor_002',
          type: 'wind',
          value: 12.5,
          unit: 'm/s',
          location: 'South Beach',
          coordinates: { lat: 25.7825, lng: -80.1344 },
          timestamp: new Date().toISOString()
        }
      ];
    }

    let query = supabase
      .from('sensor_data')
      .select('*')
      .order('timestamp', { ascending: false });

    // Apply filters
    if (filters.sensor_id) {
      query = query.eq('sensor_id', filters.sensor_id);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.location) {
      query = query.eq('location', filters.location);
    }
    if (filters.start_time) {
      query = query.gte('timestamp', filters.start_time);
    }
    if (filters.end_time) {
      query = query.lte('timestamp', filters.end_time);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to get sensor data:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Get sensor data error:', error);
    throw error;
  }
};

/**
 * Get citizen reports with filters
 */
const getCitizenReports = async (filters = {}) => {
  try {
    let query = supabase
      .from('citizen_reports')
      .select('*')
      .order('timestamp', { ascending: false });

    // Apply filters
    if (filters.citizen_id) {
      query = query.eq('citizen_id', filters.citizen_id);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.location) {
      query = query.eq('location', filters.location);
    }
    if (filters.start_time) {
      query = query.gte('timestamp', filters.start_time);
    }
    if (filters.end_time) {
      query = query.lte('timestamp', filters.end_time);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to get citizen reports:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Get citizen reports error:', error);
    throw error;
  }
};

/**
 * Insert alert
 */
const insertAlert = async (alert) => {
  try {
    if (!supabase) {
      logger.warn('Supabase not available - alert not stored');
      return { id: `mock_alert_${Date.now()}`, ...alert };
    }

    const { data, error } = await supabase
      .from('alerts')
      .insert([alert])
      .select()
      .single();

    if (error) {
      logger.error('Failed to insert alert:', error);
      throw error;
    }

    logger.info(`Alert inserted: ${data.id}`);
    return data;
  } catch (error) {
    logger.error('Alert insertion error:', error);
    throw error;
  }
};

/**
 * Get active alerts
 */
const getActiveAlerts = async (filters = {}) => {
  try {
    if (!supabase) {
      logger.warn('Supabase not available - returning mock alerts');
      // Return mock alerts for demo
      return [
        {
          id: 'mock_alert_001',
          type: 'flooding',
          severity: 'high',
          description: 'Water levels rising rapidly in Miami Beach area',
          location: 'Miami Beach',
          coordinates: { lat: 25.7617, lng: -80.1918 },
          source: 'sensor',
          source_id: 'sensor_001',
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 'mock_alert_002',
          type: 'storm_damage',
          severity: 'medium',
          description: 'High winds detected at South Beach',
          location: 'South Beach',
          coordinates: { lat: 25.7825, lng: -80.1344 },
          source: 'sensor',
          source_id: 'sensor_002',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ];
    }

    let query = supabase
      .from('alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.location) {
      query = query.eq('location', filters.location);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to get active alerts:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Get active alerts error:', error);
    throw error;
  }
};

/**
 * Insert prediction
 */
const insertPrediction = async (prediction) => {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .insert([prediction])
      .select()
      .single();

    if (error) {
      logger.error('Failed to insert prediction:', error);
      throw error;
    }

    logger.info(`Prediction inserted: ${data.id}`);
    return data;
  } catch (error) {
    logger.error('Prediction insertion error:', error);
    throw error;
  }
};

/**
 * Get predictions
 */
const getPredictions = async (filters = {}) => {
  try {
    let query = supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.location) {
      query = query.eq('location', filters.location);
    }
    if (filters.confidence_min) {
      query = query.gte('confidence', filters.confidence_min);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to get predictions:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Get predictions error:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time changes
 */
const subscribeToRealtime = (table, event, callback) => {
  try {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', {
        event: event,
        schema: 'public',
        table: table
      }, callback)
      .subscribe();

    logger.info(`Subscribed to ${table} ${event} events`);
    return subscription;
  } catch (error) {
    logger.error(`Failed to subscribe to ${table} ${event}:`, error);
    throw error;
  }
};

/**
 * Unsubscribe from real-time changes
 */
const unsubscribeFromRealtime = (subscription) => {
  try {
    if (subscription) {
      supabase.removeChannel(subscription);
      logger.info('Unsubscribed from real-time updates');
    }
  } catch (error) {
    logger.error('Failed to unsubscribe from real-time:', error);
  }
};

/**
 * Execute raw SQL query (admin only)
 */
const executeRawQuery = async (sql, params = []) => {
  try {
    if (!supabaseAdmin) {
      throw new Error('Admin client not available');
    }

    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: sql,
      params: params
    });

    if (error) {
      logger.error('Raw query execution failed:', error);
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Raw query error:', error);
    throw error;
  }
};

module.exports = {
  initializeSupabase,
  getClient,
  getAdminClient,
  insertSensorData,
  insertCitizenReport,
  getSensorData,
  getCitizenReports,
  insertAlert,
  getActiveAlerts,
  insertPrediction,
  getPredictions,
  subscribeToRealtime,
  unsubscribeFromRealtime,
  executeRawQuery
};
