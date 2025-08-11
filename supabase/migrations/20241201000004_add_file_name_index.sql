-- Add index on file_name column for better sorting performance
CREATE INDEX IF NOT EXISTS sentiment_analyses_file_name_idx ON public.sentiment_analyses(file_name);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS sentiment_analyses_user_file_name_idx ON public.sentiment_analyses(user_id, file_name);
CREATE INDEX IF NOT EXISTS sentiment_analyses_user_created_at_idx ON public.sentiment_analyses(user_id, created_at DESC); 