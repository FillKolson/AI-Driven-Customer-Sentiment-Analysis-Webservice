import PricingCard from "@/components/pricing-card";
import { createClient } from "../../../supabase/server";
import Footer from "@/components/footer";

export default async function Pricing() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: plans, error } = await supabase.functions.invoke('supabase-functions-get-plans');

    // Fetch user's current subscription status if user is logged in
    let currentSubscription = null;
    if (user) {
        try {
            const { data: subscriptionData } = await supabase.functions.invoke('supabase-functions-get-subscription-status', {
                body: { user_id: user.id }
            });
            currentSubscription = subscriptionData;
        } catch (error) {
            console.error('Error fetching subscription status:', error);
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Контент страницы */}
            <main className="flex-grow">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Choose the perfect plan for your needs. Start free and upgrade as you grow.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {plans?.map((item: any) => (
                            <PricingCard 
                                key={item.price_id} 
                                item={item} 
                                user={user} 
                                currentSubscription={currentSubscription}
                            />
                        ))}
                    </div>
                    
                    <div className="text-center mt-16">
                        <p className="text-gray-600 text-sm">
                            All plans include secure data handling and 99.9% uptime guarantee.
                        </p>
                    </div>
                </div>
            </main>

            {/* Футер вынесен наружу */}
            <Footer />
        </div>
    );
}
