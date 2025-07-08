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
    const { subscription_id, new_price_id } = await req.json();
    if (!subscription_id || !new_price_id) {
      throw new Error('Missing subscription_id or new_price_id');
    }

    // Retrieve the subscription to get the current item ID
    const subscription = await stripe.subscriptions.retrieve(subscription_id);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) {
      throw new Error('Subscription item not found');
    }

    // Update the subscription with the new price
    const updated = await stripe.subscriptions.update(subscription_id, {
      items: [{ id: itemId, price: new_price_id }],
      proration_behavior: 'create_prorations',
    });

    // Update the subscription in the database
    const { error } = await supabase
      .from('subscriptions')
      .update({
        price_id: new_price_id,
        status: updated.status,
        current_period_end: updated.current_period_end,
      })
      .eq('stripe_id', subscription_id);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ status: updated.status, price_id: new_price_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 