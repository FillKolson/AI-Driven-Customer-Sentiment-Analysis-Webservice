import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-05-28.basil',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { subscription_id } = body;

    if (!subscription_id) {
      throw new Error('Missing subscription_id');
    }
    if (typeof subscription_id !== 'string' || !subscription_id.startsWith('sub_')) {
      throw new Error('Invalid subscription_id');
    }

    // Retrieve and verify current Stripe subscription
    const current = await stripe.subscriptions.retrieve(subscription_id);

    // If it's already fully canceled (status = canceled), we cannot resume
    if (current.status === 'canceled') {
      return new Response(
        JSON.stringify({ error: 'Subscription already canceled and cannot be restored' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set cancel_at_period_end=false to resume auto-renewal without immediate charge
    const updated = await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: false,
    });

    // Update DB copy
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: updated.status,
        cancel_at_period_end: updated.cancel_at_period_end,
      })
      .eq('stripe_id', subscription_id);

    if (error) {
      console.error('DB update error:', error);
    }

    return new Response(
      JSON.stringify({ status: updated.status, cancel_at_period_end: updated.cancel_at_period_end }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Restore subscription error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
