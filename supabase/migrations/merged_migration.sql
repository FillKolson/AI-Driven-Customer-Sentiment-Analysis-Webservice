-- =============================================
-- MIGRATION 1: Initial Database Setup
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY NOT NULL,
    avatar_url text,
    user_id text UNIQUE,
    token_identifier text NOT NULL,
    subscription text,
    credits text,
    image text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone,
    email text,
    name text,
    full_name text,
    bio text,
    subscription_status TEXT DEFAULT 'free',
    api_usage_current_month INTEGER DEFAULT 0,
    api_limit_per_month INTEGER DEFAULT 100
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES public.users(user_id),
    stripe_id text UNIQUE,
    price_id text,
    stripe_price_id text,
    currency text,
    interval text,
    status text,
    current_period_start bigint,
    current_period_end bigint,
    cancel_at_period_end boolean,
    amount bigint,
    started_at bigint,
    ends_at bigint,
    ended_at bigint,
    canceled_at bigint,
    customer_cancellation_reason text,
    customer_cancellation_comment text,
    metadata jsonb,
    custom_field_data jsonb,
    customer_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS subscriptions_stripe_id_idx ON public.subscriptions(stripe_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);

-- Webhook events table
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL,
    type text NOT NULL,
    stripe_event_id text,
    data jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    modified_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS webhook_events_type_idx ON public.webhook_events(type);
CREATE INDEX IF NOT EXISTS webhook_events_stripe_event_id_idx ON public.webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS webhook_events_event_type_idx ON public.webhook_events(event_type);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications boolean DEFAULT true,
    marketing_emails boolean DEFAULT false,
    usage_notifications boolean DEFAULT true,
    theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    language text DEFAULT 'en',
    timezone text DEFAULT 'UTC',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Sentiment analyses table
CREATE TABLE IF NOT EXISTS public.sentiment_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    sentiment_result JSONB NOT NULL,
    analysis_type TEXT DEFAULT 'single_text' CHECK (analysis_type IN ('single_text', 'batch_file', 'batch_text')),
    file_name TEXT,
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    batch_job_id UUID,
    
    -- Metric data fields
    review_id TEXT,
    customer_id TEXT,
    gender TEXT,
    age INTEGER,
    
    -- Customer metrics
    genre TEXT,
    annual_income DECIMAL(12, 2),
    spending_score INTEGER,
    state TEXT,
    purchase_frequency INTEGER,
    total_purchases INTEGER,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    
    -- Business metrics
    profit DECIMAL(12, 2),
    administration_spend DECIMAL(12, 2),
    advertisement_spend DECIMAL(12, 2),
    promotion_spend DECIMAL(12, 2),
    average_order_value DECIMAL(12, 2),
    product_name TEXT,
    supermarket_id TEXT,
    
    -- Sentiment metrics
    sentiment_id TEXT,
    sentiment_score DECIMAL(3, 2) 
        CHECK (sentiment_score IS NULL OR (sentiment_score >= 0 AND sentiment_score <= 1)),
    sentiment_category TEXT 
        CHECK (sentiment_category IS NULL OR sentiment_category IN ('Positive', 'Neutral', 'Negative')),
    sentiment_date TIMESTAMP WITH TIME ZONE,
    confidence_level DECIMAL(3, 2)
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    api_calls_count INTEGER DEFAULT 0,
    tokens_consumed INTEGER DEFAULT 0,
    subscription_plan TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Batch jobs table
CREATE TABLE IF NOT EXISTS public.batch_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID UNIQUE NOT NULL,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    total_entries INTEGER DEFAULT 0,
    processed_entries INTEGER DEFAULT 0,
    file_name TEXT,
    results JSONB,
    error_message TEXT,
    summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- MIGRATION 2: Create Indexes
-- =============================================

-- Indexes for users table
CREATE INDEX IF NOT EXISTS users_user_id_idx ON public.users(user_id);

-- Indexes for user_preferences table
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON public.user_preferences(user_id);

