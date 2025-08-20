-- Create a function to get monthly sentiment analytics
CREATE OR REPLACE FUNCTION public.get_monthly_sentiment_analytics(p_user_id UUID)
RETURNS TABLE (
  month TEXT,
  average_score NUMERIC,
  analysis_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH monthly_data AS (
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM') AS month,
      sentiment_score
    FROM 
      public.sentiment_analyses
    WHERE 
      user_id = p_user_id
      AND created_at IS NOT NULL
  )
  SELECT 
    md.month,
    AVG(md.sentiment_score)::NUMERIC(10, 4) AS average_score,
    COUNT(*)::BIGINT AS analysis_count
  FROM 
    monthly_data md
  GROUP BY 
    md.month
  ORDER BY 
    md.month;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_monthly_sentiment_analytics(UUID) TO authenticated;
