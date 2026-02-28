import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  DollarSign,
  FileText,
  RefreshCw,
  Mail,
  ArrowDownToLine,
  History,
  PieChart,
  Lock,
  Zap
} from "lucide-react";

interface WalletData {
  balance: number;
  currency: string;
}

interface GrantApplication {
  id: string;
  grantType: string;
  organizationName: string;
  requestedAmount: number;
  status: string;
  createdAt: string;
}

interface Profile {
  fullName: string;
  accountStatus: string;
  kycStatus: string;
}

const Dashboard = () => {
  const { user, isLoading: loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [grantApplications, setGrantApplications] = useState<GrantApplication[]>([]);
  const [lockedInvestments, setLockedInvestments] = useState<any[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (!loading && user) {
      fetchUserData();
    }
  }, [user, loading, navigate]);

  const fetchUserData = async () => {
    if (!user || loading) return;

    setIsLoading(true);

    try {
      // Fetch profile from backend API
      const profileResponse = await api.get('/user/profile');
      if (profileResponse.data) {
        setProfile({
          fullName: profileResponse.data.fullName || '',
          accountStatus: profileResponse.data.accountStatus || 'pending',
          kycStatus: profileResponse.data.kycStatus || 'pending'
        });
      }

      // Fetch wallet from backend API
      const walletResponse = await api.get('/user/wallet');
      if (walletResponse.data) {
        setWallet({
          balance: parseFloat(walletResponse.data.balance) || 0,
          currency: walletResponse.data.currency || 'USD'
        });
      }

      // Fetch holdings to calculate portfolio value
      const holdingsResponse = await api.get('/trades/holdings');
      if (holdingsResponse.data) {
        const totalValue = holdingsResponse.data.reduce((sum: number, h: any) => {
          return sum + parseFloat(h.currentValue || 0);
        }, 0);
        setPortfolioValue(totalValue);
      }

      // Fetch grant applications from backend API
      const grantsResponse = await api.get('/user/grants');
      if (grantsResponse.data) {
        setGrantApplications(grantsResponse.data.map((g: any) => ({
          ...g,
          requestedAmount: parseFloat(g.requestedAmount)
        })));
      }

      // Fetch locked investments
      const investmentsResponse = await api.get('/investments/my-investments');
      if (investmentsResponse.data) {
        setLockedInvestments(investmentsResponse.data);
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      if (error.response?.status !== 401) {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to load user data",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-accent" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'under_review':
        return <RefreshCw className="h-5 w-5 text-warning" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Inactive';
      case 'under_review':
        return 'Under Review';
      default:
        return 'Pending';
    }
  };

  const handleReachOut = async (applicationId: string, grantType: string) => {
    // Log the reach-out attempt for admin notification
    if (user) {
      try {
        await api.post('/user/activity-logs', {
          action: 'grant_reach_out',
          details: { application_id: applicationId, grant_type: grantType }
        });
      } catch (error) {
        console.error('Error logging reach out:', error);
      }
    }

    // Open email client
    const subject = encodeURIComponent(`Grant Application Inquiry - ${grantType}`);
    const body = encodeURIComponent(`Hello,

I am reaching out regarding my grant application (ID: ${applicationId}).

I would like to inquire about the status of my application and discuss any additional steps needed.

Thank you for your time.

Best regards`);
    window.location.href = `mailto:support@crownbillgroup.com?subject=${subject}&body=${body}`;
  };

  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-accent bg-accent/10 border-accent/20';
      case 'inactive':
        return 'text-muted-foreground bg-muted border-border';
      default:
        return 'text-warning bg-warning/10 border-warning/20';
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back, {profile?.fullName || user?.fullName || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account, investments, and grant applications
          </p>
        </div>

        {/* CBPTA Promotional Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-12 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-20 group-hover:opacity-40 blur transition duration-1000 group-hover:duration-200 animate-pulse-slow"></div>
          <div className="relative bg-card/80 backdrop-blur-md border border-primary/20 p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Zap className="w-48 h-48 text-primary" />
            </div>

            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                <Zap className="w-3 h-3" />
                Elite Algorithm Active
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                CrownBill <span className="text-primary italic">Proprietary logic</span> is live!
              </h3>
              <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
                Take advantage of our institutional-grade automated trading system with <span className="text-white font-bold px-2 py-0.5 rounded bg-white/10">70% Term Yield</span>.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <Link to="/proprietary-algorithm">
                <Button variant="accent" size="lg" className="w-full md:w-auto px-8 py-8 text-lg font-black shadow-lg shadow-accent/20 group/btn transition-all">
                  ACTIVATE 70% YIELD
                  <ArrowRight className="ml-2 h-6 w-6 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Account Status Banner - Inactive until a grant is approved */}
        {(() => {
          const hasAnyGrant = grantApplications.length > 0;
          const hasApprovedGrant = grantApplications.some((g) => g.status === 'approved');
          const needsGrantDecision = hasAnyGrant && !hasApprovedGrant;

          const effectiveStatus = needsGrantDecision
            ? 'inactive'
            : hasApprovedGrant
              ? 'active'
              : (profile?.accountStatus || 'pending');

          const reachOutGrant = grantApplications.find((g) => g.status !== 'approved');

          return (
            <div className={`rounded-lg p-4 mb-8 border ${getAccountStatusColor(effectiveStatus)}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {effectiveStatus === 'active' ? (
                    <CheckCircle2 className="h-6 w-6 text-accent mt-1" />
                  ) : effectiveStatus === 'inactive' ? (
                    <AlertCircle className="h-6 w-6 text-warning mt-1" />
                  ) : (
                    <Clock className="h-6 w-6 text-muted-foreground mt-1" />
                  )}
                  <div className="space-y-2">
                    <p className="font-medium text-lg capitalize">
                      Account Status: {effectiveStatus === 'inactive' ? 'Action Required' : effectiveStatus === 'active' ? 'Active' : 'Pending'}
                    </p>

                    {effectiveStatus === 'inactive' ? (
                      <div className="space-y-3 text-sm text-muted-foreground">
                        <p>
                          To activate your account, a <strong>$100 deposit</strong> is required for CrownBill membership and background verification.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link to="/fund-account">
                            <Button variant="accent" size="sm">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Deposit $100 Now
                            </Button>
                          </Link>
                          <a
                            href="https://api.whatsapp.com/send/?phone=16462337202&text&type=phone_number&app_absent=0"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4 mr-2" />
                              Contact Support
                            </Button>
                          </a>
                        </div>
                        <p className="text-xs opacity-80 pt-1">
                          After making your deposit and passing the background check, please contact our customer care representative via the link above to finalize your activation.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm opacity-80">
                        {effectiveStatus === 'active'
                          ? 'Your account is fully verified and active.'
                          : 'Your account is pending verification. We will review it shortly.'}
                      </p>
                    )}
                  </div>
                </div>

                {needsGrantDecision && reachOutGrant && effectiveStatus !== 'inactive' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReachOut(reachOutGrant.id, reachOutGrant.grantType)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Reach Out
                  </Button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <span className="text-muted-foreground text-sm">Wallet Balance</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${wallet?.balance?.toLocaleString() || '0.00'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{wallet?.currency || 'USD'}</p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <span className="text-muted-foreground text-sm">Grant Applications</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {grantApplications.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total submitted</p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <span className="text-muted-foreground text-sm">Investments</span>
            </div>
            <p className="text-2xl font-bold text-foreground">${portfolioValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Portfolio value</p>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <span className="text-muted-foreground text-sm">Pending Grants</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${grantApplications
                .filter(g => g.status === 'pending' || g.status === 'under_review')
                .reduce((sum, g) => sum + g.requestedAmount, 0)
                .toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Link to="/fund-account">
            <Button variant="accent" className="w-full h-auto py-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5" />
                <span>Fund Account</span>
              </div>
            </Button>
          </Link>
          <Link to="/withdraw">
            <Button variant="outline" className="w-full h-auto py-4">
              <div className="flex items-center gap-3">
                <ArrowDownToLine className="h-5 w-5" />
                <span>Withdraw</span>
              </div>
            </Button>
          </Link>
          <Link to="/transactions">
            <Button variant="outline" className="w-full h-auto py-4">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5" />
                <span>History</span>
              </div>
            </Button>
          </Link>
          <Link to="/trade">
            <Button variant="outline" className="w-full h-auto py-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5" />
                <span>Trade Stocks</span>
              </div>
            </Button>
          </Link>
          <Link to="/portfolio">
            <Button variant="outline" className="w-full h-auto py-4">
              <div className="flex items-center gap-3">
                <PieChart className="h-5 w-5" />
                <span>Portfolio</span>
              </div>
            </Button>
          </Link>
          <Link to="/crypto">
            <Button variant="outline" className="w-full h-auto py-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5" />
                <span>Buy Crypto</span>
              </div>
            </Button>
          </Link>
          <Link to="/investment">
            <Button variant="outline" className="w-full h-auto py-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5" />
                <span>Investments</span>
              </div>
            </Button>
          </Link>
          <Link to="/grant-application">
            <Button variant="outline" className="w-full h-auto py-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <span>Apply for Grant</span>
              </div>
            </Button>
          </Link>
        </div>

        {/* Locked Investments */}
        {lockedInvestments.length > 0 && (
          <div className="card-elevated-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Active High-Yield Investments</h2>
                <p className="text-sm text-muted-foreground mt-1">Your locked funds and guaranteed returns</p>
              </div>
              <Link to="/investment">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Plan</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Invested</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Expected Return</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">End Date</th>
                    <th className="text-center px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lockedInvestments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-accent" />
                          <span className="font-medium text-foreground">{inv.plan.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        ${Number(inv.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-500">
                        ${(Number(inv.amount) + Number(inv.expectedReturn)).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {new Date(inv.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent uppercase font-bold">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grant Applications */}
        <div className="card-elevated-lg overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Grant Applications</h2>
              <p className="text-sm text-muted-foreground mt-1">Track the status of your grant applications</p>
            </div>
            <Link to="/grant-application">
              <Button variant="accent" size="sm">
                New Application
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {grantApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Grant Type</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Organization</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {grantApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground capitalize">
                          {application.grantType.replace('-', ' ')} Grant
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {application.organizationName}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        ${application.requestedAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(application.status)}
                          <span className={`text-sm capitalize ${application.status === 'approved' ? 'text-accent' :
                            application.status === 'rejected' ? 'text-destructive' :
                              'text-muted-foreground'
                            }`}>
                            {getStatusLabel(application.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(application.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {application.status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReachOut(application.id, application.grantType)}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Reach Out
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Grant Applications Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your journey by applying for one of our grant programs.
              </p>
              <Link to="/grant-application">
                <Button variant="accent">
                  Apply for a Grant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout >
  );
};

export default Dashboard;
