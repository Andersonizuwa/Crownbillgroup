import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';
import EmailService from '../lib/email';

import EmailService from '../lib/email';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const getClientIp = (req: Request) => {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.ip;
};

const recordLoginAttempt = async (
  userId: string,
  req: Request,
  success: boolean,
  failureReason?: string
) => {
  try {
    await prisma.loginhistory.create({
      data: {
        id: uuidv4(),
        userId,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || null,
        success,
        failureReason: failureReason || null
      }
    });
  } catch (err) {
    // Don't block login flow if logging fails
    console.error('Error recording login history:', err);
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    console.log("Register Request Body:", req.body);
    const { email, password, fullName, full_name } = req.body;
    const name = fullName || full_name;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

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
        updatedAt: new Date(),
        profile: {
          create: {
            id: uuidv4(),
            email,
            fullName: name,
            kycStatus: 'pending',
            updatedAt: new Date(),
          }
        },
        wallet: {
          create: {
            id: uuidv4(),
            balance: 0,
            updatedAt: new Date(),
          }
        },
        userrole: {
          create: {
            id: uuidv4(),
            role: 'user'
          }
        }
      },
      include: { userrole: true, profile: true }
    });

    // Record registration activity for admin notifications
    try {
      await prisma.activitylog.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          action: 'user_registered',
          details: {
            email: user.email,
            fullName: user.profile?.fullName || name || null
          },
          ipAddress: getClientIp(req)
        }
      });
    } catch (logError) {
      console.error('Error recording registration activity:', logError);
    }

    // Send admin notification
    try {
      await EmailService.sendAdminNotification(
        'New User Registration',
        `A new user has registered on CrownBillGroup: ${user.email}`,
        {
          userId: user.id,
          email: user.email,
          fullName: user.profile?.fullName || name || 'N/A',
          timestamp: new Date().toISOString()
        }
      );
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
    }

    const token = jwt.sign(
      { userId: user.id, roles: user.userrole.map(r => r.role) },
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
        roles: user.userrole.map(r => r.role),
        fullName: user.profile?.fullName
      },
      isAdmin: user.userrole.some(r => r.role === 'admin')
    });
  } catch (error: any) {
    console.error("Registration Error Details:", error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { userrole: true, profile: true }
    });

    if (!user || !user.passwordHash) {
      if (user) {
        await recordLoginAttempt(user.id, req, false, 'Invalid credentials');
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      await recordLoginAttempt(user.id, req, false, 'Invalid credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const roles = (user as any).userrole.map((r: any) => r.role);

    const token = jwt.sign(
      { userId: user.id, roles },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Treat either explicit admin role or the primary admin email as admin
    const isAdmin = roles.includes('admin') || user.email === 'admin@crownbill.com';

    // Record successful login
    await recordLoginAttempt(user.id, req, true);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        roles,
        fullName: user.profile?.fullName
      },
      isAdmin
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getLoginHistory = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const history = await prisma.loginhistory.findMany({
      where: { userId: req.user.userId },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    res.json(history);
  } catch (error: any) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ error: 'Error fetching login history' });
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


