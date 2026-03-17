import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VAPI-LIQUOR-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("VAPI webhook received");
    
    // Verify webhook secret token for security
    const webhookSecret = Deno.env.get("VAPI_WEBHOOK_SECRET");
    const providedSecret = req.headers.get("x-vapi-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    
    if (webhookSecret && providedSecret !== webhookSecret) {
      logStep("Unauthorized webhook request - invalid secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }
    
    const webhookData = await req.json();
    logStep("Webhook data received", webhookData);

    const { type, call, message } = webhookData;
    
    // Extract and log call information
    const customerPhone = call?.customer?.number || 'unknown';
    const customerName = call?.customer?.name || 'Unknown';
    const callId = call?.id || 'unknown';
    
    logStep("=== PHONE NUMBER FLOW DEBUG ===", {
      customer_phone: customerPhone,
      customer_name: customerName,
      call_id: callId,
      webhook_type: type,
      message: message
    });

        // Handle different webhook types
    switch (type) {
      case 'function-call':
      case 'transcript':
      case 'call-update': {
        logStep("Processing function call/transcript", { message, type });

        // Extract call information
        const messageText = message || '';

        // Check for order triggers in message and call transcript
        const orderTriggers = [
          'PAYMENT_READY', 'ORDER_CONFIRMED', 'order', 'payment', 'total',
          'confirm', 'checkout', 'ready to pay', 'complete my order',
          'finish my order', 'place order', 'process payment'
        ];

        const shouldProcessOrder = orderTriggers.some(trigger =>
          messageText.toLowerCase().includes(trigger.toLowerCase())
        ) || call?.transcript?.some((t: Record<string, unknown>) =>
          orderTriggers.some(trigger =>
            (t.text as string)?.toLowerCase().includes(trigger.toLowerCase())
          )
        );

        // For liquor store orders, we need to process through retailer-order-agent
        if (shouldProcessOrder) {
          logStep("Processing liquor order");
          
          // Get the actual retailer profile (Ford Liquor Company)
          const { data: retailer, error: retailerError } = await supabaseClient
            .from("retailer_profiles")
            .select("*")
            .eq("business_name", "Ford liquor Company")
            .single();

          if (retailerError || !retailer) {
            logStep("No Ford Liquor Company found, using first available retailer");
            // Fallback to any retailer if Ford Liquor Company not found
            const { data: fallbackRetailer } = await supabaseClient
              .from("retailer_profiles")
              .select("*")
              .limit(1)
              .single();
            
            if (!fallbackRetailer) {
              throw new Error("No retailer profiles found in database");
            }
            
            retailer = fallbackRetailer;
          }

          // Call the retailer-order-agent to process the order
          logStep("Calling retailer-order-agent with data", {
            retailer_id: retailer.id,
            customer_phone: customerPhone,
            customer_name: customerName,
            message: message
          });
          
          const orderResponse = await supabaseClient.functions.invoke('retailer-order-agent', {
            body: {
              message: message,
              retailer_id: retailer.id,
              customer_phone: customerPhone,
              customer_name: customerName,
              call_session_id: callId
            }
          });

          logStep("Order processing result", orderResponse);

          if (orderResponse.data?.action === 'order_created') {
            // Send payment link via SMS or return it to VAPI
            const paymentMessage = `Thank you for your order! Your total is $${orderResponse.data.action_result.total}. Complete payment here: ${orderResponse.data.action_result.payment_link}`;
            
            return new Response(JSON.stringify({
              success: true,
              message: paymentMessage,
              order_id: orderResponse.data.action_result.order_id
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
        }
        break;
      }

      case 'call-ended':
        logStep("Call ended", { callId: call?.id });
        
        // Update call session
        await supabaseClient
          .from("call_sessions")
          .upsert({
            call_id: call?.id,
            status: 'completed',
            customer_phone: call?.customer?.number || 'unknown',
            customer_name: call?.customer?.name || 'Unknown',
            transcript: call?.transcript || null,
            recording_url: call?.recordingUrl || null,
            end_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'call_id'
          });
        break;

      case 'call-started':
        logStep("Call started", { callId: call?.id });
        
        // Create call session
        await supabaseClient
          .from("call_sessions")
          .upsert({
            call_id: call?.id,
            status: 'in_progress',
            customer_phone: call?.customer?.number || 'unknown',
            customer_name: call?.customer?.name || 'Unknown',
            start_time: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'call_id'
          });
        break;

      default:
        logStep("Unhandled webhook type", { type });
        break;
    }

    return new Response(JSON.stringify({
      success: true,
      processed: true,
      type: type
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});