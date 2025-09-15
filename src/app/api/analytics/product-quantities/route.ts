import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

type ProductQuantity = {
  product_name: string;
  quantity: number;
};

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Execute the query to get product quantities
    const { data, error } = await supabase.rpc('get_product_quantities');

    if (error) {
      console.error('Error fetching product quantities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product quantities' },
        { status: 500 }
      );
    }

    // Sort by quantity in descending order
    const sortedData = (data as ProductQuantity[])
      .sort((a, b) => b.quantity - a.quantity);

    return NextResponse.json({ products: sortedData });
  } catch (error) {
    console.error('Error in product quantities analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
