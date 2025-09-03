import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Activity, Smartphone, CheckCircle, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ByodImportResult } from "@shared/schema";

interface ImportWizardProps {
  onComplete: (result: { sessionId: string; preview: any }) => void;
}

type ImportStep = "source" | "upload" | "preview" | "mapping";

export function ImportWizard({ onComplete }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>("source");
  const [sourceType, setSourceType] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ByodImportResult | null>(null);
  const [error, setError] = useState<string>("");

  const importMutation = useMutation({
    mutationFn: async (data: { sourceType: string; fileName: string; fileSize: number; rawData: any }) =>
      apiRequest("POST", "/api/byod/import", data),
    onSuccess: (result: ByodImportResult & { sessionId: string }) => {
      setImportResult(result);
      setCurrentStep("preview");
    },
    onError: (error: any) => {
      setError(error.message || "Failed to import health data");
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/csv': ['.csv'],
      'application/xml': ['.xml'],
      'text/xml': ['.xml']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const processFile = async (file: File) => {
    try {
      let rawData: any;
      const text = await file.text();
      
      if (file.name.endsWith('.json')) {
        rawData = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        rawData = parseCSV(text);
      } else if (file.name.endsWith('.xml')) {
        rawData = parseXML(text);
      } else {
        throw new Error("Unsupported file format");
      }

      importMutation.mutate({
        sourceType,
        fileName: file.name,
        fileSize: file.size,
        rawData
      });
    } catch (error: any) {
      setError(`Failed to process file: ${error.message}`);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    
    return data;
  };

  const parseXML = (text: string) => {
    // Simple XML parsing for Apple Health exports
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    
    // Extract records from Apple Health format
    const records = Array.from(doc.querySelectorAll('Record')).map(record => ({
      type: record.getAttribute('type'),
      value: record.getAttribute('value'),
      unit: record.getAttribute('unit'),
      startDate: record.getAttribute('startDate'),
      endDate: record.getAttribute('endDate'),
      sourceName: record.getAttribute('sourceName')
    }));
    
    return { HealthData: { Record: records } };
  };

  const getStepProgress = () => {
    const steps = ["source", "upload", "preview", "mapping"];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
  };

  const renderSourceSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Select Your Data Source
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${sourceType === 'apple-health' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSourceType('apple-health')}
            data-testid="source-apple-health"
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                📱
              </div>
              <h3 className="font-medium">Apple Health</h3>
              <p className="text-sm text-muted-foreground">Export from Health app</p>
              <Badge variant="secondary" className="mt-2">XML Format</Badge>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${sourceType === 'google-fit' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSourceType('google-fit')}
            data-testid="source-google-fit"
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                🏃
              </div>
              <h3 className="font-medium">Google Fit</h3>
              <p className="text-sm text-muted-foreground">Google Takeout export</p>
              <Badge variant="secondary" className="mt-2">JSON Format</Badge>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${sourceType === 'fitbit' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSourceType('fitbit')}
            data-testid="source-fitbit"
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                ⌚
              </div>
              <h3 className="font-medium">Fitbit</h3>
              <p className="text-sm text-muted-foreground">Data export from account</p>
              <Badge variant="secondary" className="mt-2">JSON Format</Badge>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${sourceType === 'csv' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSourceType('csv')}
            data-testid="source-csv"
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                📊
              </div>
              <h3 className="font-medium">CSV File</h3>
              <p className="text-sm text-muted-foreground">Custom data format</p>
              <Badge variant="secondary" className="mt-2">CSV Format</Badge>
            </CardContent>
          </Card>
        </div>

        {sourceType && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getSourceInstructions(sourceType)}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={() => setCurrentStep("upload")} 
          disabled={!sourceType}
          className="w-full"
          data-testid="button-next-to-upload"
        >
          Continue to Upload
        </Button>
      </CardContent>
    </Card>
  );

  const getSourceInstructions = (source: string) => {
    switch (source) {
      case 'apple-health':
        return "Export your data from iPhone Health app → Profile → Export All Health Data. This creates a ZIP file containing XML data.";
      case 'google-fit':
        return "Use Google Takeout to export your Fit data. Select 'Fit (JSON Format)' and download the archive.";
      case 'fitbit':
        return "Go to fitbit.com → Data Export → Request Data. You'll receive a ZIP file with JSON data.";
      case 'csv':
        return "Upload a CSV file with columns: date, metric/type, value, unit. The first row should contain headers.";
      default:
        return "";
    }
  };

  const renderFileUpload = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Your Health Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          data-testid="file-upload-zone"
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p>Drop your file here...</p>
          ) : (
            <div>
              <p className="mb-2">Drag & drop your health data file here</p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports: {getFileFormats(sourceType)}
              </p>
            </div>
          )}
        </div>

        {uploadedFile && (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg" data-testid="uploaded-file-info">
            <FileText className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep("source")}
            data-testid="button-back-to-source"
          >
            Back
          </Button>
          <Button 
            onClick={() => uploadedFile && processFile(uploadedFile)}
            disabled={!uploadedFile || importMutation.isPending}
            className="flex-1"
            data-testid="button-process-file"
          >
            {importMutation.isPending ? "Processing..." : "Process File"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const getFileFormats = (source: string) => {
    switch (source) {
      case 'apple-health': return 'XML files from Health app export';
      case 'google-fit': return 'JSON files from Google Takeout';
      case 'fitbit': return 'JSON files from Fitbit export';
      case 'csv': return 'CSV files with health metrics';
      default: return 'JSON, CSV, XML files';
    }
  };

  const renderPreview = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Data Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {importResult && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{importResult.recordCount}</div>
                  <div className="text-sm text-muted-foreground">Total Records</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{importResult.metrics.length}</div>
                  <div className="text-sm text-muted-foreground">Metric Types</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{sourceType}</div>
                  <div className="text-sm text-muted-foreground">Data Source</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detected Metrics</h3>
              {Object.entries(importResult.preview).map(([metric, data]: [string, any]) => (
                <Card key={metric}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{metric}</h4>
                        <p className="text-sm text-muted-foreground">
                          {data.count} records • {data.unit && `Unit: ${data.unit}`}
                        </p>
                      </div>
                      <Badge variant="outline">{data.count}</Badge>
                    </div>
                    <div className="text-sm">
                      <p className="mb-2">Sample values:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {data.sampleValues.slice(0, 3).map((sample: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                            <div className="font-medium">{sample.value} {sample.unit}</div>
                            <div className="text-muted-foreground">
                              {new Date(sample.date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep("upload")}
                data-testid="button-back-to-upload"
              >
                Back
              </Button>
              <Button 
                onClick={() => onComplete({ 
                  sessionId: (importResult as any).sessionId, 
                  preview: importResult.preview 
                })}
                className="flex-1"
                data-testid="button-complete-import"
              >
                Complete Import
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">Import Your Health Data</h1>
        <p className="text-muted-foreground">
          Bring your own data (BYOD) to create personalized health insights
        </p>
      </div>

      <div className="mb-6">
        <Progress value={getStepProgress()} className="w-full" />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>Select Source</span>
          <span>Upload Data</span>
          <span>Preview</span>
          <span>Complete</span>
        </div>
      </div>

      {currentStep === "source" && renderSourceSelection()}
      {currentStep === "upload" && renderFileUpload()}
      {currentStep === "preview" && renderPreview()}
    </div>
  );
}