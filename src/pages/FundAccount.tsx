import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowRight, 
  Bitcoin,
  DollarSign,
  AlertCircle,
  Copy,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const FundAccount = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fundingMethod, setFundingMethod] = useState<"crypto" | "fiat">("crypto");
  const [selectedCrypto, setSelectedCrypto] = useState("usdt");
  const [amount, setAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [proofFiles, setProofFiles] = useState<FileList | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [pollingDepositId, setPollingDepositId] = useState<string | null>(null);
  const [selectedDepositForProof, setSelectedDepositForProof] = useState<any | null>(null);
  const [settlementDetailsModalOpen, setSettlementDetailsModalOpen] = useState(false);
  const [depositForModal, setDepositForModal] = useState<any | null>(null);

  const cryptoOptions = [
    { value: "btc", name: "Bitcoin (BTC)", address: "bc1qhf7jrcwtadxeudx5fpvh94njlxqlgw4h5p4xql", network: "Bitcoin Network" },
    { value: "usdt", name: "USDT (TRC20/ERC20)", address: "TScRwtiYR6A1nufXed2Hw6cVkvpyUAhChv", network: "TRC-20" },
  ];

  const bankOptions = [
    { value: "zelle", name: "Zelle" },
    { value: "square", name: "Square/Cash App" },
    { value: "paypal", name: "PayPal" }
  ];

  const selectedCryptoData = cryptoOptions.find(c => c.value === selectedCrypto);

  // Polling function for settlement details
  const startPollingForSettlementDetails = (depositId: string) => {
    setPollingDepositId(depositId);
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.get(`/user/deposits/${depositId}`);
        const deposit = response.data;
        
        if (deposit.settlementDetails && deposit.status === 'awaiting_payment') {
          // Settlement details are ready
          clearInterval(pollInterval);
          setPollingDepositId(null);

          setDepositForModal(deposit);
          setSettlementDetailsModalOpen(true);
          // Refresh deposits to show updated status
          fetchDeposits();
        } else if (deposit.status === 'rejected') {
          // Stop polling if rejected
          clearInterval(pollInterval);
          setPollingDepositId(null);
          
          toast({
            variant: "destructive",
            title: "Deposit Rejected",
            description: deposit.adminNotes || "Your deposit request was rejected.",
          });
          fetchDeposits();
        }
      } catch (error) {
        console.error('Error polling for settlement details:', error);
        clearInterval(pollInterval);
        setPollingDepositId(null);
      }
    }, 5000); // Poll every 5 seconds
  };

  // Fetch deposits on component mount
  useEffect(() => {
    if (user) {
      fetchDeposits();
      checkForPendingDepositsWithDetails();
    }
  }, [user]);

  // Check for pending deposits with settlement details
  const checkForPendingDepositsWithDetails = async () => {
    try {
      const response = await api.get('/user/deposits');
      const deposits = response.data || [];
      
      // Look for deposits with settlement details in awaiting_payment status
      const pendingDeposit = deposits.find((deposit: any) => 
        deposit.settlementDetails && deposit.status === 'awaiting_payment'
      );
      
      if (pendingDeposit && !pollingDepositId) {
        // Show modal
        setDepositForModal(pendingDeposit);
        setSettlementDetailsModalOpen(true);
        // Update deposits list
        setDeposits(deposits);
      }
    } catch (error) {
      console.error('Error checking for pending deposits:', error);
    }
  };

  const fetchDeposits = async () => {
    try {
      const response = await api.get('/user/deposits');
      setDeposits(response.data || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
      });
    });
  };

  const handleSubmitProof = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      let depositId = selectedDepositForProof?.id;

      // If no deposit is selected, it's a new crypto deposit
      if (!depositId) {
        // Create deposit first
        const depositResponse = await api.post('/user/deposits', {
          amount: parseFloat(amount) || 0,
          paymentMethod: 'crypto',
          cryptoType: selectedCrypto,
          transactionHash: null,
          proofNotes: proofNotes || null,
          type: 'crypto_deposit'
        });
        depositId = depositResponse.data.id;
      }

      // Submit proof
      const formData = new FormData();
      
      if (proofFiles) {
        for (let i = 0; i < proofFiles.length; i++) {
          formData.append('files', proofFiles[i]);
        }
      }
      
      formData.append('transactionHash', transactionHash || '');
      formData.append('proofNotes', proofNotes || '');
      
      // Only include amount if we are creating a new one (not for fiat which already has amount)
      if (!selectedDepositForProof) {
        formData.append('amount', amount || '0');
      }
      
      await api.patch(`/user/deposits/${depositId}/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast({
        title: "Proof Submitted!",
        description: "Your payment proof has been submitted. Please wait for admin verification.",
      });

      // Reset form and return to main view
      setShowPaymentDetails(false);
      setSelectedDepositForProof(null);
      setSelectedCrypto('usdt');
      setAmount("");
      setTransactionHash("");
      setProofNotes("");
      setProofFiles(null);
      
      // Refresh deposits
      fetchDeposits();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit payment proof",
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
      case 'awaiting_payment':
      case 'awaiting_confirmation':
        return <Clock className="h-4 w-4 text-accent" />;
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
      case 'pending_matching':
        return 'Pending Matching';
      case 'awaiting_payment':
        return 'Awaiting Payment';
      case 'awaiting_confirmation':
        return 'Awaiting Confirmation';
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
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Fund Your Account</h1>
          <p className="text-muted-foreground mt-1">
            Add funds to your account using various payment methods
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card-elevated-lg p-6 md:p-8">
              {/* Main Payment Selection - Always Visible Unless Payment Details is Shown */}
              {!showPaymentDetails && (
                <>
                  <h2 className="text-xl font-semibold text-foreground mb-6">
                    Choose Payment Method
                  </h2>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant={fundingMethod === "fiat" ? "accent" : "outline"} 
                        className="h-auto py-4"
                        onClick={() => {
                          setFundingMethod("fiat");
                          setShowPaymentDetails(false);
                        }}
                      >
                        <DollarSign className="mr-2 h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium text-sm">Bank Transfer/Zelle/Square/Paypal</div>
                          <div className="text-xs opacity-70">P2P - 10% processing fee</div>
                        </div>
                      </Button>

                      <Button 
                        variant={fundingMethod === "crypto" ? "accent" : "outline"} 
                        className="h-auto py-4"
                        onClick={() => {
                          setFundingMethod("crypto");
                          setShowPaymentDetails(false);
                        }}
                      >
                        <Bitcoin className="mr-2 h-5 w-5" />
                        <div className="text-left">
                          <div className="font-medium">Crypto P2P</div>
                          <div className="text-xs opacity-70">Free</div>
                        </div>
                      </Button>
                    </div>

                    {fundingMethod === "fiat" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Amount to Fund ($)</Label>
                          <Input 
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="10"
                          />
                          <p className="text-xs text-muted-foreground">
                            Minimum: $10 • 10% processing fee will be applied
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Select Payment Method</Label>
                          <Select value={selectedBank} onValueChange={setSelectedBank}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose your payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              {bankOptions.map((bank) => (
                                <SelectItem key={bank.value} value={bank.value}>
                                  {bank.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {fundingMethod === "crypto" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Select Cryptocurrency</Label>
                          <Select value={selectedCrypto} onValueChange={(value) => {
                            setSelectedCrypto(value);
                            // Don't automatically go to next step - let user see wallet address first
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cryptocurrency" />
                            </SelectTrigger>
                            <SelectContent>
                              {cryptoOptions.map((crypto) => (
                                <SelectItem key={crypto.value} value={crypto.value}>
                                  <div className="flex items-center gap-2">
                                    <Bitcoin className="h-4 w-4 text-muted-foreground" />
                                    <span>{crypto.name} (Free)</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Network: {selectedCryptoData?.network}
                          </p>
                        </div>

                        {selectedCryptoData && (
                          <div className="space-y-3 bg-muted/30 rounded-lg p-4">
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

                            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-muted-foreground">
                                  <p className="font-medium text-foreground mb-1">Important Instructions</p>
                                  <ul className="space-y-1">
                                    <li>• Send only {selectedCryptoData?.name} to this address</li>
                                    <li>• Network: {selectedCryptoData?.network}</li>
                                    <li>• <strong>Save your transaction hash for proof submission</strong></li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {fundingMethod === "crypto" && selectedCryptoData && (
                      <div className="bg-accent/5 rounded-lg p-4">
                        <p className="text-sm text-foreground text-center">
                          <strong>Send your {selectedCryptoData?.name} to the wallet address above</strong>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          After sending payment, click below to submit proof of transaction
                        </p>
                      </div>
                    )}

                    <Button 
                      variant="accent" 
                      size="lg" 
                      className="w-full"
                      disabled={
                        (fundingMethod === "crypto" && !selectedCryptoData) ||
                        (fundingMethod === "fiat" && (!amount || parseFloat(amount) < 10 || !selectedBank))
                      }
                      onClick={async () => {
                        if (fundingMethod === "crypto" && selectedCryptoData) {
                          setShowPaymentDetails(true);
                        } else if (fundingMethod === "fiat" && amount && parseFloat(amount) >= 10) {
                          // Handle fiat deposit - create pending matching deposit
                          setIsSubmitting(true);
                          try {
                            const response = await api.post('/user/deposits', {
                              amount: parseFloat(amount),
                              paymentMethod: selectedBank,
                              type: 'fiat_intent',
                              status: 'pending_matching'
                            });
                            
                            toast({
                              title: "Funding Request Submitted",
                              description: "Please wait while we assign a settlement counterparty. This may take up to 30 minutes.",
                            });
                            
                            // Start polling for settlement details
                            if (response.data?.id) {
                              startPollingForSettlementDetails(response.data.id);
                            }
                            
                            // Reset form
                            setAmount("");
                            setSelectedBank("");
                            setFundingMethod("crypto");
                            
                            // Refresh deposits to show the new pending deposit
                            fetchDeposits();
                          } catch (error: any) {
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: error.message || "Failed to submit funding request",
                            });
                          } finally {
                            setIsSubmitting(false);
                          }
                        }
                      }}
                    >
                      {isSubmitting ? (
                        "Processing..."
                      ) : fundingMethod === "crypto" ? (
                        <>
                          I've Sent the Payment - Submit Proof
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Payment Details View */}
              {showPaymentDetails && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-foreground">
                      {selectedDepositForProof ? "Submit Fiat Payment Proof" : "Submit Crypto Payment Proof"}
                    </h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setShowPaymentDetails(false);
                        setSelectedDepositForProof(null);
                        setSelectedCrypto('usdt');
                        setProofNotes('');
                        setProofFiles(null);
                        setTransactionHash('');
                      }}
                    >
                      ← Back
                    </Button>
                  </div>

                  {selectedDepositForProof && selectedDepositForProof.settlementDetails && (
                    <div className="mb-6 space-y-4 bg-accent/5 p-4 rounded-lg border border-accent/20">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Settlement Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Bank Name</p>
                          <p className="font-medium">{selectedDepositForProof.settlementDetails.bankName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Account Holder</p>
                          <p className="font-medium">{selectedDepositForProof.settlementDetails.accountHolderName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Account Number</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium font-mono">{selectedDepositForProof.settlementDetails.accountNumber}</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedDepositForProof.settlementDetails.accountNumber)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Reference Code</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-accent">{selectedDepositForProof.settlementDetails.referenceCode}</p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedDepositForProof.settlementDetails.referenceCode)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-accent/10">
                        <p className="text-xs text-muted-foreground italic">
                          Please include the Reference Code in your transfer notes for faster processing.
                        </p>
                      </div>
                    </div>
                  )}

                  {(fundingMethod === "crypto" || selectedDepositForProof) && (
                    <div className="space-y-6">
                      {fundingMethod === "crypto" && !selectedDepositForProof && (
                        <div className="space-y-2">
                          <Label>Amount Sent ($)</Label>
                          <Input
                            type="number"
                            placeholder="Enter the USD equivalent amount you sent"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="0"
                          />
                        </div>
                      )}
                      <div className="space-y-4">
                        <h4 className="font-medium text-foreground">Upload Transfer Receipt</h4>
                        
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => document.getElementById('proof-upload')?.click()}
                        >
                          <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="text-accent font-medium">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, PDF up to 10MB
                          </p>
                          <input 
                            id="proof-upload" 
                            type="file" 
                            className="hidden" 
                            accept="image/*,application/pdf" 
                            multiple
                            onChange={(e) => setProofFiles(e.target.files)}
                          />
                        </div>
                        
                        {proofFiles && proofFiles.length > 0 && (
                          <div className="mt-3 text-sm text-muted-foreground">
                            {Array.from(proofFiles).map((file, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Transaction Hash/Reference</Label>
                        <Input 
                          placeholder="Enter your transaction hash or reference number"
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

                      {fundingMethod === "crypto" && !selectedDepositForProof && (
                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-foreground text-sm">Important</h4>
                              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                                <li>• Send only {selectedCryptoData?.name} to this address</li>
                                <li>• Network: {selectedCryptoData?.network}</li>
                                <li>• <strong>Save your transaction hash for proof submission</strong></li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button 
                        variant="accent" 
                        size="lg" 
                        className="w-full"
                        onClick={handleSubmitProof}
                        disabled={isSubmitting ||
                          (fundingMethod === "crypto" && !selectedDepositForProof && (!amount || parseFloat(amount) <= 0))
                        }
                      >
                        {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Deposit History Section */}
            <div className="card-elevated-lg p-6 md:p-8 mt-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Your Deposit History
              </h2>
              
              {deposits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No deposit history found</p>
                  <p className="text-sm mt-1">Your deposit records will appear here once you make deposits</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deposits.map((deposit) => (
                    <div key={deposit.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(deposit.status)}
                          <div>
                            <h3 className="font-medium text-foreground">
                              {deposit.cryptoType ? `${deposit.paymentMethod.toUpperCase()} - ${deposit.cryptoType.toUpperCase()}` : deposit.paymentMethod.toUpperCase()}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ${parseFloat(deposit.amount).toLocaleString()} • {new Date(deposit.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            deposit.status === 'approved' ? 'bg-accent/20 text-accent' :
                            deposit.status === 'rejected' ? 'bg-destructive/20 text-destructive' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {getStatusLabel(deposit.status)}
                          </span>
                          
                          {deposit.status === 'awaiting_payment' && (
                            <Button 
                              variant="accent" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedDepositForProof(deposit);
                                setShowPaymentDetails(true);
                              }}
                            >
                              Submit Proof
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {deposit.status === 'awaiting_payment' && deposit.settlementDetails && (
                        <div className="mt-3 p-3 bg-accent/5 rounded border border-accent/10 text-xs space-y-1">
                          <p className="font-semibold text-foreground mb-1">Settlement Details:</p>
                          <p><span className="text-muted-foreground">Bank:</span> {deposit.settlementDetails.bankName}</p>
                          <p><span className="text-muted-foreground">Account:</span> {deposit.settlementDetails.accountNumber}</p>
                          <p><span className="text-muted-foreground">Holder:</span> {deposit.settlementDetails.accountHolderName}</p>
                          <p><span className="text-muted-foreground">Ref:</span> <span className="text-accent font-medium">{deposit.settlementDetails.referenceCode}</span></p>
                        </div>
                      )}
                      
                      {deposit.transactionHash && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Transaction:</span> {deposit.transactionHash}
                        </div>
                      )}
                      
                      {deposit.proofNotes && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Notes:</span> {deposit.proofNotes}
                        </div>
                      )}
                      
                      {deposit.status === 'rejected' && deposit.adminNotes && (
                        <div className="mt-2 p-2 rounded bg-destructive/10 text-sm text-destructive">
                          <span className="font-medium">Rejection Reason:</span> {deposit.adminNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-foreground mb-4">Secure Deposits</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>• All transactions are encrypted and secure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>• Funds credited after admin approval</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={settlementDetailsModalOpen} onOpenChange={setSettlementDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settlement Details Available</DialogTitle>
          </DialogHeader>
          {depositForModal && (
            <div className="space-y-4 py-4">
              {/* Deposit Info */}
              <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                <div>
                  <p className="font-bold text-foreground">{depositForModal.paymentMethod.toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">{new Date(depositForModal.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-xl font-bold text-foreground">${parseFloat(depositForModal.amount).toLocaleString()}</p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-accent font-medium">
                <Clock className="h-4 w-4" />
                Awaiting Payment
              </div>

              {/* Settlement Details */}
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="font-semibold text-foreground">Settlement Details:</h4>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p><span className="font-medium text-foreground">Bank:</span> {depositForModal.settlementDetails.bankName}</p>
                  <p><span className="font-medium text-foreground">Account:</span> {depositForModal.settlementDetails.accountNumber}</p>
                  <p><span className="font-medium text-foreground">Holder:</span> {depositForModal.settlementDetails.accountHolderName}</p>
                  <p><span className="font-medium text-foreground">Ref:</span> <span className="text-accent font-bold">{depositForModal.settlementDetails.referenceCode}</span></p>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full"
                variant="accent"
                size="lg"
                onClick={() => {
                  setSelectedDepositForProof(depositForModal);
                  setShowPaymentDetails(true);
                  setSettlementDetailsModalOpen(false);
                }}
              >
                Submit Proof
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default FundAccount;