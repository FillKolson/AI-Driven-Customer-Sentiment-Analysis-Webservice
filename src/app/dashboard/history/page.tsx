"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  ArrowLeft,
  Download,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import HistoryVisualizations from "@/components/history-visualizations";

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
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { toast } = useToast();

  const fetchAnalyses = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (sentimentFilter !== "all") {
        params.append("sentiment", sentimentFilter);
      }
      
      if (dateFrom) {
        params.append("date_from", dateFrom);
      }
      
      if (dateTo) {
        params.append("date_to", dateTo);
      }

      const response = await fetch(`/api/sentiment/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses(currentPage);
  }, [currentPage, sentimentFilter, dateFrom, dateTo]);

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

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      
      if (sentimentFilter !== "all") {
        params.append("sentiment", sentimentFilter);
      }
      
      if (dateFrom) {
        params.append("date_from", dateFrom);
      }
      
      if (dateTo) {
        params.append("date_to", dateTo);
      }

      const response = await fetch(`/api/sentiment/history/download?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        
        // Create filename with filters
        let filename = `sentiment-analysis-history-${new Date().toISOString().split('T')[0]}`;
        if (sentimentFilter !== "all") {
          filename += `-${sentimentFilter}`;
        }
        if (dateFrom || dateTo) {
          filename += "-filtered";
        }
        filename += ".csv";
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Successful",
          description: "Your sentiment analysis history has been downloaded as CSV",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Download Failed",
          description: errorData.error || "Failed to download CSV file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast({
        title: "Download Failed",
        description: "An error occurred while downloading the CSV file",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const filteredAnalyses = analyses.filter(
    (analysis) =>
      searchTerm === "" ||
      analysis.input_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.sentiment_result.key_phrases.some((phrase) =>
        phrase.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <Toaster />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analysis History
            </h1>
            <p className="text-gray-600 mt-1">
              View and search your past sentiment analyses
            </p>
          </div>
        </div>

        {/* Data Visualizations */}
        <HistoryVisualizations analyses={analyses} loading={loading} />

        <Card className="bg-white">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>All Analyses ({pagination.total})</CardTitle>

              {/* Filters */}
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search analyses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={sentimentFilter}
                  onValueChange={setSentimentFilter}
                >
                  <SelectTrigger className="w-32">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setShowDateFilter(!showDateFilter)}
                  variant="outline"
                  size="sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Date Filter
                </Button>
                <Button
                  onClick={handleDownloadCSV}
                  disabled={downloading || pagination.total === 0}
                  variant="outline"
                  size="sm"
                  title={
                    sentimentFilter !== "all" || dateFrom || dateTo
                      ? `Download filtered data (${sentimentFilter !== "all" ? sentimentFilter : "all sentiments"}${dateFrom || dateTo ? ", date filtered" : ""})`
                      : "Download all sentiment analysis history"
                  }
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? "Downloading..." : "Download CSV"}
                </Button>
              </div>
            </div>
            
            {/* Date Filter Section */}
            {showDateFilter && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      Clear Dates
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No analyses found</p>
                <p className="text-sm mt-1">
                  {searchTerm || sentimentFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Start by analyzing some text"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Text</TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Key Phrases</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAnalyses.map((analysis) => (
                        <TableRow key={analysis.id}>
                          <TableCell className="max-w-xs">
                            <p className="text-sm">
                              {truncateText(analysis.input_text, 80)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getSentimentIcon(
                                analysis.sentiment_result.sentiment,
                              )}
                              <Badge
                                variant="outline"
                                className={`${getSentimentColor(analysis.sentiment_result.sentiment)} text-xs`}
                              >
                                {analysis.sentiment_result.sentiment}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {Math.round(
                                analysis.sentiment_result.confidence * 100,
                              )}
                              %
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {analysis.sentiment_result.key_phrases
                                .slice(0, 3)
                                .map((phrase, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {phrase}
                                  </Badge>
                                ))}
                              {analysis.sentiment_result.key_phrases.length >
                                3 && (
                                <span className="text-xs text-gray-500">
                                  +
                                  {analysis.sentiment_result.key_phrases
                                    .length - 3}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {formatDate(analysis.created_at)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {filteredAnalyses.map((analysis) => (
                    <Card key={analysis.id} className="p-4">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-900">
                          {truncateText(analysis.input_text, 120)}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getSentimentIcon(
                              analysis.sentiment_result.sentiment,
                            )}
                            <Badge
                              variant="outline"
                              className={`${getSentimentColor(analysis.sentiment_result.sentiment)} text-xs`}
                            >
                              {analysis.sentiment_result.sentiment}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {Math.round(
                                analysis.sentiment_result.confidence * 100,
                              )}
                              %
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(analysis.created_at)}
                          </span>
                        </div>

                        {analysis.sentiment_result.key_phrases.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {analysis.sentiment_result.key_phrases
                              .slice(0, 4)
                              .map((phrase, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {phrase}
                                </Badge>
                              ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total,
                      )}{" "}
                      of {pagination.total} results
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(
                            Math.min(pagination.total_pages, currentPage + 1),
                          )
                        }
                        disabled={currentPage === pagination.total_pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
