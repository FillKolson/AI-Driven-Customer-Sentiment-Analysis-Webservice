"use client";

import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Loader2, Upload, FileText, AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { parseCSVWithMetrics, validateCSVStructure, ParsedCSVRow } from "../lib/csvParser";
import { SentimentResult } from "../app/api/sentiment/batch-status/types";

interface FileUploadProps {
  userId: string;
  currentUsage: number;
  usageLimit: number;
  subscriptionStatus: string;
  onAnalysisComplete: (results: any) => void;
}

interface ParsedText {
  id: string;
  text: string;
  lineNumber: number;
  metrics?: any;
}

export default function FileUpload({
  userId,
  currentUsage,
  usageLimit,
  subscriptionStatus,
  onAnalysisComplete,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedTexts, setParsedTexts] = useState<ParsedText[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [columnMapping, setColumnMapping] = useState<any>(null);
  const [csvValidation, setCsvValidation] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (subscriptionStatus === 'none') {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Batch Analysis
          </CardTitle>
          <CardDescription>
            Upload CSV or TXT files to analyze multiple texts at once
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['text/csv', 'text/plain', 'application/csv'];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(selectedFile.type) && !['csv', 'txt'].includes(fileExtension || '')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or TXT file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const text = await file.text();
      
      // Check if it's a CSV file
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Parse CSV with metrics
        const validation = validateCSVStructure(text);
        setCsvValidation(validation);
        
        if (!validation.isValid) {
          toast({
            title: "CSV Validation Failed",
            description: validation.errors.join(', '),
            variant: "destructive",
          });
          return;
        }
        
        if (validation.warnings.length > 0) {
          toast({
            title: "CSV Warnings",
            description: validation.warnings.join(', '),
            variant: "default",
          });
        }
        
        const { rows, columnMapping: mapping } = parseCSVWithMetrics(text);
        
        if (rows.length === 0) {
          toast({
            title: "No Valid Data",
            description: "The CSV contains no valid rows to analyze",
            variant: "destructive",
          });
          return;
        }
        
        if (rows.length > 100) {
          toast({
            title: "Too Many Rows",
            description: "Maximum 100 rows per file. Please split your data into smaller files.",
            variant: "destructive",
          });
          return;
        }
        
        const parsed: ParsedText[] = rows.map(row => ({
          id: row.id,
          text: row.text,
          lineNumber: row.lineNumber,
          metrics: row.metrics
        }));
        
        setParsedTexts(parsed);
        setColumnMapping(mapping);
        setUploadProgress(100);
        
        toast({
          title: "CSV Parsed Successfully",
          description: `Found ${parsed.length} rows with ${Object.keys(mapping).length} detected columns`,
        });
        
      } else {
        // Parse as plain text (existing logic)
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length === 0) {
          toast({
            title: "Empty File",
            description: "The file contains no valid text to analyze",
            variant: "destructive",
          });
          return;
        }

        if (lines.length > 100) {
          toast({
            title: "Too Many Lines",
            description: "Maximum 100 lines per file. Please split your data into smaller files.",
            variant: "destructive",
          });
          return;
        }

        const parsed: ParsedText[] = lines.map((line, index) => ({
          id: `line_${index}`,
          text: line.trim(),
          lineNumber: index + 1,
        }));

        setParsedTexts(parsed);
        setColumnMapping(null);
        setUploadProgress(100);

        toast({
          title: "File Parsed Successfully",
          description: `Found ${parsed.length} texts to analyze`,
        });
      }

    } catch (error) {
      console.error("Error parsing file:", error);
      toast({
        title: "Error Parsing File",
        description: "Could not read the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!parsedTexts.length) {
      toast({ title: "No Texts to Analyze", description: "Please upload a file first", variant: "destructive" });
      return;
    }

    if (currentUsage + parsedTexts.length > usageLimit) {
      toast({ title: "Usage Limit Exceeded", description: `This analysis would use ${parsedTexts.length} API calls, but you only have ${usageLimit - currentUsage} remaining.`, variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const texts = parsedTexts.map(item => item.metrics ? { text: item.text, metrics: item.metrics } : item.text);

      const initialResponse = await fetch("/api/sentiment/batch-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      });

      if (!initialResponse.ok) {
        const error = await initialResponse.json();
        throw new Error(error.error || "Failed to start batch analysis");
      }

      const { jobId: newJobId } = await initialResponse.json();
      setJobId(newJobId);

      const poll = async (jobIdToPoll: string) => {
        const statusResponse = await fetch(`/api/sentiment/batch-status/${jobIdToPoll}`);
        if (!statusResponse.ok) {
          throw new Error('Failed to get job status');
        }

        const statusData = await statusResponse.json();
        setAnalysisProgress(statusData.progress || 0);

        if (statusData.status === 'completed') {
          toast({ title: "Batch Analysis Complete", description: `Successfully analyzed ${statusData.results.filter((r: SentimentResult) => !r.error).length} texts` });
          onAnalysisComplete({ results: statusData.results, summary: statusData.summary });
          setIsAnalyzing(false);
          setJobId(null);
        } else if (statusData.status === 'failed') {
          throw new Error(statusData.error || 'Analysis job failed');
        } else {
          setTimeout(() => poll(jobIdToPoll), 2000);
        }
      };

      setTimeout(() => poll(newJobId), 1000);

    } catch (error) {
      console.error("Batch analysis error:", error);
      toast({ title: "Analysis Failed", description: error instanceof Error ? error.message : "An error occurred", variant: "destructive" });
      setIsAnalyzing(false);
      setJobId(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedTexts([]);
    setUploadProgress(0);
    setAnalysisProgress(0);
    setColumnMapping(null);
    setCsvValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="w-8 h-8 text-gray-400" />;
    return <FileText className="w-8 h-8 text-blue-600" />;
  };

  const getFileStatus = () => {
    if (isUploading) return "Uploading...";
    if (isAnalyzing) return "Analyzing...";
    if (parsedTexts.length > 0) return "Ready to analyze";
    return "No file selected";
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-600" />
          Batch Analysis
        </CardTitle>
        <CardDescription>
          Upload CSV or TXT files to analyze multiple texts at once
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading || isAnalyzing}
            />
            
            <div className="space-y-4">
              {getFileIcon()}
              
              <div>
                <p className="text-sm text-gray-600">
                  {file ? file.name : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  CSV or TXT files up to 5MB, max 100 lines
                </p>
              </div>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isAnalyzing}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Parsing file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* File Info */}
          {file && parsedTexts.length > 0 && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <Badge variant="secondary">{parsedTexts.length} texts</Badge>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>File size: {(file.size / 1024).toFixed(1)} KB</p>
                <p>Texts to analyze: {parsedTexts.length}</p>
                <p>Estimated API calls: {parsedTexts.length}</p>
              </div>

              {/* Column Mapping Info for CSV files */}
              {columnMapping && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Detected Columns</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(columnMapping).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-blue-700">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-blue-600 font-mono">Column {value as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CSV Validation Warnings */}
              {csvValidation && csvValidation.warnings.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">CSV Warnings</span>
                  </div>
                  <div className="text-xs text-amber-700">
                    {csvValidation.warnings.map((warning, index) => (
                      <p key={index}>• {warning}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Usage Warning */}
              {currentUsage + parsedTexts.length > usageLimit && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800 font-medium">
                    ❌ This analysis would exceed your usage limit. Please upgrade your plan.
                  </span>
                </div>
              )}
              {currentUsage + parsedTexts.length > usageLimit * 0.95 && currentUsage + parsedTexts.length <= usageLimit && (
                <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-800 font-medium">
                    ⚠️ Critical: This will use most of your remaining API calls. Consider upgrading.
                  </span>
                </div>
              )}
              {currentUsage + parsedTexts.length > usageLimit * 0.8 && currentUsage + parsedTexts.length <= usageLimit * 0.95 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    ⚠️ This will use {parsedTexts.length} of your remaining {usageLimit - currentUsage} API calls
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleAnalyze}
            disabled={
              !parsedTexts.length ||
              isAnalyzing ||
              isUploading ||
              currentUsage + parsedTexts.length > usageLimit
            }
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze All Texts"
            )}
          </Button>

          {file && (
            <Button
              onClick={handleClear}
              variant="outline"
              disabled={isAnalyzing || isUploading}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analyzing texts...</span>
              <span>{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 