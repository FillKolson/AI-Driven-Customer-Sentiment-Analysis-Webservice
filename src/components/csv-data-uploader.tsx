"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, Database } from "lucide-react";

interface UploadStatus {
  file: File | null;
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
  progress: number;
}

interface CsvDataUploaderProps {
  userId: string;
  currentUsage?: number;
  usageLimit?: number;
  subscriptionStatus?: string;
}

const tableConfigs = [
  {
    key: 'supermarket_branches',
    title: 'Supermarket Branches',
    description: 'Upload supermarket branch data with financial metrics',
    expectedColumns: ['supermarket_id', 'advertisement_spend', 'promotion_spend', 'administration_spend', 'state', 'profit'],
    sampleFile: '50_SupermarketBranches_Modified.csv'
  },
  {
    key: 'supermarket_customer_members',
    title: 'Customer Members',
    description: 'Upload customer demographic and purchase behavior data',
    expectedColumns: ['customer_id', 'gender', 'age', 'annual_income', 'spending_score', 'total_purchases', 'average_order_value', 'purchase_frequency', 'last_purchase_date'],
    sampleFile: 'Supermarket_CustomerMembers_Modified.csv'
  },
  {
    key: 'market_basket_optimisation',
    title: 'Market Basket Data',
    description: 'Upload market basket analysis data with product combinations',
    expectedColumns: ['basket_id', 'product1', 'product2', 'product3', 'product4', 'product5', 'product6', 'product7', 'product8', 'product9'],
    sampleFile: 'Market_Basket_Optimisation_Modified.csv'
  },
  {
    key: 'ads_ctr_optimisation',
    title: 'Ads CTR Data',
    description: 'Upload advertisement click-through rate optimization data',
    expectedColumns: ['supermarket_id', 'ad1', 'ad2', 'ad3', 'ad4', 'ad5', 'ad6', 'ad7', 'ad8', 'ad9', 'ad10'],
    sampleFile: 'Ads_CTR_Optimisation_Modified.csv'
  },
  {
    key: 'sentiment_analyses',
    title: 'Sentiment Analyses',
    description: 'Upload sentiment analysis data with customer feedback scores',
    expectedColumns: ['sentiment_id', 'customer_id', 'supermarket_id', 'basket_id', 'sentiment_date', 'sentiment_score', 'confidence_level', 'sentiment_category'],
    sampleFile: 'Sentiment_analysis.csv'
  }
];

