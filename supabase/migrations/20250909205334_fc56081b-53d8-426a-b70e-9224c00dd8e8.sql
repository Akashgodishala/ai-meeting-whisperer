-- CRITICAL SECURITY FIXES

-- 1. Fix user_roles table RLS policy to prevent public access
DROP POLICY IF EXISTS "Service role can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create secure RLS policies for user_roles
CREATE POLICY "Service role can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (auth.role() = 'service_role'::text);

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Add SECURITY DEFINER and search_path to database functions
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = $1 AND user_roles.role = $2
  );
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_call_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_automatic_reminder_schedules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
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
$function$;

-- 3. Fix age_verifications table to use proper time-based validation with trigger
CREATE OR REPLACE FUNCTION public.validate_age_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  -- Validate expiry time
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'Age verification has expired';
  END IF;
  
  -- Validate age range
  IF NEW.verified_age IS NOT NULL AND (NEW.verified_age < 0 OR NEW.verified_age > 150) THEN
    RAISE EXCEPTION 'Invalid age provided';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for age verification validation
DROP TRIGGER IF EXISTS validate_age_verification_trigger ON public.age_verifications;
CREATE TRIGGER validate_age_verification_trigger
  BEFORE INSERT OR UPDATE ON public.age_verifications
  FOR EACH ROW EXECUTE FUNCTION public.validate_age_verification();

-- 4. Enable realtime for critical tables
ALTER TABLE public.call_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.meeting_responses REPLICA IDENTITY FULL;
ALTER TABLE public.automated_meetings REPLICA IDENTITY FULL;
ALTER TABLE public.retailer_orders REPLICA IDENTITY FULL;
ALTER TABLE public.voice_appointments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.call_sessions,
  public.meeting_responses,
  public.automated_meetings,
  public.retailer_orders,
  public.voice_appointments,
  public.voice_transactions,
  public.service_analytics;

-- 5. Create audit logging table for security compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    action text NOT NULL,
    table_name text,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role and admins to access audit logs
CREATE POLICY "Service role can manage audit logs" 
ON public.audit_logs 
FOR ALL 
USING (auth.role() = 'service_role'::text);

CREATE POLICY "Admins can view audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Add call analytics table for performance monitoring
CREATE TABLE IF NOT EXISTS public.call_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id text NOT NULL,
    customer_phone text NOT NULL,
    call_duration integer,
    response_detected boolean DEFAULT false,
    response_confidence numeric(3,2),
    sentiment_score numeric(3,2),
    call_success boolean DEFAULT false,
    error_reason text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.call_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their call analytics" 
ON public.call_analytics 
FOR SELECT 
USING (
  customer_phone IN (
    SELECT customer_phone FROM automated_meetings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage call analytics" 
ON public.call_analytics 
FOR ALL 
USING (auth.role() = 'service_role'::text);