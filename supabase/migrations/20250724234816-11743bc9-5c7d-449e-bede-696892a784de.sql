-- Create retailer SMS logs table
CREATE TABLE public.retailer_sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retailer_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.retailer_sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for retailer SMS logs
CREATE POLICY "Retailers can view their own SMS logs" 
ON public.retailer_sms_logs 
FOR SELECT 
USING (retailer_id IN (
  SELECT retailer_profiles.id 
  FROM retailer_profiles 
  WHERE retailer_profiles.user_id = auth.uid()
));

CREATE POLICY "Retailers can insert their own SMS logs" 
ON public.retailer_sms_logs 
FOR INSERT 
WITH CHECK (retailer_id IN (
  SELECT retailer_profiles.id 
  FROM retailer_profiles 
  WHERE retailer_profiles.user_id = auth.uid()
));

-- Service role can manage all SMS logs for automation
CREATE POLICY "Service role can manage SMS logs" 
ON public.retailer_sms_logs 
FOR ALL 
USING (true);