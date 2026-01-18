import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Award,
  User,
  Building,
  FileText
} from "lucide-react";
import heroImage from "@/assets/hero-finance.jpg";

const steps = [
  { id: 1, title: "Account", icon: User },
  { id: 2, title: "Organization", icon: Building },
  { id: 3, title: "Grant Details", icon: FileText },
];

const GrantApplication = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1 - Account
    fullName: "",
    email: "",
    password: "",
    phone: "",
    // Step 2 - Organization
    organizationName: "",
    organizationType: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    // Step 3 - Grant Details
    grantType: "",
    requestedAmount: "",
    projectDescription: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!user) {
          if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
          if (!formData.email.trim()) newErrors.email = "Email is required";
          else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email format";
          if (!formData.password) newErrors.password = "Password is required";
          else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
        }
        break;
      case 2:
        if (!formData.organizationName.trim()) newErrors.organizationName = "Organization name is required";
        if (!formData.organizationType) newErrors.organizationType = "Organization type is required";
        if (!formData.contactName.trim()) newErrors.contactName = "Contact name is required";
        if (!formData.contactEmail.trim()) newErrors.contactEmail = "Contact email is required";
        else if (!/^\S+@\S+\.\S+$/.test(formData.contactEmail)) newErrors.contactEmail = "Invalid email format";
        break;
      case 3:
        if (!formData.grantType) newErrors.grantType = "Grant type is required";
        if (!formData.requestedAmount) newErrors.requestedAmount = "Requested amount is required";
        if (!formData.projectDescription.trim()) newErrors.projectDescription = "Project description is required";
        else if (formData.projectDescription.length < 100) newErrors.projectDescription = "Please provide at least 100 characters";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    
    try {
      let userId = user?.id;

      // Create account if not logged in
      if (!user) {
        try {
          await register(formData.email, formData.password, formData.fullName);
          // Get the user ID from localStorage after registration
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            userId = parsedUser.id;
          }
        } catch (regError: any) {
          toast({
            title: "Registration Failed",
            description: regError.message || "Failed to create account",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (!userId) {
        toast({
          title: "Error",
          description: "Failed to get user information. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Submit grant application via API
      await api.post('/grants', {
        user_id: userId,
        grant_type: formData.grantType,
        organization_name: formData.organizationName,
        organization_type: formData.organizationType,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        project_description: formData.projectDescription,
        requested_amount: parseFloat(formData.requestedAmount),
        status: 'pending',
      });

      toast({
        title: "Application Submitted!",
        description: "Your grant application has been submitted. We will review it and get back to you soon.",
      });
      
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5 animate-fade-in">
            {user ? (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Already logged in</p>
                    <p className="text-sm text-muted-foreground">You're logged in as {user.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={errors.fullName ? "border-destructive" : ""}
                    />
                    {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a secure password (min 8 characters)"
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-accent hover:underline">Sign in</Link>
                </p>
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="Enter organization name"
                  className={errors.organizationName ? "border-destructive" : ""}
                />
                {errors.organizationName && <p className="text-sm text-destructive">{errors.organizationName}</p>}
              </div>
              <div className="space-y-2">
                <Label>Organization Type *</Label>
                <Select value={formData.organizationType} onValueChange={(v) => handleSelectChange("organizationType", v)}>
                  <SelectTrigger className={errors.organizationType ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nonprofit">Non-Profit Organization</SelectItem>
                    <SelectItem value="educational">Educational Institution</SelectItem>
                    <SelectItem value="small-business">Small Business</SelectItem>
                    <SelectItem value="community">Community Group</SelectItem>
                    <SelectItem value="government">Local Government</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.organizationType && <p className="text-sm text-destructive">{errors.organizationType}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Person Name *</Label>
              <Input
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                placeholder="Primary contact person"
                className={errors.contactName ? "border-destructive" : ""}
              />
              {errors.contactName && <p className="text-sm text-destructive">{errors.contactName}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="contact@organization.com"
                  className={errors.contactEmail ? "border-destructive" : ""}
                />
                {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Grant Program *</Label>
                <Select value={formData.grantType} onValueChange={(v) => handleSelectChange("grantType", v)}>
                  <SelectTrigger className={errors.grantType ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select grant program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education">Education Grant (Up to $50,000)</SelectItem>
                    <SelectItem value="small-business">Small Business Grant (Up to $25,000)</SelectItem>
                    <SelectItem value="community">Community Development Grant (Up to $100,000)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.grantType && <p className="text-sm text-destructive">{errors.grantType}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestedAmount">Requested Amount ($) *</Label>
                <Input
                  id="requestedAmount"
                  name="requestedAmount"
                  type="number"
                  value={formData.requestedAmount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className={errors.requestedAmount ? "border-destructive" : ""}
                />
                {errors.requestedAmount && <p className="text-sm text-destructive">{errors.requestedAmount}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription">Project Description *</Label>
              <Textarea
                id="projectDescription"
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleInputChange}
                placeholder="Describe your project, goals, and how the grant funds will be used... (minimum 100 characters)"
                className={`min-h-[150px] ${errors.projectDescription ? "border-destructive" : ""}`}
              />
              {errors.projectDescription && <p className="text-sm text-destructive">{errors.projectDescription}</p>}
              <p className="text-xs text-muted-foreground">{formData.projectDescription.length} / 100 minimum characters</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your application will be reviewed by our grants committee</li>
                <li>• You can track your application status in your dashboard</li>
                <li>• We'll contact you within 5-7 business days</li>
                <li>• You can also fund your account and explore investment options</li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12" style={{ background: 'var(--gradient-hero)' }}>
        <div className="container-main relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <Award className="h-10 w-10 text-accent" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
                Grant Application
              </h1>
              <p className="text-primary-foreground/70">Apply for funding to support your initiative</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container-main py-8 md:py-12">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep >= step.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-sm mt-2 ${
                    currentStep >= step.id ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 md:w-32 h-1 mx-2 rounded ${
                    currentStep > step.id ? "bg-accent" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <div className="card-elevated-lg p-6 md:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              {steps.find(s => s.id === currentStep)?.title}
            </h2>

            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <Button variant="accent" onClick={handleNext}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  variant="accent" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GrantApplication;
