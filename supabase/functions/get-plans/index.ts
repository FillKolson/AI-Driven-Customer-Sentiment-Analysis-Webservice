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

        const plans = prices.data
            .filter(price => {
                const product = products.data.find(p => p.id === price.product);
                return product && product.active;
            })
            .map(price => {
                const product = products.data.find(p => p.id === price.product);
                return {
                    price_id: price.id,
                    product_id: product.id,
                    name: product.name,
                    description: product.description,
                    amount: price.unit_amount,
                    currency: price.currency,
                    interval: price.recurring?.interval,
                    // Add more fields as needed
                };
            });

        console.log('Filtered plans to return:', plans);

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