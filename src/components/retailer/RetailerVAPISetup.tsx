import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Phone, 
  MessageSquare, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  Info,
  ExternalLink
} from "lucide-react";

export const RetailerVAPISetup = () => {
  const [testPhone, setTestPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);

  const handleTestRetailerCall = async () => {
    if (!testPhone) {
      setSetupResult({ error: { message: "Please enter a phone number first" } });
      return;
    }
    
    setIsLoading(true);
    setSetupResult(null);
    
    try {
      const response = await supabase.functions.invoke('test-retailer-call', {
        body: {
          customer_phone: testPhone,
          customer_name: "Test Customer"
        }
      });

      setSetupResult(response);
    } catch (error) {
      setSetupResult({
        error: { message: error instanceof Error ? error.message : "Unknown error" }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureWebhook = async () => {
    setIsLoading(true);
    
    try {
      const response = await supabase.functions.invoke('configure-retailer-vapi', {
        body: { action: "configure_webhook" }
      });

      setSetupResult(response);
    } catch (error) {
      setSetupResult({
        error: { message: error instanceof Error ? error.message : "Unknown error" }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">VAPI Configuration</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Connect your VAPI phone number so customers can call and place orders through your AI voice agent
        </p>
      </div>

      {/* Configuration Status */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Current VAPI integration status and endpoints
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Phone className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">Phone Number</p>
                  <p className="text-xs text-muted-foreground">RETAILER_VAPI_PHONE_NUMBER</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MessageSquare className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">AI Assistant</p>
                  <p className="text-xs text-muted-foreground">RETAILER_VAPI_ASSISTANT_ID</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <ExternalLink className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Webhook Endpoint</p>
                  <p className="text-xs text-muted-foreground break-all">
                    https://scagutbejvgicmllzqge.supabase.co/functions/v1/vapi-liquor-webhook
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <MessageSquare className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-sm">SMS Integration</p>
                  <p className="text-xs text-muted-foreground">Twilio credentials configured</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Interface */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Voice Agent Testing
          </CardTitle>
          <CardDescription>
            Test the complete call-to-payment flow with your phone number
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="testPhone" className="text-base font-medium">
              Test Phone Number
            </Label>
            <Input
              id="testPhone"
              placeholder="+1 (555) 123-4567"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="text-lg h-12"
            />
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Enter your phone number to receive the test call and SMS payment link
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleConfigureWebhook} 
              disabled={isLoading}
              size="lg"
              className="h-14 text-base"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Settings className="h-5 w-5 mr-3" />
              )}
              Configure Webhook
            </Button>
            
            <Button 
              onClick={handleTestRetailerCall} 
              disabled={isLoading || !testPhone}
              variant="outline"
              size="lg"
              className="h-14 text-base"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Phone className="h-5 w-5 mr-3" />
              )}
              Test Complete Flow
            </Button>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium text-blue-900">Testing Process:</p>
                <ol className="text-blue-800 space-y-1 ml-4">
                  <li>1. Configure the webhook connection to your VAPI assistant</li>
                  <li>2. Enter your phone number for testing</li>
                  <li>3. Run the complete flow test</li>
                  <li>4. Answer the incoming call and place a test order</li>
                  <li>5. Receive SMS with payment link confirmation</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Results Section */}
      {setupResult && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {setupResult.error ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {setupResult.data?.webhook_configured && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Webhook configured successfully!</strong><br />
                  Your VAPI assistant is now connected to the retailer endpoint.
                </AlertDescription>
              </Alert>
            )}

            {setupResult.data?.call_initiated && (
              <Alert className="border-blue-200 bg-blue-50">
                <Phone className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Call initiated!</strong><br />
                  Check your phone - you should receive a call shortly.
                </AlertDescription>
              </Alert>
            )}

            {setupResult.data?.sms_sent && (
              <Alert className="border-green-200 bg-green-50">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>SMS payment link sent!</strong><br />
                  Payment link delivered to {testPhone}
                </AlertDescription>
              </Alert>
            )}

            {setupResult.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Error occurred:</strong><br />
                  {JSON.stringify(setupResult.error)}
                </AlertDescription>
              </Alert>
            )}

            <details className="mt-6">
              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground transition-colors">
                View Technical Details
              </summary>
              <pre className="mt-3 p-4 bg-muted rounded-lg text-xs overflow-auto border">
                {JSON.stringify(setupResult, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
};