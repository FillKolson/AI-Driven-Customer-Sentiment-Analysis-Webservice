import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
type WebhookEvent = {
  event_type: string;
  type: string;
  stripe_event_id: string;
  created_at: string;
  modified_at: string;
  data: any;
};

type SubscriptionData = {
  stripe_id: string;
  user_id: string;
  price_id: string;
  stripe_price_id: string;
  currency: string;
  interval: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  amount: number;
  started_at: number;
  customer_id: string;
  metadata: Record<string, any>;
  canceled_at?: number;
  ended_at?: number;
  stripe_customer_id: string;
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-05-28.basil',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Utility functions
async function logAndStoreWebhookEvent(
  supabaseClient: any,
  event: any,
  data: any
): Promise<void> {
  const { error } = await supabaseClient
    .from("webhook_events")
    .insert({
      event_type: event.type,
      type: event.type.split('.')[0],
      stripe_event_id: event.id,
      created_at: new Date(event.created * 1000).toISOString(),
      modified_at: new Date(event.created * 1000).toISOString(),
      data
    } as WebhookEvent);

  if (error) {
    console.error('Error logging webhook event:', error);
    throw error;
  }
}

async function updateSubscriptionStatus(
  supabaseClient: any,
  stripeId: string,
  status: string
): Promise<void> {
  const { error } = await supabaseClient
    .from("subscriptions")
    .update({ status })
    .eq("stripe_id", stripeId);

  if (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

// Utility function to robustly find user_id
async function findUserId({ supabaseClient, metadata, customerId, customerEmail }) {
  // 1. Try metadata.user_id
  if (metadata?.user_id) {
    console.log('Found user_id in metadata:', metadata.user_id);
    return metadata.user_id;
  }

  // 2. Try latest subscription by customer_id
  if (customerId) {
    const { data: sub } = await supabaseClient
      .from('subscriptions')
      .select('user_id')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sub?.user_id) {
      console.log('Found user_id in subscriptions:', sub.user_id);
      return sub.user_id;
    }
  }

  // 2b. Try user by stripe_customer_id
  if (customerId) {
    const { data: user } = await supabaseClient
      .from('users')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    if (user?.user_id) {
      console.log('Found user_id in users by stripe_customer_id:', user.user_id);
      return user.user_id;
    }
  }

  // 3. Try user by email
  if (customerEmail) {
    const { data: user } = await supabaseClient
      .from('users')
      .select('user_id')
      .eq('email', customerEmail)
      .maybeSingle();
    if (user?.user_id) {
      console.log('Found user_id in users by email:', user.user_id);
      return user.user_id;
    }
  }

  console.log('No user_id found for customerId:', customerId, 'customerEmail:', customerEmail);
  return undefined;
}

// Event handlers
async function handleSubscriptionCreated(supabaseClient: any, event: any) {
  const subscription = event.data.object;
  console.log('Handling subscription created:', subscription.id);

  // Robustly find user_id
  let userId = await findUserId({
    supabaseClient,
    metadata: subscription.metadata,
    customerId: subscription.customer,
    customerEmail: undefined // We'll fetch below if needed
  });

  // If still not found, try fetching Stripe customer for email
  if (!userId) {
    try {
      const customer = await stripe.customers.retrieve(subscription.customer);
      userId = await findUserId({
        supabaseClient,
        customerEmail: customer.email
      });
    } catch (error) {
      console.error('Unable to find associated user:', error);
      return new Response(
        JSON.stringify({ error: "Unable to find associated user" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  if (!userId) {
    console.error('No user_id found for subscription', subscription.id);
    return new Response(
      JSON.stringify({ error: "No user_id found for subscription" }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const subscriptionData: SubscriptionData = {
    stripe_id: subscription.id,
    user_id: userId,
    price_id: subscription.items.data[0]?.price.id,
    stripe_price_id: subscription.items.data[0]?.price.id,
    currency: subscription.currency,
    interval: subscription.items.data[0]?.plan.interval,
    status: subscription.status,
    current_period_start: subscription.items.data[0]?.current_period_start,
    current_period_end: subscription.items.data[0]?.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    amount: subscription.items.data[0]?.plan.amount ?? 0,
    started_at: subscription.start_date ?? Math.floor(Date.now() / 1000),
    customer_id: subscription.customer,
    stripe_customer_id: subscription.customer,
    metadata: subscription.metadata || {},
    canceled_at: subscription.canceled_at,
    ended_at: subscription.ended_at
  };

  const priceId = subscription.items.data[0]?.price.id;
  const planInfo = PLAN_INFO[priceId] ?? { name: FREE_PLAN_NAME, limit: FREE_PLAN_LIMIT };

  // If the mapped plan is free (or unknown), do NOT create a subscription row. Just set the user to free.
  if (planInfo.name === FREE_PLAN_NAME) {
    await supabaseClient
      .from('users')
      .update({
        api_usage_current_month: 0,
        api_limit_per_month: FREE_PLAN_LIMIT,
        subscription: null,
        subscription_status: FREE_PLAN_NAME,
      })
      .or(`user_id.eq.${userId},id.eq.${userId}`);

    return new Response(
      JSON.stringify({ message: "Assigned free plan (no Stripe subscription stored)" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Paid plans: upsert subscription and update user's subscription reference and limits
  await supabaseClient
    .from('subscriptions')
    .upsert({
      stripe_id: subscription.id,
      ...subscriptionData
    }, {
      onConflict: 'stripe_id'
    });

  // Now fetch the subscription row id (guaranteed to exist)
  const { data: subscriptionRow } = await supabaseClient
    .from('subscriptions')
    .select('id')
    .eq('stripe_id', subscription.id)
    .maybeSingle();

  await supabaseClient
    .from('users')
    .update({
      api_usage_current_month: 0,
      api_limit_per_month: planInfo.limit,
      subscription: subscriptionRow?.id || null,
      subscription_status: planInfo.name,
    })
    .or(`user_id.eq.${userId},id.eq.${userId}`);

  return new Response(
    JSON.stringify({ message: "Subscription created successfully" }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleSubscriptionUpdated(supabaseClient: any, event: any) {
  const subscription = event.data.object;
  console.log('Handling subscription updated:', subscription.id);

  const { error } = await supabaseClient
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: subscription.items.data[0]?.current_period_start,
      current_period_end: subscription.items.data[0]?.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      metadata: subscription.metadata,
      canceled_at: subscription.canceled_at,
      ended_at: subscription.ended_at
    })
    .eq("stripe_id", subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
    return new Response(
      JSON.stringify({ error: "Failed to update subscription" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({ message: "Subscription updated successfully" }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleSubscriptionDeleted(supabaseClient: any, event: any) {
  const subscription = event.data.object;
  console.log('Handling subscription deleted:', subscription.id);

  try {
    await updateSubscriptionStatus(supabaseClient, subscription.id, "canceled");

    // Try to resolve the user id by multiple strategies
    const userId = await findUserId({
      supabaseClient,
      metadata: subscription?.metadata,
      customerId: subscription?.customer,
      customerEmail: subscription?.metadata?.email
    });

    if (userId) {
      await supabaseClient
        .from('users')
        .update({
          subscription: null,
          subscription_status: FREE_PLAN_NAME,
          api_usage_current_month: 0,
          api_limit_per_month: FREE_PLAN_LIMIT
        })
        .or(`user_id.eq.${userId},id.eq.${userId}`);
    } else if (subscription?.metadata?.email) {
      // Fallback: update by email if available
      await supabaseClient
        .from('users')
        .update({
          subscription: null,
          subscription_status: FREE_PLAN_NAME,
          api_usage_current_month: 0,
          api_limit_per_month: FREE_PLAN_LIMIT
        })
        .eq('email', subscription.metadata.email);
    }

    return new Response(
      JSON.stringify({ message: "Subscription deleted successfully" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return new Response(
      JSON.stringify({ error: "Failed to process subscription deletion" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleCheckoutSessionCompleted(supabaseClient: any, event: any) {
  const session = event.data.object;
  console.log('Handling checkout session completed:', session.id);
  console.log('Full session data:', JSON.stringify(session, null, 2));

  const subscriptionId = typeof session.subscription === 'string' 
    ? session.subscription 
    : session.subscription?.id;

  if (!subscriptionId) {
    console.log('No subscription ID found in checkout session');
    return new Response(
      JSON.stringify({ message: "No subscription in checkout session" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Robustly find user_id
  let userId = await findUserId({
    supabaseClient,
    metadata: session.metadata,
    customerId: session.customer,
    customerEmail: session.customer_email
  });

  if (!userId) {
    // Try fetching Stripe customer for email
    try {
      const customer = await stripe.customers.retrieve(session.customer);
      userId = await findUserId({
        supabaseClient,
        customerEmail: customer.email
      });
    } catch (error) {
      console.error('Unable to find associated user for checkout session:', error);
      return new Response(
        JSON.stringify({ error: "Unable to find associated user for checkout session" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  if (!userId) {
    console.error('No user_id found for checkout session', session.id);
    return new Response(
      JSON.stringify({ error: "No user_id found for checkout session" }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Fetch the current subscription from Stripe to get the latest status
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Upsert subscription in database
  const { data: existingSubscription } = await supabaseClient
    .from('subscriptions')
    .select('id')
    .eq('stripe_id', subscriptionId)
    .maybeSingle();

  const { error } = await supabaseClient
    .from('subscriptions')
    .upsert({
      ...(existingSubscription?.id ? { id: existingSubscription.id } : {}),
      stripe_id: subscriptionId,
      user_id: userId,
      price_id: stripeSubscription.items.data[0]?.price.id,
      stripe_price_id: stripeSubscription.items.data[0]?.price.id,
      currency: stripeSubscription.currency,
      interval: stripeSubscription.items.data[0]?.plan.interval,
      status: stripeSubscription.status,
      current_period_start: stripeSubscription.current_period_start,
      current_period_end: stripeSubscription.current_period_end,
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      amount: stripeSubscription.items.data[0]?.plan.amount ?? 0,
      started_at: stripeSubscription.start_date ?? Math.floor(Date.now() / 1000),
      customer_id: stripeSubscription.customer,
      metadata: session.metadata || {},
      canceled_at: stripeSubscription.canceled_at,
      ended_at: stripeSubscription.ended_at
    }, {
      onConflict: 'stripe_id'
    });

  if (error) {
    console.error('Error upserting subscription from checkout session:', error);
    return new Response(
      JSON.stringify({ error: "Failed to upsert subscription from checkout session" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({ 
      message: "Checkout session completed successfully",
      subscriptionId 
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}

async function handleInvoicePaymentSucceeded(supabaseClient: any, event: any) {
  const invoice = event.data.object;
  console.log('Handling invoice payment succeeded:', invoice.id);
  
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;

  try {
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("stripe_id", subscriptionId)
      .single();

    const webhookData = {
      event_type: event.type,
      type: "invoice",
      stripe_event_id: event.id,
      data: {
        invoiceId: invoice.id,
        subscriptionId,
        amountPaid: String(invoice.amount_paid / 100),
        currency: invoice.currency,
        status: "succeeded",
        email: subscription?.email || invoice.customer_email
      }
    };

    await supabaseClient
      .from("webhook_events")
      .insert(webhookData);

    // On successful invoice payment (renewal), reset monthly usage if we can map the plan
    // and update the user's api limits accordingly.
    // Determine plan from subscription.price_id if available.
    const priceId = subscription?.price_id || invoice.lines?.data?.[0]?.price?.id;
    const planInfo = priceId ? (PLAN_INFO[priceId] ?? null) : null;

    // Find the associated user id using robust lookup, falling back to subscription.user_id
    let resolvedUserId = await findUserId({
      supabaseClient,
      metadata: subscription?.metadata,
      customerId: subscription?.customer_id || invoice.customer,
      customerEmail: invoice.customer_email,
    });

    if (!resolvedUserId && subscription?.user_id) {
      resolvedUserId = subscription.user_id;
    }

    if (resolvedUserId && planInfo) {
      // Update users row; match either users.user_id or users.id to be resilient
      const updatePayload: any = {
        api_usage_current_month: 0,
        api_limit_per_month: planInfo.limit,
        subscription_status: planInfo.name,
      };

      const { error: userUpdErr } = await supabaseClient
        .from('users')
        .update(updatePayload)
        .or(`user_id.eq.${resolvedUserId},id.eq.${resolvedUserId}`);

      if (userUpdErr) {
        console.error('Failed to reset usage on renewal:', userUpdErr);
      } else {
        console.log('Successfully reset usage and updated limits for user on renewal');
      }
    } else {
      console.log('Skipping usage reset on renewal: no resolved user or unknown plan');
    }

    return new Response(
      JSON.stringify({ message: "Invoice payment succeeded" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing successful payment:', error);
    return new Response(
      JSON.stringify({ error: "Failed to process successful payment" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleInvoicePaymentFailed(supabaseClient: any, event: any) {
  const invoice = event.data.object;
  console.log('Handling invoice payment failed:', invoice.id);
  
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;

  try {
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("stripe_id", subscriptionId)
      .single();

    const webhookData = {
      event_type: event.type,
      type: "invoice",
      stripe_event_id: event.id,
      data: {
        invoiceId: invoice.id,
        subscriptionId,
        amountDue: String(invoice.amount_due / 100),
        currency: invoice.currency,
        status: "failed",
        email: subscription?.email || invoice.customer_email
      }
    };

    await supabaseClient
      .from("webhook_events")
      .insert(webhookData);

    if (subscriptionId) {
      await updateSubscriptionStatus(supabaseClient, subscriptionId, "past_due");
    }

    return new Response(
      JSON.stringify({ message: "Invoice payment failed" }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing failed payment:', error);
    return new Response(
      JSON.stringify({ error: "Failed to process failed payment" }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

// Free plan constants (decoupled from Stripe)
const FREE_PLAN_NAME = 'free';
const FREE_PLAN_LIMIT = 100;

// Map Stripe price_id to plan name and API limit (paid plans only)
// Note: Do NOT include the free plan here; free is handled outside of Stripe.
const PLAN_INFO: Record<string, { name: string, limit: number }> = {
  // Replace these with your actual Stripe price IDs
  'price_1RiXPNP2WBP7umLnoxh9cgnL': { name: 'pro', limit: 5000 },
  'price_1RiXPmP2WBP7umLnzZqcBXdO': { name: 'enterprise', limit: 50000 },
};

// Main webhook handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.log("IT DIDN'T WORK")
      return new Response(
        JSON.stringify({ error: "No signature found" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );      
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let event;
    
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error('Error verifying webhook signature:', err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Processing webhook event:', event.type);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Log the webhook event
    await logAndStoreWebhookEvent(supabaseClient, event, event.data.object);

    // Handle the event based on type
    switch (event.type) {
      case 'customer.subscription.created':
        return await handleSubscriptionCreated(supabaseClient, event);
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(supabaseClient, event);
      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(supabaseClient, event);
      case 'checkout.session.completed':
        return await handleCheckoutSessionCompleted(supabaseClient, event);
      case 'invoice.payment_succeeded':
        return await handleInvoicePaymentSucceeded(supabaseClient, event);
      case 'invoice.payment_failed':
        return await handleInvoicePaymentFailed(supabaseClient, event);
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return new Response(
          JSON.stringify({ message: `Unhandled event type: ${event.type}` }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
    }
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});


