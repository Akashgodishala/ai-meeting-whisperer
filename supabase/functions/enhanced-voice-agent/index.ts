import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// Input validation helpers
function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

function sanitizeString(str: string, maxLength: number): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

// Phone number normalization
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle international formats
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned; // US/Canada
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Already US/Canada format
  } else if (cleaned.length > 11) {
    // International number, keep as is
  }
  
  return '+' + cleaned;
}

// Enhanced retry logic with exponential backoff
async function makeCallWithRetry(callData: Record<string, unknown>, attempt = 1): Promise<Record<string, unknown>> {
  const apiKey = Deno.env.get('VAPI_API_KEY');
  
  try {
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callData)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Call attempt ${attempt} failed:`, error);
    
    if (attempt < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeCallWithRetry(callData, attempt + 1);
    }
    
    throw error;
  }
}

// Generate intelligent conversation prompts based on context
function generateEnhancedPrompt(customerName: string, callType: string, customMessage?: string): string {
  const basePrompt = `You are an intelligent AI voice assistant representing a professional business. You are calling ${customerName} for ${callType}.

CRITICAL CONVERSATION GUIDELINES:
1. ALWAYS be patient and wait for responses - pause 3-5 seconds after asking questions
2. LISTEN carefully to what the customer says before responding
3. Recognize various response patterns naturally
4. Handle interruptions gracefully
5. Maintain professional but friendly tone
6. Be compliant with call recording regulations

VOICEMAIL DETECTION:
- Listen for automated messages, beeps, or "unavailable" messages
- If voicemail detected, leave concise message and end call
- Example: "Hi ${customerName}, this is [business] calling about [purpose]. Please call us back. Thank you!"

RESPONSE RECOGNITION PATTERNS:
Positive: "yes", "yeah", "sure", "okay", "absolutely", "I'll be there", "count me in", "definitely"
Negative: "no", "nope", "can't", "won't", "not available", "busy", "unable to attend"
Uncertain: "maybe", "not sure", "let me check", "I'll try", "possibly"

CONVERSATION FLOW:`;

  switch (callType) {
    case 'meeting_reminder':
      return `${basePrompt}
1. Warm greeting: "Hello ${customerName}, this is [AI Assistant] calling from [business]"
2. State purpose: "I'm calling to remind you about your meeting scheduled for tomorrow"
3. Ask clearly: "Will you be able to attend? Please say YES if you can make it, or NO if you cannot"
4. WAIT for response (be patient - count to 5 before speaking again)
5. Acknowledge: "Thank you for confirming you will/will not be attending"
6. Close professionally: "Have a great day, goodbye!"

If customer seems confused, clarify the meeting details politely.
${customMessage ? `\nSpecial instructions: ${customMessage}` : ''}`;

    case 'appointment_confirmation':
      return `${basePrompt}
1. Greeting: "Hello ${customerName}, this is [business] calling about your upcoming appointment"
2. Confirm details: "You have an appointment scheduled for [date/time]"
3. Ask: "Can you confirm you'll be able to make it?"
4. Handle rescheduling requests professionally
5. Provide contact info if needed`;

    case 'order_status':
      return `${basePrompt}
1. Greeting: "Hello ${customerName}, calling from [business] about your recent order"
2. Provide update: "Your order is [status] and will be [delivery info]"
3. Ask if they have questions
4. Offer to send text/email updates`;

    default:
      return `${basePrompt}
1. Professional greeting
2. State purpose clearly
3. Listen and respond appropriately
4. Close courteously`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authorization check
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
    const apiKey = Deno.env.get('VAPI_API_KEY');
    const assistantId = Deno.env.get('VAPI_ASSISTANT_ID');
    const phoneNumberId = Deno.env.get('VAPI_PHONE_NUMBER_ID');
    
    if (!supabaseUrl || !supabaseServiceKey || !apiKey || !assistantId || !phoneNumberId) {
      throw new Error('Missing required environment variables');
    }

    // Create client with user's auth context
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized - invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    const requestBody = await req.json();
    const { customer, callType = 'meeting_reminder', customMessage, businessContext } = requestBody;

    // Input validation
    if (!customer || !customer.phone) {
      return new Response(JSON.stringify({ error: 'Customer phone number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!validatePhoneNumber(customer.phone)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize inputs
    const sanitizedCustomerName = sanitizeString(customer.name || 'Customer', 100);
    const sanitizedCallType = sanitizeString(callType, 50);
    const sanitizedCustomMessage = customMessage ? sanitizeString(customMessage, 500) : undefined;

    // Verify user has permission (owns meeting with this customer or retailer)
    const { data: userMeeting } = await userClient
      .from('automated_meetings')
      .select('id')
      .eq('customer_phone', customer.phone)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    const { data: retailerProfile } = await userClient
      .from('retailer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!userMeeting && !retailerProfile) {
      console.error('User has no permission for this customer:', user.id, customer.phone);
      return new Response(JSON.stringify({ error: 'Forbidden - no permission to call this customer' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authorization passed for user:', user.id);

    // Service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`🚀 Enhanced call request: ${sanitizedCallType} for ${sanitizedCustomerName}`);
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(customer.phone);
    console.log(`📞 Phone normalized: ${customer.phone} → ${normalizedPhone}`);
    
    // Generate enhanced conversation prompt
    const systemPrompt = generateEnhancedPrompt(sanitizedCustomerName, sanitizedCallType, sanitizedCustomMessage);
    
    // Prepare call configuration
    const callConfig = {
      assistantId: assistantId,
      phoneNumberId: phoneNumberId,
      customer: {
        number: normalizedPhone,
        name: sanitizedCustomerName
      },
      assistantOverrides: {
        firstMessage: sanitizedCustomMessage || `Hello ${sanitizedCustomerName}! This is your AI assistant calling about your upcoming meeting.`,
        voice: {
          provider: "11labs",
          voiceId: "9BWtsMINqrJLrRacOk9x", // Aria - professional female voice
          stability: 0.7,
          similarityBoost: 0.8,
          style: 0.2
        },
        endCallMessage: "Thank you for your time. Have a great day, goodbye!",
        endCallPhrases: ["goodbye", "bye bye", "thank you goodbye", "voicemail", "beep"],
        maxDurationSeconds: 300,
        silenceTimeoutSeconds: 30,
        responseDelaySeconds: 3,
        recordingEnabled: true,
        model: {
          provider: "openai",
          model: "gpt-5-2025-08-07",
          max_completion_tokens: 500,
          messages: [
            {
              role: "system",
              content: systemPrompt
            }
          ]
        },
        endCallFunctionEnabled: false,
        voicemailDetectionEnabled: true,
        backgroundSound: "office"
      },
      metadata: {
        callType: sanitizedCallType,
        customerInfo: {
          name: sanitizedCustomerName,
          phone: normalizedPhone
        },
        userId: user.id
      }
    };

    // Make call with retry logic
    console.log('📞 Making enhanced VAPI call...');
    const callResult = await makeCallWithRetry(callConfig);
    
    console.log(`✅ Call initiated successfully: ${callResult.id}`);
    
    // Log call initiation to analytics
    await supabase.from('call_analytics').insert({
      call_id: callResult.id,
      customer_phone: normalizedPhone,
      call_success: true
    });
    
    // Create call session record
    await supabase.from('call_sessions').insert({
      call_id: callResult.id,
      customer_name: sanitizedCustomerName,
      customer_phone: normalizedPhone,
      status: 'initiated',
      metadata: {
        call_type: sanitizedCallType,
        enhanced_features: true,
        retry_attempts: 1,
        initiated_by: user.id
      }
    });

    return new Response(JSON.stringify({
      success: true,
      callId: callResult.id,
      message: `Enhanced AI call initiated to ${sanitizedCustomerName}`,
      callType: sanitizedCallType,
      estimatedDuration: '2-5 minutes'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Enhanced call failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to initiate call',
      supportContact: 'Please contact support if this issue persists'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
