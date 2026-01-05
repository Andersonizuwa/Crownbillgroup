import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  FileText, 
  Home, 
  CreditCard, 
  Shield,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  AlertCircle
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Identity", icon: FileText },
  { id: 3, title: "Address & Funds", icon: Home },
  { id: 4, title: "Tax Info", icon: CreditCard },
  { id: 5, title: "PEP Declaration", icon: Shield },
  { id: 6, title: "Business Info", icon: Building2 },
];

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1 - Personal Info
    fullName: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    password: "",
    maritalStatus: "",
    nationality: "",
    countryOfResidence: "",
    // Step 2 - Identity
    idType: "",
    idDocument: null as File | null,
    // Step 3 - Address & Funds
    addressDocument: null as File | null,
    sourceOfFunds: "",
    // Step 4 - Tax Info
    taxId: "",
    // Step 5 - PEP Declaration
    isPEP: "",
    pepDetails: "",
    // Step 6 - Business Info
    hasBusiness: false,
    businessName: "",
    businessType: "",
    businessIndustry: "",
    businessTaxId: "",
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

  const validateFile = (file: File | null, type: 'id' | 'address'): string | null => {
    if (!file) return null;
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      return "Please upload a valid document (JPG, PNG, or PDF)";
    }
    
    // Check minimum file size (at least 50KB to be a real document)
    const minSize = 50 * 1024;
    if (file.size < minSize) {
      return "File appears to be too small. Please upload a clear, readable document";
    }
    
    return null;
  };

  const handleFileChange = (name: string, file: File | null) => {
    // Validate file before setting
    if (file) {
      const fileType = name === 'idDocument' ? 'id' : 'address';
      const validationError = validateFile(file, fileType);
      if (validationError) {
        setErrors((prev) => ({ ...prev, [name]: validationError }));
        return; // Don't set the file if validation fails
      }
    }
    
    setFormData((prev) => ({ ...prev, [name]: file }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
        if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email format";
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
        if (!formData.maritalStatus) newErrors.maritalStatus = "Marital status is required";
        if (!formData.nationality) newErrors.nationality = "Nationality is required";
        if (!formData.countryOfResidence) newErrors.countryOfResidence = "Country of residence is required";
        break;
      case 2:
        if (!formData.idType) newErrors.idType = "Please select an ID type";
        if (!formData.idDocument) newErrors.idDocument = "Please upload your ID document";
        break;
      case 3:
        if (!formData.addressDocument) newErrors.addressDocument = "Please upload proof of address";
        if (!formData.sourceOfFunds) newErrors.sourceOfFunds = "Please select source of funds";
        break;
      case 4:
        if (!formData.taxId.trim()) newErrors.taxId = "Tax ID is required";
        break;
      case 5:
        if (!formData.isPEP) newErrors.isPEP = "Please answer the PEP question";
        if (formData.isPEP === "yes" && !formData.pepDetails.trim()) {
          newErrors.pepDetails = "Please provide details about your PEP status";
        }
        break;
      case 6:
        // Business info is optional - only validate if they have a business
        if (formData.hasBusiness) {
          if (!formData.businessName.trim()) newErrors.businessName = "Business name is required";
          if (!formData.businessType) newErrors.businessType = "Business type is required";
          if (!formData.businessIndustry) newErrors.businessIndustry = "Industry is required";
          if (!formData.businessTaxId.trim()) newErrors.businessTaxId = "Business tax ID is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    
    try {
      // Create user account
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      
      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to create account",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Update profile with additional data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('profiles').update({
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth,
          marital_status: formData.maritalStatus,
          nationality: formData.nationality,
          country_of_residence: formData.countryOfResidence,
          tax_id: formData.taxId,
          is_pep: formData.isPEP === 'yes',
          pep_details: formData.pepDetails || null,
          has_business: formData.hasBusiness,
          business_name: formData.hasBusiness ? formData.businessName : null,
          business_type: formData.hasBusiness ? formData.businessType : null,
          business_industry: formData.hasBusiness ? formData.businessIndustry : null,
          business_tax_id: formData.hasBusiness ? formData.businessTaxId : null,
        }).eq('user_id', user.id);
      }

      toast({
        title: "Account Created Successfully",
        description: "Welcome to CrownBillGroup! You can now log in.",
      });
      navigate("/login");
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUpload = ({ 
    name, 
    label, 
    accept = "image/*,.pdf",
    error 
  }: { 
    name: string; 
    label: string; 
    accept?: string;
    error?: string;
  }) => {
    const file = formData[name as keyof typeof formData] as File | null;
    
    return (
      <div className="space-y-2">
        <Label className="text-foreground">{label}</Label>
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            error ? "border-destructive" : "border-border hover:border-accent/50"
          }`}
        >
          <input
            type="file"
            accept={accept}
            onChange={(e) => handleFileChange(name, e.target.files?.[0] || null)}
            className="hidden"
            id={name}
          />
          <label htmlFor={name} className="cursor-pointer">
            {file ? (
              <div className="flex items-center justify-center gap-2 text-accent">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-8 w-8" />
                <span>Click to upload or drag and drop</span>
                <span className="text-xs">PDF, JPG, PNG up to 10MB</span>
              </div>
            )}
          </label>
        </div>
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full legal name"
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={errors.dateOfBirth ? "border-destructive" : ""}
                />
                {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a secure password"
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label>Marital Status *</Label>
                <Select value={formData.maritalStatus} onValueChange={(v) => handleSelectChange("maritalStatus", v)}>
                  <SelectTrigger className={errors.maritalStatus ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
                {errors.maritalStatus && <p className="text-sm text-destructive">{errors.maritalStatus}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nationality *</Label>
                <Select value={formData.nationality} onValueChange={(v) => handleSelectChange("nationality", v)}>
                  <SelectTrigger className={errors.nationality ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.nationality && <p className="text-sm text-destructive">{errors.nationality}</p>}
              </div>
              <div className="space-y-2">
                <Label>Country of Residence *</Label>
                <Select value={formData.countryOfResidence} onValueChange={(v) => handleSelectChange("countryOfResidence", v)}>
                  <SelectTrigger className={errors.countryOfResidence ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.countryOfResidence && <p className="text-sm text-destructive">{errors.countryOfResidence}</p>}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <Label>ID Document Type *</Label>
              <Select value={formData.idType} onValueChange={(v) => handleSelectChange("idType", v)}>
                <SelectTrigger className={errors.idType ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport (Preferred)</SelectItem>
                  <SelectItem value="national-id">National ID Card</SelectItem>
                  <SelectItem value="drivers-license">Driver's License</SelectItem>
                </SelectContent>
              </Select>
              {errors.idType && <p className="text-sm text-destructive">{errors.idType}</p>}
            </div>

            <FileUpload 
              name="idDocument" 
              label="Upload ID Document *" 
              error={errors.idDocument}
            />

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Document Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Document must be valid and not expired</li>
                <li>• All corners of the document must be visible</li>
                <li>• Photo and text must be clearly legible</li>
                <li>• File size should not exceed 10MB</li>
              </ul>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <FileUpload 
              name="addressDocument" 
              label="Proof of Address *" 
              error={errors.addressDocument}
            />

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Acceptable Documents</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Utility bill (electricity, water, gas)</li>
                <li>• Bank statement</li>
                <li>• Government-issued letter</li>
                <li>• Must be dated within the last 6 months</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label>Source of Funds *</Label>
              <Select value={formData.sourceOfFunds} onValueChange={(v) => handleSelectChange("sourceOfFunds", v)}>
                <SelectTrigger className={errors.sourceOfFunds ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select source of funds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employment">Employment Income</SelectItem>
                  <SelectItem value="business">Business Income</SelectItem>
                  <SelectItem value="investments">Investment Returns</SelectItem>
                  <SelectItem value="savings">Personal Savings</SelectItem>
                  <SelectItem value="inheritance">Inheritance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.sourceOfFunds && <p className="text-sm text-destructive">{errors.sourceOfFunds}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax Identification Number (TIN) *</Label>
              <Input
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                placeholder="Enter your TIN, SSN, or ITIN"
                className={errors.taxId ? "border-destructive" : ""}
              />
              {errors.taxId && <p className="text-sm text-destructive">{errors.taxId}</p>}
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Why We Need This</h4>
              <p className="text-sm text-muted-foreground">
                Financial regulations require us to collect tax information to ensure compliance 
                with reporting requirements. Your information is securely stored and only used 
                for regulatory purposes.
              </p>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <h4 className="font-medium text-accent mb-2">Common Tax IDs</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>USA:</strong> Social Security Number (SSN) or ITIN</li>
                <li>• <strong>UK:</strong> National Insurance Number</li>
                <li>• <strong>Canada:</strong> Social Insurance Number (SIN)</li>
                <li>• <strong>Australia:</strong> Tax File Number (TFN)</li>
              </ul>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-4">
              <Label>Are you a Politically Exposed Person (PEP)? *</Label>
              <p className="text-sm text-muted-foreground">
                A PEP is someone who holds or has held a prominent public position, or is a 
                close family member or associate of such a person.
              </p>
              <RadioGroup 
                value={formData.isPEP} 
                onValueChange={(v) => handleSelectChange("isPEP", v)}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="pep-no" />
                  <Label htmlFor="pep-no" className="cursor-pointer">No, I am not a PEP</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="pep-yes" />
                  <Label htmlFor="pep-yes" className="cursor-pointer">Yes, I am a PEP</Label>
                </div>
              </RadioGroup>
              {errors.isPEP && <p className="text-sm text-destructive">{errors.isPEP}</p>}
            </div>

            {formData.isPEP === "yes" && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="pepDetails">Please provide details *</Label>
                <Textarea
                  id="pepDetails"
                  name="pepDetails"
                  value={formData.pepDetails}
                  onChange={handleInputChange}
                  placeholder="Please describe your position or relationship to a PEP..."
                  rows={4}
                  className={errors.pepDetails ? "border-destructive" : ""}
                />
                {errors.pepDetails && <p className="text-sm text-destructive">{errors.pepDetails}</p>}
              </div>
            )}

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Important Notice</h4>
              <p className="text-sm text-muted-foreground">
                Submitted information is manually reviewed for compliance purposes. 
                This process typically takes 24-48 business hours. You will be notified 
                once your application has been reviewed.
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-4">
              <Label className="text-lg font-medium">Business Loan Eligibility</Label>
              <p className="text-sm text-muted-foreground">
                Is you or a family member's business eligible for a loan? Please provide your business details below.
              </p>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="hasBusiness"
                checked={!formData.hasBusiness}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({ ...prev, hasBusiness: !checked }));
                }}
              />
              <Label htmlFor="hasBusiness" className="cursor-pointer font-medium">
                I don't have a business
              </Label>
            </div>

            {formData.hasBusiness && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="The legal name of your business"
                    className={errors.businessName ? "border-destructive" : ""}
                  />
                  {errors.businessName && <p className="text-sm text-destructive">{errors.businessName}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Business Type *</Label>
                  <Select value={formData.businessType} onValueChange={(v) => handleSelectChange("businessType", v)}>
                    <SelectTrigger className={errors.businessType ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="llc">LLC (Limited Liability Company)</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="nonprofit">Non-Profit Organization</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.businessType && <p className="text-sm text-destructive">{errors.businessType}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Industry / Category *</Label>
                  <Select value={formData.businessIndustry} onValueChange={(v) => handleSelectChange("businessIndustry", v)}>
                    <SelectTrigger className={errors.businessIndustry ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecommerce">eCommerce / Retail</SelectItem>
                      <SelectItem value="consulting">Consulting / Professional Services</SelectItem>
                      <SelectItem value="saas">SaaS / Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare / Medical</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="hospitality">Hospitality / Food Service</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="finance">Finance / Insurance</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.businessIndustry && <p className="text-sm text-destructive">{errors.businessIndustry}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessTaxId">Tax Information (EIN/SSN) *</Label>
                  <Input
                    id="businessTaxId"
                    name="businessTaxId"
                    value={formData.businessTaxId}
                    onChange={handleInputChange}
                    placeholder="Enter EIN or SSN for tax purposes"
                    className={errors.businessTaxId ? "border-destructive" : ""}
                  />
                  {errors.businessTaxId && <p className="text-sm text-destructive">{errors.businessTaxId}</p>}
                  <p className="text-xs text-muted-foreground">
                    Employer Identification Number (EIN) or Social Security Number (SSN) if sole proprietor
                  </p>
                </div>
              </div>
            )}

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Why We Need This</h4>
              <p className="text-sm text-muted-foreground">
                This information helps us determine loan eligibility and provide appropriate financial services 
                tailored to your business needs. All information is kept confidential and secure.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] py-8 md:py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Open Your Investment Account
            </h1>
            <p className="mt-2 text-muted-foreground">
              Complete the steps below to get started
            </p>
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-border">
                <div 
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {steps.map((step) => (
                <div key={step.id} className="relative flex flex-col items-center z-10">
                  <div
                    className={`step-indicator ${
                      step.id < currentStep
                        ? "step-indicator-completed"
                        : step.id === currentStep
                        ? "step-indicator-active"
                        : "step-indicator-pending"
                    }`}
                  >
                    {step.id < currentStep ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium hidden sm:block ${
                    step.id === currentStep ? "text-accent" : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="card-elevated-lg p-6 md:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Step {currentStep}: {steps[currentStep - 1].title}
            </h2>

            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={currentStep === 1 ? "invisible" : ""}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {currentStep < 6 ? (
                <Button variant="accent" onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  variant="accent" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    <>
                      Submit Application
                      <CheckCircle2 className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-accent font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
