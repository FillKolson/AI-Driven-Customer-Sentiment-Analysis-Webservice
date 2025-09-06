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

    // First, get the count of unique customers per gender
    const { data: customerCounts, error: countError } = await supabase
      .from('supermarket_customer_members')
      .select('gender')
      .not('gender', 'is', null);

    if (countError) {
      console.error('Error fetching customer counts by gender:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch customer counts by gender' },
        { status: 500 }
      );
    }

    // Process the customer counts locally
    const genderCounts = (customerCounts || []).reduce<Record<string, number>>((acc, item) => {
      const gender = item.gender || 'Unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    // Then get the average sentiment by gender
    const { data, error } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_score,
        customer:supermarket_customer_members!inner(
          gender
        )
      `)
      .not('customer.gender', 'is', null);

    const typedData = data as unknown as SentimentResponse[] | null;

    if (error) {
      console.error('Error fetching gender sentiment data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch gender sentiment data' },
        { status: 500 }
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
