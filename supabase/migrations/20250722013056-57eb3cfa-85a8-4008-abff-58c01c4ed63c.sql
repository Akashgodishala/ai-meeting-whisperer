-- Add inventory and orders system for retailers
ALTER TABLE retailer_inventory 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true;

-- Create orders table for retailer orders
CREATE TABLE IF NOT EXISTS public.retailer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailer_profiles(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('pickup', 'delivery')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  driver_tip DECIMAL(10,2) DEFAULT 0,
  service_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'preparing', 'ready', 'completed', 'cancelled')),
  call_session_id UUID,
  payment_link_url TEXT,
  payment_status TEXT DEFAULT 'pending',
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.retailer_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders
CREATE POLICY "Retailers can view their own orders" 
ON public.retailer_orders 
FOR SELECT 
USING (retailer_id IN (
  SELECT retailer_profiles.id 
  FROM retailer_profiles 
  WHERE retailer_profiles.user_id = auth.uid()
));

CREATE POLICY "Service role can manage orders" 
ON public.retailer_orders 
FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_retailer_orders_updated_at
BEFORE UPDATE ON public.retailer_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();