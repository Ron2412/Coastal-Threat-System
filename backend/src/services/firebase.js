const admin = require('firebase-admin');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 */
const initializeFirebase = async () => {
  try {
    if (firebaseApp) {
      logger.info('Firebase already initialized');
      return firebaseApp;
    }

    // Check if running in Firebase Functions environment
    if (process.env.FIREBASE_FUNCTIONS) {
      firebaseApp = admin.initializeApp();
      logger.info('Firebase initialized for Functions environment');
    } else {
      // Check if we have the minimum required Firebase credentials
      const hasMinimalCredentials = process.env.FIREBASE_PROJECT_ID && 
                                  process.env.FIREBASE_PRIVATE_KEY && 
                                  process.env.FIREBASE_CLIENT_EMAIL;
      
      if (!hasMinimalCredentials) {
        logger.warn('Firebase credentials not fully configured. Running in demo mode without Firebase.');
        logger.warn('To enable Firebase features, set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL');
        return null; // Return null to indicate Firebase is not available
      }

      // Initialize with service account
      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || 'mock_key_id',
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID || '123456789',
        auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });

      logger.info('Firebase initialized with service account');
    }

    return firebaseApp;
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
    logger.warn('Continuing without Firebase in demo mode');
    return null; // Return null instead of throwing error
  }
};

/**
 * Send push notification to specific user
 */
const sendPushNotification = async (userId, notification) => {
  try {
    if (!firebaseApp) {
      logger.warn('Firebase not available - notification not sent');
      return { success: false, message: 'Firebase not available in demo mode' };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      token: userId // This should be the FCM token, not user ID
    };

    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent to ${userId}:`, response);
    return response;
  } catch (error) {
    logger.error(`Failed to send push notification to ${userId}:`, error);
    throw error;
  }
};

/**
 * Send push notification to topic subscribers
 */
const sendTopicNotification = async (topic, notification) => {
  try {
    if (!firebaseApp) {
      logger.warn('Firebase not available - topic notification not sent');
      return { success: false, message: 'Firebase not available in demo mode' };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      topic: topic
    };

    const response = await admin.messaging().send(message);
    logger.info(`Topic notification sent to ${topic}:`, response);
    return response;
  } catch (error) {
    logger.error(`Failed to send topic notification to ${topic}:`, error);
    throw error;
  }
};

/**
 * Subscribe user to topic
 */
const subscribeToTopic = async (tokens, topic) => {
  try {
    if (!firebaseApp) {
      logger.warn('Firebase not available - topic subscription not performed');
      return { success: false, message: 'Firebase not available in demo mode' };
    }

    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    logger.info(`Subscribed ${tokens.length} tokens to topic ${topic}:`, response);
    return response;
  } catch (error) {
    logger.error(`Failed to subscribe to topic ${topic}:`, error);
    throw error;
  }
};

/**
 * Unsubscribe user from topic
 */
const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    if (!firebaseApp) {
      logger.warn('Firebase not available - topic unsubscription not performed');
      return { success: false, message: 'Firebase not available in demo mode' };
    }

    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    logger.info(`Unsubscribed ${tokens.length} tokens from topic ${topic}:`, response);
    return response;
  } catch (error) {
    logger.error(`Failed to unsubscribe from topic ${topic}:`, error);
    throw error;
  }
};

/**
 * Get user by UID
 */
const getUserByUid = async (uid) => {
  try {
    if (!firebaseApp) {
      logger.warn('Firebase not available - user lookup not performed');
      return { success: false, message: 'Firebase not available in demo mode' };
    }

    const userRecord = await admin.auth().getUser(uid);
    logger.info(`Retrieved user: ${userRecord.email}`);
    return userRecord;
  } catch (error) {
    logger.error(`Failed to get user ${uid}:`, error);
    throw error;
  }
};

/**
 * Create custom token for user
 */
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    if (!firebaseApp) {
      logger.warn('Firebase not available - custom token not created');
      return { success: false, message: 'Firebase not available in demo mode' };
    }

    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    logger.info(`Custom token created for user ${uid}`);
    return customToken;
  } catch (error) {
    logger.error(`Failed to create custom token for ${uid}:`, error);
    throw error;
  }
};

/**
 * Set custom user claims
 */
const setCustomUserClaims = async (uid, claims) => {
  try {
    if (!firebaseApp) {
      logger.warn('Firebase not available - custom claims not set');
      return { success: false, message: 'Firebase not available in demo mode' };
    }

    await admin.auth().setCustomUserClaims(uid, claims);
    logger.info(`Custom claims set for user ${uid}:`, claims);
  } catch (error) {
    logger.error(`Failed to set custom claims for ${uid}:`, error);
    throw error;
  }
};

/**
 * Send coastal threat alert to all subscribers
 */
const sendCoastalThreatAlert = async (alert) => {
  try {
    const notification = {
      title: `🚨 Coastal Threat Alert: ${alert.severity.toUpperCase()}`,
      body: alert.description,
      data: {
        alertId: alert.id,
        severity: alert.severity,
        location: alert.location,
        timestamp: alert.timestamp,
        type: 'coastal_threat'
      }
    };

    // Send to general coastal threats topic
    await sendTopicNotification('coastal_threats', notification);

    // Send to severity-specific topic
    await sendTopicNotification(`coastal_threats_${alert.severity}`, notification);

    logger.info(`Coastal threat alert sent: ${alert.id}`);
  } catch (error) {
    logger.error(`Failed to send coastal threat alert:`, error);
    throw error;
  }
};

/**
 * Send flood prediction alert
 */
const sendFloodPredictionAlert = async (prediction) => {
  try {
    const notification = {
      title: '🌊 Flood Prediction Alert',
      body: `High risk of flooding in ${prediction.location} - ${prediction.confidence}% confidence`,
      data: {
        predictionId: prediction.id,
        confidence: prediction.confidence,
        location: prediction.location,
        predictedTime: prediction.predictedTime,
        type: 'flood_prediction'
      }
    };

    await sendTopicNotification('flood_predictions', notification);
    logger.info(`Flood prediction alert sent: ${prediction.id}`);
  } catch (error) {
    logger.error(`Failed to send flood prediction alert:`, error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  sendPushNotification,
  sendTopicNotification,
  subscribeToTopic,
  unsubscribeFromTopic,
  getUserByUid,
  createCustomToken,
  setCustomUserClaims,
  sendCoastalThreatAlert,
  sendFloodPredictionAlert
};
