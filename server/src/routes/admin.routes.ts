import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth and admin middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// 4.2 Admin User Management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.adminCreateUser);
router.get('/users/:id', adminController.getUserDetails);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.adminDeleteUser);

// 4.3 Admin Financial Management
router.get('/deposits', adminController.getDeposits);
router.patch('/deposits/:id', adminController.reviewDeposit);
router.get('/withdrawals', adminController.getPendingWithdrawals);
router.patch('/withdrawals/:id', adminController.reviewWithdrawal);
router.get('/wallets', adminController.getAllWallets);
router.patch('/wallets/:id', adminController.updateWalletBalance);
router.get('/transactions', adminController.getAllTransactions);

// 4.4 Admin Grant Management
router.get('/grants', adminController.getGrants);
router.patch('/grants/:id', adminController.updateGrantStatus);

// 4.5 Other
router.get('/copy-trade-attempts', adminController.getCopyTradeAttempts);
router.delete('/copy-trade-attempts/:id', adminController.deleteCopyTradeAttempt);
router.get('/activity-logs', adminController.getActivityLogs);

export default router;
