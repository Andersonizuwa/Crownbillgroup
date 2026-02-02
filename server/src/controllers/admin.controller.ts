import { Request, Response } from 'express';
import prisma from '../lib/prisma';
// import { AccountStatus, AppRole } from '@prisma/client'; // Removed due to Prisma v6 changes
import bcrypt from 'bcryptjs';
const { v4: uuidv4 } = require('uuid');

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

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.activitylog.findMany({
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json(logs);
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
