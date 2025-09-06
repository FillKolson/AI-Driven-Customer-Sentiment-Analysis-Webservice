-- =============================================
-- CREATE INDIVIDUAL PRODUCT TABLES (Product1-Product9)
-- =============================================

-- Drop the existing products table since we're replacing it with individual tables
DROP TABLE IF EXISTS public.products CASCADE;

-- Create Product1 table
CREATE TABLE public.product1 (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    PRIMARY KEY (user_id, basket_id),
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE CASCADE
);

-- Create Product2 table
CREATE TABLE public.product2 (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    PRIMARY KEY (user_id, basket_id),
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE CASCADE
);

-- Create Product3 table
CREATE TABLE public.product3 (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    PRIMARY KEY (user_id, basket_id),
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE CASCADE
);

-- Create Product4 table
CREATE TABLE public.product4 (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    PRIMARY KEY (user_id, basket_id),
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE CASCADE
);

-- Create Product5 table
CREATE TABLE public.product5 (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    PRIMARY KEY (user_id, basket_id),
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE CASCADE
);

-- Create Product6 table
CREATE TABLE public.product6 (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    PRIMARY KEY (user_id, basket_id),
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE CASCADE
);

-- Create Product7 table
CREATE TABLE public.product7 (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    PRIMARY KEY (user_id, basket_id),
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE CASCADE
);

-- Create Product8 table
CREATE TABLE public.product8 (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    PRIMARY KEY (user_id, basket_id),
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE CASCADE
);

-- Create Product9 table
CREATE TABLE public.product9 (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    PRIMARY KEY (user_id, basket_id),
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE CASCADE
);

-- =============================================
-- UPDATE MARKET_BASKET_OPTIMISATION FOREIGN KEYS
-- =============================================

-- Add foreign key constraints from market_basket_optimisation to individual product tables
-- These will link the product columns to the actual product names in the respective tables

ALTER TABLE public.market_basket_optimisation 
ADD CONSTRAINT fk_product1 
FOREIGN KEY (user_id, product1) 
REFERENCES public.product1(user_id, basket_id) 
ON DELETE SET NULL;

ALTER TABLE public.market_basket_optimisation 
ADD CONSTRAINT fk_product2 
FOREIGN KEY (user_id, product2) 
REFERENCES public.product2(user_id, basket_id) 
ON DELETE SET NULL;

ALTER TABLE public.market_basket_optimisation 
ADD CONSTRAINT fk_product3 
FOREIGN KEY (user_id, product3) 
REFERENCES public.product3(user_id, basket_id) 
ON DELETE SET NULL;

ALTER TABLE public.market_basket_optimisation 
ADD CONSTRAINT fk_product4 
FOREIGN KEY (user_id, product4) 
REFERENCES public.product4(user_id, basket_id) 
ON DELETE SET NULL;

ALTER TABLE public.market_basket_optimisation 
ADD CONSTRAINT fk_product5 
FOREIGN KEY (user_id, product5) 
REFERENCES public.product5(user_id, basket_id) 
ON DELETE SET NULL;

ALTER TABLE public.market_basket_optimisation 
ADD CONSTRAINT fk_product6 
FOREIGN KEY (user_id, product6) 
REFERENCES public.product6(user_id, basket_id) 
ON DELETE SET NULL;

ALTER TABLE public.market_basket_optimisation 
ADD CONSTRAINT fk_product7 
FOREIGN KEY (user_id, product7) 
REFERENCES public.product7(user_id, basket_id) 
ON DELETE SET NULL;

ALTER TABLE public.market_basket_optimisation 
ADD CONSTRAINT fk_product8 
FOREIGN KEY (user_id, product8) 
REFERENCES public.product8(user_id, basket_id) 
ON DELETE SET NULL;

ALTER TABLE public.market_basket_optimisation 
ADD CONSTRAINT fk_product9 
FOREIGN KEY (user_id, product9) 
REFERENCES public.product9(user_id, basket_id) 
ON DELETE SET NULL;

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for all product tables
CREATE INDEX IF NOT EXISTS idx_product1_user_id ON public.product1(user_id);
CREATE INDEX IF NOT EXISTS idx_product1_basket_id ON public.product1(basket_id);
CREATE INDEX IF NOT EXISTS idx_product1_name ON public.product1(product_name);

