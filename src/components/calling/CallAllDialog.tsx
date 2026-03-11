import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Phone, Users, Settings } from "lucide-react";
import { Customer } from "@/stores/customerStore";
import { useCredentials } from "@/hooks/useCredentials";
import { VAPIService } from "@/services/vapiService";

interface CallAllDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onCallComplete?: () => void;
}

export const CallAllDialog = ({ isOpen, onClose, customers, onCallComplete }: CallAllDialogProps) => {
  const { vapiCredentials: credentials, hasVAPICredentials: hasCredentials } = useCredentials();
  const [isCalling, setIsCalling] = useState(false);
  const [callProgress, setCallProgress] = useState<{[key: string]: 'pending' | 'calling' | 'completed' | 'failed'}>({});

  const callAllCustomers = async () => {
    if (!hasCredentials) {
      toast({
        title: "Setup Required",
        description: "Please configure VAPI credentials first",
        variant: "destructive"
      });
      return;
    }

    setIsCalling(true);
    const vapiService = new VAPIService(credentials);
    
    // Initialize progress for all customers
    const initialProgress = customers.reduce((acc, customer) => {
      acc[customer.id] = 'pending';
      return acc;
    }, {} as {[key: string]: 'pending' | 'calling' | 'completed' | 'failed'});
    
    setCallProgress(initialProgress);

    // Call customers sequentially with small delays
    for (const customer of customers) {
      if (!customer.phone) {
        setCallProgress(prev => ({ ...prev, [customer.id]: 'failed' }));
        continue;
      }

      try {
        setCallProgress(prev => ({ ...prev, [customer.id]: 'calling' }));
        
        const callId = await vapiService.makeCall(customer);
        
        if (callId) {
          vapiService.monitorCall(callId, customer);
          setCallProgress(prev => ({ ...prev, [customer.id]: 'completed' }));
        } else {
          setCallProgress(prev => ({ ...prev, [customer.id]: 'failed' }));
        }
      } catch (error) {
        setCallProgress(prev => ({ ...prev, [customer.id]: 'failed' }));
      }

      // Small delay between calls
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const successful = Object.values(callProgress).filter(status => status === 'completed').length;
    const failed = Object.values(callProgress).filter(status => status === 'failed').length;

    toast({
      title: "Bulk Calling Complete",
      description: `${successful} calls initiated successfully, ${failed} failed`,
    });

    setIsCalling(false);
    onCallComplete?.();
  };

  const getStatusBadge = (status: 'pending' | 'calling' | 'completed' | 'failed') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'calling':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Calling...</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-200">✓ Called</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Call All Customers
          </DialogTitle>
          <DialogDescription>
            Initiate AI calls to all {customers.length} customers in your directory
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
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

          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Customer List ({customers.length})</h4>
            <div className="max-h-60 overflow-auto border rounded-lg">
              {customers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{customer.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.phone || 'No phone number'}
                      </p>
                    </div>
                  </div>
                  {callProgress[customer.id] && getStatusBadge(callProgress[customer.id])}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={callAllCustomers}
            disabled={isCalling || !hasCredentials || customers.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Phone className="h-4 w-4 mr-2" />
            {isCalling ? 'Calling All Customers...' : `Call All ${customers.length} Customers`}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isCalling}>
            {isCalling ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};