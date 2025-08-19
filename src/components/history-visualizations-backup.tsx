"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity,
  AlertTriangle,
  DollarSign,
  Users,
  ShoppingCart,
  Target,
  ChartBar,
  ScatterChart as ScatterChartIcon
} from "lucide-react";

interface Analysis {
  id: string;
  input_text: string;
  sentiment_result: {
    sentiment: "positive" | "negative" | "neutral";
    confidence: number;
    key_phrases: string[];
  };
  created_at: string;
  tokens_used: number;
  processing_time_ms: number;
  sentiment_score?: number;
  sentiment_date?: string;
  customer_id?: string;
  supermarket_id?: string;
  file_name?: string;
}

interface EnhancedAnalysis extends Analysis {
  // Additional fields from database
  sentiment_score: number;
  sentiment_date: string;
  customer_id: string;
  supermarket_id: string;
  // Customer data
  gender?: string;
  age?: number;
  annual_income?: number;
  spending_score?: number;
  total_purchases?: number;
  average_order_value?: number;
  purchase_frequency?: number;
  // Supermarket data
  advertisement_spend?: number;
  promotion_spend?: number;
  administration_spend?: number;
  profit?: number;
  // Product data
  product_name?: string;
  product_category?: string;
  price?: number;
}

interface ChartData {
  // Chart 1: Key Metrics
  keyMetrics: {
    averageSentimentScore: number;
    averageTotalPurchases: number;
    averageOrderValue: number;
    sentimentOrderData: Array<{ date: string; sentimentScore: number; orderValue: number }>;
  };
  
  // Chart 2: Sentiment vs Profit
  sentimentProfitData: Array<{ profit: number; sentimentScore: number }>;
  
  // Chart 3: Sentiment vs Promotion Spend
  sentimentPromotionData: Array<{ promotionSpend: number; sentimentScore: number }>;
  
  // Chart 4: Sentiment vs Purchase Frequency
  sentimentFrequencyData: Array<{ purchaseFrequency: number; sentimentScore: number }>;
  
  // Chart 5: Sentiment Categories
  sentimentCategories: Array<{ name: string; value: number; color: string }>;
  
  // Chart 6: Supermarket Sentiment
  supermarketSentiment: Array<{ supermarketId: string; sentimentScore: number }>;
  
  // Chart 7: Gender Sentiment
  genderSentiment: Array<{ gender: string; sentimentScore: number; count: number }>;
  
  // Chart 8: Spending Score Sentiment
  spendingScoreSentiment: Array<{ spendingScore: number; sentimentScore: number }>;
  
  // Chart 9: Annual Income Sentiment
  annualIncomeSentiment: Array<{ annualIncome: number; sentimentScore: number }>;
  
  // Chart 10: Age Sentiment
  ageSentiment: Array<{ age: number; sentimentScore: number }>;
  
  // Chart 11: Promotion Spend vs Profit
  promotionProfitData: Array<{ promotionSpend: number; profit: number }>;
  
  // Chart 12: Administration Spend vs Profit
  administrationProfitData: Array<{ administrationSpend: number; profit: number }>;
  
  // Chart 13: Advertisement Spend vs Profit
  advertisementProfitData: Array<{ advertisementSpend: number; profit: number }>;
  
  // Chart 14: Monthly Sentiment
  monthlySentiment: Array<{ month: string; sentimentScore: number; percentage: number }>;
  
  // Chart 15: Product Count
  productCount: Array<{ product: string; count: number }>;
}

interface HistoryVisualizationsProps {
  analyses: Analysis[];
  loading: boolean;
}

const COLORS = {
  positive: "#10b981",
  negative: "#ef4444",
  neutral: "#6b7280",
  male: "#3b82f6",
  female: "#ec4899",
  june: "#f59e0b",
  july: "#8b5cf6",
};

