-- Comprehensive security fix for exposed customer data
-- This migration secures all tables with public access to customer data

-- 1. Fix customers table - Remove public access, add retailer-specific access
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON customers;

-- Customers should only be accessible by retailers they belong to
CREATE POLICY "Retailers can view their own customers" 
ON customers 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT retailer_customers.id 
    FROM retailer_customers 
    JOIN retailer_profiles ON retailer_customers.retailer_id = retailer_profiles.id
    WHERE retailer_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage customers" 
ON customers 
FOR ALL 
TO service_role
USING (true);

-- 2. Fix call_sessions table - Remove public access
DROP POLICY IF EXISTS "Anyone can read call sessions" ON call_sessions;

CREATE POLICY "Retailers can view their call sessions" 
ON call_sessions 
FOR SELECT 
TO authenticated
USING (
  customer_phone IN (
    SELECT retailer_customers.phone 
    FROM retailer_customers 
    JOIN retailer_profiles ON retailer_customers.retailer_id = retailer_profiles.id
    WHERE retailer_profiles.user_id = auth.uid()
  )
);

-- 3. Fix meeting_responses table - Remove public access
DROP POLICY IF EXISTS "Anyone can read meeting responses" ON meeting_responses;

CREATE POLICY "Users can view their meeting responses" 
ON meeting_responses 
FOR SELECT 
TO authenticated
USING (
  customer_phone IN (
    SELECT automated_meetings.customer_phone 
    FROM automated_meetings 
    WHERE automated_meetings.user_id = auth.uid()
  )
);

-- 4. Fix document_chunks table - Remove global authenticated access
DROP POLICY IF EXISTS "Authenticated users can view all document chunks" ON document_chunks;
DROP POLICY IF EXISTS "Authenticated users can insert document chunks" ON document_chunks;
DROP POLICY IF EXISTS "Authenticated users can update document chunks" ON document_chunks;
DROP POLICY IF EXISTS "Authenticated users can delete document chunks" ON document_chunks;

-- Document chunks should be user-specific
CREATE POLICY "Users can manage their own document chunks" 
ON document_chunks 
FOR ALL 
TO authenticated
USING (
  filename LIKE concat(auth.uid()::text, '_%')
);

CREATE POLICY "Service role can manage all document chunks" 
ON document_chunks 
FOR ALL 
TO service_role
USING (true);

-- 5. Restrict site_content access (keep public read but limit management)
DROP POLICY IF EXISTS "Authenticated users can manage site content" ON site_content;

CREATE POLICY "Admins can manage site content" 
ON site_content 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Revoke any remaining public access
REVOKE ALL ON customers FROM anon;
REVOKE ALL ON customers FROM public;
REVOKE ALL ON call_sessions FROM anon;
REVOKE ALL ON call_sessions FROM public;
REVOKE ALL ON meeting_responses FROM anon;
REVOKE ALL ON meeting_responses FROM public;
REVOKE ALL ON document_chunks FROM anon;
REVOKE ALL ON document_chunks FROM public;