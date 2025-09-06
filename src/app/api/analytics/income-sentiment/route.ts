import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

// Define the response type for our query
type SentimentResponse = {
  sentiment_score: number;
  customer: {
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

    // Get sentiment scores with customer income in one query
    const { data, error } = await supabase
      .from('sentiment_analyses')
      .select(`
        sentiment_score,
        customer:supermarket_customer_members!inner(
          annual_income
        )
      `)
      .not('customer.annual_income', 'is', null);

    const typedData = data as unknown as SentimentResponse[] | null;

    if (error) {
      console.error('Error fetching income sentiment data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch income sentiment data' },
        { status: 500 }
      );
    }

    // Group by exact income values
    const incomeMap = new Map<number, { scores: number[], count: number }>();
    
    // First pass: collect all unique incomes and their sentiment scores
    (typedData || []).forEach(item => {
      if (item.customer?.annual_income === null || item.customer?.annual_income === undefined) return;
      
      const income = item.customer.annual_income;
      if (!incomeMap.has(income)) {
        incomeMap.set(income, { scores: [], count: 0 });
      }
      incomeMap.get(income)?.scores.push(item.sentiment_score);
    });

    // Second pass: count occurrences of each income
    const { data: allCustomers } = await supabase
      .from('supermarket_customer_members')
      .select('annual_income')
      .not('annual_income', 'is', null);

    allCustomers?.forEach(({ annual_income }) => {
      if (annual_income === null) return;
      const entry = incomeMap.get(annual_income);
      if (entry) {
        entry.count++;
      }
    });

    // Convert to array and calculate average sentiment
    const result = Array.from(incomeMap.entries())
      .map(([income, { scores, count }]) => ({
        incomeGroup: income.toString(),
        averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        count
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
