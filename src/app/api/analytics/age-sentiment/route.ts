import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

// Define the response type for our query
type SentimentResponse = {
  sentiment_score: number;
  customer: {
    age: number;
  } | null;
};

type AgeGroup = {
  label: string;
  min: number | null;
  max: number | null;
};

const AGE_GROUPS: AgeGroup[] = [
  { label: '<20', min: null, max: 19 },
  { label: '20-24', min: 20, max: 24 },
  { label: '25-29', min: 25, max: 29 },
  { label: '30-34', min: 30, max: 34 },
  { label: '35-39', min: 35, max: 39 },
  { label: '40-44', min: 40, max: 44 },
  { label: '45-49', min: 45, max: 49 },
  { label: '50-54', min: 50, max: 54 },
  { label: '55-59', min: 55, max: 59 },
  { label: '60-64', min: 60, max: 64 },
  { label: '65-69', min: 65, max: 69 },
  { label: '70-74', min: 70, max: 74 },
  { label: '75-79', min: 75, max: 79 },
  { label: '80>=', min: 80, max: null },
];

function getAgeGroup(age: number): string {
  const group = AGE_GROUPS.find(
    ({ min, max }) => 
      (min === null || age >= min) && 
      (max === null || age <= max)
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

    // First, get all customers with their ages
    const { data: allCustomers, error: customersError } = await supabase
      .from('supermarket_customer_members')
      .select('age')
      .not('age', 'is', null);

    if (customersError) {
      console.error('Error fetching customer ages:', customersError);
      return NextResponse.json(
        { error: 'Failed to fetch customer ages' },
        { status: 500 }
      );
    }

    // Count customers per age
    const ageCounts = (allCustomers || []).reduce<Record<number, number>>((acc, { age }) => {
      if (age === null) return acc;
      acc[age] = (acc[age] || 0) + 1;
      return acc;
    }, {});

    // Then get the sentiment scores with customer ages
    const { data, error } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_score,
        customer:supermarket_customer_members!inner(
          age
        )
      `)
      .not('customer.age', 'is', null);

    const typedData = data as unknown as SentimentResponse[] | null;

    if (error) {
      console.error('Error fetching age sentiment data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch age sentiment data' },
        { status: 500 }
      );
    }

    // Process the data to group by age group
    const ageGroups = (typedData || []).reduce<Record<string, {scores: number[], customerAges: Record<number, boolean>}>>((acc, item) => {
      if (!item.customer?.age) return acc;
      
      const ageGroup = getAgeGroup(item.customer.age);
      if (!acc[ageGroup]) {
        acc[ageGroup] = { scores: [], customerAges: {} };
      }
      acc[ageGroup].scores.push(item.sentiment_score);
      acc[ageGroup].customerAges[item.customer.age] = true;
      return acc;
    }, {} as Record<string, {scores: number[], customerAges: Record<number, boolean>}>);

    // Calculate average sentiment and get customer counts for each age group
    const result = Object.entries(ageGroups).map(([ageGroup, {scores, customerAges}]) => {
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      // Calculate the total count of customers in this age group
      const customerCount = Object.entries(ageCounts)
        .filter(([age]) => {
          const group = getAgeGroup(Number(age));
          return group === ageGroup;
        })
        .reduce((sum, [, count]) => sum + (count || 0), 0);
      
      return {
        ageGroup,
        averageScore,
        count: customerCount
      };
    });

    // Sort by age group
    const sortedResult = result.sort((a, b) => {
      const aMin = AGE_GROUPS.find(g => g.label === a.ageGroup)?.min ?? -Infinity;
      const bMin = AGE_GROUPS.find(g => g.label === b.ageGroup)?.min ?? -Infinity;
      return aMin - bMin;
    });

    return NextResponse.json({ chartData: sortedResult });
  } catch (error) {
    console.error('Error in age sentiment analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
