import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LiveTraderInterests from "@/components/LiveTraderInterests";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  BarChart3,
  RefreshCw,
  Activity,
  Wallet,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const Trade = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStock, setSelectedStock] = useState<typeof marketData[0] | null>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [fundingDialogOpen, setFundingDialogOpen] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
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

  // Fetch live prices from backend
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data } = await api.get('/trades/prices?assetType=stock');
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

  // Update timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const marketData = [
    { 
      symbol: "AAPL", 
      name: "Apple Inc.", 
      price: livePrices['AAPL'] || 189.45, 
      change: 2.34, 
      changePercent: 1.25, 
      volume: "45.2M",
      marketCap: "2.95T",
      pe: 31.2,
      high52w: 199.62,
      low52w: 164.08,
      avgVolume: "48.3M",
      dividend: 0.96,
      sector: "Technology"
    },
    { 
      symbol: "GOOGL", 
      name: "Alphabet Inc.", 
      price: livePrices['GOOGL'] || 178.35, 
      change: -1.23, 
      changePercent: -0.69, 
      volume: "23.1M",
      marketCap: "2.21T",
      pe: 25.8,
      high52w: 191.75,
      low52w: 129.40,
      avgVolume: "25.6M",
      dividend: 0,
      sector: "Technology"
    },
    { 
      symbol: "MSFT", 
      name: "Microsoft Corp.", 
      price: livePrices['MSFT'] || 423.56, 
      change: 5.67, 
      changePercent: 1.36, 
      volume: "32.8M",
      marketCap: "3.15T",
      pe: 36.4,
      high52w: 430.82,
      low52w: 309.45,
      avgVolume: "28.9M",
      dividend: 3.00,
      sector: "Technology"
    },
    { 
      symbol: "AMZN", 
      name: "Amazon.com Inc.", 
      price: livePrices['AMZN'] || 195.89, 
      change: -2.45, 
      changePercent: -1.23, 
      volume: "28.9M",
      marketCap: "2.03T",
      pe: 62.1,
      high52w: 201.20,
      low52w: 144.05,
      avgVolume: "35.2M",
      dividend: 0,
      sector: "Consumer"
    },
    { 
      symbol: "NVDA", 
      name: "NVIDIA Corp.", 
      price: livePrices['NVDA'] || 875.42, 
      change: 32.18, 
      changePercent: 3.82, 
      volume: "52.3M",
      marketCap: "2.16T",
      pe: 65.3,
      high52w: 974.00,
      low52w: 403.11,
      avgVolume: "45.8M",
      dividend: 0.16,
      sector: "Technology"
    },
    { 
      symbol: "META", 
      name: "Meta Platforms", 
      price: livePrices['META'] || 565.78, 
      change: 8.76, 
      changePercent: 1.57, 
      volume: "18.7M",
      marketCap: "1.44T",
      pe: 28.9,
      high52w: 583.10,
      low52w: 296.71,
      avgVolume: "16.2M",
      dividend: 0,
      sector: "Technology"
    },
    { 
      symbol: "TSLA", 
      name: "Tesla Inc.", 
      price: livePrices['TSLA'] || 248.56, 
      change: -5.32, 
      changePercent: -2.10, 
      volume: "98.5M",
      marketCap: "790.3B",
      pe: 72.4,
      high52w: 299.29,
      low52w: 138.80,
      avgVolume: "112.4M",
      dividend: 0,
      sector: "Automotive"
    },
    { 
      symbol: "BRK.B", 
      name: "Berkshire Hathaway", 
      price: livePrices['BRK.B'] || 445.23, 
      change: 2.15, 
      changePercent: 0.49, 
      volume: "3.2M",
      marketCap: "980.5B",
      pe: 9.8,
      high52w: 449.25,
      low52w: 344.10,
      avgVolume: "3.8M",
      dividend: 0,
      sector: "Financials"
    },
    { 
      symbol: "JPM", 
      name: "JPMorgan Chase", 
      price: livePrices['JPM'] || 198.45, 
      change: 1.87, 
      changePercent: 0.95, 
      volume: "8.9M",
      marketCap: "570.2B",
      pe: 11.2,
      high52w: 205.88,
      low52w: 143.10,
      avgVolume: "9.4M",
      dividend: 4.60,
      sector: "Financials"
    },
    { 
      symbol: "V", 
      name: "Visa Inc.", 
      price: livePrices['V'] || 278.92, 
      change: 3.21, 
      changePercent: 1.16, 
      volume: "6.7M",
      marketCap: "562.8B",
      pe: 30.5,
      high52w: 290.96,
      low52w: 252.70,
      avgVolume: "7.1M",
      dividend: 2.08,
      sector: "Financials"
    },
    { 
      symbol: "JNJ", 
      name: "Johnson & Johnson", 
      price: livePrices['JNJ'] || 156.78, 
      change: -0.45, 
      changePercent: -0.29, 
      volume: "7.8M",
      marketCap: "378.5B",
      pe: 24.6,
      high52w: 175.97,
      low52w: 143.13,
      avgVolume: "8.2M",
      dividend: 4.76,
      sector: "Healthcare"
    },
    { 
      symbol: "WMT", 
      name: "Walmart Inc.", 
      price: livePrices['WMT'] || 165.34, 
      change: 1.23, 
      changePercent: 0.75, 
      volume: "12.4M",
      marketCap: "445.2B",
      pe: 27.8,
      high52w: 169.94,
      low52w: 147.00,
      avgVolume: "11.8M",
      dividend: 2.28,
      sector: "Consumer"
    },
  ];

  const [portfolioSummary, setPortfolioSummary] = useState({
    totalValue: 0,
    dayChange: 0,
    dayChangePercent: 0,
    totalGain: 0,
    totalGainPercent: 0,
    buyingPower: 0
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
        
        // Calculate portfolio value
        const holdingsValue = holdings.reduce((sum: number, h: any) => sum + parseFloat(h.currentValue), 0);
        const totalValue = walletBalance + holdingsValue;
        
        // Calculate today's change (mock calculation based on previous day)
        // In a real app, this would come from comparing with yesterday's close
        const dayChange = holdings.reduce((sum: number, h: any) => {
          const change = parseFloat(h.currentValue) - parseFloat(h.totalCost);
          return sum + change;
        }, 0);
        
        const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;
        
        // Calculate total gain
        const totalGain = holdings.reduce((sum: number, h: any) => {
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
          buyingPower: walletBalance
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

  const filteredStocks = marketData.filter(stock => 
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTrade = (stock: typeof marketData[0], type: "buy" | "sell") => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (walletBalance <= 0) {
      setFundingDialogOpen(true);
      return;
    }
    
    setSelectedStock(stock);
    setTradeType(type);
    setTradeDialogOpen(true);
    setTradeAmount("");
  };

  const calculateShares = () => {
    if (!selectedStock || !tradeAmount) return "0";
    return (parseFloat(tradeAmount) / selectedStock.price).toFixed(4);
  };

  const handleExecuteTrade = async () => {
    if (!selectedStock || !tradeAmount || !user) return;

    const amount = parseFloat(tradeAmount);
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
      const shares = parseFloat(calculateShares());
      const endpoint = tradeType === 'buy' ? '/trades/buy' : '/trades/sell';
      
      const { data } = await api.post(endpoint, {
        assetType: 'stock',
        symbol: selectedStock.symbol,
        assetName: selectedStock.name,
        quantity: shares,
        price: selectedStock.price
      });

      toast({
        title: "Success!",
        description: data.message || `Trade executed successfully`,
      });

      // Refresh wallet balance
      const walletResponse = await api.get('/user/wallet');
      if (walletResponse.data) {
        setWalletBalance(parseFloat(walletResponse.data.balance) || 0);
      }

      // Close dialog and reset
      setTradeDialogOpen(false);
      setTradeAmount("");
      setSelectedStock(null);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.response?.data?.error || error.message || "Failed to execute trade",
      });
    } finally {
      setIsExecutingTrade(false);
    }
  };

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Trade Stocks</h1>
            <p className="text-muted-foreground mt-1">
              Buy and sell stocks with real-time market data
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-accent animate-pulse" />
            <span>Market Open</span>
            <span className="text-xs">• Updated {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Portfolio Value</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${portfolioSummary.totalValue.toLocaleString()}
            </p>
          </div>
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Today's Change</span>
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
              <Star className="h-4 w-4" />
              <span className="text-sm">Buying Power</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${portfolioSummary.buyingPower.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Search and Trade Actions */}
        <div className="card-elevated-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search stocks by symbol or name..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Live Trader Activity */}
        <LiveTraderInterests type="stock" />

        {/* Market Watch */}
        <div className="card-elevated-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Market Watch</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time stock prices and market data
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Symbol</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Name</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Price</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Change</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Volume</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">Market Cap</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground hidden lg:table-cell">P/E</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStocks.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-muted-foreground hover:text-warning transition-colors">
                          <Star className="h-4 w-4" />
                        </button>
                        <span className="font-semibold text-foreground">{stock.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-muted-foreground">{stock.name}</span>
                        <p className="text-xs text-muted-foreground/60">{stock.sector}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-foreground">
                      ${stock.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`flex items-center justify-end gap-1 ${
                        stock.change >= 0 ? "text-accent" : "text-destructive"
                      }`}>
                        {stock.change >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground hidden md:table-cell">{stock.volume}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground hidden lg:table-cell">{stock.marketCap}</td>
                    <td className="px-6 py-4 text-right text-muted-foreground hidden lg:table-cell">{stock.pe.toFixed(1)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="accent" 
                          size="sm"
                          onClick={() => handleTrade(stock, "buy")}
                        >
                          Buy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTrade(stock, "sell")}
                        >
                          Sell
                        </Button>
                      </div>
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
            Market data provided in real-time during trading hours. Extended hours trading available 4:00 AM - 8:00 PM ET.
          </p>
        </div>
      </div>

      {/* Trade Dialog */}
      <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {tradeType === "buy" ? "Buy" : "Sell"} {selectedStock?.symbol}
            </DialogTitle>
            <DialogDescription>
              {selectedStock?.name} • ${selectedStock?.price.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={tradeType} onValueChange={(v) => setTradeType(v as "buy" | "sell")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>
            
            <TabsContent value="buy" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Market Price</span>
                  <p className="font-semibold text-foreground">${selectedStock?.price.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Today's Change</span>
                  <p className={`font-semibold ${(selectedStock?.change || 0) >= 0 ? "text-accent" : "text-destructive"}`}>
                    {(selectedStock?.change || 0) >= 0 ? "+" : ""}{selectedStock?.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="pl-7"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                  />
                </div>
              </div>
              
              {tradeAmount && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Estimated shares:</p>
                  <p className="text-xl font-bold text-foreground">
                    {calculateShares()} shares
                  </p>
                </div>
              )}
              
              <Button 
                variant="accent" 
                className="w-full"
                disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || isExecutingTrade}
                onClick={handleExecuteTrade}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                {isExecutingTrade ? "Processing..." : `Buy ${selectedStock?.symbol}`}
              </Button>
            </TabsContent>
            
            <TabsContent value="sell" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Market Price</span>
                  <p className="font-semibold text-foreground">${selectedStock?.price.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Your Shares</span>
                  <p className="font-semibold text-foreground">0 shares</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="pl-7"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!tradeAmount || parseFloat(tradeAmount) <= 0 || isExecutingTrade}
                onClick={handleExecuteTrade}
              >
                <TrendingDown className="mr-2 h-4 w-4" />
                {isExecutingTrade ? "Processing..." : `Sell ${selectedStock?.symbol}`}
              </Button>
            </TabsContent>
          </Tabs>
          
          <p className="text-xs text-center text-muted-foreground">
            Commission-free trading • Market orders execute instantly
          </p>
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
              You need to add funds to your account before you can start trading.
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

export default Trade;
