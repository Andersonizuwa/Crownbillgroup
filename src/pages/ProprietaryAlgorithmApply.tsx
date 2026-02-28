import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, CheckCircle2, ClipboardList } from "lucide-react";

const SECTIONS = [
    "Personal Profile",
    "Income & Net Worth",
    "Investment Experience",
    "Behavioural Profile",
    "Risk Tolerance",
    "Time Horizon",
    "Management Style",
    "Allocation Psychology",
    "Expectations & Alignment",
    "Crypto Profile",
];

const initialForm = {
    ageRange: "",
    occupation: "",
    occupationOther: "",
    industry: "",
    annualIncome: "",
    netWorth: "",
    liquidCapital: "",
    investingDuration: "",
    assetsInvested: [] as string[],
    investmentKnowledge: "",
    checkFrequency: "",
    investorDescription: "",
    dropReaction: "",
    whatMattersMost: "",
    returnProfile: "",
    investmentHorizon: "",
    involvementLevel: "",
    communicationPref: "",
    allocationPercentage: "",
    primaryGoal: "",
    primaryConcern: "",
    holdsCrypto: "",
    cryptoNetWorthPct: "",
    cryptoTypes: [] as string[],
    cryptoStorage: "",
    cryptoExchanges: "",
    cryptoActivity: "",
    cryptoAllocation: "",
    cryptoDropReaction: "",
};

type FormData = typeof initialForm;

