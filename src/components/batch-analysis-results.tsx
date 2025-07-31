"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Download, 
  BarChart3, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

interface BatchAnalysisResult {
  id: string;
  text: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  key_phrases: string[];
  processing_time_ms: number;
  tokens_used: number;
  error?: string;
}

interface BatchAnalysisSummary {
  total_processed: number;
  successful: number;
  failed: number;
  total_tokens: number;
  total_processing_time: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

interface BatchAnalysisResultsProps {
  results: BatchAnalysisResult[];
  summary: BatchAnalysisSummary;
  onClose: () => void;
}

export default function BatchAnalysisResults({
  results,
  summary,
  onClose,
}: BatchAnalysisResultsProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [filterSentiment, setFilterSentiment] = useState<string>("all");

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "negative":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800 border-green-200";
      case "negative":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredResults = results.filter(result => {
    if (filterSentiment === "all") return true;
    return result.sentiment === filterSentiment;
  });

  const successRate = summary.total_processed > 0 
    ? (summary.successful / summary.total_processed) * 100 
    : 0;

  const downloadResults = () => {
    const csvContent = [
      "Text,Sentiment,Confidence,Key Phrases,Processing Time (ms),Tokens Used,Error",
      ...results.map(result => [
        `"${result.text.replace(/"/g, '""')}"`,
        result.sentiment,
        result.confidence,
        `"${result.key_phrases.join(', ')}"`,
        result.processing_time_ms,
        result.tokens_used,
        result.error || ""
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentiment-analysis-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Batch Analysis Results
            </CardTitle>
            <CardDescription>
              Analysis completed in {summary.total_processing_time}ms
            </CardDescription>
          </div>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.total_processed}</div>
            <div className="text-sm text-gray-600">Total Texts</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summary.total_tokens}</div>
            <div className="text-sm text-gray-600">Tokens Used</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Success Rate</span>
            <span>{successRate.toFixed(1)}%</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>

        {/* Sentiment Distribution */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Sentiment Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-lg font-semibold text-green-600">
                  {summary.sentiment_distribution.positive}
                </span>
              </div>
              <div className="text-sm text-gray-600">Positive</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-lg font-semibold text-red-600">
                  {summary.sentiment_distribution.negative}
                </span>
              </div>
              <div className="text-sm text-gray-600">Negative</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Minus className="w-4 h-4 text-gray-600" />
                <span className="text-lg font-semibold text-gray-600">
                  {summary.sentiment_distribution.neutral}
                </span>
              </div>
              <div className="text-sm text-gray-600">Neutral</div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={filterSentiment === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSentiment("all")}
            >
              All ({results.length})
            </Button>
            <Button
              variant={filterSentiment === "positive" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSentiment("positive")}
              className="text-green-600"
            >
              Positive ({summary.sentiment_distribution.positive})
            </Button>
            <Button
              variant={filterSentiment === "negative" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSentiment("negative")}
              className="text-red-600"
            >
              Negative ({summary.sentiment_distribution.negative})
            </Button>
            <Button
              variant={filterSentiment === "neutral" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSentiment("neutral")}
              className="text-gray-600"
            >
              Neutral ({summary.sentiment_distribution.neutral})
            </Button>
          </div>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            size="sm"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>

        {/* Detailed Results Table */}
        {showDetails && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Detailed Results ({filteredResults.length} items)
              </h3>
              <Button onClick={downloadResults} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Text</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Key Phrases</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result, index) => (
                    <TableRow key={result.id}>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={result.text}>
                          {result.text.length > 50 
                            ? `${result.text.substring(0, 50)}...` 
                            : result.text
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(result.sentiment)}
                          <Badge
                            variant="outline"
                            className={`${getSentimentColor(result.sentiment)} text-xs`}
                          >
                            {result.sentiment.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.error ? (
                          <span className="text-red-600 text-sm">N/A</span>
                        ) : (
                          <span className="text-sm">
                            {Math.round(result.confidence * 100)}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-32">
                          {result.error ? (
                            <span className="text-red-600 text-xs">N/A</span>
                          ) : (
                            result.key_phrases.slice(0, 2).map((phrase, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {phrase}
                              </Badge>
                            ))
                          )}
                          {result.key_phrases.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{result.key_phrases.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.error ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs">Failed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">Success</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Error Summary */}
            {summary.failed > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800">Failed Analyses</span>
                </div>
                <p className="text-sm text-red-700">
                  {summary.failed} texts failed to analyze. Common issues include empty text, 
                  text too long, or API rate limits. Check the detailed results above for specific errors.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 