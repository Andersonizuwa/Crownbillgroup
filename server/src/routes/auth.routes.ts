import { Router } from 'express';
import { register, login, magicLink, resetPasswordRequest, resetPassword, forgotPassword, verifyToken, changePassword, getLoginHistory } from '../controllers/auth.controller';
import { upload } from '../lib/upload';
import { authRateLimiter } from '../middleware/security.middleware';
import { validateRegistration, validateLogin } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authRateLimiter);

router.post('/register', upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'addressDocument', maxCount: 1 }
]), validateRegistration, register);
router.post('/login', validateLogin, login);
router.post('/magic-link', magicLink);
router.post('/reset-password-request', resetPasswordRequest);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', forgotPassword);
router.get('/verify', verifyToken);
router.get('/test-email', async (req, res) => {
  try {
    const EmailService = (await import('../lib/email')).default;
    await EmailService.sendPasswordResetEmail('johanna.yost@ethereal.email', 'http://localhost:5173/reset-password?token=test-token');
    res.json({ message: 'Test email sent' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Security endpoints
router.post('/change-password', authenticate, changePassword);

router.get('/login-history', authenticate, getLoginHistory);

export default router;
