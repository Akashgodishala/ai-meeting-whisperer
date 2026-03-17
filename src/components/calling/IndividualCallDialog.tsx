import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Phone, User, Settings, MessageSquare, Save, Edit, CheckCircle, XCircle } from "lucide-react";
import { Customer, customerStore } from "@/stores/customerStore";
import { useCredentials } from "@/hooks/useCredentials";
import { VAPIService } from "@/services/vapiService";
import { supabase } from "@/integrations/supabase/client";

interface IndividualCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onCallComplete?: () => void;
}

interface CustomerResponseStatusProps {
  customerPhone: string;
}

const CustomerResponseStatus = ({ customerPhone }: CustomerResponseStatusProps) => {
  const [latestResponse, setLatestResponse] = useState<{ response_type: string; response_message: string; created_at: string } | null>(null);

  useEffect(() => {
    if (!customerPhone) return;

    const fetchLatestResponse = async () => {
      try {
        const { data, error } = await supabase
          .from('meeting_responses')
          .select('*')
          .eq('customer_phone', customerPhone)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching customer response:', error);
          return;
        }

        setLatestResponse(data?.[0] || null);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchLatestResponse();

    // Set up real-time listener for this customer's responses
    const channel = supabase
      .channel(`customer-response-${customerPhone}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'meeting_responses',
          filter: `customer_phone=eq.${customerPhone}`
        },
        () => fetchLatestResponse()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerPhone]);

  if (!latestResponse) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="h-4 w-4" />
          <span className="text-sm font-medium">No previous responses</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          This customer hasn't responded to any calls yet
        </p>
      </div>
    );
  }

  const isPositive = latestResponse.response_type === 'yes' || latestResponse.response_type === 'confirmed';
  
  return (
    <div className={`border rounded-lg p-3 ${
      isPositive 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center gap-2">
        {isPositive ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <span className={`text-sm font-medium ${
          isPositive ? 'text-green-700' : 'text-red-700'
        }`}>
          Latest Response: {isPositive ? 'Positive' : 'Negative'}
        </span>
      </div>
      <p className={`text-xs mt-1 italic ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        "{latestResponse.response_message}"
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {new Date(latestResponse.created_at).toLocaleString()}
      </p>
    </div>
  );
};

export const IndividualCallDialog = ({ isOpen, onClose, customer, onCallComplete }: IndividualCallDialogProps) => {
  const { 
    vapiCredentials: credentials, 
    hasVAPICredentials: hasCredentials,
    smsCredentials,
    hasSMSCredentials 
  } = useCredentials();
  const [isCalling, setIsCalling] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [callStatus, setCallStatus] = useState<'ready' | 'calling' | 'completed' | 'failed'>('ready');
  const [isEditing, setIsEditing] = useState(false);

  // Load customer's saved message when customer changes
  useEffect(() => {
    if (customer) {
      setCustomMessage(customer.custom_message || "");
      setIsEditing(false);
    }
  }, [customer]);

  const defaultMessage = `Hello {customerName}, this is a friendly reminder about tomorrow's stand-up meeting. We'll be discussing exciting job opportunities and company progress updates. The meeting is scheduled for 30 minutes and your participation would be valuable.`;

  const handleSaveMessage = () => {
    if (!customer) return;
    
    customerStore.updateCustomMessage(customer.id, customMessage);
    setIsEditing(false);
    toast({
      title: "Message Saved",
      description: `Custom message saved for ${customer.name}`,
    });
  };

  const handleEditMessage = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (customer) {
      setCustomMessage(customer.custom_message || "");
    }
    setIsEditing(false);
  };

  const handleCall = async () => {
    if (!customer) return;
    
    if (!hasCredentials) {
      toast({
        title: "Setup Required",
        description: "Please configure VAPI credentials first",
        variant: "destructive"
      });
      return;
    }

    if (!customer.phone) {
      toast({
        title: "No Phone Number",
        description: "This customer doesn't have a phone number",
        variant: "destructive"
      });
      return;
    }

    setIsCalling(true);
    setCallStatus('calling');
    
    try {
      // Create VAPI service with custom message if provided
      const message = customMessage.trim() || defaultMessage;
      const customCredentials = {
        ...credentials,
        customMessage: message
      };
      
      const vapiService = new VAPIService(customCredentials, hasSMSCredentials ? smsCredentials : undefined);
      const callId = await vapiService.makeCall(customer);
      
      if (callId) {
        vapiService.monitorCall(callId, customer);
        setCallStatus('completed');
        toast({
          title: "Call Initiated Successfully! 📞",
          description: `AI voice agent is now calling ${customer.name}`,
        });
        onCallComplete?.();
      } else {
        setCallStatus('failed');
        toast({
          title: "Call Failed",
          description: "Unable to initiate the call. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setCallStatus('failed');
      console.error('Call error:', error);
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Failed to make call",
        variant: "destructive"
      });
    } finally {
      setIsCalling(false);
      // Reset status after a delay
      setTimeout(() => setCallStatus('ready'), 3000);
    }
  };

  const getStatusBadge = () => {
    switch (callStatus) {
      case 'calling':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">📞 Calling...</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-200">✅ Call Initiated</Badge>;
      case 'failed':
        return <Badge variant="destructive">❌ Call Failed</Badge>;
      default:
        return hasCredentials ? 
          <Badge className="bg-green-100 text-green-700 border-green-200">🟢 VAPI Ready</Badge> : 
          <Badge variant="secondary">⚠️ Setup Required</Badge>;
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Call {customer.name}
          </DialogTitle>
          <DialogDescription>
            Initiate an AI voice call to this customer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Response Status */}
          <CustomerResponseStatus customerPhone={customer.phone} />

          {/* Customer Info */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-2">Customer Details</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {customer.name}</p>
              <p><strong>Phone:</strong> {customer.phone || 'No phone number'}</p>
              <p><strong>Company:</strong> {customer.company || 'N/A'}</p>
              <p><strong>Email:</strong> {customer.email}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">System Status:</span>
            {getStatusBadge()}
          </div>

          {/* Setup Warning */}
          {!hasCredentials && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-700">
                <Settings className="h-4 w-4" />
                <span className="font-medium">Setup Required</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Please configure your VAPI credentials in the Global VAPI Configuration section first.
              </p>
            </div>
          )}

          {/* Custom Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Custom Message for {customer.name}
              </Label>
              <div className="flex gap-2">
                {!isEditing && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleEditMessage}
                    disabled={isCalling}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      disabled={isCalling}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSaveMessage}
                      disabled={isCalling}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Textarea
              id="custom-message"
              placeholder={defaultMessage}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="min-h-[100px]"
              disabled={isCalling || !isEditing}
              readOnly={!isEditing}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Use {`{customerName}`} to personalize the message. Leave empty to use default message.
              </p>
              {customer.custom_message && !isEditing && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ Saved message
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleCall}
              disabled={isCalling || !hasCredentials || !customer.phone}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              {isCalling ? 'Initiating Call...' : `Call ${customer.name}`}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isCalling}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};