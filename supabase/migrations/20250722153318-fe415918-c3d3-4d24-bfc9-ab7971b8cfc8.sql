-- Enable pg_cron extension for scheduled jobs
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the automated meeting reminder function to run every minute
-- This will check for any pending reminders that need to be sent
SELECT cron.schedule(
  'automated-meeting-reminders',
  '* * * * *', -- Run every minute
  $$
  SELECT
    net.http_post(
        url:='https://scagutbejvgicmllzqge.supabase.co/functions/v1/automated-meeting-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjYWd1dGJlanZnaWNtbGx6cWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NDIyOTAsImV4cCI6MjA2ODAxODI5MH0.ucTpjt5DZhs6qzMF_IFEekWhgo0gAJrIPSKeGK9Mdss"}'::jsonb,
        body:='{"trigger": "cron", "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

-- Create a function to check cron job status
CREATE OR REPLACE FUNCTION get_meeting_automation_status()
RETURNS TABLE (
  jobname text,
  schedule text,
  active boolean,
  last_run timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobname::text,
    j.schedule::text,
    j.active,
    j.last_run
  FROM cron.job j
  WHERE j.jobname = 'automated-meeting-reminders';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;