-- Indexes for sentiment_analyses table
CREATE INDEX IF NOT EXISTS sentiment_analyses_user_id_idx ON public.sentiment_analyses(user_id);
CREATE INDEX IF NOT EXISTS sentiment_analyses_created_at_idx ON public.sentiment_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS sentiment_analyses_batch_job_id_idx ON public.sentiment_analyses(batch_job_id);
CREATE INDEX IF NOT EXISTS sentiment_analyses_review_id_idx ON public.sentiment_analyses(review_id);
CREATE INDEX IF NOT EXISTS sentiment_analyses_customer_id_idx ON public.sentiment_analyses(customer_id);
CREATE INDEX IF NOT EXISTS sentiment_analyses_sentiment_score_idx ON public.sentiment_analyses(sentiment_score);
CREATE INDEX IF NOT EXISTS sentiment_analyses_sentiment_category_idx ON public.sentiment_analyses(sentiment_category);
CREATE INDEX IF NOT EXISTS sentiment_analyses_sentiment_date_idx ON public.sentiment_analyses(sentiment_date);
CREATE INDEX IF NOT EXISTS sentiment_analyses_product_name_idx ON public.sentiment_analyses(product_name);
CREATE INDEX IF NOT EXISTS sentiment_analyses_supermarket_id_idx ON public.sentiment_analyses(supermarket_id);

-- Indexes for usage_tracking table
CREATE INDEX IF NOT EXISTS usage_tracking_user_id_date_idx ON public.usage_tracking(user_id, date);

-- Indexes for batch_jobs table
CREATE INDEX IF NOT EXISTS batch_jobs_user_id_idx ON public.batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS batch_jobs_job_id_idx ON public.batch_jobs(job_id);

-- =============================================
-- MIGRATION 3: Enable RLS and Create Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;

-- Users table policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can view own data'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own data" ON public.users
                FOR SELECT USING (auth.uid()::text = user_id)';
    END IF;
END
$$;

-- Subscriptions table policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'subscriptions' 
        AND policyname = 'Users can view own subscriptions'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
                FOR SELECT USING (auth.uid()::text = user_id)';
    END IF;
END
$$;

-- User preferences policies
DO $$
BEGIN
    -- View own preferences
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_preferences' 
        AND policyname = 'Users can view own preferences'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own preferences" ON public.user_preferences
                FOR SELECT USING (auth.uid() = user_id)';
    END IF;
    
    -- Insert own preferences
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_preferences' 
        AND policyname = 'Users can insert own preferences'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert own preferences" ON public.user_preferences
                FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;
    
    -- Update own preferences
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_preferences' 
        AND policyname = 'Users can update own preferences'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update own preferences" ON public.user_preferences
                FOR UPDATE USING (auth.uid() = user_id)';
    END IF;
    
    -- Delete own preferences
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_preferences' 
        AND policyname = 'Users can delete own preferences'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can delete own preferences" ON public.user_preferences
                FOR DELETE USING (auth.uid() = user_id)';
    END IF;
END
$$;

-- Sentiment analyses policies
DO $$
BEGIN
    -- View own analyses
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'sentiment_analyses' 
        AND policyname = 'Users can view own sentiment analyses'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own sentiment analyses" ON public.sentiment_analyses
                FOR SELECT USING (auth.uid() = user_id)';
    END IF;
    
    -- Insert own analyses
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'sentiment_analyses' 
        AND policyname = 'Users can insert own sentiment analyses'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert own sentiment analyses" ON public.sentiment_analyses
                FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;
END
$$;

-- Usage tracking policies
DO $$
BEGIN
    -- View own usage
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'usage_tracking' 
        AND policyname = 'Users can view own usage tracking'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own usage tracking" ON public.usage_tracking
                FOR SELECT USING (auth.uid() = user_id)';
    END IF;
    
    -- Insert own usage
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'usage_tracking' 
        AND policyname = 'Users can insert own usage tracking'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert own usage tracking" ON public.usage_tracking
                FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;
    
    -- Update own usage
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'usage_tracking' 
        AND policyname = 'Users can update own usage tracking'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update own usage tracking" ON public.usage_tracking
                FOR UPDATE USING (auth.uid() = user_id)';
    END IF;
END
$$;

-- Batch jobs policies
DO $$
BEGIN
    -- View own batch jobs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'batch_jobs' 
        AND policyname = 'Users can view own batch jobs'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view own batch jobs" ON public.batch_jobs
                FOR SELECT USING (auth.uid() = user_id)';
    END IF;
    
    -- Insert own batch jobs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'batch_jobs' 
        AND policyname = 'Users can insert own batch jobs'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can insert own batch jobs" ON public.batch_jobs
                FOR INSERT WITH CHECK (auth.uid() = user_id)';
    END IF;
    
    -- Update own batch jobs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'batch_jobs' 
        AND policyname = 'Users can update own batch jobs'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update own batch jobs" ON public.batch_jobs
                FOR UPDATE USING (auth.uid() = user_id)';
    END IF;
END
$$;

