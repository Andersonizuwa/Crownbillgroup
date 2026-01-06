import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Crypto = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState<typeof cryptoData[0] | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyAmount, setBuyAmount] = useState("");

  const cryptoData = [
    { 
      symbol: "BTC", 
      name: "Bitcoin", 
      price: 97234.56, 
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
      price: 3456.78, 
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
      price: 712.45, 
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
      price: 198.34, 
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
      price: 2.34, 
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
      price: 1.12, 
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
      price: 0.38, 
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
      price: 42.56, 
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
      price: 8.92, 
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
      price: 24.78, 
      change: 0.89, 
      changePercent: 3.72, 
      volume: "678M",
      marketCap: "15.1B",
      high24h: 25.50,
      low24h: 23.90,
      icon: "⬡"
    },
  ];

  const portfolioSummary = {
    totalValue: 45678.90,
    dayChange: 567.23,
    dayChangePercent: 1.26,
    totalGain: 8234.50,
    totalGainPercent: 21.98,
  };

  const filteredCrypto = cryptoData.filter(crypto => 
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crypto.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBuy = (crypto: typeof cryptoData[0]) => {
    setSelectedCrypto(crypto);
    setBuyDialogOpen(true);
    setBuyAmount("");
  };

  const calculateCryptoAmount = () => {
    if (!selectedCrypto || !buyAmount) return "0";
    return (parseFloat(buyAmount) / selectedCrypto.price).toFixed(8);
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
              $12,345.00
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
              disabled={!buyAmount || parseFloat(buyAmount) <= 0}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Buy {selectedCrypto?.symbol}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Trading fee: 0.1% • Instant execution
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Crypto;