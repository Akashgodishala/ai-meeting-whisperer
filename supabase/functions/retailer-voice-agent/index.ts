import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function
const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RETAILER-VOICE-AGENT] ${step}${detailsStr}`);
};

// Input validation functions
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

function sanitizeString(str: string, maxLength: number): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Retailer voice agent function started");

    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    // Create client with user's auth context for authorization check
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      logStep("Auth error", { error: authError });
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Authenticated user", { userId: user.id });

    const requestBody = await req.json();
    const { message, retailer_id, customer_phone, customer_name, call_session_id } = requestBody;
    
    // Input validation
    if (!retailer_id) {
      return new Response(JSON.stringify({ error: 'retailer_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidUUID(retailer_id)) {
      return new Response(JSON.stringify({ error: 'Invalid retailer_id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (customer_phone && !validatePhoneNumber(customer_phone)) {
      return new Response(JSON.stringify({ error: 'Invalid customer_phone format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (call_session_id && !isValidUUID(call_session_id)) {
      return new Response(JSON.stringify({ error: 'Invalid call_session_id format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize inputs
    const sanitizedMessage = sanitizeString(message || '', 5000);
    const sanitizedCustomerName = sanitizeString(customer_name || 'Customer', 100);
    const sanitizedPhone = customer_phone ? customer_phone.slice(0, 20) : '';

    // Verify user owns this retailer
    const { data: retailerOwnership } = await userClient
      .from('retailer_profiles')
      .select('id')
      .eq('id', retailer_id)
      .eq('user_id', user.id)
      .single();

    if (!retailerOwnership) {
      logStep("Authorization failed - user does not own retailer", { retailer_id, userId: user.id });
      return new Response(JSON.stringify({ error: 'Forbidden - you do not own this retailer' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Authorization passed", { retailer_id });

    // Use service role client for database operations
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    logStep("Processing voice agent request", { 
      retailer_id, 
      customer_phone: sanitizedPhone, 
      customer_name: sanitizedCustomerName,
      message_preview: sanitizedMessage.substring(0, 100) 
    });

    // Get retailer profile to understand business context
    const { data: retailerProfile, error: retailerError } = await supabaseClient
      .from('retailer_profiles')
      .select('*')
      .eq('id', retailer_id)
      .single();

    if (retailerError) throw new Error(`Failed to get retailer profile: ${retailerError.message}`);

    logStep("Retrieved retailer profile", { 
      business_name: retailerProfile.business_name,
      business_type: retailerProfile.business_type 
    });

    // Process the customer's voice message using AI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a helpful voice assistant for ${sanitizeString(retailerProfile.business_name, 100)}, a ${sanitizeString(retailerProfile.business_type.replace('_', ' '), 50)}. 

Your capabilities include:
1. PAYMENT PROCESSING: Help customers make payments by providing payment links or processing payment requests
2. APPOINTMENT BOOKING: Schedule appointments, consultations, pickups, or deliveries
3. LINK SHARING: Send relevant links for menus, catalogs, promotions, or other business materials
4. GENERAL ASSISTANCE: Answer questions about products, services, hours, etc.

Operating Hours: ${JSON.stringify(retailerProfile.operating_hours)}
Payment Methods: ${JSON.stringify(retailerProfile.payment_methods)}

When customers want to:
- Make a payment: Extract amount, payment method preference, and what they're paying for
- Book appointment: Extract preferred date/time, appointment type (consultation/pickup/delivery), and any special notes
- Get links: Determine what type of link they need (menu/catalog/promotion/payment)

Always be helpful, professional, and specific to ${sanitizeString(retailerProfile.business_type.replace('_', ' '), 50)} operations.

Respond with a JSON object containing:
{
  "reply": "Your conversational response to the customer",
  "action": "payment|appointment|link|none",
  "action_data": {
    // For payment: { "amount": number, "payment_method": string, "description": string }
    // For appointment: { "date": "YYYY-MM-DD", "time": "HH:MM", "type": string, "notes": string }
    // For link: { "link_type": "menu|catalog|promotion|payment", "title": string, "description": string }
  }
}`
          },
          {
            role: 'user',
            content: `Customer says: "${sanitizedMessage}"`
          }
        ],
        temperature: 0.7
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${await openaiResponse.text()}`);
    }

    const aiResult = await openaiResponse.json();
    const assistantResponse = JSON.parse(aiResult.choices[0].message.content);

    logStep("AI processed customer message", { 
      action: assistantResponse.action,
      reply_preview: assistantResponse.reply?.substring(0, 100)
    });

    // Execute the identified action
    let actionResult = null;

    switch (assistantResponse.action) {
      case 'payment':
        actionResult = await processPayment(
          supabaseClient,
          retailer_id,
          sanitizedPhone,
          sanitizedCustomerName,
          assistantResponse.action_data,
          call_session_id
        );
        break;

      case 'appointment':
        actionResult = await bookAppointment(
          supabaseClient,
          retailer_id,
          sanitizedPhone,
          sanitizedCustomerName,
          assistantResponse.action_data,
          call_session_id
        );
        break;

      case 'link':
        actionResult = await shareLink(
          supabaseClient,
          retailer_id,
          sanitizedPhone,
          assistantResponse.action_data,
          call_session_id
        );
        break;

      default:
        logStep("No specific action required");
    }

    return new Response(JSON.stringify({
      reply: assistantResponse.reply,
      action: assistantResponse.action,
      action_result: actionResult,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    logStep("ERROR in retailer voice agent", { message: error.message });
    return new Response(JSON.stringify({ 
      error: error.message,
      reply: "I'm sorry, I'm having trouble processing your request right now. Please try again later."
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function processPayment(
  supabaseClient: ReturnType<typeof createClient>,
  retailer_id: string,
  customer_phone: string,
  customer_name: string,
  paymentData: Record<string, unknown>,
  call_session_id: string
) {
  logStep("Processing payment", paymentData);

  const { data, error } = await supabaseClient
    .from('voice_transactions')
    .insert([{
      retailer_id,
      customer_phone,
      customer_name,
      amount: paymentData.amount,
      currency: 'USD',
      payment_method: paymentData.payment_method || 'credit_card',
      payment_status: 'pending',
      transaction_reference: `REF-${Date.now()}`,
      call_session_id
    }])
    .select()
    .single();

  if (error) throw new Error(`Payment processing error: ${error.message}`);

  logStep("Payment transaction created", { transaction_id: data.id });
  return { transaction_id: data.id, amount: paymentData.amount };
}

async function bookAppointment(
  supabaseClient: ReturnType<typeof createClient>,
  retailer_id: string,
  customer_phone: string,
  customer_name: string,
  appointmentData: Record<string, unknown>,
  call_session_id: string
) {
  logStep("Booking appointment", appointmentData);

  const appointmentDateTime = `${appointmentData.date}T${appointmentData.time || '10:00'}:00.000Z`;

  const { data, error } = await supabaseClient
    .from('voice_appointments')
    .insert([{
      retailer_id,
      customer_phone,
      customer_name,
      appointment_date: appointmentDateTime,
      appointment_type: appointmentData.type || 'consultation',
      status: 'scheduled',
      notes: appointmentData.notes || '',
      call_session_id
    }])
    .select()
    .single();

  if (error) throw new Error(`Appointment booking error: ${error.message}`);

  logStep("Appointment booked", { appointment_id: data.id });
  return { appointment_id: data.id, date: appointmentData.date, time: appointmentData.time };
}

async function shareLink(
  supabaseClient: ReturnType<typeof createClient>,
  retailer_id: string,
  customer_phone: string,
  linkData: Record<string, unknown>,
  call_session_id: string
) {
  logStep("Sharing link", linkData);

  // Generate appropriate link based on type
  const linkUrls = {
    menu: 'https://your-restaurant.com/menu',
    catalog: 'https://your-store.com/catalog',
    promotion: 'https://your-store.com/offers',
    payment: 'https://your-store.com/pay'
  };

  const linkUrl = linkUrls[linkData.link_type as keyof typeof linkUrls] || 'https://your-business.com';

  const { data, error } = await supabaseClient
    .from('voice_links')
    .insert([{
      retailer_id,
      customer_phone,
      link_url: linkUrl,
      link_type: linkData.link_type,
      title: linkData.title || `${linkData.link_type} Link`,
      description: linkData.description || '',
      call_session_id
    }])
    .select()
    .single();

  if (error) throw new Error(`Link sharing error: ${error.message}`);

  logStep("Link shared", { link_id: data.id });
  return { link_id: data.id, url: linkUrl, type: linkData.link_type };
}