export default function CsvDataUploader({ userId, currentUsage = 0, usageLimit = 100, subscriptionStatus = "free" }: CsvDataUploaderProps) {
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>(
    tableConfigs.reduce((acc, config) => ({
      ...acc,
      [config.key]: {
        file: null,
        status: 'idle',
        message: '',
        progress: 0
      }
    }), {})
  );

  const { toast } = useToast();
  const [datasetName, setDatasetName] = useState("");
  const [datasetNameError, setDatasetNameError] = useState<string | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const handleFileSelect = (tableKey: string, file: File | null) => {
    setUploadStatuses(prev => ({
      ...prev,
      [tableKey]: {
        ...prev[tableKey],
        file,
        status: 'idle',
        message: '',
        progress: 0
      }
    }));
  };

  const validateCsvFile = (file: File, expectedColumns: string[]): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          if (lines.length === 0) {
            resolve(false);
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const expectedLower = expectedColumns.map(c => c.toLowerCase());
          
          // Check if most expected columns are present (allow some flexibility)
          const matchingColumns = expectedLower.filter(col => 
            headers.some(header => header.includes(col) || col.includes(header))
          );
          
          resolve(matchingColumns.length >= expectedColumns.length * 0.7);
        } catch {
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  };

  const uploadCsvData = async (tableKey: string) => {
    const status = uploadStatuses[tableKey];
    if (!status.file) return;

    const config = tableConfigs.find(c => c.key === tableKey);
    if (!config) return;

    // Validate file format
    const isValid = await validateCsvFile(status.file, config.expectedColumns);
    if (!isValid) {
      setUploadStatuses(prev => ({
        ...prev,
        [tableKey]: {
          ...prev[tableKey],
          status: 'error',
          message: 'Invalid CSV format. Please check the column headers match the expected format.'
        }
      }));
      return;
    }

    // Pre-check API usage limit only for sentiment analyses (this consumes API)
    if (tableKey === 'sentiment_analyses') {
      try {
        const text = await status.file.text();
        const nonEmptyLines = text.split('\n').filter(line => line.trim() !== '').length;
        const tokensToUse = Math.max(0, nonEmptyLines - 1); // exclude header
        if (currentUsage + tokensToUse > usageLimit) {
          const remaining = Math.max(0, usageLimit - currentUsage);
          setUploadStatuses(prev => ({
            ...prev,
            [tableKey]: {
              ...prev[tableKey],
              status: 'error',
              message: `Insufficient API balance. This upload would use ${tokensToUse} calls, but you only have ${remaining} remaining.`
            }
          }));
          toast({
            title: "Insufficient API balance",
            description: `This upload would use ${tokensToUse} API calls, but you only have ${remaining} remaining. Please upgrade your plan or reduce file size.`,
            variant: "destructive",
          });
          return;
        }
      } catch (e) {
        // If we cannot read file for some reason, proceed without pre-check
        console.error('Failed to pre-check usage from file:', e);
      }
    }

    setUploadStatuses(prev => ({
      ...prev,
      [tableKey]: {
        ...prev[tableKey],
        status: 'uploading',
        progress: 0,
        message: 'Uploading and processing CSV data...'
      }
    }));

    try {
      const formData = new FormData();
      formData.append('file', status.file);
      formData.append('tableType', tableKey);
      if (datasetName.trim()) {
        formData.append('datasetName', datasetName.trim());
      }

      const response = await fetch('/api/csv-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      setUploadStatuses(prev => ({
        ...prev,
        [tableKey]: {
          ...prev[tableKey],
          status: 'success',
          progress: 100,
          message: `Successfully uploaded ${result.recordsProcessed} records`
        }
      }));

      toast({
        title: "Upload Successful",
        description: `${config.title} data uploaded successfully. ${result.recordsProcessed} records processed.`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadStatuses(prev => ({
        ...prev,
        [tableKey]: {
          ...prev[tableKey],
          status: 'error',
          progress: 0,
          message: errorMessage
        }
      }));

      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const uploadAllInOrder = async () => {
    // Validate dataset name
    if (!datasetName.trim()) {
      setDatasetNameError("Dataset name is required");
      return;
    }
    setDatasetNameError(null);

    // Required order
    const order = [
      'supermarket_branches',
      'supermarket_customer_members',
      'market_basket_optimisation',
      'ads_ctr_optimisation',
      'sentiment_analyses',
    ];

    // Reset all statuses first
    setUploadStatuses(prev => {
      const newStatuses = { ...prev };
      order.forEach(key => {
        if (newStatuses[key]) {
          newStatuses[key] = {
            ...newStatuses[key],
            status: 'idle',
            message: '',
            progress: 0
          };
        }
      });
      return newStatuses;
    });

    // Check all files are selected and validate them first
    for (const key of order) {
      const file = uploadStatuses[key]?.file;
      const config = tableConfigs.find(c => c.key === key);
      
      if (!file) {
        setUploadStatuses(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            status: 'error',
            message: 'Please select a CSV file before bulk upload.'
          }
        }));
        toast({ 
          title: 'Missing file', 
          description: `Please select a file for ${key.replaceAll('_', ' ')}.`, 
          variant: 'destructive' 
        });
        return;
      }

      // Validate file format
      const isValid = await validateCsvFile(file, config?.expectedColumns || []);
      if (!isValid) {
        setUploadStatuses(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            status: 'error',
            message: 'Invalid CSV format. Please check the column headers match the expected format.'
          }
        }));
        toast({
          title: 'Validation failed',
          description: `${config?.title || 'A file'} CSV is invalid. Fix it before uploading.`,
          variant: 'destructive',
        });
        return; // Abort bulk upload if any file is invalid
      }
    }

    // Pre-check API usage limit for bulk upload (only sentiment file counts)
    try {
      const sentimentFile = uploadStatuses['sentiment_analyses']?.file || null;
      if (sentimentFile) {
        const text = await sentimentFile.text();
        const nonEmptyLines = text.split('\n').filter(line => line.trim() !== '').length;
        const tokensToUse = Math.max(0, nonEmptyLines - 1);
        if (currentUsage + tokensToUse > usageLimit) {
          const remaining = Math.max(0, usageLimit - currentUsage);
          setUploadStatuses(prev => ({
            ...prev,
            ['sentiment_analyses']: {
              ...prev['sentiment_analyses'],
              status: 'error',
              message: `Insufficient API balance. Bulk upload would use ${tokensToUse} calls for sentiments, but only ${remaining} remain.`
            }
          }));
          toast({
            title: 'Insufficient API balance',
            description: `Bulk upload would use ${tokensToUse} API calls for sentiment analysis, but you only have ${remaining} remaining.`,
            variant: 'destructive',
          });
          return;
        }
      }
    } catch (e) {
      console.error('Failed to pre-check usage for bulk upload:', e);
    }

    // If we get here, all validations passed
    setIsBulkUploading(true);

    try {
      // Build a single FormData payload for bulk endpoint
      const bulkForm = new FormData();
      bulkForm.append('datasetName', datasetName.trim());
      for (const key of order) {
        const f = uploadStatuses[key]?.file;
        if (f) bulkForm.append(key, f);
      }

      const response = await fetch('/api/csv-upload/bulk', {
        method: 'POST',
        body: bulkForm,
      });

      if (!response.ok) {
        let message = 'Bulk upload failed';
        let details: string[] | null = null;
        try {
          const err = await response.json();
          message = err.error || message;
          if (err.details && Array.isArray(err.details)) {
            details = err.details as string[];
          }
        } catch {}

        if (details && details.length > 0) {
          // Map details to specific keys and set only those to error
          const detailsByKey: Record<string, string[]> = {};
          for (const d of details) {
            // Expect prefix like "table_key: message"
            const idx = d.indexOf(':');
            if (idx > 0) {
              const key = d.slice(0, idx).trim();
              const msg = d.slice(idx + 1).trim();
              if (!detailsByKey[key]) detailsByKey[key] = [];
              detailsByKey[key].push(msg);
            }
          }

          setUploadStatuses(prev => {
            const next = { ...prev };
            for (const key of Object.keys(detailsByKey)) {
              if (order.includes(key as any)) {
                next[key] = {
                  ...next[key],
                  status: 'error',
                  progress: 0,
                  message: `${message}: ${detailsByKey[key].slice(0, 3).join('; ')}`,
                };
              }
            }
            return next;
          });
        }

        // Show toast, but do not overwrite statuses for unaffected inputs
        toast({
          title: 'Bulk upload failed',
          description: details && details.length > 0 ? `${message}: ${details.slice(0, 5).join('; ')}` : message,
          variant: 'destructive',
        });
        return;
      }

      const result = await response.json();

      // Success: update statuses per table with counts
      setUploadStatuses(prev => {
        const next = { ...prev };
        const byKey: Record<string, number> = {};
        if (Array.isArray(result.byTable)) {
          for (const r of result.byTable) {
            if (r && r.key) byKey[r.key] = r.inserted;
          }
        }
        for (const key of order) {
          next[key] = {
            ...next[key],
            status: 'success',
            progress: 100,
            message: `Successfully uploaded ${byKey[key] ?? 0} records`,
          };
        }
        return next;
      });

      toast({
        title: 'Bulk upload complete',
        description: `All tables were uploaded successfully. Total inserted: ${result.totalInserted ?? ''}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred during bulk upload.';
      // Do not mark all as error; just notify
      toast({ title: 'Bulk upload failed', description: message, variant: 'destructive' });
    } finally {
      setIsBulkUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-600 animate-pulse" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CSV Data Upload</h2>
          <p className="text-gray-600">Upload CSV files to populate your database tables</p>
        </div>
      </div>

      <Alert className="pt-4 pr-4 pb-4">
        <div className="flex items-center gap-2 justify-start">
          <div className="shrink-0">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <AlertDescription className="m-0">
              Make sure your CSV files match the expected format.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Usage info and warnings */}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-700">
          API usage: <span className="font-medium">{currentUsage}</span> / <span className="font-medium">{usageLimit}</span> calls this month
        </p>
        {currentUsage >= usageLimit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>You have exhausted your monthly API limit. Sentiment uploads are disabled.</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dataset-name">Dataset Name</Label>
        <Input
          id="dataset-name"
          placeholder="e.g., July_2025_Campaign_A"
          value={datasetName}
          onChange={(e) => setDatasetName(e.target.value)}
          disabled={isBulkUploading}
          className="w-full"
        />
        {datasetNameError && (
          <p className="text-sm font-medium text-destructive">
            {datasetNameError}
          </p>
        )}
        <div className="flex gap-2">
          <Button className="w-full" onClick={uploadAllInOrder} disabled={isBulkUploading}>
            {isBulkUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                Uploading all...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload All (Ordered)
              </>
            )}
          </Button>
          <Button asChild variant="outline" className="whitespace-nowrap">
            <Link href="/dashboard/history">View data visualizations</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {tableConfigs.map((config) => {
          const status = uploadStatuses[config.key];
          
          return (
            <Card key={config.key} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(status.status)}
                  {config.title}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>CSV File</Label>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`file-${config.key}`}
                      className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {status.file ? status.file.name : 'Choose File'}
                    </label>
                    <input
                      id={`file-${config.key}`}
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileSelect(config.key, e.target.files?.[0] || null)}
                      disabled={status.status === 'uploading' || isBulkUploading || (config.key === 'sentiment_analyses' && currentUsage >= usageLimit)}
                      className="hidden"
                    />
                    {status.file && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileSelect(config.key, null)}
                        disabled={status.status === 'uploading' || isBulkUploading}
                      >
                        <span className="sr-only">Clear</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Expected columns: {config.expectedColumns.join(', ')}
                  </p>
                  {config.key === 'sentiment_analyses' && (
                    <p className="text-xs text-gray-600">
                      Note: Uploading sentiment data consumes API calls equal to the number of rows.
                    </p>
                  )}
                </div>

                {status.status === 'uploading' && (
                  <div className="space-y-2">
                    <Progress value={status.progress} className="w-full" />
                    <p className="text-sm text-gray-600">{status.message}</p>
                  </div>
                )}

                {status.status === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {status.message}
                    </AlertDescription>
                  </Alert>
                )}

                {status.status === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{status.message}</AlertDescription>
                  </Alert>
                )}

                {null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
