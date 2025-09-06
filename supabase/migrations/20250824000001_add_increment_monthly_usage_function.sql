-- Create or replace the increment_usage function
CREATE OR REPLACE FUNCTION public.increment_monthly_usage(
  user_id_param UUID,
  token_count INTEGER
) 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's monthly usage
  UPDATE public.users
  SET 
    api_usage_current_month = LEAST(
      api_usage_current_month + token_count,
      api_limit_per_month  -- Ensure we don't exceed the limit
    )
  WHERE id = user_id_param;
  
  -- Log the usage in the usage_tracking table
  INSERT INTO public.usage_tracking (
    user_id, 
    date, 
    api_calls_count, 
    tokens_consumed, 
    subscription_plan
  )
  VALUES (
    user_id_param,
    CURRENT_DATE,
    1,  -- Increment call count by 1
    token_count,
    (SELECT subscription_status FROM public.users WHERE id = user_id_param)
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    api_calls_count = usage_tracking.api_calls_count + 1,
    tokens_consumed = usage_tracking.tokens_consumed + token_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_monthly_usage(UUID, INTEGER) TO authenticated;