CREATE INDEX IF NOT EXISTS idx_product2_user_id ON public.product2(user_id);
CREATE INDEX IF NOT EXISTS idx_product2_basket_id ON public.product2(basket_id);
CREATE INDEX IF NOT EXISTS idx_product2_name ON public.product2(product_name);

CREATE INDEX IF NOT EXISTS idx_product3_user_id ON public.product3(user_id);
CREATE INDEX IF NOT EXISTS idx_product3_basket_id ON public.product3(basket_id);
CREATE INDEX IF NOT EXISTS idx_product3_name ON public.product3(product_name);

CREATE INDEX IF NOT EXISTS idx_product4_user_id ON public.product4(user_id);
CREATE INDEX IF NOT EXISTS idx_product4_basket_id ON public.product4(basket_id);
CREATE INDEX IF NOT EXISTS idx_product4_name ON public.product4(product_name);

CREATE INDEX IF NOT EXISTS idx_product5_user_id ON public.product5(user_id);
CREATE INDEX IF NOT EXISTS idx_product5_basket_id ON public.product5(basket_id);
CREATE INDEX IF NOT EXISTS idx_product5_name ON public.product5(product_name);

CREATE INDEX IF NOT EXISTS idx_product6_user_id ON public.product6(user_id);
CREATE INDEX IF NOT EXISTS idx_product6_basket_id ON public.product6(basket_id);
CREATE INDEX IF NOT EXISTS idx_product6_name ON public.product6(product_name);

CREATE INDEX IF NOT EXISTS idx_product7_user_id ON public.product7(user_id);
CREATE INDEX IF NOT EXISTS idx_product7_basket_id ON public.product7(basket_id);
CREATE INDEX IF NOT EXISTS idx_product7_name ON public.product7(product_name);

CREATE INDEX IF NOT EXISTS idx_product8_user_id ON public.product8(user_id);
CREATE INDEX IF NOT EXISTS idx_product8_basket_id ON public.product8(basket_id);
CREATE INDEX IF NOT EXISTS idx_product8_name ON public.product8(product_name);

CREATE INDEX IF NOT EXISTS idx_product9_user_id ON public.product9(user_id);
CREATE INDEX IF NOT EXISTS idx_product9_basket_id ON public.product9(basket_id);
CREATE INDEX IF NOT EXISTS idx_product9_name ON public.product9(product_name);

-- =============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.product1 IS 'Product1 data linked to market baskets';
COMMENT ON TABLE public.product2 IS 'Product2 data linked to market baskets';
COMMENT ON TABLE public.product3 IS 'Product3 data linked to market baskets';
COMMENT ON TABLE public.product4 IS 'Product4 data linked to market baskets';
COMMENT ON TABLE public.product5 IS 'Product5 data linked to market baskets';
COMMENT ON TABLE public.product6 IS 'Product6 data linked to market baskets';
COMMENT ON TABLE public.product7 IS 'Product7 data linked to market baskets';
COMMENT ON TABLE public.product8 IS 'Product8 data linked to market baskets';
COMMENT ON TABLE public.product9 IS 'Product9 data linked to market baskets';

COMMENT ON COLUMN public.product1.product_name IS 'Name of product in position 1 of the basket';
COMMENT ON COLUMN public.product2.product_name IS 'Name of product in position 2 of the basket';
COMMENT ON COLUMN public.product3.product_name IS 'Name of product in position 3 of the basket';
COMMENT ON COLUMN public.product4.product_name IS 'Name of product in position 4 of the basket';
COMMENT ON COLUMN public.product5.product_name IS 'Name of product in position 5 of the basket';
COMMENT ON COLUMN public.product6.product_name IS 'Name of product in position 6 of the basket';
COMMENT ON COLUMN public.product7.product_name IS 'Name of product in position 7 of the basket';
COMMENT ON COLUMN public.product8.product_name IS 'Name of product in position 8 of the basket';
COMMENT ON COLUMN public.product9.product_name IS 'Name of product in position 9 of the basket';
