-- Fix RLS policies to prevent unauthorized access to customer personal data
-- Tables affected: call_sessions, meeting_responses
-- Issues: Overly permissive policies allowing any authenticated user to access customer data

-- FIX 1: call_sessions table
-- Remove the overly permissive "Authenticated users can view call sessions" policy
DROP POLICY IF EXISTS "Authenticated users can view call sessions" ON public.call_sessions;

-- The existing "Retailers can view their call sessions" policy is properly secured
-- The existing "Service role can insert/update call sessions" policies are needed for system operations

-- Add missing DELETE policy for completeness
CREATE POLICY "Service role can delete call sessions" 
ON public.call_sessions 
FOR DELETE 
USING (auth.role() = 'service_role'::text);

-- FIX 2: meeting_responses table  
-- Remove the overly permissive "Authenticated users can view meeting responses" policy
DROP POLICY IF EXISTS "Authenticated users can view meeting responses" ON public.meeting_responses;

-- The existing policies are:
-- - "Service role can insert/update meeting responses" (needed for system operations)
-- - "Users can view their meeting responses" (properly checks customer_phone against user's meetings)

-- Add missing DELETE policy for completeness
CREATE POLICY "Service role can delete meeting responses" 
ON public.meeting_responses 
FOR DELETE 
USING (auth.role() = 'service_role'::text);

-- FIX 3: Strengthen automated_meetings policies (already secure but ensure completeness)
-- Current policies are properly secured with user_id checks, just ensure service role access

-- Add service role policy for automated_meetings if it doesn't exist
DO $$
BEGIN
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

-- FIX 4: Ensure customers table has complete policies
-- Add INSERT policy for retailers to add their own customers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'customers' 
        AND policyname = 'Retailers can insert their own customers'
    ) THEN
        CREATE POLICY "Retailers can insert their own customers" 
        ON public.customers 
        FOR INSERT 
        WITH CHECK (
          id IN (
            SELECT retailer_customers.id
            FROM retailer_customers
            JOIN retailer_profiles ON retailer_customers.retailer_id = retailer_profiles.id
            WHERE retailer_profiles.user_id = auth.uid()
          )
        );
    END IF;
END
$$;

-- Add UPDATE policy for retailers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'customers' 
        AND policyname = 'Retailers can update their own customers'
    ) THEN
        CREATE POLICY "Retailers can update their own customers" 
        ON public.customers 
        FOR UPDATE 
        USING (
          id IN (
            SELECT retailer_customers.id
            FROM retailer_customers
            JOIN retailer_profiles ON retailer_customers.retailer_id = retailer_profiles.id
            WHERE retailer_profiles.user_id = auth.uid()
          )
        );
    END IF;
END
$$;

-- Add DELETE policy for retailers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'customers' 
        AND policyname = 'Retailers can delete their own customers'
    ) THEN
        CREATE POLICY "Retailers can delete their own customers" 
        ON public.customers 
        FOR DELETE 
        USING (
          id IN (
            SELECT retailer_customers.id
            FROM retailer_customers
            JOIN retailer_profiles ON retailer_customers.retailer_id = retailer_profiles.id
            WHERE retailer_profiles.user_id = auth.uid()
          )
        );
    END IF;
END
$$;