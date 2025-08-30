const admin = require('firebase-admin');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

/**
 * Middleware to authenticate JWT tokens from Firebase
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    try {
      // Verify the token with Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Add user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'citizen', // Default role
        emailVerified: decodedToken.email_verified || false
      };

      logger.info(`User authenticated: ${req.user.email} (${req.user.role})`);
      next();
    } catch (firebaseError) {
      logger.warn(`Invalid token attempt: ${firebaseError.message}`);
      return res.status(403).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!roles.includes(userRole)) {
      logger.warn(`Access denied for user ${req.user.email} (${userRole}) to ${req.path}`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `Role '${userRole}' does not have access to this resource`,
        requiredRoles: roles
      });
    }

    logger.info(`Access granted for user ${req.user.email} (${userRole}) to ${req.path}`);
    next();
  };
};

/**
 * Middleware to check if user is an authority
 */
const requireAuthority = requireRole(['authority', 'admin']);

/**
 * Middleware to check if user is a citizen
 */
const requireCitizen = requireRole(['citizen', 'authority', 'admin']);

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.role || 'citizen',
          emailVerified: decodedToken.email_verified || false
        };
        logger.info(`Optional auth successful: ${req.user.email}`);
      } catch (firebaseError) {
        logger.warn(`Optional auth failed: ${firebaseError.message}`);
        // Don't fail, just continue without user info
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue without user info
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAuthority,
  requireCitizen,
  optionalAuth
};