const Radio = ({ name, value, label, checked, onChange }: { name: string; value: string; label: string; checked: boolean; onChange: () => void }) => (
    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${checked ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${checked ? "border-primary" : "border-muted-foreground"}`}>
            {checked && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
        </div>
        <span className="text-sm font-medium">{label}</span>
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
    </label>
);

const Checkbox = ({ value, label, checked, onChange }: { value: string; label: string; checked: boolean; onChange: () => void }) => (
    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${checked ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}>
        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${checked ? "border-primary bg-primary" : "border-muted-foreground"}`}>
            {checked && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
        </div>
        <span className="text-sm font-medium">{label}</span>
        <input type="checkbox" value={value} checked={checked} onChange={onChange} className="sr-only" />
    </label>
);

const SectionTitle = ({ num, title, subtitle }: { num: number; title: string; subtitle?: string }) => (
    <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-3">
            Section {num}
        </div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
    </div>
);

const Question = ({ num, label, children }: { num: number; label: string; children: React.ReactNode }) => (
    <div className="space-y-3">
        <p className="font-semibold text-foreground">{num}. {label}</p>
        <div className="grid gap-2">{children}</div>
    </div>
);

export default function ProprietaryAlgorithmApply() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormData>(initialForm);
    const [submitting, setSubmitting] = useState(false);

    const set = (field: keyof FormData, value: string) => setForm(f => ({ ...f, [field]: value }));

    const toggleMulti = (field: "assetsInvested" | "cryptoTypes", value: string) => {
        setForm(f => {
            const arr = f[field] as string[];
            return { ...f, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
        });
    };

    const validateStep = () => {
        switch (step) {
            case 0: return form.ageRange && form.occupation && form.industry && (form.occupation !== "Other" || form.occupationOther);
            case 1: return form.annualIncome && form.netWorth && form.liquidCapital;
            case 2: return form.investingDuration && form.assetsInvested.length > 0 && form.investmentKnowledge;
            case 3: return form.checkFrequency && form.investorDescription;
            case 4: return form.dropReaction && form.whatMattersMost && form.returnProfile;
            case 5: return form.investmentHorizon;
            case 6: return form.involvementLevel && form.communicationPref;
            case 7: return form.allocationPercentage;
            case 8: return form.primaryGoal && form.primaryConcern;
            case 9: return form.holdsCrypto;
            default: return true;
        }
    };

    const handleNext = () => {
        if (!validateStep()) { toast.error("Please answer all required questions before continuing."); return; }
        setStep(s => s + 1);
        window.scrollTo(0, 0);
    };

    const handleBack = () => { setStep(s => s - 1); window.scrollTo(0, 0); };

    const handleSubmit = async () => {
        if (!validateStep()) { toast.error("Please answer all required questions."); return; }
        setSubmitting(true);
        try {
            await api.post('/algo/apply', {
                ...form,
                assetsInvested: form.assetsInvested,
                cryptoTypes: form.cryptoTypes,
            });
            toast.success("Profile submitted. You’re one step away from your personalized allocation profile and $20 bonus.");
            navigate('/proprietary-algorithm');
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to submit application");
        } finally {
            setSubmitting(false);
        }
    };

    const progress = ((step) / SECTIONS.length) * 100;

    return (
        <Layout>
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/5">
                <div className="container-main py-12 max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-10 space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                            <ClipboardList className="w-4 h-4" />
                            Investor Qualification &amp; Allocation Profile
                        </div>
                        <h1 className="text-3xl font-extrabold text-foreground">CrownBill Proprietary Algorithm Access</h1>
                        <p className="text-muted-foreground mt-1">
                            This short profile helps our investment team match you with suitable return strategies based on your risk tolerance,
                            capital structure, and digital asset exposure.
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
                            <span>Takes ~2–3 minutes</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                            <span>Used for allocation matching only</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                            <span>Fully confidential</span>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-8">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>Step {step + 1} of {SECTIONS.length} — Investor Profile</span>
                            <span>{SECTIONS[step]}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress + (100 / SECTIONS.length)}%` }} />
                        </div>
                        <div className="flex gap-1 mt-2">
                            {SECTIONS.map((_, i) => (
                                <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-muted"}`} />
                            ))}
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl space-y-8">

                        {/* SECTION 1 */}
                        {step === 0 && (
                            <>
                                <SectionTitle num={1} title="Personal Profile" subtitle="Help us understand your background." />
                                <Question num={3} label="Age Range">
                                    {["18–24", "25–34", "35–44", "45–54", "55+"].map(v => (
                                        <Radio key={v} name="ageRange" value={v} label={v} checked={form.ageRange === v} onChange={() => set("ageRange", v)} />
                                    ))}
                                </Question>
                                <Question num={4} label="Primary Occupation">
                                    {["Student", "Salaried employee", "Business owner", "Freelancer", "Executive / Director", "Retired", "Other"].map(v => (
                                        <Radio key={v} name="occupation" value={v} label={v} checked={form.occupation === v} onChange={() => set("occupation", v)} />
                                    ))}
                                    {form.occupation === "Other" && (
                                        <input
                                            className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            placeholder="Please specify your occupation"
                                            value={form.occupationOther}
                                            onChange={e => set("occupationOther", e.target.value)}
                                        />
                                    )}
                                </Question>
                                <Question num={5} label="Industry">
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="e.g. Technology, Finance, Healthcare..."
                                        value={form.industry}
                                        onChange={e => set("industry", e.target.value)}
                                    />
                                </Question>
                            </>
                        )}

                        {/* SECTION 2 */}
                        {step === 1 && (
                            <>
                                <SectionTitle num={2} title="Income & Net Worth" subtitle="This helps us determine the right wealth tier for you." />
                                <Question num={6} label="Estimated Annual Income (USD or local equivalent)">
                                    {["Under $5,000", "$5,000 – $20,000", "$20,000 – $50,000", "$50,000 – $150,000", "$150,000+"].map(v => (
                                        <Radio key={v} name="annualIncome" value={v} label={v} checked={form.annualIncome === v} onChange={() => set("annualIncome", v)} />
                                    ))}
                                </Question>
                                <Question num={7} label="Estimated Net Worth (excluding primary home)">
                                    {["Under $10,000", "$10,000 – $50,000", "$50,000 – $250,000", "$250,000 – $1M", "$1M+"].map(v => (
                                        <Radio key={v} name="netWorth" value={v} label={v} checked={form.netWorth === v} onChange={() => set("netWorth", v)} />
                                    ))}
                                </Question>
                                <Question num={8} label="Liquid Capital Available for Investment">
                                    {["Under $1,000", "$1,000 – $10,000", "$10,000 – $50,000", "$50,000 – $250,000", "$250,000+"].map(v => (
                                        <Radio key={v} name="liquidCapital" value={v} label={v} checked={form.liquidCapital === v} onChange={() => set("liquidCapital", v)} />
                                    ))}
                                </Question>
                            </>
                        )}

                        {/* SECTION 3 */}
                        {step === 2 && (
                            <>
                                <SectionTitle num={3} title="Investment Experience" subtitle="Your sophistication index." />
                                <Question num={9} label="How long have you been investing?">
                                    {["No experience", "< 1 year", "1–3 years", "3–7 years", "7+ years"].map(v => (
                                        <Radio key={v} name="investingDuration" value={v} label={v} checked={form.investingDuration === v} onChange={() => set("investingDuration", v)} />
                                    ))}
                                </Question>
                                <Question num={10} label="Which assets have you invested in? (select all that apply)">
                                    {["Savings / Fixed deposits", "Stocks", "Crypto", "Forex", "Real estate", "Private businesses", "Funds / ETFs", "None"].map(v => (
                                        <Checkbox key={v} value={v} label={v} checked={form.assetsInvested.includes(v)} onChange={() => toggleMulti("assetsInvested", v)} />
                                    ))}
                                </Question>
                                <Question num={11} label="How would you rate your investment knowledge?">
                                    {["Beginner", "Basic", "Intermediate", "Advanced", "Professional"].map(v => (
                                        <Radio key={v} name="investmentKnowledge" value={v} label={v} checked={form.investmentKnowledge === v} onChange={() => set("investmentKnowledge", v)} />
                                    ))}
                                </Question>
                            </>
                        )}

                        {/* SECTION 4 */}
                        {step === 3 && (
                            <>
                                <SectionTitle num={4} title="Behavioural Investor Type" subtitle="Understanding how you engage with your investments." />
                                <Question num={12} label="How often do you check your investments?">
                                    {["Daily", "Weekly", "Monthly", "Occasionally", "I prefer not to monitor actively"].map(v => (
                                        <Radio key={v} name="checkFrequency" value={v} label={v} checked={form.checkFrequency === v} onChange={() => set("checkFrequency", v)} />
                                    ))}
                                </Question>
                                <Question num={13} label="Which best describes you?">
                                    {[
                                        "I like full control and frequent updates",
                                        "I like updates but don't interfere much",
                                        "I prefer professionals to manage everything",
                                        "I prefer completely passive investing"
                                    ].map(v => (
                                        <Radio key={v} name="investorDescription" value={v} label={v} checked={form.investorDescription === v} onChange={() => set("investorDescription", v)} />
                                    ))}
                                </Question>
                            </>
                        )}

                        {/* SECTION 5 */}
                        {step === 4 && (
                            <>
                                <SectionTitle num={5} title="Risk Tolerance" subtitle="Core section — be honest for the best tier match." />
                                <Question num={14} label="If your investment dropped 25–30% temporarily, what would you most likely do?">
                                    {["Withdraw immediately", "Reduce exposure", "Hold and wait", "Invest more while prices are lower"].map(v => (
                                        <Radio key={v} name="dropReaction" value={v} label={v} checked={form.dropReaction === v} onChange={() => set("dropReaction", v)} />
                                    ))}
                                </Question>
                                <Question num={15} label="What matters more to you?">
                                    {["Capital preservation", "Steady growth", "Balanced growth and safety", "High growth even with volatility"].map(v => (
                                        <Radio key={v} name="whatMattersMost" value={v} label={v} checked={form.whatMattersMost === v} onChange={() => set("whatMattersMost", v)} />
                                    ))}
                                </Question>
                                <Question num={16} label="Preferred return profile">
                                    {[
                                        "Low but stable returns",
                                        "Moderate returns with some fluctuation",
                                        "Higher returns with noticeable volatility",
                                        "Maximum long-term growth regardless of swings"
                                    ].map(v => (
                                        <Radio key={v} name="returnProfile" value={v} label={v} checked={form.returnProfile === v} onChange={() => set("returnProfile", v)} />
                                    ))}
                                </Question>
                            </>
                        )}

                        {/* MID-FORM ANTICIPATION */}
                        {step === 4 && (
                            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-xs font-medium text-primary">
                                ✔ You’re halfway through your investor profile
                            </div>
                        )}

                        {/* SECTION 6 */}
                        {step === 5 && (
                            <>
                                <SectionTitle num={6} title="Time Horizon" subtitle="Helps with lock-up planning and liquidity management." />
                                <Question num={17} label="How long do you plan to keep funds invested?">
                                    {["< 6 months", "6–12 months", "1–3 years", "3–5 years", "5+ years"].map(v => (
                                        <Radio key={v} name="investmentHorizon" value={v} label={v} checked={form.investmentHorizon === v} onChange={() => set("investmentHorizon", v)} />
                                    ))}
                                </Question>
                            </>
                        )}

                        {/* SECTION 7 */}
                        {step === 6 && (
                            <>
                                <SectionTitle num={7} title="Management Style Preference" />
                                <Question num={18} label="How involved do you want to be?">
                                    {[
                                        "Very hands-on (frequent discussions)",
                                        "Occasional updates are enough",
                                        "Quarterly reports are fine",
                                        "Fully hands-off"
                                    ].map(v => (
                                        <Radio key={v} name="involvementLevel" value={v} label={v} checked={form.involvementLevel === v} onChange={() => set("involvementLevel", v)} />
                                    ))}
                                </Question>
                                <Question num={19} label="Communication preference">
                                    {["WhatsApp updates", "Email reports", "Dashboard access", "Only major updates"].map(v => (
                                        <Radio key={v} name="communicationPref" value={v} label={v} checked={form.communicationPref === v} onChange={() => set("communicationPref", v)} />
                                    ))}
                                </Question>
                            </>
                        )}

                        {/* SECTION 8 */}
                        {step === 7 && (
                            <>
                                <SectionTitle num={8} title="Allocation Psychology" subtitle="Reveals conviction, risk appetite, and investor quality." />
                                <Question num={20} label="What percentage of your liquid capital would you allocate to a high-performance strategy?">
                                    {["< 5%", "5–10%", "10–25%", "25–50%", "50%+"].map(v => (
                                        <Radio key={v} name="allocationPercentage" value={v} label={v} checked={form.allocationPercentage === v} onChange={() => set("allocationPercentage", v)} />
                                    ))}
                                </Question>
                            </>
                        )}

                        {/* SECTION 9 */}
                        {step === 8 && (
                            <>
                                <SectionTitle num={9} title="Expectations & Alignment" />
                                <Question num={21} label="Primary investment goal">
                                    {["Wealth preservation", "Passive income", "Capital growth", "Aggressive wealth building"].map(v => (
                                        <Radio key={v} name="primaryGoal" value={v} label={v} checked={form.primaryGoal === v} onChange={() => set("primaryGoal", v)} />
                                    ))}
                                </Question>
                                <Question num={22} label="Which concerns you most?">
                                    {["Losing capital", "Missing opportunities", "Liquidity access", "Transparency"].map(v => (
                                        <Radio key={v} name="primaryConcern" value={v} label={v} checked={form.primaryConcern === v} onChange={() => set("primaryConcern", v)} />
                                    ))}
                                </Question>
                            </>
                        )}

                        {/* SECTION 10 */}
                        {step === 9 && (
                            <>
                                <SectionTitle num={10} title="Crypto Profile" subtitle="Understanding your digital asset exposure." />
                                <Question num={23} label="Do you currently hold cryptocurrency?">
                                    {["Yes", "No", "Previously held"].map(v => (
                                        <Radio key={v} name="holdsCrypto" value={v} label={v} checked={form.holdsCrypto === v} onChange={() => set("holdsCrypto", v)} />
                                    ))}
                                </Question>

                                {form.holdsCrypto !== "No" && (
                                    <>
                                        <Question num={24} label="Rough % of your net worth in crypto">
                                            {["0–5%", "5–20%", "20–50%", "50%+"].map(v => (
                                                <Radio key={v} name="cryptoNetWorthPct" value={v} label={v} checked={form.cryptoNetWorthPct === v} onChange={() => set("cryptoNetWorthPct", v)} />
                                            ))}
                                        </Question>
                                        <Question num={25} label="What types of crypto do you hold? (select all that apply)">
                                            {["Bitcoin", "Ethereum / major alts", "Stablecoins", "Smaller / speculative tokens", "Not sure"].map(v => (
                                                <Checkbox key={v} value={v} label={v} checked={form.cryptoTypes.includes(v)} onChange={() => toggleMulti("cryptoTypes", v)} />
                                            ))}
                                        </Question>
                                        <Question num={26} label="Where do you primarily store your crypto?">
                                            {["Exchanges", "Private wallets (mobile or hardware)", "Both"].map(v => (
                                                <Radio key={v} name="cryptoStorage" value={v} label={v} checked={form.cryptoStorage === v} onChange={() => set("cryptoStorage", v)} />
                                            ))}
                                            {form.cryptoStorage === "Exchanges" && (
                                                <input
                                                    className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                    placeholder="Which exchanges have you purchased crypto through?"
                                                    value={form.cryptoExchanges}
                                                    onChange={e => set("cryptoExchanges", e.target.value)}
                                                />
                                            )}
                                        </Question>
                                        <Question num={27} label="How actively do you use crypto?">
                                            {["Long-term holding", "Occasional trading", "Active trading", "Yield strategies (staking/DeFi)"].map(v => (
                                                <Radio key={v} name="cryptoActivity" value={v} label={v} checked={form.cryptoActivity === v} onChange={() => set("cryptoActivity", v)} />
                                            ))}
                                        </Question>
                                        <Question num={28} label="How much of your crypto could you allocate to managed opportunities?">
                                            {["None", "Up to 25%", "25–50%", "50%+"].map(v => (
                                                <Radio key={v} name="cryptoAllocation" value={v} label={v} checked={form.cryptoAllocation === v} onChange={() => set("cryptoAllocation", v)} />
                                            ))}
                                        </Question>
                                        <Question num={29} label="If crypto markets dropped 30%, you would:">
                                            {["Reduce exposure", "Hold steady", "Buy more"].map(v => (
                                                <Radio key={v} name="cryptoDropReaction" value={v} label={v} checked={form.cryptoDropReaction === v} onChange={() => set("cryptoDropReaction", v)} />
                                            ))}
                                        </Question>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <Button
                            variant="outline"
                            onClick={step === 0 ? () => navigate('/proprietary-algorithm') : handleBack}
                            className="gap-2 font-bold"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            {step === 0 ? "Cancel" : "Back"}
                        </Button>

                        {step < SECTIONS.length - 1 ? (
                            <Button onClick={handleNext} className="gap-2 font-bold bg-primary hover:bg-primary/90 px-8">
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="gap-2 font-bold bg-primary hover:bg-primary/90 px-8"
                            >
                                {submitting ? "Submitting..." : "Reveal My Allocation Profile"}
                                <CheckCircle2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
