'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Loader2 } from 'lucide-react';

interface GenderSentimentData {
  gender: string;
  averageScore: number;
  count: number;
}

interface GenderSentimentResponse {
  chartData: GenderSentimentData[];
}

interface GenderSentimentSummary {
  totalCustomers: number;
  averageSentiment: number;
  genderDistribution: { [key: string]: number };
}

const DynamicAnalystReview = ({ data }: { data: GenderSentimentData[] }) => {
  const generateInsights = () => {
    if (!data || data.length === 0) {
      return "No gender sentiment data available for analysis. Please ensure you have customer gender information and sentiment analyses in your database.";
    }

    // Calculate statistics
    const totalCustomers = data.reduce((sum, item) => sum + item.count, 0);
    const averageSentiment = data.reduce((sum, item) => sum + item.averageScore, 0) / data.length;
    
    // Find best and worst performing genders
    const bestPerformer = data.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );
    const worstPerformer = data.reduce((worst, current) => 
      current.averageScore < worst.averageScore ? current : worst
    );

    // Calculate gender distribution
    const genderDistribution = data.map(item => ({
      gender: item.gender,
      percentage: (item.count / totalCustomers * 100),
      sentiment: item.averageScore
    }));

    // Sentiment performance analysis
    const positiveGenders = data.filter(item => item.averageScore > 0.6);
    const neutralGenders = data.filter(item => item.averageScore >= 0.4 && item.averageScore <= 0.6);
    const negativeGenders = data.filter(item => item.averageScore < 0.4);

    // Calculate sentiment variance
    const sentimentVariance = data.reduce((sum, item) => 
      sum + Math.pow(item.averageScore - averageSentiment, 2), 0) / data.length;
    const sentimentStdDev = Math.sqrt(sentimentVariance);

    return {
      totalCustomers,
      averageSentiment,
      bestPerformer,
      worstPerformer,
      genderDistribution,
      positiveGenders,
      neutralGenders,
      negativeGenders,
      sentimentStdDev,
      sentimentRange: bestPerformer.averageScore - worstPerformer.averageScore
    };
  };

  const insights = generateInsights();
  
  if (typeof insights === 'string') {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">🤖 AI Analysis</h4>
        <p className="text-sm text-gray-700">{insights}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 bg-white rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Gender Sentiment Analysis</h4>
      <p className="text-sm text-gray-600 mb-3">
        Analysis of {insights.totalCustomers} customers across {data.length} gender categories
      </p>
      
      <div className="space-y-3 text-sm text-gray-700">
        {/* Overall Performance */}
        <div className={`p-3 rounded-lg border-l-4 ${
          insights.averageSentiment > 0.6 ? 'bg-green-50 border-green-400' :
          insights.averageSentiment >= 0.4 ? 'bg-blue-50 border-blue-400' :
          'bg-red-50 border-red-400'
        }`}>
          <p className={`font-medium ${
            insights.averageSentiment > 0.6 ? 'text-green-800' :
            insights.averageSentiment >= 0.4 ? 'text-blue-800' :
            'text-red-800'
          }`}>
            👥 Overall Gender Sentiment: {insights.averageSentiment > 0.6 ? 'POSITIVE' : insights.averageSentiment >= 0.4 ? 'NEUTRAL' : 'NEGATIVE'}
          </p>
          <p>
            Average sentiment score across all genders is {insights.averageSentiment.toFixed(3)}. 
            The sentiment range between genders is {insights.sentimentRange.toFixed(3)}, indicating 
            {insights.sentimentRange > 0.2 ? 'significant' : insights.sentimentRange > 0.1 ? 'moderate' : 'minimal'} 
            variation in customer satisfaction by gender.
          </p>
        </div>

        {/* Best and Worst Performers */}
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <p className="font-medium text-purple-800">🏆 Performance Leaders</p>
          <p>
            <strong>{insights.bestPerformer.gender}</strong> customers show the highest satisfaction 
            ({insights.bestPerformer.averageScore.toFixed(3)} avg sentiment, {insights.bestPerformer.count} customers), 
            while <strong>{insights.worstPerformer.gender}</strong> customers have the lowest 
            ({insights.worstPerformer.averageScore.toFixed(3)} avg sentiment, {insights.worstPerformer.count} customers).
          </p>
        </div>

        {/* Gender Distribution */}
        <div className="p-3 bg-cyan-50 rounded-lg border-l-4 border-cyan-400">
          <p className="font-medium text-cyan-800">📊 Customer Demographics</p>
          <div className="mt-2 space-y-1">
            {insights.genderDistribution.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{item.gender}: {item.percentage.toFixed(1)}% of customers</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  item.sentiment > 0.6 ? 'bg-green-100 text-green-800' :
                  item.sentiment >= 0.4 ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.sentiment.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
          <p className="font-medium text-yellow-800">💡 Strategic Recommendations</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            {insights.negativeGenders.length > 0 && (
              <li>Focus improvement efforts on {insights.negativeGenders.map(g => g.gender).join(', ')} customer segments</li>
            )}
            {insights.bestPerformer.count < insights.totalCustomers * 0.3 && (
              <li>Expand successful practices from {insights.bestPerformer.gender} segment to other demographics</li>
            )}
            {insights.sentimentRange > 0.2 && (
              <li>Investigate factors causing sentiment disparities between gender groups</li>
            )}
            <li>Consider targeted marketing strategies for each gender segment based on sentiment patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function GenderSentimentChart({ loading: externalLoading }: { loading?: boolean }) {
  const [data, setData] = useState<GenderSentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/gender-sentiment');
        
        if (!response.ok) {
          throw new Error('Failed to fetch gender sentiment data');
        }
        
        const result: GenderSentimentResponse = await response.json();
        setData(result.chartData);
      } catch (err) {
        console.error('Error fetching gender sentiment data:', err);
        setError('Failed to load gender sentiment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as GenderSentimentData;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{data.gender}</p>
          <p>Avg. Sentiment: {data.averageScore.toFixed(2)}</p>
          <p>Customers: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  if (externalLoading || loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Gender Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="sr-only">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Gender Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Gender Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-gray-500">No gender sentiment data available</p>
        </CardContent>
      </Card>
    );
  }

  // Sort data by gender for consistent display
  const sortedData = [...data].sort((a, b) => a.gender.localeCompare(b.gender));

  // Calculate average sentiment across all genders
  const averageSentiment = 
    data.reduce((sum, item) => sum + item.averageScore, 0) / data.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Gender Sentiment Analysis
          </CardTitle>
          <div className="text-sm text-gray-600">
            Avg: <span className="font-medium">{averageSentiment.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number" 
                domain={[0, 1]} 
                tickCount={6}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <YAxis 
                dataKey="gender" 
                type="category" 
                width={80}
                tick={{ fontSize: 14 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="averageScore" 
                name="Average Sentiment"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-500 text-center">
          Hover over bars to see customer count
        </div>
        
        {/* Dynamic AI Review */}
        <DynamicAnalystReview data={data} />
      </CardContent>
    </Card>
  );
}
