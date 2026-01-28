import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('fullName').trim().escape().notEmpty().withMessage('Full name is required'),
  body('phone').optional().trim().escape(),
  body('nationality').optional().trim().escape(),
  body('countryOfResidence').optional().trim().escape(),
  body('taxId').optional().trim().escape(),
  body('businessName').optional().trim().escape(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateDeposit = [
  body('amount').isNumeric().custom(val => val > 0).withMessage('Amount must be greater than 0'),
  body('paymentMethod').trim().escape().notEmpty(),
  body('cryptoType').optional().trim().escape(),
  body('transactionHash').optional().trim().escape(),
  body('proofNotes').optional().trim().escape(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateWithdrawal = [
  body('amount').isNumeric().custom(val => val > 0).withMessage('Amount must be greater than 0'),
  body('withdrawalMethod').trim().escape().notEmpty(),
  body('walletAddress').optional().trim().escape(),
  body('bankDetails').optional().trim().escape(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateGrantApplication = [
  body('organizationName').trim().escape().notEmpty(),
  body('grantType').trim().escape().notEmpty(),
  body('requestedAmount').isNumeric().custom(val => val > 0),
  body('projectDescription').trim().escape().notEmpty(),
  body('contactName').trim().escape().notEmpty(),
  body('contactEmail').isEmail().normalizeEmail(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateAdminCreateUser = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('fullName').optional().trim().escape(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateAdminUpdateWallet = [
  body('balance').isNumeric().withMessage('Balance must be a number'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];


