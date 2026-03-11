import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return new Response(JSON.stringify({ error: 'Phone number is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Basic US phone validation
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 11) {
      return new Response(JSON.stringify({ error: 'Invalid US phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formattedNumber = cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;

    const vapiKey = Deno.env.get('VAPI_PRIVATE_KEY');
    const assistantId = Deno.env.get('VAPI_ASSISTANT_ID');
    const phoneNumberId = Deno.env.get('VAPI_PHONE_NUMBER_ID');
    
    if (!vapiKey || !assistantId || !phoneNumberId) {
      console.error('Missing config:', { hasKey: !!vapiKey, hasAssistant: !!assistantId, hasPhone: !!phoneNumberId });
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Initiating call to:', formattedNumber, 'assistant:', assistantId, 'phone:', phoneNumberId);

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId,
        customer: { number: formattedNumber },
        phoneNumberId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Vapi API error:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: data?.message || 'Failed to initiate call', details: data }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, callId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
