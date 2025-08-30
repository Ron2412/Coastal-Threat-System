const express = require('express');
const Joi = require('joi');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { getUserByUid, createCustomToken, setCustomUserClaims } = require('../services/firebase');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'string.empty': 'ID token is required',
    'any.required': 'ID token is required'
  })
});

const registerSchema = Joi.object({
  idToken: Joi.string().required(),
  role: Joi.string().valid('citizen', 'authority').default('citizen'),
  profile: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    location: Joi.string().max(200).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().max(100).optional(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
      relationship: Joi.string().max(50).optional()
    }).optional()
  }).required()
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
  location: Joi.string().max(200).optional(),
  emergencyContact: Joi.object({
    name: Joi.string().max(100).optional(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    relationship: Joi.string().max(50).optional()
  }).optional()
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user with Firebase ID token
 * @access Public
 */
router.post('/login', asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid login data', error.details);
    }

    const { idToken } = value;

    // Verify the ID token with Firebase
    const userRecord = await getUserByUid(idToken);
    
    // Create custom token for the user
    const customToken = await createCustomToken(userRecord.uid, {
      role: userRecord.customClaims?.role || 'citizen',
      emailVerified: userRecord.emailVerified
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          role: userRecord.customClaims?.role || 'citizen',
          emailVerified: userRecord.emailVerified,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL
        },
        customToken,
        expiresIn: 3600 // 1 hour
      }
    });

  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your authentication token has expired. Please login again.'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        error: 'Token revoked',
        message: 'Your authentication token has been revoked. Please login again.'
      });
    }

    throw error;
  }
}));

/**
 * @route POST /api/auth/register
 * @desc Register new user with role and profile
 * @access Public
 */
router.post('/register', asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid registration data', error.details);
    }

    const { idToken, role, profile } = value;

    // Verify the ID token with Firebase
    const userRecord = await getUserByUid(idToken);
    
    // Set custom claims for the user
    await setCustomUserClaims(userRecord.uid, {
      role: role,
      profile: profile,
      registeredAt: new Date().toISOString()
    });

    // Create custom token with new claims
    const customToken = await createCustomToken(userRecord.uid, {
      role: role,
      profile: profile
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          role: role,
          profile: profile,
          emailVerified: userRecord.emailVerified
        },
        customToken,
        expiresIn: 3600
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/auth/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    const userRecord = await getUserByUid(req.user.uid);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          role: userRecord.customClaims?.role || 'citizen',
          emailVerified: userRecord.emailVerified,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          profile: userRecord.customClaims?.profile || {},
          registeredAt: userRecord.customClaims?.registeredAt
        }
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Validate request body
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      throw new ValidationError('Invalid profile data', error.details);
    }

    const userRecord = await getUserByUid(req.user.uid);
    const currentClaims = userRecord.customClaims || {};
    
    // Update profile in custom claims
    const updatedClaims = {
      ...currentClaims,
      profile: {
        ...currentClaims.profile,
        ...value,
        updatedAt: new Date().toISOString()
      }
    };

    await setCustomUserClaims(req.user.uid, updatedClaims);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: updatedClaims.profile
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route POST /api/auth/refresh
 * @desc Refresh authentication token
 * @access Private
 */
router.post('/refresh', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Create new custom token
    const customToken = await createCustomToken(req.user.uid, {
      role: req.user.role,
      emailVerified: req.user.emailVerified
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        customToken,
        expiresIn: 3600
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token invalidation)
 * @access Private
 */
router.post('/logout', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    // Note: Firebase doesn't support server-side logout
    // This endpoint is for logging purposes and client-side cleanup
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: {
        logoutTime: new Date().toISOString()
      }
    });

  } catch (error) {
    throw error;
  }
}));

/**
 * @route GET /api/auth/verify
 * @desc Verify token validity
 * @access Private
 */
router.get('/verify', requireRole(['citizen', 'authority', 'admin']), asyncHandler(async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user,
        verifiedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    throw error;
  }
}));

module.exports = router;
