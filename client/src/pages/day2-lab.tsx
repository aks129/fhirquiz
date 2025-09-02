import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import LabStep from "@/components/lab/lab-step";
import AccessGate from "@/components/AccessGate";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LabProgress, Artifact } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function Day2Lab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTransform, setSelectedTransform] = useState("staging");

  const { data: progress = [] } = useQuery<LabProgress[]>({
    queryKey: ["/api/lab/progress"],
  });

  const { data: artifacts = [] } = useQuery<Artifact[]>({
    queryKey: ["/api/artifacts"],
  });

  const transformMutation = useMutation({
    mutationFn: async (transformData: any) => {
      const response = await fetch("/api/transforms/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": localStorage.getItem('fhir-bootcamp-session') || '',
        },
        body: JSON.stringify(transformData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Transform failed");
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Transform Complete",
        description: `Processed ${result.recordsProcessed} records`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/artifacts"] });
    },
    onError: (error) => {
      toast({
        title: "Transform Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const isStepCompleted = (stepName: string) => {
    return progress.some((p: LabProgress) => p.stepName === stepName && p.completed && p.labDay === 2);
  };

  const sqlTemplates = {
    staging: `-- Create staging tables from CSV exports
CREATE TABLE staging_patients AS
SELECT 
  id,
  name,
  gender,
  birth_date,
  CAST(birth_date AS DATE) as birth_date_parsed
FROM read_csv('patients_export.csv');

CREATE TABLE staging_encounters AS  
SELECT
  id,
  status,
  class,
  start_date,
  end_date,
  patient_reference,
  CAST(start_date AS TIMESTAMP) as start_timestamp,
  CAST(end_date AS TIMESTAMP) as end_timestamp
FROM read_csv('encounters_export.csv');`,

    readmission: `-- Derive 30-day readmission flag
WITH encounter_pairs AS (
  SELECT 
    e1.id as first_encounter,
    e2.id as second_encounter,
    e1.patient_reference,
    e1.end_timestamp as first_discharge,
    e2.start_timestamp as second_admission,
    DATEDIFF('day', e1.end_timestamp, e2.start_timestamp) as days_between
  FROM staging_encounters e1
  JOIN staging_encounters e2 
    ON e1.patient_reference = e2.patient_reference
    AND e1.end_timestamp < e2.start_timestamp
)
SELECT 
  first_encounter,
  patient_reference,
  CASE 
    WHEN days_between <= 30 THEN 1 
    ELSE 0 
  END as readmission_30d
FROM encounter_pairs;`,

    riskScore: `-- Compute risk score from observations
WITH risk_factors AS (
  SELECT 
    patient_reference,
    COUNT(CASE WHEN code LIKE '%diabetes%' THEN 1 END) * 10 as diabetes_score,
    COUNT(CASE WHEN code LIKE '%hypertension%' THEN 1 END) * 8 as hypertension_score,
    COUNT(CASE WHEN code LIKE '%smoking%' THEN 1 END) * 15 as smoking_score,
    COUNT(*) as total_observations
  FROM staging_observations 
  WHERE code IN ('E11.9', 'I10', 'Z87.891') -- Common risk factor codes
  GROUP BY patient_reference
)
SELECT 
  patient_reference,
  diabetes_score + hypertension_score + smoking_score as risk_score,
  CASE 
    WHEN diabetes_score + hypertension_score + smoking_score > 20 THEN 'HIGH'
    WHEN diabetes_score + hypertension_score + smoking_score > 10 THEN 'MEDIUM'
    ELSE 'LOW'
  END as risk_category
FROM risk_factors;`
  };

  const handleRunTransform = () => {
    const csvArtifacts = artifacts.filter((a: any) => a.artifactType === 'csv_export');
    
    transformMutation.mutate({
      transformType: selectedTransform,
      sqlQuery: sqlTemplates[selectedTransform as keyof typeof sqlTemplates],
      inputData: csvArtifacts,
    });
  };

  return (
    <AccessGate courseSlug="fhir-day2" courseName="Day 2: FHIR Data Transformation & Analytics">
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Day 2 Lab: Transform & Analyze</h1>
          <p className="text-lg text-muted-foreground">Process healthcare data using SQL transformations and compute risk metrics</p>
        </div>
        <Button variant="outline" size="sm" data-testid="button-reset-day2">
          <i className="fas fa-redo mr-2"></i>
          Reset Lab
        </Button>
      </div>

      {/* Step 1: Create Staging Tables */}
      <LabStep
        stepNumber={1}
        title="Create Staging Tables"
        description="Load your CSV exports into staging tables for transformation and analysis."
        status={isStepCompleted("staging_tables") ? "complete" : "in-progress"}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-database text-primary"></i>
              <span>SQL Staging Tables</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="staging-sql">Staging Table Creation SQL</Label>
              <Textarea
                id="staging-sql"
                value={sqlTemplates.staging}
                className="font-mono text-sm h-48"
                readOnly
                data-testid="textarea-staging-sql"
              />
            </div>
            <Button 
              onClick={() => setSelectedTransform("staging")}
              className="w-full"
              disabled={transformMutation.isPending}
              data-testid="button-run-staging"
            >
              <i className="fas fa-play mr-2"></i>
              Create Staging Tables
            </Button>
          </CardContent>
        </Card>
      </LabStep>

      {/* Step 2: Risk Score Calculation */}
      <LabStep
        stepNumber={2}
        title="Compute Risk Scores"
        description="Calculate patient risk scores based on condition codes and observation patterns."
        status={isStepCompleted("risk_calculation") ? "complete" : "pending"}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-calculator text-primary"></i>
              <span>Risk Score Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="risk-sql">Risk Score Calculation SQL</Label>
              <Textarea
                id="risk-sql"
                value={sqlTemplates.riskScore}
                className="font-mono text-sm h-48"
                readOnly
                data-testid="textarea-risk-sql"
              />
            </div>
            <Button 
              onClick={() => {
                setSelectedTransform("riskScore");
                handleRunTransform();
              }}
              className="w-full"
              disabled={transformMutation.isPending}
              data-testid="button-run-risk-score"
            >
              <i className="fas fa-play mr-2"></i>
              {transformMutation.isPending ? "Computing..." : "Compute Risk Scores"}
            </Button>
          </CardContent>
        </Card>
      </LabStep>

      {/* Step 3: Readmission Analysis */}
      <LabStep
        stepNumber={3}
        title="Readmission Analysis"
        description="Derive 30-day readmission flags using encounter timing analysis."
        status={isStepCompleted("readmission_flag") ? "complete" : "pending"}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-flag text-primary"></i>
              <span>Readmission Prediction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="readmission-sql">Readmission Flag SQL</Label>
              <Textarea
                id="readmission-sql"
                value={sqlTemplates.readmission}
                className="font-mono text-sm h-48"
                readOnly
                data-testid="textarea-readmission-sql"
              />
            </div>
            <Button 
              onClick={() => {
                setSelectedTransform("readmission");
                handleRunTransform();
              }}
              className="w-full"
              disabled={transformMutation.isPending}
              data-testid="button-run-readmission"
            >
              <i className="fas fa-play mr-2"></i>
              {transformMutation.isPending ? "Analyzing..." : "Analyze Readmissions"}
            </Button>
          </CardContent>
        </Card>
      </LabStep>

      {/* CodeableConcept Explainer */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <i className="fas fa-tags text-orange-600"></i>
            <span>Understanding CodeableConcepts in Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 mb-4">
            CodeableConcepts are the backbone of FHIR analytics. They provide standardized codes (LOINC, SNOMED CT) 
            that enable precise healthcare meanings across different systems and organizations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-orange-200 rounded-lg p-3">
              <h4 className="font-medium text-orange-800 mb-2">LOINC Example</h4>
              <div className="font-mono text-xs text-orange-700">
                <div>"system": "http://loinc.org"</div>
                <div>"code": "85354-9"</div>
                <div>"display": "Blood pressure"</div>
              </div>
            </div>
            <div className="bg-white border border-orange-200 rounded-lg p-3">
              <h4 className="font-medium text-orange-800 mb-2">SNOMED CT Example</h4>
              <div className="font-mono text-xs text-orange-700">
                <div>"system": "http://snomed.info/sct"</div>
                <div>"code": "44054006"</div>
                <div>"display": "Diabetes mellitus type 2"</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
            <p className="text-xs text-orange-800">
              <strong>Learn more:</strong> 
              <a 
                href="https://darrendevitt.com/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:underline ml-1"
                data-testid="link-codeable-concepts"
              >
                FHIR IQ's CodeableConcept deep-dive →
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </AccessGate>
  );
}
