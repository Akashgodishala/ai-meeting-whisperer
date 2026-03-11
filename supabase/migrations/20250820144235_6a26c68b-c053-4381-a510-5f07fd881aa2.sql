-- Fix RLS policies for voice_transactions table to prevent unauthorized access to customer data

-- First, let's examine current policies
-- The voice_transactions table currently has:
-- 1. "Retailers can view their own transactions" (SELECT)
-- 2. "Service role can manage transactions" (ALL)

-- The issue is that we need to ensure COMPLETE access control
-- Let's add missing INSERT, UPDATE, DELETE policies and strengthen existing ones

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Retailers can view their own transactions" ON public.voice_transactions;
DROP POLICY IF EXISTS "Service role can manage transactions" ON public.voice_transactions;

-- Create comprehensive RLS policies for voice_transactions

-- 1. Service role can manage all transactions (for system operations)
CREATE POLICY "Service role can manage all transactions" 
ON public.voice_transactions 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- 2. Retailers can only view their own transactions
CREATE POLICY "Retailers can view their own transactions" 
ON public.voice_transactions 
FOR SELECT 
USING (
  retailer_id IN (
    SELECT retailer_profiles.id 
    FROM retailer_profiles 
    WHERE retailer_profiles.user_id = auth.uid()
  )
);

-- 3. Retailers cannot insert transactions directly (only service role via API)
CREATE POLICY "Only service role can insert transactions" 
ON public.voice_transactions 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role'::text);

-- 4. Retailers cannot update transactions directly (only service role via API)
CREATE POLICY "Only service role can update transactions" 
ON public.voice_transactions 
FOR UPDATE 
USING (auth.role() = 'service_role'::text);

-- 5. Retailers cannot delete transactions directly (only service role via API)
CREATE POLICY "Only service role can delete transactions" 
ON public.voice_transactions 
FOR DELETE 
USING (auth.role() = 'service_role'::text);

-- Ensure RLS is enabled (it should already be)
ALTER TABLE public.voice_transactions ENABLE ROW LEVEL SECURITY;