import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation functions
function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function sanitizeString(str: string, maxLength: number): string {
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

// Twilio signature validation
async function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  // Sort params alphabetically and concatenate
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  
  const data = url + sortedParams;
  
  // Create HMAC-SHA1 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const computedSignature = base64Encode(new Uint8Array(signatureBuffer));
  
  return computedSignature === signature;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
      console.error('Missing Twilio credentials');
      throw new Error('Twilio credentials not configured');
    }

    // Validate Twilio signature
    const twilioSignature = req.headers.get('X-Twilio-Signature');
    
    // Parse form data
    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }
    
    const from = params['From'];
    const body = params['Body'];
    const to = params['To'];

    // Validate signature if present (Twilio always sends this)
    if (twilioSignature) {
      const requestUrl = req.url;
      const isValid = await validateTwilioSignature(
        twilioAuthToken,
        twilioSignature,
        requestUrl,
        params
      );
      
      if (!isValid) {
        console.error('Invalid Twilio signature - request rejected');
        return new Response('Unauthorized', { status: 401 });
      }
      console.log('✅ Twilio signature validated');
    } else {
      console.warn('⚠️ No Twilio signature header - request may not be from Twilio');
      // In production, you may want to reject requests without signature
    }

    // Input validation
    if (!from || !body) {
      console.error('Missing SMS data: from or body');
      throw new Error('Missing SMS data');
    }

    if (!validatePhoneNumber(from)) {
      console.error('Invalid phone number format:', from);
      throw new Error('Invalid phone number format');
    }

    // Sanitize inputs
    const sanitizedBody = sanitizeString(body, 1600);
    const sanitizedFrom = from.slice(0, 20);

    console.log('Received SMS from:', sanitizedFrom, 'Message length:', sanitizedBody.length);

    // Create Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find customer by phone number using retailer_customers table
    const { data: customers, error: customerError } = await supabase
      .from('retailer_customers')
      .select('name')
      .eq('phone', sanitizedFrom)
      .limit(1)
      .maybeSingle();

    let customerName = 'there';
    if (!customerError && customers) {
      customerName = sanitizeString(customers.name || 'there', 100);
    }

    // Send to ChatGPT assistant for intelligent response
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-gpt-assistant', {
      body: {
        question: sanitizedBody,
        customerName,
        meetingType: 'SMS Follow-up'
      }
    });

    if (aiError) {
      console.error('AI response error:', aiError);
      throw new Error('AI response failed');
    }

    // Send SMS response back to customer
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const responseFormData = new URLSearchParams();
    responseFormData.append('To', sanitizedFrom);
    responseFormData.append('From', twilioFromNumber);
    
    const responseBody = sanitizeString(
      aiResponse?.response || 'Thank you for your message. I\'m here to help with any questions about the meeting.',
      1600
    );
    responseFormData.append('Body', responseBody);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: responseFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio API error:', error);
      throw new Error(error.message || 'Failed to send SMS response');
    }

    const result = await response.json();
    console.log('SMS response sent:', result.sid);

    // Return TwiML response (required by Twilio)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Error in handle-sms function:', error);
    
    // Return TwiML response even on error
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  }
});
