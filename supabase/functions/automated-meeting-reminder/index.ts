import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VAPICredentials {
  apiKey: string;
  assistantId: string;
  phoneNumberId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🤖 Starting automated meeting reminder process...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time
    const now = new Date();
    const nowPlus5Min = new Date(now.getTime() + 5 * 60 * 1000);

    console.log(`⏰ Checking for reminders between ${now.toISOString()} and ${nowPlus5Min.toISOString()}`);

    // Find all pending reminders that should be sent now
    const { data: pendingReminders, error: remindersError } = await supabase
      .from('meeting_reminder_schedules')
      .select(`
        *,
        automated_meetings!inner (
          *,
          automated_reminder_settings!left (*)
        )
      `)
      .eq('status', 'pending')
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', nowPlus5Min.toISOString());

    if (remindersError) {
      console.error('❌ Error fetching pending reminders:', remindersError);
      throw remindersError;
    }

    console.log(`📋 Found ${pendingReminders?.length || 0} pending reminders`);

    if (!pendingReminders?.length) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending reminders to process',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let failed = 0;

    // Process each reminder
    for (const reminder of pendingReminders) {
      try {
        console.log(`📞 Processing reminder ${reminder.id} for meeting ${reminder.meeting_id}`);
        
        const meeting = reminder.automated_meetings;
        const settings = meeting.automated_reminder_settings?.[0];

        // Check business hours if enabled
        if (settings?.business_hours_only) {
          const meetingTime = new Date(reminder.scheduled_time);
          const hour = meetingTime.getHours();
          const startHour = parseInt(settings.business_start_time?.split(':')[0] || '9');
          const endHour = parseInt(settings.business_end_time?.split(':')[0] || '17');
          
          if (hour < startHour || hour >= endHour) {
            console.log(`⏰ Skipping reminder ${reminder.id} - outside business hours`);
            
            // Reschedule to next business hour
            const nextBusinessTime = new Date(meetingTime);
            nextBusinessTime.setHours(startHour, 0, 0, 0);
            if (nextBusinessTime <= meetingTime) {
              nextBusinessTime.setDate(nextBusinessTime.getDate() + 1);
            }
            
            await supabase
              .from('meeting_reminder_schedules')
              .update({ 
                scheduled_time: nextBusinessTime.toISOString(),
                notes: 'Rescheduled to business hours'
              })
              .eq('id', reminder.id);
            
            continue;
          }
        }

        // Prepare reminder message
        const reminderMessage = (settings?.reminder_message_template || 
          'Hi {customer_name}, this is a friendly reminder about your upcoming meeting "{meeting_title}" scheduled for {meeting_date} at {meeting_time}. Please confirm your attendance by saying "yes" or press 1 to confirm, 2 to reschedule, or 3 to cancel.')
          .replace('{customer_name}', meeting.customer_name)
          .replace('{meeting_title}', meeting.title)
          .replace('{meeting_date}', new Date(meeting.meeting_date).toLocaleDateString())
          .replace('{meeting_time}', new Date(meeting.meeting_date).toLocaleTimeString());

        // Make the call using VAPI
        const callResult = await makeVAPICall({
          customerName: meeting.customer_name,
          customerPhone: meeting.customer_phone,
          message: reminderMessage,
          assistantId: settings?.voice_agent_id || 'default'
        });

        if (callResult.success) {
          // Update reminder status
          await supabase
            .from('meeting_reminder_schedules')
            .update({ 
              status: 'sent',
              call_id: callResult.callId,
              notes: `Call initiated successfully at ${now.toISOString()}`
            })
            .eq('id', reminder.id);

          // Log the call
          await supabase
            .from('meeting_call_logs')
            .insert({
              meeting_id: reminder.meeting_id,
              reminder_schedule_id: reminder.id,
              call_id: callResult.callId,
              call_type: 'reminder',
              call_status: 'initiated'
            });

          console.log(`✅ Successfully processed reminder ${reminder.id}`);
          processed++;
        } else {
          throw new Error(callResult.error || 'Unknown call error');
        }

      } catch (error) {
        console.error(`❌ Failed to process reminder ${reminder.id}:`, error);
        
        // Update reminder status to failed
        await supabase
          .from('meeting_reminder_schedules')
          .update({ 
            status: 'failed',
            notes: `Failed: ${error.message}`
          })
          .eq('id', reminder.id);

        failed++;

        // Schedule retry if within retry limits
        const meeting = reminder.automated_meetings;
        const settings = meeting.automated_reminder_settings?.[0];
        const maxRetries = settings?.max_retry_attempts || 2;
        const retryInterval = settings?.retry_interval_minutes || 15;
        
        if ((reminder.notes?.match(/retry/g) || []).length < maxRetries) {
          const retryTime = new Date(now.getTime() + retryInterval * 60 * 1000);
          
          await supabase
            .from('meeting_reminder_schedules')
            .insert({
              meeting_id: reminder.meeting_id,
              reminder_type: `${reminder.reminder_type}_retry`,
              scheduled_time: retryTime.toISOString(),
              status: 'pending',
              notes: `Retry attempt ${((reminder.notes?.match(/retry/g) || []).length + 1)}`
            });
          
          console.log(`🔄 Scheduled retry for reminder ${reminder.id} at ${retryTime.toISOString()}`);
        }
      }
    }

    console.log(`🎯 Automation complete: ${processed} processed, ${failed} failed`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed,
      failed,
      message: `Processed ${processed} reminders, ${failed} failed`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Automation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function makeVAPICall({ customerName, customerPhone, message, assistantId }: {
  customerName: string;
  customerPhone: string;
  message: string;
  assistantId: string;
}): Promise<{ success: boolean; callId?: string; error?: string }> {
  try {
    const vapiApiKey = Deno.env.get('VAPI_API_KEY');
    if (!vapiApiKey) {
      throw new Error('VAPI_API_KEY not configured');
    }

    console.log(`📞 Initiating VAPI call to ${customerPhone} for ${customerName}`);

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Meeting Reminder - ${customerName}`,
        assistantId: assistantId,
        customer: {
          number: customerPhone,
          name: customerName,
        },
        phoneNumberId: Deno.env.get('VAPI_PHONE_NUMBER_ID'),
        assistant: {
          firstMessage: message,
          model: {
            provider: 'openai',
            model: 'gpt-4.1-2025-04-14',
            temperature: 0.7,
            maxTokens: 300,
          },
          voice: {
            provider: 'playht',
            voiceId: 'jennifer',
          },
          transcriber: {
            provider: 'deepgram',
            model: 'nova-2',
            language: 'en-US',
          },
          recordingEnabled: true,
          endCallFunctionEnabled: true,
          functions: [
            {
              name: 'confirmMeeting',
              description: 'Confirm or update meeting attendance',
              parameters: {
                type: 'object',
                properties: {
                  response: {
                    type: 'string',
                    enum: ['confirmed', 'reschedule', 'cancel'],
                    description: 'Customer response to meeting reminder'
                  },
                  notes: {
                    type: 'string',
                    description: 'Additional notes from customer'
                  }
                },
                required: ['response']
              }
            }
          ]
        }
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'VAPI call failed');
    }

    return {
      success: true,
      callId: result.id
    };

  } catch (error) {
    console.error('❌ VAPI call error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}