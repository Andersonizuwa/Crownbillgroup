import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import EmailService from '../lib/email';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response) => {
  try {
    console.log("Register Request Body:", req.body);
    const { 
      email, 
      password, 
      fullName, 
      dateOfBirth,
      phone,
      maritalStatus,
      nationality,
      countryOfResidence,
      taxId,
      isPEP,
      pepDetails,
      hasBusiness,
      businessName,
      businessType,
      businessIndustry,
      businessTaxId,
      idType
    } = req.body;

    // Validate date of birth is not from current year or in the future
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      const currentYear = today.getFullYear();
      
      if (dob.getFullYear() > currentYear - 1) {
        return res.status(400).json({ error: 'Date of birth cannot be from the current year or in the future' });
      } else if (dob > today) {
        return res.status(400).json({ error: 'Date of birth cannot be in the future' });
      }
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const idDocumentFile = files?.['idDocument']?.[0];
    const addressDocumentFile = files?.['addressDocument']?.[0];

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
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
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            phone,
            maritalStatus,
            nationality,
            countryOfResidence,
            taxId,
            isPep: isPEP === 'yes' || isPEP === 'true' || isPEP === true,
            pepDetails,
            hasBusiness: hasBusiness === 'true' || hasBusiness === true,
            businessName,
            businessType,
            businessIndustry,
            businessTaxId,
            kycStatus: 'pending',
            accountStatus: 'pending',
            updatedAt: new Date()
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
        },
        kycdocument: {
          create: [
            ...(idDocumentFile ? [{
              id: uuidv4(),
              documentType: (idType as any) || 'passport',
              fileUrl: `/uploads/${idDocumentFile.filename}`,
              status: 'pending' as any
            }] : []),
            ...(addressDocumentFile ? [{
              id: uuidv4(),
              documentType: 'utility_bill' as any,
              fileUrl: `/uploads/${addressDocumentFile.filename}`,
              status: 'pending' as any
            }] : [])
          ]
        }
      },
      include: { userrole: true, profile: true }
    });

    const token = jwt.sign(
      { userId: user.id, roles: user.userrole.map(r => r.role) },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict' // Changed to strict for better security
    });

    // Send welcome email
    await EmailService.sendWelcomeEmail(user.email, user.profile?.fullName || 'User');

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
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    const user = await prisma.user.findUnique({
      where: { email },
      include: { userrole: true, profile: true }
    });

    if (!user || !user.passwordHash) {
      console.warn(`Failed login attempt for email: ${email} - User not found`);
      // Log failed login attempt
      /*await prisma.loginhistory.create({
        data: {
          userId: user?.id || 'unknown',
          ipAddress,
          userAgent,
          success: false,
          failureReason: 'User not found'
        }
      });*/
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      console.warn(`Failed login attempt for email: ${email} - Incorrect password`);
      // Log failed login attempt
      /*await prisma.loginhistory.create({
        data: {
          userId: user.id,
          ipAddress,
          userAgent,
          success: false,
          failureReason: 'Incorrect password'
        }
      });*/
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Log successful login
    /*await prisma.loginhistory.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        success: true
      }
    });*/

    const token = jwt.sign(
  { userId: user.id, roles: user.userrole.map((r: any) => r.role) },
  JWT_SECRET,
  { expiresIn: '24h' }
);

    const isAdmin = user.userrole.some((r: any) => r.role === 'admin');

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict' // Changed to strict for better security
    });

    res.json({ 
      message: 'Logged in successfully', 
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        roles: user.userrole.map((r: any) => r.role),
        fullName: user.profile?.fullName
      },
      isAdmin
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    if (!token) return res.status(401).json({ error: 'Token missing' });

    const payload = jwt.verify(token, JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { userrole: true, profile: true }
    });

    if (!user) return res.status(401).json({ error: 'Invalid token' });

    const isAdmin = user.userrole.some((r: any) => r.role === 'admin');

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        roles: user.userrole.map((r: any) => r.role),
        fullName: user.profile?.fullName,
      },
      isAdmin
    });
  } catch (error: any) {
    return res.status(401).json({ error: 'Invalid or expired token' });
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

    const magicLink = `${process.env.FRONTEND_URL || 'https://yoursite.com'}/verify-magic-link?token=${token}`;

    // In a real app, send email here - for now we'll just log
    console.log(`Magic link for ${email}: ${magicLink}`);

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

    await prisma.passwordresets.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        email,
        token: token,
        expiresAt: expires,
        updatedAt: new Date()
      }
    });

    const resetLink = `${process.env.FRONTEND_URL || 'https://yoursite.com'}/reset-password?token=${token}`;

    // Send password reset email
    await EmailService.sendPasswordResetEmail(email, resetLink);

    res.json({ message: 'Password reset link sent' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error processing reset request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const resetRequest = await prisma.passwordresets.findFirst({
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
      prisma.passwordresets.update({
        where: { id: resetRequest.id },
        data: { used: true }
      }),
      prisma.passwordresets.updateMany({
        where: { userId: resetRequest.userId, used: false, NOT: { id: resetRequest.id } },
        data: { used: true }
      })
    ]);

    res.json({ message: 'Password reset successful' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error resetting password' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Return success regardless to prevent user enumeration
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.passwordresets.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        email,
        token,
        expiresAt: expires,
        updatedAt: new Date()
      }
    });

    const resetLink = `${process.env.FRONTEND_URL || 'https://yoursite.com'}/reset-password?token=${token}`;

    // Send password reset email
    await EmailService.sendPasswordResetEmail(email, resetLink);

    return res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Error processing forgot password request' });
  }
};

interface AuthRequest extends Request {
  user?: any;
}

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
};


export const getLoginHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    
    // Fetch actual login history from the database
    const loginHistory = await prisma.loginhistory.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 20 // Limit to last 20 login attempts
    });
    
    // Transform the data to match the expected format
    const transformedHistory = loginHistory.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      ip: record.ipAddress,
      userAgent: record.userAgent,
      success: record.success,
      failureReason: record.failureReason
    }));
    
    res.json(transformedHistory);
  } catch (error: any) {
    console.error('Get login history error:', error);
    res.status(500).json({ error: 'Error fetching login history' });
  }
};
