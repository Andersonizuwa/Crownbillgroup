import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2
} from "lucide-react";

const Profile = () => {
  const personalInfo = {
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    dateOfBirth: "January 15, 1985",
    nationality: "United States",
    address: "123 Main St, New York, NY 10001",
  };

  const kycStatus = {
    status: "verified",
    verifiedDate: "December 20, 2025",
    documents: [
      { name: "Passport", status: "verified", uploadDate: "Dec 15, 2025" },
      { name: "Proof of Address", status: "verified", uploadDate: "Dec 15, 2025" },
      { name: "Tax ID", status: "verified", uploadDate: "Dec 15, 2025" },
    ],
  };

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Account Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information and account settings
          </p>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <div className="card-elevated-lg p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
                <Button variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Full Name</Label>
                  <p className="font-medium text-foreground">{personalInfo.fullName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email Address</Label>
                  <p className="font-medium text-foreground">{personalInfo.email}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-medium text-foreground">{personalInfo.phone}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date of Birth</Label>
                  <p className="font-medium text-foreground">{personalInfo.dateOfBirth}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nationality</Label>
                  <p className="font-medium text-foreground">{personalInfo.nationality}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium text-foreground">{personalInfo.address}</p>
                </div>
              </div>
            </div>

            {/* KYC Status Card */}
            <div className="card-elevated-lg p-6 md:p-8 mt-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Verification Status</h2>
              
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                kycStatus.status === 'verified' 
                  ? 'bg-accent/10 border border-accent/20' 
                  : 'bg-warning/10 border border-warning/20'
              }`}>
                {kycStatus.status === 'verified' ? (
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                ) : (
                  <Clock className="h-6 w-6 text-warning" />
                )}
                <div>
                  <p className="font-semibold text-foreground capitalize">
                    {kycStatus.status === 'verified' ? 'Account Verified' : 'Verification Pending'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {kycStatus.status === 'verified' 
                      ? `Verified on ${kycStatus.verifiedDate}`
                      : 'Your documents are being reviewed'
                    }
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <div className="card-elevated-lg p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Security Settings</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                  </div>
                  <Button variant="outline">Change Password</Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Button variant="accent">Enable</Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Login History</p>
                    <p className="text-sm text-muted-foreground">View recent account activity</p>
                  </div>
                  <Button variant="outline">View History</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents">
            <div className="card-elevated-lg p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Verification Documents</h2>

              <div className="space-y-4">
                {kycStatus.documents.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">Uploaded {doc.uploadDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === 'verified' ? (
                        <span className="flex items-center gap-1 text-accent text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-warning text-sm">
                          <Clock className="h-4 w-4" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Need to update your documents? Contact customer support for assistance with re-verification.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <div className="card-elevated-lg p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Notification Preferences</h2>

              <div className="space-y-4">
                {[
                  { title: "Email Notifications", description: "Receive updates via email" },
                  { title: "Trade Confirmations", description: "Get notified after each trade" },
                  { title: "Account Alerts", description: "Important account updates" },
                  { title: "Market News", description: "Daily market summaries" },
                  { title: "Promotional Offers", description: "Special offers and updates" },
                ].map((notification) => (
                  <div key={notification.title} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="h-5 w-5 text-accent rounded" />
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Button variant="accent">Save Preferences</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
