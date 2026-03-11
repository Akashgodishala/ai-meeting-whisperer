-- Create table for editable content
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT,
  content TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Create policies for site content
CREATE POLICY "Site content is viewable by everyone" 
ON public.site_content 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage site content" 
ON public.site_content 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Insert default content
INSERT INTO public.site_content (key, title, content, data) VALUES
('hero_title', 'VoxOrbit AI', 'Next-Generation Voice Automation Platform', '{"subtitle": "Transform your business with AI-powered voice agents"}'),
('hero_description', null, 'Experience the future of customer interaction with our cutting-edge voice AI technology. Automate calls, process orders, and engage customers 24/7 with human-like conversations.', '{}'),
('features_title', 'Powerful Features', 'Everything you need to revolutionize your business communication', '{}'),
('pricing_title', 'Simple Pricing', 'Choose the perfect plan for your business needs', '{}'),
('contact_title', 'Get in Touch', 'Ready to transform your business? Contact us today.', '{}'),
('demo_instructions', 'Try Our Voice AI', 'Click the microphone button below and speak to experience our AI voice technology in action.', '{}');

-- Create trigger for updated_at
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();