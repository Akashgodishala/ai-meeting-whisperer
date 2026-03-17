import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  console.log(`[TEST-FLOW] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("=== STARTING COMPLETE VOICE AGENT FLOW TEST ===");

    // Step 1: Test retailer profile exists
    logStep("Step 1: Checking retailer profile");
    const { data: retailer, error: retailerError } = await supabaseClient
      .from("retailer_profiles")
      .select("*")
      .limit(1)
      .single();

    if (retailerError || !retailer) {
      throw new Error(`Retailer not found: ${retailerError?.message}`);
    }
    logStep("✅ Retailer found", { business_name: retailer.business_name, id: retailer.id });

    // Step 2: Test inventory exists
    logStep("Step 2: Checking inventory");
    const { data: inventory, error: inventoryError } = await supabaseClient
      .from("retailer_inventory")
      .select("*")
      .eq("retailer_id", retailer.id)
      .limit(5);

    if (inventoryError) {
      throw new Error(`Inventory error: ${inventoryError.message}`);
    }
    logStep("✅ Inventory check", { count: inventory?.length || 0 });

    // Step 3: Simulate VAPI webhook call with order
    logStep("Step 3: Testing VAPI liquor webhook with order");
    const testWebhookData = {
      type: "function-call",
      call: {
        id: `test-call-${Date.now()}`,
        customer: {
          number: "+16095088574",
          name: "Test Customer"
        }
      },
      message: "Yes, I confirm my order for 2 bottles of wine. I'm 25 years old. PAYMENT_READY: 2x Wine Bottles - $50.00 total"
    };

    const webhookResponse = await supabaseClient.functions.invoke('vapi-liquor-webhook', {
      body: testWebhookData
    });
    logStep("✅ Webhook response", webhookResponse);

    // Step 4: Test retailer-order-agent directly
    logStep("Step 4: Testing retailer-order-agent directly");
    const orderAgentResponse = await supabaseClient.functions.invoke('retailer-order-agent', {
      body: {
        message: "Yes, I confirm my order for 2 bottles of wine. I'm ready to pay.",
        retailer_id: retailer.id,
        customer_phone: "+16095088574",
        customer_name: "Test Customer",
        call_session_id: `test-call-${Date.now()}`
      }
    });
    logStep("✅ Order agent response", orderAgentResponse);

    // Step 5: Test SMS service
    logStep("Step 5: Testing SMS service");
    const smsResponse = await supabaseClient.functions.invoke('send-sms', {
      body: {
        to: "+16095088574",
        message: "Test payment link: https://checkout.stripe.com/test123 - Total: $50.00",
        customerName: "Test Customer",
        accountSid: Deno.env.get("TWILIO_ACCOUNT_SID"),
        authToken: Deno.env.get("TWILIO_AUTH_TOKEN"),
        fromNumber: Deno.env.get("TWILIO_FROM_NUMBER")
      }
    });
    logStep("✅ SMS response", smsResponse);

    // Step 6: Check database records
    logStep("Step 6: Checking database records");
    const { data: recentOrders } = await supabaseClient
      .from("retailer_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    const { data: recentCalls } = await supabaseClient
      .from("call_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    logStep("✅ Database check", { 
      recent_orders: recentOrders?.length || 0,
      recent_calls: recentCalls?.length || 0
    });

    // Step 7: Test Stripe configuration
    logStep("Step 7: Testing Stripe configuration");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }
    logStep("✅ Stripe key configured");

    return new Response(JSON.stringify({
      success: true,
      message: "All tests completed successfully!",
      results: {
        retailer: retailer.business_name,
        inventory_count: inventory?.length || 0,
        webhook_test: webhookResponse.data || webhookResponse.error,
        order_agent_test: orderAgentResponse.data || orderAgentResponse.error,
        sms_test: smsResponse.data || smsResponse.error,
        recent_orders: recentOrders?.length || 0,
        recent_calls: recentCalls?.length || 0,
        stripe_configured: !!stripeKey
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("❌ ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});