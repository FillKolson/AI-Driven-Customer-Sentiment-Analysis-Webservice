import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to access analytics data' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Query to get sentiment scores and profit data
    // Join sentiment_analyses with supermarket_branches to get both sentiment_score and profit
    const { data: sentimentProfitData, error: queryError } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_score,
        supermarket_branches!inner(
          profit,
          supermarket_id
        )
      `)
      .eq('user_id', userId)
      .not('sentiment_score', 'is', null)
      .not('supermarket_branches.profit', 'is', null)
      .order('sentiment_date', { ascending: true });

    if (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch sentiment-profit data' },
        { status: 500 }
      );
    }

    if (!sentimentProfitData || sentimentProfitData.length === 0) {
      return NextResponse.json({
        chartData: [],
        summary: {
          totalDataPoints: 0,
          averageSentimentScore: 0,
          averageProfit: 0,
          correlationCoefficient: 0,
          sentimentRange: { min: 0, max: 0 },
          profitRange: { min: 0, max: 0 }
        }
      });
    }

    // Transform data for chart
    const chartData = sentimentProfitData.map((item: any) => ({
      profit: parseFloat(item.supermarket_branches.profit || 0),
      sentimentScore: parseFloat(item.sentiment_score || 0),
      supermarketId: item.supermarket_branches.supermarket_id
    }));

    // Calculate summary statistics
    const sentimentScores = chartData.map(d => d.sentimentScore);
    const profits = chartData.map(d => d.profit);

    const averageSentimentScore = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
    const averageProfit = profits.reduce((sum, profit) => sum + profit, 0) / profits.length;

    // Calculate correlation coefficient
    const correlationCoefficient = calculateCorrelation(sentimentScores, profits);

    const summary = {
      totalDataPoints: chartData.length,
      averageSentimentScore: Number(averageSentimentScore.toFixed(3)),
      averageProfit: Number(averageProfit.toFixed(2)),
      correlationCoefficient: Number(correlationCoefficient.toFixed(3)),
      sentimentRange: {
        min: Math.min(...sentimentScores),
        max: Math.max(...sentimentScores)
      },
      profitRange: {
        min: Math.min(...profits),
        max: Math.max(...profits)
      }
    };

    return NextResponse.json({
      chartData,
      summary
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}
