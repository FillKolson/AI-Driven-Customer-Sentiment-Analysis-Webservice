import Hero from "@/components/hero";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import { ArrowUpRight, CheckCircle2, Zap, Shield, Users } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );

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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Why Choose SentimentScope
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Transform your customer feedback analysis with AI-powered insights
              and intuitive visualization tools.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Real-Time Analysis",
                description:
                  "Instant sentiment classification with confidence scores",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "AI-Powered Insights",
                description: "Advanced NLP for accurate sentiment detection",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Interactive Dashboard",
                description: "Beautiful charts and trend visualization",
              },
              {
                icon: <CheckCircle2 className="w-6 h-6" />,
                title: "Key Phrase Extraction",
                description: "Identify important themes automatically",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-blue-100">Texts Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Real-Time Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your needs. No hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard 
                key={item.id} 
                item={item} 
                user={user} 
                currentSubscription={currentSubscription}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Analyzing Customer Sentiment Today
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join businesses worldwide who are transforming customer feedback
            into actionable insights with SentimentScope.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Free Analysis
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
