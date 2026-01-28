import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiveTraderActivity from "@/components/LiveTraderActivity";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface WalletData {
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  description: string | null;
}

interface Holding {
  id: string;
  assetType: string;
  symbol: string;
  assetName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPct: number;
}



const mockPerformanceData = [
  { month: "Jan", value: 0 },
  { month: "Feb", value: 0 },
  { month: "Mar", value: 0 },
  { month: "Apr", value: 0 },
  { month: "May", value: 0 },
  { month: "Jun", value: 0 },
];

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(152, 55%, 38%)",
  },
  deposits: {
    label: "Deposits",
    color: "hsl(152, 55%, 38%)",
  },
  withdrawals: {
    label: "Withdrawals",
    color: "hsl(0, 72%, 51%)",
  },
};

const Portfolio = () => {
  const { user, isLoading: loading } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [realHoldings, setRealHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(mockPerformanceData);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    }
  }, [user]);

  const fetchPortfolioData = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Fetch wallet
      const walletResponse = await api.get('/user/wallet');
      const walletData = walletResponse.data;

      if (walletData) {
        setWallet({
          balance: parseFloat(walletData.balance),
          currency: walletData.currency
        });
      }

      // Fetch transactions
      const txResponse = await api.get('/user/transactions');
      const txData = txResponse.data;

      if (txData) {
        const formattedTxs = txData.map((t: any) => ({
          ...t,
          amount: parseFloat(t.amount),
          createdAt: t.createdAt
        }));
        setTransactions(formattedTxs);
        generatePerformanceData(formattedTxs, parseFloat(walletData?.balance) || 0);
      }

      // Fetch real holdings with live prices
      const holdingsResponse = await api.get('/trades/holdings/prices');
      if (holdingsResponse.data.holdings) {
        const formattedHoldings = holdingsResponse.data.holdings.map((h: any) => ({
          ...h,
          quantity: parseFloat(h.quantity),
          averagePrice: parseFloat(h.averagePrice),
          currentPrice: parseFloat(h.currentPrice),
          totalCost: parseFloat(h.totalCost),
          currentValue: parseFloat(h.currentValue),
          profitLoss: parseFloat(h.profitLoss),
          profitLossPct: parseFloat(h.profitLossPct)
        }));
        setRealHoldings(formattedHoldings);
      }
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePerformanceData = (txs: Transaction[], currentBalance: number) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const now = new Date();
    const currentMonth = now.getMonth();
    
    // Create monthly data based on transactions
    const monthlyData = months.map((month, index) => {
      // Simple simulation - in real app would calculate actual balances
      const monthIndex = (currentMonth - 5 + index + 12) % 12;
      const monthTxs = txs.filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return txDate.getMonth() === monthIndex && tx.status === "completed";
      });
      
      const deposits = monthTxs
        .filter((tx) => tx.type === "deposit")
        .reduce((sum, tx) => sum + tx.amount, 0);
      const withdrawals = monthTxs
        .filter((tx) => tx.type === "withdrawal")
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      return {
        month,
        deposits,
        withdrawals,
        value: deposits - withdrawals,
      };
    });

    // Cumulative balance
    let runningBalance = 0;
    const cumulativeData = monthlyData.map((data) => {
      runningBalance += data.value;
      return { ...data, value: Math.max(0, runningBalance) };
    });

    // Adjust last month to match current balance
    if (cumulativeData.length > 0) {
      cumulativeData[cumulativeData.length - 1].value = currentBalance;
    }

    setPerformanceData(cumulativeData);
  };

  // Auto-refresh holdings every 10 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchPortfolioData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Calculate portfolio summary
  const cashBalance = wallet?.balance || 0;
  const stocksValue = realHoldings
    .filter(h => h.assetType === 'stock')
    .reduce((sum, h) => sum + h.currentValue, 0);
  const cryptoValue = realHoldings
    .filter(h => h.assetType === 'crypto')
    .reduce((sum, h) => sum + h.currentValue, 0);
  
  const holdings = [
    { name: "Cash", value: cashBalance, color: "hsl(152, 55%, 38%)", symbol: "USD" },
    { name: "Stocks", value: stocksValue, color: "hsl(220, 60%, 20%)", symbol: "STOCKS" },
    { name: "Crypto", value: cryptoValue, color: "hsl(38, 92%, 50%)", symbol: "CRYPTO" },
    { name: "Bonds", value: 0, color: "hsl(200, 80%, 50%)", symbol: "BONDS" },
  ];

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const holdingsWithPercentage = holdings.map((h) => ({
    ...h,
    percentage: totalValue > 0 ? ((h.value / totalValue) * 100).toFixed(1) : "0",
  }));

  const totalDeposits = transactions
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate total portfolio gain/loss
  const totalProfitLoss = realHoldings.reduce((sum, h) => sum + h.profitLoss, 0);
  const totalInvestment = realHoldings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalProfitLossPct = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

  const monthlyActivity = [
    { name: "Deposits", value: totalDeposits },
    { name: "Withdrawals", value: totalWithdrawals },
  ];

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your portfolio...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Portfolio Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your investments and asset holdings
          </p>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-accent" />
                </div>
                <span className="text-muted-foreground text-sm">Total Value</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-accent" />
                <span className="text-xs text-accent">Portfolio value</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-accent" />
                </div>
                <span className="text-muted-foreground text-sm">Total Deposits</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${totalDeposits.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <ArrowDownRight className="h-5 w-5 text-destructive" />
                </div>
                <span className="text-muted-foreground text-sm">Total Withdrawals</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${totalWithdrawals.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <span className="text-muted-foreground text-sm">Cash Balance</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                ${(wallet?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{wallet?.currency || "USD"}</p>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  {totalProfitLoss >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-accent" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <span className="text-muted-foreground text-sm">Total Gain/Loss</span>
              </div>
              <p className={`text-lg font-bold ${totalProfitLoss >= 0 ? "text-accent" : "text-destructive"}`}>
                {totalProfitLoss >= 0 ? "+" : ""}${totalProfitLoss.toFixed(2)}
                <span className="text-base font-normal"> ({totalProfitLossPct >= 0 ? "+" : ""}{totalProfitLossPct.toFixed(2)}%)</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Portfolio performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="gap-2">
              <PieChartIcon className="h-4 w-4" />
              Allocation
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Live Trader Activity */}
              <div className="lg:col-span-1">
                <LiveTraderActivity />
              </div>
              
              {/* Portfolio Charts */}
              <div className="lg:col-span-2">
                <div className="grid lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card className="card-elevated-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  {totalValue > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[300px]">
                      <PieChart>
                        <Pie
                          data={holdingsWithPercentage.filter((h) => h.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {holdingsWithPercentage
                            .filter((h) => h.value > 0)
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) =>
                                `$${Number(value).toLocaleString()}`
                              }
                            />
                          }
                        />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <PieChartIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No assets in portfolio yet</p>
                        <p className="text-sm">Fund your account to get started</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Holdings List */}
              <Card className="card-elevated-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  {realHoldings.length > 0 ? (
                    <div className="space-y-4">
                      {realHoldings.map((holding) => (
                        <div
                          key={holding.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground text-lg">
                                {holding.symbol}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                                {holding.assetType.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {holding.assetName}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Qty: </span>
                                <span className="font-medium text-foreground">
                                  {holding.quantity.toFixed(8)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Avg: </span>
                                <span className="font-medium text-foreground">
                                  ${holding.averagePrice.toFixed(2)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Now: </span>
                                <span className="font-medium text-foreground">
                                  ${holding.currentPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">
                              ${holding.currentValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              holding.profitLoss >= 0 ? "text-accent" : "text-destructive"
                            }`}>
                              {holding.profitLoss >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span className="font-semibold">
                                {holding.profitLoss >= 0 ? "+" : ""}${holding.profitLoss.toFixed(2)}
                              </span>
                            </div>
                            <p className={`text-sm font-medium ${
                              holding.profitLossPct >= 0 ? "text-accent" : "text-destructive"
                            }`}>
                              {holding.profitLossPct >= 0 ? "+" : ""}{holding.profitLossPct.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <PieChartIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No holdings yet</p>
                      <p className="text-sm">Start trading to build your portfolio</p>
                    </div>
                  )}
                </CardContent>
              </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="card-elevated-lg">
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Value Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[350px]">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152, 55%, 38%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(152, 55%, 38%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `$${Number(value).toLocaleString()}`}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(152, 55%, 38%)"
                      strokeWidth={2}
                      fill="url(#valueGradient)"
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="card-elevated-lg">
              <CardHeader>
                <CardTitle className="text-lg">Deposits vs Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[350px]">
                  <BarChart data={monthlyActivity}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(220, 15%, 45%)", fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `$${Number(value).toLocaleString()}`}
                        />
                      }
                    />
                    <Bar
                      dataKey="value"
                      radius={[4, 4, 0, 0]}
                      fill="hsl(152, 55%, 38%)"
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="card-elevated-lg">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              tx.type === "deposit"
                                ? "bg-accent/10"
                                : "bg-destructive/10"
                            }`}
                          >
                            {tx.type === "deposit" ? (
                              <ArrowUpRight className="h-4 w-4 text-accent" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground capitalize">
                              {tx.type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-medium ${
                              tx.type === "deposit"
                                ? "text-accent"
                                : "text-destructive"
                            }`}
                          >
                            {tx.type === "deposit" ? "+" : "-"}$
                            {tx.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {tx.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Portfolio;
