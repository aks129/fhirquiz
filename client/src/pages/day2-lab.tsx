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
    
    if (csvArtifacts.length === 0) {
      toast({
        title: "Missing CSV Data",
        description: "Complete Day 1 CSV exports first. You need Patient, Encounter, and Observation data.",
        variant: "destructive",
      });
      return;
    }
    
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
        description="Transform flat CSV exports from Day 1 into structured staging tables optimized for healthcare analytics."
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
            {/* Prerequisites Check */}
            {artifacts.filter((a: any) => a.artifactType === 'csv_export').length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <i className="fas fa-exclamation-triangle text-amber-600 mt-0.5"></i>
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">Day 1 Prerequisites Required</h4>
                    <p className="text-sm text-amber-700">Complete Day 1 CSV exports (Patients, Encounters, Observations) before proceeding with transformations.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <i className="fas fa-lightbulb text-blue-600 mt-0.5"></i>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-800 mb-2">🎯 Healthcare Analytics Concept: Staging Tables</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>📊 <strong>Purpose:</strong> Convert denormalized CSV exports into normalized, queryable staging tables</p>
                    <p>🔧 <strong>Data Types:</strong> Parse string dates into proper TIMESTAMP columns for time-based analytics</p>
                    <p>🎯 <strong>Healthcare Focus:</strong> Enable downstream risk modeling and population health queries</p>
                  </div>
                </div>
              </div>
            </div>
            
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
              onClick={() => {
                setSelectedTransform("staging");
                handleRunTransform();
              }}
              className="w-full"
              disabled={transformMutation.isPending || artifacts.filter((a: any) => a.artifactType === 'csv_export').length === 0}
              data-testid="button-run-staging"
            >
              <i className="fas fa-play mr-2"></i>
              {transformMutation.isPending ? "Creating Tables..." : "Create Staging Tables"}
            </Button>
          </CardContent>
        </Card>
      </LabStep>

      {/* Step 2: Risk Score Calculation */}
      <LabStep
        stepNumber={2}
        title="Compute Risk Scores"
        description="Build a clinical risk stratification model using evidence-based condition codes and weighted scoring algorithms."
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
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <i className="fas fa-heartbeat text-purple-600 mt-0.5"></i>
                <div className="flex-1">
                  <h4 className="font-medium text-purple-800 mb-2">🎯 Healthcare Analytics Focus: Clinical Risk Stratification</h4>
                  <div className="space-y-2 text-sm text-purple-700">
                    <p>📋 <strong>Risk Factors:</strong> Diabetes (E11.9), Hypertension (I10), Smoking History (Z87.891)</p>
                    <p>⚖️ <strong>Evidence-Based Weights:</strong> Smoking (15pts), Diabetes (10pts), Hypertension (8pts)</p>
                    <p>📊 <strong>Stratification:</strong> LOW (&lt;10), MEDIUM (10-20), HIGH (&gt;20) risk categories</p>
                    <p>🏥 <strong>Real-World Use:</strong> Population health management, care gap identification, intervention targeting</p>
                  </div>
                </div>
              </div>
            </div>
            
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
              disabled={transformMutation.isPending || !isStepCompleted("staging_tables")}
              data-testid="button-run-risk-score"
            >
              <i className="fas fa-play mr-2"></i>
              {transformMutation.isPending ? "Computing..." : "Compute Risk Scores"}
            </Button>
            {!isStepCompleted("staging_tables") && (
              <p className="text-xs text-muted-foreground">Complete Step 1 (staging tables) first</p>
            )}
          </CardContent>
        </Card>
      </LabStep>

      {/* Step 3: Readmission Analysis */}
      <LabStep
        stepNumber={3}
        title="Readmission Analysis"
        description="Implement CMS-standard 30-day readmission tracking using temporal encounter analysis for quality measure reporting."
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <i className="fas fa-hospital text-green-600 mt-0.5"></i>
                <div className="flex-1">
                  <h4 className="font-medium text-green-800 mb-2">🎯 Healthcare Quality Focus: 30-Day Readmissions</h4>
                  <div className="space-y-2 text-sm text-green-700">
                    <p>📊 <strong>CMS Quality Measure:</strong> Tracks unplanned readmissions within 30 days of discharge</p>
                    <p>💰 <strong>Financial Impact:</strong> Hospitals face penalties for high readmission rates (HRRP)</p>
                    <p>🔍 <strong>SQL Approach:</strong> Self-join encounters by patient, calculate day differences between discharge/admit</p>
                    <p>📈 <strong>Analytics Value:</strong> Identify high-risk patients for care coordination and intervention programs</p>
                  </div>
                </div>
              </div>
            </div>
            
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
              disabled={transformMutation.isPending || !isStepCompleted("staging_tables")}
              data-testid="button-run-readmission"
            >
              <i className="fas fa-play mr-2"></i>
              {transformMutation.isPending ? "Analyzing..." : "Analyze Readmissions"}
            </Button>
            {!isStepCompleted("staging_tables") && (
              <p className="text-xs text-muted-foreground">Complete Step 1 (staging tables) first</p>
            )}
          </CardContent>
        </Card>
      </LabStep>

      {/* Next Steps & Educational Summary */}
      {(isStepCompleted("staging_tables") && isStepCompleted("risk_calculation") && isStepCompleted("readmission_flag")) && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 Day 2 Complete!</h3>
            <p className="text-sm text-green-700 mb-4">You've successfully transformed FHIR data into analytical insights ready for operationalization.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => window.location.href = "/quiz/day2"}
                className="bg-blue-600 hover:bg-blue-700" 
                data-testid="button-take-day2-quiz"
              >
                <i className="fas fa-graduation-cap mr-2"></i>
                Take Day 2 Quiz
              </Button>
              <Button 
                onClick={() => window.location.href = "/lab/day3"}
                className="bg-amber-500 hover:bg-amber-600" 
                data-testid="button-proceed-day3"
              >
                <i className="fas fa-arrow-right mr-2"></i>
                Proceed to Day 3
              </Button>
            </div>
            <p className="text-xs text-green-600 mt-3">Complete the Day 2 quiz to unlock Day 3 Operationalization!</p>
          </CardContent>
        </Card>
      )}

      {/* CodeableConcept Explainer */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <i className="fas fa-tags text-orange-600"></i>
            <span>Understanding CodeableConcepts in Healthcare Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 mb-4">
            CodeableConcepts are the foundation of healthcare interoperability. They provide standardized codes (LOINC, SNOMED CT, ICD-10) 
            that enable precise clinical meanings and consistent analytics across different systems and organizations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white border border-orange-200 rounded-lg p-3">
              <h4 className="font-medium text-orange-800 mb-2">LOINC (Lab Results)</h4>
              <div className="font-mono text-xs text-orange-700">
                <div>"system": "http://loinc.org"</div>
                <div>"code": "85354-9"</div>
                <div>"display": "Blood pressure"</div>
              </div>
            </div>
            <div className="bg-white border border-orange-200 rounded-lg p-3">
              <h4 className="font-medium text-orange-800 mb-2">SNOMED CT (Clinical)</h4>
              <div className="font-mono text-xs text-orange-700">
                <div>"system": "http://snomed.info/sct"</div>
                <div>"code": "44054006"</div>
                <div>"display": "Diabetes mellitus type 2"</div>
              </div>
            </div>
            <div className="bg-white border border-orange-200 rounded-lg p-3">
              <h4 className="font-medium text-orange-800 mb-2">ICD-10 (Diagnoses)</h4>
              <div className="font-mono text-xs text-orange-700">
                <div>"system": "http://hl7.org/fhir/sid/icd-10-cm"</div>
                <div>"code": "E11.9"</div>
                <div>"display": "Type 2 diabetes without complications"</div>
              </div>
            </div>
          </div>

          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
            <p className="text-xs text-orange-800">
              <strong>Learn more about healthcare coding standards:</strong> 
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
