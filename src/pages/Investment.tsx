import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp,
  PieChart,
  BarChart3,
  Shield,
  Clock,
  Target,
  Wallet,
  LineChart
} from "lucide-react";

const Investment = () => {
  const investmentOptions = [
    {
      icon: TrendingUp,
      title: "Stocks & ETFs",
      description: "Access thousands of stocks and ETFs with commission-free trading.",
      features: ["Real-time quotes", "Research tools", "Fractional shares"],
    },
    {
      icon: PieChart,
      title: "Mutual Funds",
      description: "Choose from thousands of mutual funds with no transaction fees.",
      features: ["Over 10,000 funds", "Expert analysis", "Automatic investing"],
    },
    {
      icon: BarChart3,
      title: "Bonds & Fixed Income",
      description: "Build a diversified fixed income portfolio for steady returns.",
      features: ["Treasury bonds", "Corporate bonds", "Municipal bonds"],
    },
    {
      icon: Shield,
      title: "Retirement Accounts",
      description: "Secure your future with our comprehensive retirement solutions.",
      features: ["Traditional IRA", "Roth IRA", "401(k) rollovers"],
    },
  ];

  const whyInvest = [
    {
      icon: Clock,
      title: "Start Early",
      description: "The power of compound interest works best over time.",
    },
    {
      icon: Target,
      title: "Set Goals",
      description: "Define clear financial objectives to guide your strategy.",
    },
    {
      icon: Wallet,
      title: "Diversify",
      description: "Spread risk across different asset classes.",
    },
    {
      icon: LineChart,
      title: "Stay Invested",
      description: "Long-term investors typically see better returns.",
    },
  ];

  const portfolioStrategies = [
    {
      name: "Conservative",
      allocation: { bonds: 70, stocks: 20, cash: 10 },
      description: "Lower risk, stable returns. Ideal for near-term goals.",
    },
    {
      name: "Moderate",
      allocation: { bonds: 40, stocks: 50, cash: 10 },
      description: "Balanced approach with growth potential.",
    },
    {
      name: "Aggressive",
      allocation: { bonds: 20, stocks: 75, cash: 5 },
      description: "Higher risk for potentially greater returns.",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-main relative z-10 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight animate-slide-up">
                Smart Investing for Your Future
              </h1>
              <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Build wealth with our comprehensive investment solutions. 
                From stocks to retirement accounts, we have everything you need to reach your financial goals.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link to="/register">
                  <Button variant="hero" size="xl">
                    Start Investing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/why-fidelity">
                  <Button variant="hero-outline" size="xl">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10">
                <div className="text-3xl font-bold text-accent">0%</div>
                <p className="text-primary-foreground/70 mt-1">Commission on trades</p>
              </div>
              <div className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10 mt-8">
                <div className="text-3xl font-bold text-accent">$0</div>
                <p className="text-primary-foreground/70 mt-1">Account minimums</p>
              </div>
              <div className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10">
                <div className="text-3xl font-bold text-accent">10,000+</div>
                <p className="text-primary-foreground/70 mt-1">Investment options</p>
              </div>
              <div className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10 mt-8">
                <div className="text-3xl font-bold text-accent">24/7</div>
                <p className="text-primary-foreground/70 mt-1">Trading access</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Options */}
      <section className="section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Investment Options
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose from a wide range of investment products tailored to your goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {investmentOptions.map((option) => (
              <div key={option.title} className="card-elevated-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <option.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{option.title}</h3>
                <p className="text-muted-foreground mb-4">{option.description}</p>
                <ul className="space-y-2">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Invest */}
      <section className="section-padding bg-muted/50">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Why Start Investing?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Investing is one of the most effective ways to build long-term wealth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyInvest.map((item) => (
              <div key={item.title} className="card-elevated p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Strategies */}
      <section className="section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Portfolio Strategies
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a strategy that matches your risk tolerance and goals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {portfolioStrategies.map((strategy) => (
              <div key={strategy.name} className="card-elevated-lg p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{strategy.name}</h3>
                <p className="text-muted-foreground mb-6">{strategy.description}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stocks</span>
                    <span className="text-sm font-medium text-foreground">{strategy.allocation.stocks}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full" 
                      style={{ width: `${strategy.allocation.stocks}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bonds</span>
                    <span className="text-sm font-medium text-foreground">{strategy.allocation.bonds}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${strategy.allocation.bonds}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cash</span>
                    <span className="text-sm font-medium text-foreground">{strategy.allocation.cash}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-muted-foreground/50 rounded-full" 
                      style={{ width: `${strategy.allocation.cash}%` }}
                    />
                  </div>
                </div>

                <Button variant="accent" className="w-full mt-6">
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-main">
          <div className="card-elevated-lg overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
            <div className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
                Ready to Start Your Investment Journey?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                Open an account in minutes and start building your financial future today.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button variant="hero" size="xl">
                    Open an Account
                  </Button>
                </Link>
                <Link to="/customer-service">
                  <Button variant="hero-outline" size="xl">
                    Talk to an Advisor
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Investment;
