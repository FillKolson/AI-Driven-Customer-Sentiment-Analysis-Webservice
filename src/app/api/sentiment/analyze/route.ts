import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { analyzeSentiment } from "../../../../lib/claudeApi";

interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  key_phrases: string[];
  processing_time_ms: number;
  tokens_used: number;
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
    const { text, options = {} } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: "Text too long (max 10,000 characters)" },
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

    if (
      userData &&
      userData.api_usage_current_month >= userData.api_limit_per_month
    ) {
      return NextResponse.json(
        {
          error: "API usage limit exceeded. Please upgrade your plan.",
        },
        { status: 429 },
      );
    }

    // Use Claude API service (with caching, rate limiting, error handling)
    let result;
    try {
      result = await analyzeSentiment({ userId: user.id, text });
    } catch (err: any) {
      if (err.message.includes("Rate limit")) {
        return NextResponse.json({ error: err.message }, { status: 429 });
      }
      if (err.message.includes("Claude API error")) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Store the analysis in the database
    const { error: insertError } = await supabase
      .from("sentiment_analyses")
      .insert({
        user_id: user.id,
        input_text: text,
        sentiment_result: result,
        analysis_type: "single_text",
        tokens_used: result.tokens_used,
        processing_time_ms: result.processing_time_ms,
      });

    if (insertError) {
      console.error("Error storing analysis:", insertError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
