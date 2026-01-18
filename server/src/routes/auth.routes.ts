import { Router } from 'express';
import { register, login, magicLink, resetPasswordRequest, resetPassword } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/magic-link', magicLink);
router.post('/reset-password-request', resetPasswordRequest);
router.post('/reset-password', resetPassword);

export default router;
