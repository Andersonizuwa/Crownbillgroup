import { Request, Response } from 'express';
import prisma from '../lib/prisma';

interface AuthRequest extends Request {
  user?: any;
}

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const profile = await prisma.profile.findUnique({
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

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const updateData = req.body;

    const profile = await prisma.profile.update({
      where: { userId },
      data: updateData
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Error updating profile' });
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
