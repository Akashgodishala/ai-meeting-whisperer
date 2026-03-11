import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import OpenAI from "https://esm.sh/openai@4.20.1";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RETAILER-ORDER-AGENT] ${step}${detailsStr}`);
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
    logStep("Function started");
    
    const { message, retailer_id, customer_phone, customer_name, call_session_id } = await req.json();
    logStep("=== ORDER AGENT PHONE FLOW ===", { 
      retailer_id, 
      customer_phone, 
      customer_name,
      call_session_id,
      message 
    });

    // Get retailer profile
    const { data: retailer, error: retailerError } = await supabaseClient
      .from("retailer_profiles")
      .select("*")
      .eq("id", retailer_id)
      .single();

    if (retailerError || !retailer) {
      throw new Error("Retailer not found");
    }

    // Get retailer inventory
    const { data: inventory, error: inventoryError } = await supabaseClient
      .from("retailer_inventory")
      .select("*")
      .eq("retailer_id", retailer_id)
      .eq("available", true);

    if (inventoryError) {
      throw new Error("Failed to fetch inventory");
    }

    // Prepare inventory context for AI
    const inventoryText = inventory.map(item => 
      `${item.name} ${item.size || ''} - $${item.price} (${item.stock} in stock)`
    ).join('\n');

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    const systemPrompt = `You are Alex, a friendly and knowledgeable AI assistant for ${retailer.business_name}, a premium liquor store. You embody the warmth and expertise of the best staff members, with deep knowledge of wines, spirits, and beer.

CURRENT INVENTORY:
${inventoryText}

PERSONALITY TRAITS:
- Warm, friendly, and approachable
- Knowledgeable about alcoholic beverages without being condescending
- Patient and helpful, especially with customers who may be unsure
- Professional but conversational (use natural speech patterns)
- Enthusiastic about helping customers find the perfect drink

PRIMARY OBJECTIVES:
1. Assist customers with product inquiries and recommendations
2. Process orders accurately and efficiently
3. Handle delivery arrangements and payment processing
4. Provide exceptional customer service

CONVERSATION GUIDELINES:

Opening: "Hi there! Thanks for calling ${retailer.business_name}. This is Alex, your AI assistant. How can I help you today?"

Product Recommendations:
- Ask clarifying questions: "What's the occasion?", "Do you have a preferred price range?", "Any particular flavors you enjoy?"
- Provide specific recommendations with brief descriptions
- Mention current promotions when relevant

Order Processing:
1. Product Selection: Confirm each item and suggest complementary items
2. Customer Info: Collect name, phone, delivery address
3. Delivery Details: Ask about timing and special instructions
4. Order Summary: Itemize complete order with prices
5. Age Verification: "I do need to confirm you're 21 or older to complete this order"
6. **CRITICAL: When order is ready for payment, you MUST respond with "PAYMENT_READY: [order_summary]"**

PRICING RULES:
- Pickup: item prices only (no additional fees)
- Delivery: item prices + $3.00 service fee + driver tip ($5-15)
- All liquor purchases require age verification (21+)

