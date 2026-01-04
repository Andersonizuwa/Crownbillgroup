import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  CheckCircle2, 
  Award,
  Users,
  Target,
  FileText,
  DollarSign
} from "lucide-react";
import heroImage from "@/assets/hero-finance.jpg";

const Grants = () => {
  const grantPrograms = [
    {
      title: "Education Grant",
      amount: "Up to $50,000",
      description: "Supporting educational initiatives and scholarship programs for underserved communities.",
      eligibility: ["Non-profit organizations", "Educational institutions", "Community groups"],
    },
    {
      title: "Small Business Grant",
      amount: "Up to $25,000",
      description: "Empowering small businesses and entrepreneurs to grow and create jobs.",
      eligibility: ["Small businesses (<50 employees)", "Minority-owned businesses", "Women-owned businesses"],
    },
    {
      title: "Community Development Grant",
      amount: "Up to $100,000",
      description: "Investing in projects that strengthen local communities and improve quality of life.",
      eligibility: ["Non-profit organizations", "Local governments", "Community foundations"],
    },
  ];

  const benefits = [
    "No repayment required",
    "Flexible use of funds",
    "Expert mentorship included",
    "Networking opportunities",
    "Access to resources",
    "Recognition and visibility",
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
        <div className="container-main relative z-10 py-16 md:py-24">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground leading-tight animate-slide-up">
              Grant Programs
            </h1>
            <p className="mt-6 text-lg md:text-xl text-primary-foreground/80 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              We're committed to making a positive impact in communities through our comprehensive grant programs. 
              Apply today and help us build a better tomorrow.
            </p>
            <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/grant-application">
                <Button variant="hero" size="xl">
                  Apply for a Grant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grant Programs */}
      <section className="section-padding">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Available Grant Programs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our various grant opportunities designed to support different initiatives and organizations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {grantPrograms.map((grant, index) => (
              <div key={grant.title} className="card-elevated-lg p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{grant.title}</h3>
                    <p className="text-accent font-bold">{grant.amount}</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">{grant.description}</p>

                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground mb-2">Eligibility:</p>
                  <ul className="space-y-1">
                    {grant.eligibility.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button variant="accent" className="w-full mt-6">
                  Learn More
                </Button>
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
                Why Apply for Our Grants?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our grant programs offer more than just funding. We provide comprehensive support to help you succeed.
              </p>

              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card-elevated-lg p-6 text-center">
                <DollarSign className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">$10M+</div>
                <p className="text-sm text-muted-foreground">Grants Awarded</p>
              </div>
              <div className="card-elevated-lg p-6 text-center">
                <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">500+</div>
                <p className="text-sm text-muted-foreground">Recipients</p>
              </div>
              <div className="card-elevated-lg p-6 text-center">
                <Target className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">50+</div>
                <p className="text-sm text-muted-foreground">Communities</p>
              </div>
              <div className="card-elevated-lg p-6 text-center">
                <FileText className="h-8 w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">95%</div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="container-main">
          <div className="card-elevated-lg overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
            <div className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
                Ready to Make an Impact?
              </h2>
              <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                Start your grant application today and join hundreds of organizations making a difference.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/grant-application">
                  <Button variant="hero" size="xl">
                    Start Application
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

export default Grants;
