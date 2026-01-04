import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  TrendingUp, 
  Users, 
  Award,
  CheckCircle2,
  ArrowRight,
  Building,
  Globe,
  HeartHandshake,
  Lightbulb
} from "lucide-react";
import heroImage from "@/assets/planning-hero.jpg";

const WhyFidelity = () => {
  const reasons = [
    {
      icon: Shield,
      title: "Trusted Security",
      description: "Your assets are protected by industry-leading security measures and insurance coverage.",
    },
    {
      icon: TrendingUp,
      title: "Low Costs",
      description: "Enjoy commission-free trading on stocks and ETFs with no account fees or minimums.",
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "Get guidance from experienced professionals available 24/7 to answer your questions.",
    },
    {
      icon: Award,
      title: "Award-Winning",
      description: "Recognized as a top brokerage by major financial publications for over a decade.",
    },
  ];

  const values = [
    {
      icon: Building,
      title: "Financial Strength",
      description: "With over 75 years of experience and trillions in assets under management, we're built to last.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access markets around the world with our comprehensive investment options.",
    },
    {
      icon: HeartHandshake,
      title: "Customer First",
      description: "Your success is our priority. We're committed to helping you reach your financial goals.",
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We continuously innovate to bring you the best tools and technology for your investments.",
    },
  ];

  const stats = [
    { value: "75+", label: "Years of Experience" },
    { value: "$11.5T", label: "Assets Under Administration" },
    { value: "40M+", label: "Individual Investors" },
    { value: "#1", label: "Online Broker Rating" },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[50vh] flex items-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>
        <div className="container-main py-20 md:py-28 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight animate-slide-up">
              Why Millions Trust CrownBillGroup With Their Investments
            </h1>
            <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              For over seven decades, we've been helping investors like you build wealth and achieve their financial dreams.
            </p>
            <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/register">
                <Button variant="hero" size="xl">
                  Open an Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-b border-border">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-accent">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Reasons */}
      <section className="section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              The CrownBillGroup Advantage
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover why more investors choose CrownBillGroup for their investment needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {reasons.map((reason) => (
              <div key={reason.title} className="card-elevated-lg p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <reason.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{reason.title}</h3>
                    <p className="text-muted-foreground">{reason.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="section-padding bg-muted/50">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                What Sets Us Apart
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We go beyond being just a brokerage. We're your partner in building lasting wealth.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "No account fees or minimums to get started",
                  "Commission-free online trading for stocks and ETFs",
                  "Award-winning research and educational resources",
                  "24/7 customer support from knowledgeable professionals",
                  "Powerful mobile app for trading on the go",
                  "Comprehensive retirement planning tools",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link to="/register">
                  <Button variant="accent" size="lg">
                    Get Started Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {values.map((value) => (
                <div key={value.title} className="card-elevated p-6">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <value.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{value.title}</h4>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-main">
          <div className="card-elevated-lg p-8 md:p-12 lg:p-16 text-center" style={{ background: 'var(--gradient-hero)' }}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground">
              Ready to Experience the Difference?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Join millions of investors who trust CrownBillGroup with their financial future.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="hero" size="xl">
                  Open an Account
                </Button>
              </Link>
              <Link to="/customer-service">
                <Button variant="hero-outline" size="xl">
                  Talk to an Expert
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default WhyFidelity;
