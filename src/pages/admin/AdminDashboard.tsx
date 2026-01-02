import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Wallet,
  Activity,
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  LogOut,
  LayoutDashboard,
  History,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  account_status: 'active' | 'inactive' | 'pending';
  kyc_status: string;
  created_at: string;
}

interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
}

const AdminDashboard = () => {
  const { user, isAdmin, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [activeTab, setActiveTab] = useState("users");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditWalletOpen, setIsEditWalletOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [newUserData, setNewUserData] = useState({ email: "", password: "" });
  const [walletAmount, setWalletAmount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchWallets();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*');

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  const createUser = async () => {
    try {
      // Create user via Supabase Auth Admin API (this is a simplified version)
      // In production, you'd use an edge function with service role key
      const { data, error } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User created successfully",
      });

      setIsCreateUserOpen(false);
      setNewUserData({ email: "", password: "" });
      fetchUsers();
      fetchWallets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const updateWallet = async () => {
    if (!selectedWallet) return;

    try {
      const { error } = await supabase
        .from('wallets')
        .update({ balance: parseFloat(walletAmount) })
        .eq('id', selectedWallet.id);

      if (error) throw error;

      // Log the transaction
      await supabase.from('transactions').insert({
        user_id: selectedWallet.user_id,
        type: 'deposit',
        amount: parseFloat(walletAmount) - selectedWallet.balance,
        description: 'Admin wallet adjustment',
        status: 'completed',
      });

      toast({
        title: "Success",
        description: "Wallet updated successfully",
      });

      setIsEditWalletOpen(false);
      setSelectedWallet(null);
      setWalletAmount("");
      fetchWallets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update wallet",
        variant: "destructive",
      });
    }
  };

  const updateAccountStatus = async (userId: string, status: 'active' | 'inactive' | 'pending') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: status })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account status updated",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      // Delete from profiles (will cascade to other tables)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers();
      fetchWallets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getWalletForUser = (userId: string) => {
    return wallets.find(w => w.user_id === userId);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="container-main flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <span className="text-xl font-bold text-foreground">Admin Dashboard</span>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-64px)] border-r border-border bg-card p-4">
          <nav className="space-y-2">
            <Button
              variant={activeTab === "users" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("users")}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
            <Button
              variant={activeTab === "wallets" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("wallets")}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Wallets
            </Button>
            <Button
              variant={activeTab === "transactions" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("transactions")}
            >
              <History className="h-4 w-4 mr-2" />
              Transactions
            </Button>
            <Button
              variant={activeTab === "activity" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("activity")}
            >
              <Activity className="h-4 w-4 mr-2" />
              Activity Logs
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">User Management</h2>
                  <p className="text-muted-foreground">Manage all user accounts</p>
                </div>
                <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                  <DialogTrigger asChild>
                    <Button variant="accent">
                      <Plus className="h-4 w-4 mr-2" />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account with just email and password.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter password"
                          value={newUserData.password}
                          onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                        Cancel
                      </Button>
                      <Button variant="accent" onClick={createUser}>
                        Create User
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="card-elevated">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((userProfile) => {
                      const wallet = getWalletForUser(userProfile.user_id);
                      return (
                        <TableRow key={userProfile.id}>
                          <TableCell className="font-medium">{userProfile.email}</TableCell>
                          <TableCell>{userProfile.full_name || '-'}</TableCell>
                          <TableCell>
                            <Select
                              value={userProfile.account_status}
                              onValueChange={(value: 'active' | 'inactive' | 'pending') =>
                                updateAccountStatus(userProfile.user_id, value)
                              }
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                userProfile.kyc_status === 'approved'
                                  ? 'default'
                                  : userProfile.kyc_status === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {userProfile.kyc_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            ${wallet?.balance?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>
                            {new Date(userProfile.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(userProfile);
                                  setIsViewUserOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const w = getWalletForUser(userProfile.user_id);
                                  if (w) {
                                    setSelectedWallet(w);
                                    setWalletAmount(w.balance.toString());
                                    setIsEditWalletOpen(true);
                                  }
                                }}
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteUser(userProfile.user_id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === "wallets" && (
            <WalletsTab wallets={wallets} users={users} onRefresh={fetchWallets} />
          )}

          {activeTab === "transactions" && (
            <TransactionsTab users={users} />
          )}

          {activeTab === "activity" && (
            <ActivityLogsTab users={users} />
          )}
        </main>
      </div>

      {/* Edit Wallet Dialog */}
      <Dialog open={isEditWalletOpen} onOpenChange={setIsEditWalletOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wallet Balance</DialogTitle>
            <DialogDescription>
              Update the wallet balance for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Balance ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditWalletOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={updateWallet}>
              Update Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewUserOpen} onOpenChange={setIsViewUserOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{selectedUser.full_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Status</Label>
                  <p className="font-medium capitalize">{selectedUser.account_status}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">KYC Status</Label>
                  <p className="font-medium capitalize">{selectedUser.kyc_status}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wallets Tab Component
const WalletsTab = ({ 
  wallets, 
  users, 
  onRefresh 
}: { 
  wallets: UserWallet[]; 
  users: UserProfile[]; 
  onRefresh: () => void;
}) => {
  const { toast } = useToast();
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.email || 'Unknown';
  };

  const updateWallet = async () => {
    if (!selectedWallet) return;

    try {
      const { error } = await supabase
        .from('wallets')
        .update({ balance: parseFloat(walletAmount) })
        .eq('id', selectedWallet.id);

      if (error) throw error;

      // Log the transaction
      const amountDiff = parseFloat(walletAmount) - selectedWallet.balance;
      await supabase.from('transactions').insert({
        user_id: selectedWallet.user_id,
        type: amountDiff >= 0 ? 'deposit' : 'withdrawal',
        amount: Math.abs(amountDiff),
        description: 'Admin wallet adjustment',
        status: 'completed',
      });

      toast({
        title: "Success",
        description: "Wallet updated successfully",
      });

      setIsEditOpen(false);
      setSelectedWallet(null);
      setWalletAmount("");
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update wallet",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Wallet Management</h2>
        <p className="text-muted-foreground">View and manage user wallets</p>
      </div>

      <div className="card-elevated">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Email</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets.map((wallet) => (
              <TableRow key={wallet.id}>
                <TableCell className="font-medium">{getUserEmail(wallet.user_id)}</TableCell>
                <TableCell className="text-accent font-semibold">
                  ${wallet.balance?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell>{wallet.currency}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedWallet(wallet);
                      setWalletAmount(wallet.balance.toString());
                      setIsEditOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Balance
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wallet Balance</DialogTitle>
            <DialogDescription>
              Update the wallet balance for {selectedWallet && getUserEmail(selectedWallet.user_id)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-amount">New Balance ($)</Label>
              <Input
                id="wallet-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={updateWallet}>
              Update Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Transactions Tab Component
const TransactionsTab = ({ users }: { users: UserProfile[] }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.email || 'Unknown';
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedUserId !== "all") {
        query = query.eq('user_id', selectedUserId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedUserId, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
        <p className="text-muted-foreground">View and filter all transactions</p>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchTransactions}>Apply Filters</Button>
          </div>
        </div>
      </div>

      <div className="card-elevated">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                  <TableCell>{getUserEmail(tx.user_id)}</TableCell>
                  <TableCell className="capitalize">{tx.type}</TableCell>
                  <TableCell className={tx.type === 'withdrawal' ? 'text-destructive' : 'text-accent'}>
                    {tx.type === 'withdrawal' ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{tx.description || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.status === 'completed'
                          ? 'default'
                          : tx.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

// Activity Logs Tab Component
const ActivityLogsTab = ({ users }: { users: UserProfile[] }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.email || 'Unknown';
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Activity Logs</h2>
        <p className="text-muted-foreground">Monitor user activities</p>
      </div>

      <div className="card-elevated">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell>{getUserEmail(log.user_id)}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </TableCell>
                  <TableCell>{log.ip_address || '-'}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No activity logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
