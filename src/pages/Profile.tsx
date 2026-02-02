import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  XCircle,
  AlertCircle,
  Clock,
  Edit2,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingMode, setEditingMode] = useState<null | 'personal' | 'security'>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchLoginHistory();
  }, []);
  
  const fetchLoginHistory = async () => {
    try {
      const response = await api.get('/auth/login-history');
      setLoginHistory(response.data);
    } catch (error: any) {
      console.error('Error fetching login history:', error);
      // Don't show error toast for login history as it's not critical
    }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/user/profile');
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const updatedData: any = {};
    
    for (const [key, value] of formData.entries()) {
      if (value !== '') {
        updatedData[key] = value;
      }
    }
    
    // Validate date of birth if it's being updated
    if (updatedData.dateOfBirth) {
      const dob = new Date(updatedData.dateOfBirth);
      const today = new Date();
      const currentYear = today.getFullYear();
      
      if (dob.getFullYear() > currentYear - 1) {
        toast({
          title: "Validation Error",
          description: "Date of birth cannot be from the current year or in the future",
          variant: "destructive",
        });
        return;
      } else if (dob > today) {
        toast({
          title: "Validation Error",
          description: "Date of birth cannot be in the future",
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      const response = await api.patch('/user/profile', updatedData);
      setProfile(response.data);
      setEditingMode(null);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      
      // Reset form and close modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePasswordModal(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to change password",
        variant: "destructive",
      });
    }
  };



  const handleViewLoginHistory = async () => {
    try {
      const response = await api.get('/auth/login-history');
      setLoginHistory(response.data);
      setShowLoginHistoryModal(true);
    } catch (error: any) {
      console.error('Error fetching login history:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch login history",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  const personalInfo = {
    fullName: profile?.fullName || "Not provided",
    email: profile?.user?.email || "Not provided",
    phone: profile?.phone || "Not provided",
    dateOfBirth: profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not provided",
    nationality: profile?.nationality || "Not provided",
    address: profile?.countryOfResidence || "Not provided",
  };

  const kycStatus = {
    status: profile?.kycStatus || "pending",
    verifiedDate: profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "N/A",
    documents: profile?.user?.kycDocuments || [],
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
                {editingMode !== 'personal' ? (
                  <Button variant="outline" size="sm" onClick={() => setEditingMode('personal')}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : null}
              </div>

              {editingMode === 'personal' ? (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Full Name</Label>
                      <Input 
                        name="fullName"
                        defaultValue={personalInfo.fullName !== "Not provided" ? personalInfo.fullName : ''}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Email Address</Label>
                      <Input 
                        name="email"
                        defaultValue={personalInfo.email !== "Not provided" ? personalInfo.email : ''}
                        placeholder="Enter your email"
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Phone Number</Label>
                      <Input 
                        name="phone"
                        defaultValue={personalInfo.phone !== "Not provided" ? personalInfo.phone : ''}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Date of Birth</Label>
                      <Input 
                        name="dateOfBirth"
                        type="date"
                        defaultValue={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Nationality</Label>
                      <Input 
                        name="nationality"
                        defaultValue={personalInfo.nationality !== "Not provided" ? personalInfo.nationality : ''}
                        placeholder="Enter your nationality"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Country of Residence</Label>
                      <Input 
                        name="countryOfResidence"
                        defaultValue={personalInfo.address !== "Not provided" ? personalInfo.address : ''}
                        placeholder="Enter your country of residence"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" variant="accent">Save Changes</Button>
                    <Button type="button" variant="outline" onClick={() => setEditingMode(null)}>Cancel</Button>
                  </div>
                </form>
              ) : (
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
              )}
            </div>

            {/* KYC Status Card */}
            <div className="card-elevated-lg p-6 md:p-8 mt-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Verification Status</h2>
              
              <div className={`flex items-center gap-3 p-4 rounded-lg ${
                kycStatus.status === 'approved' 
                  ? 'bg-accent/10 border border-accent/20' 
                  : kycStatus.status === 'pending'
                    ? 'bg-warning/10 border border-warning/20'
                    : 'bg-destructive/10 border border-destructive/20'
              }`}>
                {kycStatus.status === 'approved' ? (
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                ) : kycStatus.status === 'pending' ? (
                  <Clock className="h-6 w-6 text-warning" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-destructive" />
                )}
                <div>
                  <p className="font-semibold text-foreground capitalize">
                    {kycStatus.status === 'approved' ? 'Account Verified' : kycStatus.status === 'pending' ? 'Verification Pending' : 'Verification Rejected'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {kycStatus.status === 'approved' 
                      ? `Verified on ${kycStatus.verifiedDate}`
                      : kycStatus.status === 'pending'
                        ? 'Your documents are being reviewed'
                        : 'Your verification was rejected. Please contact support.'
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
                  <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and new password to update your account.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="current-password" className="text-right">
                            Current Password
                          </Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            className="col-span-3 mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-password" className="text-right">
                            New Password
                          </Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            className="col-span-3 mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirm-password" className="text-right">
                            Confirm New Password
                          </Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            className="col-span-3 mt-2"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowChangePasswordModal(false);
                            setPasswordData({
                              currentPassword: '',
                              newPassword: '',
                              confirmPassword: ''
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleChangePassword}>
                          Change Password
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>



                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Login History</p>
                    <p className="text-sm text-muted-foreground">View recent account activity</p>
                  </div>
                  <Dialog open={showLoginHistoryModal} onOpenChange={setShowLoginHistoryModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline">View History</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[70vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Login History</DialogTitle>
                        <DialogDescription>
                          Your recent account login activity.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        {loginHistory.length > 0 ? (
                          <div className="space-y-3">
                            {loginHistory.map((entry: any, index: number) => (
                              <div 
                                key={index} 
                                className={`p-4 rounded-lg border ${
                                  entry.success ? 'bg-accent/5 border-accent/20' : 'bg-destructive/5 border-destructive/20'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {entry.success ? (
                                      <CheckCircle2 className="h-5 w-5 text-accent" />
                                    ) : (
                                      <AlertCircle className="h-5 w-5 text-destructive" />
                                    )}
                                    <span className={`font-medium ${
                                      entry.success ? 'text-accent' : 'text-destructive'
                                    }`}>
                                      {entry.success ? 'Successful Login' : 'Failed Login Attempt'}
                                    </span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Location: </span>
                                    <span>
                                      {entry.ip === '::1' ? 'Local Machine' : entry.ip || 'Unknown'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Device: </span>
                                    <span className="capitalize">
                                      {entry.userAgent ? 
                                        entry.userAgent.includes('Chrome') ? 'Chrome' :
                                        entry.userAgent.includes('Firefox') ? 'Firefox' :
                                        entry.userAgent.includes('Safari') ? 'Safari' :
                                        entry.userAgent.includes('Edge') ? 'Edge' :
                                        'Unknown Browser'
                                      : 'Unknown Device'}
                                    </span>
                                  </div>
                                </div>
                                
                                {!entry.success && entry.failureReason && (
                                  <div className="mt-2 pt-2 border-t border-border">
                                    <span className="text-muted-foreground text-sm">Reason: </span>
                                    <span className="text-sm">{entry.failureReason}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground py-4">No login history available</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents">
            <div className="card-elevated-lg p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-6">Verification Documents</h2>

              <div className="space-y-4">
                {kycStatus.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground capitalize">{doc.documentType.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">Uploaded {new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === 'approved' ? (
                        <span className="flex items-center gap-1 text-accent text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Verified
                        </span>
                      ) : doc.status === 'pending' ? (
                        <span className="flex items-center gap-1 text-warning text-sm">
                          <Clock className="h-4 w-4" />
                          Pending
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {kycStatus.documents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No documents uploaded yet.</p>
                )}
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
