import express from 'express';
import { login, signup, getProfile } from '../controllers/authController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

// API Version 1 routes
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);

export default router;