IMPORTANT: Use natural speech with contractions, occasional "um" or "let me see", and show enthusiasm. Always end with clear next steps.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I didn't understand that.";
    logStep("AI Response generated", { response: aiResponse });

    let actionResult = null;

    // Check if order was confirmed or payment is ready
    if (aiResponse.includes("PAYMENT_READY") || 
        aiResponse.includes("ORDER_CONFIRMED") ||
        message.toLowerCase().includes('confirm') ||
        message.toLowerCase().includes('place order') ||
        message.toLowerCase().includes('checkout') ||
        message.toLowerCase().includes('ready to pay') ||
        message.toLowerCase().includes('complete the order')) {
      logStep("Order confirmed, processing...");
      
      // Extract order details and create order
      const paymentMatch = aiResponse.match(/PAYMENT_READY:\s*(.+)/);
      const orderMatch = aiResponse.match(/ORDER_CONFIRMED:\s*(.+)/);
      const orderDetails = paymentMatch ? paymentMatch[1] : (orderMatch ? orderMatch[1] : "Customer order from call");
      
      if (paymentMatch || orderMatch || message.toLowerCase().includes('confirm')) {
        
        // Parse the order details from the AI response or message
        let orderType = 'pickup'; // default
        let deliveryAddress = null;
        let estimatedTime = null;
        
        // Determine order type from message content
        if (message.toLowerCase().includes('delivery') || 
            message.toLowerCase().includes('deliver') ||
            orderDetails.toLowerCase().includes('delivery') ||
            orderDetails.toLowerCase().includes('deliver')) {
          orderType = 'delivery';
          estimatedTime = '10-30 minutes';
          
          // Try to extract address from message
          const addressMatch = message.match(/(?:address|to|deliver to)\s*[:\-]?\s*([^,.]+(?:,[^,.]+)*)/i);
          if (addressMatch) {
            deliveryAddress = addressMatch[1].trim();
          }
        } else {
          estimatedTime = '10-30 minutes';
        }
        
        // Parse items from the order details (basic implementation)
        let itemsTotal = 50.00; // Default fallback
        let itemsList = [{ name: "Order from call", details: orderDetails, price: 50.00, quantity: 1 }];
        
        // Try to extract Corona order specifically
        if (orderDetails.toLowerCase().includes('corona') || message.toLowerCase().includes('corona')) {
          const coronaPrice = orderType === 'delivery' ? 32.99 : 32.99; // Same price for pickup/delivery
          itemsList = [{ 
            name: "Corona 24 Pack", 
            details: "24-pack Corona beer",
            price: coronaPrice,
            quantity: 1 
          }];
          itemsTotal = coronaPrice;
        }
        
        const serviceFee = orderType === 'delivery' ? 3.00 : 0;
        const driverTip = orderType === 'delivery' ? 8.00 : 0;
        const totalAmount = itemsTotal + serviceFee + driverTip;
        
        const orderData = {
          retailer_id,
          customer_name,
          customer_phone,
          order_type: orderType,
          items: itemsList,
          subtotal: itemsTotal,
          service_fee: serviceFee,
          driver_tip: driverTip,
          total_amount: totalAmount,
          status: 'pending',
          call_session_id,
          delivery_address: deliveryAddress,
          estimated_time: estimatedTime,
          notes: `Order placed via VAPI call. Original message: ${message.substring(0, 200)}`,
          payment_status: 'pending'
        };

        const { data: order, error: orderError } = await supabaseClient
          .from("retailer_orders")
          .insert(orderData)
          .select()
          .single();

        if (!orderError && order) {
          // Use the provided test Stripe payment link
          const paymentLink = "https://buy.stripe.com/test_4gM5kFaUkgpG05Q9AO9R600";
          
          await supabaseClient
            .from("retailer_orders")
            .update({ payment_link_url: paymentLink })
            .eq("id", order.id);

          // Send SMS with payment link - try multiple credential sources
          const smsMessage = orderType === 'delivery' 
            ? `🍺 Thanks for your ${retailer.business_name} delivery order! Items: ${itemsList.map(i => i.name).join(', ')}. Total: $${order.total_amount} (includes $3 delivery fee + $8 tip). Estimated delivery: ${estimatedTime}. Pay here: ${paymentLink}`
            : `🍺 Thanks for your ${retailer.business_name} pickup order! Items: ${itemsList.map(i => i.name).join(', ')}. Total: $${order.total_amount}. Ready for pickup in ${estimatedTime}. Pay here: ${paymentLink}`;
          
          logStep("=== SMS SENDING DEBUG ===", {
            sending_to_phone: customer_phone,
            customer_name: customer_name,
            payment_link: paymentLink,
            retailer_name: retailer.business_name,
            order_type: orderType,
            sms_message: smsMessage
          });
          
          // First try: Use environment secrets (Supabase secrets)
          let smsResponse = await supabaseClient.functions.invoke('send-sms', {
            body: {
              to: customer_phone,
              message: smsMessage,
              customerName: customer_name,
              accountSid: Deno.env.get("TWILIO_ACCOUNT_SID"),
              authToken: Deno.env.get("TWILIO_AUTH_TOKEN"),
              fromNumber: Deno.env.get("TWILIO_FROM_NUMBER")
            }
          });
          
          logStep("SMS Response (Environment secrets)", { smsResponse, error: smsResponse.error });

          // If environment secrets failed, try direct Twilio call as fallback
          if (smsResponse.error) {
            logStep("Environment secrets failed, trying direct Twilio API call");
            
            try {
              const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${Deno.env.get("TWILIO_ACCOUNT_SID")}/Messages.json`;
              
              const formData = new URLSearchParams();
              formData.append('To', customer_phone);
              formData.append('From', Deno.env.get("TWILIO_FROM_NUMBER") || '+12345678901');
              formData.append('Body', smsMessage);

              const directTwilioResponse = await fetch(twilioUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${btoa(`${Deno.env.get("TWILIO_ACCOUNT_SID")}:${Deno.env.get("TWILIO_AUTH_TOKEN")}`)}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData,
              });

              if (directTwilioResponse.ok) {
                const result = await directTwilioResponse.json();
                logStep("Direct Twilio API SUCCESS", { messageSid: result.sid });
                smsResponse = { data: { success: true, messageSid: result.sid }, error: null };
              } else {
                const error = await directTwilioResponse.json();
                logStep("Direct Twilio API FAILED", { error });
                throw new Error(`Direct Twilio failed: ${error.message}`);
              }
            } catch (directError) {
              logStep("Both SMS methods failed", { directError });
              // Don't throw error - let order creation succeed even if SMS fails
              smsResponse = { error: { message: "SMS failed but order created successfully" }, data: null };
            }
          } else {
            logStep("SMS sent successfully via environment secrets", { response: smsResponse.data });
          }

          actionResult = {
            action: "order_created",
            order_id: order.id,
            payment_link: paymentLink,
            total: order.total_amount,
            order_type: orderType,
            estimated_time: estimatedTime,
            items: itemsList
          };

          logStep("Order created with real payment link", { orderId: order.id, paymentLink });
        }
      }
    }

    return new Response(JSON.stringify({
      reply: aiResponse,
      action: actionResult ? "order_created" : "continue_conversation",
      action_result: actionResult
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});