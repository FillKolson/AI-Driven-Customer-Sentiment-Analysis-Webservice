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

    // First, get all customers with their spending scores
    const { data: allCustomers, error: customersError } = await supabase
      .from('supermarket_customer_members')
      .select('spending_score')
      .not('spending_score', 'is', null);

    if (customersError) {
      console.error('Error fetching customer spending scores:', customersError);
      return NextResponse.json(
        { error: 'Failed to fetch customer spending scores' },
        { status: 500 }
      );
    }

    // Count customers per spending group
    const spendingCounts = (allCustomers || []).reduce<Record<string, number>>((acc, { spending_score }) => {
      if (spending_score === null) return acc;
      const group = getSpendingGroup(spending_score);
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});

    // Then get the sentiment scores with customer spending scores
    const { data, error } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_score,
        customer:supermarket_customer_members!inner(
          spending_score
        )
      `)
      .not('customer.spending_score', 'is', null);

    const typedData = data as unknown as SentimentResponse[] | null;

    if (error) {
      console.error('Error fetching spending sentiment data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch spending sentiment data' },
        { status: 500 }
      );
    }

    // Process the data to group by spending group
    const spendingGroups = (typedData || []).reduce<Record<string, {scores: number[]}>>((acc, item) => {
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
