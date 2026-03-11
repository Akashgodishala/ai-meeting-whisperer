import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Key, Shield, RotateCcw } from "lucide-react";
import { VAPICredentials } from "@/types/vapi";

interface VAPICredentialsFormProps {
  credentials: VAPICredentials;
  setCredentials: (credentials: VAPICredentials) => void;
  onSave: () => void;
  onCancel?: () => void;
  hasCredentials: boolean;
  onResetMessage?: () => void;
}

export const VAPICredentialsForm = ({ 
  credentials, 
  setCredentials, 
  onSave, 
  onCancel, 
  hasCredentials,
  onResetMessage
}: VAPICredentialsFormProps) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          VAPI Setup
        </CardTitle>
        <CardDescription>
          Configure VAPI for AI voice calls ($10 free monthly credits)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">VAPI API Key</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={credentials.apiKey}
            onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="assistantId">Assistant ID</Label>
          <Input
            id="assistantId"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={credentials.assistantId}
            onChange={(e) => setCredentials({...credentials, assistantId: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="customMessage">Meeting Reminder Message</Label>
            {onResetMessage && (
              <Button variant="ghost" size="sm" onClick={onResetMessage}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset to Default
              </Button>
            )}
          </div>
          <textarea
            id="customMessage"
            className="w-full p-2 border rounded resize-none h-20 text-sm bg-background text-foreground border-input"
            placeholder="Use {customerName} to insert the customer's name"
            value={credentials.customMessage}
            onChange={(e) => setCredentials({...credentials, customMessage: e.target.value})}
          />
          <p className="text-xs text-muted-foreground">
            Use {"{customerName}"} to automatically insert the customer's name
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumberId">Phone Number ID</Label>
          <Input
            id="phoneNumberId"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={credentials.phoneNumberId}
            onChange={(e) => setCredentials({...credentials, phoneNumberId: e.target.value})}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={onSave} className="flex-1">
            <Key className="h-4 w-4 mr-2" />
            Save Credentials
          </Button>
          {hasCredentials && onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Credentials stored locally (browser only)
          </p>
          <p>• Get API key from VAPI Dashboard</p>
          <p>• Create an Assistant and copy its ID</p>
          <p>• Add a Phone Number and copy its ID</p>
          <p>• $10 free credits monthly!</p>
        </div>
      </CardContent>
    </Card>
  );
};