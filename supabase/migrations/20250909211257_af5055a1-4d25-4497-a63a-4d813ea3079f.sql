-- Add scheduled automations table for future campaigns
CREATE TABLE IF NOT EXISTS public.scheduled_automations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id uuid REFERENCES public.retailer_profiles(id) ON DELETE CASCADE,
    automation_type text NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    customers jsonb NOT NULL DEFAULT '[]'::jsonb,
    campaign_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text DEFAULT 'scheduled'::text,
    executed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.scheduled_automations ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled automations
CREATE POLICY "Retailers can manage their own scheduled automations" 
ON public.scheduled_automations 
FOR ALL 
USING (
  retailer_id IN (
    SELECT id FROM retailer_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all scheduled automations" 
ON public.scheduled_automations 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_automations_updated_at
  BEFORE UPDATE ON public.scheduled_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();