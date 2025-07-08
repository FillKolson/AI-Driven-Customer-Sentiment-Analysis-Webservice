import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-05-28.basil',
  httpClient: Stripe.createFetchHttpClient(),
});
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-customer-email',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { price_id, user_id, return_url } = await req.json();
    if (!price_id || !user_id || !return_url) {
      throw new Error('Missing required parameters');
    }

    // 1. Fetch user from DB
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, user_id')
      .eq('id', user_id)
      .single();
    if (userError || !user) throw new Error('User not found');

    // 2. Try to get latest subscription for this user to get customer_id
    let customerId: string | undefined = undefined;
    const { data: latestSub, error: subError } = await supabase
      .from('subscriptions')
      .select('customer_id')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestSub && latestSub.customer_id) {
      customerId = latestSub.customer_id;
    }

    // 3. If no customer_id, create a new Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.user_id },
      });
      customerId = customer.id;

      // Store the Stripe customer ID in the users table
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.user_id);
    }

    // 4. Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: 'subscription',
      success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${return_url}?canceled=true`,
      customer: customerId,
      metadata: { user_id: user.user_id },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});