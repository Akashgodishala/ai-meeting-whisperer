-- Fix RLS policies for customers and document_chunks tables

-- 1. CUSTOMERS TABLE - Add proper user ownership and strict RLS
-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'customers' 
                 AND column_name = 'user_id') THEN
    ALTER TABLE public.customers ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Drop all existing policies on customers table
DROP POLICY IF EXISTS "Retailers can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Retailers can insert their own customers" ON public.customers;
DROP POLICY IF EXISTS "Retailers can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Retailers can delete their own customers" ON public.customers;
DROP POLICY IF EXISTS "Customers table deprecated - use retailer_customers" ON public.customers;
DROP POLICY IF EXISTS "Service role can manage customers for migrations" ON public.customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON public.customers;

-- Create strict owner-based policies
CREATE POLICY "Users can view their own customers"
ON public.customers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customers"
ON public.customers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers"
ON public.customers
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customers"
ON public.customers
FOR DELETE
USING (auth.uid() = user_id);

-- Service role for edge functions
CREATE POLICY "Service role full access to customers"
ON public.customers
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 2. DOCUMENT_CHUNKS TABLE - Add user ownership and strict RLS
-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'document_chunks' 
                 AND column_name = 'user_id') THEN
    ALTER TABLE public.document_chunks ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Drop all existing policies on document_chunks table
DROP POLICY IF EXISTS "Authenticated users can view document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Service role can manage all document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Service role can manage document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can manage their own document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can view their own document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can insert their own document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can update their own document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Users can delete their own document chunks" ON public.document_chunks;

-- Create strict owner-based policies
CREATE POLICY "Users can view own document chunks"
ON public.document_chunks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document chunks"
ON public.document_chunks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document chunks"
ON public.document_chunks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own document chunks"
ON public.document_chunks
FOR DELETE
USING (auth.uid() = user_id);

-- Service role for edge functions
CREATE POLICY "Service role full access to document_chunks"
ON public.document_chunks
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');