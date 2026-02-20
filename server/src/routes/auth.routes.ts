import { Router } from 'express';
import { 
  register, 
  login, 
  magicLink, 
  resetPasswordRequest, 
  resetPassword,
  getLoginHistory
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/magic-link', magicLink);
router.post('/reset-password-request', resetPasswordRequest);
router.post('/reset-password', resetPassword);

// Protected login history route
router.get('/login-history', authenticate, getLoginHistory);

export default router;
