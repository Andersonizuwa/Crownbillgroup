import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  created_at: string;
  description: string | null;
}

// Mock portfolio data - in real app, this would come from the database
const mockHoldings = [
  { name: "Cash", value: 0, color: "hsl(152, 55%, 38%)", symbol: "USD" },
  { name: "Stocks", value: 0, color: "hsl(220, 60%, 20%)", symbol: "STOCKS" },
  { name: "Crypto", value: 0, color: "hsl(38, 92%, 50%)", symbol: "CRYPTO" },
  { name: "Bonds", value: 0, color: "hsl(200, 80%, 50%)", symbol: "BONDS" },
];

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
  const [isLoading, setIsLoading] = useState(true);
  const [holdings, setHoldings] = useState(mockHoldings);
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
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance, currency")
        .eq("user_id", user.id)
        .single();

      if (walletData) {
        setWallet(walletData);
        // Update holdings with actual wallet balance
        setHoldings((prev) =>
          prev.map((h) =>
            h.name === "Cash" ? { ...h, value: walletData.balance || 0 } : h
          )
        );
      }

      // Fetch transactions for activity data
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (txData) {
        setTransactions(txData);
        // Generate performance data based on transactions
        generatePerformanceData(txData, walletData?.balance || 0);
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
        const txDate = new Date(tx.created_at);
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                  <div className="space-y-4">
                    {holdingsWithPercentage.map((holding, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: holding.color }}
                          />
                          <div>
                            <p className="font-medium text-foreground">
                              {holding.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {holding.symbol}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            ${holding.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {holding.percentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
                              {new Date(tx.created_at).toLocaleDateString()}
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
