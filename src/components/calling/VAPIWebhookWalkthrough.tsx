import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight,
  Copy,
  Settings,
  Webhook,
  Mouse,
  Eye,
  Target,
  Zap
} from "lucide-react";
import { toast } from "sonner";

export const VAPIWebhookWalkthrough = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  const webhookUrl = "https://scagutbejvgicmllzqge.supabase.co/functions/v1/vapi-webhook";
  
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied! Now paste it in VAPI.");
  };

  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    if (step < 6) {
      setCurrentStep(step + 1);
    }
  };

  const steps = [
    {
      id: 1,
      title: "Open VAPI Dashboard",
      description: "Click the button below to open your VAPI dashboard in a new tab",
      action: (
        <Button asChild size="lg" className="w-full">
          <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-5 w-5 mr-2" />
            Open VAPI Dashboard
          </a>
        </Button>
      ),
      details: "Make sure you're logged into your VAPI account. If not, sign in first."
    },
    {
      id: 2,
      title: "Navigate to Settings",
      description: "In the VAPI dashboard, look for 'Settings' in the left sidebar or menu",
      action: (
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-2 border-dashed border-blue-300">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Mouse className="h-5 w-5" />
              <span className="font-medium">Look for: "Settings" or ⚙️ icon</span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Usually located in the left sidebar or top navigation
            </p>
          </div>
          <Button 
            onClick={() => markStepComplete(2)} 
            variant="outline" 
            className="w-full"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Found Settings - Continue
          </Button>
        </div>
      ),
      details: "The Settings section might also be called 'Configuration' or have a gear icon ⚙️"
    },
    {
      id: 3,
      title: "Find Webhooks Section",
      description: "Inside Settings, look for 'Webhooks' or 'Integrations' section",
      action: (
        <div className="space-y-3">
          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-2 border-dashed border-purple-300">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Target className="h-5 w-5" />
              <span className="font-medium">Look for: "Webhooks" or "Integrations"</span>
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
              May be under "Advanced Settings" or "Developer Settings"
            </p>
          </div>
          <Button 
            onClick={() => markStepComplete(3)} 
            variant="outline" 
            className="w-full"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Found Webhooks - Continue
          </Button>
        </div>
      ),
      details: "If you can't find it, try looking under 'Advanced', 'Developer', or 'API' sections"
    },
    {
      id: 4,
      title: "Add New Webhook",
      description: "Click 'Add Webhook', 'Create Webhook', or '+' button to create a new webhook",
      action: (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-dashed border-green-300">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Zap className="h-5 w-5" />
              <span className="font-medium">Click: "Add Webhook" or "+" button</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              This will open a form to configure your webhook
            </p>
          </div>
          <Button 
            onClick={() => markStepComplete(4)} 
            variant="outline" 
            className="w-full"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Clicked Add Webhook - Continue
          </Button>
        </div>
      ),
      details: "Some dashboards might call it 'New Webhook', 'Create Endpoint', or just have a '+' icon"
    },
    {
      id: 5,
      title: "Paste Webhook URL",
      description: "Copy the URL below and paste it into the webhook URL field",
      action: (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-300">
            <div className="flex items-center gap-2 mb-2">
              <Copy className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800 dark:text-amber-200">Your Webhook URL:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono bg-white dark:bg-black p-2 rounded border">
                {webhookUrl}
              </code>
              <Button onClick={copyWebhookUrl} size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Paste this URL</strong> into the "Webhook URL", "Endpoint URL", or "Callback URL" field in VAPI
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => markStepComplete(5)} 
            variant="outline" 
            className="w-full"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Pasted URL - Continue
          </Button>
        </div>
      ),
      details: "Make sure to paste the complete URL exactly as shown, including https://"
    },
    {
      id: 6,
      title: "Select Events & Save",
      description: "Select the required events and save your webhook configuration",
      action: (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-300">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-3">✅ Enable These Events:</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>call.started</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>call.ended</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>call.failed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>transcript</span>
              </div>
            </div>
          </div>
          <Alert>
            <Webhook className="h-4 w-4" />
            <AlertDescription>
              Check all 4 events above, then click <strong>"Save"</strong> or <strong>"Create Webhook"</strong> in VAPI
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => markStepComplete(6)} 
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Webhook Configured Successfully!
          </Button>
        </div>
      ),
      details: "After saving, VAPI will start sending call events to your system for live tracking"
    }
  ];

  const currentStepData = steps.find(step => step.id === currentStep);
  const isComplete = completedSteps.length === 6;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-6 w-6" />
                VAPI Webhook Setup Walkthrough
              </CardTitle>
              <CardDescription>
                Follow these steps to configure your webhook in VAPI dashboard
              </CardDescription>
            </div>
            <Badge variant={isComplete ? "default" : "secondary"} className="text-sm">
              {completedSteps.length}/6 Steps
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedSteps.length / 6) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Step {currentStep}</span>
            <span>{Math.round((completedSteps.length / 6) * 100)}% Complete</span>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      {!isComplete && currentStepData && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                {currentStep}
              </div>
              <div>
                <CardTitle>{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStepData.action}
            <p className="text-sm text-muted-foreground italic">
              💡 {currentStepData.details}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {isComplete && (
        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                  Webhook Successfully Configured! 🎉
                </h3>
                <p className="text-green-600 dark:text-green-400 mt-2">
                  Your VAPI calls will now be automatically tracked. Make a test call to see it in action!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Steps Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Steps Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                  completedSteps.includes(step.id)
                    ? 'bg-green-500 text-white'
                    : step.id === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {completedSteps.includes(step.id) ? '✓' : step.id}
                </div>
                <span className={`flex-1 ${
                  completedSteps.includes(step.id)
                    ? 'text-green-600 dark:text-green-400 line-through'
                    : step.id === currentStep
                    ? 'font-medium'
                    : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};