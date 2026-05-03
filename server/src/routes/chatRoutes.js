import express from 'express';
import { handleChatQuery } from '../controllers/chatController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/query', authenticateToken, handleChatQuery);

export default router;
