import express from 'express';
import { bookJourney, generateTripPlan, getActiveJourney, getAllJourneys, getJourneyById, simulateSegment } from '../controllers/plannerController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', authenticateToken, generateTripPlan);
router.post('/book', authenticateToken, bookJourney);
router.get('/journeys', authenticateToken, getAllJourneys);
router.get('/journeys/active', authenticateToken, getActiveJourney);
router.get('/journeys/:id', authenticateToken, getJourneyById);
router.patch('/segments/:id/simulate', authenticateToken, simulateSegment);

export default router;
