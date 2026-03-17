import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIGURE-RETAILER-VAPI] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("=== RETAILER VAPI CONFIGURATION ===");
    
    const { action } = await req.json();
    
    // Get retailer-specific VAPI credentials
    const retailerVapiPhone = Deno.env.get("RETAILER_VAPI_PHONE_NUMBER");
    const retailerAssistantId = Deno.env.get("RETAILER_VAPI_ASSISTANT_ID");
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    
    logStep("Checking retailer VAPI credentials", {
      phone: retailerVapiPhone ? "SET" : "MISSING",
      assistant: retailerAssistantId ? "SET" : "MISSING",
      apiKey: vapiApiKey ? "SET" : "MISSING"
    });

    if (!retailerVapiPhone || !retailerAssistantId || !vapiApiKey) {
      throw new Error("Missing retailer VAPI credentials. Please set RETAILER_VAPI_PHONE_NUMBER, RETAILER_VAPI_ASSISTANT_ID, and VAPI_API_KEY");
    }

    if (action === "configure_webhook") {
      // Configure the webhook URL for the retailer assistant
      const webhookUrl = "https://scagutbejvgicmllzqge.supabase.co/functions/v1/vapi-liquor-webhook";
      
      logStep("Configuring webhook for retailer assistant", {
        assistantId: retailerAssistantId,
        webhookUrl
      });

      // Update the assistant with the correct webhook URL
      const assistantResponse = await fetch(`https://api.vapi.ai/assistants/${retailerAssistantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverUrl: webhookUrl,
          serverUrlSecret: Deno.env.get("VAPI_WEBHOOK_SECRET")
        })
      });

      if (!assistantResponse.ok) {
        const error = await assistantResponse.json();
        throw new Error(`Failed to configure assistant: ${JSON.stringify(error)}`);
      }

      logStep("Assistant webhook configured successfully");

      return new Response(JSON.stringify({
        success: true,
        webhook_configured: true,
        webhook_url: webhookUrl,
        assistant_id: retailerAssistantId,
        phone_number: retailerVapiPhone
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Ford Liquor Company retailer info
    const { data: retailer, error: retailerError } = await supabaseClient
      .from("retailer_profiles")
      .select("*")
      .eq("business_name", "Ford liquor Company")
      .single();

    if (retailerError || !retailer) {
      throw new Error("Ford Liquor Company not found in database");
    }

    logStep("Found retailer", { retailer_id: retailer.id, business_name: retailer.business_name });

    return new Response(JSON.stringify({
      success: true,
      retailer_found: true,
      credentials_status: {
        vapi_phone: retailerVapiPhone ? "SET" : "MISSING",
        vapi_assistant: retailerAssistantId ? "SET" : "MISSING",
        vapi_api_key: vapiApiKey ? "SET" : "MISSING"
      },
      retailer_info: {
        id: retailer.id,
        name: retailer.business_name,
        phone: retailer.phone
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});