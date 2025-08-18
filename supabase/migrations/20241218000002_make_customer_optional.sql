-- Temporarily drop the foreign key constraint for customer_id to allow import
ALTER TABLE public.sentiment_analyses 
DROP CONSTRAINT IF EXISTS sentiment_analyses_customer_fk;

-- Make customer_id nullable to allow sentiment analyses without customer data
ALTER TABLE public.sentiment_analyses 
ALTER COLUMN customer_id DROP NOT NULL;

-- Add a new optional foreign key constraint
ALTER TABLE public.sentiment_analyses 
ADD CONSTRAINT sentiment_analyses_customer_fk_optional 
FOREIGN KEY (user_id, customer_id) 
REFERENCES public.supermarket_customer_members(user_id, customer_id) 
ON DELETE SET NULL;
