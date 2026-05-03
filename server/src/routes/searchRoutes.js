import express from 'express';
import { generateSearchPlan } from '../controllers/searchController.js';

const router = express.Router();

router.post('/plan', generateSearchPlan);

export default router;
