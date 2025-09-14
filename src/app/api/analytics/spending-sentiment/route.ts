import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

// Define the response type for our query
type SentimentResponse = {
  sentiment_score: number;
  customer: {
    spending_score: number;
  } | null;
};

type SpendingGroup = {
  label: string;
  min: number | null;
  max: number | null;
};

// Define spending score groups (0-100)
const SPENDING_GROUPS: SpendingGroup[] = [
  { label: '0-19', min: 0, max: 19 },
  { label: '20-39', min: 20, max: 39 },
  { label: '40-59', min: 40, max: 59 },
  { label: '60-79', min: 60, max: 79 },
  { label: '80-100', min: 80, max: 100 }
];

function getSpendingGroup(score: number): string {
  const group = SPENDING_GROUPS.find(
    ({ min, max }) => 
      (min === null || score >= min) && 
      (max === null || score <= max)
  );
  return group?.label || 'Unknown';
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sentiment analyses for the current user with customer spending scores
    const { data: sentimentData, error } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_score,
        customer:supermarket_customer_members!inner(
          spending_score
        )
      `)
      .eq('user_id', user.id)
      .not('customer.spending_score', 'is', null);

    if (error) {
      console.error('Error fetching spending sentiment data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch spending sentiment data' },
        { status: 500 }
      );
    }

    if (!sentimentData || sentimentData.length === 0) {
      return NextResponse.json({ chartData: [] });
    }

    // Count customers per spending group from the sentiment data
    const spendingCounts = (sentimentData || []).reduce<Record<string, number>>((acc, item: any) => {
      const score = item.customer?.spending_score;
      if (score === null || score === undefined) return acc;
      const group = getSpendingGroup(score);
      acc[group] = (acc[group] || 0) + 1;
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

    // Process the data to group by spending group
    const spendingGroups = (typedData || []).reduce<Record<string, {scores: number[]}>>((acc, item: any) => {
      if (item.customer?.spending_score === null || item.customer?.spending_score === undefined) return acc;
      
      const group = getSpendingGroup(item.customer.spending_score);
      if (!acc[group]) {
        acc[group] = { scores: [] };
      }
      acc[group].scores.push(item.sentiment_score);
      return acc;
    }, {} as Record<string, {scores: number[]}>);

    // Calculate average sentiment for each spending group
    const result = Object.entries(spendingGroups).map(([spendingGroup, {scores}]) => {
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      return {
        spendingGroup,
        averageScore,
        count: spendingCounts[spendingGroup] || 0
      };
    });

    // Sort by spending group
    const sortedResult = result.sort((a, b) => {
      const aMin = SPENDING_GROUPS.find(g => g.label === a.spendingGroup)?.min ?? -Infinity;
      const bMin = SPENDING_GROUPS.find(g => g.label === b.spendingGroup)?.min ?? -Infinity;
      return aMin - bMin;
    });

    return NextResponse.json({ chartData: sortedResult });
  } catch (error) {
    console.error('Error in spending sentiment analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
