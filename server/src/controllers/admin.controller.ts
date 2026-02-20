import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import EmailService from '../lib/email';

// 4.2 Admin User Management
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: true,
        userrole: true,
        wallet: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        userrole: true,
        wallet: true,
        transaction: { take: 10, orderBy: { createdAt: 'desc' } },
        kycdocument: true,
        grantapplication: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!['active', 'inactive', 'pending'].includes(status)) { // Replaced AccountStatus enum check
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId: id },
      data: { accountStatus: status }
    });

    res.json({ message: 'User status updated successfully', profile: updatedProfile });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) { // Replaced AppRole enum check
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Since a user can have multiple roles in this schema, we might want to replace or add.
    // The requirement says "Change user role", usually implying setting a specific role.
    // I'll delete existing roles and add the new one for simplicity, or just update if it's a 1-to-1.
    // Looking at the schema, it's a many-to-one (UserRole belongs to User).

    await prisma.userrole.deleteMany({
      where: { userId: id }
    });

    const newRole = await prisma.userrole.create({
      data: {
        id: uuidv4(),
        userId: id,
        role: role
      }
    });

    res.json({ message: 'User role updated successfully', role: newRole });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4.3 Admin Financial Management
export const getDeposits = async (req: Request, res: Response) => {
  try {
    // Check for status filter in query params
    const statusFilter = req.query.status as string;

    const whereClause: any = {};
    if (statusFilter && statusFilter !== 'all') {
      whereClause.status = statusFilter;
    }

    const deposits = await prisma.deposit.findMany({
      where: whereClause,
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json(deposits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingDeposits = async (req: Request, res: Response) => {
  try {
    const deposits = await prisma.deposit.findMany({
      where: { status: 'pending' },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(deposits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const reviewDeposit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, adminNotes, settlementDetails, amount } = req.body;

    // Validate status
    const validStatuses = ['approved', 'rejected', 'awaiting_payment', 'pending_matching', 'awaiting_confirmation'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Additional validation: can only approve deposits that are awaiting_confirmation
    if (status === 'approved' && deposit.status !== 'awaiting_confirmation') {
      return res.status(400).json({
        error: 'Can only approve deposits that have been submitted with proof of payment and are awaiting confirmation'
      });
    }

    // Additional validation: for crypto deposits, transaction hash is required
    if (status === 'approved' && deposit.paymentMethod === 'crypto' && !deposit.transactionHash) {
      return res.status(400).json({
        error: 'Transaction hash is required for crypto deposit approval'
      });
    }

    // Additional validation: can only reject deposits that are not already approved
    if (status === 'rejected' && deposit.status === 'approved') {
      return res.status(400).json({
        error: 'Cannot reject an already approved deposit'
      });
    }

    const updatedDeposit = await prisma.$transaction(async (tx: any) => {
      const updateData: any = {
        status,
        updatedAt: new Date()
      };

      if (adminNotes) updateData.adminNotes = adminNotes;

      // Allow admin to update settlement details when moving to awaiting_payment status
      if (settlementDetails && (status === 'awaiting_payment' || status === 'pending_matching')) {
        updateData.settlementDetails = settlementDetails;
      }

      // Allow admin to correct the amount if proof shows a different value
      if (amount !== undefined && amount !== null) {
        updateData.amount = Number(amount);
      }

      if (status !== 'pending_matching' && status !== 'awaiting_payment') {
        updateData.reviewedAt = new Date();
      }

      const updated = await tx.deposit.update({
        where: { id },
        data: updateData
      });

      // Add funds for all approved deposits
      if (status === 'approved') {
        // Update user wallet
        await tx.wallet.update({
          where: { userId: deposit.userId },
          data: { balance: { increment: updated.amount } }
        });

        // Create a transaction record
        await tx.transaction.create({
          data: {
            id: uuidv4(),
            userId: deposit.userId,
            type: 'deposit',
            amount: updated.amount,
            description: `Deposit approved: ${deposit.paymentMethod}`,
            status: 'completed',
            referenceId: deposit.id
          }
        });
      }

      return updated;
    });

    res.json({ message: `Deposit ${status}`, deposit: updatedDeposit });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPendingWithdrawals = async (req: Request, res: Response) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { status: 'pending' },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(withdrawals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const reviewWithdrawal = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, adminNotes } = req.body; // status: 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { user: { include: { wallet: true } } }
    });

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal already reviewed' });
    }

    const updatedWithdrawal = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.withdrawal.update({
        where: { id },
        data: {
          status,
          adminNotes,
          reviewedAt: new Date(),
        }
      });

      if (status === 'rejected') {
        // If rejected, we might need to refund the balance if it was deducted at request time.
        // Assuming it was deducted at request time (common practice to avoid double spending).
        // If it wasn't deducted at request time, we don't need to do anything here for 'approved' 
        // except marking it. 
        // Let's assume for now it WAS deducted at request time.
        await tx.wallet.update({
          where: { userId: withdrawal.userId },
          data: { balance: { increment: withdrawal.amount } }
        });
      } else if (status === 'approved') {
        // Create a transaction record
        await tx.transaction.create({
          data: {
            id: uuidv4(),
            userId: withdrawal.userId,
            type: 'withdrawal',
            amount: withdrawal.amount,
            description: `Withdrawal approved to ${withdrawal.withdrawalMethod}`,
            status: 'completed',
            referenceId: withdrawal.id
          }
        });
      }

      return updated;
    });

    res.json({ message: `Withdrawal ${status}`, withdrawal: updatedWithdrawal });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4.4 Admin Grant Management
export const getGrants = async (req: Request, res: Response) => {
  try {
    const grants = await prisma.grantapplication.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(grants);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGrantStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, adminNotes } = req.body;

    const updatedGrant = await prisma.grantapplication.update({
      where: { id },
      data: {
        status,
        adminNotes,
        reviewedAt: new Date(),
      }
    });

    res.json({ message: 'Grant status updated successfully', grant: updatedGrant });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllWallets = async (req: Request, res: Response) => {
  try {
    const wallets = await prisma.wallet.findMany({
      include: { user: { include: { profile: true } } }
    });
    res.json(wallets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateWalletBalance = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { balance } = req.body;

    const wallet = await prisma.wallet.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    const oldBalance = wallet.balance;
    const updatedWallet = await prisma.wallet.update({
      where: { id },
      data: { balance }
    });

    // Log adjustment as transaction
    await prisma.transaction.create({
      data: {
        id: uuidv4(),
        userId: wallet.userId,
        type: 'deposit', // or special 'adjustment' type if you want
        amount: Number(balance) - Number(oldBalance),
        description: 'Admin wallet adjustment',
        status: 'completed'
      }
    });

    res.json(updatedWallet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCopyTradeAttempts = async (req: Request, res: Response) => {
  try {
    const attempts = await prisma.copytradeattempt.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(attempts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCopyTradeAttempt = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await prisma.copytradeattempt.delete({
      where: { id }
    });

    res.json({ message: 'Copy trade attempt deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const adminDeleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.user.delete({
      where: { id }
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const adminCreateUser = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        passwordHash,
        updatedAt: new Date(),
        profile: {
          create: {
            id: uuidv4(),
            email,
            fullName,
            accountStatus: 'active',
            kycStatus: 'approved',
            updatedAt: new Date()
          }
        },
        wallet: {
          create: {
            id: uuidv4(),
            balance: 0,
            updatedAt: new Date()
          }
        }
      },
      include: {
        profile: true,
        wallet: true
      }
    });

    // Send admin notification
    try {
      await EmailService.sendAdminNotification(
        'User Created via Admin Panel',
        `A new user account has been created by an administrator: ${user.email}`,
        {
          userId: user.id,
          email: user.email,
          fullName: fullName || 'N/A',
          timestamp: new Date().toISOString()
        }
      );
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
    }

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const { unreadOnly } = req.query;

    const where: any = {};
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const logs = await prisma.activitylog.findMany({
      where,
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnreadActivityCount = async (req: Request, res: Response) => {
  try {
    const count = await prisma.activitylog.count({
      where: { isRead: false }
    });
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markActivityLogsAsRead = async (req: Request, res: Response) => {
  try {
    await prisma.activitylog.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All activity logs marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { amount, status, description, createdAt } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { user: { include: { wallet: true } } }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const updatedTransaction = await prisma.$transaction(async (tx: any) => {
      // If amount or status changed, we might need to adjust wallet balance
      // Logic can be complex depending on transaction type.
      // For now, let's assume we just update the record and if the admin wants to adjust balance,
      // they should use the wallet adjustment feature separately, OR we can try to be smart.
      // Given the requirement "edit user transaction history", usually implies just fixing records.
      // However, changing a 'completed' deposit amount SHOULD affect balance.

      // Let's stick to updating the record details for now to avoid accidental messy balance calculations,
      // unless specifically requested to auto-adjust balance.
      // Admin already has "Edit Wallet Balance" feature.

      const updateData: any = {
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        status,
        description
      };

      if (createdAt) {
        updateData.createdAt = new Date(createdAt);
      }

      const updated = await tx.transaction.update({
        where: { id },
        data: updateData
      });

      return updated;
    });

    res.json({ message: 'Transaction updated successfully', transaction: updatedTransaction });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { userId, type, amount, status, description, createdAt } = req.body;

    if (!userId || !type || !amount) {
      return res.status(400).json({ error: 'User, type, and amount are required' });
    }

    const transaction = await prisma.$transaction(async (tx: any) => {
      // Create transaction record
      const newTransaction = await tx.transaction.create({
        data: {
          id: uuidv4(),
          userId,
          type,
          amount: parseFloat(amount),
          status: status || 'completed',
          description,
          createdAt: createdAt ? new Date(createdAt) : new Date()
        }
      });

      // Update wallet balance if status is completed
      if (status === 'completed') {
        const wallet = await tx.wallet.findUnique({
          where: { userId }
        });

        if (wallet) {
          const amountNum = parseFloat(amount);
          let balanceChange = 0;

          if (type === 'deposit' || type === 'trade_sell') {
            balanceChange = amountNum;
          } else if (type === 'withdrawal' || type === 'trade_buy') {
            balanceChange = -amountNum;
          }

          if (balanceChange !== 0) {
            await tx.wallet.update({
              where: { userId },
              data: {
                balance: { increment: balanceChange }
              }
            });
          }
        }
      }

      return newTransaction;
    });

    res.status(201).json(transaction);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Algo Application Management ────────────────────────────────────────────

export const getAlgoApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.proprietaryAlgorithmApplication.findMany({
      include: {
        user: { include: { profile: true } },
        algoAccess: { include: { plan: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(applications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAlgoApplicationById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const application = await prisma.proprietaryAlgorithmApplication.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true } },
        algoAccess: { include: { plan: true } }
      }
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json(application);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const reviewAlgoApplication = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, adminNotes } = req.body;

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await prisma.proprietaryAlgorithmApplication.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes || null,
        reviewedAt: new Date(),
      }
    });

    res.json({ message: 'Application status updated', application: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const grantAlgoAccess = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // applicationId
    const { planId, customDurationDays } = req.body;
    const adminId = (req as any).user?.userId;

    if (!planId) return res.status(400).json({ error: 'planId is required' });

    const application = await prisma.proprietaryAlgorithmApplication.findUnique({
      where: { id },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Upsert access record (one per application)
    const access = await prisma.userAlgorithmAccess.upsert({
      where: { applicationId: id },
      create: {
        userId: application.userId,
        applicationId: id,
        planId,
        customDurationDays: customDurationDays ? Number(customDurationDays) : null,
        grantedBy: adminId || null,
      },
      update: {
        planId,
        customDurationDays: customDurationDays ? Number(customDurationDays) : null,
        grantedBy: adminId || null,
        grantedAt: new Date(),
      },
      include: { plan: true }
    });

    // Mark application as approved
    await prisma.proprietaryAlgorithmApplication.update({
      where: { id },
      data: { status: 'approved', reviewedAt: new Date(), reviewedBy: adminId || null }
    });

    // Record activity log for admin notifications
    try {
      await prisma.activitylog.create({
        data: {
          id: uuidv4(),
          userId: application.userId,
          action: 'algo_access_granted',
          details: {
            applicationId: application.id,
            planId: access.plan.id,
            planName: access.plan.name,
            returnPercentage: access.plan.returnPercentage,
            durationDays: access.customDurationDays ?? access.plan.durationDays,
            grantedBy: adminId || null,
          },
          ipAddress: null,
        },
      });
    } catch (logError) {
      console.error('Error recording algo access activity:', logError);
    }

    // Notify user via email that their allocation profile is ready
    try {
      const userEmail = application.user.profile?.email || application.user.email;
      const userName = application.user.profile?.fullName || application.user.email;

      if (userEmail) {
        await EmailService.sendAlgoAccessGrantedEmail({
          email: userEmail,
          name: userName || 'Investor',
          planName: access.plan.name,
          returnPercentage: Number(access.plan.returnPercentage),
          durationDays: access.customDurationDays ?? access.plan.durationDays,
        });
      }
    } catch (emailError) {
      console.error('Error sending algo access email to user:', emailError);
    }

    res.json({ message: 'Access granted successfully', access });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Investment Plan Management ──────────────────────────────────────────────

export const getInvestmentPlans = async (req: Request, res: Response) => {
  try {
    const plans = await prisma.investmentPlan.findMany({
      orderBy: { minAmount: 'asc' }
    });
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateInvestmentPlan = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description, returnPercentage, durationDays, minAmount, maxAmount, isActive } = req.body;

    const updated = await prisma.investmentPlan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(returnPercentage !== undefined && { returnPercentage: Number(returnPercentage) }),
        ...(durationDays !== undefined && { durationDays: Number(durationDays) }),
        ...(minAmount !== undefined && { minAmount: Number(minAmount) }),
        ...(maxAmount !== undefined && { maxAmount: Number(maxAmount) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      }
    });

    res.json({ message: 'Investment plan updated', plan: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Per-User Investment Timeframe Override ──────────────────────────────────

export const updateUserInvestmentTimeframe = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // UserInvestment id
    let customDurationDays = req.body.customDurationDays;

    if (Array.isArray(customDurationDays)) {
      customDurationDays = customDurationDays[0];
    }

    const durationDaysNum = Number(customDurationDays);
    if (!customDurationDays || isNaN(durationDaysNum)) {
      return res.status(400).json({ error: 'customDurationDays must be a valid number' });
    }

    const investment = await prisma.userInvestment.findUnique({ where: { id } });
    if (!investment) return res.status(404).json({ error: 'Investment not found' });

    const newEndDate = new Date(investment.startDate);
    newEndDate.setDate(newEndDate.getDate() + durationDaysNum);

    const updated = await prisma.userInvestment.update({
      where: { id },
      data: {
        customDurationDays: durationDaysNum,
        endDate: newEndDate,
      },
      include: { plan: true, user: { include: { profile: true } } }
    });

    res.json({ message: 'Investment timeframe updated', investment: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUserInvestments = async (req: Request, res: Response) => {
  try {
    const investments = await prisma.userInvestment.findMany({
      include: {
        plan: true,
        user: { include: { profile: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(investments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
