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

export default function PricingCard({ item, user, currentSubscription }: {
    item: any,
    user: User | null,
    currentSubscription?: any
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
    
    // Check if this is the user's current plan
    const isCurrentPlan = currentSubscription && 
        (currentSubscription.plan === item.price_id || 
         (isFreePlan && currentSubscription.status === 'null'));

    // Determine button text based on plan name
    const getButtonText = () => {
        if (isCurrentPlan) {
            return "Your current plan";
        }
        
        const planName = item.name.toLowerCase();
        if (planName.includes('free')) {
            return "Get Free";
        } else if (planName.includes('pro')) {
            return "Get Pro";
        } else if (planName.includes('enterprise')) {
            return "Get Enterprise";
        } else {
            // Fallback to plan name or generic text
            return `Get ${item.name}`;
        }
    };

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
                        if (!isCurrentPlan) {
                            await handleCheckout(item.price_id)
                        }
                    }}
                    disabled={isCurrentPlan}
                    className={`w-full py-6 text-lg font-medium ${
                        isCurrentPlan 
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed hover:bg-gray-400' 
                            : item.popular 
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                                : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                >
                    {getButtonText()}
                </Button>
            </CardFooter>
        </Card>
    )
}