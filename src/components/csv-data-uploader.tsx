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
}

const tableConfigs = [
  {
    key: 'sentiment_analyses',
    title: 'Sentiment Analyses',
    description: 'Upload sentiment analysis data with customer feedback scores',
    expectedColumns: ['sentiment_id', 'customer_id', 'supermarket_id', 'basket_id', 'sentiment_date', 'sentiment_score', 'confidence_level', 'sentiment_category'],
    sampleFile: 'Sentiment_analysis.csv'
  },
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
  }
];

export default function CsvDataUploader({ userId }: CsvDataUploaderProps) {
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
  const [datasetName, setDatasetName] = useState<string>("");
  const [isBulkUploading, setIsBulkUploading] = useState<boolean>(false);

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
      toast({
        title: 'Dataset name required',
        description: 'Please enter a dataset name. It will be stored in the file_name column for all uploaded rows.',
        variant: 'destructive',
      });
      return;
    }

    // Required order
    const order = [
      'supermarket_branches',
      'supermarket_customer_members',
      'market_basket_optimisation',
      'ads_ctr_optimisation',
      'sentiment_analyses',
    ];

    // Ensure all required files are selected
    for (const key of order) {
      if (!uploadStatuses[key]?.file) {
        setUploadStatuses(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            status: 'error',
            message: 'Please select a CSV file before bulk upload.'
          }
        }));
        toast({ title: 'Missing file', description: `Please select a file for ${key.replaceAll('_', ' ')}.`, variant: 'destructive' });
        return;
      }
    }

    setIsBulkUploading(true);
    try {
      for (const key of order) {
        await uploadCsvData(key);
      }
      toast({ title: 'Bulk upload complete', description: 'All tables were uploaded successfully in the required order.' });
    } catch (e) {
      // uploadCsvData already toasts specific errors
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
                  <Label htmlFor={`file-${config.key}`}>Select CSV File</Label>
                  <Input
                    id={`file-${config.key}`}
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileSelect(config.key, e.target.files?.[0] || null)}
                    disabled={status.status === 'uploading' || isBulkUploading}
                    className="cursor-pointer transition-colors hover:bg-blue-50 hover:border-blue-300"
                  />
                  <p className="text-xs text-gray-500">
                    Expected columns: {config.expectedColumns.join(', ')}
                  </p>
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
