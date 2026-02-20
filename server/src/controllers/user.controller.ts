import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import EmailService from '../lib/email';

interface AuthRequest extends Request {
  user?: any;
}







export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;

    // First, try to fetch the profile
    let profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            createdAt: true
          }
        }
      }
    });

    // If profile doesn't exist, create one
    if (!profile) {
      profile = await prisma.profile.upsert({
        where: { userId },
        update: {
          updatedAt: new Date()
        },
        create: {
          id: uuidv4(),
          userId,
          email: req.user.email || '',
          fullName: '',
          phone: '',
          nationality: '',
          countryOfResidence: '',
          kycStatus: 'pending',
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              email: true,
              createdAt: true
            }
          }
        }
      });
    }

    res.json(profile);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message || 'Error fetching profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    // Validate date of birth if it's being updated
    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      const today = new Date();
      const currentYear = today.getFullYear();

      if (dob.getFullYear() > currentYear - 1) {
        return res.status(400).json({ error: 'Date of birth cannot be from the current year or in the future' });
      } else if (dob > today) {
        return res.status(400).json({ error: 'Date of birth cannot be in the future' });
      }
    }

    // Filter updateData to only include valid profile fields
    const validProfileFields: { [key: string]: boolean } = {
      fullName: typeof updateData.fullName !== 'undefined',
      phone: typeof updateData.phone !== 'undefined',
      dateOfBirth: typeof updateData.dateOfBirth !== 'undefined',
      nationality: typeof updateData.nationality !== 'undefined',
      countryOfResidence: typeof updateData.countryOfResidence !== 'undefined',
      maritalStatus: typeof updateData.maritalStatus !== 'undefined',
      taxId: typeof updateData.taxId !== 'undefined',
      isPep: typeof updateData.isPep !== 'undefined',
      pepDetails: typeof updateData.pepDetails !== 'undefined',
      hasBusiness: typeof updateData.hasBusiness !== 'undefined',
      businessName: typeof updateData.businessName !== 'undefined',
      businessType: typeof updateData.businessType !== 'undefined',
      businessIndustry: typeof updateData.businessIndustry !== 'undefined',
      businessTaxId: typeof updateData.businessTaxId !== 'undefined',
      email: typeof updateData.email !== 'undefined'
    };

    // Build the filtered update data
    const filteredUpdateData: { [key: string]: any } = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (validProfileFields.hasOwnProperty(key) && value !== undefined && value !== '') {
        // Handle date conversion
        if (key === 'dateOfBirth' && value && typeof value === 'string') {
          filteredUpdateData[key] = new Date(value);
        } else {
          filteredUpdateData[key] = value;
        }
      }
    }

    const profile = await prisma.profile.update({
      where: { userId },
      data: filteredUpdateData
    });

    res.json(profile);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message || 'Error updating profile' });
  }
};

export const getWallet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching wallet' });
  }
};

// Create deposit request
export const createDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { amount, paymentMethod, cryptoType, transactionHash, proofNotes, type } = req.body;

    if (amount === undefined || amount === null || paymentMethod === undefined || paymentMethod === null) {
      return res.status(400).json({ error: 'Amount and payment method are required' });
    }

    // Enforce $10 minimum for fiat deposits
    if (paymentMethod !== 'crypto' && Number(amount) < 10) {
      return res.status(400).json({ error: 'Minimum deposit amount is $10' });
    }

    if (paymentMethod === 'crypto' && !cryptoType) {
      return res.status(400).json({ error: 'Crypto type is required for crypto deposits' });
    }

    // Set initial status based on deposit type
    let initialStatus = 'pending';
    if (type === 'fiat_intent') {
      initialStatus = 'pending_matching';
    } else if (paymentMethod === 'crypto') {
      // For crypto deposits, set to awaiting_confirmation to require proof submission
      initialStatus = 'awaiting_confirmation';
    }

    const deposit = await prisma.deposit.create({
      data: {
        id: uuidv4(),
        userId,
        amount,
        paymentMethod,
        cryptoType: cryptoType || null,
        transactionHash: transactionHash || null,
        proofNotes: proofNotes || null,
        status: initialStatus,
        updatedAt: new Date()
      }
    });

    // Record deposit activity for admin notifications
    try {
      await prisma.activitylog.create({
        data: {
          id: uuidv4(),
          userId,
          action: 'deposit_created',
          details: {
            amount,
            paymentMethod,
            cryptoType: cryptoType || null,
            status: initialStatus,
            depositId: deposit.id
          },
          ipAddress: req.ip || null
        }
      });
    } catch (logError) {
      console.error('Error recording deposit activity:', logError);
    }

    res.status(201).json(deposit);
  } catch (error) {
    console.error('Error creating deposit:', error);
    res.status(500).json({ error: 'Error creating deposit request' });
  }
};

