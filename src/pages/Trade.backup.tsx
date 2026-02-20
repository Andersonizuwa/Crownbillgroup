import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { priceSimulator } from '../lib/priceSimulator';
import { stockMarketAPI } from '../lib/stockMarketAPI';
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

// Get recent trades from all users
export const getRecentTrades = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent trades from all users
    const trades = await prisma.trade.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: { executedAt: 'desc' },
      take: parseInt(limit as string)
    });

    // Transform trades to trader activity format
    const traderActivities = await Promise.all(trades.map(async (trade) => {
      // Calculate profit based on holding data if available
      let profit = 0;

      // Calculate profit based on current market prices
      const currentPrice = priceSimulator.getPrice(
        trade.assetType as 'stock' | 'crypto',
        trade.symbol
      );

      if (currentPrice > 0) {
        const currentValue = parseFloat(trade.quantity.toString()) * currentPrice;
        const totalCost = parseFloat(trade.totalAmount.toString());
        profit = ((currentValue - totalCost) / totalCost) * 100; // percentage
      }

      // Get user's name from profile or create a default one
      let traderName = "Anonymous Trader";
      let avatarInitials = "AT";

      if (trade.user.profile && trade.user.profile.fullName) {
        const nameParts = trade.user.profile.fullName.trim().split(' ');
        if (nameParts.length >= 2) {
          // Format as "FirstName L." (first name and last initial)
          traderName = `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`;
          avatarInitials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (nameParts.length === 1) {
          // If only one name part, use first letter and a default
          traderName = nameParts[0];
          avatarInitials = nameParts[0][0].toUpperCase() + "T";
        }
      } else {
        // Generate a default name based on user ID
        const userIdSuffix = trade.userId.substring(trade.userId.length - 4);
        traderName = `User${userIdSuffix}`;
        avatarInitials = `U${userIdSuffix.substring(0, 1)}`;
      }

      // Calculate trader statistics
      const traderStats = await calculateTraderStats(trade.userId);

      return {
        id: trade.id,
        traderName,
        avatar: avatarInitials,
        asset: trade.assetName,
        assetSymbol: trade.symbol,
        action: trade.tradeType as "buy" | "sell",
        profit: parseFloat(profit.toFixed(2)),
        timeAgo: getTimeAgo(trade.executedAt),
        stats: traderStats
      };
    }));

    res.json(traderActivities);
  } catch (error: any) {
    console.error('Error fetching recent trades:', error);
    res.status(500).json({ error: 'Error fetching recent trades' });
  }
};

// Helper function to calculate trader statistics
const calculateTraderStats = async (userId: string) => {
  // Get all trades for this user
  const userTrades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { executedAt: 'desc' }
  });

  // Calculate basic stats
  const totalTrades = userTrades.length;

  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      avgProfit: 0,
      monthlyReturn: 0,
      weeklyTrades: [],
      recentTrades: []
    };
  }

  // Calculate win rate (positive profit trades)
  let winCount = 0;
  let totalProfit = 0;

  // For recent trades, we'll use the latest trades
  const recentTrades = [];

  for (let i = 0; i < userTrades.length && i < 3; i++) {
    const trade = userTrades[i]; // Latest trades first

    // Calculate profit for this trade
    const currentPrice = priceSimulator.getPrice(
      trade.assetType as 'stock' | 'crypto',
      trade.symbol
    );

    let tradeProfit = 0;
    if (currentPrice > 0) {
      const currentValue = parseFloat(trade.quantity.toString()) * currentPrice;
      const totalCost = parseFloat(trade.totalAmount.toString());
      tradeProfit = ((currentValue - totalCost) / totalCost) * 100; // percentage

      if (tradeProfit > 0) {
        winCount++;
      }
    }

    recentTrades.push({
      asset: trade.assetName,
      profit: parseFloat(tradeProfit.toFixed(2)),
      date: 'Today' // Could be based on actual trade date in production
    });
  }

  // Calculate overall stats from all trades
  for (const trade of userTrades) {
    const currentPrice = priceSimulator.getPrice(
      trade.assetType as 'stock' | 'crypto',
      trade.symbol
    );

    if (currentPrice > 0) {
      const currentValue = parseFloat(trade.quantity.toString()) * currentPrice;
      const totalCost = parseFloat(trade.totalAmount.toString());
      const tradeProfit = ((currentValue - totalCost) / totalCost) * 100; // percentage

      totalProfit += tradeProfit;
    }
  }

  const winRate = totalTrades > 0 ? Math.round((winCount / totalTrades) * 100) : 0;
  const avgProfit = totalTrades > 0 ? parseFloat((totalProfit / totalTrades).toFixed(2)) : 0;

  // Calculate weekly trades (mock data for demonstration)
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weeklyTrades = daysOfWeek.map(day => {
    return {
      day,
      profit: parseFloat((Math.random() * 10 - 2).toFixed(2)) // Random profit between -2% and 8%
    };
  });

  // Calculate monthly return (mock data)
  const monthlyReturn = parseFloat((avgProfit * 3).toFixed(2)); // Just a mock calculation

  return {
    totalTrades,
    winRate,
    avgProfit,
    monthlyReturn,
    weeklyTrades,
    recentTrades
  };
};

// Helper function to calculate time ago
const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) { // Less than 30 days
    const days = Math.floor(seconds / 86400);
    return `${days}d ago`;
  }

  const days = Math.floor(seconds / 86400);
  return `${days}d ago`;
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
