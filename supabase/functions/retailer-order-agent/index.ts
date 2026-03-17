import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import OpenAI from "https://esm.sh/openai@4.20.1";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
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
        const estimatedTime = '15-20 minutes';

        // Determine order type from message content
        if (message.toLowerCase().includes('delivery') ||
            message.toLowerCase().includes('deliver') ||
            orderDetails.toLowerCase().includes('delivery') ||
            orderDetails.toLowerCase().includes('deliver')) {
          orderType = 'delivery';

          // Try to extract address from message
          const addressMatch = message.match(/(?:address|to|deliver to)\s*[:-]?\s*([^,.]+(?:,[^,.]+)*)/i);
          if (addressMatch) {
            deliveryAddress = addressMatch[1].trim();
          }
        }

        // Match mentioned items against inventory; fall back to generic order item
        let itemsTotal = 0;
        const itemsList: { name: string; details: string; price: number; quantity: number }[] = [];

        if (inventory && inventory.length > 0) {
          for (const item of inventory) {
            const itemName = (item.name as string).toLowerCase();
            if (orderDetails.toLowerCase().includes(itemName) || message.toLowerCase().includes(itemName)) {
              itemsList.push({ name: item.name as string, details: (item.size as string) || '', price: item.price as number, quantity: 1 });
              itemsTotal += (item.price as number);
            }
          }
        }

        if (itemsList.length === 0) {
          itemsTotal = 25.00;
          itemsList.push({ name: "Customer order (via call)", details: orderDetails.substring(0, 200), price: 25.00, quantity: 1 });
        }

        const serviceFee = orderType === 'delivery' ? 3.00 : 0;
        const driverTip = orderType === 'delivery' ? 5.00 : 0;
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
          status: 'confirmed',
          call_session_id,
          delivery_address: deliveryAddress,
          notes: `Order placed via AI voice call. Details: ${orderDetails.substring(0, 300)}`,
          payment_status: 'pending'
        };

        const { data: order, error: orderError } = await supabaseClient
          .from("retailer_orders")
          .insert(orderData)
          .select()
          .single();

        if (!orderError && order) {
          // Use retailer's configured payment link from their profile (stored in the payment_link column)
          // Retailers set this in their dashboard under Settings > Payment Link
          const configuredPaymentLink: string | null =
            (retailer as any).payment_link
              ? String((retailer as any).payment_link).trim() || null
              : null;

          // Use retailer's configured link (if any) or a generic order confirmation URL as fallback
          const paymentLink = configuredPaymentLink
            || `https://voxorbit.app/pay?order=${order.id}&amount=${totalAmount.toFixed(2)}`;

          await supabaseClient
            .from("retailer_orders")
            .update({ payment_link_url: paymentLink })
            .eq("id", order.id);

          // ── SMS to CUSTOMER with payment link ──────────────────────────
          const itemNames = itemsList.map(i => i.name).join(', ');
          const customerSms = orderType === 'delivery'
            ? `Hi ${customer_name || 'there'}! Your order from ${retailer.business_name} is confirmed. Items: ${itemNames}. Total: $${totalAmount.toFixed(2)} (incl. $${serviceFee.toFixed(2)} delivery fee). Estimated delivery: ${estimatedTime}. Pay here: ${paymentLink}`
            : `Hi ${customer_name || 'there'}! Your order from ${retailer.business_name} is confirmed. Items: ${itemNames}. Total: $${totalAmount.toFixed(2)}. Ready for pickup in ${estimatedTime}. Pay here: ${paymentLink}`;

          logStep("Sending customer SMS", { to: customer_phone });

          let customerSmsSent = false;
          try {
            const smsResp = await supabaseClient.functions.invoke('send-sms', {
              body: { to: customer_phone, message: customerSms, customerName: customer_name }
            });
            if (!smsResp.error) {
              customerSmsSent = true;
              logStep("Customer SMS sent successfully");
            } else {
              // Fallback: direct Twilio API
              const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
              const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
              const fromNumber = Deno.env.get("TWILIO_FROM_NUMBER");

              if (!accountSid || !authToken || !fromNumber) {
                // Avoid making malformed Twilio requests when credentials are missing
                logStep("Customer SMS Twilio fallback not configured", {
                  hasAccountSid: !!accountSid,
                  hasAuthToken: !!authToken,
                  hasFromNumber: !!fromNumber,
                });
              } else {
                const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
                const formData = new URLSearchParams();
                formData.append('To', customer_phone);
                formData.append('From', fromNumber);
                formData.append('Body', customerSms);

                const twilioResp = await fetch(twilioUrl, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: formData,
                });

                if (twilioResp.ok) {
                  customerSmsSent = true;
                  logStep("Customer SMS sent via direct Twilio");
                } else {
                  logStep("Customer SMS Twilio fallback failed", {
                    status: twilioResp.status,
                    statusText: twilioResp.statusText,
                  });
                }
              }
            }
          } catch (smsErr) {
            logStep("Customer SMS failed", { error: smsErr });
          }

          // ── SMS NOTIFICATION to RETAILER ──────────────────────────────
          const retailerPhone = retailer.phone;
          if (retailerPhone) {
            const retailerSms = `NEW ORDER from ${retailer.business_name}!\nCustomer: ${customer_name || 'Unknown'} (${customer_phone})\nItems: ${itemNames}\nTotal: $${totalAmount.toFixed(2)}\nType: ${orderType.toUpperCase()}${deliveryAddress ? `\nDeliver to: ${deliveryAddress}` : ''}\nReady in: ${estimatedTime}`;
            try {
              await supabaseClient.functions.invoke('send-sms', {
                body: { to: retailerPhone, message: retailerSms, customerName: 'VoxOrbit Alert' }
              });
              logStep("Retailer notified via SMS", { retailerPhone });
            } catch (e) {
              logStep("Retailer SMS failed", { error: e });
            }
          }

          actionResult = {
            action: "order_created",
            order_id: order.id,
            payment_link: paymentLink,
            total: totalAmount,
            order_type: orderType,
            estimated_time: estimatedTime,
            items: itemsList,
            customer_sms_sent: customerSmsSent
          };

          logStep("Order created successfully", { orderId: order.id, paymentLink, total: totalAmount });
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