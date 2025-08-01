import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('Testing Supabase functions accessibility...');
    
    // Test if we can invoke any function
    const { data, error } = await supabase.functions.invoke('get-plans', {
      body: {},
    });
    
    console.log('Function test result:', { data, error });
    
    if (error) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Functions not accessible', 
        error: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Functions are accessible',
      data 
    });
  } catch (error) {
    console.error('Function test error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Failed to test functions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}