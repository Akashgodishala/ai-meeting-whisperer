import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-PAYMENT-PROCESSOR] ${step}${detailsStr}`);
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
    logStep("Payment processor started");
    
    const { 
      order_id, 
      customer_phone, 
      customer_email,
      age_verified = false,
      otp_verified = false 
    } = await req.json();

    if (!order_id) {
      throw new Error("Order ID is required");
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from("retailer_orders")
      .select(`
        *,
        retailer_profiles (
          business_name,
          business_type,
          phone
        )
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Check if age verification is required
    const isLiquorOrder = order.retailer_profiles?.business_type?.toLowerCase().includes('liquor');
    if (isLiquorOrder && !age_verified) {
      throw new Error("Age verification required for this order");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    logStep("Creating Stripe payment session", { orderId: order_id, amount: order.total_amount });

    // Check for existing customer
    let customerId;
    if (customer_email) {
      const customers = await stripe.customers.list({ 
        email: customer_email, 
        limit: 1 
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Create line items
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Order from ${order.retailer_profiles?.business_name}`,
            description: `${order.order_type === 'delivery' ? 'Delivery' : 'Pickup'} order for ${order.customer_name}`,
          },
          unit_amount: Math.round(order.subtotal * 100), // Convert to cents
        },
        quantity: 1,
      }
    ];

    // Add service fee if delivery
    if (order.service_fee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Delivery Service Fee",
          },
          unit_amount: Math.round(order.service_fee * 100),
        },
        quantity: 1,
      });
    }

    // Add driver tip if applicable
    if (order.driver_tip > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Driver Tip",
          },
          unit_amount: Math.round(order.driver_tip * 100),
        },
        quantity: 1,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customer_email || `customer-${order.customer_phone}@temp.com`,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}`,
      cancel_url: `${req.headers.get("origin")}/payment-cancelled?order_id=${order_id}`,
      metadata: {
        order_id: order_id,
        customer_phone: order.customer_phone,
        business_type: order.retailer_profiles?.business_type || '',
        age_verified: age_verified.toString(),
        otp_verified: otp_verified.toString()
      },
      payment_intent_data: {
        metadata: {
          order_id: order_id,
          customer_phone: order.customer_phone,
        }
      }
    });

    // Update order with payment link
    const { error: updateError } = await supabaseClient
      .from("retailer_orders")
      .update({
        payment_link_url: session.url,
        status: 'payment_pending',
        payment_status: 'pending'
      })
      .eq("id", order_id);

    if (updateError) {
      logStep("Failed to update order", { error: updateError });
    }

    const businessName = order.retailer_profiles?.business_name || 'your business';

    // Send SMS to customer with payment link
    try {
      const { error: smsError } = await supabaseClient.functions.invoke('send-sms', {
        body: {
          to: order.customer_phone,
          message: `Hi ${order.customer_name || 'there'}! Your order from ${businessName} is confirmed. Total: $${order.total_amount}. Pay here: ${session.url}. Ready in ~15-20 mins. Thank you!`
        }
      });

      if (smsError) {
        logStep("Customer SMS sending failed", { error: smsError });
      } else {
        logStep("Payment link sent via SMS to customer");
      }
    } catch (smsError) {
      logStep("Customer SMS service error", { error: smsError });
    }

    // Send SMS notification to retailer
    const retailerPhone = order.retailer_profiles?.phone;
    if (retailerPhone) {
      try {
        const { error: retailerSmsError } = await supabaseClient.functions.invoke('send-sms', {
          body: {
            to: retailerPhone,
            message: `NEW ORDER ALERT - ${businessName}\nCustomer: ${order.customer_name || 'Unknown'} (${order.customer_phone})\nTotal: $${order.total_amount}\nType: ${order.order_type || 'pickup'}\nStatus: Payment link sent. Please prepare order.`
          }
        });
        if (retailerSmsError) {
          logStep("Retailer SMS failed", { error: retailerSmsError });
        } else {
          logStep("Retailer notified via SMS");
        }
      } catch (retailerSmsError) {
        logStep("Retailer SMS error", { error: retailerSmsError });
      }
    }

    // Log analytics
    await supabaseClient
      .from("service_analytics")
      .insert({
        store_id: order.retailer_id,
        call_session_id: order.call_session_id,
        call_outcome: 'ai_success',
        transaction_completed: false,
        payment_processed: false,
        sms_confirmed: true
      });

    logStep("Payment session created successfully", { sessionId: session.id });

    return new Response(JSON.stringify({
      payment_url: session.url,
      session_id: session.id,
      amount: order.total_amount,
      currency: "USD",
      order_status: "payment_pending",
      sms_sent: true
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