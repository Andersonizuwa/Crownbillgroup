import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, full_name } = req.body;
    const name = fullName || full_name;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        passwordHash,
        profile: {
          create: {
            id: uuidv4(),
            email,
            fullName: name,
            kycStatus: 'pending',
          }
        },
        wallet: {
          create: {
            id: uuidv4(),
            balance: 0,
          }
        },
        roles: {
          create: {
            id: uuidv4(),
            role: 'user'
          }
        }
      },
      include: { roles: true }
    });

    const token = jwt.sign(
      { userId: user.id, roles: user.roles.map(r => r.role) },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.status(201).json({ 
      message: 'User registered successfully', 
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        roles: user.roles.map(r => r.role) 
      },
      isAdmin: user.roles.some(r => r.role === 'admin')
    });
  } catch (error: any) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { roles: true }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
  { userId: user.id, roles: user.roles.map((r: any) => r.role) },
  JWT_SECRET,
  { expiresIn: '24h' }
);

    const isAdmin = user.roles.some((r: any) => r.role === 'admin');

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({ 
      message: 'Logged in successfully', 
      user: { id: user.id, email: user.email, roles: 
        user.roles.map((r: any) => r.role) },
      isAdmin
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const magicLink = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: {
        magicLinkToken: token,
        magicLinkExpires: expires
      }
    });

    // In a real app, send email here
    console.log(`Magic link for ${email}: ${process.env.FRONTEND_URL}/verify-magic-link?token=${token}`);

    res.json({ message: 'Magic link sent to your email' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error processing magic link' });
  }
};

export const resetPasswordRequest = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.passwordResets.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        email,
        token: token,
        expiresAt: expires
      }
    });

    // In a real app, send email here
    console.log(`Reset link for ${email}: ${process.env.FRONTEND_URL}/reset-password?token=${token}`);

    res.json({ message: 'Password reset link sent' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error processing reset request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const resetRequest = await prisma.passwordResets.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetRequest) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRequest.userId },
        data: { passwordHash }
      }),
      prisma.passwordResets.update({
        where: { id: resetRequest.id },
        data: { used: true }
      })
    ]);

    res.json({ message: 'Password reset successful' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error resetting password' });
  }
};
