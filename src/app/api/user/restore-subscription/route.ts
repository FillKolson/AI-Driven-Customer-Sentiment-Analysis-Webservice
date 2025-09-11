import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the latest active/trialing/past_due subscription that is set to cancel at period end
    const { data: pendingCancelSubs, error: subErr } = await supabase
      .from('subscriptions')
      .select('stripe_id, user_id, status, cancel_at_period_end, current_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .eq('cancel_at_period_end', true)
      .order('current_period_end', { ascending: false })
      .limit(1);

    if (subErr) {
      return NextResponse.json({ error: 'Failed to fetch subscription: ' + subErr.message }, { status: 500 });
    }

    const lastPending = Array.isArray(pendingCancelSubs) ? pendingCancelSubs[0] : undefined;
    if (!lastPending?.stripe_id) {
      return NextResponse.json({ error: 'No pending-cancel subscription to restore' }, { status: 400 });
    }

    // Call Supabase Edge Function to resume the subscription without payment
    const { data, error } = await supabase.functions.invoke('supabase-functions-restore-subscription', {
      body: {
        subscription_id: lastPending.stripe_id,
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes('not found')) {
        return NextResponse.json({ error: 'restore-subscription function not deployed' }, { status: 500 });
      }
      return NextResponse.json({ error: error.message || 'Failed to restore subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 });
  }
}
