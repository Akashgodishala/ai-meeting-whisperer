import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SMSMessage {
  to: string;
  message: string;
  customerName?: string;
}

export class RetailerSMSService {
  private retailerId: string;

  constructor(retailerId: string) {
    this.retailerId = retailerId;
  }

  async sendCustomSMS(smsData: SMSMessage): Promise<boolean> {
    try {
      // Get Twilio credentials from localStorage
      const storedCredentials = localStorage.getItem('sms_credentials');
      if (!storedCredentials) {
        throw new Error('SMS credentials not configured. Please set up Twilio credentials first.');
      }
      
      const credentials = JSON.parse(storedCredentials);
      
      const response = await supabase.functions.invoke('send-sms', {
        body: {
          to: smsData.to,
          message: smsData.message,
          customerName: smsData.customerName || 'Customer',
          accountSid: credentials.accountSid,
          authToken: credentials.authToken,
          fromNumber: credentials.fromNumber
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "SMS Sent Successfully! 📱",
        description: `Message sent to ${smsData.to}`,
      });

      // Log the SMS activity (will be available once types are updated)
      // await this.logSMSActivity(smsData, 'sent');
      
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      toast({
        title: "SMS Failed",
        description: error instanceof Error ? error.message : "Failed to send SMS",
        variant: "destructive"
      });

      // await this.logSMSActivity(smsData, 'failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async sendOrderConfirmationSMS(customerPhone: string, customerName: string, orderDetails: Record<string, unknown>): Promise<boolean> {
    const message = `Hi ${customerName}! Your order from our store has been confirmed. Order #${orderDetails.id} - Total: $${orderDetails.total_amount}. ${orderDetails.payment_link_url ? `Pay here: ${orderDetails.payment_link_url}` : 'Thank you for your business!'}`;
    
    return this.sendCustomSMS({
      to: customerPhone,
      message,
      customerName
    });
  }

  async sendDeliveryUpdateSMS(customerPhone: string, customerName: string, status: string): Promise<boolean> {
    let message = '';
    
    switch (status) {
      case 'preparing':
        message = `Hi ${customerName}! Your order is being prepared and will be delivered soon. Thank you for your patience!`;
        break;
      case 'out_for_delivery':
        message = `Hi ${customerName}! Your order is out for delivery and should arrive within the next 30 minutes.`;
        break;
      case 'delivered':
        message = `Hi ${customerName}! Your order has been delivered. Thank you for choosing us!`;
        break;
      default:
        message = `Hi ${customerName}! Your order status has been updated to: ${status}`;
    }

    return this.sendCustomSMS({
      to: customerPhone,
      message,
      customerName
    });
  }

  async sendPromotionalSMS(customers: Array<{phone: string, name: string}>, message: string): Promise<{sent: number, failed: number}> {
    let sent = 0;
    let failed = 0;

    for (const customer of customers) {
      const personalizedMessage = message.replace('{name}', customer.name);
      const success = await this.sendCustomSMS({
        to: customer.phone,
        message: personalizedMessage,
        customerName: customer.name
      });

      if (success) {
        sent++;
      } else {
        failed++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast({
      title: "Bulk SMS Campaign Complete",
      description: `Sent: ${sent}, Failed: ${failed}`,
    });

    return { sent, failed };
  }

  private async logSMSActivity(smsData: SMSMessage, status: 'sent' | 'failed', errorMessage?: string) {
    // TODO: Enable once Supabase types are updated
    console.log('SMS Activity:', {
      retailer_id: this.retailerId,
      phone_number: smsData.to,
      message: smsData.message,
      status,
      error_message: errorMessage,
      sent_at: new Date().toISOString()
    });
  }

  async getSMSHistory(limit: number = 50): Promise<Record<string, unknown>[]> {
    try {
      // TODO: Enable once Supabase types are updated
      // For now, return mock data
      return [];
    } catch (error) {
      console.error('Failed to fetch SMS history:', error);
      return [];
    }
  }
}