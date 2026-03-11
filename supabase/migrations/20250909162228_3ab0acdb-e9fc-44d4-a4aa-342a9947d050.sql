-- Add policy for users to view call sessions for their meetings
CREATE POLICY "Users can view call sessions for their meetings" 
ON public.call_sessions 
FOR SELECT 
USING (customer_phone IN (
  SELECT automated_meetings.customer_phone 
  FROM automated_meetings 
  WHERE automated_meetings.user_id = auth.uid()
));