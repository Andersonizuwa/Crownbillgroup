import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { 
  TrendingUp, 
  Shield, 
  Users, 
  BarChart3, 
  ArrowRight,
  CheckCircle2,
  Globe,
  Lock,
  Zap
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "Smart Investing",
      description: "Access powerful tools and research to make informed investment decisions.",
    },
    {
      icon: Shield,
      title: "Security First",
      description: "Your assets are protected with industry-leading security measures.",
    },
    {
      icon: Users,
      title: "Expert Guidance",
      description: "Get personalized advice from our team of financial professionals.",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Track your portfolio performance with advanced analytics and insights.",
    },
  ];

  const stats = [
    { value: "$11.5T", label: "Assets Under Administration" },
    { value: "40M+", label: "Individual Investors" },
    { value: "75+", label: "Years of Experience" },
    { value: "24/7", label: "Customer Support" },
  ];

  const benefits = [
    "Commission-free online trading",
    "Award-winning mobile app",
    "No account fees or minimums",
    "Extensive research and tools",
    "Retirement planning resources",
    "24/7 customer support",
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOGMzLjE4NiAwIDYuMTc4LS44MjcgOC43NzgtMi4yNzUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L2c+PC9zdmc+')] opacity-40" />
        
        <div className="container-main relative z-10 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight animate-slide-up">
                Invest in Your{" "}
                <span className="text-accent">Future</span>{" "}
                Today
              </h1>
              <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 max-w-xl mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Join millions of investors who trust Fidelity to help them reach their financial goals with our comprehensive investment solutions.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link to="/register">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    Open an Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/why-fidelity">
                  <Button variant="hero-outline" size="xl" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 md:gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10"
                  style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                >
                  <div className="text-2xl md:text-3xl font-bold text-accent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-primary-foreground/70 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding">
        <div className="container-main">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Why Choose Fidelity?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              We provide the tools, resources, and expertise you need to achieve your financial goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-elevated-lg p-6 md:p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-accent group-hover:text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-muted/50">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Everything You Need to Start Investing
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Whether you're a beginner or an experienced investor, we have the tools and resources to help you succeed.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
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
              <div className="card-elevated-lg p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground">Global Markets</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Access markets worldwide
                </p>
              </div>
              <div className="card-elevated-lg p-6 flex flex-col items-center text-center mt-8">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground">Secure</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Bank-level security
                </p>
              </div>
              <div className="card-elevated-lg p-6 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground">Fast</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time execution
                </p>
              </div>
              <div className="card-elevated-lg p-6 flex flex-col items-center text-center mt-8">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <h4 className="font-semibold text-foreground">Support</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Expert help available
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-main">
          <div className="card-elevated-lg overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
            <div className="p-8 md:p-12 lg:p-16 text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground">
                Ready to Start Your Investment Journey?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                Open an account in minutes and gain access to powerful investment tools, expert guidance, and a world of opportunities.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register">
                  <Button variant="hero" size="xl">
                    Open an Account
                  </Button>
                </Link>
                <Link to="/customer-service">
                  <Button variant="hero-outline" size="xl">
                    Contact Us
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

export default Index;
