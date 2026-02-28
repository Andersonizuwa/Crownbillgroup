import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  FileText,
  CreditCard,
  Shield,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import heroImage from "@/assets/hero-finance.jpg";
import { getAppSettings, AppSettings } from "@/lib/settings";
import { useState, useEffect } from "react";

const CustomerService = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getAppSettings().then(setSettings);
  }, []);

  const supportOptions = settings ? [
    {
      icon: Phone,
      title: "WhatsApp",
      description: "Chat with us on WhatsApp",
      action: settings.whatsappNumber,
      available: "24/7",
      link: `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`,
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with support online",
      action: "Start Chat",
      available: "24/7",
      link: `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`,
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "Send us a message",
      action: "support@crownbillgroup.com",
      available: "Response within 24hrs",
      link: "mailto:support@crownbillgroup.com",
    },
  ] : [];

  const quickLinks = [
    { icon: FileText, title: "Account Statements", path: "#" },
    { icon: CreditCard, title: "Manage Cards", path: "#" },
    { icon: Shield, title: "Security Center", path: "#" },
    { icon: HelpCircle, title: "Help Center", path: "#" },
  ];

  const faqs = [
    {
      question: "How do I open a new account?",
      answer: "Opening an account is easy. Click on 'Open an Account' from the homepage or visit our registration page. You'll need to provide personal information, proof of identity, and complete our verification process. Most accounts are approved within 1-2 business days.",
    },
    {
      question: "What are the fees for trading?",
      answer: "We offer commission-free online trading for stocks and ETFs. There are no account fees or minimums to open an account. Some specialized investments may have associated fees which are disclosed before any transaction.",
    },
    {
      question: "How do I transfer money to my account?",
      answer: "You can transfer funds through our Transfers page. Link your bank account, then initiate a deposit. Transfers typically complete within 1-3 business days. You can also set up recurring automatic transfers.",
    },
    {
      question: "How is my account protected?",
      answer: "Your account is protected by industry-leading security measures including encryption, multi-factor authentication, and fraud monitoring. Accounts are also covered by SIPC protection up to $500,000 for securities.",
    },
    {
      question: "What documents do I need for KYC verification?",
      answer: "You'll need a government-issued photo ID (passport preferred, but national ID or driver's license accepted), proof of address (utility bill or bank statement from the last 6 months), and your tax identification number.",
    },
    {
      question: "How long does account verification take?",
      answer: "Our manual verification process typically takes 24-48 business hours. You'll receive an email notification once your account has been reviewed. If additional information is needed, we'll contact you directly.",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>
        <div className="container-main relative z-10 text-center">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground">
            How Can We Help You?
          </h1>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Our support team is here to assist you 24/7 with any questions or concerns.
          </p>
        </div>
      </section>

      <div className="container-main py-8 md:py-12">

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help topics..."
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {settings && supportOptions.map((option) => (
            <a
              key={option.title}
              href={option.link}
              target={option.link.startsWith('http') ? '_blank' : undefined}
              rel={option.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="card-elevated-lg p-6 text-center hover:shadow-xl transition-all duration-300 block"
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <option.icon className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{option.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
              <p className="font-medium text-accent mb-2">{option.action}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {option.available}
              </p>
            </a>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                to={link.path}
                className="card-elevated p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
              >
                <link.icon className="h-5 w-5 text-accent" />
                <span className="font-medium text-foreground">{link.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="card-elevated-lg p-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {settings && (
              <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <Button variant="accent" size="lg">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat on WhatsApp
                </Button>
              </a>
            )}
            <Link to="/register">
              <Button variant="outline" size="lg">
                Open an Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CustomerService;
