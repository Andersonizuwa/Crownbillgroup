import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LiveTraderInterests from "@/components/LiveTraderInterests";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  DollarSign,
  BarChart3,
  Wallet,
  Clock,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const Crypto = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState<typeof cryptoData[0] | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [fundingDialogOpen, setFundingDialogOpen] = useState(false);
  const [buyAmount, setBuyAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  // Fetch wallet balance
  useEffect(() => {
    const fetchWallet = async () => {
      if (!user) {
        setIsLoadingWallet(false);
        return;
      }
      
      try {
        const { data } = await api.get('/user/wallet');
        if (data) {
          setWalletBalance(parseFloat(data.balance) || 0);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
      setIsLoadingWallet(false);
    };
    
    fetchWallet();
  }, [user]);

  // Fetch live crypto prices from backend
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data } = await api.get('/trades/prices?assetType=crypto');
        if (data) {
          const priceMap: Record<string, number> = {};
          data.forEach((item: any) => {
            priceMap[item.symbol] = item.price;
          });
          setLivePrices(priceMap);
        }
      } catch (error) {
        console.error('Error fetching live prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);
  const cryptoData = [
    { 
      symbol: "BTC", 
      name: "Bitcoin", 
      price: livePrices['BTC'] || 98234.56, 
      change: 1245.32, 
      changePercent: 1.30, 
      volume: "28.5B",
      marketCap: "1.91T",
      high24h: 98100.00,
      low24h: 95890.00,
      icon: "₿"
    },
    { 
      symbol: "ETH", 
      name: "Ethereum", 
      price: livePrices['ETH'] || 3456.78, 
      change: -45.23, 
      changePercent: -1.29, 
      volume: "15.2B",
      marketCap: "415.6B",
      high24h: 3520.00,
      low24h: 3410.00,
      icon: "Ξ"
    },
    { 
      symbol: "BNB", 
      name: "BNB", 
      price: livePrices['BNB'] || 612.34, 
      change: 23.67, 
      changePercent: 3.44, 
      volume: "1.8B",
      marketCap: "106.2B",
      high24h: 725.00,
      low24h: 685.00,
      icon: "◈"
    },
    { 
      symbol: "SOL", 
      name: "Solana", 
      price: livePrices['SOL'] || 198.45, 
      change: 8.56, 
      changePercent: 4.51, 
      volume: "3.2B",
      marketCap: "92.4B",
      high24h: 205.00,
      low24h: 188.00,
      icon: "◎"
    },
    { 
      symbol: "XRP", 
      name: "XRP", 
      price: livePrices['XRP'] || 2.34, 
      change: 0.12, 
      changePercent: 5.41, 
      volume: "8.9B",
      marketCap: "134.5B",
      high24h: 2.45,
      low24h: 2.18,
      icon: "✕"
    },
    { 
      symbol: "ADA", 
      name: "Cardano", 
      price: livePrices['ADA'] || 0.89, 
      change: -0.03, 
      changePercent: -2.61, 
      volume: "892M",
      marketCap: "39.2B",
      high24h: 1.18,
      low24h: 1.08,
      icon: "₳"
    },
    { 
      symbol: "DOGE", 
      name: "Dogecoin", 
      price: livePrices['DOGE'] || 0.23, 
      change: 0.02, 
      changePercent: 5.56, 
      volume: "2.1B",
      marketCap: "56.3B",
      high24h: 0.42,
      low24h: 0.35,
      icon: "Ð"
    },
    { 
      symbol: "AVAX", 
      name: "Avalanche", 
      price: livePrices['AVAX'] || 78.90, 
      change: 1.23, 
      changePercent: 2.98, 
      volume: "456M",
      marketCap: "17.2B",
      high24h: 44.00,
      low24h: 40.50,
      icon: "▲"
    },
    { 
      symbol: "DOT", 
      name: "Polkadot", 
      price: livePrices['DOT'] || 12.45, 
      change: -0.15, 
      changePercent: -1.65, 
      volume: "312M",
      marketCap: "12.8B",
      high24h: 9.20,
      low24h: 8.75,
      icon: "●"
    },
    { 
      symbol: "LINK", 
      name: "Chainlink", 
      price: livePrices['LINK'] || 23.45, 
      change: 0.89, 
      changePercent: 3.72, 
      volume: "678M",
      marketCap: "15.1B",
      high24h: 25.50,
      low24h: 23.90,
      icon: "⬡"
    },
  ];

  const [portfolioSummary, setPortfolioSummary] = useState({
    totalValue: 0,
    dayChange: 0,
    dayChangePercent: 0,
    totalGain: 0,
    totalGainPercent: 0,
  });

  // Fetch real portfolio summary data
  useEffect(() => {
    const fetchPortfolioSummary = async () => {
      if (!user) return;
      
      try {
        // Get wallet balance
        const walletResponse = await api.get('/user/wallet');
        const walletBalance = parseFloat(walletResponse.data.balance);
        
        // Get holdings with current prices
        const holdingsResponse = await api.get('/trades/holdings/prices');
        const holdings = holdingsResponse.data.holdings || [];
        
        // Filter for crypto holdings only
        const cryptoHoldings = holdings.filter((h: any) => h.assetType === 'crypto');
        
        // Calculate portfolio value
        const cryptoValue = cryptoHoldings.reduce((sum: number, h: any) => sum + parseFloat(h.currentValue), 0);
        const totalValue = walletBalance + cryptoValue;
        
        // Calculate today's change
        const dayChange = cryptoHoldings.reduce((sum: number, h: any) => {
          const change = parseFloat(h.currentValue) - parseFloat(h.totalCost);
          return sum + change;
        }, 0);
        
        const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;
        
        // Calculate total gain
        const totalGain = cryptoHoldings.reduce((sum: number, h: any) => {
          const gain = parseFloat(h.currentValue) - parseFloat(h.totalCost);
          return sum + gain;
        }, 0);
        
        const totalGainPercent = totalValue > 0 ? (totalGain / totalValue) * 100 : 0;
        
        setPortfolioSummary({
          totalValue,
          dayChange,
          dayChangePercent,
          totalGain,
          totalGainPercent,
        });
      } catch (error) {
        console.error('Error fetching portfolio summary:', error);
      }
    };
    
    fetchPortfolioSummary();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPortfolioSummary, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const filteredCrypto = cryptoData.filter(crypto => 
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuy = (crypto: typeof cryptoData[0]) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (walletBalance <= 0) {
      setFundingDialogOpen(true);
      return;
    }
    
    setSelectedCrypto(crypto);
    setBuyDialogOpen(true);
    setBuyAmount("");
  };

  const calculateCryptoAmount = () => {
    if (!selectedCrypto || !buyAmount) return "0";
    return (parseFloat(buyAmount) / selectedCrypto.price).toFixed(8);
  };

  const handleExecuteBuy = async () => {
    if (!selectedCrypto || !buyAmount || !user) return;

    const amount = parseFloat(buyAmount);
    if (amount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount",
      });
      return;
    }

    setIsExecutingTrade(true);

    try {
      const cryptoQty = parseFloat(calculateCryptoAmount());
      
      const { data } = await api.post('/trades/buy', {
        assetType: 'crypto',
        symbol: selectedCrypto.symbol,
        assetName: selectedCrypto.name,
        quantity: cryptoQty,
        price: selectedCrypto.price
      });

      toast({
        title: "Success!",
        description: data.message || `Crypto purchased successfully`,
      });

      // Refresh wallet balance
      const walletResponse = await api.get('/user/wallet');
      if (walletResponse.data) {
        setWalletBalance(parseFloat(walletResponse.data.balance) || 0);
      }

      // Close dialog and reset
      setBuyDialogOpen(false);
      setBuyAmount("");
      setSelectedCrypto(null);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error.response?.data?.error || error.message || "Failed to purchase crypto",
      });
    } finally {
      setIsExecutingTrade(false);
    }
  };

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Cryptocurrency</h1>
          <p className="text-muted-foreground mt-1">
            Buy and trade cryptocurrencies with real-time market data
          </p>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-sm">Portfolio Value</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${portfolioSummary.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">24h Change</span>
            </div>
            <p className={`text-2xl font-bold ${portfolioSummary.dayChange >= 0 ? "text-accent" : "text-destructive"}`}>
              {portfolioSummary.dayChange >= 0 ? "+" : ""}${portfolioSummary.dayChange.toLocaleString()}
              <span className="text-sm ml-1">
                ({portfolioSummary.dayChangePercent >= 0 ? "+" : ""}{portfolioSummary.dayChangePercent}%)
              </span>
            </p>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Total Gain/Loss</span>
            </div>
            <p className={`text-2xl font-bold ${portfolioSummary.totalGain >= 0 ? "text-accent" : "text-destructive"}`}>
              {portfolioSummary.totalGain >= 0 ? "+" : ""}${portfolioSummary.totalGain.toLocaleString()}
              <span className="text-sm ml-1">
                ({portfolioSummary.totalGainPercent >= 0 ? "+" : ""}{portfolioSummary.totalGainPercent}%)
              </span>
            </p>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Available Balance</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="card-elevated-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search cryptocurrencies..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              Live prices updating
            </div>
          </div>
        </div>

        {/* Live Trader Activity */}
        <LiveTraderInterests type="crypto" />

        {/* Crypto Market Table */}
        <div className="card-elevated-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Crypto Market</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time cryptocurrency prices and market data
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Asset</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Price</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">24h Change</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">24h High</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">24h Low</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Market Cap</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCrypto.map((crypto) => (
                  <tr key={crypto.symbol} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button className="text-muted-foreground hover:text-warning transition-colors">
                          <Star className="h-4 w-4" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-xl font-bold text-accent">
                          {crypto.icon}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground">{crypto.symbol}</span>
                          <p className="text-sm text-muted-foreground">{crypto.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-foreground">
                        ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        crypto.change >= 0 ? "text-accent" : "text-destructive"
                      }`}>
                        {crypto.change >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {crypto.changePercent >= 0 ? "+" : ""}{crypto.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground hidden md:table-cell">
                      ${crypto.high24h.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground hidden md:table-cell">
                      ${crypto.low24h.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground hidden lg:table-cell">
                      ${crypto.marketCap}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="accent" 
                        size="sm"
                        onClick={() => handleBuy(crypto)}
                      >
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Buy
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-8 bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Cryptocurrency prices are updated in real-time. Trading carries risk. Please trade responsibly.
          </p>
        </div>
      </div>

      {/* Buy Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Buy {selectedCrypto?.name}
              <span className="text-muted-foreground">({selectedCrypto?.symbol})</span>
            </DialogTitle>
            <DialogDescription>
              Current price: ${selectedCrypto?.price.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  className="pl-7"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                />
              </div>
            </div>
            {buyAmount && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">You will receive approximately:</p>
                <p className="text-xl font-bold text-foreground">
                  {calculateCryptoAmount()} {selectedCrypto?.symbol}
                </p>
              </div>
            )}
            <Button 
              variant="accent" 
              className="w-full"
              disabled={!buyAmount || parseFloat(buyAmount) <= 0 || isExecutingTrade}
              onClick={handleExecuteBuy}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {isExecutingTrade ? "Processing..." : `Buy ${selectedCrypto?.symbol}`}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Trading fee: 0.1% • Instant execution
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fund Account Required Dialog */}
      <Dialog open={fundingDialogOpen} onOpenChange={setFundingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Fund Your Account
            </DialogTitle>
            <DialogDescription>
              You need to add funds to your account before you can buy cryptocurrency.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-semibold text-foreground">Current Balance: $0.00</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add funds to unlock trading features
              </p>
            </div>
            <Link to="/fund-account" className="block">
              <Button variant="accent" className="w-full">
                <DollarSign className="mr-2 h-4 w-4" />
                Fund Account Now
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Crypto;