import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

type BranchData = {
  branch_id: string;
  branch_name: string;
  promotion_spend: number;
  profit: number;
};

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get branch data with promotion spend and profit for the current user
    const { data, error } = await supabase
      .from('supermarket_branches')
      .select('promotion_spend, profit')
      .eq('user_id', user.id)
      .not('promotion_spend', 'is', null)
      .not('profit', 'is', null);

    if (error) {
      console.error('Error fetching promotion profit data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch promotion profit data' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ chartData: [] });
    }

    // Sort by promotion spend for better visualization
    const sortedData = data
      .filter(branch => branch.promotion_spend !== null && branch.profit !== null)
      .sort((a, b) => (a.promotion_spend || 0) - (b.promotion_spend || 0));

    return NextResponse.json({ chartData: sortedData });
  } catch (error) {
    console.error('Error in promotion profit analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
