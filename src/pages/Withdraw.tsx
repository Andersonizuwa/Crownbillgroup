import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/contexts/ConfirmContext";
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
  XCircle,
  AlertCircle,
  Building2,
  ArrowDownToLine
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface Withdrawal {
  id: string;
  amount: number;
  withdrawalMethod: string;
  walletAddress: string | null;
  bankDetails: string | null;
  status: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  currency: string;
}

const Withdraw = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [withdrawalMethod, setWithdrawalMethod] = useState<"crypto" | "bank">("crypto");
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cryptoOptions = [
    { value: "btc", name: "Bitcoin (BTC)" },
    { value: "usdt", name: "Tether (USDT)" },
  ];

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;
    
    try {
      const { data } = await api.get('/user/wallet');
      if (data) {
        setWallet({
          balance: parseFloat(data.balance),
          currency: data.currency
        });
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchWithdrawals = async () => {
    if (!user) return;
    
    try {
      const { data } = await api.get('/user/withdrawals');
      if (data) {
        setWithdrawals(data.map((w: any) => ({
          ...w,
          amount: parseFloat(w.amount)
        })));
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const handleSubmitWithdrawal = async () => {
    if (!user) return;
    
    const withdrawAmount = parseFloat(amount);
    
    if (!amount || withdrawAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw",
      });
      return;
    }

    if (wallet && withdrawAmount > wallet.balance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: `Your wallet balance is $${wallet.balance.toLocaleString()}. You cannot withdraw more than your available balance.`,
      });
      return;
    }

    if (withdrawalMethod === "crypto" && !walletAddress) {
      toast({
        variant: "destructive",
        title: "Missing Wallet Address",
        description: "Please enter your wallet address to receive the funds",
      });
      return;
    }

    if (withdrawalMethod === "bank" && !bankDetails) {
      toast({
        variant: "destructive",
        title: "Missing Bank Details",
        description: "Please enter your bank details to receive the funds",
      });
      return;
    }

    const confirmed = await confirm({
      title: "Confirm Withdrawal",
      description: `Are you sure you want to withdraw $${withdrawAmount.toLocaleString()}? This request will be sent to our team for approval.`,
      confirmText: "Confirm Withdrawal"
    });

    if (!confirmed) return;

    setIsSubmitting(true);
    
    try {
      await api.post('/user/withdrawals', {
        amount: withdrawAmount,
        withdrawalMethod: withdrawalMethod === 'crypto' ? `crypto_${selectedCrypto}` : 'bank_transfer',
        walletAddress: withdrawalMethod === 'crypto' ? walletAddress : null,
        bankDetails: withdrawalMethod === 'bank' ? bankDetails : null
      });

      toast({
        title: "Withdrawal Request Submitted!",
        description: "Your withdrawal is pending admin approval. You'll be notified once processed.",
      });

      setAmount("");
      setWalletAddress("");
      setBankDetails("");
      fetchWithdrawals();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit withdrawal request",
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Withdraw Funds</h1>
          <p className="text-muted-foreground mt-1">
            Request a withdrawal from your wallet balance
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Withdrawal Form */}
          <div className="lg:col-span-2">
            <div className="card-elevated-lg p-6 md:p-8">
              {/* Available Balance */}
              <div className="bg-accent/5 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${wallet?.balance?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-foreground mb-6">
                Withdrawal Details
              </h2>

              <div className="space-y-6">
                {/* Withdrawal Method Selection */}
                <div className="flex gap-4">
                  <Button 
                    variant={withdrawalMethod === "crypto" ? "accent" : "outline"} 
                    className="flex-1 h-auto py-4"
                    onClick={() => setWithdrawalMethod("crypto")}
                  >
                    <Bitcoin className="mr-2 h-5 w-5" />
                    Crypto
                  </Button>
                  <Button 
                    variant={withdrawalMethod === "bank" ? "accent" : "outline"} 
                    className="flex-1 h-auto py-4"
                    onClick={() => setWithdrawalMethod("bank")}
                  >
                    <Building2 className="mr-2 h-5 w-5" />
                    Bank Transfer
                  </Button>
                </div>

                {withdrawalMethod === "crypto" && (
                  <>
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
                    </div>

                    <div className="space-y-2">
                      <Label>Your Wallet Address</Label>
                      <Input 
                        placeholder="Enter your wallet address"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Double-check the address. We are not responsible for funds sent to incorrect addresses.
                      </p>
                    </div>
                  </>
                )}

                {withdrawalMethod === "bank" && (
                  <div className="space-y-2">
                    <Label>Bank Details</Label>
                    <Textarea 
                      placeholder="Enter your bank details:&#10;Bank Name:&#10;Account Number:&#10;Routing Number:&#10;Account Holder Name:&#10;SWIFT/BIC (for international):"
                      value={bankDetails}
                      onChange={(e) => setBankDetails(e.target.value)}
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Include all necessary details for the wire transfer
                    </p>
                  </div>
                )}

                {/* Amount */}
                <div className="space-y-2">
                  <Label>Withdrawal Amount (USD)</Label>
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
                    Minimum withdrawal: $50 • Maximum: ${wallet?.balance?.toLocaleString() || '0'}
                  </p>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground text-sm">Processing Time</h4>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        <li>• Crypto withdrawals: 1-24 hours</li>
                        <li>• Bank transfers: 3-5 business days</li>
                        <li>• All withdrawals require admin approval</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="accent" 
                  size="lg" 
                  className="w-full"
                  onClick={handleSubmitWithdrawal}
                  disabled={isSubmitting}
                >
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Request Withdrawal"}
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/fund-account" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Wallet className="mr-2 h-4 w-4" />
                    Fund Account
                  </Button>
                </Link>
                <Link to="/dashboard" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* Support */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-foreground mb-4">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Contact our support team for withdrawal assistance.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Email: <a href="mailto:ranaeputerbaugh@yahoo.com" className="text-accent hover:underline">ranaeputerbaugh@yahoo.com</a>
                </p>
                <p className="text-muted-foreground">
                  WhatsApp: <a href="https://wa.me/16462337202" className="text-accent hover:underline">+1 (646) 233-7202</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="mt-8">
          <div className="card-elevated-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Withdrawal History</h2>
              <p className="text-sm text-muted-foreground mt-1">Track the status of your withdrawal requests</p>
            </div>

            {withdrawals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Date</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Method</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Amount</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-foreground capitalize">
                            {withdrawal.withdrawalMethod.replace('_', ' ').replace('crypto ', '')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-foreground">
                          ${withdrawal.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(withdrawal.status)}
                            <span className={`text-sm capitalize ${
                              withdrawal.status === 'approved' ? 'text-accent' :
                              withdrawal.status === 'rejected' ? 'text-destructive' :
                              'text-muted-foreground'
                            }`}>
                              {getStatusLabel(withdrawal.status)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <ArrowDownToLine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Withdrawal Requests Yet</h3>
                <p className="text-muted-foreground">
                  Your withdrawal history will appear here once you make a request.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Withdraw;