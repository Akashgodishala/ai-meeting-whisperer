import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export interface SMSCredentials {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface VAPICredentials {
  apiKey: string;
  assistantId: string;
  phoneNumberId: string;
  customMessage: string;
}

const VAPI_STORAGE_KEY = "voxorbit_vapi_credentials";
const SMS_STORAGE_KEY = "voxorbit_sms_credentials";

const DEFAULT_VAPI_MESSAGE =
  "Hello! This is your AI assistant calling on behalf of {businessName}. How can I help you today?";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Failed to save credentials:", err);
  }
}

/**
 * Unified credential management – persisted in localStorage.
 * Edge functions read from Supabase Secrets (set in the Supabase dashboard).
 * The local copy is used to gate UI buttons so the user knows setup is complete.
 */
export const useCredentials = () => {
  const [smsCredentials, setSmsCredentials] = useState<SMSCredentials>(() =>
    loadFromStorage<SMSCredentials>(SMS_STORAGE_KEY, {
      accountSid: "",
      authToken: "",
      fromNumber: "",
    })
  );

  const [vapiCredentials, setVapiCredentials] = useState<VAPICredentials>(() =>
    loadFromStorage<VAPICredentials>(VAPI_STORAGE_KEY, {
      apiKey: "",
      assistantId: "",
      phoneNumberId: "",
      customMessage: DEFAULT_VAPI_MESSAGE,
    })
  );

  const [isLoading, setIsLoading] = useState(false);

  // Persist VAPI credentials to localStorage on every change
  useEffect(() => {
    saveToStorage(VAPI_STORAGE_KEY, vapiCredentials);
  }, [vapiCredentials]);

  // Persist SMS credentials to localStorage on every change
  useEffect(() => {
    saveToStorage(SMS_STORAGE_KEY, smsCredentials);
  }, [smsCredentials]);

  const saveSMSCredentials = async () => {
    if (!smsCredentials.accountSid || !smsCredentials.authToken || !smsCredentials.fromNumber) {
      toast({
        title: "Missing Fields",
        description: "Please fill in Account SID, Auth Token, and From Number",
        variant: "destructive",
      });
      return false;
    }
    saveToStorage(SMS_STORAGE_KEY, smsCredentials);
    toast({
      title: "SMS Credentials Saved ✓",
      description:
        "Saved locally. Also set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER as Supabase Secrets for edge functions.",
    });
    return true;
  };

  const saveVAPICredentials = async () => {
    if (!vapiCredentials.apiKey || !vapiCredentials.assistantId || !vapiCredentials.phoneNumberId) {
      toast({
        title: "Missing Fields",
        description: "Please fill in VAPI API Key, Assistant ID, and Phone Number ID",
        variant: "destructive",
      });
      return false;
    }
    saveToStorage(VAPI_STORAGE_KEY, vapiCredentials);
    toast({
      title: "VAPI Credentials Saved ✓",
      description:
        "Saved locally. Also set VAPI_API_KEY, VAPI_ASSISTANT_ID and VAPI_PHONE_NUMBER_ID as Supabase Secrets for edge functions.",
    });
    return true;
  };

  const resetVAPIMessage = () => {
    setVapiCredentials((prev) => ({ ...prev, customMessage: DEFAULT_VAPI_MESSAGE }));
    toast({ title: "Message Reset", description: "Custom message reset to default" });
  };

  const clearAllCredentials = () => {
    const emptySMS: SMSCredentials = { accountSid: "", authToken: "", fromNumber: "" };
    const emptyVAPI: VAPICredentials = {
      apiKey: "",
      assistantId: "",
      phoneNumberId: "",
      customMessage: DEFAULT_VAPI_MESSAGE,
    };
    setSmsCredentials(emptySMS);
    setVapiCredentials(emptyVAPI);
    localStorage.removeItem(SMS_STORAGE_KEY);
    localStorage.removeItem(VAPI_STORAGE_KEY);
    toast({ title: "Credentials Cleared", description: "All credentials have been removed" });
  };

  const hasSMSCredentials = Boolean(
    smsCredentials.accountSid && smsCredentials.authToken && smsCredentials.fromNumber
  );

  const hasVAPICredentials = Boolean(
    vapiCredentials.apiKey && vapiCredentials.assistantId && vapiCredentials.phoneNumberId
  );

  return {
    smsCredentials,
    setSmsCredentials,
    saveSMSCredentials,
    hasSMSCredentials,
    vapiCredentials,
    setVapiCredentials,
    saveVAPICredentials,
    hasVAPICredentials,
    resetVAPIMessage,
    isLoading,
    clearAllCredentials,
  };
};
