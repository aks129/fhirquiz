import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFhirServerSchema, insertLabProgressSchema, insertBundleSchema, insertArtifactSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware for anonymous users
  app.use('/api', (req, res, next) => {
    if (!req.headers['x-session-id']) {
      req.headers['x-session-id'] = randomUUID();
    }
    next();
  });

  // FHIR Server endpoints
  app.get("/api/fhir/servers", async (req, res) => {
    try {
      const servers = await storage.getFhirServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch FHIR servers" });
    }
  });

  app.post("/api/fhir/servers", async (req, res) => {
    try {
      const server = insertFhirServerSchema.parse(req.body);
      const created = await storage.createFhirServer(server);
      res.json(created);
    } catch (error) {
      res.status(400).json({ error: "Invalid server data" });
    }
  });

  // FHIR connectivity testing
  app.post("/api/fhir/ping", async (req, res) => {
    try {
      const { baseUrl } = req.body;
      const start = Date.now();
      
      // Test basic connectivity
      const response = await fetch(`${baseUrl}/metadata`, {
        method: 'GET',
        headers: {
          'Accept': 'application/fhir+json',
        },
      });
      
      const responseTime = Date.now() - start;
      
      if (!response.ok) {
        return res.json({
          success: false,
          responseTime,
          error: `Server responded with ${response.status}`,
        });
      }

      const capabilities = await response.json();
      
      res.json({
        success: true,
        responseTime,
        fhirVersion: capabilities.fhirVersion || "Unknown",
        capabilities,
      });
    } catch (error) {
      res.json({
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  });

  // Bundle upload and processing
  app.post("/api/fhir/load-bundle", async (req, res) => {
    try {
      const { bundle, fhirServerUrl, fileName } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      
      // Post bundle to FHIR server
      const response = await fetch(fhirServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json',
        },
        body: JSON.stringify(bundle),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(400).json({
          success: false,
          error: `FHIR server error: ${response.status} - ${errorText}`,
        });
      }

      const result = await response.json();
      const resourceIds = result.entry?.map((e: any) => e.response?.location?.split('/').slice(-1)[0]).filter(Boolean) || [];
      
      // Store bundle record
      await storage.createBundle({
        sessionId,
        fileName,
        bundleType: bundle.type || "transaction",
        resourceCount: bundle.entry?.length || 0,
        fhirServerId: null, // We could map this if needed
        metadata: { resourceIds },
      });

      res.json({
        success: true,
        resourcesCreated: resourceIds.length,
        resourceIds,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  });

  // FHIR resource statistics
  app.post("/api/fhir/stats", async (req, res) => {
    try {
      const { fhirServerUrl, patientId } = req.body;
      
      const stats = {
        patients: 0,
        encounters: 0,
        observations: 0,
        lastUpdated: new Date().toISOString(),
      };

      // Count patients
      const patientResponse = await fetch(`${fhirServerUrl}/Patient?_summary=count`, {
        headers: { 'Accept': 'application/fhir+json' },
      });
      if (patientResponse.ok) {
        const patientData = await patientResponse.json();
        stats.patients = patientData.total || 0;
      }

      // Count encounters for specific patient if provided
      const encounterUrl = patientId 
        ? `${fhirServerUrl}/Encounter?patient=${patientId}&_summary=count`
        : `${fhirServerUrl}/Encounter?_summary=count`;
      
      const encounterResponse = await fetch(encounterUrl, {
        headers: { 'Accept': 'application/fhir+json' },
      });
      if (encounterResponse.ok) {
        const encounterData = await encounterResponse.json();
        stats.encounters = encounterData.total || 0;
      }

      // Count observations for specific patient if provided
      const observationUrl = patientId 
        ? `${fhirServerUrl}/Observation?patient=${patientId}&_summary=count`
        : `${fhirServerUrl}/Observation?_summary=count`;
      
      const observationResponse = await fetch(observationUrl, {
        headers: { 'Accept': 'application/fhir+json' },
      });
      if (observationResponse.ok) {
        const observationData = await observationResponse.json();
        stats.observations = observationData.total || 0;
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // CSV Export functionality
  app.post("/api/export/flat", async (req, res) => {
    try {
      const { fhirServerUrl, patientId, resourceType } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      
      // Fetch resources from FHIR server
      const searchUrl = `${fhirServerUrl}/${resourceType}?patient=${patientId}&_count=1000`;
      const response = await fetch(searchUrl, {
        headers: { 'Accept': 'application/fhir+json' },
      });

      if (!response.ok) {
        return res.status(400).json({ error: "Failed to fetch resources" });
      }

      const bundle = await response.json();
      const resources = bundle.entry?.map((e: any) => e.resource) || [];
      
      // Convert to CSV format (simplified)
      const csvData = resources.map((resource: any) => {
        const flattened: any = {
          id: resource.id,
          resourceType: resource.resourceType,
        };
        
        // Flatten common fields based on resource type
        if (resourceType === 'Patient') {
          flattened.name = resource.name?.[0]?.given?.join(' ') + ' ' + resource.name?.[0]?.family || '';
          flattened.gender = resource.gender;
          flattened.birthDate = resource.birthDate;
        } else if (resourceType === 'Encounter') {
          flattened.status = resource.status;
          flattened.class = resource.class?.display || resource.class?.code;
          flattened.start = resource.period?.start;
          flattened.end = resource.period?.end;
          flattened.patient = resource.subject?.reference;
        } else if (resourceType === 'Observation') {
          flattened.status = resource.status;
          flattened.code = resource.code?.coding?.[0]?.code;
          flattened.display = resource.code?.coding?.[0]?.display || resource.code?.text;
          flattened.value = resource.valueQuantity?.value || resource.valueString;
          flattened.unit = resource.valueQuantity?.unit;
          flattened.date = resource.effectiveDateTime;
          flattened.patient = resource.subject?.reference;
          flattened.encounter = resource.encounter?.reference;
        }
        
        return flattened;
      });

      // Create CSV content
      if (csvData.length === 0) {
        return res.json({ success: false, error: "No data to export" });
      }

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      // Store as artifact
      const fileName = `${resourceType.toLowerCase()}_export_${Date.now()}.csv`;
      const filePath = `/tmp/${fileName}`;
      
      await fs.writeFile(filePath, csvContent);
      
      await storage.createArtifact({
        sessionId,
        artifactType: 'csv_export',
        fileName,
        filePath,
        labDay: 1,
        metadata: { resourceType, recordCount: csvData.length },
      });

      res.json({
        success: true,
        fileName,
        recordCount: csvData.length,
        downloadUrl: `/api/artifacts/download/${fileName}`,
      });
    } catch (error) {
      res.status(500).json({ error: "Export failed" });
    }
  });

  // Lab progress tracking
  app.get("/api/lab/progress", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const progress = await storage.getLabProgress(sessionId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.post("/api/lab/progress", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const progressData = insertLabProgressSchema.parse({
        ...req.body,
        sessionId,
      });
      
      const progress = await storage.updateLabProgress(progressData);
      res.json(progress);
    } catch (error) {
      res.status(400).json({ error: "Invalid progress data" });
    }
  });

  app.delete("/api/lab/progress", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      await storage.resetLabProgress(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset progress" });
    }
  });

  // Transform operations (Day 2)
  app.post("/api/transforms/run", async (req, res) => {
    try {
      const { transformType, inputData } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      
      // Simulate transform execution
      const results = {
        success: true,
        recordsProcessed: inputData?.length || 0,
        outputPath: `/tmp/transform_${Date.now()}.json`,
        riskScores: inputData?.map((record: any, index: number) => ({
          patientId: record.patientId || `patient-${index}`,
          riskScore: Math.random() * 100,
          readmissionFlag: Math.random() > 0.7,
        })) || [],
      };

      // Store as artifact
      await storage.createArtifact({
        sessionId,
        artifactType: 'transform_result',
        fileName: `transform_${transformType}_${Date.now()}.json`,
        filePath: results.outputPath,
        labDay: 2,
        metadata: results,
      });

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Transform execution failed" });
    }
  });

  // Observation publishing (Day 3)
  app.post("/api/fhir/publish/observation", async (req, res) => {
    try {
      const { patientId, encounterId, code, display, value, unit, fhirServerUrl } = req.body;
      const sessionId = req.headers['x-session-id'] as string;
      
      const observation = {
        resourceType: "Observation",
        status: "final",
        code: {
          coding: [{
            system: "http://loinc.org",
            code: code,
            display: display,
          }],
          text: display,
        },
        subject: {
          reference: `Patient/${patientId}`,
        },
        encounter: encounterId ? {
          reference: `Encounter/${encounterId}`,
        } : undefined,
        valueQuantity: {
          value: value,
          unit: unit,
          system: "http://unitsofmeasure.org",
          code: unit,
        },
        effectiveDateTime: new Date().toISOString(),
      };

      // Post to FHIR server
      const response = await fetch(`${fhirServerUrl}/Observation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json',
        },
        body: JSON.stringify(observation),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(400).json({
          success: false,
          error: `FHIR server error: ${response.status} - ${errorText}`,
        });
      }

      const created = await response.json();
      const resourceId = created.id;
      const resourceUrl = `${fhirServerUrl}/Observation/${resourceId}`;

      // Store as artifact
      await storage.createArtifact({
        sessionId,
        artifactType: 'observation',
        fileName: `observation_${resourceId}.json`,
        filePath: `/tmp/observation_${resourceId}.json`,
        labDay: 3,
        metadata: { resourceId, resourceUrl, observation: created },
      });

      res.json({
        success: true,
        resourceId,
        resourceUrl,
        observation: created,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to publish observation" });
    }
  });

  // Artifact management
  app.get("/api/artifacts", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const artifacts = await storage.getArtifacts(sessionId);
      res.json(artifacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artifacts" });
    }
  });

  app.get("/api/artifacts/download/:fileName", async (req, res) => {
    try {
      const { fileName } = req.params;
      const filePath = path.join('/tmp', fileName);
      
      // Check if file exists
      await fs.access(filePath);
      
      res.download(filePath);
    } catch (error) {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Bundles endpoint
  app.get("/api/bundles", async (req, res) => {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      const bundles = await storage.getBundles(sessionId);
      res.json(bundles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bundles" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
