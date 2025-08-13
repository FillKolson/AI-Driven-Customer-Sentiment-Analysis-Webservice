ALTER TABLE sentiment_analyses ADD COLUMN batch_job_id UUID REFERENCES batch_jobs(job_id);