-- =============================================
-- MIGRATION 4: Create Functions and Triggers
-- =============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    user_id,
    email,
    name,
    full_name,
    avatar_url,
    token_identifier,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    name = NEW.raw_user_meta_data->>'name',
    full_name = NEW.raw_user_meta_data->>'full_name',
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NEW.updated_at
  WHERE user_id = NEW.id::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update usage tracking
CREATE OR REPLACE FUNCTION public.update_usage_tracking()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usage_tracking (user_id, date, api_calls_count, tokens_consumed, subscription_plan)
    VALUES (
        NEW.user_id,
        CURRENT_DATE,
        1,
        NEW.tokens_used,
        (SELECT subscription_status FROM public.users WHERE id = NEW.user_id)
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        api_calls_count = usage_tracking.api_calls_count + 1,
        tokens_consumed = usage_tracking.tokens_consumed + NEW.tokens_used;
    
    -- Update user's current month usage
    UPDATE public.users
    SET api_usage_current_month = api_usage_current_month + 1
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE public.users SET api_usage_current_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

DROP TRIGGER IF EXISTS on_sentiment_analysis_created ON public.sentiment_analyses;
CREATE TRIGGER on_sentiment_analysis_created
    AFTER INSERT ON public.sentiment_analyses
    FOR EACH ROW EXECUTE FUNCTION update_usage_tracking();

-- =============================================
-- MIGRATION 5: Enable Realtime
-- =============================================

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS sentiment_analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS usage_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS batch_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_preferences;

-- =============================================
-- MIGRATION 6: Add Comments
-- =============================================

-- Comments for user_preferences columns
COMMENT ON COLUMN public.user_preferences.usage_notifications IS 'Whether the user wants to receive usage limit notifications';

-- Comments for sentiment_analyses columns
COMMENT ON COLUMN public.sentiment_analyses.review_id IS 'Unique identifier for the review';
COMMENT ON COLUMN public.sentiment_analyses.customer_id IS 'Unique identifier for the customer';
COMMENT ON COLUMN public.sentiment_analyses.gender IS 'Customer gender information';
COMMENT ON COLUMN public.sentiment_analyses.age IS 'Customer age information';
COMMENT ON COLUMN public.sentiment_analyses.genre IS 'Customer gender';
COMMENT ON COLUMN public.sentiment_analyses.annual_income IS 'Customer annual income';
COMMENT ON COLUMN public.sentiment_analyses.spending_score IS 'Customer spending score';
COMMENT ON COLUMN public.sentiment_analyses.state IS 'Customer state/location';
COMMENT ON COLUMN public.sentiment_analyses.purchase_frequency IS 'Customer purchase frequency';
COMMENT ON COLUMN public.sentiment_analyses.total_purchases IS 'Total number of purchases by customer';
COMMENT ON COLUMN public.sentiment_analyses.last_purchase_date IS 'Date of last purchase';
COMMENT ON COLUMN public.sentiment_analyses.profit IS 'Profit amount';
COMMENT ON COLUMN public.sentiment_analyses.administration_spend IS 'Administration spending amount';
COMMENT ON COLUMN public.sentiment_analyses.advertisement_spend IS 'Advertisement spending amount';
COMMENT ON COLUMN public.sentiment_analyses.promotion_spend IS 'Promotion spending amount';
COMMENT ON COLUMN public.sentiment_analyses.average_order_value IS 'Average order value';
COMMENT ON COLUMN public.sentiment_analyses.product_name IS 'Name of the product';
COMMENT ON COLUMN public.sentiment_analyses.supermarket_id IS 'Supermarket identifier';
COMMENT ON COLUMN public.sentiment_analyses.sentiment_id IS 'Unique identifier for the sentiment analysis';
COMMENT ON COLUMN public.sentiment_analyses.sentiment_score IS 'Sentiment score between 0 and 1';
COMMENT ON COLUMN public.sentiment_analyses.sentiment_category IS 'Categorized sentiment (Positive, Neutral, Negative)';
COMMENT ON COLUMN public.sentiment_analyses.sentiment_date IS 'Date when sentiment was recorded';
COMMENT ON COLUMN public.sentiment_analyses.confidence_level IS 'Confidence level of the sentiment analysis';

-- =============================================
-- MIGRATION 7: Foreign Key Constraints
-- =============================================

-- Add foreign key from sentiment_analyses to batch_jobs using job_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'sentiment_analyses_batch_job_id_fkey'
    ) THEN
        ALTER TABLE public.sentiment_analyses 
        ADD CONSTRAINT sentiment_analyses_batch_job_id_fkey 
        FOREIGN KEY (batch_job_id) 
        REFERENCES public.batch_jobs(job_id) 
        ON DELETE SET NULL;
    END IF;
END
$$;
