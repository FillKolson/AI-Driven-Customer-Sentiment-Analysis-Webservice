-- Set FREE plan as default for new users and decouple from Stripe
-- 1) Ensure defaults on the users table
ALTER TABLE public.users
  ALTER COLUMN subscription_status SET DEFAULT 'free';

ALTER TABLE public.users
  ALTER COLUMN api_limit_per_month SET DEFAULT 100;

-- 2) Initialize existing NULL/empty values to free plan
UPDATE public.users
SET subscription_status = 'free'
WHERE subscription_status IS NULL OR subscription_status = 'NULL' OR subscription_status = '';

UPDATE public.users
SET api_limit_per_month = 100
WHERE api_limit_per_month IS NULL OR api_limit_per_month = 0;

-- 3) Update the handle_new_user trigger function to explicitly set free defaults on insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    user_id,
    email,
    name,
    full_name,
    avatar_url,
    token_identifier,
    created_at,
    updated_at,
    subscription_status,
    api_limit_per_month
  ) VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    NEW.created_at,
    NEW.updated_at,
    'free',
    100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
