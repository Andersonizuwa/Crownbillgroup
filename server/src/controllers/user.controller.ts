import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import Flutterwave from 'flutterwave-node-v3';

interface AuthRequest extends Request {
  user?: any;
}

// Initialize Flutterwave
const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY!, 
  process.env.FLUTTERWAVE_SECRET_KEY!
);

export const initializeFlutterwavePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, email } = req.body;
    
    if (!amount || !email) {
      return res.status(400).json({ error: 'Amount and email are required' });
    }
    
    // Prepare Flutterwave payment data
    const paymentData = {
      tx_ref: `deposit_${req.user.userId}_${Date.now()}`,
      amount: parseFloat(String(amount)),
      currency: 'USD',
      redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/fund-account`,
      customer: {
        email: email,
        name: req.user.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : 'User',
      },
      customizations: {
        title: 'Fund Your Account',
        description: 'Deposit to your investment account',
      },
    };
    
    // Initialize the transaction
    const response = await flw.Payment.initialize(paymentData);
    
    res.json({
      status: 'success',
      message: 'Payment initialized successfully',
      data: response,
    });
  } catch (error: any) {
    console.error('Error initializing Flutterwave payment:', error);
    res.status(500).json({ error: error.message || 'Error initializing payment' });
  }
};

export const handleFlutterwaveWebhook = async (req: Request, res: Response) => {
  try {
    const secret_hash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
    const signature = req.headers['verif-hash'];
    
    // Check if the signature matches the secret hash
    if (!signature || signature !== secret_hash) {
      return res.status(401).send('Unauthorized');
    }
    
    // Process the webhook payload
    const payload = req.body;
    
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const tx_ref = payload.data.tx_ref;
      const flw_ref = payload.data.flw_ref;
      const amount = payload.data.amount;
      const userId = payload.data.meta?.userId || payload.data.customer.id; // Extract user ID
      
      // Find the deposit record by transaction reference
      // Initially, the transactionHash will be null, so we'll look for the most recent flutterwave deposit
      const deposit = await prisma.deposit.findFirst({
        where: {
          amount: parseFloat(String(payload.data.amount)),
          userId: payload.data.meta?.userId || payload.data.customer.id,
          paymentMethod: 'flutterwave',
          transactionHash: null // Initially null when created via Flutterwave
        },
        orderBy: {
          createdAt: 'desc' // Get the most recent one
        }
      });
      
      if (deposit) {
        // Update the deposit with the transaction reference and approve it
        await prisma.deposit.update({
          where: { id: deposit.id },
          data: { 
            transactionHash: flw_ref, // Update with actual Flutterwave reference
            status: 'approved' 
          }
        });
        
        // Add funds to user's wallet
        const wallet = await prisma.wallet.findUnique({
          where: { userId: deposit.userId }
        });
        
        if (wallet) {
          await prisma.wallet.update({
            where: { userId: deposit.userId },
            data: { balance: { increment: deposit.amount } }
          });
        } else {
          // Create wallet if it doesn't exist
          await prisma.wallet.create({
            data: {
              id: uuidv4(),
              userId: deposit.userId,
              balance: deposit.amount,
              currency: 'USD',
              updatedAt: new Date()
            }
          });
        }
        
        // Create a transaction record
        await prisma.transaction.create({
          data: {
            id: uuidv4(),
            userId: deposit.userId,
            type: 'deposit',
            amount: deposit.amount,
            description: `Deposit via Flutterwave: ${flw_ref}`,
            status: 'completed',
            referenceId: flw_ref
          }
        });
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling Flutterwave webhook:', error);
    res.status(500).send('Error processing webhook');
  }
};

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
    const { amount, paymentMethod, cryptoType, transactionHash, proofNotes } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: 'Amount and payment method are required' });
    }

    if (paymentMethod === 'crypto' && !cryptoType) {
      return res.status(400).json({ error: 'Crypto type is required for crypto deposits' });
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
        status: 'pending',
        updatedAt: new Date()
      }
    });

    res.status(201).json(deposit);
  } catch (error) {
    console.error('Error creating deposit:', error);
    res.status(500).json({ error: 'Error creating deposit request' });
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
