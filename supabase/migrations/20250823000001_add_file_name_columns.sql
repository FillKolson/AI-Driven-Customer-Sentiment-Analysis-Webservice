-- Add file_name column to tables that don't have it yet
-- This will help track which user file was used to populate each record

-- Add file_name column to supermarket_customer_members table
ALTER TABLE public.supermarket_customer_members 
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Add file_name column to supermarket_branches table
ALTER TABLE public.supermarket_branches 
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Add file_name column to market_basket_optimisation table
ALTER TABLE public.market_basket_optimisation 
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Add file_name column to ads_ctr_optimisation table
ALTER TABLE public.ads_ctr_optimisation 
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Add indexes for better query performance on file_name columns
CREATE INDEX IF NOT EXISTS supermarket_customer_members_file_name_idx ON public.supermarket_customer_members(file_name);
CREATE INDEX IF NOT EXISTS supermarket_branches_file_name_idx ON public.supermarket_branches(file_name);
CREATE INDEX IF NOT EXISTS market_basket_optimisation_file_name_idx ON public.market_basket_optimisation(file_name);
CREATE INDEX IF NOT EXISTS ads_ctr_optimisation_file_name_idx ON public.ads_ctr_optimisation(file_name);

-- Add composite indexes for common query patterns (user_id + file_name)
CREATE INDEX IF NOT EXISTS supermarket_customer_members_user_file_name_idx ON public.supermarket_customer_members(user_id, file_name);
CREATE INDEX IF NOT EXISTS supermarket_branches_user_file_name_idx ON public.supermarket_branches(user_id, file_name);
CREATE INDEX IF NOT EXISTS market_basket_optimisation_user_file_name_idx ON public.market_basket_optimisation(user_id, file_name);
CREATE INDEX IF NOT EXISTS ads_ctr_optimisation_user_file_name_idx ON public.ads_ctr_optimisation(user_id, file_name);
