-- Create a function to get product quantities from market basket optimization
CREATE OR REPLACE FUNCTION public.get_product_quantities()
RETURNS TABLE (product_name text, quantity bigint) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.product AS product_name,
    COUNT(*) AS quantity
  FROM public.market_basket_optimisation mbo,
  LATERAL (VALUES
    (mbo.product1), (mbo.product2), (mbo.product3), 
    (mbo.product4), (mbo.product5), (mbo.product6),
    (mbo.product7), (mbo.product8), (mbo.product9)
  ) AS p(product)
  WHERE p.product IS NOT NULL
    AND mbo.user_id = auth.uid()
  GROUP BY p.product
  ORDER BY quantity DESC
  LIMIT 20;
$$;
