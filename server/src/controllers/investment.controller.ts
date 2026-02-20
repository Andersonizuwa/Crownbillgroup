import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest extends Request {
    user?: any;
}

// Get all active investment plans
export const getPlans = async (req: Request, res: Response) => {
    try {
        const plans = await prisma.investmentPlan.findMany({
            where: { isActive: true },
            orderBy: { durationDays: 'asc' }
        });
        res.json(plans);
    } catch (error) {
        console.error('Error fetching investment plans:', error);
        res.status(500).json({ error: `Error fetching investment plans: ${(error as Error).message}` });
    }
};

// Create a new investment
export const createInvestment = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const { planId, amount } = req.body;

        if (!planId || !amount) {
            return res.status(400).json({ error: 'Plan ID and amount are required' });
        }

        const plan = await prisma.investmentPlan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return res.status(404).json({ error: 'Investment plan not found' });
        }

        const investAmount = Number(amount);

        if (investAmount < Number(plan.minAmount) || investAmount > Number(plan.maxAmount)) {
            return res.status(400).json({
                error: `Investment amount must be between $${plan.minAmount} and $${plan.maxAmount}`
            });
        }

        // Check wallet balance
        const wallet = await prisma.wallet.findUnique({
            where: { userId }
        });

        if (!wallet || Number(wallet.balance) < investAmount) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }

        // If this user has proprietary-algorithm access to this plan, respect any custom duration
        const algoAccess = await prisma.userAlgorithmAccess.findFirst({
            where: {
                userId,
                planId
            }
        });

        const effectiveDurationDays = algoAccess?.customDurationDays ?? plan.durationDays;

        // Calculate end date using effective duration (plan default or per-user override)
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + effectiveDurationDays);

        // Calculate expected return
        const expectedReturn = (investAmount * Number(plan.returnPercentage)) / 100;

        // Execute transaction using a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Deduct from wallet
            await tx.wallet.update({
                where: { userId },
                data: {
                    balance: {
                        decrement: investAmount
                    }
                }
            });

            // Create transaction record
            await tx.transaction.create({
                data: {
                    id: uuidv4(),
                    userId,
                    type: 'trade_buy', // Using trade_buy or closest type
                    amount: investAmount,
                    description: `Investment in ${plan.name}`,
                    status: 'completed'
                }
            });

            // Create investment record
            const investment = await tx.userInvestment.create({
                data: {
                    id: uuidv4(),
                    userId,
                    planId,
                    amount: investAmount,
                    startDate,
                    endDate,
                    status: 'ACTIVE',
                    expectedReturn,
                    // Persist custom duration if this investment is tied to a proprietary access override
                    customDurationDays: algoAccess?.customDurationDays ?? null
                }
            });

            return investment;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating investment:', error);
        res.status(500).json({ error: `Error processing investment: ${(error as Error).message}` });
    }
};

// Get user's investments
export const getUserInvestments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;
        const investments = await prisma.userInvestment.findMany({
            where: { userId },
            include: {
                plan: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(investments);
    } catch (error) {
        console.error('Error fetching user investments:', error);
        res.status(500).json({ error: `Error fetching investments: ${(error as Error).message}` });
    }
};
