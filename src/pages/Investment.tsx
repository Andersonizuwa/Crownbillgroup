import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { 
  ArrowRight, 
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Wallet,
  PieChart,
  DollarSign,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Investment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [holdings, setHoldings] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data } = await api.get('/trades/prices');
        if (data) {
          const priceMap: Record<string, number> = {};
          data.forEach((item: any) => {
            priceMap[`${item.assetType}_${item.symbol}`] = item.price;
          });
          setLivePrices(priceMap);
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user data if logged in
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const [walletRes, holdingsRes] = await Promise.all([
          api.get('/user/wallet'),
          api.get('/trades/holdings')
        ]);

        if (walletRes.data) {
          setWalletBalance(parseFloat(walletRes.data.balance) || 0);
        }

        if (holdingsRes.data) {
          const formattedHoldings = holdingsRes.data.map((h: any) => ({
            ...h,
            quantity: parseFloat(h.quantity),
            currentPrice: parseFloat(h.currentPrice),
            currentValue: parseFloat(h.currentValue),
            profitLoss: parseFloat(h.profitLoss),
            profitLossPct: parseFloat(h.profitLossPct)
          }));
          setHoldings(formattedHoldings);
          
          const totalValue = formattedHoldings.reduce((sum: number, h: any) => 
            sum + h.currentValue, 0
          );
          setPortfolioValue(totalValue);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);
  // Top stocks
  const topStocks = [
    { symbol: "AAPL", name: "Apple Inc.", assetType: "stock" },
    { symbol: "MSFT", name: "Microsoft Corp.", assetType: "stock" },
    { symbol: "GOOGL", name: "Alphabet Inc.", assetType: "stock" },
    { symbol: "AMZN", name: "Amazon.com", assetType: "stock" },
    { symbol: "NVDA", name: "NVIDIA Corp.", assetType: "stock" },
    { symbol: "META", name: "Meta Platforms", assetType: "stock" }
  ];

  // Top crypto
  const topCrypto = [
    { symbol: "BTC", name: "Bitcoin", assetType: "crypto" },
    { symbol: "ETH", name: "Ethereum", assetType: "crypto" },
    { symbol: "BNB", name: "BNB", assetType: "crypto" },
    { symbol: "SOL", name: "Solana", assetType: "crypto" },
    { symbol: "XRP", name: "XRP", assetType: "crypto" },
    { symbol: "ADA", name: "Cardano", assetType: "crypto" }
  ];

  const allAssets = [...topStocks, ...topCrypto];
  const filteredAssets = allAssets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTrade = (asset: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (asset.assetType === 'stock') {
      navigate('/trade');
    } else {
      navigate('/crypto');
    }
  };

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Markets & Investments
          </h1>
          <p className="text-muted-foreground mt-1">
            Trade stocks and crypto with live market data
          </p>
        </div>

        {/* Portfolio Summary - Only show if logged in */}
        {user && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card-elevated p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Wallet className="h-4 w-4" />
                <span className="text-sm">Wallet Balance</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="card-elevated p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <PieChart className="h-4 w-4" />
                <span className="text-sm">Portfolio Value</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="card-elevated p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Total Holdings</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{holdings.length}</p>
            </div>

            <div className="card-elevated p-5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Total Value</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${(walletBalance + portfolioValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="card-elevated-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search stocks by symbol or name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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

        {/* Markets Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">All Markets</TabsTrigger>
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            {user && <TabsTrigger value="holdings">My Holdings</TabsTrigger>}
          </TabsList>

          {/* All Markets */}
          <TabsContent value="all" className="space-y-4">
            <div className="card-elevated-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Asset</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Type</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Price</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAssets.map((asset) => {
                      const price = livePrices[`${asset.assetType}_${asset.symbol}`] || 0;
                      return (
                        <tr key={`${asset.assetType}_${asset.symbol}`} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-semibold text-foreground">{asset.symbol}</span>
                              <p className="text-sm text-muted-foreground">{asset.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary uppercase">
                              {asset.assetType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-foreground">
                            ${price > 0 ? price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : '---'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                variant="accent" 
                                size="sm"
                                onClick={() => handleTrade(asset)}
                              >
                                Trade
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Stocks Only */}
          <TabsContent value="stocks">
            <div className="card-elevated-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Symbol</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Name</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Price</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topStocks.map((stock) => {
                      const price = livePrices[`stock_${stock.symbol}`] || 0;
                      return (
                        <tr key={stock.symbol} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-foreground">{stock.symbol}</td>
                          <td className="px-6 py-4 text-muted-foreground">{stock.name}</td>
                          <td className="px-6 py-4 text-right font-medium text-foreground">
                            ${price > 0 ? price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : '---'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button 
                              variant="accent" 
                              size="sm"
                              onClick={() => navigate('/trade')}
                            >
                              Trade
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Crypto Only */}
          <TabsContent value="crypto">
            <div className="card-elevated-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Symbol</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Name</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Price</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topCrypto.map((crypto) => {
                      const price = livePrices[`crypto_${crypto.symbol}`] || 0;
                      return (
                        <tr key={crypto.symbol} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-foreground">{crypto.symbol}</td>
                          <td className="px-6 py-4 text-muted-foreground">{crypto.name}</td>
                          <td className="px-6 py-4 text-right font-medium text-foreground">
                            ${price > 0 ? price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : '---'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Button 
                              variant="accent" 
                              size="sm"
                              onClick={() => navigate('/crypto')}
                            >
                              Trade
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* My Holdings */}
          {user && (
            <TabsContent value="holdings">
              {holdings.length > 0 ? (
                <div className="card-elevated-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Asset</th>
                          <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Quantity</th>
                          <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Avg Price</th>
                          <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Current Price</th>
                          <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Value</th>
                          <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">P&L</th>
                          <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {holdings.map((holding) => (
                          <tr key={holding.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <span className="font-semibold text-foreground">{holding.symbol}</span>
                                <p className="text-xs text-muted-foreground uppercase">{holding.assetType}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-muted-foreground">
                              {holding.quantity.toFixed(8)}
                            </td>
                            <td className="px-6 py-4 text-right text-muted-foreground">
                              ${holding.averagePrice?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-foreground">
                              ${holding.currentPrice?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-foreground">
                              ${holding.currentValue?.toLocaleString("en-US", { minimumFractionDigits: 2 }) || '0.00'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className={`flex items-center justify-end gap-1 ${
                                holding.profitLoss >= 0 ? "text-accent" : "text-destructive"
                              }`}>
                                {holding.profitLoss >= 0 ? (
                                  <ArrowUpRight className="h-4 w-4" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4" />
                                )}
                                <span className="font-semibold">
                                  {holding.profitLoss >= 0 ? "+" : ""}${holding.profitLoss?.toFixed(2) || '0.00'}
                                </span>
                                <span className="text-xs">({holding.profitLossPct?.toFixed(2) || '0.00'}%)</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Link to={holding.assetType === 'stock' ? '/trade' : '/crypto'}>
                                <Button variant="outline" size="sm">
                                  Sell
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card-elevated-lg p-12 text-center">
                  <PieChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Holdings Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start trading to build your investment portfolio
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link to="/trade">
                      <Button variant="accent">
                        Trade Stocks
                      </Button>
                    </Link>
                    <Link to="/crypto">
                      <Button variant="accent">
                        Trade Crypto
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Link to="/trade" className="card-elevated-lg p-6 hover:shadow-xl transition-all">
            <TrendingUp className="h-8 w-8 text-accent mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Trade Stocks</h3>
            <p className="text-sm text-muted-foreground">Buy and sell stocks with commission-free trading</p>
          </Link>

          <Link to="/crypto" className="card-elevated-lg p-6 hover:shadow-xl transition-all">
            <DollarSign className="h-8 w-8 text-accent mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Trade Crypto</h3>
            <p className="text-sm text-muted-foreground">Invest in Bitcoin, Ethereum, and more</p>
          </Link>

          <Link to="/portfolio" className="card-elevated-lg p-6 hover:shadow-xl transition-all">
            <PieChart className="h-8 w-8 text-accent mb-3" />
            <h3 className="text-lg font-semibold text-foreground mb-2">View Portfolio</h3>
            <p className="text-sm text-muted-foreground">Track your investments and performance</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Investment;
