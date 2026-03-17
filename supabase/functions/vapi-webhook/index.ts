import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';
import { encode as hexEncode } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vapi-secret',
};

// Input validation functions
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function sanitizeString(str: string, maxLength: number): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// VAPI webhook secret validation
async function validateVAPISignature(secret: string, payload: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computedSignature = new TextDecoder().decode(hexEncode(new Uint8Array(signatureBuffer)));
    
    return computedSignature === signature;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

// Function to extract customer response from transcript
function extractCustomerResponse(transcript: string): { responseType: string, message: string } {
  if (!transcript) {
    return { responseType: 'unknown', message: '' };
  }

  const lowerTranscript = transcript.toLowerCase();
  
  // Look for positive responses
  const positivePatterns = [
    /\b(yes|yeah|yep|sure|ok|okay|absolutely|definitely|of course|i will|i'll be there|count me in)\b/i,
    /\bi can attend\b/i,
    /\bi'll attend\b/i,
    /\bi will be there\b/i
  ];
  
  // Look for negative responses  
  const negativePatterns = [
    /\b(no|nope|can't|cannot|won't|will not|not attending|unavailable|busy)\b/i,
    /\bi can't attend\b/i,
    /\bi won't attend\b/i,
    /\bi will not be there\b/i,
    /\bi'm not available\b/i
  ];

  // Extract the customer's part of the conversation (filter out assistant messages)
  const customerMessages = transcript
    .split('\n')
    .filter(line => !line.toLowerCase().includes('assistant:') && !line.toLowerCase().includes('system:'))
    .join(' ');

  let responseType = 'unknown';
  let matchedText = '';

  // Check for positive responses first
  for (const pattern of positivePatterns) {
    const match = customerMessages.match(pattern);
    if (match) {
      responseType = 'yes';
      matchedText = match[0];
      break;
    }
  }

  // If no positive response found, check for negative responses
  if (responseType === 'unknown') {
    for (const pattern of negativePatterns) {
      const match = customerMessages.match(pattern);
      if (match) {
        responseType = 'no';
        matchedText = match[0];
        break;
      }
    }
  }

  // Extract a meaningful response message (try to get context around the match)
  let responseMessage = matchedText;
  if (matchedText && customerMessages.includes(matchedText)) {
    const sentences = customerMessages.split(/[.!?]+/);
    const matchingSentence = sentences.find(sentence => 
      sentence.toLowerCase().includes(matchedText.toLowerCase())
    );
    if (matchingSentence) {
      responseMessage = matchingSentence.trim();
    }
  }

  return {
    responseType,
    message: responseMessage || (responseType !== 'unknown' ? `Customer said: ${matchedText}` : 'No clear response detected')
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const vapiWebhookSecret = Deno.env.get('VAPI_WEBHOOK_SECRET');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }

    // Get raw body for signature validation
    const rawBody = await req.text();
    
    // Validate VAPI webhook secret
    const vapiSecret = req.headers.get('x-vapi-secret');
    const vapiSignature = req.headers.get('x-vapi-signature');
    
    if (vapiWebhookSecret) {
      // Check x-vapi-secret header (simple secret validation)
      if (vapiSecret && vapiSecret !== vapiWebhookSecret) {
        console.error('Invalid VAPI secret - request rejected');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check x-vapi-signature header (HMAC validation)
      if (vapiSignature && !vapiSecret) {
        const isValid = await validateVAPISignature(vapiWebhookSecret, rawBody, vapiSignature);
        if (!isValid) {
          console.error('Invalid VAPI signature - request rejected');
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      if (!vapiSecret && !vapiSignature) {
        console.warn('⚠️ No VAPI authentication header - request may not be from VAPI');
      } else {
        console.log('✅ VAPI webhook authenticated');
      }
    } else {
      console.warn('⚠️ VAPI_WEBHOOK_SECRET not configured - skipping signature validation');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = JSON.parse(rawBody);
    console.log('🔔 VAPI Webhook received:', JSON.stringify(payload, null, 2));

    const { 
      type, 
      call, 
      artifact,
      transcript,
      recordingUrl,
      summary 
    } = payload;

    // Input validation
    if (!call?.id) {
      console.log('⚠️ No call ID in webhook payload');
      return new Response(JSON.stringify({ success: false, error: 'No call ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and sanitize inputs
    const callId = sanitizeString(call.id, 100);
    const customerPhone = call.customer?.number || call.phoneNumber || '';
    const sanitizedPhone = validatePhoneNumber(customerPhone) ? customerPhone.slice(0, 20) : '';
    const customerName = sanitizeString(call.customer?.name || 'Unknown Customer', 100);

    console.log(`📞 Processing webhook for call ${callId} - Type: ${type}`);

    // Handle different webhook types
    switch (type) {
      case 'call-started':
      case 'call.started':
        console.log(`🚀 Call started: ${callId}`);
        await supabase
          .from('call_sessions')
          .upsert({
            call_id: callId,
            customer_name: customerName,
            customer_phone: sanitizedPhone,
            status: 'in_progress',
            start_time: new Date().toISOString(),
            metadata: { 
              webhook_type: type,
              call_data: call 
            }
          });
        break;

      case 'call-ended':
      case 'call.ended':
        console.log(`🏁 Call ended: ${callId}`);
        
        const endTime = new Date().toISOString();
        const startTime = call.startedAt || call.createdAt;
        let duration = 0;
        
        if (startTime) {
          duration = Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
        }

        // Extract transcript from messages
        let fullTranscript = '';
        if (call.messages && Array.isArray(call.messages)) {
          fullTranscript = call.messages
            .map((msg: any) => `${msg.role || 'unknown'}: ${sanitizeString(msg.message || msg.content || '', 10000)}`)
            .join('\n');
        } else if (transcript) {
          fullTranscript = sanitizeString(transcript, 50000);
        }

        await supabase
          .from('call_sessions')
          .upsert({
            call_id: callId,
            customer_name: customerName,
            customer_phone: sanitizedPhone,
            status: call.status === 'ended' ? 'completed' : call.status || 'completed',
            end_time: endTime,
            duration,
            recording_url: sanitizeString(recordingUrl || call.recordingUrl || '', 500),
            transcript: fullTranscript,
            metadata: { 
              webhook_type: type,
              call_data: call,
              artifact,
              summary 
            }
          });

        // Enhanced response analysis and logging
        if (fullTranscript) {
          console.log(`🔍 Analyzing transcript for customer response...`);
          const response = extractCustomerResponse(fullTranscript);
          
          // Calculate response confidence score
          const confidenceScore = response.responseType === 'unknown' ? 0.1 : 
                                response.responseType === 'yes' ? 0.9 : 0.8;
          
          // Update call analytics with detailed info
          await supabase
            .from('call_analytics')
            .upsert({
              call_id: callId,
              customer_phone: sanitizedPhone,
              call_duration: duration,
              response_detected: response.responseType !== 'unknown',
              response_confidence: confidenceScore,
              call_success: call.status === 'ended' && response.responseType !== 'unknown',
              error_reason: call.status !== 'ended' ? 'Call not completed normally' : null
            });
          
          if (response.responseType !== 'unknown') {
            console.log(`📝 Customer response detected: ${response.responseType} - "${response.message}"`);
            
            // Check if this response already exists to avoid duplicates
            const { data: existingResponse } = await supabase
              .from('meeting_responses')
              .select('id')
              .eq('customer_phone', sanitizedPhone)
              .eq('call_sid', callId)
              .single();

            if (!existingResponse) {
              await supabase
                .from('meeting_responses')
                .insert({
                  customer_name: customerName,
                  customer_phone: sanitizedPhone,
                  call_sid: callId,
                  response_type: response.responseType,
                  response_message: sanitizeString(response.message, 500)
                });
              
              // Also update the related meeting status if found
              const { data: meeting } = await supabase
                .from('automated_meetings')
                .select('id')
                .eq('customer_phone', sanitizedPhone)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              if (meeting) {
                const meetingStatus = response.responseType === 'yes' ? 'confirmed' : 
                                    response.responseType === 'no' ? 'declined' : 'completed';
                
                await supabase
                  .from('automated_meetings')
                  .update({ status: meetingStatus })
                  .eq('id', meeting.id);
              }
            }
          } else {
            console.log(`⚠️ No clear response detected in transcript`);
            
            // Still log the call analytics for no response
            await supabase
              .from('call_analytics')
              .upsert({
                call_id: callId,
                customer_phone: sanitizedPhone,
                call_duration: duration,
                response_detected: false,
                response_confidence: 0.0,
                call_success: false,
                error_reason: 'No clear customer response detected'
              });
          }
        }
        
        // ── ORDER DETECTION AND PROCESSING ──────────────────────────────
        // If the AI confirmed an order during the call, create it and send SMS
        if (fullTranscript && fullTranscript.includes('ORDER_CONFIRMED')) {
          console.log('🛒 ORDER_CONFIRMED detected in transcript — creating order');

          const retailerId = call.metadata?.retailer_id || payload.metadata?.retailer_id || '';
          const callerName = call.metadata?.customer_name || customerName;
          const callerPhone = call.metadata?.customer_phone || sanitizedPhone;
          const callerBusinessName = call.metadata?.business_name || '';

          // Extract order details after ORDER_CONFIRMED
          const orderMatch = fullTranscript.match(/ORDER_CONFIRMED[:\s]*(.+?)(?:\n|$)/i);
          const orderDetails = orderMatch ? orderMatch[1].trim() : 'Order from phone call';

          // Determine pickup vs delivery
          const lowerTranscript = fullTranscript.toLowerCase();
          const isDelivery = lowerTranscript.includes('delivery') || lowerTranscript.includes('deliver');
          const orderType = isDelivery ? 'delivery' : 'pickup';
          const estimatedTime = '15-20 minutes';

          // Try to look up retailer for payment link and notification
          let retailerPhone = '';
          let paymentLink = '';

          if (retailerId) {
            const { data: retailer } = await supabase
              .from('retailer_profiles')
              .select('phone, payment_methods, business_name')
              .eq('id', retailerId)
              .single();

            if (retailer) {
              retailerPhone = retailer.phone || '';
              const pm = retailer.payment_methods as Record<string, string> | null;
              paymentLink = pm?.payment_link || pm?.stripe_link || '';
              if (!callerBusinessName && retailer.business_name) {
                // use retailer name for SMS
              }
            }
          }

          // Create the order in the database
          const serviceFee = isDelivery ? 3.00 : 0;
          const totalAmount = 25.00 + serviceFee; // Base amount; real amount comes from inventory matching

          const { data: newOrder, error: orderError } = await supabase
            .from('retailer_orders')
            .insert({
              retailer_id: retailerId || null,
              customer_name: callerName,
              customer_phone: callerPhone,
              order_type: orderType,
              items: [{ name: 'Order from call', details: orderDetails, price: 25.00, quantity: 1 }],
              subtotal: 25.00,
              service_fee: serviceFee,
              driver_tip: 0,
              total_amount: totalAmount,
              order_status: 'confirmed',
              estimated_time: estimatedTime,
              payment_status: 'pending',
              payment_link_url: paymentLink,
              notes: `Auto-created from VAPI call ${callId}. Transcript: ${orderDetails.substring(0, 300)}`,
              call_session_id: callId,
            })
            .select()
            .single();

          if (orderError) {
            console.error('❌ Failed to create order from webhook:', orderError);
          } else {
            console.log('✅ Order created from call:', newOrder.id);

            // Send SMS to CUSTOMER with payment link
            if (callerPhone) {
              const customerMsg = paymentLink
                ? `Hi ${callerName}! Your order from ${callerBusinessName || 'us'} is confirmed. Total: $${totalAmount.toFixed(2)}. ${orderType === 'delivery' ? 'Estimated delivery' : 'Ready for pickup in'}: ${estimatedTime}. Pay here: ${paymentLink}`
                : `Hi ${callerName}! Your order from ${callerBusinessName || 'us'} is confirmed. Total: $${totalAmount.toFixed(2)}. ${orderType === 'delivery' ? 'Estimated delivery' : 'Ready for pickup in'}: ${estimatedTime}. We will send you payment details shortly.`;

              try {
                const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
                const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
                const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER');

                if (twilioSid && twilioAuth && twilioFrom) {
                  const formData = new URLSearchParams();
                  formData.append('To', callerPhone);
                  formData.append('From', twilioFrom);
                  formData.append('Body', customerMsg);
                  const smsResp = await fetch(
                    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                      },
                      body: formData,
                    }
                  );
                  console.log(smsResp.ok ? '✅ Customer SMS sent' : '❌ Customer SMS failed');
                }
              } catch (e) { console.error('SMS error:', e); }
            }

            // Send SMS to RETAILER
            if (retailerPhone) {
              try {
                const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
                const twilioAuth = Deno.env.get('TWILIO_AUTH_TOKEN');
                const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER');

                if (twilioSid && twilioAuth && twilioFrom) {
                  const retailerMsg = `NEW ORDER!\nCustomer: ${callerName} (${callerPhone})\nDetails: ${orderDetails.substring(0, 200)}\nType: ${orderType.toUpperCase()}\nTotal: $${totalAmount.toFixed(2)}\nReady in: ${estimatedTime}`;
                  const formData = new URLSearchParams();
                  formData.append('To', retailerPhone);
                  formData.append('From', twilioFrom);
                  formData.append('Body', retailerMsg);
                  await fetch(
                    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Basic ${btoa(`${twilioSid}:${twilioAuth}`)}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                      },
                      body: formData,
                    }
                  );
                  console.log('✅ Retailer notified via SMS');
                }
              } catch (e) { console.error('Retailer SMS error:', e); }
            }
          }
        }

        console.log(`✅ Call session updated: ${callId} - Duration: ${duration}s`);
        break;

      case 'call-failed':
      case 'call.failed':
        console.log(`❌ Call failed: ${callId}`);
        await supabase
          .from('call_sessions')
          .upsert({
            call_id: callId,
            customer_name: customerName,
            customer_phone: sanitizedPhone,
            status: 'failed',
            end_time: new Date().toISOString(),
            metadata: { 
              webhook_type: type,
              call_data: call,
              error: call.error || 'Call failed'
            }
          });
        break;

      case 'transcript':
        console.log(`📝 Transcript update for call: ${callId}`);
        // Update transcript in real-time if needed
        if (transcript) {
          await supabase
            .from('call_sessions')
            .update({
              transcript: sanitizeString(transcript, 50000),
              metadata: { 
                webhook_type: type,
                last_transcript_update: new Date().toISOString()
              }
            })
            .eq('call_id', callId);
        }
        break;

      default:
        console.log(`ℹ️ Unhandled webhook type: ${type} for call ${callId}`);
        // Store the webhook data for debugging
        await supabase
          .from('call_sessions')
          .upsert({
            call_id: callId,
            customer_name: customerName,
            customer_phone: sanitizedPhone,
            status: 'unknown',
            metadata: { 
              webhook_type: type,
              call_data: call,
              raw_payload: payload
            }
          });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${type} webhook for call ${callId}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error processing VAPI webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
