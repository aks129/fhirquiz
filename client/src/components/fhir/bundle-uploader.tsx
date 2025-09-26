import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { uploadBundle } from "@/lib/fhir";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Cache for preloaded sample data
let preloadedSyntheaData: any = null;
let preloadedCarl856Data: any = null;
let isPreloading = false;

interface BundleUploaderProps {
  fhirServerUrl?: string;
  onUploadSuccess?: (result: any) => void;
}

export default function BundleUploader({ fhirServerUrl, onUploadSuccess }: BundleUploaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Debug: Log the fhirServerUrl prop
  console.log('BundleUploader fhirServerUrl:', fhirServerUrl);

  // Preload sample data when component mounts
  useEffect(() => {
    const preloadSampleData = async () => {
      if ((preloadedSyntheaData && preloadedCarl856Data) || isPreloading) return;
      
      isPreloading = true;
      try {
        console.log('🔄 Preloading sample data...');
        
        // Load both sample files
        const [syntheaResponse, carl856Response] = await Promise.all([
          fetch("/data/synthea_patient_small.json"),
          fetch("/data/carl856_sample_patient.json")
        ]);
        
        preloadedSyntheaData = await syntheaResponse.json();
        preloadedCarl856Data = await carl856Response.json();
        
        console.log('✅ Sample data preloaded successfully');
      } catch (error) {
        console.error('❌ Failed to preload sample data:', error);
      } finally {
        isPreloading = false;
      }
    };

    preloadSampleData();
  }, []);

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

  const handleLoadSampleData = async (sampleType: 'synthea' | 'carl856') => {
    try {
      let bundle;
      let fileName;
      
      if (sampleType === 'synthea') {
        if (preloadedSyntheaData) {
          console.log('📦 Using preloaded Synthea data');
          bundle = preloadedSyntheaData;
        } else {
          console.log('🔄 Fetching Synthea data (preload not available)');
          const response = await fetch("/data/synthea_patient_small.json");
          bundle = await response.json();
        }
        fileName = "synthea_patient_small.json";
      } else {
        if (preloadedCarl856Data) {
          console.log('📦 Using preloaded Carl856 data');
          bundle = preloadedCarl856Data;
        } else {
          console.log('🔄 Fetching Carl856 data (preload not available)');
          const response = await fetch("/data/carl856_sample_patient.json");
          bundle = await response.json();
        }
        fileName = "carl856_sample_patient.json";
      }
      
      uploadMutation.mutate({ bundle, fileName });
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

        <div className="space-y-3">
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending || !fhirServerUrl}
            className="w-full"
            data-testid="button-upload-bundle"
          >
            <i className="fas fa-upload mr-2"></i>
            {uploadMutation.isPending ? "Uploading..." : "Upload Custom Bundle"}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            OR choose a sample patient:
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={() => handleLoadSampleData('synthea')}
              variant="outline"
              disabled={uploadMutation.isPending || !fhirServerUrl}
              data-testid="button-load-synthea-sample"
              className="justify-start text-left"
              title={!fhirServerUrl ? "Please select and test a FHIR server connection first" : "Load basic synthetic patient data"}
            >
              <div className="flex items-center w-full">
                <i className="fas fa-user mr-3 text-blue-500"></i>
                <div className="flex-1">
                  <div className="font-medium">John Smith (Basic Sample)</div>
                  <div className="text-xs text-muted-foreground">Simple patient with basic encounter data</div>
                </div>
                {preloadedSyntheaData && <i className="fas fa-check text-green-500 ml-2"></i>}
              </div>
            </Button>
            
            <Button 
              onClick={() => handleLoadSampleData('carl856')}
              variant="outline"
              disabled={uploadMutation.isPending || !fhirServerUrl}
              data-testid="button-load-carl856-sample"
              className="justify-start text-left"
              title={!fhirServerUrl ? "Please select and test a FHIR server connection first" : "Load comprehensive patient with complex medical history"}
            >
              <div className="flex items-center w-full">
                <i className="fas fa-user-md mr-3 text-purple-500"></i>
                <div className="flex-1">
                  <div className="font-medium">Carl856 Powlowski563 (Comprehensive)</div>
                  <div className="text-xs text-muted-foreground">Complex patient with conditions, medications, and care team</div>
                </div>
                {preloadedCarl856Data && <i className="fas fa-check text-green-500 ml-2"></i>}
              </div>
            </Button>
          </div>
          
          {isPreloading && (
            <div className="text-center text-sm text-muted-foreground">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Loading sample data...
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <i className="fas fa-lightbulb text-blue-600 mt-0.5"></i>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">Sample Patient Learning Guide</h4>
              <div className="space-y-2 text-sm text-blue-800">
                <div>• <strong>Basic Sample</strong>: Start here to learn FHIR Patient and Encounter basics</div>
                <div>• <strong>Comprehensive Sample</strong>: Explore complex relationships between Patient, Conditions, Medications, and CareTeam</div>
                <div>• Upload succeeds? Check the <strong>Resource Stats</strong> to see what was created!</div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200">
                <span className="text-blue-700 font-medium">Need more data? </span>
                <a 
                  href="https://synthetichealth.github.io/synthea/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  data-testid="link-synthea-download"
                >
                  Generate your own at Synthea →
                </a>
              </div>
            </div>
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
