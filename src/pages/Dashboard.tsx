import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  Mail
} from "lucide-react";

interface WalletData {
  balance: number;
  currency: string;
}

interface GrantApplication {
  id: string;
  grant_type: string;
  organization_name: string;
  requested_amount: number;
  status: string;
  created_at: string;
}

interface Profile {
  full_name: string;
  account_status: string;
  kyc_status: string;
}

const Dashboard = () => {
  const { user, isLoading: loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [grantApplications, setGrantApplications] = useState<GrantApplication[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Fetch wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('balance, currency')
        .eq('user_id', user.id)
        .single();
      
      if (walletData) {
        setWallet(walletData);
      }

      // Fetch grant applications
      const { data: grantsData } = await supabase
        .from('grant_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (grantsData) {
        setGrantApplications(grantsData);
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, account_status, kyc_status')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
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
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'grant_reach_out',
          details: { application_id: applicationId, grant_type: grantType }
        });
      } catch (error) {
        console.error('Error logging reach out:', error);
      }
    }
    
    // Open email client
    const subject = encodeURIComponent(`Grant Application Inquiry - ${grantType}`);
    const body = encodeURIComponent(`Hello,\n\nI am reaching out regarding my grant application (ID: ${applicationId}).\n\nI would like to inquire about the status of my application and discuss any additional steps needed.\n\nThank you for your time.\n\nBest regards`);
    window.location.href = `mailto:ranaeputerbaugh@yahoo.com?subject=${subject}&body=${body}`;
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
            Welcome, {profile?.full_name || 'User'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your account, investments, and grant applications
          </p>
        </div>

        {/* Account Status Banner - Shows Inactive if any grant is rejected */}
        {(() => {
          const hasRejectedGrant = grantApplications.some(g => g.status === 'rejected');
          const hasApprovedGrant = grantApplications.some(g => g.status === 'approved');
          const effectiveStatus = hasRejectedGrant ? 'inactive' : hasApprovedGrant ? 'active' : (profile?.account_status || 'pending');
          
          return (
            <div className={`rounded-lg p-4 mb-8 border ${getAccountStatusColor(effectiveStatus)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {effectiveStatus === 'active' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : effectiveStatus === 'inactive' ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <div>
                    <p className="font-medium capitalize">
                      Account Status: {effectiveStatus === 'inactive' ? 'Inactive' : effectiveStatus === 'active' ? 'Active' : 'Pending'}
                    </p>
                    <p className="text-sm opacity-80">
                      {effectiveStatus === 'active' 
                        ? 'Your account is fully verified and active.' 
                        : effectiveStatus === 'inactive'
                        ? 'Your grant application was not approved. Please reach out for assistance.'
                        : 'Your account is pending verification. We will review it shortly.'}
                    </p>
                  </div>
                </div>
                {effectiveStatus === 'inactive' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const rejectedGrant = grantApplications.find(g => g.status === 'rejected');
                      if (rejectedGrant) {
                        handleReachOut(rejectedGrant.id, rejectedGrant.grant_type);
                      }
                    }}
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
            <p className="text-2xl font-bold text-foreground">$0.00</p>
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
                .reduce((sum, g) => sum + g.requested_amount, 0)
                .toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link to="/fund-account">
            <Button variant="accent" className="w-full h-auto py-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5" />
                <span>Fund Account</span>
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
          <Link to="/crypto">
            <Button variant="outline" className="w-full h-auto py-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5" />
                <span>Buy Crypto</span>
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
                          {application.grant_type.replace('-', ' ')} Grant
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {application.organization_name}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        ${application.requested_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(application.status)}
                          <span className={`text-sm capitalize ${
                            application.status === 'approved' ? 'text-accent' :
                            application.status === 'rejected' ? 'text-destructive' :
                            'text-muted-foreground'
                          }`}>
                            {getStatusLabel(application.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(application.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {application.status === 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReachOut(application.id, application.grant_type)}
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
    </Layout>
  );
};

export default Dashboard;
