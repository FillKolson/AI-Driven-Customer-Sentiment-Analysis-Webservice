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

    // Query to get sentiment categories count using sentiment_category field
    const { data: rawData, error: queryError } = await supabase
      .from('sentiment_analyses')
      .select('sentiment_category')
      .eq('user_id', userId)
      .not('sentiment_category', 'is', null);

    if (queryError) {
      console.error('Database query error:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch sentiment categories data' },
        { status: 500 }
      );
    }

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({
        chartData: [],
        summary: {
          totalAnalyses: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          dominantSentiment: 'none',
          sentimentBalance: 0
        }
      });
    }

    // Count sentiment categories
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    rawData.forEach((item: any) => {
      const sentimentCategory = item.sentiment_category;
      if (sentimentCategory) {
        const sentiment = sentimentCategory.toLowerCase();
        if (sentiment === 'positive') {
          positiveCount++;
        } else if (sentiment === 'negative') {
          negativeCount++;
        } else if (sentiment === 'neutral') {
          neutralCount++;
        }
      }
    });

    const totalAnalyses = positiveCount + negativeCount + neutralCount;

    if (totalAnalyses === 0) {
      return NextResponse.json({
        chartData: [],
        summary: {
          totalAnalyses: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          dominantSentiment: 'none',
          sentimentBalance: 0
        }
      });
    }

    // Calculate percentages
    const positivePercentage = (positiveCount / totalAnalyses) * 100;
    const negativePercentage = (negativeCount / totalAnalyses) * 100;
    const neutralPercentage = (neutralCount / totalAnalyses) * 100;

    // Determine dominant sentiment
    let dominantSentiment = 'neutral';
    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      dominantSentiment = 'positive';
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      dominantSentiment = 'negative';
    }

    // Calculate sentiment balance (positive - negative as percentage of total)
    const sentimentBalance = ((positiveCount - negativeCount) / totalAnalyses) * 100;

    // Create chart data
    const chartData = [
      {
        name: 'Positive',
        value: positiveCount,
        percentage: positivePercentage,
        color: '#10b981' // green-500
      },
      {
        name: 'Negative',
        value: negativeCount,
        percentage: negativePercentage,
        color: '#ef4444' // red-500
      },
      {
        name: 'Neutral',
        value: neutralCount,
        percentage: neutralPercentage,
        color: '#f59e0b' // amber-500
      }
    ].filter(item => item.value > 0); // Only include categories with data

    const summary = {
      totalAnalyses,
      positiveCount,
      negativeCount,
      neutralCount,
      dominantSentiment,
      sentimentBalance: Number(sentimentBalance.toFixed(2))
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
