import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowRight, 
  Bitcoin,
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  QrCode,
  Shield,
  CreditCard,
  XCircle,
  MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface Deposit {
  id: string;
  amount: number;
  paymentMethod: string;
  cryptoType: string | null;
  status: string;
  createdAt: string;
}

const FundAccount = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fundingMethod, setFundingMethod] = useState<"crypto" | "flutterwave">("crypto");
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [amount, setAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cryptoOptions = [
    { value: "btc", name: "Bitcoin (BTC)", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", network: "Bitcoin Network" },
    { value: "eth", name: "Ethereum (ETH)", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68", network: "ERC-20" },
    { value: "usdt", name: "Tether (USDT)", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68", network: "ERC-20 / TRC-20" },
    { value: "usdc", name: "USD Coin (USDC)", address: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68", network: "ERC-20" },
    { value: "bnb", name: "BNB", address: "bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2", network: "BNB Chain" },
    { value: "sol", name: "Solana (SOL)", address: "DYw8jCTfBox68YwPqm8CQ8QeE3YFk9P4WLBpTr2rJKiX", network: "Solana Network" },
  ];

  const selectedCryptoData = cryptoOptions.find(c => c.value === selectedCrypto);

  useEffect(() => {
    if (user) {
      fetchDeposits();
    }
  }, [user]);

  const fetchDeposits = async () => {
    if (!user) return;
    
    try {
      const { data } = await api.get('/user/deposits');
      if (data) {
        setDeposits(data.map((d: any) => ({
          ...d,
          amount: parseFloat(d.amount)
        })));
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Wallet address copied to clipboard",
    });
  };

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit",
      });
      return;
    }
    setShowPaymentDetails(true);
  };

  const initializeFlutterwavePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit",
      });
      return;
    }
    
    try {
      // First, create a deposit record
      const depositResponse = await api.post('/user/deposits', {
        amount: parseFloat(amount),
        paymentMethod: 'flutterwave',
        cryptoType: null,
        transactionHash: null, // Will be updated by webhook
        proofNotes: proofNotes || null
      });
      
      // Then initialize Flutterwave payment
      const response = await api.post('/user/flutterwave-initialize', {
        amount: parseFloat(amount),
        email: user?.email, // Use user's email for the transaction
      });
      
      if (response.data && response.data.data.link) {
        // Redirect to Flutterwave payment page
        window.location.href = response.data.data.link;
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Error initializing Paystack payment:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to initialize Paystack payment",
      });
    }
  };

  const handleSubmitDeposit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await api.post('/user/deposits', {
        amount: parseFloat(amount),
        paymentMethod: fundingMethod,
        cryptoType: fundingMethod === 'crypto' ? selectedCrypto : null,
        transactionHash: transactionHash || null,
        proofNotes: proofNotes || null
      });

      toast({
        title: "Deposit Submitted!",
        description: "Your deposit is pending admin approval. You'll be notified once approved.",
      });

      setShowPaymentDetails(false);
      setAmount("");
      setTransactionHash("");
      setProofNotes("");
      fetchDeposits();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit deposit",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-accent" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Fund Your Account</h1>
          <p className="text-muted-foreground mt-1">
            Add funds to your account using cryptocurrency or Paystack
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Funding Form */}
          <div className="lg:col-span-2">
            <div className="card-elevated-lg p-6 md:p-8">
              {!showPaymentDetails ? (
                <>
                  <h2 className="text-xl font-semibold text-foreground mb-6">
                    Choose Payment Method
                  </h2>

                  <div className="space-y-6">
                    {/* Payment Method Selection */}
                    <div className="flex gap-4">
                      <Button 
                        variant={fundingMethod === "crypto" ? "accent" : "outline"} 
                        className="flex-1 h-auto py-4"
                        onClick={() => setFundingMethod("crypto")}
                      >
                        <Bitcoin className="mr-2 h-5 w-5" />
                        Crypto P2P
                      </Button>

                      <Button 
                        variant={fundingMethod === "flutterwave" ? "accent" : "outline"} 
                        className="flex-1 h-auto py-4"
                        onClick={() => setFundingMethod("flutterwave")}
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Pay with Card
                      </Button>
                    </div>

                    {fundingMethod === "crypto" && (
                      <div className="space-y-2">
                        <Label>Select Cryptocurrency</Label>
                        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cryptocurrency" />
                          </SelectTrigger>
                          <SelectContent>
                            {cryptoOptions.map((crypto) => (
                              <SelectItem key={crypto.value} value={crypto.value}>
                                <div className="flex items-center gap-2">
                                  <Bitcoin className="h-4 w-4 text-muted-foreground" />
                                  <span>{crypto.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Network: {selectedCryptoData?.network}
                        </p>
                      </div>
                    )}

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label>Amount (USD equivalent)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          className="pl-7"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum deposit: $100 • Maximum: $100,000
                      </p>
                    </div>

                    <Button 
                      variant="accent" 
                      size="lg" 
                      className="w-full"
                      onClick={handleContinue}
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">
                      Payment Details
                    </h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowPaymentDetails(false)}
                    >
                      ← Back
                    </Button>
                  </div>

                  {fundingMethod === "crypto" ? (
                    <div className="space-y-6">
                      <div className="bg-muted/50 rounded-lg p-6 text-center">
                        <div className="w-48 h-48 mx-auto bg-background border border-border rounded-lg flex items-center justify-center mb-4">
                          <QrCode className="h-32 w-32 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Scan QR code or copy wallet address
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Wallet Address ({selectedCryptoData?.name})</Label>
                        <div className="flex gap-2">
                          <Input 
                            readOnly 
                            value={selectedCryptoData?.address || ""} 
                            className="font-mono text-xs"
                          />
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => copyToClipboard(selectedCryptoData?.address || "")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-foreground text-sm">Important</h4>
                            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                              <li>• Send only {selectedCryptoData?.name} to this address</li>
                              <li>• Minimum deposit: $100 USD equivalent</li>
                              <li>• Deposits typically confirm within 30-60 minutes</li>
                              <li>• Network: {selectedCryptoData?.network}</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-accent/5 rounded-lg p-4">
                        <p className="text-sm text-foreground">
                          <strong>Amount to deposit:</strong> ${parseFloat(amount).toLocaleString()} USD
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your account will be credited once the transaction is approved by admin
                        </p>
                      </div>

                      {/* Proof of payment */}
                      <div className="space-y-4 border-t border-border pt-4">
                        <h4 className="font-medium text-foreground">Payment Confirmation (Optional)</h4>
                        <div className="space-y-2">
                          <Label>Transaction Hash / ID</Label>
                          <Input 
                            placeholder="Enter transaction hash for faster verification"
                            value={transactionHash}
                            onChange={(e) => setTransactionHash(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Additional Notes</Label>
                          <Textarea 
                            placeholder="Any additional details about your payment..."
                            value={proofNotes}
                            onChange={(e) => setProofNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-purple-600 text-white rounded-lg p-6 text-center">
                        <h3 className="text-xl font-bold mb-2">Pay with Card</h3>
                        <p className="text-sm opacity-80">Secure payment processing</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Amount to charge</Label>
                          <div className="flex gap-2">
                            <Input 
                              readOnly 
                              value={`${parseFloat(amount).toLocaleString()} USD`} 
                              className="font-mono"
                            />
                          </div>
                        </div>

                        <div className="bg-accent/5 rounded-lg p-4">
                          <p className="text-sm text-foreground">
                            <strong>Amount to pay:</strong> ${parseFloat(amount).toLocaleString()} USD
                          </p>
                        </div>

                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-foreground text-sm">Instructions</h4>
                              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                <li>1. Click the "Initialize Payment" button below</li>
                                <li>2. Complete the payment on Flutterwave's secure page</li>
                                <li>3. Your account will be credited once payment is confirmed</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Stripe Payment Button */}
                        <div className="pt-4">
                          <Button 
                            variant="accent" 
                            className="w-full"
                            onClick={initializeFlutterwavePayment}
                          >
                            Initialize Card Payment
                          </Button>
                        </div>

                        {/* Proof of payment */}
                        <div className="space-y-4 border-t border-border pt-4">
                          <h4 className="font-medium text-foreground">Payment Confirmation (Optional)</h4>
                          <div className="space-y-2">
                            <Label>Reference Number</Label>
                            <Input 
                              placeholder="Enter Flutterwave reference number"
                              value={transactionHash}
                              onChange={(e) => setTransactionHash(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Additional Notes</Label>
                            <Textarea 
                              placeholder="Any additional details about your payment..."
                              value={proofNotes}
                              onChange={(e) => setProofNotes(e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    variant="accent" 
                    size="lg" 
                    className="w-full mt-6"
                    onClick={handleSubmitDeposit}
                    disabled={isSubmitting}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Submitting..." : "I've Sent the Payment"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Secure Deposits
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>All transactions are encrypted and secure</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>Funds credited after admin approval</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>No deposit fees for crypto transfers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>24/7 customer support</span>
                </li>
              </ul>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Need Help?</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contact our support team for assistance with deposits.
                  </p>
                  <div className="mt-3 space-y-2">
                    <a href="mailto:ranaeputerbaugh@yahoo.com" className="flex items-center gap-2 text-accent text-xs hover:underline">
                      <CreditCard className="h-3 w-3" />
                      ranaeputerbaugh@yahoo.com
                    </a>
                    <a href="https://wa.me/16462337202" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-accent text-xs hover:underline">
                      <MessageCircle className="h-3 w-3" />
                      WhatsApp: +1 (646) 233-7202
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="mt-8">
          <div className="card-elevated-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Your Deposits</h2>
              <p className="text-sm text-muted-foreground mt-1">Track your deposit requests and their status</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Method</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {deposits.length > 0 ? (
                    deposits.map((deposit) => (
                      <tr key={deposit.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <Bitcoin className="h-4 w-4 text-accent" />
                            {deposit.paymentMethod === 'crypto' 
                              ? cryptoOptions.find(c => c.value === deposit.cryptoType)?.name || 'Crypto'
                              : 'Pay with Card'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-foreground">
                          +${deposit.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-sm ${
                            deposit.status === "approved" ? "text-accent" : 
                            deposit.status === "rejected" ? "text-destructive" : "text-warning"
                          }`}>
                            {getStatusIcon(deposit.status)}
                            {getStatusLabel(deposit.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(deposit.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                        No deposits yet. Make your first deposit to start trading!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FundAccount;