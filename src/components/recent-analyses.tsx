"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Analysis {
  id: string;
  input_text: string;
  sentiment_result: {
    sentiment: "positive" | "negative" | "neutral";
    confidence: number;
    key_phrases: string[];
  };
  created_at: string;
}

interface RecentAnalysesProps {
  userId: string;
}

export default function RecentAnalyses({ userId }: RecentAnalysesProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentAnalyses = async () => {
      try {
        const response = await fetch("/api/sentiment/history?limit=5");
        if (response.ok) {
          const data = await response.json();
          setAnalyses(data.analyses || []);
        }
      } catch (error) {
        console.error("Error fetching recent analyses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentAnalyses();
  }, [userId]);

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

  const truncateText = (text: string | null | undefined, maxLength: number = 100) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Recent Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Recent Analyses</CardTitle>
        <Link href="/dashboard/history">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            View All
            <ExternalLink className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {analyses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No analyses yet</p>
            <p className="text-sm mt-1">Start by analyzing some text above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="border-b border-gray-100 pb-4 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 mb-2">
                      {truncateText(analysis.input_text)}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      {analysis.sentiment_result ? (
                        <>
                          {getSentimentIcon(analysis.sentiment_result.sentiment)}
                          <Badge
                            variant="outline"
                            className={`${getSentimentColor(analysis.sentiment_result.sentiment)} text-xs`}
                          >
                            {analysis.sentiment_result.sentiment}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {Math.round(analysis.sentiment_result.confidence * 100)}
                            %
                          </span>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">
                          Processing...
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(analysis.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
