import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2025-05-28.basil',
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Plan features and descriptions
const PLAN_FEATURES = {
    'price_1RiXPNP2WBP7umLnoxh9cgnL': { // Pro tier
        name: 'Pro',
        features: [
            '5,000 API calls per month',
            'Batch file processing',
            'Advanced analytics dashboard',
            'Export functionality',
            'Priority email support'
        ],
        description: 'For power users and small teams',
        popular: true
    },
    'price_1RiXPmP2WBP7umLnzZqcBXdO': { // Enterprise tier
        name: 'Enterprise',
        features: [
            '50,000 API calls per month',
            'Custom integrations',
            'Advanced analytics with trends',
            'Priority support + phone',
            'Custom reporting',
            'Team management',
            'Dedicated account manager'
        ],
        description: 'For businesses with advanced needs',
        popular: false
    }
};

// Static free plan configuration
const FREE_PLAN = {
    price_id: 'free_plan',
    product_id: 'free_plan',
    name: 'Free',
    description: 'Perfect for getting started with sentiment analysis',
    features: [
        '100 API calls per month',
        'Single text analysis',
        'Basic sentiment results',
        'Email support (next business day)'
    ],
    amount: 0,
    currency: 'usd',
    interval: 'month',
    popular: false
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        console.log('Fetching active products from Stripe...');
        const products = await stripe.products.list({ active: true, limit: 100 });
        console.log('Active products:', products.data.map(p => ({ id: p.id, name: p.name, active: p.active })));

        console.log('Fetching active prices from Stripe...');
        const prices = await stripe.prices.list({ active: true, limit: 100 });
        console.log('Active prices:', prices.data.map(pr => ({ id: pr.id, product: pr.product, active: pr.active })));

        // Get paid plans from Stripe
        const paidPlans = prices.data
            .filter(price => {
                const product = products.data.find(p => p.id === price.product);
                return product && product.active && price.id in PLAN_FEATURES;
            })
            .map(price => {
                const product = products.data.find(p => p.id === price.product);
                const planInfo = PLAN_FEATURES[price.id];
                
                return {
                    price_id: price.id,
                    product_id: product.id,
                    name: planInfo.name,
                    description: planInfo.description,
                    features: planInfo.features,
                    amount: price.unit_amount,
                    currency: price.currency,
                    interval: price.recurring?.interval,
                    popular: planInfo.popular || false,
                    isFree: false
                };
            });

        // Add the free plan at the beginning
        const plans = [FREE_PLAN, ...paidPlans];

        console.log('Filtered and sorted plans to return:', plans);

        return new Response(
            JSON.stringify(plans),
            { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 
            }
        );
    } catch (error) {
        console.error("Error getting products/plans:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400 
            }
        );
    }
});