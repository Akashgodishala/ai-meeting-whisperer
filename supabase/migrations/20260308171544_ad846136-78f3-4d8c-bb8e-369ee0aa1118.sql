-- Fix RLS policies that are incorrectly assigned to public role instead of service_role
-- These policies have USING(true) or WITH CHECK(true) but are granted to public, not service_role

-- call_sessions: Fix INSERT and UPDATE policies
DROP POLICY "Service role can insert call sessions" ON public.call_sessions;
CREATE POLICY "Service role can insert call sessions" ON public.call_sessions FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY "Service role can update call sessions" ON public.call_sessions;
CREATE POLICY "Service role can update call sessions" ON public.call_sessions FOR UPDATE TO service_role USING (true);

-- voice_appointments: Fix ALL policy
DROP POLICY "Service role can manage appointments" ON public.voice_appointments;
CREATE POLICY "Service role can manage appointments" ON public.voice_appointments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- voice_links: Fix ALL policy
DROP POLICY "Service role can manage links" ON public.voice_links;
CREATE POLICY "Service role can manage links" ON public.voice_links FOR ALL TO service_role USING (true) WITH CHECK (true);

-- retailer_orders: Fix ALL policy
DROP POLICY "Service role can manage orders" ON public.retailer_orders;
CREATE POLICY "Service role can manage orders" ON public.retailer_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- service_analytics: Fix ALL policy
DROP POLICY "Service role can manage all analytics" ON public.service_analytics;
CREATE POLICY "Service role can manage all analytics" ON public.service_analytics FOR ALL TO service_role USING (true) WITH CHECK (true);

-- age_verifications: Fix ALL policy
DROP POLICY "Service role can manage age verifications" ON public.age_verifications;
CREATE POLICY "Service role can manage age verifications" ON public.age_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- retailer_sms_logs: Fix ALL policy
DROP POLICY "Service role can manage SMS logs" ON public.retailer_sms_logs;
CREATE POLICY "Service role can manage SMS logs" ON public.retailer_sms_logs FOR ALL TO service_role USING (true) WITH CHECK (true);