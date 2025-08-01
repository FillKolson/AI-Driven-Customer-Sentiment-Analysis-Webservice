import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User:', user);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the most recent active subscription instead of using .single()
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id.toString())
      .in('status', ['active', 'trialing', 'past_due'])
      .order('current_period_end', { ascending: false })
      .limit(1);
    
    console.log('Subscription query result:', { subscriptions, subscriptionError });

    if (subscriptionError) {
      console.error('Subscription query error:', subscriptionError);
      return NextResponse.json({ error: 'Failed to fetch subscription: ' + subscriptionError.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const subscription = subscriptions[0]; // Get the most recent active subscription
    console.log('Selected subscription:', subscription);

    console.log('Calling cancel-subscription function with:', subscription.stripe_id);

    // Test if the function exists first
    try {
      // First, let's test if any function is accessible
      console.log('Testing function accessibility...');
      
      const { data: testData, error: testError } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscription_id: subscription.stripe_id },
      });
      
      console.log('Cancel function response:', { testData, testError });

      if (testError) {
        console.error('Cancel function error:', testError);
        
        // Check if it's a function not found error
        if (testError.message?.includes('not found') || testError.message?.includes('404') || testError.message?.includes('Function not found')) {
          return NextResponse.json({ error: 'Cancel subscription function not deployed. Please contact support.' }, { status: 500 });
        }
        
        // Check if it's a Stripe API error
        if (testError.message?.includes('stripe') || testError.message?.includes('api')) {
          return NextResponse.json({ error: 'Stripe API error: ' + testError.message }, { status: 500 });
        }
        
        return NextResponse.json({ error: 'Failed to cancel subscription: ' + testError.message }, { status: 500 });
      }

      return NextResponse.json({ message: 'Unsubscribed successfully' });
    } catch (invokeError) {
      console.error('Function invocation error:', invokeError);
      
      // Check if it's a network error
      if (invokeError instanceof TypeError && invokeError.message?.includes('fetch')) {
        return NextResponse.json({ error: 'Network error: Unable to reach Supabase functions. Please try again.' }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'Failed to invoke cancel function: ' + (invokeError instanceof Error ? invokeError.message : 'Unknown error') }, { status: 500 });
    }
  } catch (error) {
    console.error('Unsubscribe route error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
} 