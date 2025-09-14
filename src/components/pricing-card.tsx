"use client";

import { User } from "@supabase/supabase-js";
import { useState } from "react";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "./ui/alert-dialog";

export default function PricingCard({ item, user, currentSubscription }: {
    item: any,
    user: User | null,
    currentSubscription?: any
}) {
    const [showUnusedBalanceWarning, setShowUnusedBalanceWarning] = useState(false);
    const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);
    const [remainingThisMonth, setRemainingThisMonth] = useState<number>(0);
    const [usageLimit, setUsageLimit] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Handle checkout process
    const handleCheckout = async (priceId: string) => {
        // For free plan, activate via Edge Function then redirect
        if (priceId === 'free_plan') {
            if (!user) {
                window.location.href = "/sign-up?redirect=dashboard";
                return;
            }

            try {
                const { data, error } = await supabase.functions.invoke('supabase-functions-activate-free-plan', {
                    body: { user_id: user.id, email: user.email },
                });
                if (error) throw error;
                // On success, go to dashboard
                window.location.href = "/dashboard";
            } catch (err) {
                console.error('Error activating free plan:', err);
            }
            return;
        }

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

    const isFreePlan = item.price_id === 'free_plan' || item.amount === 0 || item.amount === null;
    
    // Check if this is the user's current plan
    const isCurrentPlan = currentSubscription && (
        currentSubscription.plan === item.price_id || 
        (isFreePlan && (!currentSubscription.plan || currentSubscription.status === 'free'))
    );

    // Determine button text based on plan name and user status
    const getButtonText = () => {
        if (isCurrentPlan) {
            return isFreePlan ? "Your current plan" : "Your current plan";
        }
        
        if (isFreePlan) {
            return user ? "Get free" : "Get started for free";
        }
        
        // For paid plans
        return `Get ${item.name}`;
    };

    // Before checkout, warn if user is currently on a paid plan and has unused API balance this month
    const checkUnusedBalanceAndProceed = async (priceId: string) => {
        try {
            const currentlyPaid = !!currentSubscription && currentSubscription.status && currentSubscription.status !== 'free';

            // If user not logged in or currently not on a paid plan, proceed as before
            if (!user || !currentlyPaid) {
                await handleCheckout(priceId);
                return;
            }

            setIsProcessing(true);
            const res = await fetch('/api/user/usage');
            if (!res.ok) {
                // If we can't fetch usage, proceed as before
                setIsProcessing(false);
                await handleCheckout(priceId);
                return;
            }
            const usage = await res.json();
            const used = usage?.current_month_usage ?? 0;
            const limit = usage?.limit ?? 0;
            const remaining = Math.max(0, (limit || 0) - (used || 0));

            setIsProcessing(false);

            // Show warning if there is some remaining balance this month
            if (limit > 0 && remaining > 0) {
                setUsageLimit(limit);
                setRemainingThisMonth(remaining);
                setPendingPriceId(priceId);
                setShowUnusedBalanceWarning(true);
            } else {
                await handleCheckout(priceId);
            }
        } catch (e) {
            console.error('Pre-check usage failed, proceeding to checkout:', e);
            setIsProcessing(false);
            await handleCheckout(priceId);
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
                            await checkUnusedBalanceAndProceed(item.price_id);
                        }
                    }}
                    disabled={isCurrentPlan}
                    className={`w-full py-6 text-lg font-medium ${
                        isCurrentPlan 
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed hover:bg-gray-400' 
                            : isFreePlan
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : item.popular 
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                                    : 'bg-gray-900 hover:bg-gray-800'
                    }`}
                >
                    {getButtonText()}
                </Button>

                {/* Warning dialog about losing unused API balance when changing paid plans mid-cycle */}
                <AlertDialog open={showUnusedBalanceWarning} onOpenChange={setShowUnusedBalanceWarning}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Unused API balance this month</AlertDialogTitle>
                            <AlertDialogDescription>
                                You still have {remainingThisMonth} out of {usageLimit} API calls remaining for this billing cycle. If you continue to change your plan now, your unused API balance for this month may be lost or not carried over.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                disabled={isProcessing}
                                onClick={async () => {
                                    try {
                                        setShowUnusedBalanceWarning(false);
                                        if (pendingPriceId) {
                                            await handleCheckout(pendingPriceId);
                                        }
                                    } finally {
                                        setPendingPriceId(null);
                                    }
                                }}
                            >
                                Continue to payment
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    )
}