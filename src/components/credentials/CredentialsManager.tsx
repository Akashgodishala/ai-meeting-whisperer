import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Settings, 
  Key, 
  Shield, 
  RotateCcw, 
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone
} from "lucide-react";
import { useCredentials } from "@/hooks/useCredentials";

export const CredentialsManager = () => {
  const {
    smsCredentials,
    setSmsCredentials,
    saveSMSCredentials,
    hasSMSCredentials,
    vapiCredentials,
    setVapiCredentials,
    saveVAPICredentials,
    hasVAPICredentials,
    resetVAPIMessage,
    isLoading,
    clearAllCredentials
  } = useCredentials();

  const [smsExpanded, setSmsExpanded] = useState(!hasSMSCredentials);
  const [vapiExpanded, setVapiExpanded] = useState(!hasVAPICredentials);

  const handleResetEverything = () => {
    clearAllCredentials();
    setSmsExpanded(true);
    setVapiExpanded(true);
  };

  const handleSMSSave = async () => {
    const success = await saveSMSCredentials();
    if (success) {
      setSmsExpanded(false);
    }
  };

  const handleVAPISave = async () => {
    const success = await saveVAPICredentials();
    if (success) {
      setVapiExpanded(false);
    }
  };

  const handleSMSInputChange = (field: keyof typeof smsCredentials, value: string) => {
    setSmsCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleVAPIInputChange = (field: keyof typeof vapiCredentials, value: string) => {
    setVapiCredentials(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Fresh Credential Setup
          </CardTitle>
          <CardDescription>
            Ready to configure new SMS and VAPI credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={hasSMSCredentials ? "default" : "outline"}>
                SMS: {hasSMSCredentials ? "✓ Configured" : "Ready for Setup"}
              </Badge>
              <Badge variant={hasVAPICredentials ? "default" : "outline"}>
                VAPI: {hasVAPICredentials ? "✓ Configured" : "Ready for Setup"}
              </Badge>
            </div>
            <div className="flex gap-2">
              {(hasSMSCredentials || hasVAPICredentials) && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleResetEverything}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Reset & Start Fresh
                </Button>
              )}
            </div>
          </div>
          
          {(!hasSMSCredentials && !hasVAPICredentials) && (
            <Alert className="mt-4 border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                <strong>Ready for Setup!</strong> All credentials have been cleared. You can now input your new credentials below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="sms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sms">SMS Configuration</TabsTrigger>
          <TabsTrigger value="vapi">VAPI Configuration</TabsTrigger>
        </TabsList>

        {/* SMS Configuration */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <CardTitle>Twilio SMS Configuration</CardTitle>
                  {hasSMSCredentials && !smsExpanded && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                {hasSMSCredentials && !smsExpanded && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSmsExpanded(true)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              <CardDescription>
                Configure Twilio SMS for call fallback and notifications
              </CardDescription>
            </CardHeader>
            
            {(!hasSMSCredentials || smsExpanded) && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sms-accountSid">Twilio Account SID</Label>
                    <Input
                      id="sms-accountSid"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={smsCredentials.accountSid}
                      onChange={(e) => handleSMSInputChange('accountSid', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sms-authToken">Twilio Auth Token</Label>
                    <Input
                      id="sms-authToken"
                      type="password"
                      placeholder="Your Twilio Auth Token"
                      value={smsCredentials.authToken}
                      onChange={(e) => handleSMSInputChange('authToken', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sms-fromNumber">Twilio Phone Number</Label>
                  <Input
                    id="sms-fromNumber"
                    placeholder="+1234567890"
                    value={smsCredentials.fromNumber}
                    onChange={(e) => handleSMSInputChange('fromNumber', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your verified Twilio phone number (include country code)
                  </p>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <ExternalLink className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-blue-900">Get Twilio Credentials:</p>
                      <ol className="text-blue-800 space-y-1">
                        <li>1. Sign up at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">twilio.com</a></li>
                        <li>2. Get Account SID and Auth Token from Console Dashboard</li>
                        <li>3. Buy a phone number from Phone Numbers → Manage → Buy a number</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button onClick={handleSMSSave} disabled={isLoading} className="flex-1">
                    <Key className="h-4 w-4 mr-2" />
                    Save SMS Configuration
                  </Button>
                  {hasSMSCredentials && (
                    <Button variant="outline" onClick={() => setSmsExpanded(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* VAPI Configuration */}
        <TabsContent value="vapi">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  <CardTitle>VAPI Configuration</CardTitle>
                  {hasVAPICredentials && !vapiExpanded && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                {hasVAPICredentials && !vapiExpanded && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setVapiExpanded(true)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              <CardDescription>
                Configure VAPI for AI voice calls ($10 free monthly credits)
              </CardDescription>
            </CardHeader>

            {(!hasVAPICredentials || vapiExpanded) && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vapi-apiKey">VAPI API Key</Label>
                  <Input
                    id="vapi-apiKey"
                    type="password"
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={vapiCredentials.apiKey}
                    onChange={(e) => handleVAPIInputChange('apiKey', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vapi-assistantId">Assistant ID</Label>
                  <Input
                    id="vapi-assistantId"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={vapiCredentials.assistantId}
                    onChange={(e) => handleVAPIInputChange('assistantId', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vapi-phoneNumberId">Phone Number ID</Label>
                  <Input
                    id="vapi-phoneNumberId"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={vapiCredentials.phoneNumberId}
                    onChange={(e) => handleVAPIInputChange('phoneNumberId', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="vapi-customMessage">Meeting Reminder Message</Label>
                    <Button variant="ghost" size="sm" onClick={resetVAPIMessage}>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset to Default
                    </Button>
                  </div>
                  <Textarea
                    id="vapi-customMessage"
                    placeholder="Use {customerName} to insert the customer's name"
                    value={vapiCredentials.customMessage}
                    onChange={(e) => handleVAPIInputChange('customMessage', e.target.value)}
                    className="min-h-20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{customerName}"} to automatically insert the customer's name
                  </p>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <ExternalLink className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium text-blue-900">Get VAPI Credentials:</p>
                      <ul className="text-blue-800 space-y-1">
                        <li>• Get API key from VAPI Dashboard</li>
                        <li>• Create an Assistant and copy its ID</li>
                        <li>• Add a Phone Number and copy its ID</li>
                        <li>• $10 free credits monthly!</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button onClick={handleVAPISave} disabled={isLoading} className="flex-1">
                    <Key className="h-4 w-4 mr-2" />
                    Save VAPI Configuration
                  </Button>
                  {hasVAPICredentials && (
                    <Button variant="outline" onClick={() => setVapiExpanded(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Alert className="border-amber-200 bg-amber-50">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-amber-800">
          <strong>Security Notice:</strong> Credentials are currently stored locally in your browser. 
          For production use, consider using Supabase secrets for enhanced security.
        </AlertDescription>
      </Alert>
    </div>
  );
};