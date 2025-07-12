import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  cleanupExpiredSessions,
  registerValidation,
  loginValidation
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getCurrentUser);
router.put('/profile', verifyToken, updateProfile);
router.put('/change-password', verifyToken, changePassword);

// Admin route (for cleanup)
router.delete('/sessions/cleanup', verifyToken, cleanupExpiredSessions);

export default router; 