-- First, drop the existing constraint
ALTER TABLE public.sentiment_analyses DROP CONSTRAINT IF EXISTS sentiment_analyses_analysis_type_check;

-- Then, add the new constraint with the updated values
ALTER TABLE public.sentiment_analyses ADD CONSTRAINT sentiment_analyses_analysis_type_check CHECK (analysis_type IN ('single_text', 'batch_file', 'batch_text'));
