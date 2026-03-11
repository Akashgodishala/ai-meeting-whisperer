-- Enable Row Level Security on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policy for customers table - allow authenticated users to manage customer data
CREATE POLICY "Authenticated users can view all customers" 
ON public.customers 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert customers" 
ON public.customers 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers" 
ON public.customers 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete customers" 
ON public.customers 
FOR DELETE 
TO authenticated 
USING (true);

-- Enable Row Level Security on document_chunks table
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Create policy for document_chunks table - allow authenticated users to manage document chunks
CREATE POLICY "Authenticated users can view all document chunks" 
ON public.document_chunks 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert document chunks" 
ON public.document_chunks 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update document chunks" 
ON public.document_chunks 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete document chunks" 
ON public.document_chunks 
FOR DELETE 
TO authenticated 
USING (true);