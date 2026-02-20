import express from 'express';
import { submitApplication, getApplicationStatus, getEligiblePlans } from '../controllers/algo.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// All algo routes require authentication
router.use(authMiddleware);

router.post('/apply', submitApplication);
router.get('/status', getApplicationStatus);
router.get('/eligible-plans', getEligiblePlans);

export default router;
