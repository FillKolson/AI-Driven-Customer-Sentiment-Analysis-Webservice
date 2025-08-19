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

    // Query to get sentiment scores grouped by customer with purchase frequency data
    const { data: rawData, error: queryError } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_score,
        customer_id,
        supermarket_customer_members!inner(
          purchase_frequency,
          customer_id
        )
      `)
      .eq('user_id', userId)
      .not('sentiment_score', 'is', null)
      .not('supermarket_customer_members.purchase_frequency', 'is', null)
      .gte('sentiment_score', 0)  // Only positive sentiment scores (0 to 1)
      .lte('sentiment_score', 1)
      .order('customer_id');

    if (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch sentiment-frequency data' },
        { status: 500 }
      );
    }

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({
        chartData: [],
        summary: {
          totalDataPoints: 0,
          totalCustomers: 0,
          averageSentimentScore: 0,
          averagePurchaseFrequency: 0,
          correlationCoefficient: 0,
          sentimentRange: { min: 0, max: 0 },
          frequencyRange: { min: 0, max: 0 }
        }
      });
    }

    // Group data by customer_id and calculate averages
    const groupedData = rawData.reduce((acc: any, item: any) => {
      const customerId = item.customer_id;
      const sentimentScore = parseFloat(item.sentiment_score);
      const purchaseFrequency = parseFloat(item.supermarket_customer_members.purchase_frequency);

      if (!acc[customerId]) {
        acc[customerId] = {
          customerId,
          purchaseFrequency,
          sentimentScores: [],
          dataPointCount: 0
        };
      }

      acc[customerId].sentimentScores.push(sentimentScore);
      acc[customerId].dataPointCount++;
      
      return acc;
    }, {});

    // Calculate average sentiment score for each customer
    const chartData = Object.values(groupedData).map((customer: any) => {
      const averageSentimentScore = customer.sentimentScores.reduce((sum: number, score: number) => sum + score, 0) / customer.sentimentScores.length;
      
      return {
        customerId: customer.customerId,
        purchaseFrequency: customer.purchaseFrequency,
        averageSentimentScore: Number(averageSentimentScore.toFixed(4)),
        dataPointCount: customer.dataPointCount
      };
    });

    // Calculate summary statistics
    const totalDataPoints = rawData.length;
    const totalCustomers = chartData.length;
    
    const allSentimentScores = chartData.map(d => d.averageSentimentScore);
    const allPurchaseFrequencies = chartData.map(d => d.purchaseFrequency);

    const averageSentimentScore = allSentimentScores.reduce((sum, score) => sum + score, 0) / allSentimentScores.length;
    const averagePurchaseFrequency = allPurchaseFrequencies.reduce((sum, freq) => sum + freq, 0) / allPurchaseFrequencies.length;

    // Calculate correlation coefficient
    const correlationCoefficient = calculateCorrelation(allPurchaseFrequencies, allSentimentScores);

    const summary = {
      totalDataPoints,
      totalCustomers,
      averageSentimentScore: Number(averageSentimentScore.toFixed(4)),
      averagePurchaseFrequency: Number(averagePurchaseFrequency.toFixed(2)),
      correlationCoefficient: Number(correlationCoefficient.toFixed(4)),
      sentimentRange: {
        min: Math.min(...allSentimentScores),
        max: Math.max(...allSentimentScores)
      },
      frequencyRange: {
        min: Math.min(...allPurchaseFrequencies),
        max: Math.max(...allPurchaseFrequencies)
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
