import { Router } from 'express';
import { 
  register, 
  login, 
  magicLink, 
  getLoginHistory
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/magic-link', magicLink);

// Protected login history route
router.get('/login-history', authenticate, getLoginHistory);

export default router;
