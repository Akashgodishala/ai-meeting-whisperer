-- Fix RLS policies to prevent unauthorized access to customer personal data
-- Handle existing policies carefully

-- FIX 1: call_sessions table
-- Remove the overly permissive policy that allows any authenticated user to see all call sessions
DROP POLICY IF EXISTS "Authenticated users can view call sessions" ON public.call_sessions;

-- FIX 2: meeting_responses table  
-- Remove the overly permissive policy that allows any authenticated user to see all meeting responses
DROP POLICY IF EXISTS "Authenticated users can view meeting responses" ON public.meeting_responses;

-- Add service role DELETE policies only if they don't exist
DO $$
BEGIN
    -- Check and add DELETE policy for meeting_responses
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'meeting_responses' 
        AND policyname = 'Service role can delete meeting responses'
    ) THEN
        CREATE POLICY "Service role can delete meeting responses" 
        ON public.meeting_responses 
        FOR DELETE 
        USING (auth.role() = 'service_role'::text);
    END IF;

    -- Add service role policy for automated_meetings if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'automated_meetings' 
        AND policyname = 'Service role can manage all meetings'
    ) THEN
        CREATE POLICY "Service role can manage all meetings" 
        ON public.automated_meetings 
        FOR ALL 
        USING (auth.role() = 'service_role'::text);
    END IF;
END
$$;