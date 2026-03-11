import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Phone, MessageSquare } from "lucide-react";
import { Customer } from "@/stores/customerStore";
import { useCredentials } from "@/hooks/useCredentials";
import { VAPIService } from "@/services/vapiService";

interface VAPICallManagerProps {
  customer: Customer;
  onCallComplete?: () => void;
}

export const VAPICallManager = ({ customer, onCallComplete }: VAPICallManagerProps) => {
  const { vapiCredentials: credentials, hasVAPICredentials: hasCredentials } = useCredentials();
  const [isCalling, setIsCalling] = useState(false);
  const [customMessage, setCustomMessage] = useState(credentials.customMessage || '');

  const makeRealCall = async () => {
    if (!hasCredentials) {
      toast({
        title: "Setup Required",
        description: "Please configure your VAPI credentials in the global setup above",
        variant: "destructive"
      });
      return;
    }

    setIsCalling(true);

    try {
      // Use the custom message if provided, otherwise use the default from global credentials
      const messageToUse = customMessage || credentials.customMessage;
      const updatedCredentials = { ...credentials, customMessage: messageToUse };
      
      const vapiService = new VAPIService(updatedCredentials);
      const callId = await vapiService.makeCall(customer);
      
      if (callId) {
        // Start monitoring the call
        vapiService.monitorCall(callId, customer);
        onCallComplete?.();
      }
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Meeting Reminder Message Box */}
      <Card className="w-full">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <Label htmlFor={`message-${customer.id}`} className="text-sm font-medium">
              Meeting Reminder Message
            </Label>
          </div>
          <textarea
            id={`message-${customer.id}`}
            className="w-full p-3 border rounded-md resize-none h-20 text-sm bg-background text-foreground border-input"
            placeholder={credentials.customMessage || "Use {customerName} to insert the customer's name"}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Use {"{customerName}"} to automatically insert {customer.name || "the customer's name"}
          </p>
        </CardContent>
      </Card>

      {/* Call Controls */}
      <div className="flex items-center gap-2">
        {hasCredentials && (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            <Phone className="h-3 w-3 mr-1" />
            VAPI Ready
          </Badge>
        )}
        <Button 
          size="sm" 
          onClick={makeRealCall}
          disabled={isCalling || !customer.phone || !hasCredentials}
          className="relative bg-green-600 hover:bg-green-700"
        >
          <Phone className="h-3 w-3 mr-1" />
          {isCalling ? 'AI Calling...' : 'AI Call'}
          {isCalling && (
            <div className="absolute inset-0 bg-primary/20 animate-pulse rounded" />
          )}
        </Button>
      </div>
    </div>
  );
};