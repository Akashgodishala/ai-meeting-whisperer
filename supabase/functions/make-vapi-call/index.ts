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
    
    // Prepare the greeting message with customer name substitution
    const businessName = sanitizeString(customer.businessName || 'our business', 150);
    const finalMessage = sanitizedMessage
      ? sanitizedMessage.replace('{customerName}', sanitizedName).replace('{businessName}', businessName)
      : `Hello ${sanitizedName}! Thank you for calling ${businessName}. How can I help you today?`;

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

    // Retailer context for the AI
    const retailerContext = customer.retailerId
      ? `You are handling calls for retailer ID: ${sanitizeString(customer.retailerId, 100)}.`
      : '';

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
        metadata: {
          retailer_id: customer.retailerId || '',
          customer_name: sanitizedName,
          customer_phone: formattedPhone,
          business_name: businessName,
        },
        customer: {
          number: formattedPhone
        },
        assistantOverrides: {
          firstMessage: finalMessage,
          voice: {
            provider: "11labs",
            voiceId: "9BWtsMINqrJLrRacOk9x"
          },
          endCallMessage: "Thank you for calling. We will send you a confirmation shortly. Goodbye!",
          endCallPhrases: ["goodbye", "bye bye", "voicemail", "beep", "thank you goodbye"],
          maxDurationSeconds: 600,
          silenceTimeoutSeconds: 30,
          responseDelaySeconds: 1,
          recordingEnabled: true,
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a friendly and professional AI voice assistant for ${businessName}. You are having a live phone conversation with a customer named ${sanitizedName}. ${retailerContext}

CRITICAL INSTRUCTIONS:
1. WAIT FOR RESPONSES: Always pause after asking a question. Give the customer 5-10 seconds to respond.
2. LISTEN CAREFULLY: Acknowledge what the customer says before moving forward.
3. BE CONVERSATIONAL: Use natural speech. It is okay to say "Sure!", "Of course!", "Let me check that for you."
4. ONE QUESTION AT A TIME: Never ask multiple questions in the same turn.

YOUR PRIMARY GOALS:
- Greet the customer warmly by name
- Understand what they need (order, inquiry, support, appointment)
- Collect all necessary details (items, quantity, delivery/pickup preference, address if delivery)
- Confirm the order summary back to the customer
- Collect their phone number for the payment link and confirmation SMS
- Tell them: "Great! I will send a payment link and order confirmation to your phone shortly."
- End the call politely

ORDER COLLECTION FLOW:
1. Greet and ask how you can help
2. Listen and clarify what they want
3. Ask follow-up questions one at a time (size, quantity, flavor, etc.)
4. Ask: "Will that be pickup or delivery?"
5. If delivery: collect their delivery address
6. Confirm order summary: repeat all items and total back to the customer
7. Ask: "Is that correct? Shall I confirm your order?"
8. When customer confirms: say "Perfect! I am sending you a payment link and order details by text message right now. Your order will be ready in approximately 15 to 20 minutes."
9. End with: "Thank you for calling ${businessName}. Have a wonderful day, goodbye!"

VOICEMAIL HANDLING:
- If you detect voicemail or hear a beep, say: "Hi ${sanitizedName}, this is ${businessName}. We missed your call. Please call us back at your convenience. Thank you, goodbye!"
- Then end the call immediately.

IMPORTANT: When the order is confirmed by the customer, you MUST include the phrase "ORDER_CONFIRMED" followed by the order details in your response so our system can process it.`
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
