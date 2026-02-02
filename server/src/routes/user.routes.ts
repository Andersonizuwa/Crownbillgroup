import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  getWallet, 
  createDeposit, 
  getDeposits, 
  createWithdrawal, 
  getWithdrawals,
  getTransactions,
  createActivityLog,
  createCopyTradeAttempt,
  getUserCopyTradeAttempts,
  deleteCopyTradeAttempt,
  getGrantApplications,
  createGrantApplication,
  submitDepositProof,
  getDeposit,
  cancelDeposit
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateDeposit, validateWithdrawal, validateGrantApplication } from '../middleware/validation.middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' }); // For file uploads

const router = Router();

router.use(authenticate);

// Profile routes
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

// Wallet route
router.get('/wallet', getWallet);

// Deposit routes
router.post('/deposits', validateDeposit, createDeposit);
router.get('/deposits', getDeposits);
router.patch('/deposits/:id/proof', upload.array('files'), submitDepositProof);
router.patch('/deposits/:id/cancel', cancelDeposit);
router.get('/deposits/:id', getDeposit);

// Withdrawal route
router.post('/withdrawals', validateWithdrawal, createWithdrawal);
router.get('/withdrawals', getWithdrawals);

// Transaction route
router.get('/transactions', getTransactions);

// Activity Log route
router.post('/activity-logs', createActivityLog);

// Copy Trade Attempt route
router.post('/copy-trade-attempts', createCopyTradeAttempt);
router.get('/copy-trade-attempts', getUserCopyTradeAttempts);
router.delete('/copy-trade-attempts/:id', deleteCopyTradeAttempt);

// Grant Applications route
router.get('/grants', getGrantApplications);
router.post('/grants', validateGrantApplication, createGrantApplication);

export default router;
