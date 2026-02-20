import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import {
    TrendingUp, ShieldCheck, Clock, DollarSign, Info, CheckCircle2,
    ArrowRight, Gem, Coins, Medal, Award, Zap, ClipboardList,
    Hourglass, XCircle, Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type AppStatus = "not_applied" | "pending" | "under_review" | "approved" | "rejected";

const ProprietaryAlgorithm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appStatus, setAppStatus] = useState<AppStatus>("not_applied");
    const [eligiblePlans, setEligiblePlans] = useState<any[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [walletBalance, setWalletBalance] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) { setLoading(false); return; }
            try {
                const [statusRes, walletRes] = await Promise.all([
                    api.get('/algo/status'),
                    api.get('/user/wallet')
                ]);
                const status = statusRes.data.status as AppStatus;

                // Simple in-app notification when access is newly approved
                const storageKey = `cb_algo_status_${user.id}`;
                const previousStatus = localStorage.getItem(storageKey) as AppStatus | null;
                if (status === 'approved' && previousStatus && previousStatus !== 'approved') {
                    toast.success("Your CrownBill allocation profile is now live. You can view your assigned tier below.");
                }
                localStorage.setItem(storageKey, status);

                setAppStatus(status);
                setWalletBalance(parseFloat(walletRes.data.balance) || 0);

                if (status === 'approved') {
                    const plansRes = await api.get('/algo/eligible-plans');
                    setEligiblePlans(plansRes.data);
                }
            } catch (error) {
                console.error('Error fetching algo data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleInvest = async () => {
        if (!amount || isNaN(Number(amount))) return;
        if (!selectedPlan) return;
        const minAmount = selectedPlan.minAmount;
        const maxAmount = selectedPlan.maxAmount;
        if (Number(amount) < minAmount) { toast.error(`Minimum investment is $${minAmount}`); return; }
        if (Number(amount) > maxAmount) { toast.error(`Maximum investment is $${maxAmount}`); return; }
        if (Number(amount) > walletBalance) { toast.error("Insufficient wallet balance"); return; }
        try {
            await api.post('/investments/invest', { planId: selectedPlan.id, amount: Number(amount) });
            toast.success(`Successfully invested $${amount} in ${selectedPlan.name}`);
            setIsDialogOpen(false);
            setAmount("");
            navigate('/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to invest');
        }
    };

    const getPlanIcon = (name: string) => {
        if (name.includes('Proprietary') || name.includes('CBPTA')) return <Zap className="w-8 h-8 text-primary" />;
        if (name.includes('Platinum')) return <Gem className="w-8 h-8 text-indigo-400" />;
        if (name.includes('Gold')) return <Award className="w-8 h-8 text-yellow-500" />;
        if (name.includes('Silver')) return <Medal className="w-8 h-8 text-gray-400" />;
        return <Coins className="w-8 h-8 text-amber-600" />;
    };

    const getTierColor = (name: string) => {
        if (name.includes('Proprietary') || name.includes('CBPTA')) return 'border-primary shadow-primary/20 bg-primary/5';
        if (name.includes('Platinum')) return 'border-indigo-500/30';
        if (name.includes('Gold')) return 'border-yellow-500/30';
        if (name.includes('Silver')) return 'border-gray-400/30';
        return 'border-amber-600/30';
    };

    if (loading) {
        return (
            <Layout>
                <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-muted-foreground animate-pulse">Initializing investment terminal...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/5">
                <div className="container-main py-12">
                    {/* Hero Header — always visible */}
                    <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-fade-in">
                            <ShieldCheck className="w-4 h-4" />
                            Institutional-Grade Investment Protocol
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight leading-none animate-slide-up">
                            CrownBill <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x">Elite Portfolios</span>
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
                            Access CrownBill's proprietary automated trading technology — delivering <span className="text-foreground font-bold">up to 70% yield</span> through tiered capital growth strategies designed for every level of investor.
                        </p>
                    </div>

                    {/* Teaser Stats — always visible */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-16">
                        {[
                            { icon: <TrendingUp className="w-5 h-5 text-primary" />, label: "Max Yield", value: "Up to 70%" },
                            { icon: <Clock className="w-5 h-5 text-accent" />, label: "Term Period", value: "Flexible" },
                            { icon: <ShieldCheck className="w-5 h-5 text-green-500" />, label: "Protocol", value: "AI-Driven" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5 text-center">
                                <div className="flex justify-center mb-2">{stat.icon}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">{stat.label}</div>
                                <div className="text-lg font-black text-foreground">{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* ── STATE: NOT APPLIED ── */}
                    {appStatus === "not_applied" && (
                        <div className="max-w-2xl mx-auto">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur opacity-20 group-hover:opacity-35 transition duration-1000 animate-pulse-slow"></div>
                                <div className="relative bg-card/80 backdrop-blur-xl border border-primary/30 rounded-3xl p-10 text-center shadow-2xl space-y-6">
                                    <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                                        <Lock className="w-10 h-10 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold">Access is By Application Only</h2>
                                    <p className="text-muted-foreground leading-relaxed">
                                        The CrownBill Proprietary Algorithm is an exclusive, gated investment strategy. To see the available tiers and invest, you must first complete our eligibility assessment. Our team will review your profile and assign the appropriate tier.
                                    </p>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        {["Fill the form", "Admin reviews", "Get your tier"].map((step, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-black flex items-center justify-center text-sm">{i + 1}</div>
                                                <span className="text-muted-foreground font-medium">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-lg font-black rounded-xl shadow-xl shadow-primary/20 group transition-all"
                                        onClick={() => navigate('/proprietary-algorithm/apply')}
                                    >
                                        <ClipboardList className="mr-2 w-5 h-5" />
                                        Apply for Access
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STATE: PENDING / UNDER REVIEW ── */}
                    {(appStatus === "pending" || appStatus === "under_review") && (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-card/80 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-10 text-center shadow-2xl space-y-6">
                                <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto">
                                    <Hourglass className="w-10 h-10 text-yellow-500 animate-pulse" />
                                </div>
                                <h2 className="text-2xl font-bold">Application Under Review</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Your eligibility application has been submitted and is currently being reviewed by our team.
                                    We'll notify you once a decision has been made and your investment tier has been assigned.
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-bold">
                                    <Hourglass className="w-4 h-4" />
                                    Status: {appStatus === "under_review" ? "Under Review" : "Pending Review"}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STATE: REJECTED ── */}
                    {appStatus === "rejected" && (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-card/80 backdrop-blur-xl border border-red-500/30 rounded-3xl p-10 text-center shadow-2xl space-y-6">
                                <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                                    <XCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold">Application Not Approved</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Unfortunately, your application did not meet the current eligibility criteria. You may re-apply with updated information.
                                </p>
                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-black rounded-xl"
                                    onClick={() => navigate('/proprietary-algorithm/apply')}
                                >
                                    Re-Apply
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── STATE: APPROVED — Show granted tiers ── */}
                    {appStatus === "approved" && (
                        <div className="space-y-12">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-widest mb-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Access Granted
                                </div>
                                <h2 className="text-3xl font-bold">Your Investment Tier{eligiblePlans.length > 1 ? "s" : ""}</h2>
                                <p className="text-muted-foreground">You have been approved for the following investment {eligiblePlans.length > 1 ? "tiers" : "tier"}.</p>
                            </div>

                            <div className={`grid gap-6 ${eligiblePlans.length === 1 ? "max-w-md mx-auto" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                                {eligiblePlans.map((plan) => (
                                    <Card
                                        key={plan.id}
                                        className={`relative flex flex-col h-full bg-card/50 backdrop-blur-sm border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-card/80 ${getTierColor(plan.name)}`}
                                    >
                                        <div className="absolute top-4 right-4 text-xs font-black px-2 py-1 rounded bg-background/50 text-foreground border border-border">
                                            {plan.effectiveDurationDays}D TERM
                                        </div>
                                        <CardHeader className="pb-2">
                                            <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                                                {getPlanIcon(plan.name)}
                                            </div>
                                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                                            <CardDescription className="text-xs line-clamp-2 min-h-[2.5rem]">{plan.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow pt-4">
                                            <div className="bg-muted/30 rounded-lg p-4 text-center mb-6">
                                                <span className="text-sm text-muted-foreground block mb-1 uppercase font-bold tracking-tight">Return Rate</span>
                                                <span className="text-3xl font-black text-foreground">{plan.returnPercentage}%</span>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Min Entry</span>
                                                    <span className="font-bold text-foreground">${Number(plan.minAmount).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Max Entry</span>
                                                    <span className="font-bold text-foreground">{Number(plan.maxAmount) >= 1000000 ? 'No Limit' : `$${Number(plan.maxAmount).toLocaleString()}`}</span>
                                                </div>
                                                {plan.customDurationDays && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Custom Term</span>
                                                        <span className="font-bold text-accent">{plan.customDurationDays} Days</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-2">
                                            <Button
                                                variant="outline"
                                                className="w-full font-bold h-12 hover:bg-primary hover:text-primary-foreground group"
                                                onClick={() => { setSelectedPlan(plan); setIsDialogOpen(true); }}
                                            >
                                                Select Tier
                                                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Information Notice */}
                    <div className="mt-20 max-w-3xl mx-auto bg-muted/20 border border-border rounded-xl p-6 flex gap-4">
                        <div className="p-2 rounded-lg bg-background text-muted-foreground">
                            <Info className="w-6 h-6" />
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            <span className="font-bold text-foreground">Operational Notice:</span> All investments on this terminal are subject to the specified lock-in periods. Withdrawals are automatically processed and credited to your main wallet immediately upon term maturity. CrownBill utilizes cold-storage protocols to ensure the absolute security of investor capital throughout the duration of any active protocol.
                        </p>
                    </div>
                </div>

                {/* Investment Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[450px] bg-card/95 backdrop-blur-2xl border-primary/20">
                        <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-3">
                                {selectedPlan && getPlanIcon(selectedPlan.name)}
                                Confirm Capital Injection
                            </DialogTitle>
                            <DialogDescription>
                                Term: {selectedPlan?.effectiveDurationDays} Days | Return: {selectedPlan?.returnPercentage}%
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-8 space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-sm font-bold text-foreground uppercase tracking-wider">Amount to Invest</label>
                                    <span className="text-xs text-muted-foreground">Balance: ${walletBalance.toLocaleString()}</span>
                                </div>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder={`Min ${Number(selectedPlan?.minAmount).toLocaleString()}`}
                                        className="pl-12 py-7 text-2xl font-black bg-background/50 border-border focus:ring-primary h-auto"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-between px-1">
                                    <button className="text-[10px] uppercase font-bold hover:text-primary transition-colors text-muted-foreground" onClick={() => setAmount(String(selectedPlan?.minAmount))}>MIN ENTRY</button>
                                    <button className="text-[10px] uppercase font-bold hover:text-primary transition-colors text-muted-foreground" onClick={() => setAmount(String(walletBalance))}>ALL AVAILABLE</button>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-2xl p-6 space-y-4 border border-white/5 shadow-inner">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Gross Projected Returns:</span>
                                    <span className="text-accent font-black text-lg">
                                        ${amount ? (Number(amount) * (selectedPlan?.returnPercentage / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-border/50 pt-4">
                                    <span className="text-foreground font-bold">Maturity Value:</span>
                                    <span className="text-foreground font-black text-lg">
                                        ${amount ? (Number(amount) * (1 + selectedPlan?.returnPercentage / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">Cancel</Button>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 py-6 h-auto" onClick={handleInvest}>
                                Confirm Term Entry
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes gradient-x { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 15s ease infinite; }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
      `}} />
        </Layout>
    );
};

export default ProprietaryAlgorithm;
