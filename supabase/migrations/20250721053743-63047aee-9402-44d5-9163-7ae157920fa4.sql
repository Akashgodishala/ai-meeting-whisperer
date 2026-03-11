-- Create retailer roles and related tables for voice agent system

-- Create retailer profiles table
CREATE TABLE public.retailer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL, -- 'liquor_store', 'grocery_store', 'restaurant'
  phone TEXT,
  address TEXT,
  payment_methods JSONB DEFAULT '[]'::jsonb, -- supported payment methods
  operating_hours JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user roles table for role-based access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'admin', 'retailer', 'customer'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create voice transactions table for payment tracking
CREATE TABLE public.voice_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailer_profiles(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  transaction_reference TEXT,
  call_session_id UUID REFERENCES call_sessions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create voice appointments table for booking system
CREATE TABLE public.voice_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailer_profiles(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  appointment_type TEXT, -- 'consultation', 'pickup', 'delivery'
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'cancelled', 'completed'
  notes TEXT,
  call_session_id UUID REFERENCES call_sessions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create voice links table for link sharing
CREATE TABLE public.voice_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailer_profiles(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  link_url TEXT NOT NULL,
  link_type TEXT, -- 'menu', 'catalog', 'promotion', 'payment'
  title TEXT,
  description TEXT,
  expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT now(),
  call_session_id UUID REFERENCES call_sessions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.retailer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for retailer_profiles
CREATE POLICY "Users can view their own retailer profile"
ON public.retailer_profiles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own retailer profile"
ON public.retailer_profiles FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own retailer profile"
ON public.retailer_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage user roles"
ON public.user_roles FOR ALL
USING (true);

-- Create RLS policies for voice_transactions
CREATE POLICY "Retailers can view their own transactions"
ON public.voice_transactions FOR SELECT
USING (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage transactions"
ON public.voice_transactions FOR ALL
USING (true);

-- Create RLS policies for voice_appointments
CREATE POLICY "Retailers can view their own appointments"
ON public.voice_appointments FOR SELECT
USING (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage appointments"
ON public.voice_appointments FOR ALL
USING (true);

-- Create RLS policies for voice_links
CREATE POLICY "Retailers can view their own links"
ON public.voice_links FOR SELECT
USING (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service role can manage links"
ON public.voice_links FOR ALL
USING (true);

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = $1 AND user_roles.role = $2
  );
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_retailer_profiles_updated_at
  BEFORE UPDATE ON public.retailer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_transactions_updated_at
  BEFORE UPDATE ON public.voice_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voice_appointments_updated_at
  BEFORE UPDATE ON public.voice_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();