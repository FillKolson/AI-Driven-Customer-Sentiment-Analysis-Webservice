import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

type BranchData = {
  supermarket_id: string;
  advertisement_spend: number;
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

    // Get branch data with advertisement spend and profit
    const { data, error } = await supabase
      .from('supermarket_branches')
      .select('supermarket_id, advertisement_spend, profit')
      .not('advertisement_spend', 'is', null)
      .not('profit', 'is', null);

    if (error) {
      console.error('Error fetching advertisement profit data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch advertisement profit data' },
        { status: 500 }
      );
    }

    // Sort by advertisement spend for better visualization
    const sortedData = [...(data || [])].sort((a, b) => 
      (a.advertisement_spend || 0) - (b.advertisement_spend || 0)
    );

    return NextResponse.json({ chartData: sortedData });
  } catch (error) {
    console.error('Error in advertisement profit analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
