-- Drop all existing tables to start fresh
DROP TABLE IF EXISTS public.sentiment_analyses CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.market_basket_optimisation CASCADE;
DROP TABLE IF EXISTS public.ads_ctr_optimisation CASCADE;
DROP TABLE IF EXISTS public.supermarket_customer_members CASCADE;
DROP TABLE IF EXISTS public.supermarket_branches CASCADE;

-- =============================================
-- CREATE CORE TABLES
-- =============================================

-- Supermarket branches table
CREATE TABLE public.supermarket_branches (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    supermarket_id TEXT NOT NULL,
    advertisement_spend DECIMAL(12, 2) DEFAULT 0,
    promotion_spend DECIMAL(12, 2) DEFAULT 0,
    administration_spend DECIMAL(12, 2) DEFAULT 0,
    state TEXT,
    profit DECIMAL(12, 2) DEFAULT 0,
    PRIMARY KEY (user_id, supermarket_id)
);

-- Supermarket customer members table
CREATE TABLE public.supermarket_customer_members (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL,
    gender TEXT,
    age INTEGER,
    annual_income DECIMAL(12, 2),
    spending_score INTEGER,
    total_purchases INTEGER DEFAULT 0,
    average_order_value DECIMAL(12, 2) DEFAULT 0,
    purchase_frequency DECIMAL(10, 2) DEFAULT 0,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, customer_id)
);

-- Market basket optimization table
CREATE TABLE public.market_basket_optimisation (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    product1 TEXT,
    product2 TEXT,
    product3 TEXT,
    product4 TEXT,
    product5 TEXT,
    product6 TEXT,
    product7 TEXT,
    product8 TEXT,
    product9 TEXT,
    PRIMARY KEY (user_id, basket_id)
);

-- Products table (linked to baskets)
CREATE TABLE public.products (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    basket_id TEXT NOT NULL,
    attributes JSONB,
    params JSONB,
    PRIMARY KEY (user_id, basket_id),
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE CASCADE
);

-- Sentiment analysis table
CREATE TABLE public.sentiment_analyses (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sentiment_id TEXT NOT NULL,
    customer_id TEXT,
    supermarket_id TEXT,
    basket_id TEXT,
    sentiment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    sentiment_score DECIMAL(3, 2) NOT NULL CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    confidence_level DECIMAL(3, 2) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
    sentiment_category TEXT NOT NULL CHECK (sentiment_category IN ('positive', 'neutral', 'negative')),
    input_text TEXT,
    sentiment_result JSONB,
    analysis_type TEXT DEFAULT 'single_text' CHECK (analysis_type IN ('single_text', 'batch_file', 'batch_text')),
    file_name TEXT,
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    batch_job_id UUID,
    PRIMARY KEY (user_id, sentiment_id),
    FOREIGN KEY (user_id, customer_id) REFERENCES public.supermarket_customer_members(user_id, customer_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id, supermarket_id) REFERENCES public.supermarket_branches(user_id, supermarket_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id, basket_id) REFERENCES public.market_basket_optimisation(user_id, basket_id) ON DELETE SET NULL
);

-- Ads CTR optimization table
CREATE TABLE public.ads_ctr_optimisation (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    supermarket_id TEXT NOT NULL,
    ad1 TEXT,
    ad2 TEXT,
    ad3 TEXT,
    ad4 TEXT,
    ad5 TEXT,
    ad6 TEXT,
    ad7 TEXT,
    ad8 TEXT,
    ad9 TEXT,
    ad10 TEXT,
    PRIMARY KEY (user_id, supermarket_id),
    FOREIGN KEY (user_id, supermarket_id) REFERENCES public.supermarket_branches(user_id, supermarket_id) ON DELETE CASCADE
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for supermarket_branches
CREATE INDEX IF NOT EXISTS idx_supermarket_branches_user_id ON public.supermarket_branches(user_id);
CREATE INDEX IF NOT EXISTS idx_supermarket_branches_state ON public.supermarket_branches(state);

-- Indexes for supermarket_customer_members
CREATE INDEX IF NOT EXISTS idx_customer_members_user_id ON public.supermarket_customer_members(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_members_age ON public.supermarket_customer_members(age);
CREATE INDEX IF NOT EXISTS idx_customer_members_gender ON public.supermarket_customer_members(gender);

-- Indexes for sentiment_analyses
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_user_id ON public.sentiment_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_date ON public.sentiment_analyses(sentiment_date);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_score ON public.sentiment_analyses(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_category ON public.sentiment_analyses(sentiment_category);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_customer_id ON public.sentiment_analyses(customer_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_supermarket_id ON public.sentiment_analyses(supermarket_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_basket_id ON public.sentiment_analyses(basket_id);

-- Indexes for market_basket_optimisation
CREATE INDEX IF NOT EXISTS idx_market_basket_user_id ON public.market_basket_optimisation(user_id);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_basket_id ON public.products(basket_id);

-- Indexes for ads_ctr_optimisation
CREATE INDEX IF NOT EXISTS idx_ads_ctr_user_id ON public.ads_ctr_optimisation(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_ctr_supermarket_id ON public.ads_ctr_optimisation(supermarket_id);

-- =============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE public.supermarket_branches IS 'Stores supermarket branch information and financial metrics';
COMMENT ON TABLE public.supermarket_customer_members IS 'Customer demographic and behavioral data';
COMMENT ON TABLE public.sentiment_analyses IS 'Sentiment analysis results with optional links to customers, supermarkets, and baskets';
COMMENT ON TABLE public.products IS 'Product information linked to market baskets';
COMMENT ON TABLE public.market_basket_optimisation IS 'Market basket analysis data with product combinations';
COMMENT ON TABLE public.ads_ctr_optimisation IS 'Advertisement click-through rate optimization data';

COMMENT ON COLUMN public.sentiment_analyses.customer_id IS 'Optional reference to customer (nullable for flexibility)';
COMMENT ON COLUMN public.sentiment_analyses.supermarket_id IS 'Optional reference to supermarket (nullable for flexibility)';
COMMENT ON COLUMN public.sentiment_analyses.basket_id IS 'Optional reference to market basket (nullable for flexibility)';
