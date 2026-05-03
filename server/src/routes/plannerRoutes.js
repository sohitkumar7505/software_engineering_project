import express from 'express';
import { bookJourney, generateTripPlan, getActiveJourney, simulateSegment } from '../controllers/plannerController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', authenticateToken, generateTripPlan);
router.post('/book', authenticateToken, bookJourney);
router.get('/journeys/active', authenticateToken, getActiveJourney);
router.patch('/segments/:id/simulate', authenticateToken, simulateSegment);

export default router;
