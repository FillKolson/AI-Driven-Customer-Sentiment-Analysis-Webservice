import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

// Define the response type for our query
type SentimentResponse = {
  sentiment_score: number;
  customer: {
    gender: string;
  } | null;
};

type CustomerCount = {
  gender: string;
  count: number;
};

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sentiment analyses for the current user with customer gender information
    const { data: sentimentData, error } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_score,
        customer:supermarket_customer_members!inner(
          gender
        )
      `)
      .eq('user_id', user.id)
      .not('customer.gender', 'is', null);

    if (error) {
      console.error('Error fetching sentiment data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sentiment data' },
        { status: 500 }
      );
    }

    if (!sentimentData || sentimentData.length === 0) {
      return NextResponse.json({ chartData: [] });
    }

    // Process the data to group by gender and count customers
    const genderCounts = (sentimentData || []).reduce<Record<string, number>>((acc, item: any) => {
      const gender = item.customer?.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    const typedData = sentimentData as unknown as SentimentResponse[] | null;

    if (!typedData) {
      console.error('No valid data received');
      return NextResponse.json(
        { error: 'No valid data available' },
        { status: 404 }
      );
    }

    // Process the data to group by gender
    const genderGroups = (typedData || []).reduce<Record<string, number[]>>((acc, item) => {
      const gender = item.customer?.gender || 'Unknown';
      if (!acc[gender]) {
        acc[gender] = [];
      }
      acc[gender].push(item.sentiment_score);
      return acc;
    }, {} as Record<string, number[]>);

    // Calculate average sentiment for each gender and include the customer count
    const result = Object.entries(genderGroups).map(([gender, scores]) => {
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const customerCount = genderCounts[gender] || 0;
      
      return {
        gender,
        averageScore: parseFloat(averageScore.toFixed(2)),
        count: customerCount
      };
    });

    return NextResponse.json({ chartData: result });
  } catch (error) {
    console.error('Error in gender sentiment analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
