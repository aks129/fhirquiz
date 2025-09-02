import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { uploadBundle } from "@/lib/fhir";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface BundleUploaderProps {
  fhirServerUrl?: string;
  onUploadSuccess?: (result: any) => void;
}

export default function BundleUploader({ fhirServerUrl, onUploadSuccess }: BundleUploaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async ({ bundle, fileName }: { bundle: any; fileName: string }) => {
      if (!fhirServerUrl) {
        throw new Error("No FHIR server selected");
      }
      return uploadBundle(bundle, fhirServerUrl, fileName);
    },
    onSuccess: (result) => {
      toast({
        title: "Bundle Uploaded Successfully",
        description: `Created ${result.resourcesCreated} resources`,
      });
      
      // Update lab progress
      fetch("/api/lab/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": localStorage.getItem('fhir-bootcamp-session') || '',
        },
        body: JSON.stringify({
          labDay: 1,
          stepName: "bundle_upload",
          completed: true,
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/lab/progress"] });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFile(file || null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileContent = await selectedFile.text();
      const bundle = JSON.parse(fileContent);
      
      if (bundle.resourceType !== "Bundle") {
        throw new Error("File is not a valid FHIR Bundle");
      }

      uploadMutation.mutate({ bundle, fileName: selectedFile.name });
    } catch (error) {
      toast({
        title: "File Error",
        description: "Invalid JSON or not a FHIR Bundle",
        variant: "destructive",
      });
    }
  };

  const handleLoadSampleData = async () => {
    try {
      const response = await fetch("/data/synthea_patient_small.json");
      const bundle = await response.json();
      uploadMutation.mutate({ bundle, fileName: "synthea_patient_small.json" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sample data",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <i className="fas fa-upload text-primary"></i>
          <span>Upload Synthea Bundle</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="bundle-file">Select Bundle File (JSON)</Label>
          <Input
            id="bundle-file"
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            data-testid="input-bundle-file"
          />
        </div>

        <div className="flex space-x-3">
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending || !fhirServerUrl}
            className="flex-1"
            data-testid="button-upload-bundle"
          >
            <i className="fas fa-upload mr-2"></i>
            {uploadMutation.isPending ? "Uploading..." : "Upload Bundle"}
          </Button>
          
          <Button 
            onClick={handleLoadSampleData}
            variant="outline"
            disabled={uploadMutation.isPending || !fhirServerUrl}
            data-testid="button-load-sample"
          >
            Load Sample
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 p-3 rounded">
            <span className="text-gray-600">Sample data available:</span>
            <div className="text-primary text-xs mt-1">1 synthetic patient with full medical history</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <span className="text-gray-600">Need more data?</span>
            <a 
              href="https://synthetichealth.github.io/synthea/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs block mt-1"
              data-testid="link-synthea-download"
            >
              Download from Synthea →
            </a>
          </div>
        </div>

        {!fhirServerUrl && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle text-amber-600"></i>
              <span className="text-sm text-amber-700">Please select and test a FHIR server connection first</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
