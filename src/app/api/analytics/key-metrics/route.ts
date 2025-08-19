import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query to get sentiment data with dates and scores, joined with customer data for average order values
    const { data: sentimentData, error: sentimentError } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_date,
        sentiment_score,
        customer_id,
        supermarket_customer_members!inner(average_order_value)
      `)
      .eq('user_id', user.id)
      .not('sentiment_score', 'is', null)
      .not('supermarket_customer_members.average_order_value', 'is', null)
      .gt('sentiment_score', 0) // Only positive sentiment scores
      .gt('supermarket_customer_members.average_order_value', 0) // Only positive order values
      .order('sentiment_date', { ascending: true });

    if (sentimentError) {
      console.error('Error fetching sentiment data:', sentimentError);
      return NextResponse.json({ 
        error: "No data available. Please ensure you have sentiment analyses with associated customer data." 
      }, { status: 404 });
    }

    if (!sentimentData || sentimentData.length === 0) {
      return NextResponse.json({ 
        error: "No positive sentiment data with customer information found. Please add sentiment analyses with customer data first." 
      }, { status: 404 });
    }

    // Group data by date and calculate averages
    const dateGroups: { [key: string]: { sentimentScores: number[], orderValues: number[] } } = {};
    
    sentimentData.forEach((item: any) => {
      const date = new Date(item.sentiment_date).toLocaleDateString();
      if (!dateGroups[date]) {
        dateGroups[date] = { sentimentScores: [], orderValues: [] };
      }
      
      // Multiply sentiment score by 100 as requested
      dateGroups[date].sentimentScores.push(item.sentiment_score * 100);
      dateGroups[date].orderValues.push(item.supermarket_customer_members.average_order_value);
    });

    // Calculate averages for each date
    const chartData = Object.entries(dateGroups).map(([date, data]) => ({
      date,
      averageSentimentScore: data.sentimentScores.reduce((sum, score) => sum + score, 0) / data.sentimentScores.length,
      averageOrderValue: data.orderValues.reduce((sum, value) => sum + value, 0) / data.orderValues.length
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate overall averages for summary
    const overallAverageSentimentScore = sentimentData.reduce((sum: number, item: any) => sum + (item.sentiment_score * 100), 0) / sentimentData.length;
    const overallAverageOrderValue = sentimentData.reduce((sum: number, item: any) => sum + item.supermarket_customer_members.average_order_value, 0) / sentimentData.length;

    return NextResponse.json({
      success: true,
      data: {
        chartData,
        summary: {
          totalDataPoints: sentimentData.length,
          dateRange: chartData.length > 0 ? {
            start: chartData[0].date,
            end: chartData[chartData.length - 1].date
          } : null,
          overallAverageSentimentScore: Math.round(overallAverageSentimentScore * 100) / 100,
          overallAverageOrderValue: Math.round(overallAverageOrderValue * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Error in key-metrics API:', error);
    return NextResponse.json({ 
      error: "Internal server error while fetching key metrics data" 
    }, { status: 500 });
  }
}
