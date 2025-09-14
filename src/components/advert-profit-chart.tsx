'use client';

import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Loader2 } from 'lucide-react';

interface BranchData {
  supermarket_id: string;
  advertisement_spend: number;
  profit: number;
}

interface AdvertProfitResponse {
  chartData: BranchData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Dynamic AI Review Component for Advertisement Profit
const DynamicAdvertProfitReview = ({ data }: { data: BranchData[] }) => {
  const generateAdvertInsights = () => {
    if (!data || data.length === 0) {
      return {
        totalBranches: 0,
        totalAdvertSpend: 0,
        totalProfit: 0,
        avgROI: 0,
        bestPerformingBranch: { supermarket_id: '', advertisement_spend: 0, profit: 0, roi: 0 },
        worstPerformingBranch: { supermarket_id: '', advertisement_spend: 0, profit: 0, roi: 0 },
        correlation: 0,
        profitabilityRate: 0
      };
    }

    const totalAdvertSpend = data.reduce((sum, item) => sum + (item.advertisement_spend || 0), 0);
    const totalProfit = data.reduce((sum, item) => sum + (item.profit || 0), 0);
    
    // Calculate ROI for each branch
    const branchesWithROI = data.map(branch => ({
      ...branch,
      roi: branch.advertisement_spend > 0 ? (branch.profit / branch.advertisement_spend) * 100 : 0
    }));

    const bestPerformingBranch = branchesWithROI.reduce((best, current) => 
      current.roi > best.roi ? current : best
    );
    
    const worstPerformingBranch = branchesWithROI.reduce((worst, current) => 
      current.roi < worst.roi ? current : worst
    );

    const avgROI = branchesWithROI.reduce((sum, branch) => sum + branch.roi, 0) / branchesWithROI.length;
    const profitableBranches = branchesWithROI.filter(branch => branch.roi > 100).length;
    const profitabilityRate = (profitableBranches / data.length) * 100;

    // Calculate correlation
    const correlation = calculateCorrelation(
      data.map(d => d.advertisement_spend),
      data.map(d => d.profit)
    );

    return {
      totalBranches: data.length,
      totalAdvertSpend,
      totalProfit,
      avgROI,
      bestPerformingBranch,
      worstPerformingBranch,
      correlation,
      profitabilityRate
    };
  };

  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    if (n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const generateDynamicReview = () => {
    const insights = generateAdvertInsights();
    
    // Performance classification
    let performanceLevel = "needs improvement";
    let performanceColor = "text-red-600";
    let performanceBg = "bg-red-50";
    let performanceBorder = "border-red-400";
    
    if (insights.avgROI >= 200) {
      performanceLevel = "excellent";
      performanceColor = "text-green-600";
      performanceBg = "bg-green-50";
      performanceBorder = "border-green-400";
    } else if (insights.avgROI >= 150) {
      performanceLevel = "good";
      performanceColor = "text-blue-600";
      performanceBg = "bg-blue-50";
      performanceBorder = "border-blue-400";
    } else if (insights.avgROI >= 100) {
      performanceLevel = "average";
      performanceColor = "text-yellow-600";
      performanceBg = "bg-yellow-50";
      performanceBorder = "border-yellow-400";
    }

    // Correlation analysis
    const correlationAbs = Math.abs(insights.correlation);
    let correlationStrength = "negligible";
    if (correlationAbs > 0.7) correlationStrength = "strong";
    else if (correlationAbs > 0.4) correlationStrength = "moderate";
    else if (correlationAbs > 0.2) correlationStrength = "weak";

    return {
      performanceLevel,
      performanceColor,
      performanceBg,
      performanceBorder,
      correlationStrength,
      insights
    };
  };

  const review = generateDynamicReview();
  const { insights } = review;

  return (
    <div className="mt-6 p-4 bg-white rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Advertisement ROI Analysis</h4>
      <p className="text-sm text-gray-600 mb-3">
        Analysis based on {insights.totalBranches} branches with total advertisement spend of ${insights.totalAdvertSpend.toLocaleString()}
      </p>
      
      <div className="space-y-3 text-sm text-gray-700">
        {/* Performance Overview */}
        <div className={`p-3 ${review.performanceBg} rounded-lg border-l-4 ${review.performanceBorder}`}>
          <p className={`font-medium ${review.performanceColor}`}>🎯 Overall Advertisement Performance: {review.performanceLevel.toUpperCase()}</p>
          <p>
            Your advertisement campaigns achieve an average ROI of {insights.avgROI.toFixed(1)}% across all branches. 
            Branch {insights.bestPerformingBranch.supermarket_id} leads with {insights.bestPerformingBranch.roi.toFixed(1)}% ROI 
            (${insights.bestPerformingBranch.profit.toLocaleString()} profit from ${insights.bestPerformingBranch.advertisement_spend.toLocaleString()} ad spend), 
            while branch {insights.worstPerformingBranch.supermarket_id} shows {insights.worstPerformingBranch.roi.toFixed(1)}% ROI.
          </p>
        </div>

        {/* Correlation Analysis */}
        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="font-medium text-blue-800">📈 Ad Spend-Profit Correlation: {review.correlationStrength.toUpperCase()}</p>
          <p>
            The correlation coefficient of {insights.correlation.toFixed(3)} indicates a {review.correlationStrength} relationship 
            between advertisement spending and profit generation. 
            {insights.correlation > 0.4 
              ? "This strong positive correlation suggests that higher advertisement investment effectively drives profit growth."
              : insights.correlation < 0 
              ? "This negative correlation indicates advertisement spending may not be effectively converting to profits - review campaign targeting."
              : "The weak correlation suggests advertisement effectiveness varies significantly across branches - optimize campaign strategies."
            }
          </p>
        </div>

        {/* Campaign Effectiveness Analysis */}
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <p className="font-medium text-green-800">🏆 Campaign Effectiveness</p>
          <p>
            {insights.profitabilityRate.toFixed(1)}% of branches ({Math.round(insights.profitabilityRate * insights.totalBranches / 100)} out of {insights.totalBranches}) 
            achieve profitable advertisement campaigns (ROI &gt; 100%). The top performer Branch {insights.bestPerformingBranch.supermarket_id} 
            demonstrates excellent advertising efficiency with {insights.bestPerformingBranch.roi.toFixed(1)}% ROI, serving as a 
            benchmark for campaign optimization across the network.
          </p>
        </div>

        {/* Strategic Recommendations */}
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <p className="font-medium text-purple-800">🚀 Advertisement Strategy Recommendations</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {insights.correlation > 0.4 && (
              <li><strong>Scale Successful Campaigns:</strong> Strong ad spend-profit correlation indicates effective advertising strategies - increase budgets for high-performing branches</li>
            )}
            {insights.avgROI < 100 && (
              <li><strong>Campaign Optimization Priority:</strong> Average ROI below 100% indicates urgent need for advertisement strategy review and targeting optimization</li>
            )}
            {insights.profitabilityRate < 50 && (
              <li><strong>Campaign Standardization:</strong> Less than half of branches have profitable ads - implement best practices from Branch {insights.bestPerformingBranch.supermarket_id}</li>
            )}
            <li><strong>Best Practice Replication:</strong> Study Branch {insights.bestPerformingBranch.supermarket_id}'s {insights.bestPerformingBranch.roi.toFixed(1)}% ROI campaign strategy and replicate across underperforming branches</li>
            {insights.worstPerformingBranch.roi < 50 && (
              <li><strong>Immediate Campaign Review:</strong> Branch {insights.worstPerformingBranch.supermarket_id} requires immediate advertisement strategy overhaul with {insights.worstPerformingBranch.roi.toFixed(1)}% ROI</li>
            )}
            {review.correlationStrength === 'negligible' && (
              <li><strong>Campaign Optimization:</strong> Inconsistent ad spend-profit relationship suggests need for standardized campaign guidelines and audience targeting</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function AdvertProfitChart({ loading: externalLoading }: { loading?: boolean }) {
  const [data, setData] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/advert-profit');
        
        if (!response.ok) {
          throw new Error('Failed to fetch advertisement profit data');
        }
        
        const result: AdvertProfitResponse = await response.json();
        setData(result.chartData || []);
      } catch (err) {
        console.error('Error fetching advertisement profit data:', err);
        setError('Failed to load advertisement profit data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as BranchData;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">Branch ID: {data.supermarket_id}</p>
          <p>Ad Spend: ${data.advertisement_spend?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p>Profit: ${data.profit?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          {data.profit && data.advertisement_spend && (
            <p>ROI: {((data.profit / data.advertisement_spend) * 100).toFixed(1)}%</p>
          )}
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
            <Megaphone className="h-5 w-5 text-blue-600" />
            Advertisement Spend vs. Profit
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
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
            <Megaphone className="h-5 w-5 text-blue-600" />
            Advertisement Spend vs. Profit
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
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
            <Megaphone className="h-5 w-5 text-blue-600" />
            Advertisement Spend vs. Profit
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-gray-500">No advertisement profit data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate correlation coefficient for the trend line
  const calculateCorrelation = () => {
    const n = data.length;
    if (n === 0) return 0;

    const x = data.map(d => d.advertisement_spend);
    const y = data.map(d => d.profit);
    
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    return numerator / Math.sqrt(xDenominator * yDenominator);
  };

  const correlation = calculateCorrelation();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600" />
            Advertisement Spend vs. Profit
          </CardTitle>
          <div className="text-sm text-gray-600">
            Correlation: <span className={`font-medium ${correlation > 0 ? 'text-green-600' : correlation < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {correlation.toFixed(2)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="advertisement_spend" 
                name="Advertisement Spend"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                label={{ value: 'Advertisement Spend ($)', position: 'insideBottom', offset: -10 }}
                domain={['auto', 'auto']}
              />
              <YAxis 
                type="number" 
                dataKey="profit" 
                name="Profit"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                // label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft', offset: -10 }}
                label={{
                  value: 'Profit ($)',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -10,
                  style: {
                    textAnchor: 'middle'
                  }
                }}
                domain={['auto', 'auto']}
              />
              <ZAxis type="number" range={[100, 500]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Branches" data={data}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        {/* AI Review Component */}
        <DynamicAdvertProfitReview data={data} />
      </CardContent>
    </Card>
  );
}
