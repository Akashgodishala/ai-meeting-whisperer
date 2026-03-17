import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Retail automation types
interface AutomationRequest {
  type: 'appointment_scheduling' | 'order_confirmation' | 'inventory_alert' | 'feedback_collection' | 'loyalty_program' | 'promotional_campaign';
  retailerId: string;
  customers: Array<{
    name: string;
    phone: string;
    email?: string;
    preferences?: Record<string, unknown>;
  }>;
  data: Record<string, unknown>;
  scheduledFor?: string;
}

const validAutomationTypes = [
  'appointment_scheduling',
  'order_confirmation',
  'inventory_alert',
  'feedback_collection',
  'loyalty_program',
  'promotional_campaign'
];

// Generate retail-specific prompts
function generateRetailPrompt(automationType: string, data: Record<string, unknown>): string {
  const sanitizedData = {
    serviceType: sanitizeString(data?.serviceType || '', 100),
    orderNumber: sanitizeString(data?.orderNumber || 'XXX', 50),
    deliveryMethod: sanitizeString(data?.deliveryMethod || 'pickup', 50),
    estimatedReady: sanitizeString(data?.estimatedReady || 'soon', 100),
    address: sanitizeString(data?.address || 'your address', 200),
    productName: sanitizeString(data?.productName || 'Item', 100),
    status: sanitizeString(data?.status || 'back in stock', 50),
    transactionType: sanitizeString(data?.transactionType || 'purchase', 50),
    date: sanitizeString(data?.date || 'recently', 50),
    productService: sanitizeString(data?.productService || 'purchase', 100),
    promotionTitle: sanitizeString(data?.promotionTitle || 'Special Offer', 100),
    discount: sanitizeString(data?.discount || '20% off', 50),
    products: sanitizeString(data?.products || 'select items', 200),
    expiryDate: sanitizeString(data?.expiryDate || 'this weekend', 50),
    promoCode: sanitizeString(data?.promoCode || 'SAVE20', 50),
  };

  switch (automationType) {
    case 'appointment_scheduling':
      return `You are a professional appointment coordinator calling to schedule an appointment.
      
OBJECTIVE: Schedule ${sanitizedData.serviceType || 'an appointment'} for the customer
      
CONVERSATION FLOW:
1. "Hello [customer], this is [business] calling to schedule your ${sanitizedData.serviceType || 'appointment'}"
2. "We have availability on [dates/times]. What works best for you?"
3. Listen for their preferred time and confirm availability
4. "Perfect! I'll book you for [confirmed time]. You'll receive a confirmation text"
5. Ask if they have any special requests or questions
6. "Thank you! We look forward to seeing you on [date]"

Be flexible with scheduling and offer alternatives if their first choice isn't available.`;

    case 'order_confirmation':
      return `You are calling to confirm and update the customer about their recent order.
      
ORDER DETAILS: Order #${sanitizedData.orderNumber}
      
CONVERSATION FLOW:
1. "Hello [customer], calling from [business] about your recent order"
2. "Your order #${sanitizedData.orderNumber} is confirmed and being prepared"
3. "It will be ready for ${sanitizedData.deliveryMethod} on ${sanitizedData.estimatedReady}"
4. If delivery: "We'll deliver to ${sanitizedData.address}"
5. "Do you have any questions about your order?"
6. "We'll send you updates via text. Thank you for your business!"

Provide clear timeline and contact information.`;

    case 'inventory_alert':
      return `You are calling to notify about product availability.
      
PRODUCT INFO: ${sanitizedData.productName} is now ${sanitizedData.status}
      
CONVERSATION FLOW:
1. "Hello [customer], great news from [business]!"
2. "The ${sanitizedData.productName} you wanted is now available"
3. "Would you like us to hold one for you?"
4. If yes: "I'll reserve it for 24 hours. When can you pick it up?"
5. If no: "No problem! We'll keep you on the notify list for future availability"
6. "Thank you for your interest in our products!"

Be enthusiastic but not pushy about the purchase.`;

    case 'feedback_collection':
      return `You are calling to collect feedback about recent purchase/service.
      
RECENT TRANSACTION: ${sanitizedData.transactionType} on ${sanitizedData.date}
      
CONVERSATION FLOW:
1. "Hello [customer], calling from [business] about your recent ${sanitizedData.transactionType}"
2. "We hope you're happy with your ${sanitizedData.productService}!"
3. "On a scale of 1-10, how would you rate your experience?"
4. Listen to their rating and ask: "What did you like most about your experience?"
5. If rating < 7: "Is there anything we could have done better?"
6. "Thank you for your feedback! It helps us serve you better"

Keep it brief and positive, even if feedback is negative.`;

    case 'promotional_campaign':
      return `You are calling about a special promotion or offer.
      
PROMOTION: ${sanitizedData.promotionTitle} - ${sanitizedData.discount}
      
CONVERSATION FLOW:
1. "Hello [customer], I have exciting news from [business]!"
2. "We're offering ${sanitizedData.discount} on ${sanitizedData.products}"
3. "This offer is valid until ${sanitizedData.expiryDate}"
4. "Would you like me to reserve these savings for you?"
5. "You can use code ${sanitizedData.promoCode} online or mention this call in-store"
6. "Thank you for being a valued customer!"

Be enthusiastic but respect if they're not interested.`;

    default:
      return `You are a helpful customer service representative calling on behalf of a retail business.
      
Be professional, friendly, and helpful. Listen to the customer's needs and provide appropriate assistance.`;
  }
}

