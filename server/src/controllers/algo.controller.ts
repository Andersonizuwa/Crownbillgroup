import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import EmailService from '../lib/email';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest extends Request {
    user?: any;
}

// POST /algo/apply — Submit or re-submit the eligibility application
export const submitApplication = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;

        const {
            ageRange, occupation, occupationOther, industry,
            annualIncome, netWorth, liquidCapital,
            investingDuration, assetsInvested, investmentKnowledge,
            checkFrequency, investorDescription,
            dropReaction, whatMattersMost, returnProfile,
            investmentHorizon,
            involvementLevel, communicationPref,
            allocationPercentage,
            primaryGoal, primaryConcern,
            holdsCrypto, cryptoNetWorthPct, cryptoTypes, cryptoStorage,
            cryptoExchanges, cryptoActivity, cryptoAllocation, cryptoDropReaction
        } = req.body;

        // Validate required fields
        const required = [
            ageRange, occupation, industry, annualIncome, netWorth, liquidCapital,
            investingDuration, assetsInvested, investmentKnowledge, checkFrequency,
            investorDescription, dropReaction, whatMattersMost, returnProfile,
            investmentHorizon, involvementLevel, communicationPref, allocationPercentage,
            primaryGoal, primaryConcern, holdsCrypto
        ];
        if (required.some(f => !f)) {
            return res.status(400).json({ error: 'All required fields must be filled' });
        }

        // Check if existing application is in a state that allows re-submission
        const existing = await prisma.proprietaryAlgorithmApplication.findUnique({
            where: { userId }
        });

        if (existing && existing.status === 'approved') {
            return res.status(400).json({ error: 'Your application has already been approved' });
        }
        if (existing && existing.status === 'pending') {
            return res.status(400).json({ error: 'Your application is already pending review' });
        }
        if (existing && existing.status === 'under_review') {
            return res.status(400).json({ error: 'Your application is currently under review' });
        }

        const applicationData = {
            ageRange, occupation, occupationOther: occupationOther || null, industry,
            annualIncome, netWorth, liquidCapital,
            investingDuration,
            assetsInvested: Array.isArray(assetsInvested) ? JSON.stringify(assetsInvested) : assetsInvested,
            investmentKnowledge, checkFrequency, investorDescription,
            dropReaction, whatMattersMost, returnProfile,
            investmentHorizon, involvementLevel, communicationPref,
            allocationPercentage, primaryGoal, primaryConcern,
            holdsCrypto,
            cryptoNetWorthPct: cryptoNetWorthPct || null,
            cryptoTypes: cryptoTypes ? (Array.isArray(cryptoTypes) ? JSON.stringify(cryptoTypes) : cryptoTypes) : null,
            cryptoStorage: cryptoStorage || null,
            cryptoExchanges: cryptoExchanges || null,
            cryptoActivity: cryptoActivity || null,
            cryptoAllocation: cryptoAllocation || null,
            cryptoDropReaction: cryptoDropReaction || null,
            status: 'pending' as const,
            reviewedAt: null,
            reviewedBy: null,
            adminNotes: null,
        };

        let application;
        if (existing) {
            // Re-submit (only allowed if rejected)
            application = await prisma.proprietaryAlgorithmApplication.update({
                where: { userId },
                data: applicationData
            });
        } else {
            application = await prisma.proprietaryAlgorithmApplication.create({
                data: { userId, ...applicationData }
            });
        }

        // Get user profile for notification
        const userProfile = await prisma.profile.findUnique({ where: { userId } });

        // Record activity for admin in-app notifications
        try {
            await prisma.activitylog.create({
                data: {
                    id: uuidv4(),
                    userId,
                    action: 'algo_application_created',
                    details: {
                        applicationId: application.id,
                        incomeBand: annualIncome,
                        netWorthBand: netWorth,
                        allocationPercentage,
                        investmentHorizon,
                    },
                    ipAddress: req.ip || null,
                },
            });
        } catch (logError) {
            console.error('Error recording algo application activity:', logError);
        }

        // Notify admin via email
        try {
            await EmailService.sendAdminNotification(
                'New Proprietary Algorithm Application',
                `A new eligibility application has been submitted for the CrownBill Proprietary Algorithm.`,
                {
                    userId,
                    userName: userProfile?.fullName || 'N/A',
                    email: userProfile?.email || 'N/A',
                    applicationId: application.id,
                    submittedAt: new Date().toISOString()
                }
            );
        } catch (emailError) {
            console.error('Error sending admin notification:', emailError);
        }

        res.status(201).json({ message: 'Application submitted successfully', application });
    } catch (error: any) {
        console.error('Error submitting algo application:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /algo/status — Get the current user's application status and granted access
export const getApplicationStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;

        const application = await prisma.proprietaryAlgorithmApplication.findUnique({
            where: { userId },
            include: {
                algoAccess: {
                    include: { plan: true }
                }
            }
        });

        if (!application) {
            return res.json({ status: 'not_applied', application: null, access: null });
        }

        res.json({
            status: application.status,
            application,
            access: application.algoAccess || null
        });
    } catch (error: any) {
        console.error('Error fetching algo status:', error);
        res.status(500).json({ error: error.message });
    }
};

// GET /algo/eligible-plans — Get the plan(s) this user has been granted access to
export const getEligiblePlans = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.userId;

        const access = await prisma.userAlgorithmAccess.findMany({
            where: { userId },
            include: { plan: true }
        });

        if (!access || access.length === 0) {
            return res.json([]);
        }

        // Return the plans with any custom duration applied
        const plans = access.map(a => ({
            ...a.plan,
            customDurationDays: a.customDurationDays,
            effectiveDurationDays: a.customDurationDays ?? a.plan.durationDays,
            accessId: a.id,
            grantedAt: a.grantedAt
        }));

        res.json(plans);
    } catch (error: any) {
        console.error('Error fetching eligible plans:', error);
        res.status(500).json({ error: error.message });
    }
};
