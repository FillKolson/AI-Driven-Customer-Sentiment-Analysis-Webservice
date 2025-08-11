-- Add metric data fields to sentiment_analyses table
-- This migration adds fields for storing additional metadata from CSV files

ALTER TABLE public.sentiment_analyses 
ADD COLUMN IF NOT EXISTS review_id TEXT,
ADD COLUMN IF NOT EXISTS customer_id TEXT,
ADD COLUMN IF NOT EXISTS product_id TEXT,
ADD COLUMN IF NOT EXISTS review_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS category_of_product TEXT;

-- Create indexes for better query performance on metric fields
CREATE INDEX IF NOT EXISTS sentiment_analyses_review_id_idx ON public.sentiment_analyses(review_id);
CREATE INDEX IF NOT EXISTS sentiment_analyses_customer_id_idx ON public.sentiment_analyses(customer_id);
CREATE INDEX IF NOT EXISTS sentiment_analyses_product_id_idx ON public.sentiment_analyses(product_id);
CREATE INDEX IF NOT EXISTS sentiment_analyses_review_date_idx ON public.sentiment_analyses(review_date);
CREATE INDEX IF NOT EXISTS sentiment_analyses_gender_idx ON public.sentiment_analyses(gender);
CREATE INDEX IF NOT EXISTS sentiment_analyses_age_idx ON public.sentiment_analyses(age);
CREATE INDEX IF NOT EXISTS sentiment_analyses_country_idx ON public.sentiment_analyses(country);
CREATE INDEX IF NOT EXISTS sentiment_analyses_language_idx ON public.sentiment_analyses(language);
CREATE INDEX IF NOT EXISTS sentiment_analyses_category_idx ON public.sentiment_analyses(category_of_product);

-- Add comments to document the new fields
COMMENT ON COLUMN public.sentiment_analyses.review_id IS 'Unique identifier for the review';
COMMENT ON COLUMN public.sentiment_analyses.customer_id IS 'Unique identifier for the customer';
COMMENT ON COLUMN public.sentiment_analyses.product_id IS 'Unique identifier for the product';
COMMENT ON COLUMN public.sentiment_analyses.review_date IS 'Date when the review was written';
COMMENT ON COLUMN public.sentiment_analyses.gender IS 'Customer gender information';
COMMENT ON COLUMN public.sentiment_analyses.age IS 'Customer age information';
COMMENT ON COLUMN public.sentiment_analyses.country IS 'Customer country information';
COMMENT ON COLUMN public.sentiment_analyses.language IS 'Language of the review';
COMMENT ON COLUMN public.sentiment_analyses.category_of_product IS 'Product category information'; 