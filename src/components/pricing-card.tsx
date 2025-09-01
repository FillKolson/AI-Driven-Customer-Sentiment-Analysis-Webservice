"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    CardContent
} from "./ui/card";
import { Check } from "lucide-react";
import { supabase } from "../../supabase/supabase";

export default function PricingCard({ item, user }: {
    item: any,
    user: User | null
}) {
    // Handle checkout process
    const handleCheckout = async (priceId: string) => {
        if (!user) {
            // Redirect to sign-in if user is not authenticated
            window.location.href = "/sign-in?redirect=pricing";
            return;
        }

        try {
            const { data, error } = await supabase.functions.invoke('supabase-functions-create-checkout', {
                body: {
                    price_id: priceId,
                    user_id: user.id,
                    return_url: `${window.location.origin}/dashboard`,
                },
                headers: {
                    'X-Customer-Email': user.email || '',
                }
            });

            if (error) {
                throw error;
            }

            // Redirect to Stripe checkout
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
        }
    };

    const isFreePlan = item.amount === 0 || item.amount === null;

    return (
        <Card className={`w-full relative overflow-hidden ${item.popular ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-gray-200'}`}>
            {item.popular && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-30" />
            )}
            <CardHeader className="relative">
                {item.popular && (
                    <div className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit mb-4">
                        Most Popular
                    </div>
                )}
                <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">{item.name}</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                    {item.description}
                </CardDescription>
                <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                        {isFreePlan ? 'Free' : `$${item?.amount / 100}`}
                    </span>
                    {!isFreePlan && (
                        <span className="text-gray-600">/{item?.interval}</span>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className="relative">
                <ul className="space-y-3">
                    {item.features?.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
            
            <CardFooter className="relative">
                <Button
                    onClick={async () => {
                        await handleCheckout(item.price_id)
                    }}
                    className={`w-full py-6 text-lg font-medium ${
                        item.popular 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                            : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                >
                    {isFreePlan ? 'Get Started Free' : 'Get Started'}
                </Button>
            </CardFooter>
        </Card>
    )
}