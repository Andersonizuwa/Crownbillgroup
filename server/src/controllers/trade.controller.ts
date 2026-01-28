import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { priceSimulator } from '../lib/priceSimulator';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest extends Request {
  user?: any;
}

// Execute a buy trade
export const executeBuyTrade = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { assetType, symbol, assetName, quantity, price } = req.body;

    // Validate inputs
    if (!assetType || !symbol || !assetName || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    if (quantityNum <= 0 || priceNum <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be positive' });
    }

    const totalAmount = quantityNum * priceNum;
    const fee = totalAmount * 0.001; // 0.1% trading fee
    const totalCost = totalAmount + fee;

    // Check wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet || parseFloat(wallet.balance.toString()) < totalCost) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: totalCost.toFixed(2),
        available: wallet ? parseFloat(wallet.balance.toString()).toFixed(2) : '0.00'
      });
    }

    // Execute trade in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { userId },
        data: { 
          balance: { 
            decrement: new Decimal(totalCost.toFixed(2))
          } 
        }
      });

      // Create trade record
      const trade = await tx.trade.create({
        data: {
          id: uuidv4(),
          userId,
          assetType,
          symbol,
          assetName,
          tradeType: 'buy',
          quantity: new Decimal(quantityNum.toFixed(8)),
          price: new Decimal(priceNum.toFixed(2)),
          totalAmount: new Decimal(totalAmount.toFixed(2)),
          fee: new Decimal(fee.toFixed(2)),
          status: 'executed'
        }
      });

      // Update or create holding
      const existingHolding = await tx.holding.findUnique({
        where: {
          userId_assetType_symbol: {
            userId,
            assetType,
            symbol
          }
        }
      });

      if (existingHolding) {
        // Update existing holding - calculate new average price
        const existingQty = parseFloat(existingHolding.quantity.toString());
        const existingAvgPrice = parseFloat(existingHolding.averagePrice.toString());
        const existingCost = existingQty * existingAvgPrice;
        
        const newQty = existingQty + quantityNum;
        const newCost = existingCost + totalAmount;
        const newAvgPrice = newCost / newQty;
        const newValue = newQty * priceNum;
        const profitLoss = newValue - newCost;
        const profitLossPct = (profitLoss / newCost) * 100;

        await tx.holding.update({
          where: {
            userId_assetType_symbol: {
              userId,
              assetType,
              symbol
            }
          },
          data: {
            quantity: new Decimal(newQty.toFixed(8)),
            averagePrice: new Decimal(newAvgPrice.toFixed(2)),
            currentPrice: new Decimal(priceNum.toFixed(2)),
            totalCost: new Decimal(newCost.toFixed(2)),
            currentValue: new Decimal(newValue.toFixed(2)),
            profitLoss: new Decimal(profitLoss.toFixed(2)),
            profitLossPct: new Decimal(profitLossPct.toFixed(2)),
            updatedAt: new Date()
          }
        });
      } else {
        // Create new holding
        const currentValue = quantityNum * priceNum;
        const profitLoss = 0;
        const profitLossPct = 0;

        await tx.holding.create({
          data: {
            id: uuidv4(),
            userId,
            assetType,
            symbol,
            assetName,
            quantity: new Decimal(quantityNum.toFixed(8)),
            averagePrice: new Decimal(priceNum.toFixed(2)),
            currentPrice: new Decimal(priceNum.toFixed(2)),
            totalCost: new Decimal(totalAmount.toFixed(2)),
            currentValue: new Decimal(currentValue.toFixed(2)),
            profitLoss: new Decimal(profitLoss.toFixed(2)),
            profitLossPct: new Decimal(profitLossPct.toFixed(2)),
            updatedAt: new Date()
          }
        });
      }

      // Create transaction record
      await tx.transaction.create({
        data: {
          id: uuidv4(),
          userId,
          type: 'trade_buy',
          amount: new Decimal(totalCost.toFixed(2)),
          description: `Bought ${quantityNum.toFixed(8)} ${symbol} at $${priceNum.toFixed(2)}`,
          status: 'completed',
          referenceId: trade.id
        }
      });

      return trade;
    });

    res.status(201).json({ 
      success: true, 
      trade: result,
      message: `Successfully bought ${quantityNum.toFixed(8)} ${symbol}`
    });

  } catch (error: any) {
    console.error('Error executing buy trade:', error);
    res.status(500).json({ error: error.message || 'Error executing trade' });
  }
};

