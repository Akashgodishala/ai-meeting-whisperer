-- Create call_sessions table for storing call recordings and session data
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_id UUID,
  status TEXT NOT NULL DEFAULT 'initiated',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0,
  recording_url TEXT,
  transcript TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for call sessions
CREATE POLICY "Anyone can read call sessions" 
ON public.call_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can insert call sessions" 
ON public.call_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update call sessions" 
ON public.call_sessions 
FOR UPDATE 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_call_sessions_call_id ON public.call_sessions(call_id);
CREATE INDEX idx_call_sessions_customer_phone ON public.call_sessions(customer_phone);
CREATE INDEX idx_call_sessions_status ON public.call_sessions(status);
CREATE INDEX idx_call_sessions_created_at ON public.call_sessions(created_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_call_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_call_sessions_updated_at
BEFORE UPDATE ON public.call_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_call_sessions_updated_at();

-- Enable realtime for call_sessions
ALTER TABLE public.call_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;