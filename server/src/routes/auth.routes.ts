import { Router } from 'express';
import {
  register,
  login,
  magicLink,
  getLoginHistory,
  refreshToken
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/magic-link', magicLink);

// Protected login history route
router.get('/login-history', authenticate, getLoginHistory);

export default router;
