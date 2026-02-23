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
router.post('/transactions', adminController.createTransaction);
router.patch('/transactions/:id', adminController.updateTransaction);

// 4.4 Admin Grant Management
router.get('/grants', adminController.getGrants);
router.patch('/grants/:id', adminController.updateGrantStatus);

// 4.5 Other
router.get('/copy-trade-attempts', adminController.getCopyTradeAttempts);
router.delete('/copy-trade-attempts/:id', adminController.deleteCopyTradeAttempt);
router.get('/activity-logs', adminController.getActivityLogs);
router.get('/activity-logs/unread-count', adminController.getUnreadActivityCount);
router.patch('/activity-logs/read', adminController.markActivityLogsAsRead);

// 4.6 Algo Application Management
router.get('/algo-applications', adminController.getAlgoApplications);
router.get('/algo-applications/:id', adminController.getAlgoApplicationById);
router.patch('/algo-applications/:id/review', adminController.reviewAlgoApplication);
router.post('/algo-applications/:id/grant', adminController.grantAlgoAccess);

// 4.7 Investment Plan Management
router.get('/investment-plans', adminController.getInvestmentPlans);
router.patch('/investment-plans/:id', adminController.updateInvestmentPlan);

// 4.8 User Investment Timeframe Override
router.get('/user-investments', adminController.getAllUserInvestments);
router.patch('/user-investments/:id/timeframe', adminController.updateUserInvestmentTimeframe);

// 4.9 App Settings
router.put('/settings', adminController.updateSettings);

export default router;
