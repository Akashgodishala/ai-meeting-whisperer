import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  Settings,
  Webhook,
  ArrowRight,
  Phone
} from "lucide-react";
import { toast } from "sonner";

export const VAPIWebhookSetup = () => {
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  
  const webhookUrl = "https://scagutbejvgicmllzqge.supabase.co/functions/v1/vapi-webhook";
  
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied to clipboard!");
  };

  const markAsConfigured = () => {
    setWebhookConfigured(true);
    toast.success("Great! Your webhook is now configured.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Webhook className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">VAPI Webhook Setup</h1>
        </div>
        <p className="text-muted-foreground">
          Configure your VAPI webhook to enable live call tracking and customer response detection
        </p>
      </div>

      {/* Status Alert */}
      {!webhookConfigured && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Action Required:</strong> You need to configure the webhook in your VAPI dashboard for call tracking to work.
          </AlertDescription>
        </Alert>
      )}

      {webhookConfigured && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Webhook Configured!</strong> Your calls will now be tracked automatically.
          </AlertDescription>
        </Alert>
      )}

      {/* Webhook URL Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Your Webhook URL
          </CardTitle>
          <CardDescription>
            Copy this URL to add to your VAPI dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
            <code className="flex-1 text-sm font-mono break-all">
              {webhookUrl}
            </code>
            <Button 
              onClick={copyWebhookUrl}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-step Instructions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Steps
          </CardTitle>
          <CardDescription>
            Follow these steps to configure your VAPI webhook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Go to VAPI Dashboard</h3>
              <p className="text-sm text-muted-foreground">
                Open your VAPI dashboard in a new tab
              </p>
              <Button asChild variant="outline" className="w-fit">
                <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open VAPI Dashboard
                </a>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Navigate to Webhooks</h3>
              <p className="text-sm text-muted-foreground">
                In the VAPI dashboard, go to: <strong>Settings → Webhooks</strong>
              </p>
              <div className="flex items-center gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                <Settings className="h-4 w-4" />
                <ArrowRight className="h-4 w-4" />
                <Webhook className="h-4 w-4" />
                <span>Settings → Webhooks</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Add Webhook URL</h3>
              <p className="text-sm text-muted-foreground">
                Click "Add Webhook" and paste the URL from above
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <code className="text-sm font-mono text-blue-800 break-all">
                  {webhookUrl}
                </code>
              </div>
            </div>
          </div>

          <Separator />

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
              4
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Select Events</h3>
              <p className="text-sm text-muted-foreground">
                Enable these webhook events to track your calls:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">call.started</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">call.ended</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">call.failed</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">transcript</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Step 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
              5
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold">Save Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Click "Save" in your VAPI dashboard to activate the webhook
              </p>
              <Button 
                onClick={markAsConfigured}
                className="w-fit"
                disabled={webhookConfigured}
              >
                {webhookConfigured ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Configuration Complete
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Configured
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Section */}
      {webhookConfigured && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Phone className="h-5 w-5" />
              Test Your Setup
            </CardTitle>
            <CardDescription>
              Your webhook is configured! Here's how to verify it's working:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">1</Badge>
                <span>Make a test call to a real phone number using your VAPI assistant</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">2</Badge>
                <span>Go to the Call Monitor dashboard to see the call appear in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">3</Badge>
                <span>Check if customer responses (yes/no for meeting attendance) are being captured</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Calls not showing up?</strong>
              <ul className="mt-1 ml-4 space-y-1 text-muted-foreground">
                <li>• Verify the webhook URL is correct in VAPI dashboard</li>
                <li>• Make sure all 4 events are enabled (call.started, call.ended, call.failed, transcript)</li>
                <li>• Check that your VAPI account has webhook permissions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};