import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query to get average sentiment score by supermarket for the current user
    const { data, error } = await supabase
      .from('sentiment_analyses')
      .select('supermarket_id, sentiment_score')
      .eq('user_id', user.id)  // Filter by the current user's ID
      .not('supermarket_id', 'is', null);
    
    if (error) {
      console.error('Error fetching supermarket sentiment data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch supermarket sentiment data' },
        { status: 500 }
      );
    }

    // Calculate average sentiment score by supermarket
    const supermarketScores = data.reduce((acc: Record<string, { sum: number; count: number }>, item: { supermarket_id: string; sentiment_score: number }) => {
      const { supermarket_id, sentiment_score } = item;
      if (!acc[supermarket_id]) {
        acc[supermarket_id] = { sum: 0, count: 0 };
      }
      acc[supermarket_id].sum += sentiment_score;
      acc[supermarket_id].count++;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    // Convert to array of { supermarketId, averageScore } and sort by score
    const chartData = Object.entries(supermarketScores)
      .map(([supermarketId, { sum, count }]) => ({
        supermarketId,
        averageScore: sum / count
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    return NextResponse.json({ chartData });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