// Note: The assignSettlementDetails function was removed to prevent automatic assignment.
// Settlement details are now assigned manually by the admin in the admin panel.

// Endpoint to submit proof of payment
export const submitDepositProof = async (req: AuthRequest, res: Response) => {
  try {
    const depositId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { transactionHash, proofNotes } = req.body;

    // If files were uploaded, process them
    const files = req.files as any[] || [];

    // Store file paths if any files were uploaded
    const fileUrls: string[] = [];
    if (files && files.length > 0) {
      // In a real application, you'd save files to cloud storage (AWS S3, etc.)
      // For now, we'll just store the filenames as placeholder
      for (const file of files) {
        // Save file to storage and get URL
        // fileUrls.push(file.path); // This would be the actual file URL
        fileUrls.push(`/uploads/${file.filename}`); // Placeholder
      }
    }

    // Get existing settlement details
    const existingDeposit = await prisma.deposit.findUnique({
      where: { id: depositId },
    });

    // Prepare updated settlement details with proof files
    let updatedSettlementDetails = existingDeposit?.settlementDetails ? { ...existingDeposit.settlementDetails as any } : {};
    if (fileUrls.length > 0) {
      updatedSettlementDetails = {
        ...updatedSettlementDetails,
        proofFileUrls: fileUrls
      };
    }

    // Update deposit with proof information
    const updatedDeposit = await prisma.deposit.update({
      where: { id: depositId },
      data: {
        status: 'awaiting_confirmation',
        transactionHash: transactionHash || null,
        proofNotes: proofNotes || null,
        settlementDetails: updatedSettlementDetails,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Proof submitted successfully', deposit: updatedDeposit });
  } catch (error) {
    console.error('Error submitting deposit proof:', error);
    res.status(500).json({ error: 'Error submitting proof' });
  }
};

// Endpoint to get a specific deposit
export const getDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const depositId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user.userId;

    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId, userId },
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    res.json(deposit);
  } catch (error) {
    console.error('Error fetching deposit:', error);
    res.status(500).json({ error: 'Error fetching deposit' });
  }
};

// List own deposits
export const getDeposits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const deposits = await prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(deposits);
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({ error: 'Error fetching deposits' });
  }
};

// Create withdrawal request
export const createWithdrawal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { amount, withdrawalMethod, walletAddress, bankDetails } = req.body;

    if (!amount || !withdrawalMethod) {
      return res.status(400).json({ error: 'Amount and withdrawal method are required' });
    }

    // Check if user has sufficient balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        id: uuidv4(),
        userId,
        amount,
        withdrawalMethod,
        walletAddress: walletAddress || null,
        bankDetails: bankDetails || null,
        status: 'pending',
        updatedAt: new Date()
      }
    });

    // Record withdrawal activity for admin notifications
    try {
      await prisma.activitylog.create({
        data: {
          id: uuidv4(),
          userId,
          action: 'withdrawal_created',
          details: {
            amount,
            withdrawalMethod,
            hasWalletAddress: !!walletAddress,
            hasBankDetails: !!bankDetails,
            withdrawalId: withdrawal.id
          },
          ipAddress: req.ip || null
        }
      });
    } catch (logError) {
      console.error('Error recording withdrawal activity:', logError);
    }

    // Send admin notification
    try {
      await EmailService.sendAdminNotification(
        'New Withdrawal Request',
        `A user has requested a withdrawal of $${amount} via ${withdrawalMethod}.`,
        {
          withdrawalId: withdrawal.id,
          userId: userId,
          amount,
          withdrawalMethod,
          hasWalletAddress: !!walletAddress,
          hasBankDetails: !!bankDetails,
          timestamp: new Date().toISOString()
        }
      );
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
    }

    res.status(201).json(withdrawal);
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    res.status(500).json({ error: 'Error creating withdrawal request' });
  }
};

