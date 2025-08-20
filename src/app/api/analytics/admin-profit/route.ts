import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

type BranchData = {
  branch_id: string;
  administration_spend: number;
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

    // Get branch data with administration spend and profit
    const { data, error } = await supabase
      .from('supermarket_branches')
      .select('supermarket_id, administration_spend, profit')
      .not('administration_spend', 'is', null)
      .not('profit', 'is', null);

    if (error) {
      console.error('Error fetching administration profit data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch administration profit data' },
        { status: 500 }
      );
    }

    // Sort by administration spend for better visualization
    const sortedData = [...(data || [])].sort((a, b) => 
      (a.administration_spend || 0) - (b.administration_spend || 0)
    );

    return NextResponse.json({ chartData: sortedData });
  } catch (error) {
    console.error('Error in administration profit analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
