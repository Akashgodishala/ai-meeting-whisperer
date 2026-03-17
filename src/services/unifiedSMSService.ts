import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SMSCredentials } from "@/hooks/useCredentials";

export interface SMSMessage {
  to: string;
  message: string;
  customerName?: string;
}

export class UnifiedSMSService {
  private credentials: SMSCredentials;
  private retailerId?: string;

  constructor(credentials: SMSCredentials, retailerId?: string) {
    this.credentials = credentials;
    this.retailerId = retailerId;
  }

  private validateCredentials(): boolean {
    return Boolean(
      this.credentials.accountSid && 
      this.credentials.authToken && 
      this.credentials.fromNumber
    );
  }

  async sendSMS(smsData: SMSMessage): Promise<boolean> {
    if (!this.validateCredentials()) {
      toast({
        title: "SMS Configuration Missing",
        description: "Please configure Twilio SMS credentials first",
        variant: "destructive"
      });
      return false;
    }

    try {
      const response = await supabase.functions.invoke('send-sms', {
        body: {
          to: smsData.to,
          message: smsData.message,
          customerName: smsData.customerName || 'Customer',
          accountSid: this.credentials.accountSid,
          authToken: this.credentials.authToken,
          fromNumber: this.credentials.fromNumber
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Log SMS activity if retailer context is available
      if (this.retailerId) {
        await this.logSMSActivity(smsData.to, smsData.message, 'sent');
      }

      toast({
        title: "SMS Sent 📱",
        description: `Message sent to ${smsData.customerName || smsData.to}`,
      });

      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      
      // Log failed SMS if retailer context is available
      if (this.retailerId) {
        await this.logSMSActivity(
          smsData.to, 
          smsData.message, 
          'failed', 
          error instanceof Error ? error.message : 'Unknown error'
        );
      }

      toast({
        title: "SMS Failed",
        description: error instanceof Error ? error.message : "Failed to send SMS",
        variant: "destructive"
      });
      return false;
    }
  }

  async sendOrderConfirmationSMS(customerPhone: string, customerName: string, orderDetails: Record<string, unknown>): Promise<boolean> {
    const message = `Hi ${customerName}! Your order has been confirmed. Order details: ${JSON.stringify(orderDetails)}. Thank you for your business!`;
    
    return this.sendSMS({
      to: customerPhone,
      message,
      customerName
    });
  }

  async sendDeliveryUpdateSMS(customerPhone: string, customerName: string, status: string): Promise<boolean> {
    let message = '';
    
    switch (status.toLowerCase()) {
      case 'preparing':
        message = `Hi ${customerName}! Your order is being prepared and will be ready for delivery soon.`;
        break;
      case 'out_for_delivery':
        message = `Hi ${customerName}! Your order is out for delivery and will arrive shortly.`;
        break;
      case 'delivered':
        message = `Hi ${customerName}! Your order has been delivered. Thank you for choosing us!`;
        break;
      default:
        message = `Hi ${customerName}! Order status update: ${status}`;
    }

    return this.sendSMS({
      to: customerPhone,
      message,
      customerName
    });
  }

  async sendPromotionalSMS(customers: Array<{phone: string, name: string}>, message: string): Promise<{sent: number, failed: number}> {
    let sent = 0;
    let failed = 0;

    for (const customer of customers) {
      // Personalize message
      const personalizedMessage = message.replace(/{name}/g, customer.name);
      
      const success = await this.sendSMS({
        to: customer.phone,
        message: personalizedMessage,
        customerName: customer.name
      });

      if (success) {
        sent++;
      } else {
        failed++;
      }

      // Add delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast({
      title: "Promotional Campaign Complete",
      description: `Sent: ${sent}, Failed: ${failed}`,
      variant: sent > 0 ? "default" : "destructive"
    });

    return { sent, failed };
  }

  async sendFailedCallSMS(customerName: string, customerPhone: string, customMessage: string): Promise<boolean> {
    const formattedMessage = customMessage.replace('{customerName}', customerName) + 
      "\n\nSince we couldn't connect by phone, you can text back with any questions about the meeting. I'm here to help!";

    return this.sendSMS({
      to: customerPhone,
      message: formattedMessage,
      customerName
    });
  }

  private async logSMSActivity(phoneNumber: string, message: string, status: string, errorMessage?: string): Promise<void> {
    if (!this.retailerId) return;

    try {
      await supabase
        .from('retailer_sms_logs')
        .insert({
          retailer_id: this.retailerId,
          phone_number: phoneNumber,
          message: message,
          status: status,
          error_message: errorMessage,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log SMS activity:', error);
      // Don't throw error as this is just logging
    }
  }

  async getSMSHistory(limit: number = 50): Promise<Record<string, unknown>[]> {
    if (!this.retailerId) {
      console.warn('No retailer ID provided for SMS history');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('retailer_sms_logs')
        .select('*')
        .eq('retailer_id', this.retailerId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch SMS history:', error);
      return [];
    }
  }
}