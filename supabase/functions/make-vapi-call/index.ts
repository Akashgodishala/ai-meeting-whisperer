import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation functions
function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

function sanitizeString(str: string, maxLength: number): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { customer, customMessage, vapiApiKey, vapiAssistantId, vapiPhoneNumberId } = requestBody;

    // Input validation
    if (!customer) {
      return new Response(JSON.stringify({ error: 'Customer data is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!customer.phone) {
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
    const sanitizedName = sanitizeString(customer.name || 'there', 100);
    const sanitizedMessage = customMessage ? sanitizeString(customMessage, 1600) : null;

    console.log('🔥 Making VAPI call for:', sanitizedName);

    // Prefer Supabase Secrets; fall back to credentials passed from the client
    const apiKey = Deno.env.get('VAPI_API_KEY') || sanitizeString(vapiApiKey || '', 200);
    const assistantId = Deno.env.get('VAPI_ASSISTANT_ID') || sanitizeString(vapiAssistantId || '', 200);
    const phoneNumberId = Deno.env.get('VAPI_PHONE_NUMBER_ID') || sanitizeString(vapiPhoneNumberId || '', 200);

    if (!apiKey || !assistantId || !phoneNumberId) {
      console.error('Missing VAPI credentials');
      return new Response(JSON.stringify({
        success: false,
        error: 'VAPI credentials are not configured. Please add your VAPI API Key, Assistant ID and Phone Number ID in the Settings tab, then set them as Supabase Secrets (VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID) for production use.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ VAPI credentials resolved');
    
    // Prepare the message with customer name substitution
    const finalMessage = sanitizedMessage 
      ? sanitizedMessage.replace('{customerName}', sanitizedName)
      : `Hello ${sanitizedName}! This is a friendly reminder about your upcoming meeting tomorrow. Please let me know if you can attend.`;
    
    // Format phone number to E.164 format
    let formattedPhone = customer.phone.replace(/\D/g, ''); // Remove non-digits
    
    // Add +1 for US numbers if not already present
    if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
      formattedPhone = '1' + formattedPhone;
    }
    
    // Add + prefix if not present
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    
    console.log(`📞 Formatted phone: ${customer.phone} → ${formattedPhone}`);
    
    // Make the VAPI API call
    const response = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId: assistantId,
        phoneNumberId: phoneNumberId,
        customer: {
          number: formattedPhone
        },
        assistantOverrides: {
          firstMessage: finalMessage,
          voice: {
            provider: "11labs",
            voiceId: "9BWtsMINqrJLrRacOk9x"
          },
          endCallMessage: "Thank you for your time. Goodbye!",
          endCallPhrases: ["goodbye", "bye bye", "voicemail", "beep"],
          maxDurationSeconds: 300,
          silenceTimeoutSeconds: 30,
          responseDelaySeconds: 2,
          recordingEnabled: true,
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a friendly AI voice assistant calling ${sanitizedName} about their upcoming meeting. You are having a live phone conversation.

CRITICAL INSTRUCTIONS:
1. WAIT FOR RESPONSES: Always pause after asking questions and wait for the customer to respond
2. BE PATIENT: Give customers time to think and respond - wait at least 5-10 seconds after asking a question
3. LISTEN CAREFULLY: Pay attention to what the customer says before responding

Your purpose:
- Remind them about tomorrow's meeting
- Ask if they can attend (YES or NO)  
- Wait for their response patiently
- Confirm their answer before ending the call

CONVERSATION FLOW:
1. Greet them warmly and introduce yourself
2. Remind them about tomorrow's meeting
3. Ask: "Will you be able to attend? Please say YES if you can attend, or NO if you cannot"
4. WAIT FOR THEIR RESPONSE (be patient - don't rush)
5. Acknowledge their response: "Thank you for letting me know you will/won't be attending"
6. End with: "Have a great day, goodbye!"

VOICEMAIL DETECTION:
- If you hear "beep", automated voice, or voicemail greeting, leave a brief message and say goodbye
- For voicemail: "Hi ${sanitizedName}, this is a reminder about tomorrow's meeting. Please call back to confirm. Thank you, goodbye!"

DO NOT end the call until you get a clear YES or NO answer from a live person, or detect voicemail.`
              }
            ]
          },
          endCallFunctionEnabled: false
        }
      })
    });

    if (response.ok) {
      const callData = await response.json();
      console.log('🎉 VAPI call initiated successfully:', callData.id);
      
      return new Response(JSON.stringify({
        success: true,
        callId: callData.id,
        message: `AI agent is calling ${sanitizedName} at ${customer.phone}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const errorData = await response.json();
      console.error('❌ VAPI API error:', errorData);
      throw new Error(errorData.message || 'Call failed');
    }
  } catch (error) {
    console.error('❌ VAPI Call error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Failed to make call"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
