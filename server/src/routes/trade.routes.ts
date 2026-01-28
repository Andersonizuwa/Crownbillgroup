import { Router } from 'express';
import { 
  executeBuyTrade,
  executeSellTrade,
  getHoldings,
  getTradeHistory,
  updateHoldingPrices,
  getCurrentPrices
} from '../controllers/trade.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Market data (public)
router.get('/prices', getCurrentPrices);

// Protected routes
router.use(authenticate);

// Trade execution routes
router.post('/buy', executeBuyTrade);
router.post('/sell', executeSellTrade);

// Holdings and history
router.get('/holdings', getHoldings);
router.get('/history', getTradeHistory);

// Update prices
router.get('/holdings/prices', updateHoldingPrices);

export default router;
