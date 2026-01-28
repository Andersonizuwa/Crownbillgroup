// Price Simulator - Simulates realistic market price movements
// In production, this would connect to real market data APIs

interface AssetPrice {
  symbol: string;
  assetType: 'stock' | 'crypto';
  basePrice: number;
  currentPrice: number;
  lastUpdate: Date;
}

class PriceSimulator {
  private prices: Map<string, AssetPrice> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializePrices();
  }

  private initializePrices() {
    // Initialize stock prices
    const stocks = [
      { symbol: 'AAPL', basePrice: 189.45 },
      { symbol: 'GOOGL', basePrice: 178.35 },
      { symbol: 'MSFT', basePrice: 423.56 },
      { symbol: 'AMZN', basePrice: 195.89 },
      { symbol: 'NVDA', basePrice: 875.42 },
      { symbol: 'META', basePrice: 565.78 },
      { symbol: 'TSLA', basePrice: 248.56 },
      { symbol: 'BRK.B', basePrice: 445.23 },
      { symbol: 'JPM', basePrice: 198.45 },
      { symbol: 'V', basePrice: 278.92 },
      { symbol: 'JNJ', basePrice: 156.78 },
      { symbol: 'WMT', basePrice: 165.34 },
    ];

    // Initialize crypto prices
    const cryptos = [
      { symbol: 'BTC', basePrice: 98234.56 },
      { symbol: 'ETH', basePrice: 3456.78 },
      { symbol: 'BNB', basePrice: 612.34 },
      { symbol: 'SOL', basePrice: 198.45 },
      { symbol: 'XRP', basePrice: 2.34 },
      { symbol: 'ADA', basePrice: 0.89 },
      { symbol: 'DOGE', basePrice: 0.23 },
      { symbol: 'AVAX', basePrice: 78.90 },
      { symbol: 'DOT', basePrice: 12.45 },
      { symbol: 'MATIC', basePrice: 1.67 },
      { symbol: 'LINK', basePrice: 23.45 },
      { symbol: 'UNI', basePrice: 15.67 },
    ];

    stocks.forEach(stock => {
      this.prices.set(`stock_${stock.symbol}`, {
        symbol: stock.symbol,
        assetType: 'stock',
        basePrice: stock.basePrice,
        currentPrice: stock.basePrice,
        lastUpdate: new Date()
      });
    });

    cryptos.forEach(crypto => {
      this.prices.set(`crypto_${crypto.symbol}`, {
        symbol: crypto.symbol,
        assetType: 'crypto',
        basePrice: crypto.basePrice,
        currentPrice: crypto.basePrice,
        lastUpdate: new Date()
      });
    });
  }

  // Simulate price movements
  private updatePrices() {
    this.prices.forEach((asset, key) => {
      // Crypto has higher volatility than stocks
      const volatility = asset.assetType === 'crypto' ? 0.02 : 0.005; // 2% vs 0.5%
      
      // Random walk with mean reversion
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const meanReversion = (asset.basePrice - asset.currentPrice) * 0.001; // Slow drift back to base
      
      const priceChange = asset.currentPrice * (randomChange + meanReversion);
      let newPrice = asset.currentPrice + priceChange;
      
      // Keep prices within reasonable bounds (±30% of base)
      const maxPrice = asset.basePrice * 1.30;
      const minPrice = asset.basePrice * 0.70;
      newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
      
      this.prices.set(key, {
        ...asset,
        currentPrice: newPrice,
        lastUpdate: new Date()
      });
    });
  }

  // Start price simulation
  start(intervalMs: number = 5000) {
    if (this.intervalId) return;
    
    console.log('🔄 Price simulator started');
    this.intervalId = setInterval(() => {
      this.updatePrices();
    }, intervalMs);
  }

  // Stop price simulation
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏸️  Price simulator stopped');
    }
  }

  // Get current price for an asset
  getPrice(assetType: 'stock' | 'crypto', symbol: string): number {
    const key = `${assetType}_${symbol}`;
    const asset = this.prices.get(key);
    return asset ? asset.currentPrice : 0;
  }

  // Get all prices for a specific asset type
  getAllPrices(assetType?: 'stock' | 'crypto'): Array<{ symbol: string; price: number; assetType: string }> {
    const prices: Array<{ symbol: string; price: number; assetType: string }> = [];
    
    this.prices.forEach((asset) => {
      if (!assetType || asset.assetType === assetType) {
        prices.push({
          symbol: asset.symbol,
          price: asset.currentPrice,
          assetType: asset.assetType
        });
      }
    });
    
    return prices;
  }

  // Reset all prices to base prices
  reset() {
    this.prices.forEach((asset, key) => {
      this.prices.set(key, {
        ...asset,
        currentPrice: asset.basePrice,
        lastUpdate: new Date()
      });
    });
  }
}

// Singleton instance
export const priceSimulator = new PriceSimulator();
