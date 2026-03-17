import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANUAL-VOICE-TEST] ${step}${detailsStr}`);
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
    logStep("=== MANUAL VOICE TEST STARTED ===");
    
    const { customer_phone, customer_name } = await req.json();
    
    if (!customer_phone) {
      throw new Error("customer_phone is required");
    }

    // Get Ford Liquor Company retailer
    const { data: retailer, error: retailerError } = await supabaseClient
      .from("retailer_profiles")
      .select("*")
      .eq("business_name", "Ford liquor Company")
      .single();

    if (retailerError || !retailer) {
      throw new Error("Ford Liquor Company not found");
    }

    logStep("Found retailer", { retailer_id: retailer.id, business_name: retailer.business_name });

    // Test the complete flow by calling retailer-order-agent
    const testMessage = "Hi Alex, I'd like to order 2 bottles of Grey Goose Vodka. Yes I'm over 21. I confirm my order and I'm ready to pay.";
    
    logStep("Calling retailer-order-agent", {
      message: testMessage,
      retailer_id: retailer.id,
      customer_phone,
      customer_name: customer_name || "Test Customer"
    });

    const orderResponse = await supabaseClient.functions.invoke('retailer-order-agent', {
      body: {
        message: testMessage,
        retailer_id: retailer.id,
        customer_phone: customer_phone,
        customer_name: customer_name || "Test Customer",
        call_session_id: `test-call-${Date.now()}`
      }
    });

    logStep("Order response received", { 
      success: !orderResponse.error,
      data: orderResponse.data,
      error: orderResponse.error 
    });

    if (orderResponse.error) {
      throw new Error(`Order agent failed: ${orderResponse.error.message}`);
    }

    // Check if order was created successfully
    if (orderResponse.data?.action === 'order_created') {
      logStep("✅ SUCCESS: Order created with payment link!", {
        order_id: orderResponse.data.action_result?.order_id,
        payment_link: orderResponse.data.action_result?.payment_link,
        total: orderResponse.data.action_result?.total
      });

      return new Response(JSON.stringify({
        success: true,
        message: "✅ Complete flow test successful!",
        order_created: true,
        payment_link: orderResponse.data.action_result?.payment_link,
        ai_response: orderResponse.data?.reply,
        total: orderResponse.data.action_result?.total,
        order_id: orderResponse.data.action_result?.order_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        success: true,
        message: "❌ Order not triggered - AI response doesn't contain order confirmation",
        ai_response: orderResponse.data?.reply,
        action: orderResponse.data?.action,
        debug: "Try saying 'I confirm my order' or 'ready to pay'"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false,
      debug: "Manual voice test failed"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});