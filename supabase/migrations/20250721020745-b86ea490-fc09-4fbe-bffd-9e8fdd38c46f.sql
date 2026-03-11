-- Enable real-time for meeting_responses and call_sessions tables
ALTER TABLE public.meeting_responses REPLICA IDENTITY FULL;
ALTER TABLE public.call_sessions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;