// Execute a sell trade
export const executeSellTrade = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { assetType, symbol, assetName, quantity, price } = req.body;

    // Validate inputs
    if (!assetType || !symbol || !assetName || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const quantityNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    if (quantityNum <= 0 || priceNum <= 0) {
      return res.status(400).json({ error: 'Quantity and price must be positive' });
    }

    // Check if user has the holding
    const holding = await prisma.holding.findUnique({
      where: {
        userId_assetType_symbol: {
          userId,
          assetType,
          symbol
        }
      }
    });

    if (!holding) {
      return res.status(400).json({ error: `You don't own any ${symbol}` });
    }

    const availableQty = parseFloat(holding.quantity.toString());
    if (availableQty < quantityNum) {
      return res.status(400).json({ 
        error: 'Insufficient holdings',
        requested: quantityNum,
        available: availableQty
      });
    }

    const totalAmount = quantityNum * priceNum;
    const fee = totalAmount * 0.001; // 0.1% trading fee
    const netProceeds = totalAmount - fee;

    // Execute trade in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Add to wallet
      await tx.wallet.update({
        where: { userId },
        data: { 
          balance: { 
            increment: new Decimal(netProceeds.toFixed(2))
          } 
        }
      });

      // Create trade record
      const trade = await tx.trade.create({
        data: {
          id: uuidv4(),
          userId,
          assetType,
          symbol,
          assetName,
          tradeType: 'sell',
          quantity: new Decimal(quantityNum.toFixed(8)),
          price: new Decimal(priceNum.toFixed(2)),
          totalAmount: new Decimal(totalAmount.toFixed(2)),
          fee: new Decimal(fee.toFixed(2)),
          status: 'executed'
        }
      });

      // Update or delete holding
      const newQty = availableQty - quantityNum;
      
      if (newQty <= 0.00000001) { // Basically zero
        // Delete holding
        await tx.holding.delete({
          where: {
            userId_assetType_symbol: {
              userId,
              assetType,
              symbol
            }
          }
        });
      } else {
        // Update holding
        const avgPrice = parseFloat(holding.averagePrice.toString());
        const totalCost = avgPrice * newQty;
        const currentValue = newQty * priceNum;
        const profitLoss = currentValue - totalCost;
        const profitLossPct = (profitLoss / totalCost) * 100;

        await tx.holding.update({
          where: {
            userId_assetType_symbol: {
              userId,
              assetType,
              symbol
            }
          },
          data: {
            quantity: new Decimal(newQty.toFixed(8)),
            currentPrice: new Decimal(priceNum.toFixed(2)),
            currentValue: new Decimal(currentValue.toFixed(2)),
            profitLoss: new Decimal(profitLoss.toFixed(2)),
            profitLossPct: new Decimal(profitLossPct.toFixed(2)),
            totalCost: new Decimal(totalCost.toFixed(2)),
            updatedAt: new Date()
          }
        });
      }

      // Create transaction record
      await tx.transaction.create({
        data: {
          id: uuidv4(),
          userId,
          type: 'trade_sell',
          amount: new Decimal(netProceeds.toFixed(2)),
          description: `Sold ${quantityNum.toFixed(8)} ${symbol} at $${priceNum.toFixed(2)}`,
          status: 'completed',
          referenceId: trade.id
        }
      });

      return trade;
    });

    res.status(201).json({ 
      success: true, 
      trade: result,
      message: `Successfully sold ${quantityNum.toFixed(8)} ${symbol}`
    });

  } catch (error: any) {
    console.error('Error executing sell trade:', error);
    res.status(500).json({ error: error.message || 'Error executing trade' });
  }
};

// Get user's holdings
export const getHoldings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const holdings = await prisma.holding.findMany({
      where: { userId },
      orderBy: { currentValue: 'desc' }
    });

    res.json(holdings);
  } catch (error: any) {
    console.error('Error fetching holdings:', error);
    res.status(500).json({ error: 'Error fetching holdings' });
  }
};

// Get user's trade history
export const getTradeHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const { limit = 50 } = req.query;
    
    const trades = await prisma.trade.findMany({
      where: { userId },
      orderBy: { executedAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json(trades);
  } catch (error: any) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({ error: 'Error fetching trade history' });
  }
};

// Get current market prices
export const getCurrentPrices = async (req: Request, res: Response) => {
  try {
    const { assetType } = req.query;
    const prices = priceSimulator.getAllPrices(assetType as 'stock' | 'crypto' | undefined);
    res.json(prices);
  } catch (error: any) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Error fetching prices' });
  }
};

// Update user's holdings with current market prices
export const updateHoldingPrices = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    
    // Get all user holdings
    const holdings = await prisma.holding.findMany({
      where: { userId }
    });

    if (holdings.length === 0) {
      return res.json({ success: true, updated: 0, holdings: [] });
    }

    // Update each holding with current market price
    const updatedHoldings = await Promise.all(
      holdings.map(async (holding: any) => {
        const currentPrice = priceSimulator.getPrice(
          holding.assetType as 'stock' | 'crypto',
          holding.symbol
        );

        if (currentPrice === 0) return holding; // Skip if price not found

        const qty = parseFloat(holding.quantity.toString());
        const totalCost = parseFloat(holding.totalCost.toString());
        const currentValue = qty * currentPrice;
        const profitLoss = currentValue - totalCost;
        const profitLossPct = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

        return prisma.holding.update({
          where: { id: holding.id },
          data: {
            currentPrice: new Decimal(currentPrice.toFixed(2)),
            currentValue: new Decimal(currentValue.toFixed(2)),
            profitLoss: new Decimal(profitLoss.toFixed(2)),
            profitLossPct: new Decimal(profitLossPct.toFixed(2))
          }
        });
      })
    );

    res.json({ 
      success: true, 
      updated: updatedHoldings.length,
      holdings: updatedHoldings
    });
  } catch (error: any) {
    console.error('Error updating holding prices:', error);
    res.status(500).json({ error: 'Error updating prices' });
  }
};
