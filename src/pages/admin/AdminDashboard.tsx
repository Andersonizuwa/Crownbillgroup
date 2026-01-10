import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FileCheck,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Mail,
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
  date_of_birth: string | null;
  nationality: string | null;
  country_of_residence: string | null;
  marital_status: string | null;
  tax_id: string | null;
  is_pep: boolean | null;
  pep_details: string | null;
  has_business: boolean | null;
  business_name: string | null;
  business_type: string | null;
  business_industry: string | null;
  business_tax_id: string | null;
}

interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
}

interface CopyTradeAttempt {
  id: string;
  user_id: string;
  trader_name: string;
  asset_symbol: string;
  asset_type: string;
  action_type: string;
  profit_percentage: number | null;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, isAdmin, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [copyTradeAttempts, setCopyTradeAttempts] = useState<CopyTradeAttempt[]>([]);
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
      fetchCopyTradeAttempts();
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

  const fetchCopyTradeAttempts = async () => {
    try {
      const { data, error } = await supabase
        .from('copy_trade_attempts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCopyTradeAttempts(data || []);
    } catch (error) {
      console.error('Error fetching copy trade attempts:', error);
    }
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.email || 'Unknown';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.full_name || 'Unknown';
  };

  const sendFollowUpEmail = (email: string, traderName: string, assetSymbol: string) => {
    const subject = encodeURIComponent(`Follow-up: Copy Trade Interest - ${traderName}`);
    const body = encodeURIComponent(`Hello,\n\nWe noticed you were interested in copying the trade for ${assetSymbol} by ${traderName}.\n\nWe would like to discuss this opportunity with you.\n\nBest regards,\nFidelity Team`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
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
              variant={activeTab === "grants" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("grants")}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Grant Applications
            </Button>
            <Button
              variant={activeTab === "activity" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("activity")}
            >
              <Activity className="h-4 w-4 mr-2" />
              Activity Logs
            </Button>
            <Button
              variant={activeTab === "copyTrades" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("copyTrades")}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Trade Attempts
            </Button>
            <Button
              variant={activeTab === "deposits" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("deposits")}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Deposits
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

          {activeTab === "grants" && (
            <GrantApplicationsTab users={users} />
          )}

          {activeTab === "deposits" && (
            <DepositsTab users={users} onWalletUpdate={fetchWallets} />
          )}

          {activeTab === "activity" && (
            <ActivityLogsTab users={users} />
          )}

          {activeTab === "copyTrades" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Copy Trade Attempts</h2>
                <p className="text-muted-foreground">Users who tried to copy trades or apply strategies</p>
              </div>

              <div className="card-elevated">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User Email</TableHead>
                      <TableHead>User Name</TableHead>
                      <TableHead>Trader</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Profit %</TableHead>
                      <TableHead>Follow Up</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {copyTradeAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>{new Date(attempt.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{getUserEmail(attempt.user_id)}</TableCell>
                        <TableCell>{getUserName(attempt.user_id)}</TableCell>
                        <TableCell>{attempt.trader_name}</TableCell>
                        <TableCell>{attempt.asset_symbol}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{attempt.asset_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={attempt.action_type === 'copy_trade' ? 'default' : 'outline'}>
                            {attempt.action_type === 'copy_trade' ? 'Copy Trade' : 'Analyze'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {attempt.profit_percentage !== null ? (
                            <span className={attempt.profit_percentage >= 0 ? 'text-accent' : 'text-destructive'}>
                              {attempt.profit_percentage >= 0 ? '+' : ''}{attempt.profit_percentage}%
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendFollowUpEmail(
                              getUserEmail(attempt.user_id),
                              attempt.trader_name,
                              attempt.asset_symbol
                            )}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {copyTradeAttempts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No copy trade attempts found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 py-4">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Personal Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-muted-foreground text-xs">Email</Label>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Full Name</Label>
                    <p className="font-medium">{selectedUser.full_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Phone</Label>
                    <p className="font-medium">{selectedUser.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Date of Birth</Label>
                    <p className="font-medium">{selectedUser.date_of_birth || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Nationality</Label>
                    <p className="font-medium capitalize">{selectedUser.nationality || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Country of Residence</Label>
                    <p className="font-medium capitalize">{selectedUser.country_of_residence || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Marital Status</Label>
                    <p className="font-medium capitalize">{selectedUser.marital_status || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Tax ID</Label>
                    <p className="font-medium">{selectedUser.tax_id || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Created</Label>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Account Status</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-muted-foreground text-xs">Account Status</Label>
                    <p className="font-medium capitalize">{selectedUser.account_status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">KYC Status</Label>
                    <p className="font-medium capitalize">{selectedUser.kyc_status}</p>
                  </div>
                </div>
              </div>

              {/* PEP Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">PEP Declaration</h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Is Politically Exposed Person</Label>
                      <p className="font-medium">{selectedUser.is_pep ? 'Yes' : 'No'}</p>
                    </div>
                    {selectedUser.is_pep && selectedUser.pep_details && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground text-xs">PEP Details</Label>
                        <p className="font-medium">{selectedUser.pep_details}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Business Information</h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  {selectedUser.has_business ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">Business Name</Label>
                        <p className="font-medium">{selectedUser.business_name || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Business Type</Label>
                        <p className="font-medium capitalize">{selectedUser.business_type?.replace('-', ' ') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Industry</Label>
                        <p className="font-medium capitalize">{selectedUser.business_industry?.replace('-', ' ') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Business Tax ID (EIN/SSN)</Label>
                        <p className="font-medium">{selectedUser.business_tax_id || '-'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No business registered</p>
                  )}
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

// Grant Applications Tab Component
interface GrantApplication {
  id: string;
  user_id: string;
  grant_type: string;
  organization_name: string;
  organization_type: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  project_description: string;
  requested_amount: number;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

const GrantApplicationsTab = ({ users }: { users: UserProfile[] }) => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<GrantApplication | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.email || 'Unknown';
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('grant_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('grant_applications')
        .update({ 
          status: newStatus,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Application ${newStatus} successfully`,
      });

      setIsReviewOpen(false);
      setSelectedApplication(null);
      setAdminNotes("");
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Under Review</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Grant Applications</h2>
          <p className="text-muted-foreground">Review and manage grant applications</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
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
                <TableHead>Applicant</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Grant Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>{new Date(application.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getUserEmail(application.user_id)}</TableCell>
                  <TableCell className="font-medium">{application.organization_name}</TableCell>
                  <TableCell className="capitalize">{application.grant_type.replace('-', ' ')}</TableCell>
                  <TableCell>${application.requested_amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(application);
                          setIsViewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {application.status === 'pending' || application.status === 'under_review' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setAdminNotes(application.admin_notes || "");
                            setIsReviewOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {applications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No grant applications found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* View Application Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grant Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Applicant Email</Label>
                  <p className="font-medium">{getUserEmail(selectedApplication.user_id)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organization Name</Label>
                  <p className="font-medium">{selectedApplication.organization_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organization Type</Label>
                  <p className="font-medium capitalize">{selectedApplication.organization_type || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Grant Type</Label>
                  <p className="font-medium capitalize">{selectedApplication.grant_type.replace('-', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested Amount</Label>
                  <p className="font-medium text-accent">${selectedApplication.requested_amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Name</Label>
                  <p className="font-medium">{selectedApplication.contact_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Email</Label>
                  <p className="font-medium">{selectedApplication.contact_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Phone</Label>
                  <p className="font-medium">{selectedApplication.contact_phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium">{new Date(selectedApplication.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Project Description</Label>
                <p className="font-medium mt-1 p-3 bg-muted/50 rounded-lg">{selectedApplication.project_description}</p>
              </div>
              {selectedApplication.admin_notes && (
                <div>
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p className="font-medium mt-1 p-3 bg-muted/50 rounded-lg">{selectedApplication.admin_notes}</p>
                </div>
              )}
              {selectedApplication.reviewed_at && (
                <div>
                  <Label className="text-muted-foreground">Reviewed At</Label>
                  <p className="font-medium">{new Date(selectedApplication.reviewed_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Application Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Update the status of this grant application for {selectedApplication?.organization_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this application..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedApplication) {
                  updateApplicationStatus(selectedApplication.id, 'under_review');
                }
              }}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Mark Under Review
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedApplication) {
                  updateApplicationStatus(selectedApplication.id, 'rejected');
                }
              }}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                if (selectedApplication) {
                  updateApplicationStatus(selectedApplication.id, 'approved');
                }
              }}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

// Deposits Tab Component
const DepositsTab = ({ users, onWalletUpdate }: { users: UserProfile[]; onWalletUpdate: () => void }) => {
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user?.email || 'Unknown';
  };

  const fetchDeposits = async () => {
    setLoading(true);
    let query = supabase.from('deposits').select('*').order('created_at', { ascending: false });
    if (statusFilter !== "all") query = query.eq('status', statusFilter);
    const { data } = await query;
    setDeposits(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDeposits(); }, [statusFilter]);

  const updateDeposit = async (depositId: string, userId: string, amount: number, newStatus: 'approved' | 'rejected') => {
    try {
      await supabase.from('deposits').update({ status: newStatus, reviewed_at: new Date().toISOString() }).eq('id', depositId);
      
      if (newStatus === 'approved') {
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', userId).single();
        const newBalance = (wallet?.balance || 0) + amount;
        await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', userId);
        onWalletUpdate();
      }
      
      toast({ title: "Success", description: `Deposit ${newStatus}` });
      fetchDeposits();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Deposit Management</h2>
          <p className="text-muted-foreground">Approve or reject user deposits</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="card-elevated">
        {loading ? <div className="p-8 text-center">Loading...</div> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getUserEmail(d.user_id)}</TableCell>
                  <TableCell className="capitalize">{d.payment_method} {d.crypto_type ? `(${d.crypto_type.toUpperCase()})` : ''}</TableCell>
                  <TableCell className="font-semibold">${d.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'approved' ? 'default' : d.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {d.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="accent" onClick={() => updateDeposit(d.id, d.user_id, d.amount, 'approved')}>
                          <CheckCircle className="h-4 w-4 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateDeposit(d.id, d.user_id, d.amount, 'rejected')}>
                          <XCircle className="h-4 w-4 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {deposits.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No deposits found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
