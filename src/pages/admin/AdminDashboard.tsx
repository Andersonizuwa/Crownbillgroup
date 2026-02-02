import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import api from "@/lib/api";
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
  ArrowDownToLine,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  accountStatus: 'active' | 'inactive' | 'pending';
  kycStatus: string;
  createdAt: string;
  dateOfBirth: string | null;
  nationality: string | null;
  countryOfResidence: string | null;
  maritalStatus: string | null;
  taxId: string | null;
  isPep: boolean | null;
  pepDetails: string | null;
  hasBusiness: boolean | null;
  businessName: string | null;
  businessType: string | null;
  businessIndustry: string | null;
  businessTaxId: string | null;
  roles: string[];
}

interface UserWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

interface CopyTradeAttempt {
  id: string;
  userId: string;
  traderName: string;
  assetSymbol: string;
  assetType: string;
  actionType: string;
  profitPercentage: number | null;
  createdAt: string;
}

const AdminDashboard = () => {
  const { user, isAdmin, signOut, isLoading } = useAuth();
  const confirm = useConfirm();
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
      const { data } = await api.get('/admin/users');
      // Format backend response to match frontend interface
      setUsers(data.map((u: any) => {
        const mappedUser = {
          ...u.profile,
          email: u.email,
          userId: u.id,
          roles: u.roles?.map((r: any) => r.role) || []
        };
        
        // Debug logging for admin user
        if (u.email === 'admin@crownbill.com') {
          console.log('Admin user roles:', u.roles);
          console.log('Mapped roles:', mappedUser.roles);
        }
        
        return mappedUser;
      }));
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
      const { data } = await api.get('/admin/wallets');
      setWallets(data.map((w: any) => ({
        ...w,
        balance: parseFloat(w.balance)
      })));
    } catch (error) {
      console.error('Error fetching wallets:', error);
    }
  };

  const fetchCopyTradeAttempts = async () => {
    try {
      const { data } = await api.get('/admin/copy-trade-attempts');
      setCopyTradeAttempts(data);
    } catch (error) {
      console.error('Error fetching copy trade attempts:', error);
    }
  };

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.email || 'Unknown';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.fullName || 'Unknown';
  };

  const sendFollowUpEmail = (email: string, traderName: string, assetSymbol: string) => {
    const subject = encodeURIComponent(`Follow-up: Copy Trade Interest - ${traderName}`);
    const body = encodeURIComponent(`Hello,

We noticed you were interested in copying the trade for ${assetSymbol} by ${traderName}.

We would like to discuss this opportunity with you.

Best regards,
Fidelity Team`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const deleteCopyTradeAttempt = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Copy Trade Attempt",
      description: "Are you sure you want to delete this copy trade attempt? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive"
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/admin/copy-trade-attempts/${id}`);
      
      toast({
        title: "Success",
        description: "Copy trade attempt deleted successfully",
      });

      fetchCopyTradeAttempts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to delete copy trade attempt",
        variant: "destructive",
      });
    }
  };

  const createUser = async () => {
    try {
      await api.post('/admin/users', {
        email: newUserData.email,
        password: newUserData.password,
      });

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
        description: error.response?.data?.error || error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const updateWallet = async () => {
    if (!selectedWallet) return;

    try {
      await api.patch(`/admin/wallets/${selectedWallet.id}`, {
        balance: parseFloat(walletAmount)
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
        description: error.response?.data?.error || error.message || "Failed to update wallet",
        variant: "destructive",
      });
    }
  };

  const updateAccountStatus = async (userId: string, status: 'active' | 'inactive' | 'pending') => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status });

      toast({
        title: "Success",
        description: "Account status updated",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    const confirmed = await confirm({
      title: "Delete User",
      description: "Are you sure you want to delete this user? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive"
    });

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      fetchUsers();
      fetchWallets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getWalletForUser = (userId: string) => {
    return wallets.find(w => w.userId === userId);
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
            <Button
              variant={activeTab === "withdrawals" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("withdrawals")}
            >
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Withdrawals
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
                      const wallet = getWalletForUser(userProfile.userId);
                      const isSystemAdmin = userProfile.roles?.includes('admin') || userProfile.email === 'admin@crownbill.com';
                      return (
                        <TableRow key={userProfile.id}>
                          <TableCell className="font-medium">{userProfile.email}</TableCell>
                          <TableCell>{userProfile.fullName || '-'}</TableCell>
                          {isSystemAdmin ? (
                            <>
                              <TableCell><Badge variant="outline">System Admin</Badge></TableCell>
                              <TableCell><Badge variant="outline">System Admin</Badge></TableCell>
                              <TableCell><Badge variant="outline">System Admin</Badge></TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>
                                <Select
                                  value={userProfile.accountStatus}
                                  onValueChange={(value: 'active' | 'inactive' | 'pending') =>
                                    updateAccountStatus(userProfile.userId, value)
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
                                {userProfile.kycStatus === 'approved'
                                  ? <Badge variant="default">Approved</Badge>
                                  : userProfile.kycStatus === 'rejected'
                                  ? <Badge variant="destructive">Rejected</Badge>
                                  : <Badge variant="secondary">{userProfile.kycStatus}</Badge>
                                }
                              </TableCell>
                              <TableCell>
                                `$${wallet?.balance?.toFixed(2) || '0.00'}`
                              </TableCell>
                            </>
                          )}
                          <TableCell>
                            {new Date(userProfile.createdAt).toLocaleDateString()}
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
                              {!isSystemAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const w = getWalletForUser(userProfile.userId);
                                    if (w) {
                                      setSelectedWallet(w);
                                      setWalletAmount(w.balance.toString());
                                      setIsEditWalletOpen(true);
                                    }
                                  }}
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              )}
                              {!isSystemAdmin && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteUser(userProfile.userId)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                              {isSystemAdmin && (
                                <Badge variant="outline">Protected</Badge>
                              )}
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

          {activeTab === "withdrawals" && (
            <WithdrawalsTab users={users} onWalletUpdate={fetchWallets} />
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
                        <TableCell>{new Date(attempt.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="font-medium">{getUserEmail(attempt.userId)}</TableCell>
                        <TableCell>{getUserName(attempt.userId)}</TableCell>
                        <TableCell>{attempt.traderName}</TableCell>
                        <TableCell>{attempt.assetSymbol}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{attempt.assetType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={attempt.actionType === 'copy_trade' ? 'default' : 'outline'}>
                            {attempt.actionType === 'copy_trade' ? 'Copy Trade' : 'Analyze'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {attempt.profitPercentage !== null ? (
                            <span className={attempt.profitPercentage >= 0 ? 'text-accent' : 'text-destructive'}>
                              {attempt.profitPercentage >= 0 ? '+' : ''}{attempt.profitPercentage}%
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendFollowUpEmail(
                                getUserEmail(attempt.userId),
                                attempt.traderName,
                                attempt.assetSymbol
                              )}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Email
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteCopyTradeAttempt(attempt.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                    <p className="font-medium">{selectedUser.fullName || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Phone</Label>
                    <p className="font-medium">{selectedUser.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Date of Birth</Label>
                    <p className="font-medium">{selectedUser.dateOfBirth || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Nationality</Label>
                    <p className="font-medium capitalize">{selectedUser.nationality || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Country of Residence</Label>
                    <p className="font-medium capitalize">{selectedUser.countryOfResidence || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Marital Status</Label>
                    <p className="font-medium capitalize">{selectedUser.maritalStatus || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Tax ID</Label>
                    <p className="font-medium">{selectedUser.taxId || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Created</Label>
                    <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Account Status</h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <Label className="text-muted-foreground text-xs">Account Status</Label>
                    <p className="font-medium capitalize">{selectedUser.accountStatus}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">KYC Status</Label>
                    <p className="font-medium capitalize">{selectedUser.kycStatus}</p>
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
                      <p className="font-medium">{selectedUser.isPep ? 'Yes' : 'No'}</p>
                    </div>
                    {selectedUser.isPep && selectedUser.pepDetails && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground text-xs">PEP Details</Label>
                        <p className="font-medium">{selectedUser.pepDetails}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 text-foreground">Business Information</h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  {selectedUser.hasBusiness ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-xs">Business Name</Label>
                        <p className="font-medium">{selectedUser.businessName || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Business Type</Label>
                        <p className="font-medium capitalize">{selectedUser.businessType?.replace('-', ' ') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Industry</Label>
                        <p className="font-medium capitalize">{selectedUser.businessIndustry?.replace('-', ' ') || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Business Tax ID (EIN/SSN)</Label>
                        <p className="font-medium">{selectedUser.businessTaxId || '-'}</p>
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

// Helper Components
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
    const user = users.find(u => u.userId === userId);
    return user?.email || 'Unknown';
  };

  const updateWallet = async () => {
    if (!selectedWallet) return;

    try {
      await api.patch(`/admin/wallets/${selectedWallet.id}`, {
        balance: parseFloat(walletAmount)
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
        description: error.response?.data?.error || error.message || "Failed to update wallet",
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
            {wallets
              .filter(wallet => {
                const user = users.find(u => u.userId === wallet.userId);
                return !user?.roles?.includes('admin') && user?.email !== 'admin@crownbill.com';
              })
              .map((wallet) => (
              <TableRow key={wallet.id}>
                <TableCell className="font-medium">{getUserEmail(wallet.userId)}</TableCell>
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
              Update the wallet balance for {selectedWallet && getUserEmail(selectedWallet.userId)}.
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
    const user = users.find(u => u.userId === userId);
    return user?.email || 'Unknown';
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/transactions');
      let data = response.data;

      if (selectedUserId !== "all") {
        data = data.filter((tx: any) => tx.userId === selectedUserId);
      }

      if (startDate) {
        const start = new Date(startDate);
        data = data.filter((tx: any) => new Date(tx.createdAt) >= start);
      }

      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        data = data.filter((tx: any) => new Date(tx.createdAt) <= end);
      }

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
                  <SelectItem key={user.userId} value={user.userId}>
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
                  <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{getUserEmail(tx.userId)}</TableCell>
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
  userId: string;
  grantType: string;
  organizationName: string;
  organizationType: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  projectDescription: string;
  requestedAmount: number;
  status: string;
  adminNotes: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

const GrantApplicationsTab = ({ users }: { users: UserProfile[] }) => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [allApplications, setAllApplications] = useState<GrantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<GrantApplication | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.email || 'Unknown';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.fullName || 'Unknown';
  };

  const exportToCSV = (data: GrantApplication[], userList: UserProfile[]) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No applications to export",
        variant: "destructive",
      });
      return;
    }

    const getUserEmailForExport = (userId: string) => {
      const user = userList.find(u => u.userId === userId);
      return user?.email || 'Unknown';
    };

    const headers = [
      'Application ID',
      'Date Submitted',
      'Applicant Email',
      'Organization Name',
      'Organization Type',
      'Grant Type',
      'Contact Name',
      'Contact Email',
      'Contact Phone',
      'Requested Amount',
      'Status',
      'Admin Notes',
      'Reviewed At'
    ];

    const csvRows = data.map(app => [
      app.id,
      new Date(app.createdAt).toLocaleDateString(),
      getUserEmailForExport(app.userId),
      `"${app.organizationName.replace(/"/g, '""')}"`,
      app.organizationType || '',
      app.grantType.replace('-', ' '),
      `"${app.contactName.replace(/"/g, '""')}"`,
      app.contactEmail,
      app.contactPhone || '',
      app.requestedAmount,
      app.status,
      app.adminNotes ? `"${app.adminNotes.replace(/"/g, '""')}"` : '',
      app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `grant_applications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${data.length} applications to CSV`,
    });
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/grants');
      setAllApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    let filtered = [...allApplications];
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.organizationName.toLowerCase().includes(query) ||
        app.contactName.toLowerCase().includes(query) ||
        app.contactEmail.toLowerCase().includes(query) ||
        getUserEmail(app.userId).toLowerCase().includes(query)
      );
    }
    
    setApplications(filtered);
  }, [statusFilter, searchQuery, allApplications]);

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/grants/${applicationId}`, { 
        status: newStatus,
        adminNotes: adminNotes || null,
      });

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
        description: error.response?.data?.error || error.message || "Failed to update application",
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

  // Calculate stats
  const stats = {
    total: allApplications.length,
    pending: allApplications.filter(a => a.status === 'pending').length,
    underReview: allApplications.filter(a => a.status === 'under_review').length,
    approved: allApplications.filter(a => a.status === 'approved').length,
    rejected: allApplications.filter(a => a.status === 'rejected').length,
    totalRequested: allApplications.reduce((sum, a) => sum + Number(a.requestedAmount), 0),
    totalApproved: allApplications.filter(a => a.status === 'approved').reduce((sum, a) => sum + Number(a.requestedAmount), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          className={`card-elevated p-4 cursor-pointer transition-all ${statusFilter === 'pending' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div 
          className={`card-elevated p-4 cursor-pointer transition-all ${statusFilter === 'under_review' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'under_review' ? 'all' : 'under_review')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.underReview}</p>
              <p className="text-sm text-muted-foreground">Under Review</p>
            </div>
          </div>
        </div>
        <div 
          className={`card-elevated p-4 cursor-pointer transition-all ${statusFilter === 'approved' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
        </div>
        <div 
          className={`card-elevated p-4 cursor-pointer transition-all ${statusFilter === 'rejected' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </div>
          </div>
        </div>
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${stats.totalRequested.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Requested</p>
            </div>
          </div>
        </div>
        <div className="card-elevated p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">${stats.totalApproved.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Approved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Grant Applications</h2>
          <p className="text-muted-foreground">Review and manage grant applications</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64"
          />
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
          <Button
            variant="outline"
            onClick={() => exportToCSV(applications, users)}
            className="flex items-center gap-2"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Export CSV
          </Button>
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
                  <TableCell>{new Date(application.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getUserEmail(application.userId)}</TableCell>
                  <TableCell className="font-medium">{application.organizationName}</TableCell>
                  <TableCell className="capitalize">{application.grantType.replace('-', ' ')}</TableCell>
                  <TableCell>${application.requestedAmount.toLocaleString()}</TableCell>
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
                            setAdminNotes(application.adminNotes || "");
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
                  <p className="font-medium">{getUserEmail(selectedApplication.userId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organization Name</Label>
                  <p className="font-medium">{selectedApplication.organizationName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Organization Type</Label>
                  <p className="font-medium capitalize">{selectedApplication.organizationType || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Grant Type</Label>
                  <p className="font-medium capitalize">{selectedApplication.grantType.replace('-', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested Amount</Label>
                  <p className="font-medium text-accent">${selectedApplication.requestedAmount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Name</Label>
                  <p className="font-medium">{selectedApplication.contactName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Email</Label>
                  <p className="font-medium">{selectedApplication.contactEmail}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Phone</Label>
                  <p className="font-medium">{selectedApplication.contactPhone || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium">{new Date(selectedApplication.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Project Description</Label>
                <p className="font-medium mt-1 p-3 bg-muted/50 rounded-lg">{selectedApplication.projectDescription}</p>
              </div>
              {selectedApplication.adminNotes && (
                <div>
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p className="font-medium mt-1 p-3 bg-muted/50 rounded-lg">{selectedApplication.adminNotes}</p>
                </div>
              )}
              {selectedApplication.reviewedAt && (
                <div>
                  <Label className="text-muted-foreground">Reviewed At</Label>
                  <p className="font-medium">{new Date(selectedApplication.reviewedAt).toLocaleString()}</p>
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
              Update the status of this grant application for {selectedApplication?.organizationName}.
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
    const user = users.find(u => u.userId === userId);
    return user?.email || 'Unknown';
  };

  const formatDetails = (details: any) => {
    if (!details) return '-';
    
    try {
      // If it's already an object, format it nicely
      if (typeof details === 'object') {
        if (details.grant_type) {
          return `Grant Type: ${details.grant_type}${details.application_id ? `, App ID: ${details.application_id.substring(0, 8)}...` : ''}`;
        }
        if (details.trade_id) {
          return `Trade ID: ${details.trade_id.substring(0, 8)}...`;
        }
        if (details.amount) {
          return `Amount: $${details.amount}`;
        }
        if (details.email) {
          return `Email: ${details.email}`;
        }
        return JSON.stringify(details, null, 2);
      }
      
      // If it's a string, try to parse it as JSON
      if (typeof details === 'string') {
        const parsed = JSON.parse(details);
        return formatDetails(parsed);
      }
      
      return String(details);
    } catch (e) {
      return String(details);
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await api.get('/admin/activity-logs');
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
                  <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{getUserEmail(log.userId)}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="max-w-xs">
                    {formatDetails(log.details)}
                  </TableCell>
                  <TableCell>{log.ipAddress || '-'}</TableCell>
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [settlementDetails, setSettlementDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    referenceCode: ""
  });

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.email || 'Unknown';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.fullName || 'Unknown';
  };

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/deposits');
      let filteredData = data;
      if (statusFilter !== "all") {
        filteredData = data.filter((d: any) => d.status === statusFilter);
      }
      setDeposits(filteredData || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeposits(); }, [statusFilter]);

  const updateDeposit = async (depositId: string, userId: string, amount: number, newStatus: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/deposits/${depositId}`, { status: newStatus });
      
      toast({ title: "Success", description: `Deposit ${newStatus}` });
      fetchDeposits();
      onWalletUpdate();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
  };

  const assignSettlementDetails = async () => {
    if (!selectedDeposit) return;
    
    try {
      // Generate reference code if not provided
      const refCode = settlementDetails.referenceCode || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      
      await api.patch(`/admin/deposits/${selectedDeposit.id}`, {
        status: 'awaiting_payment',
        settlementDetails: {
          bankName: settlementDetails.bankName,
          accountNumber: settlementDetails.accountNumber,
          accountHolderName: settlementDetails.accountHolderName,
          referenceCode: refCode
        }
      });
      
      toast({
        title: "Success",
        description: "Settlement details assigned successfully"
      });
      
      setIsAssignModalOpen(false);
      setSettlementDetails({
        bankName: "",
        accountNumber: "",
        accountHolderName: "",
        referenceCode: ""
      });
      setSelectedDeposit(null);
      fetchDeposits();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending_matching':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending Matching</Badge>;
      case 'awaiting_payment':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Awaiting Payment</Badge>;
      case 'awaiting_confirmation':
        return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">Awaiting Confirmation</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Deposit Management</h2>
          <p className="text-muted-foreground">Manage user deposits and payment confirmations</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Deposits</SelectItem>
            <SelectItem value="pending_matching">Pending Matching</SelectItem>
            <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
            <SelectItem value="awaiting_confirmation">Awaiting Confirmation</SelectItem>
            <SelectItem value="pending">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
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
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getUserEmail(d.userId)}</div>
                      <div className="text-sm text-muted-foreground">{getUserName(d.userId)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {d.paymentMethod === 'zelle' ? 'Zelle' : 
                     d.paymentMethod === 'square' ? 'Square' : 
                     d.paymentMethod === 'paypal' ? 'PayPal' : 
                     d.paymentMethod === 'crypto' ? `${d.cryptoType?.toUpperCase() || 'Crypto'}` : 
                     d.paymentMethod}
                  </TableCell>
                  <TableCell className="font-semibold">${d.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(d.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDeposit(d);
                          setIsViewModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />View
                      </Button>
                      
                      {d.status === 'pending_matching' && (
                        <Button
                          size="sm"
                          variant="accent"
                          onClick={() => {
                            setSelectedDeposit(d);
                            setIsAssignModalOpen(true);
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />Assign Details
                        </Button>
                      )}
                      
                      {d.status === 'awaiting_confirmation' && (
                        <div className="flex gap-2">
                          <div className="relative group">
                            <Button
                              size="sm"
                              variant="accent"
                              onClick={() => updateDeposit(d.id, d.userId, d.amount, 'approved')}
                              disabled={!d.transactionHash && (!d.settlementDetails || !d.settlementDetails.proofFileUrls || d.settlementDetails.proofFileUrls.length === 0)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />Approve
                            </Button>
                            {!d.transactionHash && (!d.settlementDetails || !d.settlementDetails.proofFileUrls || d.settlementDetails.proofFileUrls.length === 0) && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                Proof of payment required
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDeposit(d.id, d.userId, d.amount, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />Reject
                          </Button>
                        </div>
                      )}
                      
                      {(d.status === 'pending' || d.status === 'awaiting_payment') && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => updateDeposit(d.id, d.userId, d.amount, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateDeposit(d.id, d.userId, d.amount, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {deposits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No deposits found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Assign Settlement Details Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Settlement Details</DialogTitle>
            <DialogDescription>
              Provide settlement details for {selectedDeposit && getUserEmail(selectedDeposit.userId)}
            </DialogDescription>
            {selectedDeposit && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">Payment Method: 
                  <span className="capitalize ml-1">
                    {selectedDeposit.paymentMethod === 'zelle' ? 'Zelle' : 
                     selectedDeposit.paymentMethod === 'square' ? 'Square' : 
                     selectedDeposit.paymentMethod === 'paypal' ? 'PayPal' : 
                     selectedDeposit.paymentMethod === 'crypto' ? `${selectedDeposit.cryptoType?.toUpperCase() || 'Crypto'}` : 
                     selectedDeposit.paymentMethod}
                  </span>
                </div>
                <div className="text-sm">Amount: <span className="font-semibold">${selectedDeposit.amount.toLocaleString()}</span></div>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={settlementDetails.bankName}
                onChange={(e) => setSettlementDetails({...settlementDetails, bankName: e.target.value})}
                placeholder="e.g., Chase Bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={settlementDetails.accountNumber}
                onChange={(e) => setSettlementDetails({...settlementDetails, accountNumber: e.target.value})}
                placeholder="Account number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountHolder">Account Holder Name</Label>
              <Input
                id="accountHolder"
                value={settlementDetails.accountHolderName}
                onChange={(e) => setSettlementDetails({...settlementDetails, accountHolderName: e.target.value})}
                placeholder="Account holder name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceCode">Reference Code (Optional)</Label>
              <Input
                id="referenceCode"
                value={settlementDetails.referenceCode}
                onChange={(e) => setSettlementDetails({...settlementDetails, referenceCode: e.target.value})}
                placeholder="Will auto-generate if empty"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={assignSettlementDetails}>
              Assign Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Deposit Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deposit Details</DialogTitle>
          </DialogHeader>
          {selectedDeposit && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">User Email</Label>
                  <p className="font-medium">{getUserEmail(selectedDeposit.userId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">User Name</Label>
                  <p className="font-medium">{getUserName(selectedDeposit.userId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Amount</Label>
                  <p className="font-semibold text-lg">${selectedDeposit.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Payment Method</Label>
                  <p className="font-medium capitalize">
                    {selectedDeposit.paymentMethod === 'bank' ? 'Bank Transfer' : 
                     selectedDeposit.paymentMethod === 'zelle' ? 'Zelle' : 
                     selectedDeposit.paymentMethod === 'square' ? 'Square' : 
                     selectedDeposit.paymentMethod === 'paypal' ? 'PayPal' : 
                     selectedDeposit.paymentMethod === 'crypto' ? `${selectedDeposit.cryptoType?.toUpperCase() || 'Crypto'}` : 
                     selectedDeposit.paymentMethod}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDeposit.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Date</Label>
                  <p className="font-medium">{new Date(selectedDeposit.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              {selectedDeposit.settlementDetails && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold mb-3">Settlement Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-muted-foreground text-xs">Bank Name</Label>
                      <p className="font-medium">{selectedDeposit.settlementDetails.bankName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Account Number</Label>
                      <p className="font-medium font-mono">{selectedDeposit.settlementDetails.accountNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Account Holder</Label>
                      <p className="font-medium">{selectedDeposit.settlementDetails.accountHolderName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Reference Code</Label>
                      <p className="font-medium font-mono">{selectedDeposit.settlementDetails.referenceCode}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedDeposit.proofNotes && (
                <div>
                  <Label className="text-muted-foreground text-xs">Proof Notes</Label>
                  <p className="font-medium mt-1 p-3 bg-muted/30 rounded-lg">{selectedDeposit.proofNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Withdrawals Tab Component
const WithdrawalsTab = ({ users, onWalletUpdate }: { users: UserProfile[]; onWalletUpdate: () => void }) => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");

  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.userId === userId);
    return user?.email || 'Unknown';
  };

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/withdrawals');
      let filteredData = data;
      if (statusFilter !== "all") {
        filteredData = data.filter((w: any) => w.status === statusFilter);
      }
      setWithdrawals(filteredData || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWithdrawals(); }, [statusFilter]);

  const updateWithdrawal = async (withdrawalId: string, userId: string, amount: number, newStatus: 'approved' | 'rejected') => {
    try {
      await api.patch(`/admin/withdrawals/${withdrawalId}`, { status: newStatus });
      
      toast({ title: "Success", description: `Withdrawal ${newStatus}` });
      fetchWithdrawals();
      onWalletUpdate();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.error || error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Withdrawal Management</h2>
          <p className="text-muted-foreground">Approve or reject user withdrawal requests</p>
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
                <TableHead>Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{getUserEmail(w.userId)}</TableCell>
                  <TableCell className="capitalize">{w.withdrawalMethod.replace('_', ' ')}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {w.walletAddress || w.bankDetails || '-'}
                  </TableCell>
                  <TableCell className="font-semibold">${w.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={w.status === 'approved' ? 'default' : w.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {w.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="accent" onClick={() => updateWithdrawal(w.id, w.userId, w.amount, 'approved')}>
                          <CheckCircle className="h-4 w-4 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => updateWithdrawal(w.id, w.userId, w.amount, 'rejected')}>
                          <XCircle className="h-4 w-4 mr-1" />Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {withdrawals.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No withdrawals found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
