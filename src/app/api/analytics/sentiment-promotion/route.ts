import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Query to get sentiment scores grouped by supermarket branch with promotion spend data
    const { data: rawData, error: queryError } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_score,
        supermarket_id,
        supermarket_branches!inner(
          promotion_spend,
          supermarket_id
        )
      `)
      .eq('user_id', userId)
      .not('sentiment_score', 'is', null)
      .not('supermarket_branches.promotion_spend', 'is', null)
      .gte('sentiment_score', 0)  // Only positive sentiment scores (0 to 1)
      .lte('sentiment_score', 1)
      .order('supermarket_id');

    if (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch sentiment-promotion data' },
        { status: 500 }
      );
    }

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({
        chartData: [],
        summary: {
          totalDataPoints: 0,
          totalBranches: 0,
          averageSentimentScore: 0,
          averagePromotionSpend: 0,
          correlationCoefficient: 0,
          sentimentRange: { min: 0, max: 0 },
          promotionSpendRange: { min: 0, max: 0 }
        }
      });
    }

    // Group data by supermarket_id and calculate averages
    const groupedData = rawData.reduce((acc: any, item: any) => {
      const supermarketId = item.supermarket_id;
      const sentimentScore = parseFloat(item.sentiment_score);
      const promotionSpend = parseFloat(item.supermarket_branches.promotion_spend);

      if (!acc[supermarketId]) {
        acc[supermarketId] = {
          supermarketId,
          promotionSpend,
          sentimentScores: [],
          dataPointCount: 0
        };
      }

      acc[supermarketId].sentimentScores.push(sentimentScore);
      acc[supermarketId].dataPointCount++;
      
      return acc;
    }, {});

    // Calculate average sentiment score for each branch
    const chartData = Object.values(groupedData).map((branch: any) => {
      const averageSentimentScore = branch.sentimentScores.reduce((sum: number, score: number) => sum + score, 0) / branch.sentimentScores.length;
      
      return {
        supermarketId: branch.supermarketId,
        promotionSpend: branch.promotionSpend,
        averageSentimentScore: Number(averageSentimentScore.toFixed(4)),
        dataPointCount: branch.dataPointCount
      };
    });

    // Calculate summary statistics
    const totalDataPoints = rawData.length;
    const totalBranches = chartData.length;
    
    const allSentimentScores = chartData.map(d => d.averageSentimentScore);
    const allPromotionSpends = chartData.map(d => d.promotionSpend);

    const averageSentimentScore = allSentimentScores.reduce((sum, score) => sum + score, 0) / allSentimentScores.length;
    const averagePromotionSpend = allPromotionSpends.reduce((sum, spend) => sum + spend, 0) / allPromotionSpends.length;

    // Calculate correlation coefficient
    const correlationCoefficient = calculateCorrelation(allPromotionSpends, allSentimentScores);

    const summary = {
      totalDataPoints,
      totalBranches,
      averageSentimentScore: Number(averageSentimentScore.toFixed(4)),
      averagePromotionSpend: Number(averagePromotionSpend.toFixed(2)),
      correlationCoefficient: Number(correlationCoefficient.toFixed(4)),
      sentimentRange: {
        min: Math.min(...allSentimentScores),
        max: Math.max(...allSentimentScores)
      },
      promotionSpendRange: {
        min: Math.min(...allPromotionSpends),
        max: Math.max(...allPromotionSpends)
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
