-- Create a function to get customer counts by gender
CREATE OR REPLACE FUNCTION public.get_customer_counts_by_gender()
RETURNS TABLE (gender text, count bigint) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    gender,
    COUNT(*) as count
  FROM 
    public.supermarket_customer_members
  WHERE 
    gender IS NOT NULL
  GROUP BY 
    gender;
$$;
