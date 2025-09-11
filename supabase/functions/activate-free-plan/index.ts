import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-05-28.basil',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREE_PLAN_NAME = 'free';
const FREE_PLAN_LIMIT = 100;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email } = await req.json();
    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1) Resolve user_id if only email was provided
    let targetUserId: string | null = user_id || null;
    if (!targetUserId && email) {
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      if (userErr) throw userErr;
      if (!userRow?.user_id) {
        return new Response(
          JSON.stringify({ error: 'User not found for provided email' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetUserId = userRow.user_id;
    }

    // 2) Cancel ALL non-canceled Stripe subscriptions for this user (to avoid future charges)
    const cancelledSubscriptionIds: string[] = [];
    if (targetUserId) {
      // Try to get Stripe customer ID from users table
      let stripeCustomerId: string | null = null;
      const { data: userStripe } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('user_id', targetUserId)
        .maybeSingle();
      stripeCustomerId = userStripe?.stripe_customer_id || null;

      // Fallback: try from latest subscription row
      if (!stripeCustomerId) {
        const { data: latestSub } = await supabase
          .from('subscriptions')
          .select('customer_id')
          .eq('user_id', targetUserId)
          .order('current_period_end', { ascending: false })
          .limit(1)
          .maybeSingle();
        stripeCustomerId = latestSub?.customer_id || null;
      }

      try {
        if (stripeCustomerId) {
          // List all subscriptions for the customer and cancel any not already canceled
          const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, status: 'all', limit: 100 });
          for (const s of subs.data) {
            if (s.status !== 'canceled') {
              try {
                const canceled = await stripe.subscriptions.cancel(s.id);
                cancelledSubscriptionIds.push(canceled.id);
                // Reflect cancellation in DB (best-effort)
                await supabase
                  .from('subscriptions')
                  .update({
                    status: canceled.status,
                    cancel_at_period_end: canceled.cancel_at_period_end,
                    canceled_at: canceled.canceled_at,
                    ended_at: canceled.ended_at,
                  })
                  .eq('stripe_id', s.id);
              } catch (inner) {
                console.error('Failed to cancel subscription', s.id, inner);
              }
            }
          }
        } else {
          // No customer id; fall back to cancel any active subs in our DB for this user
          const ACTIVE_STATUSES = ['active','trialing','past_due','unpaid','incomplete','incomplete_expired'];
          const { data: activeSubs } = await supabase
            .from('subscriptions')
            .select('stripe_id')
            .eq('user_id', targetUserId)
            .in('status', ACTIVE_STATUSES);
          for (const row of activeSubs || []) {
            if (row.stripe_id?.startsWith('sub_')) {
              try {
                const canceled = await stripe.subscriptions.cancel(row.stripe_id);
                cancelledSubscriptionIds.push(canceled.id);
                await supabase
                  .from('subscriptions')
                  .update({
                    status: canceled.status,
                    cancel_at_period_end: canceled.cancel_at_period_end,
                    canceled_at: canceled.canceled_at,
                    ended_at: canceled.ended_at,
                  })
                  .eq('stripe_id', row.stripe_id);
              } catch (inner) {
                console.error('Failed to cancel subscription', row.stripe_id, inner);
              }
            }
          }
        }
      } catch (stripeErr) {
        console.error('Stripe list/cancel error:', stripeErr);
      }
    }

    // 3) Update user to free plan
    const { error: updErr } = await supabase
      .from('users')
      .update({
        subscription: null,
        subscription_status: FREE_PLAN_NAME,
        api_usage_current_month: 0,
        api_limit_per_month: FREE_PLAN_LIMIT,
      })
      .eq('user_id', targetUserId as string);

    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({ success: true, cancelled_subscription_ids: cancelledSubscriptionIds, user_id: targetUserId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error activating free plan:', error);
    return new Response(
      JSON.stringify({ error: error.message ?? 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
