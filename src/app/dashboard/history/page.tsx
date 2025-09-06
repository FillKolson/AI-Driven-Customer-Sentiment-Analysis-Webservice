"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import HistoryVisualizations from "@/components/history-visualizations";
import KeyMetricsChart from "@/components/key-metrics-chart";
import {
  Select as UiSelect,
  SelectContent as UiSelectContent,
  SelectItem as UiSelectItem,
  SelectTrigger as UiSelectTrigger,
  SelectValue as UiSelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Trash2 } from "lucide-react";

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
  file_name?: string;
  analysis_type?: string;
}

export default function HistoryPage() {
  const [allAnalyses, setAllAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  // Dataset deletion state
  const [datasets, setDatasets] = useState<string[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

  const fetchAllAnalyses = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard');
      if (response.ok) {
        const data = await response.json();
        setAllAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error("Error fetching all analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalyses();
    fetchDatasets();
  }, []);

  // Auto-refresh data every 30 seconds to catch new analyses
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllAnalyses();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDatasets = async () => {
    try {
      const res = await fetch('/api/datasets');
      if (res.ok) {
        const data = await res.json();
        setDatasets(Array.isArray(data.datasets) ? data.datasets : []);
        // keep selected if still present, otherwise clear
        setSelectedDataset((prev) => (data.datasets?.includes(prev) ? prev : ""));
      }
    } catch (e) {
      console.error('Failed to fetch datasets', e);
    }
  };

  const handleDeleteDataset = async () => {
    if (!selectedDataset) {
      toast({ title: 'No dataset selected', description: 'Please choose a dataset to delete', variant: 'destructive' });
      return;
    }
    if (!confirm(`Delete dataset "${selectedDataset}" from all related tables? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/datasets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: selectedDataset })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast({ title: 'Dataset deleted', description: data.message || `Removed "${selectedDataset}"` });
        // refresh everything
        await fetchAllAnalyses();
        await fetchDatasets();
        setSelectedDataset("");
      } else {
        toast({ title: 'Deletion issue', description: data.error || data.message || 'Failed to delete dataset', variant: 'destructive' });
      }
    } catch (e) {
      console.error('Delete dataset error', e);
      toast({ title: 'Deletion failed', description: 'Unexpected error occurred', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              Data Visualization
            </h1>
            <p className="text-gray-600 mt-1">
              View and search your past data
            </p>
          </div>
        </div>

        {/* Key Metrics Chart - Positive Sentiment Analysis */}
        <KeyMetricsChart loading={loading} />

        {/* Data Visualizations */}
        <HistoryVisualizations analyses={allAnalyses} />

        {/* Dataset Deletion */}
        <Card className="bg-white mt-6">
          <CardHeader>
            <CardTitle>Delete Dataset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="w-full sm:w-80">
                <UiSelect value={selectedDataset} onValueChange={setSelectedDataset}>
                  <UiSelectTrigger className="w-full">
                    <UiSelectValue placeholder={datasets.length ? 'Select dataset (file_name)' : 'No datasets found'} />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    {datasets.map((name) => (
                      <UiSelectItem key={name} value={name}>{name}</UiSelectItem>
                    ))}
                  </UiSelectContent>
                </UiSelect>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteDataset}
                disabled={deleting || !selectedDataset}
                title="Delete selected dataset from all related tables"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete Dataset'}
              </Button>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
