-- Add product_id column to sentiment_analyses table to establish relationship with products
ALTER TABLE public.sentiment_analyses 
ADD COLUMN product_id TEXT;

-- Add foreign key constraint to link sentiment_analyses with products
ALTER TABLE public.sentiment_analyses 
ADD CONSTRAINT fk_sentiment_analyses_product 
FOREIGN KEY (user_id, product_id) 
REFERENCES public.products(user_id, product_id) 
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_product_id 
ON public.sentiment_analyses(product_id);

-- Add comment to explain the relationship
COMMENT ON COLUMN public.sentiment_analyses.product_id IS 'Links sentiment analysis to a specific product when applicable';
