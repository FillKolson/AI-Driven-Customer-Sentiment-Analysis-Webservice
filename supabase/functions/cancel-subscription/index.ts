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
    const { subscription_id } = await req.json();
    if (!subscription_id) {
      throw new Error('Missing subscription_id');
    }

    // Cancel the subscription in Stripe
    const canceled = await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: true,
    });

    // Update the subscription status in the database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: canceled.status,
        cancel_at_period_end: canceled.cancel_at_period_end,
        canceled_at: canceled.canceled_at,
      })
      .eq('stripe_id', subscription_id);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ status: canceled.status, cancel_at_period_end: canceled.cancel_at_period_end }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 