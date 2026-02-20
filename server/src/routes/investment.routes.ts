import express from 'express';
import { getPlans, createInvestment, getUserInvestments } from '../controllers/investment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/plans', getPlans);
router.post('/invest', authMiddleware, createInvestment);
router.get('/my-investments', authMiddleware, getUserInvestments);

export default router;
