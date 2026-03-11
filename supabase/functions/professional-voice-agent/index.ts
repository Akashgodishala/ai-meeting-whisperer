import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROFESSIONAL-VOICE-AGENT] ${step}${detailsStr}`);
};

// Multi-language support
const LANGUAGES = {
  'en': 'English',
  'es': 'Spanish', 
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'zh': 'Chinese'
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
    logStep("Professional Voice Agent Started");
    
    const { 
      message, 
      retailer_id, 
      customer_phone, 
      customer_name, 
      call_session_id,
      language = 'en',
      context = {}
    } = await req.json();

    logStep("Received request", { retailer_id, customer_phone, language });

    // Get retailer profile with compliance settings
    const { data: retailer, error: retailerError } = await supabase
      .from("retailer_profiles")
      .select(`
        *,
        service_owners (
          company_name,
          subscription_tier
        )
      `)
      .eq("id", retailer_id)
      .single();

    if (retailerError || !retailer) {
      throw new Error("Retailer not found");
    }

    // Get retailer inventory with enhanced data
    const { data: inventory, error: inventoryError } = await supabase
      .from("retailer_inventory")
      .select("*")
      .eq("retailer_id", retailer_id)
      .eq("available", true);

    if (inventoryError) {
      throw new Error("Failed to fetch inventory");
    }

    // Detect language and set appropriate responses
    const isLiquorStore = retailer.business_type.toLowerCase().includes('liquor');
    const requiresAgeVerification = isLiquorStore;

    // Enhanced inventory context for AI
    const inventoryText = inventory?.map(item => 
      `${item.name}${item.size ? ` (${item.size})` : ''} - $${item.price} (Stock: ${item.stock})${item.category ? ` Category: ${item.category}` : ''}`
    ).join('\n') || 'No inventory available';

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    // Enhanced system prompt with compliance and multi-language support
    const systemPrompt = `You are a professional AI assistant for ${retailer.business_name}, a ${retailer.business_type}.

LANGUAGE: Respond in ${LANGUAGES[language] || 'English'}

CURRENT INVENTORY:
${inventoryText}

BUSINESS RULES:
1. ALWAYS ask if order is for pickup or delivery
2. For pickup: collect items and calculate total
3. For delivery: add $3 service fee + ask for $5-15 driver tip
4. ${requiresAgeVerification ? 'LIQUOR COMPLIANCE: For any alcohol purchase, inform customer that age verification is required (21+)' : ''}
5. If customer wants unavailable items, suggest alternatives
6. Be professional, friendly, and efficient

PRICING STRUCTURE:
- Pickup: item prices only
- Delivery: item prices + $3 service fee + driver tip ($5-15)
- ${requiresAgeVerification ? 'Alcohol: Age verification required before processing payment' : ''}

ERROR HANDLING:
- If you cannot help with a request, say "Let me transfer you to our store representative"
- If customer seems confused, offer to repeat information slowly
- If inventory is unclear, ask customer to be more specific

RESPONSE PROTOCOLS:
- Order confirmed: "ORDER_CONFIRMED: [details]"
- Need human help: "TRANSFER_TO_HUMAN: [reason]"
- Age verification needed: "AGE_VERIFICATION_REQUIRED"
- Payment ready: "PROCESS_PAYMENT: [amount]"