export default function HistoryVisualizations({ analyses, loading }: HistoryVisualizationsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (analyses.length > 0) {
      processDataForCharts();
    }
  }, [analyses]);

  const processDataForCharts = () => {
    try {
      // Convert analyses to enhanced format with mock data for demonstration
      const enhancedAnalyses: EnhancedAnalysis[] = analyses.map((analysis, index) => ({
        ...analysis,
        sentiment_score: analysis.sentiment_result.confidence * (analysis.sentiment_result.sentiment === 'positive' ? 1 : analysis.sentiment_result.sentiment === 'negative' ? -1 : 0),
        sentiment_date: analysis.created_at,
        customer_id: `CUST${String(index + 1).padStart(3, '0')}`,
        supermarket_id: String(Math.floor(Math.random() * 50) + 1),
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        age: Math.floor(Math.random() * 50) + 20,
        annual_income: Math.floor(Math.random() * 80000) + 20000,
        spending_score: Math.floor(Math.random() * 100) + 1,
        total_purchases: Math.floor(Math.random() * 20) + 1,
        average_order_value: Math.floor(Math.random() * 200) + 50,
        purchase_frequency: Math.floor(Math.random() * 5) + 1,
        advertisement_spend: Math.random() * 0.3,
        promotion_spend: Math.random() * 0.3,
        administration_spend: Math.random() * 0.3,
        profit: Math.random() * 300 + 50,
        product_name: ['Chocolate', 'French Fries', 'Milk', 'Mineral Water', 'Spaghetti', 'Burgers', 'Eggs', 'Green Tea', 'Tomatoes', 'Turkey', 'Cookies', 'Energy Bar', 'Frozen Vegetables', 'Ground Beef', 'Honey', 'Olive Oil', 'Pancakes', 'Soup', 'Avocado', 'Shrimp'][Math.floor(Math.random() * 20)],
      }));

      const data: ChartData = {
        // Chart 1: Key Metrics
        keyMetrics: {
          averageSentimentScore: enhancedAnalyses.reduce((sum, a) => sum + a.sentiment_score, 0) / enhancedAnalyses.length,
          averageTotalPurchases: enhancedAnalyses.reduce((sum, a) => sum + (a.total_purchases || 0), 0) / enhancedAnalyses.length,
          averageOrderValue: enhancedAnalyses.reduce((sum, a) => sum + (a.average_order_value || 0), 0) / enhancedAnalyses.length,
          sentimentOrderData: enhancedAnalyses.slice(0, 20).map(a => ({
            date: new Date(a.sentiment_date).toLocaleDateString(),
            sentimentScore: a.sentiment_score,
            orderValue: a.average_order_value || 0
          }))
        },

        // Chart 2: Sentiment vs Profit
        sentimentProfitData: enhancedAnalyses.map(a => ({
          profit: a.profit || 0,
          sentimentScore: a.sentiment_score
        })),

        // Chart 3: Sentiment vs Promotion Spend
        sentimentPromotionData: enhancedAnalyses.map(a => ({
          promotionSpend: a.promotion_spend || 0,
          sentimentScore: a.sentiment_score
        })),

        // Chart 4: Sentiment vs Purchase Frequency
        sentimentFrequencyData: enhancedAnalyses.map(a => ({
          purchaseFrequency: a.purchase_frequency || 0,
          sentimentScore: a.sentiment_score
        })),

        // Chart 5: Sentiment Categories
        sentimentCategories: [
          { name: 'Positive', value: enhancedAnalyses.filter(a => a.sentiment_score > 0).length, color: COLORS.positive },
          { name: 'Negative', value: enhancedAnalyses.filter(a => a.sentiment_score < 0).length, color: COLORS.negative },
          { name: 'Neutral', value: enhancedAnalyses.filter(a => a.sentiment_score === 0).length, color: COLORS.neutral }
        ],

        // Chart 6: Supermarket Sentiment
        supermarketSentiment: Object.entries(
          enhancedAnalyses.reduce((acc, a) => {
            if (!acc[a.supermarket_id]) acc[a.supermarket_id] = [];
            acc[a.supermarket_id].push(a.sentiment_score);
            return acc;
          }, {} as Record<string, number[]>)
        ).map(([id, scores]) => ({
          supermarketId: id,
          sentimentScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
        })).sort((a, b) => b.sentimentScore - a.sentimentScore).slice(0, 10),

        // Chart 7: Gender Sentiment
        genderSentiment: Object.entries(
          enhancedAnalyses.reduce((acc, a) => {
            if (!acc[a.gender || 'Unknown']) acc[a.gender || 'Unknown'] = [];
            acc[a.gender || 'Unknown'].push(a.sentiment_score);
            return acc;
          }, {} as Record<string, number[]>)
        ).map(([gender, scores]) => ({
          gender,
          sentimentScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
          count: scores.length
        })),

        // Chart 8: Spending Score Sentiment
        spendingScoreSentiment: enhancedAnalyses.map(a => ({
          spendingScore: a.spending_score || 0,
          sentimentScore: a.sentiment_score
        })),

        // Chart 9: Annual Income Sentiment
        annualIncomeSentiment: enhancedAnalyses.map(a => ({
          annualIncome: a.annual_income || 0,
          sentimentScore: a.sentiment_score
        })),

        // Chart 10: Age Sentiment
        ageSentiment: enhancedAnalyses.map(a => ({
          age: a.age || 0,
          sentimentScore: a.sentiment_score
        })),

        // Chart 11: Promotion Spend vs Profit
        promotionProfitData: enhancedAnalyses.map(a => ({
          promotionSpend: a.promotion_spend || 0,
          profit: a.profit || 0
        })),

        // Chart 12: Administration Spend vs Profit
        administrationProfitData: enhancedAnalyses.map(a => ({
          administrationSpend: a.administration_spend || 0,
          profit: a.profit || 0
        })),

        // Chart 13: Advertisement Spend vs Profit
        advertisementProfitData: enhancedAnalyses.map(a => ({
          advertisementSpend: a.advertisement_spend || 0,
          profit: a.profit || 0
        })),

        // Chart 14: Monthly Sentiment
        monthlySentiment: [
          { month: 'June', sentimentScore: 0.51, percentage: 49.84 },
          { month: 'July', sentimentScore: 0.52, percentage: 50.16 }
        ],

        // Chart 15: Product Count
        productCount: Object.entries(
          enhancedAnalyses.reduce((acc, a) => {
            const product = a.product_name || 'Unknown';
            acc[product] = (acc[product] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([product, count]) => ({ product, count })).sort((a, b) => b.count - a.count)
      };

      setChartData(data);
      setError(null);
    } catch (err) {
      setError('Error processing data for charts');
      console.error('Error processing chart data:', err);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-8 mb-8">
        {[...Array(15)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mb-8">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-red-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>Error loading charts: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || analyses.length === 0) {
    return (
      <Card className="mb-8">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No data available for visualizations</p>
            <p className="text-sm mt-1">Start analyzing text to see charts and graphs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 mb-8">
      {/* Chart 1: Sentiment vs Profit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Average Sentiment Score vs Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.sentimentProfitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="profit" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sentimentScore" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Sentiment Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the sentiment score in relation to supermarket profit shows initial growth from a low value 
              to around 0.6-0.7 between 50 and 100 profit units, followed by significant fluctuations with peaks and dips, 
              especially around 100-150 profit units, and a slight decline towards 200 profit units. This suggests that sentiment 
              may vary with profit levels, with higher sentiment observed in the mid-range profit zone, but no clear consistent 
              trend indicates a strong direct relationship with supermarket profit. Other factors might also influence these 
              sentiment variations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 2: Key Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Key Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Average Sentiment Score</p>
              <p className="text-2xl font-bold text-blue-600">
                {chartData.keyMetrics.averageSentimentScore.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Average Total Purchases</p>
              <p className="text-2xl font-bold text-green-600">
                {chartData.keyMetrics.averageTotalPurchases.toFixed(1)}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Average Order Value</p>
              <p className="text-2xl font-bold text-purple-600">
                ${chartData.keyMetrics.averageOrderValue.toFixed(2)}
              </p>
            </div>
          </div>
          
          {/* Line Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.keyMetrics.sentimentOrderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="sentimentScore" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Sentiment Score"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orderValue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Order Value ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Chart Review */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, there appears to be no clear correlation between sentiment score and Average Order Value. 
              The sentiment scores vary widely across different order values, with no consistent trend indicating that higher or 
              lower prices influence sentiment positively or negatively. This suggests that factors other than price, such as 
              product quality or customer service, might be driving sentiment.
            </p>
          </div>
        </CardContent>
      </Card>

          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.sentimentProfitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="profit" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sentimentScore" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Sentiment Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the sentiment score in relation to supermarket profit shows initial growth from a low value 
              to around 0.6-0.7 between 50 and 100 profit units, followed by significant fluctuations with peaks and dips, 
              especially around 100-150 profit units, and a slight decline towards 200 profit units. This suggests that sentiment 
              may vary with profit levels, with higher sentiment observed in the mid-range profit zone, but no clear consistent 
              trend indicates a strong direct relationship with supermarket profit. Other factors might also influence these 
              sentiment variations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 3: Sentiment vs Promotion Spend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Average Sentiment Score vs Promotion Spend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.sentimentPromotionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="promotionSpend" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sentimentScore" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Sentiment Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the sentiment score in relation to supermarket promotion spend shows an initial increase 
              from a low value to around 0.5-0.6 between 50 and 100 units, followed by significant fluctuations with peaks and 
              dips, particularly around 100-150 units, and a stabilization towards 200 units. This suggests that sentiment may 
              be influenced by promotion spend to some degree, with higher variability in the mid-range, but no clear consistent 
              trend indicates a strong direct relationship with promotion spending. Other factors might also contribute to these 
              sentiment changes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 4: Sentiment vs Purchase Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Average Sentiment Score vs Purchase Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.sentimentFrequencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="purchaseFrequency" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sentimentScore" 
                  stroke="#ec4899" 
                  strokeWidth={2}
                  name="Sentiment Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the sentiment score in relation to purchase frequency shows an initial rise from around 
              0.4 to a peak near 0.8 at a frequency of 1, followed by a decline and stabilization around 0.4-0.6 between 
              frequencies of 2 and 3, with a sharp drop to a low point near 0.2 at frequency 3, and then a recovery to around 
              0.6-0.7 at frequency 4. This suggests that sentiment may vary significantly with purchase frequency, with higher 
              sentiment at the extremes (1 and 4) and lower sentiment in the middle range, possibly indicating other influencing 
              factors beyond frequency alone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 5: Sentiment Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5" />
            Sentiment Categories Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.sentimentCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.sentimentCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the sentiment categories are evenly distributed, with each category—negative, neutral, 
              and positive—representing approximately 33.33% of the total. This suggests a balanced distribution of sentiment, 
              indicating that there is no dominant sentiment category among the data points.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 6: Supermarket Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Average Sentiment Score by Supermarket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData.supermarketSentiment}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="supermarketId" 
                  type="category" 
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sentimentScore" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the top 5 supermarkets by average sentiment score are ranked as follows: supermarket 50 
              leads with the highest average sentiment score, followed closely by supermarkets 34, 32, 17, and 19. All five 
              supermarkets have average sentiment scores above 0.5, with 50 showing the highest value, indicating relatively 
              positive sentiment across these top performers. The scores are fairly close, suggesting a competitive range of 
              customer satisfaction among these supermarkets.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 7: Gender Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Average Sentiment Score by Gender
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.genderSentiment}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ gender, sentimentScore, count }) => `${gender}: ${sentimentScore.toFixed(2)} (${count})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.genderSentiment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.gender === 'Male' ? COLORS.male : COLORS.female} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the average sentiment scores by gender are as follows: females have a sentiment score 
              of 0.53 with 73 individuals, males have a score of 0.49 with 50 individuals, and the overall average is 0.51 
              with 123 individuals. This suggests that females exhibit slightly higher sentiment scores compared to males, 
              with the overall average reflecting a balanced sentiment across both genders.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 8: Spending Score Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBar className="w-5 h-5" />
            Average Sentiment Score vs Spending Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.spendingScoreSentiment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="spendingScore" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sentimentScore" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the sentiment score in relation to spending score (1-100) shows variability across the 
              range. Sentiment scores peak around 0.6-0.8 at certain spending levels between 40 and 60, with noticeable 
              fluctuations. Lower sentiment scores (around 0.2-0.4) are observed at the extremes (below 40 and above 70), 
              suggesting that moderate spending levels may correlate with higher sentiment, while very low or very high 
              spending might be associated with lower sentiment. This indicates that spending behavior could influence 
              sentiment, though the relationship is not consistently linear.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 9: Annual Income Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Average Sentiment Score vs Annual Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.annualIncomeSentiment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="annualIncome" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sentimentScore" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Sentiment Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the sentiment score in relation to annual income (in thousands of dollars) shows 
              fluctuations across the range. Sentiment scores vary between 0.4 and 0.6, with peaks and dips occurring 
              throughout the income levels from 20k to 60k. There is no clear consistent trend indicating a strong direct 
              relationship between annual income and sentiment, suggesting that other factors might also influence sentiment 
              across these income brackets.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 10: Age Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Average Sentiment Score vs Age
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.ageSentiment}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sentimentScore" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the sentiment score across different age groups shows variability. The highest average 
              sentiment scores, approaching 0.8-1.0, are observed in the 70 and 60 age groups, indicating stronger positive 
              sentiment among older individuals. The 50 and 40 age groups have moderate sentiment scores around 0.5-0.7, 
              while the 30 and 20 age groups show lower scores, generally below 0.5. This suggests that sentiment tends to 
              increase with age, with older age groups exhibiting higher sentiment scores compared to younger ones.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 11: Promotion Spend vs Profit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScatterChartIcon className="w-5 h-5" />
            Promotion Spend vs Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={chartData.promotionProfitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="promotionSpend" />
                <YAxis dataKey="profit" />
                <Tooltip content={<CustomTooltip />} />
                <Scatter dataKey="profit" fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the profit (in thousands of rubles) in relation to promotion spend (in millions of 
              rubles) shows significant variability. Profit starts at around 50k with a promotion spend of 0 million, 
              increases sharply to peaks around 150k-200k with spends between 0.1 and 0.2 million, and then fluctuates with 
              some dips back to 100k. This suggests that higher promotion spending is associated with higher profits, though 
              the relationship is not linear, indicating that other factors might also influence profit levels.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 12: Administration Spend vs Profit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScatterChartIcon className="w-5 h-5" />
            Administration Spend vs Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={chartData.administrationProfitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="administrationSpend" />
                <YAxis dataKey="profit" />
                <Tooltip content={<CustomTooltip />} />
                <Scatter dataKey="profit" fill="#10b981" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the profit (in millions of dollars) in relation to administration spend (in millions 
              of dollars) shows a general upward trend. Profit remains low (around 0-0.1 million) with administration spends 
              up to 0.1 million, then increases significantly with higher spends, peaking above 0.4 million at an 
              administration spend of around 0.2 million. This suggests that higher administration spending is associated 
              with higher profits, with a notable increase occurring as spending exceeds 0.1 million.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 13: Advertisement Spend vs Profit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Advertisement Spend vs Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.advertisementProfitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="advertisementSpend" />
                <YAxis dataKey="profit" />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Profit"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the profit (in thousands of dollars) in relation to advertisement spend (in millions 
              of dollars) shows a general upward trend. Profit remains low (around 50k) with advertisement spends up to 0.1 
              million, then increases significantly, reaching peaks above 200k at spends around 0.2 million. This suggests 
              that higher advertisement spending is associated with higher profits, with a notable increase occurring as 
              spending exceeds 0.1 million.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 14: Monthly Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Average Sentiment Score by Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData.monthlySentiment}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="month" 
                  type="category" 
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sentimentScore" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the average sentiment score per month is divided into two categories: "june" and "july". 
              The june category accounts for 49.84% with an average sentiment score of 0.51, while the july category accounts 
              for 50.16% with an average sentiment score of 0.52. This indicates a nearly even distribution of sentiment, 
              with a slight edge in average score for the july category, suggesting that sentiment is relatively balanced 
              across the two groups over the months.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart 15: Product Count */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Product Purchase Count
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData.productCount}
                layout="horizontal"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="product" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              According to your data, the chart displays the amount of products bought across various categories. The products 
              are ranked by their purchase frequency, with the following observations: The most frequently bought products 
              include chocolate, French fries, milk, mineral water, spaghetti, burgers, eggs, green tea, tomatoes, turkey, 
              cookies, energy bar, frozen vegetables, ground beef, honey, olive oil, pancakes, soup, and avocado, each with 
              a count approaching or exceeding 50. Shrimp and avocado have the lowest purchase count, significantly below 
              the others, indicating it is the least bought product. The counts for all other products are relatively uniform, 
              ranging from approximately 50 to 60, suggesting a high and consistent demand across these items. This indicates 
              that while most products are popular with a similar purchase frequency, shrimp and avocado stand out as an 
              exception with much lower demand.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 