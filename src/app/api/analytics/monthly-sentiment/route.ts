import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

type MonthlySentimentData = {
  sentiment_date: string;
  average_score: number;
  analysis_count: number;
};

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get sentiment data directly from sentiment_analyses table grouped by date
    const { data, error } = await supabase
      .from('sentiment_analyses')
      .select('sentiment_date, sentiment_score')
      .eq('user_id', user.id)
      .order('sentiment_date', { ascending: true });

    if (error) {
      console.error('Error fetching monthly sentiment data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch monthly sentiment data' },
        { status: 500 }
      );
    }

    // If no data, return empty array
    if (!data || data.length === 0) {
      return NextResponse.json({ chartData: [] });
    }

    // Group data by month and calculate average sentiment score per month
    const groupedData = data.reduce((acc: any, item: any) => {
      // Extract year-month from sentiment_date (e.g., "2023-12-25" -> "2023-12")
      const date = new Date(item.sentiment_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          scores: [],
          count: 0
        };
      }
      acc[monthKey].scores.push(item.sentiment_score);
      acc[monthKey].count++;
      return acc;
    }, {});

    // Calculate average scores for each month
    const formattedData = Object.values(groupedData).map((item: any) => {
      const averageScore = item.scores.reduce((sum: number, score: number) => sum + score, 0) / item.scores.length;
      return {
        month: item.month,
        averageScore: parseFloat(averageScore.toFixed(3)),
        count: item.count
      };
    });

    // Sort by month
    formattedData.sort((a, b) => new Date(a.month + '-01').getTime() - new Date(b.month + '-01').getTime());

    return NextResponse.json({ chartData: formattedData });
  } catch (error) {
    console.error('Error in monthly sentiment analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
