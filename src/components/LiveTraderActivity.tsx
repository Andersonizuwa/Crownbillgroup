import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";

interface TradeActivity {
  id: string;
  traderName: string;
  symbol: string;
  assetType: string;
  action: "buy" | "sell";
  amount: number;
  price: number;
  profit: number;
  timestamp: Date;
}

const LiveTraderActivity = () => {
  const [activities, setActivities] = useState<TradeActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data generator - in real app this would come from WebSocket or API
  const generateMockActivity = (): TradeActivity => {
    const symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA", "BTC", "ETH"];
    const traders = ["Alex Johnson", "Sarah Chen", "Mike Rodriguez", "Emma Wilson", "David Kim", "Lisa Zhang"];
    const assetTypes = ["stock", "crypto"];
    const actions = ["buy", "sell"];

    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const traderName = traders[Math.floor(Math.random() * traders.length)];
    const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];

    const price = assetType === "crypto"
      ? Math.random() * 50000 + 1000
      : Math.random() * 300 + 50;

    const amount = Math.random() * 10 + 0.1;
    const profit = (Math.random() - 0.3) * 500; // -150 to +350 profit

    return {
      id: Math.random().toString(36).substr(2, 9),
      traderName,
      symbol,
      assetType,
      action: action as "buy" | "sell",
      amount: parseFloat(amount.toFixed(4)),
      price: parseFloat(price.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      timestamp: new Date()
    };
  };

  // Simulate real-time data feed
  useEffect(() => {
    // Initial data
    const initialActivities = Array.from({ length: 8 }, () => generateMockActivity())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setActivities(initialActivities);
    setIsLoading(false);

    // Simulate new activities every 3-8 seconds
    const interval = setInterval(() => {
      setActivities(prev => {
        const newActivity = generateMockActivity();
        const updated = [newActivity, ...prev];
        return updated.slice(0, 15); // Keep only latest 15 activities
      });
    }, Math.random() * 5000 + 3000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Trader Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          Live Trader Activity
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors gap-3 sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                    {activity.traderName}
                  </span>
                  <Badge
                    variant={activity.action === "buy" ? "default" : "destructive"}
                    className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0"
                  >
                    {activity.action.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-mono">{activity.symbol}</span>
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                    {activity.assetType.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              </div>

              <div className="flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2 sm:gap-0 sm:ml-3 pt-2 sm:pt-0 border-t sm:border-0 border-border/50">
                <div className="font-medium text-foreground text-sm sm:text-base">
                  {activity.amount.toFixed(4)} <span className="sm:hidden">{activity.symbol}</span>
                </div>
                <div className={`text-sm font-semibold ${activity.profit >= 0 ? "text-accent" : "text-destructive"
                  }`}>
                  {activity.profit >= 0 ? "+" : ""}${activity.profit.toFixed(2)}
                </div>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent trading activity</p>
              <p className="text-sm">Check back soon for live updates</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTraderActivity;