import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowRight, 
  ArrowLeftRight, 
  Building2, 
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const Transfers = () => {
  const recentTransfers = [
    { id: 1, type: "Deposit", from: "Bank of America ****1234", amount: 5000, status: "Completed", date: "Dec 28, 2025" },
    { id: 2, type: "Withdrawal", to: "Chase ****5678", amount: 2500, status: "Pending", date: "Dec 27, 2025" },
    { id: 3, type: "Deposit", from: "Wells Fargo ****9012", amount: 10000, status: "Completed", date: "Dec 25, 2025" },
  ];

  const linkedAccounts = [
    { id: 1, name: "Bank of America", type: "Checking", last4: "1234" },
    { id: 2, name: "Chase", type: "Savings", last4: "5678" },
    { id: 3, name: "Wells Fargo", type: "Checking", last4: "9012" },
  ];

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transfers</h1>
          <p className="text-muted-foreground mt-1">
            Move money between your accounts
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Transfer Form */}
          <div className="lg:col-span-2">
            <div className="card-elevated-lg p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Make a Transfer
              </h2>

              <div className="space-y-6">
                {/* Transfer Type */}
                <div className="flex gap-4">
                  <Button variant="accent" className="flex-1">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Deposit
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Withdraw
                  </Button>
                </div>

                {/* From Account */}
                <div className="space-y-2">
                  <Label>From</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source account" />
                    </SelectTrigger>
                    <SelectContent>
                      {linkedAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{account.name} {account.type} ****{account.last4}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* To Account */}
                <div className="space-y-2">
                  <Label>To</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brokerage">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span>Fidelity Brokerage Account</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="ira">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span>Fidelity IRA Account</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input type="number" placeholder="0.00" className="pl-7" />
                  </div>
                </div>

                {/* Frequency */}
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select defaultValue="once">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">One-time transfer</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="accent" size="lg" className="w-full">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Transfers typically complete within 1-3 business days
                </p>
              </div>
            </div>
          </div>

          {/* Linked Accounts Sidebar */}
          <div className="space-y-6">
            <div className="card-elevated p-6">
              <h3 className="font-semibold text-foreground mb-4">Linked Accounts</h3>
              <div className="space-y-3">
                {linkedAccounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground text-sm">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.type} ****{account.last4}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Link New Account
              </Button>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">Need Help?</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Our support team is available 24/7 to assist with transfers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="mt-8">
          <div className="card-elevated-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Recent Transfers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Details</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          transfer.type === "Deposit" ? "text-accent" : "text-foreground"
                        }`}>
                          {transfer.type === "Deposit" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeftRight className="h-4 w-4" />}
                          {transfer.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {transfer.from || transfer.to}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        ${transfer.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-sm ${
                          transfer.status === "Completed" ? "text-accent" : "text-warning"
                        }`}>
                          {transfer.status === "Completed" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{transfer.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Transfers;
