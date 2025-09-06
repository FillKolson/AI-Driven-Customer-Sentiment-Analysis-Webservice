export interface SentimentResult {
  id: string;
  text: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  key_phrases: string[];
  processing_time_ms: number;
  tokens_used: number;
  error?: string;
  metrics?: {
    review_id?: string;
    customer_id?: string;
    product_id?: string;
    review_date?: string;
    gender?: string;
    age?: number;
    country?: string;
    language?: string;
    category_of_product?: string;
  };
}

export interface BatchAnalysisSummary {
  total_processed: number;
  successful: number;
  failed: number;
  total_tokens: number;
  total_processing_time: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface BatchJob {
  id: string;
  user_id: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  results?: SentimentResult[];
  summary?: BatchAnalysisSummary;
  error?: string;
  created_at: string;
  updated_at: string;
}
