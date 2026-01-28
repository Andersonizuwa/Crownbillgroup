import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  Trash2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface CopyTradeAttempt {
  id: string;
  traderName: string;
  assetSymbol: string;
  assetType: string;
  actionType: string;
  profitPercentage: number | null;
  createdAt: string;
}

const CopyTradeAttempts = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<CopyTradeAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAttempts();
    }
  }, [user]);

  const fetchAttempts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data } = await api.get('/user/copy-trade-attempts');
      setAttempts(data);
    } catch (error) {
      console.error('Error fetching copy trade attempts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch copy trade attempts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Note: Backend doesn't have a delete endpoint for user's own copy trade attempts
  // We'll need to add this functionality to the backend
  const deleteAttempt = async (id: string) => {
    try {
      await api.delete(`/user/copy-trade-attempts/${id}`);
      setAttempts(prev => prev.filter(attempt => attempt.id !== id));
      toast({
        title: "Success",
        description: "Copy trade attempt deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting copy trade attempt:', error);
      toast({
        title: "Error",
        description: "Failed to delete copy trade attempt",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your copy trade attempts...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Copy Trade Attempts</h1>
              <p className="text-muted-foreground mt-1">
                View and manage your copy trade attempts
              </p>
            </div>
            <Button variant="outline" onClick={fetchAttempts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Copy className="h-4 w-4" />
              <span className="text-sm">Total Attempts</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {attempts.length}
            </p>
          </div>
          
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Successful</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {attempts.filter(a => a.profitPercentage && a.profitPercentage > 0).length}
            </p>
          </div>
          
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Unsuccessful</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {attempts.filter(a => a.profitPercentage && a.profitPercentage < 0).length}
            </p>
          </div>
          
          <div className="card-elevated p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {attempts.filter(a => a.profitPercentage === null).length}
            </p>
          </div>
        </div>

        {/* Attempts Table */}
        <div className="card-elevated-lg overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Your Attempts</h2>
            <p className="text-sm text-muted-foreground mt-1">
              All your copy trade attempts
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Trader</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Profit %</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.length > 0 ? (
                  attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{attempt.traderName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{attempt.assetSymbol}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            ({attempt.assetType})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                          {attempt.actionType === 'copy_trade' ? 'Copy Trade' : 'Apply Strategy'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {attempt.profitPercentage !== null ? (
                          <span className={attempt.profitPercentage >= 0 ? 'text-accent' : 'text-destructive'}>
                            {attempt.profitPercentage >= 0 ? '+' : ''}
                            {attempt.profitPercentage.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteAttempt(attempt.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/trade')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Loading...' : 'No copy trade attempts found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-8 bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Copy trade attempts are records of your interest in copying successful traders. 
            These help us understand your trading preferences.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default CopyTradeAttempts;