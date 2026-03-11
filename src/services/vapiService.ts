import { toast } from "@/hooks/use-toast";
import { VAPICredentials, VAPICallData, CustomerResponse } from "@/types/vapi";
import { Customer } from "@/stores/customerStore";
import { SMSService, SMSCredentials } from "./smsService";
import { supabase } from "@/integrations/supabase/client";

export class VAPIService {
  private credentials: VAPICredentials;
  private smsService?: SMSService;

  constructor(credentials: VAPICredentials, smsCredentials?: SMSCredentials) {
    this.credentials = credentials;
    if (smsCredentials) {
      this.smsService = new SMSService(smsCredentials);
    }
  }

  async makeCall(customer: Customer): Promise<string | null> {
    if (!customer.phone) {
      toast({
        title: "No Phone Number",
        description: "Customer doesn't have a phone number",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Use Supabase edge function via the supabase client (uses the correct project URL automatically)
      const { data, error } = await supabase.functions.invoke('make-vapi-call', {
        body: {
          customer,
          customMessage: this.credentials.customMessage,
          // Pass credentials as fallback for when Supabase Secrets are not yet configured
          vapiApiKey: this.credentials.apiKey,
          vapiAssistantId: this.credentials.assistantId,
          vapiPhoneNumberId: this.credentials.phoneNumberId,
        },
      });

      if (error) throw new Error(error.message);
      const response = { ok: true };
      const parsed = data;

      if (parsed?.success) {
        toast({
          title: "Call Initiated with VAPI! 📞",
          description: parsed.message,
        });
        return parsed.callId;
      } else {
        throw new Error(parsed?.error || 'Call failed');
      }
    } catch (error) {
      console.error('VAPI Call error:', error);
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Failed to make call",
        variant: "destructive"
      });
      return null;
    }
  }

  async monitorCall(callId: string, customer: Customer): Promise<void> {
    // No need to poll VAPI API directly - webhook will handle call tracking
    toast({
      title: "Call Monitoring Active 📡",
      description: `Tracking call to ${customer.name} - results will appear in Call Monitor`,
    });
    
    console.log(`Call ${callId} initiated for ${customer.name} - webhook will capture results`);
  }

  private extractCustomerResponse(callData: any): CustomerResponse['response'] {
    const messages = callData.messages || (callData.artifact && callData.artifact.messages) || [];
    let customerResponse: CustomerResponse['response'] = 'no_response';
    
    messages.forEach((message: any) => {
      if (message.role === 'user') {
        const content = message.message?.toLowerCase() || message.content?.toLowerCase() || '';
        if (content.includes('1') || content.includes('yes') || content.includes('attend')) {
          customerResponse = 'attending';
        } else if (content.includes('2') || content.includes('no') || content.includes('cannot')) {
          customerResponse = 'not_attending';
        }
      }
    });
    
    return customerResponse;
  }

  private handleCallCompletion(customer: Customer, customerResponse: CustomerResponse['response'], callData?: any): void {
    const responseText = customerResponse === 'attending' ? 'Will Attend ✅' : 
                         customerResponse === 'not_attending' ? 'Cannot Attend ❌' : 
                         'No Response ⏳';
    
    toast({
      title: "Call Completed! 📞",
      description: `${customer.name}: ${responseText}`,
      variant: customerResponse === 'attending' ? 'default' : 'destructive'
    });
    
    console.log(`Customer ${customer.name} response:`, customerResponse);
  }
}