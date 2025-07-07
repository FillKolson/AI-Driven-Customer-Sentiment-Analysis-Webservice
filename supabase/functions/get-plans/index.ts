import express from 'express';
import Stripe from 'stripe';

const app = express();
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

app.get('/plans', async (req, res) => {
  try {
    // ... your logic to fetch plans ...
    // Example:
    const prices = await stripe.prices.list({ active: true, expand: ['data.product'] });
    res.status(200).json(prices);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});