import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

type MonthlySentimentData = {
  month: string;
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

    // Get sentiment data grouped by month
    const { data, error } = await supabase
      .rpc('get_monthly_sentiment_analytics', {
        p_user_id: user.id
      });

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

    // Format the data for the chart
    const formattedData = data.map((item: any) => ({
      month: item.month,
      averageScore: parseFloat(item.average_score.toFixed(2)),
      count: item.analysis_count
    }));

    return NextResponse.json({ chartData: formattedData });
  } catch (error) {
    console.error('Error in monthly sentiment analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
