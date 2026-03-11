-- Add policy for users to view call sessions for their meetings
CREATE POLICY "Users can view call sessions for their meetings" 
ON public.call_sessions 
FOR SELECT 
USING (customer_phone IN (
  SELECT automated_meetings.customer_phone 
  FROM automated_meetings 
  WHERE automated_meetings.user_id = auth.uid()
));

-- Add realtime publication for meeting_responses and call_sessions
ALTER TABLE public.meeting_responses REPLICA IDENTITY FULL;
ALTER TABLE public.call_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.automated_meetings REPLICA IDENTITY FULL;

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.automated_meetings;