export interface VAPICredentials {
  apiKey: string;
  assistantId: string;
  phoneNumberId: string;
  customMessage: string;
}

export interface VAPICallData {
  id: string;
  status: string;
  transcript?: Record<string, unknown>[];
  messages?: Record<string, unknown>[];
}

export interface CustomerResponse {
  response: 'attending' | 'not_attending' | 'no_response';
  dtmf?: string;
}