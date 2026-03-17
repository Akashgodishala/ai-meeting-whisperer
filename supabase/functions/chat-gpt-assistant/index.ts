import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation helpers
function sanitizeString(str: string, maxLength: number): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
}

function validateInput(input: Record<string, unknown>) {
  return {
    question: sanitizeString(input?.question || '', 2000),
    customerName: sanitizeString(input?.customerName || 'Customer', 100),
    customerPhone: input?.customerPhone?.slice(0, 20) || null,
    callSid: sanitizeString(input?.callSid || '', 100),
    meetingType: sanitizeString(input?.meetingType || 'stand-up meeting', 100)
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get customer info from URL params or request body
    const url = new URL(req.url);
    const customerNameFromUrl = url.searchParams.get('customerName');
    const customerPhoneFromUrl = url.searchParams.get('customerPhone');
    
    const requestBody = await req.json();
    console.log('📥 Request body received');
    
    // Handle VAPI function call format
    let rawQuestion, rawCustomerName, rawCustomerPhone, rawCallSid, rawMeetingType;
    
    if (requestBody.message && requestBody.message.function_call) {
      // This is a VAPI function call
      const functionCall = requestBody.message.function_call;
      const args = typeof functionCall.arguments === 'string' 
        ? JSON.parse(functionCall.arguments) 
        : functionCall.arguments;
      
      rawQuestion = args.question;
      rawCustomerName = args.customerName;
      rawCustomerPhone = requestBody.call?.customer?.number;
      rawCallSid = requestBody.call?.id;
      
      console.log('🔧 Function call detected:', functionCall.name);
    } else {
      // Direct call format
      rawQuestion = requestBody.question;
      rawCustomerName = requestBody.customerName;
      rawCustomerPhone = requestBody.customerPhone;
      rawCallSid = requestBody.callSid;
      rawMeetingType = requestBody.meetingType;
    }
    
    // Validate and sanitize all inputs
    const validated = validateInput({
      question: rawQuestion,
      customerName: rawCustomerName || customerNameFromUrl,
      customerPhone: rawCustomerPhone || customerPhoneFromUrl,
      callSid: rawCallSid,
      meetingType: rawMeetingType
    });

    const finalCustomerName = validated.customerName;
    const finalCustomerPhone = validated.customerPhone;
    const finalCallSid = validated.callSid || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const meetingType = validated.meetingType;

    // Verify user has permission (owns meetings or retailer)
    if (finalCustomerPhone) {
      const { data: userMeeting } = await userClient
        .from('automated_meetings')
        .select('id')
        .eq('customer_phone', finalCustomerPhone)
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
        console.error('User has no permission for this customer:', user.id, finalCustomerPhone);
        return new Response(JSON.stringify({ error: 'Forbidden - no permission for this customer' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!validated.question) {
      console.log('No question provided, generating default response for customer:', finalCustomerName);
      return new Response(JSON.stringify({ 
        response: "I understand. Thank you for your time!",
        customerName: finalCustomerName,
        success: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Processing conversational input for customer:', finalCustomerName);

    const systemPrompt = `You are a friendly AI voice assistant having a live phone conversation with ${finalCustomerName} about their upcoming meeting reminder.

Your role:
- You're currently on a phone call with ${finalCustomerName}
- This is a natural, flowing conversation (not button-based)
- Respond as if you're speaking directly to them on the phone
- Be conversational, warm, and professional

Meeting Context:
- Tomorrow's ${meetingType}
- Topics: Job opportunities and company progress updates
- Duration: About 30 minutes

Conversation Guidelines:
- Respond naturally to whatever they say
- Answer their questions about the meeting conversationally
- If they confirm attendance, acknowledge warmly ("Great! I'll mark you down as attending.")
- If they can't attend, thank them ("Thank you for letting me know. I'll update your status.")
- If they ask questions, provide helpful information naturally
- Keep responses conversational and under 3 sentences
- Don't ask them to press buttons - this is a voice conversation
- Speak as if you're talking on the phone

Current input from ${finalCustomerName}: "${validated.question}"

Respond naturally to what they just said.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: validated.question }
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get ChatGPT response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('🤖 ChatGPT response generated');

    // Detect meeting attendance response and store in database
    const lowerQuestion = validated.question.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();
    
    let responseType = null;
    let responseMessage = '';
    
    // Check for positive responses
    if (lowerQuestion.includes('yes') || lowerQuestion.includes('yeah') || lowerQuestion.includes('yep') ||
        lowerQuestion.includes('attending') || lowerQuestion.includes('attend') || lowerQuestion.includes('confirm') || 
        lowerQuestion.includes('will be there') || lowerQuestion.includes('i will') || lowerQuestion.includes("i'll") ||
        lowerQuestion.includes('sure') || lowerQuestion.includes('okay') || lowerQuestion.includes('definitely') ||
        lowerQuestion.includes('absolutely') || lowerResponse.includes('mark you down as attending') || 
        lowerResponse.includes('great')) {
      responseType = 'yes';
      responseMessage = sanitizeString(`${finalCustomerName} confirmed attendance: "${validated.question}"`, 500);
      console.log('✅ POSITIVE response detected');
    }
    // Check for negative responses
    else if (lowerQuestion.includes('no') || lowerQuestion.includes('nope') || lowerQuestion.includes('cannot') || 
             lowerQuestion.includes("can't") || lowerQuestion.includes('wont') || lowerQuestion.includes("won't") ||
             lowerQuestion.includes('decline') || lowerQuestion.includes('busy') || lowerQuestion.includes('unavailable') ||
             lowerQuestion.includes('not attending') || lowerQuestion.includes('miss') || lowerQuestion.includes('skip') ||
             lowerResponse.includes('update your status') || lowerResponse.includes('letting me know')) {
      responseType = 'no';
      responseMessage = sanitizeString(`${finalCustomerName} declined attendance: "${validated.question}"`, 500);
      console.log('❌ NEGATIVE response detected');
    }

    // Store the response in database if detected and phone is valid
    if (responseType && finalCustomerPhone && validatePhoneNumber(finalCustomerPhone)) {
      try {
        console.log('💾 Storing response in database');

        const { error: insertError } = await supabase
          .from('meeting_responses')
          .insert({
            customer_name: finalCustomerName,
            customer_phone: finalCustomerPhone,
            call_sid: finalCallSid,
            response_type: responseType,
            response_message: responseMessage
          });

        if (insertError) {
          console.error('❌ Error storing meeting response:', insertError);
        } else {
          console.log(`✅ Successfully stored meeting response: ${finalCustomerName} - ${responseType}`);
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
      }
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      customerName: finalCustomerName,
      responseType,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ChatGPT assistant:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred processing your request',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