// List own transactions
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Error fetching transactions' });
  }
};

export const createActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { action, details } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const activityLog = await prisma.activitylog.create({
      data: {
        id: uuidv4(),
        userId,
        action,
        details,
        ipAddress: req.ip || null
      }
    });

    res.status(201).json(activityLog);
  } catch (error) {
    console.error('Error creating activity log:', error);
    res.status(500).json({ error: 'Error creating activity log' });
  }
};

export const createCopyTradeAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { traderName, assetSymbol, assetType, actionType, profitPercentage } = req.body;

    const attempt = await prisma.copytradeattempt.create({
      data: {
        id: uuidv4(),
        userId,
        traderName,
        assetSymbol,
        assetType,
        actionType,
        profitPercentage
      }
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Error creating copy trade attempt:', error);
    res.status(500).json({ error: 'Error creating copy trade attempt' });
  }
};

export const getUserCopyTradeAttempts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;

    const attempts = await prisma.copytradeattempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(attempts);
  } catch (error) {
    console.error('Error fetching copy trade attempts:', error);
    res.status(500).json({ error: 'Error fetching copy trade attempts' });
  }
};

export const deleteCopyTradeAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    // Verify that the attempt belongs to the user
    const attempt = await prisma.copytradeattempt.findUnique({
      where: { id }
    });

    if (!attempt || attempt.userId !== userId) {
      return res.status(404).json({ error: 'Copy trade attempt not found' });
    }

    await prisma.copytradeattempt.delete({
      where: { id }
    });

    res.json({ message: 'Copy trade attempt deleted successfully' });
  } catch (error) {
    console.error('Error deleting copy trade attempt:', error);
    res.status(500).json({ error: 'Error deleting copy trade attempt' });
  }
};

export const getGrantApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const grants = await prisma.grantapplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(grants);
  } catch (error) {
    console.error('Error fetching grant applications:', error);
    res.status(500).json({ error: 'Error fetching grant applications' });
  }
};

export const createGrantApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const {
      grantType,
      organizationName,
      organizationType,
      contactName,
      contactEmail,
      contactPhone,
      projectDescription,
      requestedAmount
    } = req.body;

    const grant = await prisma.grantapplication.create({
      data: {
        id: uuidv4(),
        userId,
        grantType,
        organizationName,
        organizationType,
        contactName,
        contactEmail,
        contactPhone,
        projectDescription,
        requestedAmount,
        status: 'pending',
        updatedAt: new Date()
      }
    });

    // Record grant application activity
    try {
      await prisma.activitylog.create({
        data: {
          id: uuidv4(),
          userId,
          action: 'grant_application_created',
          details: {
            grantType,
            organizationName,
            requestedAmount,
            applicationId: grant.id
          },
          ipAddress: req.ip || null
        }
      });
    } catch (logError) {
      console.error('Error recording grant activity:', logError);
    }

    res.status(201).json(grant);
  } catch (error) {
    console.error('Error creating grant application:', error);
    res.status(500).json({ error: 'Error creating grant application' });
  }
};

export const getWithdrawals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(withdrawals);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({ error: 'Error fetching withdrawals' });
  }
};

export const cancelDeposit = async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.user.userId;

  try {
    // Find the deposit
    const deposit = await prisma.deposit.findUnique({
      where: { id },
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Check if the deposit belongs to the user
    if (deposit.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Only allow cancellation for certain statuses (e.g., awaiting_payment, pending_matching)
    if (deposit.status !== 'awaiting_payment' && deposit.status !== 'pending_matching') {
      return res.status(400).json({
        error: 'Cannot cancel deposit in current status'
      });
    }

    // Update deposit status to cancelled
    const updatedDeposit = await prisma.deposit.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    res.json(updatedDeposit);
  } catch (error) {
    console.error('Error cancelling deposit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
