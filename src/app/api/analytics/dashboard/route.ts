import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch sentiment analyses with customer and supermarket data
    const { data: sentimentData, error: sentimentError } = await supabase
      .from('sentiment_analyses')
      .select(`
        *,
        supermarket_customer_members!inner(
          gender,
          age,
          annual_income,
          spending_score,
          total_purchases,
          average_order_value,
          purchase_frequency
        ),
        supermarket_branches!inner(
          advertisement_spend,
          promotion_spend,
          administration_spend,
          profit
        )
      `)
      .eq('user_id', user.id)
      .order('sentiment_date', { ascending: false });

    if (sentimentError) {
      console.error('Error fetching sentiment data:', sentimentError);
      return NextResponse.json({ error: "Failed to fetch sentiment data" }, { status: 500 });
    }

    // If no data exists, return empty structure with mock data for demonstration
    if (!sentimentData || sentimentData.length === 0) {
      return NextResponse.json({
        analyses: [],
        message: "No data available. Using mock data for demonstration."
      });
    }

    // Process the data for charts
    const processedData = sentimentData.map((item: any) => ({
      id: item.sentiment_id,
      input_text: item.input_text || "",
      sentiment_result: {
        sentiment: item.sentiment_category,
        confidence: item.confidence_level,
        key_phrases: item.sentiment_result?.key_phrases || []
      },
      created_at: item.created_at,
      tokens_used: item.tokens_used || 0,
      processing_time_ms: item.processing_time_ms || 0,
      sentiment_score: item.sentiment_score,
      sentiment_date: item.sentiment_date,
      customer_id: item.customer_id,
      supermarket_id: item.supermarket_id,
      file_name: item.file_name,
      
      // Customer data
      gender: item.supermarket_customer_members?.gender,
      age: item.supermarket_customer_members?.age,
      annual_income: item.supermarket_customer_members?.annual_income,
      spending_score: item.supermarket_customer_members?.spending_score,
      total_purchases: item.supermarket_customer_members?.total_purchases,
      average_order_value: item.supermarket_customer_members?.average_order_value,
      purchase_frequency: item.supermarket_customer_members?.purchase_frequency,
      
      // Supermarket data
      advertisement_spend: item.supermarket_branches?.advertisement_spend,
      promotion_spend: item.supermarket_branches?.promotion_spend,
      administration_spend: item.supermarket_branches?.administration_spend,
      profit: item.supermarket_branches?.profit
    }));

    // Calculate analytics statistics
    const sentimentCounts = processedData.reduce((acc, item) => {
      const category = item.sentiment_result.sentiment as 'positive' | 'negative' | 'neutral';
      if (category && (category === 'positive' || category === 'negative' || category === 'neutral')) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    // Calculate daily usage for the last 30 days
    const dailyUsage = processedData.reduce((acc, item) => {
      const date = new Date(item.sentiment_date).toISOString().split('T')[0];
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [] as Array<{ date: string; count: number }>);

    // Extract top keywords from sentiment results
    const keywordFrequency: { [key: string]: number } = {};
    processedData.forEach(item => {
      if (item.sentiment_result.key_phrases) {
        item.sentiment_result.key_phrases.forEach((phrase: string) => {
          keywordFrequency[phrase] = (keywordFrequency[phrase] || 0) + 1;
        });
      }
    });

    const topKeywords = Object.entries(keywordFrequency)
      .map(([keyword, frequency]) => ({ keyword, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return NextResponse.json({
      analyses: processedData,
      total: processedData.length,
      analytics: {
        total_analyses: processedData.length,
        sentiment_distribution: sentimentCounts,
        daily_usage: dailyUsage.sort((a, b) => a.date.localeCompare(b.date)),
        top_keywords: topKeywords
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
