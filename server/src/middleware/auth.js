import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database.js';

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and session is valid
    const userResult = await executeQuery(
      'SELECT id, username, email, avatar, bio, reputation, created_at, updated_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token - user not found'
      });
    }

    // Check if session exists and is not expired
    const sessionResult = await executeQuery(
      'SELECT * FROM sessions WHERE user_id = ? AND token = ? AND expires_at > NOW()',
      [decoded.userId, token]
    );

    if (!sessionResult.success || sessionResult.data.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session'
      });
    }

    req.user = userResult.data[0];
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await executeQuery(
      'SELECT id, username, email, avatar, bio, reputation, created_at, updated_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (userResult.success && userResult.data.length > 0) {
      const sessionResult = await executeQuery(
        'SELECT * FROM sessions WHERE user_id = ? AND token = ? AND expires_at > NOW()',
        [decoded.userId, token]
      );

      if (sessionResult.success && sessionResult.data.length > 0) {
        req.user = userResult.data[0];
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Silently continue if token is invalid
    next();
  }
};

// Check if user owns resource
export const checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.id;

      let query;
      let params;

      switch (resourceType) {
        case 'question':
          query = 'SELECT author_id FROM questions WHERE id = ?';
          params = [resourceId];
          break;
        case 'answer':
          query = 'SELECT author_id FROM answers WHERE id = ?';
          params = [resourceId];
          break;
        case 'comment':
          query = 'SELECT author_id FROM comments WHERE id = ?';
          params = [resourceId];
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid resource type'
          });
      }

      const result = await executeQuery(query, params);

      if (!result.success || result.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: `${resourceType} not found`
        });
      }

      if (result.data[0].author_id !== userId) {
        return res.status(403).json({
          success: false,
          error: `You can only modify your own ${resourceType}`
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization error'
      });
    }
  };
};

// Check if user is admin (you can extend this for role-based access)
export const requireAdmin = async (req, res, next) => {
  try {
    // For now, we'll use a simple check. You can extend this with a role field in users table
    if (req.user.username !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authorization error'
    });
  }
}; 