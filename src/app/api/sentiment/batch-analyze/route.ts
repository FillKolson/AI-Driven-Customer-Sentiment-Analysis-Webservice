import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { analyzeSentiment } from "../../../../lib/claudeApi";

interface BatchAnalysisResult {
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

interface BatchAnalysisResponse {
  results: BatchAnalysisResult[];
  summary: {
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
  };
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { texts, fileType = "csv", fileName } = await request.json();

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: "Texts array is required" }, { status: 400 });
    }

    // Check if texts include metrics (for CSV files)
    const hasMetrics = texts.some((text: any) => typeof text === 'object' && text.text && text.metrics);

    if (texts.length > 10000) {
      return NextResponse.json(
        { error: "Maximum 10000 texts per batch analysis" },
        { status: 400 },
      );
    }

    // Check user's usage limits
    const { data: userData } = await supabase
      .from("users")
      .select(
        "api_usage_current_month, api_limit_per_month, subscription_status",
      )
      .eq("id", user.id)
      .single();

    if (userData && userData.subscription_status === 'none') {
      return NextResponse.json(
        { error: 'API access is unavailable without a subscription.' },
        { status: 403 },
      );
    }

    // Check if batch analysis would exceed limits
    const requiredCalls = texts.length;
    if (
      userData &&
      userData.api_usage_current_month + requiredCalls > userData.api_limit_per_month
    ) {
      return NextResponse.json(
        {
          error: `Batch analysis would exceed your monthly limit. You have ${userData.api_limit_per_month - userData.api_usage_current_month} calls remaining, but need ${requiredCalls} calls.`,
        },
        { status: 429 },
      );
    }

    // Process each text
    const results: BatchAnalysisResult[] = [];
    let totalTokens = 0;
    let totalProcessingTime = 0;
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < texts.length; i++) {
      const textItem = texts[i];
      let text: string;
      let metrics: any = {};
      
      // Handle both string and object formats
      if (typeof textItem === 'string') {
        text = textItem;
      } else if (typeof textItem === 'object' && textItem.text) {
        text = textItem.text;
        metrics = textItem.metrics || {};
      } else {
        results.push({
          id: `item_${i}`,
          text: "",
          sentiment: "neutral",
          confidence: 0,
          key_phrases: [],
          processing_time_ms: 0,
          tokens_used: 0,
          error: "Invalid text format",
        });
        failed++;
        continue;
      }
      
      if (!text || text.trim().length === 0) {
        results.push({
          id: `item_${i}`,
          text: text || "",
          sentiment: "neutral",
          confidence: 0,
          key_phrases: [],
          processing_time_ms: 0,
          tokens_used: 0,
          error: "Empty or invalid text",
        });
        failed++;
        continue;
      }

      if (text.length > 10000) {
        results.push({
          id: `item_${i}`,
          text: text,
          sentiment: "neutral",
          confidence: 0,
          key_phrases: [],
          processing_time_ms: 0,
          tokens_used: 0,
          error: "Text too long (max 10,000 characters)",
        });
        failed++;
        continue;
      }

      try {
        const itemStartTime = Date.now();
        const result = await analyzeSentiment({ userId: user.id, text });
        const itemProcessingTime = Date.now() - itemStartTime;

        results.push({
          id: `item_${i}`,
          text: text,
          sentiment: result.sentiment,
          confidence: result.confidence,
          key_phrases: result.key_phrases,
          processing_time_ms: itemProcessingTime,
          tokens_used: result.tokens_used,
          metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
        });

        totalTokens += result.tokens_used;
        totalProcessingTime += itemProcessingTime;
        successful++;

        // Store individual analysis in database
        const { error: insertError } = await supabase
          .from("sentiment_analyses")
          .insert({
            user_id: user.id,
            input_text: text,
            sentiment_result: result,
            analysis_type: "batch_file",
            file_name: fileName,
            tokens_used: result.tokens_used,
            processing_time_ms: itemProcessingTime,
            // Add metric fields if available
            ...(metrics.review_id && { review_id: metrics.review_id }),
            ...(metrics.customer_id && { customer_id: metrics.customer_id }),
            ...(metrics.product_id && { product_id: metrics.product_id }),
            ...(metrics.review_date && { review_date: metrics.review_date }),
            ...(metrics.gender && { gender: metrics.gender }),
            ...(metrics.age && { age: metrics.age }),
            ...(metrics.country && { country: metrics.country }),
            ...(metrics.language && { language: metrics.language }),
            ...(metrics.category_of_product && { category_of_product: metrics.category_of_product }),
          });

        if (insertError) {
          console.error("Error storing batch analysis:", insertError);
        }

      } catch (error: any) {
        console.error(`Error analyzing text ${i}:`, error);
        results.push({
          id: `item_${i}`,
          text: text,
          sentiment: "neutral",
          confidence: 0,
          key_phrases: [],
          processing_time_ms: 0,
          tokens_used: 0,
          error: error.message || "Analysis failed",
        });
        failed++;
      }
    }

    // Calculate sentiment distribution
    const sentimentDistribution = {
      positive: results.filter(r => r.sentiment === "positive" && !r.error).length,
      negative: results.filter(r => r.sentiment === "negative" && !r.error).length,
      neutral: results.filter(r => r.sentiment === "neutral" && !r.error).length,
    };

    const response: BatchAnalysisResponse = {
      results,
      summary: {
        total_processed: texts.length,
        successful,
        failed,
        total_tokens: totalTokens,
        total_processing_time: Date.now() - startTime,
        sentiment_distribution: sentimentDistribution,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Batch sentiment analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 
