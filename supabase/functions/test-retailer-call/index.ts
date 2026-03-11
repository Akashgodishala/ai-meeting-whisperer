import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TEST-RETAILER-CALL] ${step}${detailsStr}`);
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
    logStep("=== RETAILER CALL TEST STARTED ===");
    
    const { customer_phone, customer_name } = await req.json();
    
    if (!customer_phone) {
      throw new Error("customer_phone is required");
    }

    // Get retailer-specific VAPI credentials
    const retailerVapiPhone = Deno.env.get("RETAILER_VAPI_PHONE_NUMBER");
    const retailerAssistantId = Deno.env.get("RETAILER_VAPI_ASSISTANT_ID");
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");

    if (!retailerVapiPhone || !retailerAssistantId || !vapiApiKey) {
      throw new Error("Missing retailer VAPI credentials");
    }

    logStep("Using retailer VAPI credentials", {
      phone: retailerVapiPhone,
      assistant: retailerAssistantId
    });

    // Format phone number to E.164 format
    let formattedPhone = customer_phone;
    if (!formattedPhone.startsWith('+')) {
      // Assume US number if no country code
      formattedPhone = '+1' + formattedPhone.replace(/\D/g, '');
    }

    // Initiate call using retailer-specific VAPI setup
    const callPayload = {
      phoneNumberId: retailerVapiPhone, // This should be the UUID from VAPI dashboard
      assistantId: retailerAssistantId,
      customer: {
        number: formattedPhone, // E.164 format required
        name: customer_name || "Test Customer"
      }
    };

    logStep("Initiating call with VAPI", callPayload);

    const callResponse = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callPayload),
    });

    if (!callResponse.ok) {
      const error = await callResponse.json();
      logStep("VAPI call failed", { error, status: callResponse.status });
      throw new Error(`VAPI call failed: ${JSON.stringify(error)}`);
    }

    const callData = await callResponse.json();
    logStep("Call initiated successfully", { callId: callData.id });

    // Also test the order creation flow directly
    logStep("Testing order creation flow");
    
    const { data: retailer } = await supabaseClient
      .from("retailer_profiles")
      .select("*")
      .eq("business_name", "Ford liquor Company")
      .single();

    if (retailer) {
      const orderResponse = await supabaseClient.functions.invoke('retailer-order-agent', {
        body: {
          message: "Hi Alex, I'd like to order 2 bottles of Grey Goose Vodka. Yes I'm over 21. I confirm my order and I'm ready to pay.",
          retailer_id: retailer.id,
          customer_phone: customer_phone,
          customer_name: customer_name || "Test Customer",
          call_session_id: callData.id
        }
      });

      logStep("Order creation test", { 
        success: !orderResponse.error,
        action: orderResponse.data?.action 
      });

      return new Response(JSON.stringify({
        success: true,
        call_initiated: true,
        call_id: callData.id,
        customer_phone: customer_phone,
        retailer_assistant: retailerAssistantId,
        order_test: {
          success: !orderResponse.error,
          action: orderResponse.data?.action,
          payment_link: orderResponse.data?.action_result?.payment_link
        },
        message: "📞 Call initiated! Check your phone and you should receive an SMS with payment link after the call."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      call_initiated: true,
      call_id: callData.id,
      customer_phone: customer_phone,
      retailer_assistant: retailerAssistantId,
      message: "📞 Call initiated! Check your phone."
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