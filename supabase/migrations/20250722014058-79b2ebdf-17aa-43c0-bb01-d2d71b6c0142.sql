-- Create analytics and service owner tables
CREATE TABLE IF NOT EXISTS public.service_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES retailer_profiles(id),
  call_session_id UUID REFERENCES call_sessions(id),
  call_outcome TEXT NOT NULL CHECK (call_outcome IN ('ai_success', 'human_fallback', 'failed')),
  transaction_completed BOOLEAN DEFAULT false,
  payment_processed BOOLEAN DEFAULT false,
  sms_confirmed BOOLEAN DEFAULT false,
  call_duration INTEGER, -- in seconds
  failure_reason TEXT,
  customer_satisfaction INTEGER CHECK (customer_satisfaction BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create service owner profiles for multi-store management
CREATE TABLE IF NOT EXISTS public.service_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link retailers to service owners
ALTER TABLE public.retailer_profiles 
ADD COLUMN IF NOT EXISTS service_owner_id UUID REFERENCES service_owners(id);

-- Create compliance tracking for age verification
CREATE TABLE IF NOT EXISTS public.age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES retailer_orders(id),
  customer_phone TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('sms_otp', 'voice_confirmation', 'id_upload')),
  verified_age INTEGER,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed', 'expired')),
  otp_code TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service owners can view their analytics" 
ON public.service_analytics 
FOR SELECT 
USING (store_id IN (
  SELECT retailer_profiles.id 
  FROM retailer_profiles 
  JOIN service_owners ON retailer_profiles.service_owner_id = service_owners.id
  WHERE service_owners.user_id = auth.uid()
));

CREATE POLICY "Service owners can manage their profile" 
ON public.service_owners 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all analytics" 
ON public.service_analytics 
FOR ALL 
USING (true);

CREATE POLICY "Service role can manage age verifications" 
ON public.age_verifications 
FOR ALL 
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_service_analytics_updated_at
BEFORE UPDATE ON public.service_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_owners_updated_at
BEFORE UPDATE ON public.service_owners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();