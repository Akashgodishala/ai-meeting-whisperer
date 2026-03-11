import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Manual automation trigger received');
    
    // Call the automated meeting reminder function
    const automationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/automated-meeting-reminder`;
    
    const response = await fetch(automationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({
        trigger: 'manual',
        timestamp: new Date().toISOString()
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Automation trigger failed');
    }

    console.log('✅ Automation completed:', result);

    return new Response(JSON.stringify({
      success: true,
      ...result,
      message: 'Automation triggered successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Automation trigger error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});