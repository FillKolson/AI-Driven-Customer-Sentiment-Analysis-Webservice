import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

// Define the response type for our query
type SentimentResponse = {
  sentiment_score: number;
  customer: {
    customer_id: string;
    annual_income: number;
  } | null;
};

type IncomeGroup = {
  label: string;
  min: number | null;
  max: number | null;
};

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sentiment analyses for the current user with customer income information
    const { data: sentimentData, error } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_score,
        customer:supermarket_customer_members!inner(
          customer_id,
          annual_income
        )
      `)
      .eq('user_id', user.id)
      .not('customer.annual_income', 'is', null);

    if (error) {
      console.error('Error fetching income sentiment data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch income sentiment data' },
        { status: 500 }
      );
    }

    if (!sentimentData || sentimentData.length === 0) {
      return NextResponse.json({ chartData: [] });
    }

    // Group by income values and track unique customers
    const incomeMap = new Map<number, {
      scores: number[],
      customerIds: Set<string>
    }>();

    // Process each sentiment analysis
    const typedData = sentimentData as unknown as SentimentResponse[];
    typedData.forEach(item => {
      const income = item.customer?.annual_income;
      const customerId = item.customer?.customer_id;
      
      if (income === null || income === undefined || !customerId) return;
      
      // Initialize income group if it doesn't exist
      if (!incomeMap.has(income)) {
        incomeMap.set(income, { scores: [], customerIds: new Set() });
      }
      
      const group = incomeMap.get(income)!;
      group.scores.push(item.sentiment_score);
      group.customerIds.add(customerId);
    });

    // Convert to array and calculate average sentiment
    const result = Array.from(incomeMap.entries())
      .map(([income, { scores, customerIds }]) => ({
        incomeGroup: income.toString(),
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        count: customerIds.size // Count of unique customers with this income
      }))
      .sort((a, b) => parseInt(a.incomeGroup) - parseInt(b.incomeGroup));

    return NextResponse.json({ chartData: result });
  } catch (error) {
    console.error('Error in income sentiment analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
