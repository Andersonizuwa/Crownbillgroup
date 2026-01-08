import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Copy, 
  BarChart2,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Trader {
  id: string;
  name: string;
  avatar: string;
  asset: string;
  assetSymbol: string;
  action: "buy" | "sell";
  profit: number;
  timeAgo: string;
}

interface LiveTraderInterestsProps {
  type: "stock" | "crypto";
}

const LiveTraderInterests = ({ type }: LiveTraderInterestsProps) => {
  const { user } = useAuth();
  const [slotsFullDialogOpen, setSlotsFullDialogOpen] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState<Trader | null>(null);
  const [actionType, setActionType] = useState<"copy_trade" | "apply_strategy">("copy_trade");

  // Mock trader data - would come from real API in production
  const traders: Trader[] = type === "stock" 
    ? [
        { id: "1", name: "Marcus W.", avatar: "MW", asset: "NVDA", assetSymbol: "NVDA", action: "buy", profit: 18.5, timeAgo: "2m ago" },
        { id: "2", name: "Sarah K.", avatar: "SK", asset: "AAPL", assetSymbol: "AAPL", action: "buy", profit: 12.3, timeAgo: "5m ago" },
        { id: "3", name: "James T.", avatar: "JT", asset: "TSLA", assetSymbol: "TSLA", action: "sell", profit: -4.2, timeAgo: "8m ago" },
        { id: "4", name: "Elena R.", avatar: "ER", asset: "MSFT", assetSymbol: "MSFT", action: "buy", profit: 8.7, timeAgo: "12m ago" },
        { id: "5", name: "David L.", avatar: "DL", asset: "GOOGL", assetSymbol: "GOOGL", action: "buy", profit: 22.1, timeAgo: "15m ago" },
      ]
    : [
        { id: "1", name: "Alex M.", avatar: "AM", asset: "Bitcoin", assetSymbol: "BTC", action: "buy", profit: 25.8, timeAgo: "1m ago" },
        { id: "2", name: "Lisa P.", avatar: "LP", asset: "Ethereum", assetSymbol: "ETH", action: "buy", profit: 15.2, timeAgo: "3m ago" },
        { id: "3", name: "Chris B.", avatar: "CB", asset: "Solana", assetSymbol: "SOL", action: "buy", profit: 32.4, timeAgo: "6m ago" },
        { id: "4", name: "Nina V.", avatar: "NV", asset: "XRP", assetSymbol: "XRP", action: "sell", profit: -8.1, timeAgo: "10m ago" },
        { id: "5", name: "Tom H.", avatar: "TH", asset: "Dogecoin", assetSymbol: "DOGE", action: "buy", profit: 45.6, timeAgo: "14m ago" },
      ];

  const handleCopyTrade = async (trader: Trader, action: "copy_trade" | "apply_strategy") => {
    setSelectedTrader(trader);
    setActionType(action);

    // Log the attempt to database for admin notification
    if (user) {
      try {
        await supabase.from("copy_trade_attempts").insert({
          user_id: user.id,
          trader_name: trader.name,
          asset_symbol: trader.assetSymbol,
          asset_type: type,
          action_type: action,
          profit_percentage: trader.profit,
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
                  onClick={() => handleCopyTrade(trader, "apply_strategy")}
                >
                  <BarChart2 className="mr-1 h-3 w-3" />
                  Analyze
                </Button>
                <Button 
                  variant="accent" 
                  size="sm"
                  onClick={() => handleCopyTrade(trader, "copy_trade")}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy Trade
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slots Full Dialog */}
      <Dialog open={slotsFullDialogOpen} onOpenChange={setSlotsFullDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <Sparkles className="h-5 w-5" />
              {actionType === "copy_trade" ? "Copy Trade" : "Strategy Analysis"} Unavailable
            </DialogTitle>
            <DialogDescription>
              {actionType === "copy_trade" 
                ? `Copy trading slots for ${selectedTrader?.name}'s ${selectedTrader?.assetSymbol} trade are currently full.`
                : `Strategy analysis slots for ${selectedTrader?.name}'s approach are currently full.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">All Slots Are Full</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We've notified our team about your interest. A representative will reach out to you shortly with exclusive access opportunities.
              </p>
              <p className="text-xs text-muted-foreground">
                Your request has been logged and our admin team has been notified.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setSlotsFullDialogOpen(false)}
          >
            Got it, thanks!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LiveTraderInterests;