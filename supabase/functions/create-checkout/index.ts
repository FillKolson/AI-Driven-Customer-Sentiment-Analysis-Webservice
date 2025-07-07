import express from 'express';
import Stripe from 'stripe';

const app = express();
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-customer-email',
};

app.options('*', (req, res) => {
  res.set(corsHeaders).send();
});

app.post('/', async (req, res) => {
  try {
    const { price_id, user_id, return_url } = req.body;

    if (!price_id || !user_id || !return_url) {
      throw new Error('Missing required parameters');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${return_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${return_url}?canceled=true`,
      customer_email: req.headers['x-customer-email'] as string,
      metadata: {
        user_id,
      },
    });

    res.set({ ...corsHeaders, 'Content-Type': 'application/json' }).status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.set({ ...corsHeaders, 'Content-Type': 'application/json' }).status(400).json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});