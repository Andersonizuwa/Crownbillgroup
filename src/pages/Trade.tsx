import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  DollarSign,
  BarChart3
} from "lucide-react";

const Trade = () => {
  const marketData = [
    { symbol: "AAPL", name: "Apple Inc.", price: 189.45, change: 2.34, changePercent: 1.25, volume: "45.2M" },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 141.80, change: -1.23, changePercent: -0.86, volume: "23.1M" },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 378.92, change: 5.67, changePercent: 1.52, volume: "32.8M" },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.35, change: -2.45, changePercent: -1.36, volume: "28.9M" },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 495.22, change: 12.34, changePercent: 2.56, volume: "52.3M" },
    { symbol: "META", name: "Meta Platforms", price: 505.95, change: 8.76, changePercent: 1.76, volume: "18.7M" },
  ];

  const portfolioSummary = {
    totalValue: 125432.50,
    dayChange: 1245.32,
    dayChangePercent: 1.00,
    totalGain: 15234.50,
    totalGainPercent: 13.83,
  };

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Trade</h1>
          <p className="text-muted-foreground mt-1">
            Buy and sell stocks, ETFs, and more
          </p>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Value</span>
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
              $24,567.00
            </p>
          </div>
        </div>

        {/* Search and Trade Actions */}
        <div className="card-elevated-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search stocks, ETFs, or mutual funds..." 
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="accent">
                <TrendingUp className="mr-2 h-4 w-4" />
                Buy
              </Button>
              <Button variant="outline">
                <TrendingDown className="mr-2 h-4 w-4" />
                Sell
              </Button>
            </div>
          </div>
        </div>

        {/* Market Watch */}
        <div className="card-elevated-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Market Watch</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Track your favorite stocks and market movers
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
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Volume</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {marketData.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-muted-foreground hover:text-warning transition-colors">
                          <Star className="h-4 w-4" />
                        </button>
                        <span className="font-semibold text-foreground">{stock.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{stock.name}</td>
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
                    <td className="px-6 py-4 text-right text-muted-foreground">{stock.volume}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80">
                        Trade
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
            Market data is delayed by 15 minutes. For real-time quotes, please log in to your account.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Trade;
