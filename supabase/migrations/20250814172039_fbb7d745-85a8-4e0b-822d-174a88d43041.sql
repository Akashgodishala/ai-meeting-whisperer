-- Fix security issue: Ensure voice_transactions table has proper RLS policies
-- This migration removes any overly permissive policies and ensures only authorized access

-- First, drop any existing overly permissive policies if they exist
DROP POLICY IF EXISTS "Anyone can read voice_transactions" ON voice_transactions;
DROP POLICY IF EXISTS "Public read access" ON voice_transactions;

-- Ensure RLS is enabled
ALTER TABLE voice_transactions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Retailers can only view their own transactions
CREATE POLICY "Retailers can view their own transactions" 
ON voice_transactions 
FOR SELECT 
TO authenticated
USING (
  retailer_id IN (
    SELECT retailer_profiles.id 
    FROM retailer_profiles 
    WHERE retailer_profiles.user_id = auth.uid()
  )
);

-- Policy 2: Service role can manage all transactions (for system operations)
CREATE POLICY "Service role can manage all transactions" 
ON voice_transactions 
FOR ALL 
TO service_role
USING (true);

-- Policy 3: Retailers can insert transactions for their own store
CREATE POLICY "Retailers can insert their own transactions" 
ON voice_transactions 
FOR INSERT 
TO authenticated
WITH CHECK (
  retailer_id IN (
    SELECT retailer_profiles.id 
    FROM retailer_profiles 
    WHERE retailer_profiles.user_id = auth.uid()
  )
);

-- Policy 4: Retailers can update their own transactions
CREATE POLICY "Retailers can update their own transactions" 
ON voice_transactions 
FOR UPDATE 
TO authenticated
USING (
  retailer_id IN (
    SELECT retailer_profiles.id 
    FROM retailer_profiles 
    WHERE retailer_profiles.user_id = auth.uid()
  )
);

-- Ensure no public access exists
REVOKE ALL ON voice_transactions FROM anon;
REVOKE ALL ON voice_transactions FROM public;