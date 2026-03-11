-- Security fix: Secure customer personal information access
-- This migration fixes exposed customer data in multiple tables

-- 1. Fix customers table - remove public access, require authentication
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

-- Create secure policies for customers table
CREATE POLICY "Service role can manage customers" ON public.customers
FOR ALL USING (auth.role() = 'service_role');

-- 2. Fix call_sessions table - remove public read access
DROP POLICY IF EXISTS "Anyone can read call sessions" ON public.call_sessions;

-- Create secure policy for call_sessions
CREATE POLICY "Authenticated users can view call sessions" ON public.call_sessions
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. Fix meeting_responses table - remove public read access  
DROP POLICY IF EXISTS "Anyone can read meeting responses" ON public.meeting_responses;

-- Create secure policy for meeting_responses
CREATE POLICY "Authenticated users can view meeting responses" ON public.meeting_responses
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 4. Fix document_chunks table - remove public access
DROP POLICY IF EXISTS "Authenticated users can view all document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Authenticated users can insert document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Authenticated users can update document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Authenticated users can delete document chunks" ON public.document_chunks;

-- Create secure policies for document_chunks
CREATE POLICY "Service role can manage document chunks" ON public.document_chunks
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view document chunks" ON public.document_chunks
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Fix site_content table - remove overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage site content" ON public.site_content;

-- Create more restrictive policy for site_content management
CREATE POLICY "Admins can manage site content" ON public.site_content
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Ensure RLS is enabled on all affected tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.meeting_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;