import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FhirServer, LabProgress, Artifact } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LabStep from "@/components/lab/lab-step";
import { publishObservation } from "@/lib/fhir";
import { getSelectedServer, getSelectedPatient } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export default function Day3Lab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [observationData, setObservationData] = useState({
    code: "72133-2",
    display: "Risk Assessment Score",
    value: 75,
    unit: "score",
  });
  
  const [publishedObservation, setPublishedObservation] = useState<any>(null);

  const { data: progress = [] } = useQuery<LabProgress[]>({
    queryKey: ["/api/lab/progress"],
  });

  const { data: servers = [] } = useQuery<FhirServer[]>({
    queryKey: ["/api/fhir/servers"],
  });

  const { data: artifacts = [] } = useQuery<Artifact[]>({
    queryKey: ["/api/artifacts"],
  });

  const publishMutation = useMutation({
    mutationFn: async (data: any) => {
      const selectedServerId = getSelectedServer();
      const selectedServer = servers.find((s: FhirServer) => s.id === selectedServerId);
      const patientId = getSelectedPatient();
      
      if (!selectedServer || !patientId) {
        throw new Error("Missing server or patient selection");
      }

      return publishObservation({
        ...data,
        patientId,
        fhirServerUrl: selectedServer.baseUrl,
      });
    },
    onSuccess: (result) => {
      setPublishedObservation(result);
      toast({
        title: "Observation Published",
        description: `Successfully created observation ${result.resourceId}`,
      });
      
      // Update lab progress
      fetch("/api/lab/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": localStorage.getItem('fhir-bootcamp-session') || '',
        },
        body: JSON.stringify({
          labDay: 3,
          stepName: "observation_create",
          completed: true,
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/lab/progress"] });
    },
    onError: (error) => {
      toast({
        title: "Publication Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const isStepCompleted = (stepName: string) => {
    return progress.some((p: any) => p.stepName === stepName && p.completed && p.labDay === 3);
  };

  const riskScoreArtifacts = artifacts.filter((a: any) => 
    a.artifactType === 'transform_result' && a.labDay === 2
  );

  const handlePublishObservation = () => {
    publishMutation.mutate(observationData);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Day 3 Lab: Operationalize</h1>
          <p className="text-lg text-muted-foreground">Map insights to FHIR Observations and publish back to your server</p>
        </div>
        <Button variant="outline" size="sm" data-testid="button-reset-day3">
          <i className="fas fa-redo mr-2"></i>
          Reset Lab
        </Button>
      </div>

      {/* Prerequisites Check */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <i className="fas fa-clipboard-check text-purple-600"></i>
            <span>Prerequisites</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <i className={`fas ${riskScoreArtifacts.length > 0 ? "fa-check-circle text-green-500" : "fa-times-circle text-red-500"}`}></i>
              <span className="text-sm">Day 2 risk score calculations completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className={`fas ${getSelectedServer() ? "fa-check-circle text-green-500" : "fa-times-circle text-red-500"}`}></i>
              <span className="text-sm">FHIR server selected and connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <i className={`fas ${getSelectedPatient() ? "fa-check-circle text-green-500" : "fa-times-circle text-red-500"}`}></i>
              <span className="text-sm">Patient data available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Create Observation */}
      <LabStep
        stepNumber={1}
        title="Create FHIR Observation"
        description="Map your computed risk scores to a valid FHIR Observation resource with proper CodeableConcept structure."
        status={isStepCompleted("observation_create") ? "complete" : "in-progress"}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-file-medical text-primary"></i>
                <span>Observation Builder</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="obs-code">LOINC Code</Label>
                  <Select 
                    value={observationData.code} 
                    onValueChange={(value) => setObservationData({...observationData, code: value})}
                  >
                    <SelectTrigger data-testid="select-loinc-code">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="72133-2">Risk Assessment Score</SelectItem>
                      <SelectItem value="89247-1">Healthcare Risk Factor</SelectItem>
                      <SelectItem value="75491-0">Risk Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="obs-display">Display Text</Label>
                  <Input
                    id="obs-display"
                    value={observationData.display}
                    onChange={(e) => setObservationData({...observationData, display: e.target.value})}
                    data-testid="input-display-text"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="obs-value">Risk Score Value</Label>
                  <Input
                    id="obs-value"
                    type="number"
                    value={observationData.value}
                    onChange={(e) => setObservationData({...observationData, value: parseInt(e.target.value)})}
                    data-testid="input-risk-value"
                  />
                </div>
                <div>
                  <Label htmlFor="obs-unit">Unit</Label>
                  <Input
                    id="obs-unit"
                    value={observationData.unit}
                    onChange={(e) => setObservationData({...observationData, unit: e.target.value})}
                    data-testid="input-unit"
                  />
                </div>
              </div>

              <Button 
                onClick={handlePublishObservation}
                disabled={publishMutation.isPending}
                className="w-full bg-purple-500 hover:bg-purple-600"
                data-testid="button-publish-observation"
              >
                <i className="fas fa-share-alt mr-2"></i>
                {publishMutation.isPending ? "Publishing..." : "Publish Observation"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FHIR Resource Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-auto max-h-80">
                <pre className="text-foreground">
{JSON.stringify({
  resourceType: "Observation",
  status: "final",
  code: {
    coding: [{
      system: "http://loinc.org",
      code: observationData.code,
      display: observationData.display,
    }],
    text: observationData.display,
  },
  subject: {
    reference: `Patient/${getSelectedPatient() || 'patient-id'}`,
  },
  valueQuantity: {
    value: observationData.value,
    unit: observationData.unit,
    system: "http://unitsofmeasure.org",
    code: observationData.unit,
  },
  effectiveDateTime: new Date().toISOString(),
}, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </LabStep>

      {/* Step 2: Validate & Link */}
      <LabStep
        stepNumber={2}
        title="Resource Validation & Linking"
        description="Ensure your published observation is properly linked and validates against FHIR R4 specification."
        status={publishedObservation ? "complete" : "pending"}
      >
        {publishedObservation ? (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-800">
                <i className="fas fa-check-circle text-green-600"></i>
                <span>Observation Successfully Published</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-green-700">Resource ID</Label>
                    <div className="bg-white border border-green-200 rounded p-2 font-mono text-sm">
                      {publishedObservation.resourceId}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-green-700">Resource URL</Label>
                    <div className="bg-white border border-green-200 rounded p-2">
                      <a 
                        href={publishedObservation.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                        data-testid="link-published-observation"
                      >
                        {publishedObservation.resourceUrl}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">What Just Happened?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
                    <div>
                      <strong>CodeableConcept:</strong> Used LOINC code {observationData.code} for standardized risk assessment terminology
                    </div>
                    <div>
                      <strong>Patient Reference:</strong> Linked observation to Patient/{getSelectedPatient()} for data continuity
                    </div>
                    <div>
                      <strong>Value Quantity:</strong> Structured numeric risk score with appropriate units for computation
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="opacity-60">
            <CardContent className="p-6 text-center">
              <i className="fas fa-arrow-up text-4xl text-gray-400 mb-4"></i>
              <p className="text-muted-foreground">Complete Step 1 to validate your published observation</p>
            </CardContent>
          </Card>
        )}
      </LabStep>

      {/* CodeableConcept Deep Dive */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <i className="fas fa-tags text-orange-600"></i>
            <span>CodeableConcept in Practice</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 mb-4">
            In this lab, you've used CodeableConcepts to create interoperable observations. This enables your risk scores 
            to be understood by any FHIR-compliant system worldwide.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-orange-200 rounded-lg p-3">
              <h4 className="font-medium text-orange-800 mb-2">System Interoperability</h4>
              <p className="text-xs text-orange-700">
                LOINC codes like {observationData.code} are recognized globally, ensuring your risk assessments 
                can be consumed by EMRs, analytics platforms, and research systems.
              </p>
            </div>
            <div className="bg-white border border-orange-200 rounded-lg p-3">
              <h4 className="font-medium text-orange-800 mb-2">Clinical Decision Support</h4>
              <p className="text-xs text-orange-700">
                Structured observations with proper codes enable clinical decision support systems 
                to automatically trigger alerts, care plans, and quality measures.
              </p>
            </div>
          </div>

          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
            <p className="text-xs text-orange-800">
              <strong>Learn more about CodeableConcepts:</strong> 
              <a 
                href="https://darrendevitt.com/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline ml-1"
                data-testid="link-codeable-concepts-expert"
              >
                Darren Devitt's expert guidance on FHIR terminology →
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Completion Status */}
      {publishedObservation && (
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">🎉 Day 3 Complete!</h3>
            <p className="text-sm text-purple-700 mb-4">
              You've successfully completed the FHIR Healthcare Bootcamp! You've ingested data, 
              transformed it with analytics, and published insights back to a FHIR server.
            </p>
            <Button className="bg-purple-500 hover:bg-purple-600" data-testid="button-view-gallery">
              <i className="fas fa-trophy mr-2"></i>
              View Results Gallery
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
