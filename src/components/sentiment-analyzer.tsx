"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Loader2, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { useToast } from "./ui/use-toast";
import UsageDisplay from "./usage-display";

interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  key_phrases: string[];
  processing_time_ms: number;
  tokens_used: number;
}

interface SentimentAnalyzerProps {
  userId: string;
  currentUsage: number;
  usageLimit: number;
  subscriptionStatus: string;
}

export default function SentimentAnalyzer({
  userId,
  currentUsage = 0,
  usageLimit = 100,
  subscriptionStatus = "free",
}: SentimentAnalyzerProps) {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SentimentResult | null>(null);
  const { toast } = useToast();

  if (subscriptionStatus === 'none') {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Sentiment Analysis
          </CardTitle>
          <CardDescription>
            Analyze customer feedback and understand sentiment patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-8">
            <a
              href="/pricing"
              className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow"
            >
              Get Started Free
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze",
        variant: "destructive",
      });
      return;
    }

    if (currentUsage >= usageLimit) {
      toast({
        title: "Usage Limit Reached",
        description:
          "You've reached your monthly API limit. Please upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/sentiment/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);

      toast({
        title: "Analysis Complete",
        description: `Sentiment: ${data.sentiment} (${Math.round(data.confidence * 100)}% confidence)`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "negative":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
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

  const usagePercentage = (currentUsage / usageLimit) * 100;

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Sentiment Analysis
        </CardTitle>
        <CardDescription>
          Analyze customer feedback and understand sentiment patterns
        </CardDescription>

        {/* Usage Indicator */}
        <UsageDisplay
          currentUsage={currentUsage}
          usageLimit={usageLimit}
          showDetails={false}
          showWarnings={true}
          size="md"
        />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <Textarea
            placeholder="Enter customer feedback, reviews, or any text to analyze sentiment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={10000}
          />

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {text.length}/10,000 characters
            </span>
            <Button
              onClick={handleAnalyze}
              disabled={
                isAnalyzing || !text.trim() || currentUsage >= usageLimit
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Sentiment"
              )}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-semibold text-gray-900">Analysis Results</h3>

            {/* Sentiment Badge */}
            <div className="flex items-center gap-3">
              {getSentimentIcon(result.sentiment)}
              <Badge
                variant="outline"
                className={`${getSentimentColor(result.sentiment)} font-medium`}
              >
                {result.sentiment.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600">
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>

            {/* Confidence Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence Score</span>
                <span>{Math.round(result.confidence * 100)}%</span>
              </div>
              <Progress value={result.confidence * 100} className="h-2" />
            </div>

            {/* Key Phrases */}
            {result.key_phrases && result.key_phrases.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Key Phrases</h4>
                <div className="flex flex-wrap gap-2">
                  {result.key_phrases.map((phrase, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {phrase}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Info */}
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
              <span>Processing time: {result.processing_time_ms}ms</span>
              <span>Tokens used: {result.tokens_used}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
