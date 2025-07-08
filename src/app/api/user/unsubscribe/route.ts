import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  console.log('User:', user);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  console.log('Subscription:', subscription);

  if (!subscription) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
  }

  // Only call the cancel function, do not update the user record
  const { error: cancelError } = await supabase.functions.invoke('cancel-subscription', {
    body: { subscription_id: subscription.stripe_id },
  });
  console.log('Cancel error:', cancelError);

  if (cancelError) {
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Unsubscribed successfully' });
} 