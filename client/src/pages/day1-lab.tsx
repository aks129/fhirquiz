import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FhirServer, LabProgress } from "@/types/api";
import ServerSelector from "@/components/fhir/server-selector";
import BundleUploader from "@/components/fhir/bundle-uploader";
import ResourceStats from "@/components/fhir/resource-stats";
import LabStep from "@/components/lab/lab-step";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportResourcesCsv } from "@/lib/fhir";
import { getSelectedServer, getSelectedPatient, setSelectedPatient } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export default function Day1Lab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedServer, setSelectedServerState] = useState<any>(null);
  const [bundleUploaded, setBundleUploaded] = useState(false);
  const [patientId, setPatientId] = useState(getSelectedPatient() || "");

  const { data: servers = [] } = useQuery<FhirServer[]>({
    queryKey: ["/api/fhir/servers"],
  });

  const { data: progress = [] } = useQuery<LabProgress[]>({
    queryKey: ["/api/lab/progress"],
  });

  useEffect(() => {
    const selectedServerId = getSelectedServer();
    if (selectedServerId) {
      const server = servers.find((s: FhirServer) => s.id === selectedServerId);
      setSelectedServerState(server);
    }
  }, [servers]);

  const isStepCompleted = (stepName: string) => {
    return progress.some((p: LabProgress) => p.stepName === stepName && p.completed && p.labDay === 1);
  };

  const exportMutation = useMutation({
    mutationFn: async (resourceType: string) => {
      if (!selectedServer?.baseUrl || !patientId) {
        throw new Error("Missing server or patient information");
      }
      return exportResourcesCsv(selectedServer.baseUrl, patientId, resourceType);
    },
    onSuccess: (result, resourceType) => {
      toast({
        title: "Export Successful",
        description: `Exported ${result.recordCount} ${resourceType} records`,
      });
      
      // Mark CSV export as complete
      fetch("/api/lab/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": localStorage.getItem('fhir-bootcamp-session') || '',
        },
        body: JSON.stringify({
          labDay: 1,
          stepName: "csv_export",
          completed: true,
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/lab/progress"] });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleBundleUploadSuccess = (result: any) => {
    setBundleUploaded(true);
    // Extract patient ID from first resource if available
    if (result.resourceIds?.length > 0) {
      const firstPatientId = result.resourceIds[0];
      setPatientId(firstPatientId);
      setSelectedPatient(firstPatientId);
    }
  };

  const serverSetupCompleted = isStepCompleted("server_setup");
  const bundleUploadCompleted = isStepCompleted("bundle_upload");
  const csvExportCompleted = isStepCompleted("csv_export");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Day 1 Lab: Ingest & Land</h1>
          <p className="text-lg text-muted-foreground">Choose a FHIR server, load Synthea bundles, and export data for analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" data-testid="button-reset-day1">
            <i className="fas fa-redo mr-2"></i>
            Reset Lab
          </Button>
        </div>
      </div>

      {/* Step 1: Server Setup */}
      <LabStep
        stepNumber={1}
        title="Choose FHIR Server"
        description="Select a public FHIR test server for safe experimentation with synthetic data."
        status={serverSetupCompleted ? "complete" : selectedServer ? "in-progress" : "pending"}
      >
        <ServerSelector onServerChange={setSelectedServerState} />
      </LabStep>

      {/* Step 2: Bundle Upload */}
      <LabStep
        stepNumber={2}
        title="Load Synthea Bundle"
        description="Upload a synthetic patient bundle to populate your FHIR server with realistic test data."
        status={bundleUploadCompleted ? "complete" : bundleUploaded ? "in-progress" : "pending"}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BundleUploader 
            fhirServerUrl={selectedServer?.baseUrl}
            onUploadSuccess={handleBundleUploadSuccess}
          />
          <ResourceStats 
            fhirServerUrl={selectedServer?.baseUrl}
            patientId={patientId}
          />
        </div>
      </LabStep>

      {/* Step 3: Export Data */}
      <LabStep
        stepNumber={3}
        title="Export & Analyze Data"
        description="Export denormalized CSV files for analysis and transformation in Day 2."
        status={csvExportCompleted ? "complete" : "pending"}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-download text-primary"></i>
              <span>Data Export</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Export denormalized CSV files for analysis and transformation in Day 2 labs.</p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => exportMutation.mutate("Patient")}
                disabled={exportMutation.isPending || !bundleUploadCompleted}
                className="w-full flex items-center justify-between p-3 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100"
                data-testid="button-export-patients"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-users"></i>
                  <span className="font-medium">Export Patients CSV</span>
                </div>
                <i className="fas fa-download"></i>
              </Button>
              
              <Button 
                onClick={() => exportMutation.mutate("Encounter")}
                disabled={exportMutation.isPending || !bundleUploadCompleted}
                className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100"
                data-testid="button-export-encounters"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-hospital"></i>
                  <span className="font-medium">Export Encounters CSV</span>
                </div>
                <i className="fas fa-download"></i>
              </Button>
              
              <Button 
                onClick={() => exportMutation.mutate("Observation")}
                disabled={exportMutation.isPending || !bundleUploadCompleted}
                className="w-full flex items-center justify-between p-3 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100"
                data-testid="button-export-observations"
              >
                <div className="flex items-center space-x-3">
                  <i className="fas fa-microscope"></i>
                  <span className="font-medium">Export Observations CSV</span>
                </div>
                <i className="fas fa-download"></i>
              </Button>
            </div>
            
            {!bundleUploadCompleted && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">Complete Step 2 (bundle upload) to unlock data export functionality</p>
              </div>
            )}

            {bundleUploadCompleted && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <i className="fas fa-lightbulb text-amber-500 mt-0.5"></i>
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Pro Tip</p>
                    <p className="text-xs text-amber-600">These CSV exports will be used in Day 2 for SQL-based risk analysis and readmission calculations.</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </LabStep>

      {/* Next Steps */}
      {csvExportCompleted && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 Day 1 Complete!</h3>
            <p className="text-sm text-green-700 mb-4">You've successfully loaded FHIR data and exported it for analysis.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.location.href = "/quiz/day1"}
                className="bg-blue-600 hover:bg-blue-700" 
                data-testid="button-take-day1-quiz"
              >
                <i className="fas fa-graduation-cap mr-2"></i>
                Take Day 1 Quiz
              </Button>
              <Button 
                onClick={() => window.location.href = "/lab/day2"}
                className="bg-amber-500 hover:bg-amber-600" 
                data-testid="button-proceed-day2"
              >
                <i className="fas fa-arrow-right mr-2"></i>
                Proceed to Day 2
              </Button>
            </div>
            <p className="text-xs text-green-600 mt-3">Complete the Day 1 quiz to unlock Day 2!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