Respond professionally in ${LANGUAGES[language] || 'English'} and help complete this transaction efficiently.`;

    logStep("Calling OpenAI with enhanced prompt");

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I didn't understand that.";
    logStep("AI Response generated", { response: aiResponse.substring(0, 100) + "..." });

    let actionResult = null;
    let callOutcome = 'continue';

    // Enhanced action detection and processing
    if (aiResponse.includes("TRANSFER_TO_HUMAN:")) {
      callOutcome = 'human_fallback';
      const reason = aiResponse.split("TRANSFER_TO_HUMAN:")[1]?.trim() || "Customer request";
      
      // Log analytics
      await supabase
        .from("service_analytics")
        .insert({
          store_id: retailer_id,
          call_session_id,
          call_outcome: 'human_fallback',
          failure_reason: reason,
          transaction_completed: false
        });

      actionResult = {
        action: "transfer_to_human",
        reason: reason
      };

    } else if (aiResponse.includes("ORDER_CONFIRMED:")) {
      logStep("Order confirmed, processing...");
      
      const orderMatch = aiResponse.match(/ORDER_CONFIRMED:\s*(.+)/);
      if (orderMatch) {
        const orderDetails = orderMatch[1];
        const isDelivery = message.toLowerCase().includes('delivery');
        
        // Calculate pricing
        let subtotal = 45.00; // Placeholder - should calculate from actual items
        const serviceFee = isDelivery ? 3.00 : 0;
        const driverTip = isDelivery ? 8.00 : 0; // Default tip
        const totalAmount = subtotal + serviceFee + driverTip;

        // Create order record
        const orderData = {
          retailer_id,
          customer_name,
          customer_phone,
          order_type: isDelivery ? 'delivery' : 'pickup',
          items: [{ name: "Order from voice call", details: orderDetails }],
          subtotal,
          service_fee: serviceFee,
          driver_tip: driverTip,
          total_amount: totalAmount,
          status: requiresAgeVerification ? 'pending_verification' : 'pending_payment',
          call_session_id,
        };

        const { data: order, error: orderError } = await supabase
          .from("retailer_orders")
          .insert(orderData)
          .select()
          .single();

        if (!orderError && order) {
          callOutcome = requiresAgeVerification ? 'age_verification_required' : 'payment_ready';
          
          // Log successful AI interaction
          await supabase
            .from("service_analytics")
            .insert({
              store_id: retailer_id,
              call_session_id,
              call_outcome: 'ai_success',
              transaction_completed: !requiresAgeVerification,
              payment_processed: false
            });

          actionResult = {
            action: requiresAgeVerification ? "age_verification_required" : "process_payment",
            order_id: order.id,
            total: totalAmount,
            requires_age_verification: requiresAgeVerification,
            order_type: isDelivery ? 'delivery' : 'pickup'
          };

          logStep("Order created successfully", { orderId: order.id, requiresAgeVerification });
        }
      }

    } else if (aiResponse.includes("AGE_VERIFICATION_REQUIRED")) {
      callOutcome = 'age_verification_required';
      actionResult = {
        action: "age_verification_required",
        message: "Age verification required for alcohol purchase"
      };

    } else if (aiResponse.includes("PROCESS_PAYMENT:")) {
      const amountMatch = aiResponse.match(/PROCESS_PAYMENT:\s*\$?(\d+\.?\d*)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      
      callOutcome = 'payment_ready';
      actionResult = {
        action: "process_payment",
        amount: amount
      };
    }

    // Enhanced response with compliance information
    let enhancedResponse = aiResponse;
    if (requiresAgeVerification && (message.toLowerCase().includes('alcohol') || message.toLowerCase().includes('liquor'))) {
      enhancedResponse += "\n\nPlease note: Age verification (21+) will be required before payment processing for alcohol purchases.";
    }

    logStep("Response processing complete", { callOutcome, actionType: actionResult?.action });

    return new Response(JSON.stringify({
      reply: enhancedResponse,
      action: callOutcome,
      action_result: actionResult,
      language: language,
      requires_compliance: requiresAgeVerification,
      business_info: {
        name: retailer.business_name,
        type: retailer.business_type,
        subscription_tier: retailer.service_owners?.subscription_tier
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    // Log failed interaction
    try {
      await supabase
        .from("service_analytics")
        .insert({
          store_id: req.body?.retailer_id,
          call_session_id: req.body?.call_session_id,
          call_outcome: 'failed',
          failure_reason: errorMessage,
          transaction_completed: false
        });
    } catch (logError) {
      console.error("Failed to log error analytics:", logError);
    }

    return new Response(JSON.stringify({ 
      error: errorMessage,
      action: "transfer_to_human",
      action_result: {
        action: "transfer_to_human",
        reason: "Technical error occurred"
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});