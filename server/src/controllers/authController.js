import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeTransaction } from '../config/database.js';
import { body, validationResult } from 'express-validator';

// Validation rules
export const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters, alphanumeric and underscore only'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters')
];

export const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register new user
export const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password, bio } = req.body;

    // Check if username already exists
    const existingUserResult = await executeQuery(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUserResult.success && existingUserResult.data.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // Check if email already exists
    const existingEmailResult = await executeQuery(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmailResult.success && existingEmailResult.data.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const createUserResult = await executeQuery(
      'INSERT INTO users (id, username, email, password, bio, reputation) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, email, hashedPassword, bio || '', 0]
    );

    if (!createUserResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create user'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const createSessionResult = await executeQuery(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, userId, token, expiresAt]
    );

    if (!createSessionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create session'
      });
    }

    // Get user data (without password)
    const userResult = await executeQuery(
      'SELECT id, username, email, avatar, bio, reputation, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResult.data[0],
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username
    const userResult = await executeQuery(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const user = userResult.data[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const createSessionResult = await executeQuery(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, token, expiresAt]
    );

    if (!createSessionResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create session'
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// Logout user
export const logout = async (req, res) => {
  try {
    const token = req.token;

    // Delete session
    const deleteSessionResult = await executeQuery(
      'DELETE FROM sessions WHERE token = ?',
      [token]
    );

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { username, email, bio, avatar } = req.body;
    const userId = req.user.id;

    // Check if new username already exists (if username is being updated)
    if (username && username !== req.user.username) {
      const existingUserResult = await executeQuery(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );

      if (existingUserResult.success && existingUserResult.data.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Username already exists'
        });
      }
    }

    // Check if new email already exists (if email is being updated)
    if (email && email !== req.user.email) {
      const existingEmailResult = await executeQuery(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );

      if (existingEmailResult.success && existingEmailResult.data.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }

    // Update user
    const updateResult = await executeQuery(
      'UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), bio = COALESCE(?, bio), avatar = COALESCE(?, avatar), updated_at = NOW() WHERE id = ?',
      [username, email, bio, avatar, userId]
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }

    // Get updated user data
    const userResult = await executeQuery(
      'SELECT id, username, email, avatar, bio, reputation, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userResult.data[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Profile update failed'
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current password hash
    const userResult = await executeQuery(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.data[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updateResult = await executeQuery(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update password'
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Password change failed'
    });
  }
};

// Clean up expired sessions (cron job or manual call)
export const cleanupExpiredSessions = async (req, res) => {
  try {
    const deleteResult = await executeQuery(
      'DELETE FROM sessions WHERE expires_at < NOW()'
    );

    res.json({
      success: true,
      message: 'Expired sessions cleaned up',
      data: { deletedCount: deleteResult.data.affectedRows }
    });
  } catch (error) {
    console.error('Cleanup sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup sessions'
    });
  }
}; 