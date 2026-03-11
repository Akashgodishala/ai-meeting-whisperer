-- Security fix: Secure remaining customer data exposure issues
-- Skip policies that already exist and focus on missing ones

-- 1. Fix call_sessions table - remove public read access if it exists
DROP POLICY IF EXISTS "Anyone can read call sessions" ON public.call_sessions;

-- Create secure policy for call_sessions (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'call_sessions' 
    AND policyname = 'Authenticated users can view call sessions'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view call sessions" ON public.call_sessions FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- 2. Fix meeting_responses table - remove public read access
DROP POLICY IF EXISTS "Anyone can read meeting responses" ON public.meeting_responses;

-- Create secure policy for meeting_responses (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'meeting_responses' 
    AND policyname = 'Authenticated users can view meeting responses'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view meeting responses" ON public.meeting_responses FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- 3. Fix document_chunks table policies
DROP POLICY IF EXISTS "Authenticated users can view all document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Authenticated users can insert document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Authenticated users can update document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Authenticated users can delete document chunks" ON public.document_chunks;

-- Create secure policies for document_chunks (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_chunks' 
    AND policyname = 'Service role can manage document chunks'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role can manage document chunks" ON public.document_chunks FOR ALL USING (auth.role() = ''service_role'')';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'document_chunks' 
    AND policyname = 'Authenticated users can view document chunks'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can view document chunks" ON public.document_chunks FOR SELECT USING (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- 4. Fix site_content table management policy
DROP POLICY IF EXISTS "Authenticated users can manage site content" ON public.site_content;

-- Create admin-only management policy (only if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'site_content' 
    AND policyname = 'Admins can manage site content'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage site content" ON public.site_content FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin''))';
  END IF;
END $$;

-- Ensure RLS is enabled on all affected tables
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.meeting_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;