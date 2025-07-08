import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's subscription status
    const { data: userData } = await supabase
      .from("users")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    if (userData && userData.subscription_status === 'none') {
      return NextResponse.json(
        { error: 'API access is unavailable without a subscription.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get total analyses count
    const { count: totalAnalyses } = await supabase
      .from("sentiment_analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString());

    // Get sentiment distribution
    const { data: analyses } = await supabase
      .from("sentiment_analyses")
      .select("sentiment_result")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString());

    const sentimentDistribution = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    const keywordFrequency: { [key: string]: number } = {};

    analyses?.forEach((analysis) => {
      const result = analysis.sentiment_result as any;
      if (result.sentiment) {
        sentimentDistribution[
          result.sentiment as keyof typeof sentimentDistribution
        ]++;
      }

      // Count key phrases
      if (result.key_phrases && Array.isArray(result.key_phrases)) {
        result.key_phrases.forEach((phrase: string) => {
          keywordFrequency[phrase] = (keywordFrequency[phrase] || 0) + 1;
        });
      }
    });

    // Get daily usage
    const { data: dailyUsage } = await supabase
      .from("usage_tracking")
      .select("date, api_calls_count")
      .eq("user_id", user.id)
      .gte("date", startDate.toISOString().split("T")[0])
      .order("date", { ascending: true });

    // Get top keywords
    const topKeywords = Object.entries(keywordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, frequency]) => ({ keyword, frequency }));

    return NextResponse.json({
      total_analyses: totalAnalyses || 0,
      sentiment_distribution: sentimentDistribution,
      daily_usage:
        dailyUsage?.map((day) => ({
          date: day.date,
          count: day.api_calls_count,
        })) || [],
      top_keywords: topKeywords,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
