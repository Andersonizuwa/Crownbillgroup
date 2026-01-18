import { Router } from 'express';
import { getProfile, updateProfile, getWallet } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.get('/wallet', getWallet);

export default router;
