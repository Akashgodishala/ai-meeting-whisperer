-- Add dedicated payment_link column to retailer_profiles.
-- Previously the payment link was incorrectly stored inside payment_methods JSONB (an array of
-- supported payment method strings), which caused .map() to break whenever the object form was
-- written back.  A dedicated TEXT column keeps the two concepts separate and avoids schema
-- conflicts with existing array data.
ALTER TABLE public.retailer_profiles
  ADD COLUMN IF NOT EXISTS payment_link TEXT;
