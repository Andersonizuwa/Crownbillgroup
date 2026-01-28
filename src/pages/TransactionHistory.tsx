import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  History,
  RefreshCw,
  ArrowRight,
  Filter
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade';
  amount: number;
  status: string;
  description: string | null;
  method?: string;
  createdAt: string;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAllTransactions();
  }, [user]);

  const fetchAllTransactions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Fetch deposits
      const depositsResponse = await api.get('/user/deposits');
      const deposits = depositsResponse.data;

      // Fetch withdrawals
      const withdrawalsResponse = await api.get('/user/withdrawals');
      const withdrawals = withdrawalsResponse.data;

      // Fetch transactions (trades, adjustments, etc.)
      const transactionsResponse = await api.get('/user/transactions');
      const trades = transactionsResponse.data;

      // Combine and format all transactions
      const allTransactions: Transaction[] = [];

      deposits?.forEach((d: any) => {
        allTransactions.push({
          id: d.id,
          type: 'deposit',
          amount: parseFloat(d.amount),
          status: d.status,
          description: d.cryptoType 
            ? `${d.paymentMethod.toUpperCase()} - ${d.cryptoType.toUpperCase()}` 
            : d.paymentMethod.toUpperCase(),
          method: d.paymentMethod,
          createdAt: d.createdAt,
        });
      });

      withdrawals?.forEach((w: any) => {
        allTransactions.push({
          id: w.id,
          type: 'withdrawal',
          amount: parseFloat(w.amount),
          status: w.status,
          description: w.withdrawalMethod.replace('_', ' ').toUpperCase(),
          method: w.withdrawalMethod,
          createdAt: w.createdAt,
        });
      });

      trades?.forEach((t: any) => {
        allTransactions.push({
          id: t.id,
          type: 'trade',
          amount: parseFloat(t.amount),
          status: t.status || 'completed',
          description: t.description || t.type,
          createdAt: t.createdAt || new Date().toISOString(),
        });
      });

      // Sort by date (newest first)
      allTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-accent" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <Badge className="bg-accent/10 text-accent border-accent/20">Completed</Badge>;
      case 'rejected':
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-5 w-5 text-accent" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-5 w-5 text-destructive" />;
      default:
        return <History className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      default:
        return 'Trade';
    }
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  // Calculate stats
  const totalDeposits = transactions
    .filter(t => t.type === 'deposit' && (t.status === 'approved' || t.status === 'completed'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal' && (t.status === 'approved' || t.status === 'completed'))
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground mt-1">
            View all your deposits, withdrawals, and trades
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-accent" />
              </div>
              <span className="text-muted-foreground text-sm">Total Deposits</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${totalDeposits.toLocaleString()}
            </p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-destructive" />
              </div>
              <span className="text-muted-foreground text-sm">Total Withdrawals</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${totalWithdrawals.toLocaleString()}
            </p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <span className="text-muted-foreground text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {pendingTransactions}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link to="/fund-account">
            <Button variant="accent">
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              Fund Account
            </Button>
          </Link>
          <Link to="/withdraw">
            <Button variant="outline">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline">
              <ArrowRight className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Transactions Table */}
        <div className="card-elevated-lg overflow-hidden">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">All Transactions</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="trade">Trades</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={fetchAllTransactions}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Description</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((transaction) => (
                    <tr key={`${transaction.type}-${transaction.id}`} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'deposit' ? 'bg-accent/10' :
                            transaction.type === 'withdrawal' ? 'bg-destructive/10' : 'bg-primary/10'
                          }`}>
                            {getTypeIcon(transaction.type)}
                          </div>
                          <span className="font-medium text-foreground">
                            {getTypeLabel(transaction.type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {transaction.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold ${
                          transaction.type === 'deposit' ? 'text-accent' :
                          transaction.type === 'withdrawal' ? 'text-destructive' : 'text-foreground'
                        }`}>
                          {transaction.type === 'deposit' ? '+' : transaction.type === 'withdrawal' ? '-' : ''}
                          ${transaction.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground mb-6">
                {filter === 'all' 
                  ? "Your transaction history will appear here once you make deposits or withdrawals."
                  : `No ${filter}s found. Try a different filter.`}
              </p>
              <Link to="/fund-account">
                <Button variant="accent">
                  Make Your First Deposit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TransactionHistory;