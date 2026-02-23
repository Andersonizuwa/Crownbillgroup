import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSettings, updateAppSettings, AppSettings as SettingsType } from "@/lib/settings";
import { useToast } from "@/hooks/use-toast";

const AppSettings = () => {
  const [usdtAddress, setUsdtAddress] = useState("");
  const [btcAddress, setBtcAddress] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getAppSettings();
        setUsdtAddress(settings.usdtAddress);
        setBtcAddress(settings.btcAddress);
        setWhatsappNumber(settings.whatsappNumber);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settings",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAppSettings({
        usdtAddress,
        btcAddress,
        whatsappNumber,
      });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usdtAddress">USDT Address (TRC20)</Label>
            <Input
              id="usdtAddress"
              value={usdtAddress}
              onChange={(e) => setUsdtAddress(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="btcAddress">Bitcoin Address</Label>
            <Input
              id="btcAddress"
              value={btcAddress}
              onChange={(e) => setBtcAddress(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+1 (646) 233-7202"
              disabled={isSaving}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppSettings;
