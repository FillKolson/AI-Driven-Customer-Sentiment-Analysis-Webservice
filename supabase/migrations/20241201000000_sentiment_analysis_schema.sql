-- Update database schema for SentimentScope

-- Add sentiment analysis specific columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS api_usage_current_month INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS api_limit_per_month INTEGER DEFAULT 100;

-- Create sentiment_analyses table
CREATE TABLE IF NOT EXISTS public.sentiment_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    sentiment_result JSONB NOT NULL,
    analysis_type TEXT DEFAULT 'single_text' CHECK (analysis_type IN ('single_text', 'batch_file')),
    file_name TEXT,
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create usage_tracking table
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

-- Create batch_jobs table for batch processing
CREATE TABLE IF NOT EXISTS public.batch_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    total_entries INTEGER DEFAULT 0,
    processed_entries INTEGER DEFAULT 0,
    file_name TEXT,
    results JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sentiment_analyses_user_id_idx ON public.sentiment_analyses(user_id);
CREATE INDEX IF NOT EXISTS sentiment_analyses_created_at_idx ON public.sentiment_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS usage_tracking_user_id_date_idx ON public.usage_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS batch_jobs_user_id_idx ON public.batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS batch_jobs_job_id_idx ON public.batch_jobs(job_id);

-- Enable RLS
ALTER TABLE public.sentiment_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own sentiment analyses" ON public.sentiment_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sentiment analyses" ON public.sentiment_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own usage tracking" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage tracking" ON public.usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage tracking" ON public.usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own batch jobs" ON public.batch_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own batch jobs" ON public.batch_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch jobs" ON public.batch_jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sentiment_analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE usage_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE batch_jobs;

-- Function to update usage tracking
CREATE OR REPLACE FUNCTION update_usage_tracking()
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

-- Create trigger for usage tracking
DROP TRIGGER IF EXISTS on_sentiment_analysis_created ON public.sentiment_analyses;
CREATE TRIGGER on_sentiment_analysis_created
    AFTER INSERT ON public.sentiment_analyses
    FOR EACH ROW EXECUTE FUNCTION update_usage_tracking();

-- Function to reset monthly usage (to be called monthly)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    UPDATE public.users SET api_usage_current_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;