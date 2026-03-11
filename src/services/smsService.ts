// DEPRECATED: Use UnifiedSMSService instead
// This file is kept for backwards compatibility only
import { UnifiedSMSService } from "./unifiedSMSService";
import { SMSCredentials } from "@/hooks/useCredentials";

export type { SMSCredentials };

export class SMSService {
  private unifiedService: UnifiedSMSService;

  constructor(credentials: SMSCredentials) {
    this.unifiedService = new UnifiedSMSService(credentials);
  }

  async sendFailedCallSMS(customerName: string, customerPhone: string, customMessage: string): Promise<boolean> {
    return this.unifiedService.sendFailedCallSMS(customerName, customerPhone, customMessage);
  }
}