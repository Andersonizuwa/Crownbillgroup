import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Copy, 
  BarChart2,
  Sparkles,
  Calendar,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

interface TraderStats {
  totalTrades: number;
  winRate: number;
  avgProfit: number;
  monthlyReturn: number;
  weeklyTrades: { day: string; profit: number }[];
  recentTrades: { asset: string; profit: number; date: string }[];
}

interface Trader {
  id: string;
  name: string;
  avatar: string;
  asset: string;
  assetSymbol: string;
  action: "buy" | "sell";
  profit: number;
  timeAgo: string;
  stats: TraderStats;
}

interface LiveTraderInterestsProps {
  type: "stock" | "crypto";
}

const LiveTraderInterests = ({ type }: LiveTraderInterestsProps) => {
  const { user } = useAuth();
  const [slotsFullDialogOpen, setSlotsFullDialogOpen] = useState(false);
  const [analyzeDialogOpen, setAnalyzeDialogOpen] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);

  // Mock trader data with detailed stats
  const traders: Trader[] = type === "stock" 
    ? [
        { 
          id: "1", name: "Marcus W.", avatar: "MW", asset: "NVDA", assetSymbol: "NVDA", action: "buy", profit: 18.5, timeAgo: "2m ago",
          stats: { totalTrades: 245, winRate: 78, avgProfit: 12.4, monthlyReturn: 34.2, 
            weeklyTrades: [{ day: "Mon", profit: 5.2 }, { day: "Tue", profit: -2.1 }, { day: "Wed", profit: 8.3 }, { day: "Thu", profit: 3.7 }, { day: "Fri", profit: 6.1 }],
            recentTrades: [{ asset: "NVDA", profit: 18.5, date: "Today" }, { asset: "AMD", profit: 12.3, date: "Yesterday" }, { asset: "INTC", profit: -4.2, date: "2 days ago" }]
          }
        },
        { 
          id: "2", name: "Sarah K.", avatar: "SK", asset: "AAPL", assetSymbol: "AAPL", action: "buy", profit: 12.3, timeAgo: "5m ago",
          stats: { totalTrades: 189, winRate: 72, avgProfit: 9.8, monthlyReturn: 28.5,
            weeklyTrades: [{ day: "Mon", profit: 3.4 }, { day: "Tue", profit: 4.2 }, { day: "Wed", profit: -1.5 }, { day: "Thu", profit: 7.8 }, { day: "Fri", profit: 2.9 }],
            recentTrades: [{ asset: "AAPL", profit: 12.3, date: "Today" }, { asset: "MSFT", profit: 8.1, date: "Yesterday" }, { asset: "GOOGL", profit: 5.4, date: "2 days ago" }]
          }
        },
        { 
          id: "3", name: "James T.", avatar: "JT", asset: "TSLA", assetSymbol: "TSLA", action: "sell", profit: -4.2, timeAgo: "8m ago",
          stats: { totalTrades: 312, winRate: 65, avgProfit: 7.2, monthlyReturn: 19.8,
            weeklyTrades: [{ day: "Mon", profit: -3.2 }, { day: "Tue", profit: 6.1 }, { day: "Wed", profit: 4.3 }, { day: "Thu", profit: -1.8 }, { day: "Fri", profit: 5.5 }],
            recentTrades: [{ asset: "TSLA", profit: -4.2, date: "Today" }, { asset: "RIVN", profit: 6.7, date: "Yesterday" }, { asset: "F", profit: 3.2, date: "2 days ago" }]
          }
        },
        { 
          id: "4", name: "Elena R.", avatar: "ER", asset: "MSFT", assetSymbol: "MSFT", action: "buy", profit: 8.7, timeAgo: "12m ago",
          stats: { totalTrades: 156, winRate: 81, avgProfit: 11.3, monthlyReturn: 31.4,
            weeklyTrades: [{ day: "Mon", profit: 4.8 }, { day: "Tue", profit: 3.2 }, { day: "Wed", profit: 5.6 }, { day: "Thu", profit: -0.8 }, { day: "Fri", profit: 7.2 }],
            recentTrades: [{ asset: "MSFT", profit: 8.7, date: "Today" }, { asset: "ORCL", profit: 5.4, date: "Yesterday" }, { asset: "CRM", profit: 9.1, date: "2 days ago" }]
          }
        },
        { 
          id: "5", name: "David L.", avatar: "DL", asset: "GOOGL", assetSymbol: "GOOGL", action: "buy", profit: 22.1, timeAgo: "15m ago",
          stats: { totalTrades: 278, winRate: 85, avgProfit: 14.7, monthlyReturn: 42.3,
            weeklyTrades: [{ day: "Mon", profit: 8.4 }, { day: "Tue", profit: 5.6 }, { day: "Wed", profit: 9.2 }, { day: "Thu", profit: 3.1 }, { day: "Fri", profit: 11.3 }],
            recentTrades: [{ asset: "GOOGL", profit: 22.1, date: "Today" }, { asset: "META", profit: 15.8, date: "Yesterday" }, { asset: "AMZN", profit: 11.2, date: "2 days ago" }]
          }
        },
      ]
    : [
        { 
          id: "1", name: "Alex M.", avatar: "AM", asset: "Bitcoin", assetSymbol: "BTC", action: "buy", profit: 25.8, timeAgo: "1m ago",
          stats: { totalTrades: 423, winRate: 76, avgProfit: 18.2, monthlyReturn: 52.4,
            weeklyTrades: [{ day: "Mon", profit: 12.3 }, { day: "Tue", profit: -4.5 }, { day: "Wed", profit: 15.8 }, { day: "Thu", profit: 8.2 }, { day: "Fri", profit: 19.1 }],
            recentTrades: [{ asset: "BTC", profit: 25.8, date: "Today" }, { asset: "ETH", profit: 18.4, date: "Yesterday" }, { asset: "BNB", profit: 9.7, date: "2 days ago" }]
          }
        },
        { 
          id: "2", name: "Lisa P.", avatar: "LP", asset: "Ethereum", assetSymbol: "ETH", action: "buy", profit: 15.2, timeAgo: "3m ago",
          stats: { totalTrades: 356, winRate: 71, avgProfit: 13.5, monthlyReturn: 38.7,
            weeklyTrades: [{ day: "Mon", profit: 7.8 }, { day: "Tue", profit: 5.2 }, { day: "Wed", profit: -2.3 }, { day: "Thu", profit: 11.4 }, { day: "Fri", profit: 8.9 }],
            recentTrades: [{ asset: "ETH", profit: 15.2, date: "Today" }, { asset: "MATIC", profit: 11.3, date: "Yesterday" }, { asset: "LINK", profit: 7.8, date: "2 days ago" }]
          }
        },
        { 
          id: "3", name: "Chris B.", avatar: "CB", asset: "Solana", assetSymbol: "SOL", action: "buy", profit: 32.4, timeAgo: "6m ago",
          stats: { totalTrades: 512, winRate: 82, avgProfit: 21.3, monthlyReturn: 68.5,
            weeklyTrades: [{ day: "Mon", profit: 18.4 }, { day: "Tue", profit: 12.1 }, { day: "Wed", profit: -5.2 }, { day: "Thu", profit: 22.8 }, { day: "Fri", profit: 15.6 }],
            recentTrades: [{ asset: "SOL", profit: 32.4, date: "Today" }, { asset: "AVAX", profit: 24.1, date: "Yesterday" }, { asset: "DOT", profit: 14.5, date: "2 days ago" }]
          }
        },
        { 
          id: "4", name: "Nina V.", avatar: "NV", asset: "XRP", assetSymbol: "XRP", action: "sell", profit: -8.1, timeAgo: "10m ago",
          stats: { totalTrades: 289, winRate: 68, avgProfit: 10.8, monthlyReturn: 24.3,
            weeklyTrades: [{ day: "Mon", profit: -3.2 }, { day: "Tue", profit: 8.5 }, { day: "Wed", profit: 5.1 }, { day: "Thu", profit: -2.4 }, { day: "Fri", profit: 9.3 }],
            recentTrades: [{ asset: "XRP", profit: -8.1, date: "Today" }, { asset: "ADA", profit: 6.4, date: "Yesterday" }, { asset: "DOGE", profit: 12.8, date: "2 days ago" }]
          }
        },
        { 
          id: "5", name: "Tom H.", avatar: "TH", asset: "Dogecoin", assetSymbol: "DOGE", action: "buy", profit: 45.6, timeAgo: "14m ago",
          stats: { totalTrades: 634, winRate: 79, avgProfit: 25.4, monthlyReturn: 78.2,
            weeklyTrades: [{ day: "Mon", profit: 22.1 }, { day: "Tue", profit: 15.8 }, { day: "Wed", profit: 31.2 }, { day: "Thu", profit: -8.4 }, { day: "Fri", profit: 28.6 }],
            recentTrades: [{ asset: "DOGE", profit: 45.6, date: "Today" }, { asset: "SHIB", profit: 38.2, date: "Yesterday" }, { asset: "PEPE", profit: 52.1, date: "2 days ago" }]
          }
        },
      ];

  const handleAnalyze = (trader: Trader) => {
    setSelectedTrader(trader);
    setAnalyzeDialogOpen(true);
  };

  const handleCopyTrade = async (trader: Trader) => {
    setSelectedTrader(trader);

    // Log the attempt to database for admin notification
    if (user) {
      try {
        await api.post("/user/copy-trade-attempts", {
          traderName: trader.name,
          assetSymbol: trader.assetSymbol,
          assetType: type,
          actionType: "copy_trade",
          profitPercentage: trader.profit,
        });
      } catch (error) {
        console.error("Failed to log copy trade attempt:", error);
      }
    } else {
      toast.error("Please login to use this feature");
      return;
    }

    // Show slots full dialog
    setSlotsFullDialogOpen(true);
  };

  return (
    <>
      <div className="card-elevated-lg overflow-hidden mb-8">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Live Trader Activity</h2>
                <p className="text-sm text-muted-foreground">
                  See what top traders are doing in real-time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              Live
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {traders.map((trader) => (
            <div 
              key={trader.id} 
              className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-semibold text-primary shrink-0">
                  {trader.avatar}
                </div>
                
                {/* Trader Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{trader.name}</span>
                    <span className="text-xs text-muted-foreground">{trader.timeAgo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-medium ${trader.action === "buy" ? "text-accent" : "text-destructive"}`}>
                      {trader.action === "buy" ? "Bought" : "Sold"}
                    </span>
                    <span className="text-muted-foreground">{trader.asset}</span>
                    <span className="text-muted-foreground">({trader.assetSymbol})</span>
                  </div>
                </div>

                {/* Profit/Loss */}
                <div className={`flex items-center gap-1 font-semibold ${trader.profit >= 0 ? "text-accent" : "text-destructive"}`}>
                  {trader.profit >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>{trader.profit >= 0 ? "+" : ""}{trader.profit.toFixed(1)}%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAnalyze(trader)}
                >
                  <BarChart2 className="mr-1 h-3 w-3" />
                  Analyze
                </Button>
                <Button 
                  variant="accent" 
                  size="sm"
                  onClick={() => handleCopyTrade(trader)}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy Trade
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analyze Dialog - Shows Real Data */}
      <Dialog open={analyzeDialogOpen} onOpenChange={setAnalyzeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Trader Analysis: {selectedTrader?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed performance breakdown and trading history
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrader && (
            <div className="space-y-6 py-4">
              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Target className="h-4 w-4" />
                    Win Rate
                  </div>
                  <div className="text-2xl font-bold text-accent">{selectedTrader.stats.winRate}%</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Monthly Return
                  </div>
                  <div className="text-2xl font-bold text-accent">+{selectedTrader.stats.monthlyReturn}%</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Wallet className="h-4 w-4" />
                    Total Trades
                  </div>
                  <div className="text-2xl font-bold text-foreground">{selectedTrader.stats.totalTrades}</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <BarChart2 className="h-4 w-4" />
                    Avg Profit
                  </div>
                  <div className="text-2xl font-bold text-accent">+{selectedTrader.stats.avgProfit}%</div>
                </div>
              </div>

              {/* Weekly Performance */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  This Week's Performance
                </h4>
                <div className="flex gap-2">
                  {selectedTrader.stats.weeklyTrades.map((day) => (
                    <div key={day.day} className="flex-1 text-center">
                      <div className="text-xs text-muted-foreground mb-1">{day.day}</div>
                      <div className={`h-16 rounded-md flex items-end justify-center ${day.profit >= 0 ? 'bg-accent/20' : 'bg-destructive/20'}`}>
                        <div 
                          className={`w-full rounded-md ${day.profit >= 0 ? 'bg-accent' : 'bg-destructive'}`}
                          style={{ height: `${Math.min(Math.abs(day.profit) * 3, 100)}%` }}
                        />
                      </div>
                      <div className={`text-xs mt-1 font-medium ${day.profit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {day.profit >= 0 ? '+' : ''}{day.profit}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Trades */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Recent Trades</h4>
                <div className="space-y-2">
                  {selectedTrader.stats.recentTrades.map((trade, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        {trade.profit >= 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-accent" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-destructive" />
                        )}
                        <span className="font-medium">{trade.asset}</span>
                        <span className="text-xs text-muted-foreground">{trade.date}</span>
                      </div>
                      <span className={`font-semibold ${trade.profit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {trade.profit >= 0 ? '+' : ''}{trade.profit}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setAnalyzeDialogOpen(false)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Slots Full Dialog - Copy Trade Only */}
      <Dialog open={slotsFullDialogOpen} onOpenChange={setSlotsFullDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <Sparkles className="h-5 w-5" />
              Copy Trade Unavailable
            </DialogTitle>
            <DialogDescription>
              Copy trading slots for {selectedTrader?.name}'s {selectedTrader?.assetSymbol} trade are currently full.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">All Slots Are Full</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The copy trading system is currently at full capacity. Our team has been notified of your interest and will reach out with exclusive access opportunities.
              </p>
              <p className="text-xs text-muted-foreground">
                Your request has been logged and our admin team will contact you shortly.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="accent" 
              className="flex-1"
              onClick={() => {
                setSlotsFullDialogOpen(false);
                setSelectedTrader(selectedTrader);
                setAnalyzeDialogOpen(true);
              }}
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              View Trade Analysis
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setSlotsFullDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LiveTraderInterests;