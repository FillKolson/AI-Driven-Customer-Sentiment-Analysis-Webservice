'use client';

import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2 } from 'lucide-react';

interface BranchData {
  branch_id: string;
  branch_name: string;
  promotion_spend: number;
  profit: number;
}

interface PromotionProfitResponse {
  chartData: BranchData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

// Dynamic AI Review Component for Promotion Profit
const DynamicPromotionProfitReview = ({ data }: { data: BranchData[] }) => {
  const generatePromotionInsights = () => {
    if (!data || data.length === 0) {
      return {
        totalBranches: 0,
        totalPromotionSpend: 0,
        totalProfit: 0,
        avgROI: 0,
        bestPerformingBranch: { branch_name: '', promotion_spend: 0, profit: 0, roi: 0 },
        worstPerformingBranch: { branch_name: '', promotion_spend: 0, profit: 0, roi: 0 },
        correlation: 0,
        profitabilityRate: 0
      };
    }

    const totalPromotionSpend = data.reduce((sum, item) => sum + (item.promotion_spend || 0), 0);
    const totalProfit = data.reduce((sum, item) => sum + (item.profit || 0), 0);
    
    // Calculate ROI for each branch
    const branchesWithROI = data.map(branch => ({
      ...branch,
      roi: branch.promotion_spend > 0 ? (branch.profit / branch.promotion_spend) * 100 : 0
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
      data.map(d => d.promotion_spend),
      data.map(d => d.profit)
    );

    return {
      totalBranches: data.length,
      totalPromotionSpend,
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
    const insights = generatePromotionInsights();
    
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
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Promotion ROI Analysis</h4>
      <p className="text-sm text-gray-600 mb-3">
        Analysis based on {insights.totalBranches} branches with total promotion spend of ${insights.totalPromotionSpend.toLocaleString()}
      </p>
      
      <div className="space-y-3 text-sm text-gray-700">
        {/* Performance Overview */}
        <div className={`p-3 ${review.performanceBg} rounded-lg border-l-4 ${review.performanceBorder}`}>
          <p className={`font-medium ${review.performanceColor}`}>🎯 Overall Promotion Performance: {review.performanceLevel.toUpperCase()}</p>
          <p>
            Your promotion campaigns achieve an average ROI of {insights.avgROI.toFixed(1)}% across all branches. 
            {insights.bestPerformingBranch.branch_name} leads with {insights.bestPerformingBranch.roi.toFixed(1)}% ROI 
            (${insights.bestPerformingBranch.profit.toLocaleString()} profit from ${insights.bestPerformingBranch.promotion_spend.toLocaleString()} spend), 
            while {insights.worstPerformingBranch.branch_name} shows {insights.worstPerformingBranch.roi.toFixed(1)}% ROI.
          </p>
        </div>

        {/* Correlation Analysis */}
        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="font-medium text-blue-800">📈 Spend-Profit Correlation: {review.correlationStrength.toUpperCase()}</p>
          <p>
            The correlation coefficient of {insights.correlation.toFixed(3)} indicates a {review.correlationStrength} relationship 
            between promotion spending and profit generation. 
            {insights.correlation > 0.4 
              ? "This strong positive correlation suggests that higher promotion spending effectively drives profit growth."
              : insights.correlation < 0 
              ? "This negative correlation indicates promotion spending may not be effectively converting to profits - review campaign strategies."
              : "The weak correlation suggests promotion effectiveness varies significantly across branches - investigate best practices."
            }
          </p>
        </div>

        {/* Profitability Analysis */}
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <p className="font-medium text-green-800">🏆 Profitability Performance</p>
          <p>
            {insights.profitabilityRate.toFixed(1)}% of branches ({Math.round(insights.profitabilityRate * insights.totalBranches / 100)} out of {insights.totalBranches}) 
            achieve profitable promotion campaigns (ROI &gt; 100%). The top performer {insights.bestPerformingBranch.branch_name} 
            demonstrates excellent promotion efficiency with {insights.bestPerformingBranch.roi.toFixed(1)}% ROI, serving as a 
            benchmark for optimization across the network.
          </p>
        </div>

        {/* Strategic Recommendations */}
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <p className="font-medium text-purple-800">🚀 Promotion Strategy Recommendations</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {insights.correlation > 0.4 && (
              <li><strong>Scale Successful Campaigns:</strong> Strong spend-profit correlation indicates effective promotion strategies - consider increasing budgets for high-performing branches</li>
            )}
            {insights.avgROI < 100 && (
              <li><strong>Campaign Optimization Priority:</strong> Average ROI below 100% indicates urgent need for promotion strategy review and optimization</li>
            )}
            {insights.profitabilityRate < 50 && (
              <li><strong>Branch Performance Gap:</strong> Less than half of branches are profitable - implement best practices from {insights.bestPerformingBranch.branch_name}</li>
            )}
            <li><strong>Best Practice Replication:</strong> Study {insights.bestPerformingBranch.branch_name}'s {insights.bestPerformingBranch.roi.toFixed(1)}% ROI strategy and replicate across underperforming branches</li>
            {insights.worstPerformingBranch.roi < 50 && (
              <li><strong>Immediate Intervention:</strong> {insights.worstPerformingBranch.branch_name} requires immediate promotion strategy overhaul with {insights.worstPerformingBranch.roi.toFixed(1)}% ROI</li>
            )}
            {review.correlationStrength === 'negligible' && (
              <li><strong>Strategy Standardization:</strong> Inconsistent spend-profit relationship suggests need for standardized promotion guidelines and training</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function PromotionProfitChart({ loading: externalLoading }: { loading?: boolean }) {
  const [data, setData] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/promotion-profit');
        
        if (!response.ok) {
          throw new Error('Failed to fetch promotion profit data');
        }
        
        const result: PromotionProfitResponse = await response.json();
        setData(result.chartData || []);
      } catch (err) {
        console.error('Error fetching promotion profit data:', err);
        setError('Failed to load promotion profit data');
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
          <p className="font-semibold">{data.branch_name}</p>
          <p>Promotion Spend: ${data.promotion_spend?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p>Profit: ${data.profit?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          {data.profit && data.promotion_spend && (
            <p>ROI: {((data.profit / data.promotion_spend) * 100).toFixed(1)}%</p>
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Promotion Spend vs. Profit
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Promotion Spend vs. Profit
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Promotion Spend vs. Profit
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-gray-500">No promotion profit data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate correlation coefficient for the trend line
  const calculateCorrelation = () => {
    const n = data.length;
    if (n === 0) return 0;

    const x = data.map(d => d.promotion_spend);
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Promotion Spend vs. Profit
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
                dataKey="promotion_spend" 
                name="Promotion Spend"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                label={{ value: 'Promotion Spend ($)', position: 'insideBottom', offset: -5 }}
                domain={['auto', 'auto']}
              />
              <YAxis 
                type="number" 
                dataKey="profit" 
                name="Profit"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <ZAxis type="number" range={[100, 500]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Scatter name="Branches" data={data}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-gray-500 text-center">
          Each point represents a supermarket branch. Hover for details.
        </div>
        
        {/* AI Review Component */}
        <DynamicPromotionProfitReview data={data} />
      </CardContent>
    </Card>
  );
}
