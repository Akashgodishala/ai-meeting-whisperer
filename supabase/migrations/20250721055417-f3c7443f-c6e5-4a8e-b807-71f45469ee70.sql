-- Create retailer customers and inventory tables

-- Create retailer customers table
CREATE TABLE public.retailer_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create retailer inventory table
CREATE TABLE public.retailer_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id UUID REFERENCES retailer_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.retailer_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_inventory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for retailer_customers
CREATE POLICY "Retailers can view their own customers"
ON public.retailer_customers FOR SELECT
USING (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Retailers can insert their own customers"
ON public.retailer_customers FOR INSERT
WITH CHECK (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Retailers can update their own customers"
ON public.retailer_customers FOR UPDATE
USING (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Retailers can delete their own customers"
ON public.retailer_customers FOR DELETE
USING (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

-- Create RLS policies for retailer_inventory
CREATE POLICY "Retailers can view their own inventory"
ON public.retailer_inventory FOR SELECT
USING (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Retailers can insert their own inventory"
ON public.retailer_inventory FOR INSERT
WITH CHECK (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Retailers can update their own inventory"
ON public.retailer_inventory FOR UPDATE
USING (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Retailers can delete their own inventory"
ON public.retailer_inventory FOR DELETE
USING (retailer_id IN (SELECT id FROM retailer_profiles WHERE user_id = auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_retailer_customers_updated_at
  BEFORE UPDATE ON public.retailer_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retailer_inventory_updated_at
  BEFORE UPDATE ON public.retailer_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();