// Schedule bulk calls
async function scheduleBulkCalls(supabase: Record<string, unknown>, automation: AutomationRequest): Promise<Record<string, unknown>[]> {
  const results = [];
  
  for (const customer of automation.customers) {
    try {
      // Validate customer data
      if (!validatePhoneNumber(customer.phone)) {
        results.push({ customer: customer.name, success: false, error: 'Invalid phone number' });
        continue;
      }

      // Call enhanced voice agent
      const callResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enhanced-voice-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          customer: {
            name: sanitizeString(customer.name, 100),
            phone: customer.phone.slice(0, 20),
            email: customer.email ? sanitizeString(customer.email, 254) : undefined
          },
          callType: automation.type,
          customMessage: generateRetailPrompt(automation.type, automation.data),
          businessContext: {
            retailerId: automation.retailerId,
            automationType: automation.type,
            campaignData: automation.data
          }
        })
      });
      
      const result = await callResponse.json();
      results.push({ customer: customer.name, success: result.success, callId: result.callId });
      
      // Add delay between calls to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Failed to call ${customer.name}:`, error);
      results.push({ customer: customer.name, success: false, error: error.message });
    }
  }
  
  return results;
}

// Log automation campaign
async function logAutomationCampaign(supabase: ReturnType<typeof createClient>, automation: AutomationRequest, results: Record<string, unknown>[]): Promise<void> {
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  await supabase.from('service_analytics').insert({
    store_id: automation.retailerId,
    call_outcome: `automation_campaign_${automation.type}`,
    transaction_completed: successCount === totalCount,
    customer_satisfaction: successCount / totalCount * 10, // Convert to 1-10 scale
    call_duration: totalCount * 180, // Estimated total duration
    sms_confirmed: false,
    payment_processed: false
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Create client with user's auth context for authorization check
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Authenticated user: ${user.id}`);

    const automation: AutomationRequest = await req.json();
    
    // Input validation
    if (!automation.retailerId) {
      return new Response(JSON.stringify({ error: 'retailerId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isValidUUID(automation.retailerId)) {
      return new Response(JSON.stringify({ error: 'Invalid retailerId format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!automation.type || !validAutomationTypes.includes(automation.type)) {
      return new Response(JSON.stringify({ error: 'Invalid automation type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(automation.customers) || automation.customers.length === 0) {
      return new Response(JSON.stringify({ error: 'customers array is required and cannot be empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (automation.customers.length > 100) {
      return new Response(JSON.stringify({ error: 'Maximum 100 customers per automation' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user owns this retailer
    const { data: retailerOwnership } = await userClient
      .from('retailer_profiles')
      .select('id, business_name')
      .eq('id', automation.retailerId)
      .eq('user_id', user.id)
      .single();

    if (!retailerOwnership) {
      console.error('Authorization failed - user does not own retailer');
      return new Response(JSON.stringify({ error: 'Forbidden - you do not own this retailer' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Authorization passed for retailer: ${retailerOwnership.business_name}`);

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`🏪 Retail automation request: ${automation.type} for ${automation.customers.length} customers`);
    
    // Process automation based on type
    let results = [];
    
    if (automation.scheduledFor && new Date(automation.scheduledFor) > new Date()) {
      // Schedule for later (would need a cron job or scheduler)
      console.log(`📅 Scheduling automation for ${automation.scheduledFor}`);
      
      // For now, we'll store the scheduled automation
      await supabase.from('scheduled_automations').insert({
        retailer_id: automation.retailerId,
        automation_type: automation.type,
        scheduled_for: automation.scheduledFor,
        customers: automation.customers.map(c => ({
          name: sanitizeString(c.name, 100),
          phone: c.phone.slice(0, 20),
          email: c.email ? sanitizeString(c.email, 254) : undefined
        })),
        campaign_data: automation.data,
        status: 'scheduled'
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: `Automation scheduled for ${automation.scheduledFor}`,
        scheduledCustomers: automation.customers.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } else {
      // Execute immediately
      console.log(`🚀 Executing immediate automation: ${automation.type}`);
      results = await scheduleBulkCalls(supabase, automation);
    }
    
    // Log campaign results
    await logAutomationCampaign(supabase, automation, results);
    
    // Generate campaign summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    console.log(`✅ Campaign complete: ${successCount} successful, ${failureCount} failed`);
    
    return new Response(JSON.stringify({
      success: true,
      campaignType: automation.type,
      totalCustomers: automation.customers.length,
      successfulCalls: successCount,
      failedCalls: failureCount,
      results: results,
      estimatedCompletion: `${automation.customers.length * 3} minutes`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Retail automation failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      suggestion: 'Check retailer ID and customer data format'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
