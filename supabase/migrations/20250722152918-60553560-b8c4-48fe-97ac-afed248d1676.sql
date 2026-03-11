-- Create automated meeting reminder system tables
CREATE TABLE public.automated_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  description TEXT,
  meeting_link TEXT,
  location TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meeting reminder schedules table
CREATE TABLE public.meeting_reminder_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES automated_meetings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24_hours', '2_hours', '30_minutes', '5_minutes')),
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  call_id TEXT,
  response_received TEXT CHECK (response_received IN ('confirmed', 'reschedule', 'cancel', 'no_response')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automated reminder settings table
CREATE TABLE public.automated_reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_24h_reminder BOOLEAN DEFAULT true,
  enable_2h_reminder BOOLEAN DEFAULT true,
  enable_30min_reminder BOOLEAN DEFAULT false,
  enable_5min_reminder BOOLEAN DEFAULT false,
  voice_agent_id TEXT,
  reminder_message_template TEXT DEFAULT 'Hi {customer_name}, this is a friendly reminder about your upcoming meeting "{meeting_title}" scheduled for {meeting_date} at {meeting_time}. Please confirm your attendance by saying "yes" or press 1 to confirm, 2 to reschedule, or 3 to cancel.',
  max_retry_attempts INTEGER DEFAULT 2,
  retry_interval_minutes INTEGER DEFAULT 15,
  business_hours_only BOOLEAN DEFAULT true,
  business_start_time TIME DEFAULT '09:00:00',
  business_end_time TIME DEFAULT '17:00:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create meeting call logs table
CREATE TABLE public.meeting_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES automated_meetings(id) ON DELETE CASCADE,
  reminder_schedule_id UUID REFERENCES meeting_reminder_schedules(id) ON DELETE SET NULL,
  call_id TEXT,
  call_type TEXT NOT NULL CHECK (call_type IN ('reminder', 'confirmation', 'follow_up')),
  call_status TEXT NOT NULL CHECK (call_status IN ('initiated', 'in_progress', 'completed', 'failed', 'no_answer')),
  call_duration_seconds INTEGER,
  customer_response TEXT CHECK (customer_response IN ('confirmed', 'reschedule', 'cancel', 'no_response', 'interested', 'not_interested')),
  transcript TEXT,
  recording_url TEXT,
  cost_cents INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.automated_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_call_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for automated_meetings
CREATE POLICY "Users can view their own meetings" ON public.automated_meetings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meetings" ON public.automated_meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings" ON public.automated_meetings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings" ON public.automated_meetings
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for meeting_reminder_schedules
CREATE POLICY "Users can view their meeting reminders" ON public.meeting_reminder_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automated_meetings 
      WHERE automated_meetings.id = meeting_reminder_schedules.meeting_id 
      AND automated_meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create meeting reminders" ON public.meeting_reminder_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM automated_meetings 
      WHERE automated_meetings.id = meeting_reminder_schedules.meeting_id 
      AND automated_meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their meeting reminders" ON public.meeting_reminder_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM automated_meetings 
      WHERE automated_meetings.id = meeting_reminder_schedules.meeting_id 
      AND automated_meetings.user_id = auth.uid()
    )
  );

-- Create RLS policies for automated_reminder_settings
CREATE POLICY "Users can view their own reminder settings" ON public.automated_reminder_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminder settings" ON public.automated_reminder_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminder settings" ON public.automated_reminder_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for meeting_call_logs
CREATE POLICY "Users can view their meeting call logs" ON public.meeting_call_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM automated_meetings 
      WHERE automated_meetings.id = meeting_call_logs.meeting_id 
      AND automated_meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all data" ON public.automated_meetings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all reminder schedules" ON public.meeting_reminder_schedules
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all call logs" ON public.meeting_call_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_automated_meetings_user_id ON automated_meetings(user_id);
CREATE INDEX idx_automated_meetings_date ON automated_meetings(meeting_date);
CREATE INDEX idx_automated_meetings_status ON automated_meetings(status);
CREATE INDEX idx_reminder_schedules_meeting_id ON meeting_reminder_schedules(meeting_id);
CREATE INDEX idx_reminder_schedules_scheduled_time ON meeting_reminder_schedules(scheduled_time);
CREATE INDEX idx_reminder_schedules_status ON meeting_reminder_schedules(status);
CREATE INDEX idx_call_logs_meeting_id ON meeting_call_logs(meeting_id);
CREATE INDEX idx_call_logs_call_status ON meeting_call_logs(call_status);

-- Create triggers for updated_at columns
CREATE TRIGGER update_automated_meetings_updated_at
  BEFORE UPDATE ON public.automated_meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_reminder_schedules_updated_at
  BEFORE UPDATE ON public.meeting_reminder_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automated_reminder_settings_updated_at
  BEFORE UPDATE ON public.automated_reminder_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_call_logs_updated_at
  BEFORE UPDATE ON public.meeting_call_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create reminder schedules when a meeting is created
CREATE OR REPLACE FUNCTION create_automatic_reminder_schedules()
RETURNS TRIGGER AS $$
DECLARE
    settings automated_reminder_settings%ROWTYPE;
BEGIN
    -- Get user's reminder settings
    SELECT * INTO settings 
    FROM automated_reminder_settings 
    WHERE user_id = NEW.user_id;
    
    -- If no settings exist, create default ones
    IF NOT FOUND THEN
        INSERT INTO automated_reminder_settings (user_id) 
        VALUES (NEW.user_id)
        RETURNING * INTO settings;
    END IF;
    
    -- Create 24 hour reminder if enabled
    IF settings.enable_24h_reminder THEN
        INSERT INTO meeting_reminder_schedules (meeting_id, reminder_type, scheduled_time)
        VALUES (NEW.id, '24_hours', NEW.meeting_date - INTERVAL '24 hours');
    END IF;
    
    -- Create 2 hour reminder if enabled
    IF settings.enable_2h_reminder THEN
        INSERT INTO meeting_reminder_schedules (meeting_id, reminder_type, scheduled_time)
        VALUES (NEW.id, '2_hours', NEW.meeting_date - INTERVAL '2 hours');
    END IF;
    
    -- Create 30 minute reminder if enabled
    IF settings.enable_30min_reminder THEN
        INSERT INTO meeting_reminder_schedules (meeting_id, reminder_type, scheduled_time)
        VALUES (NEW.id, '30_minutes', NEW.meeting_date - INTERVAL '30 minutes');
    END IF;
    
    -- Create 5 minute reminder if enabled
    IF settings.enable_5min_reminder THEN
        INSERT INTO meeting_reminder_schedules (meeting_id, reminder_type, scheduled_time)
        VALUES (NEW.id, '5_minutes', NEW.meeting_date - INTERVAL '5 minutes');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create reminder schedules
CREATE TRIGGER trigger_create_automatic_reminder_schedules
    AFTER INSERT ON automated_meetings
    FOR EACH ROW
    EXECUTE FUNCTION create_automatic_reminder_schedules();