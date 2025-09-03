import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Save, Trash2, Clock, Download, Upload, FileText, ArrowDown, Settings, ChevronRight, ChevronLeft, Database, Search, Plus, X, Copy, Check, Info, AlertTriangle, Code2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSelectedServer } from "@/lib/storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface HistoryEntry {
  id: string;
  method: string;
  url: string;
  path: string;
  headers: Record<string, string>;
  body: string | null;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  elapsedMs: number;
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  requests: any[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface RequestData {
  method: string;
  path: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body?: any;
  bodyType: 'json' | 'xml';
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const FHIR_SAMPLES = {
  basics: [
    {
      name: "List Patients (Limited)",
      method: "GET",
      path: "/Patient",
      queryParams: { "_count": "5" },
      description: "Retrieve first 5 patients with pagination"
    },
    {
      name: "Get Patient by ID", 
      method: "GET",
      path: "/Patient/example",
      queryParams: {},
      description: "Fetch a specific patient by their ID"
    },
    {
      name: "Search Observations",
      method: "GET", 
      path: "/Observation",
      queryParams: { "subject": "Patient/example", "date": "ge2023-01-01" },
      description: "Find observations for a patient after a specific date"
    }
  ],
  create: [
    {
      name: "Create Minimal Patient",
      method: "POST",
      path: "/Patient",
      queryParams: {},
      body: {
        resourceType: "Patient",
        name: [{ given: ["John"], family: "Doe" }],
        gender: "male"
      },
      description: "Create a basic patient with minimal required fields"
    },
    {
      name: "Create Observation with Value",
      method: "POST", 
      path: "/Observation",
      queryParams: {},
      body: {
        resourceType: "Observation",
        status: "final",
        code: {
          coding: [{
            system: "http://loinc.org",
            code: "8867-4",
            display: "Heart rate"
          }]
        },
        subject: { reference: "Patient/example" },
        valueQuantity: {
          value: 72,
          unit: "beats/minute",
          system: "http://unitsofmeasure.org",
          code: "/min"
        }
      },
      description: "Create a vital signs observation with quantity value"
    }
  ],
  bundle: [
    {
      name: "Transaction Bundle",
      method: "POST",
      path: "",
      queryParams: {},
      body: {
        resourceType: "Bundle",
        type: "transaction",
        entry: [
          {
            fullUrl: "urn:uuid:patient-1",
            request: { method: "POST", url: "Patient" },
            resource: {
              resourceType: "Patient",
              name: [{ given: ["Jane"], family: "Smith" }],
              gender: "female"
            }
          },
          {
            fullUrl: "urn:uuid:encounter-1", 
            request: { method: "POST", url: "Encounter" },
            resource: {
              resourceType: "Encounter",
              status: "finished",
              class: {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                code: "AMB"
              },
              subject: { reference: "urn:uuid:patient-1" }
            }
          },
          {
            fullUrl: "urn:uuid:observation-1",
            request: { method: "POST", url: "Observation" },
            resource: {
              resourceType: "Observation", 
              status: "final",
              code: {
                coding: [{
                  system: "http://loinc.org",
                  code: "29463-7",
                  display: "Body Weight"
                }]
              },
              subject: { reference: "urn:uuid:patient-1" },
              encounter: { reference: "urn:uuid:encounter-1" },
              valueQuantity: {
                value: 70,
                unit: "kg",
                system: "http://unitsofmeasure.org",
                code: "kg"
              }
            }
          }
        ]
      },
      description: "Create patient, encounter, and observation in single transaction"
    }
  ],
  terminology: [
    {
      name: "Observation with CodeableConcept",
      method: "POST",
      path: "/Observation", 
      queryParams: {},
      body: {
        resourceType: "Observation",
        status: "final",
        category: [{
          coding: [{
            system: "http://terminology.hl7.org/CodeSystem/observation-category",
            code: "vital-signs",
            display: "Vital Signs"
          }]
        }],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: "55284-4", 
              display: "Blood pressure systolic and diastolic"
            },
            {
              system: "http://snomed.info/sct",
              code: "75367002",
              display: "Blood pressure"
            }
          ],
          text: "Blood Pressure"
        },
        subject: { reference: "Patient/example" },
        component: [
          {
            code: {
              coding: [{
                system: "http://loinc.org",
                code: "8480-6",
                display: "Systolic blood pressure"
              }]
            },
            valueQuantity: {
              value: 120,
              unit: "mmHg",
              system: "http://unitsofmeasure.org",
              code: "mm[Hg]"
            }
          }
        ]
      },
      description: "Complex observation with multiple coding systems and components"
    }
  ],
  include: [
    {
      name: "Observations with Patient Include",
      method: "GET",
      path: "/Observation", 
      queryParams: { "_include": "Observation:subject", "_count": "10" },
      description: "Get observations and automatically include referenced patients"
    },
    {
      name: "Patient with Reverse Include", 
      method: "GET",
      path: "/Patient/example",
      queryParams: { "_revinclude": "Observation:subject" },
      description: "Get patient and all observations that reference them"
    }
  ]
};

const CHALLENGES = {
  beginner: [
    {
      id: "search-patients-smith",
      title: "Find Smith Family",
      description: "Search for patients with family name 'Smith'",
      points: 10,
      assertion: {
        type: "search",
        checks: [
          { field: "queryParams.family", operator: "equals", value: "Smith" },
          { field: "response.entry.length", operator: "gt", value: 0 }
        ]
      }
    },
    {
      id: "create-patient-basic",
      title: "Create Your First Patient", 
      description: "Create a patient resource with name and gender",
      points: 15,
      assertion: {
        type: "create",
        checks: [
          { field: "response.status", operator: "equals", value: 201 },
          { field: "body.resourceType", operator: "equals", value: "Patient" },
          { field: "body.name", operator: "exists", value: null }
        ]
      }
    }
  ],
  intermediate: [
    {
      id: "observation-with-reference",
      title: "Link Observation to Patient",
      description: "Create an observation with valueQuantity and link it to a patient",
      points: 25,
      assertion: {
        type: "create", 
        checks: [
          { field: "response.status", operator: "equals", value: 201 },
          { field: "body.resourceType", operator: "equals", value: "Observation" },
          { field: "body.subject.reference", operator: "contains", value: "Patient/" },
          { field: "body.valueQuantity.value", operator: "exists", value: null }
        ]
      }
    }
  ],
  advanced: [
    {
      id: "transaction-bundle-integrity",
      title: "Master Transaction Bundles",
      description: "Submit a transaction bundle creating Patient+Encounter+Observation with proper references",
      points: 50,
      assertion: {
        type: "bundle",
        checks: [
          { field: "response.status", operator: "equals", value: 200 },
          { field: "body.resourceType", operator: "equals", value: "Bundle" },
          { field: "body.entry.length", operator: "gte", value: 3 },
          { field: "body.entry[*].response.status", operator: "contains", value: "201" }
        ]
      }
    }
  ]
};

const SAMPLE_REQUESTS = [
  {
    name: "Get All Patients",
    method: "GET",
    path: "/Patient",
    description: "Retrieve all patients from the FHIR server"
  },
  {
    name: "Get Patient by ID",
    method: "GET", 
    path: "/Patient/1",
    description: "Retrieve a specific patient by their ID"
  },
  {
    name: "Search Patients by Name",
    method: "GET",
    path: "/Patient?name=Smith",
    description: "Search for patients with a specific name"
  },
  {
    name: "Get All Observations",
    method: "GET",
    path: "/Observation",
    description: "Retrieve all observations from the FHIR server"
  },
  {
    name: "Get Observations for Patient",
    method: "GET",
    path: "/Observation?subject=Patient/1",
    description: "Get all observations for a specific patient"
  },
  {
    name: "Create New Patient",
    method: "POST",
    path: "/Patient",
    description: "Create a new patient resource",
    body: {
      "resourceType": "Patient",
      "name": [
        {
          "use": "official",
          "family": "Doe",
          "given": ["John"]
        }
      ],
      "gender": "male",
      "birthDate": "1990-01-01"
    }
  },
  {
    name: "Create Heart Rate Observation",
    method: "POST",
    path: "/Observation",
    description: "Create a heart rate observation",
    body: {
      "resourceType": "Observation",
      "status": "final",
      "category": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/observation-category",
              "code": "vital-signs",
              "display": "Vital Signs"
            }
          ]
        }
      ],
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "8867-4",
            "display": "Heart rate"
          }
        ]
      },
      "subject": {
        "reference": "Patient/1"
      },
      "valueQuantity": {
        "value": 72,
        "unit": "beats/min",
        "system": "http://unitsofmeasure.org",
        "code": "/min"
      }
    }
  }
];

export default function FhirSimulator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get FHIR servers and config
  const { data: servers = [] } = useQuery({
    queryKey: ["/api/fhir/servers"],
  });
  
  const { data: fhirConfig } = useQuery({
    queryKey: ["/ops/fhir-base"],
  });
  
  const [request, setRequest] = useState<RequestData>({
    method: "GET",
    path: "/Patient",
    queryParams: {},
    headers: {},
    bodyType: 'json'
  });
  
  const [envVars, setEnvVars] = useState<Record<string, string>>({
    BASE_URL: 'http://localhost:8080/fhir',
    PATIENT_ID: 'example-patient-123',
    ENCOUNTER_ID: 'example-encounter-456',
    OBSERVATION_ID: 'example-observation-789'
  });
  
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [responseHistory, setResponseHistory] = useState<any[]>([]);
  const [responseViewMode, setResponseViewMode] = useState<'pretty' | 'raw' | 'json' | 'xml'>('pretty');
  const [responseSearch, setResponseSearch] = useState('');
  const [diffMode, setDiffMode] = useState(false);
  const [selectedDiffResponse, setSelectedDiffResponse] = useState<any>(null);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [capabilityStatement, setCapabilityStatement] = useState<any>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [resourceData, setResourceData] = useState<any>(null);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [showSearchBuilder, setShowSearchBuilder] = useState(false);
  const [searchBuilder, setSearchBuilder] = useState({
    resourceType: '',
    searchRows: [{ parameter: '', operator: '=', value: '' }],
    count: '',
    sort: '',
    include: '',
    revinclude: '',
    summary: ''
  });
  const [bundleComposer, setBundleComposer] = useState({
    resourceType: 'Bundle',
    type: 'transaction',
    entries: [{ method: 'POST', url: '', resource: {} }]
  });
  const [conditionalHelpers, setConditionalHelpers] = useState({
    createResourceType: 'Patient',
    createCondition: 'identifier',
    createValue: '',
    updateResourceType: 'Patient',
    updateCondition: 'identifier',
    updateValue: '',
    etag: '',
    profileUrl: ''
  });
  const [activeTab, setActiveTab] = useState('simulator');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [userBadges, setUserBadges] = useState<string[]>([]);

  // Load persisted data and handle prefill on component mount
  useEffect(() => {
    // Load persisted request
    const savedRequest = localStorage.getItem('simulator-last-request');
    if (savedRequest) {
      try {
        const parsedRequest = JSON.parse(savedRequest);
        setRequest(parsedRequest);
      } catch (error) {
        console.error('Failed to parse saved request:', error);
      }
    }

    // Load persisted environment variables
    const savedEnvVars = localStorage.getItem('simulator-env-vars');
    if (savedEnvVars) {
      try {
        const parsedEnvVars = JSON.parse(savedEnvVars);
        setEnvVars(parsedEnvVars);
      } catch (error) {
        console.error('Failed to parse saved environment variables:', error);
      }
    }

    // Load response history
    const savedHistory = localStorage.getItem('simulator-response-history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setResponseHistory(parsedHistory);
      } catch (error) {
        console.error('Failed to parse response history:', error);
      }
    }

    // Check for prefilled data from other pages
    const prefillData = localStorage.getItem('simulator-prefill');
    if (prefillData) {
      try {
        const parsedData = JSON.parse(prefillData);
        setRequest(prev => ({
          ...prev,
          ...parsedData,
          queryParams: parsedData.queryParams || {},
          bodyType: parsedData.bodyType || 'json'
        }));
        localStorage.removeItem('simulator-prefill'); // Clear after use
      } catch (error) {
        console.error('Failed to parse prefill data:', error);
      }
    }
  }, []);

  // Persist request data whenever it changes
  useEffect(() => {
    localStorage.setItem('simulator-last-request', JSON.stringify(request));
  }, [request]);

  // Persist environment variables whenever they change
  useEffect(() => {
    localStorage.setItem('simulator-env-vars', JSON.stringify(envVars));
  }, [envVars]);

  // Function to substitute environment variables in text
  const substituteEnvVars = (text: string): string => {
    let result = text;
    Object.entries(envVars).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(pattern, value);
    });
    return result;
  };

  // Response helper functions
  const formatResponseSize = (response: any): string => {
    const content = JSON.stringify(response.body || '');
    const bytes = new TextEncoder().encode(content).length;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const parseOperationOutcome = (response: any): string[] => {
    if (!response.body || response.body.resourceType !== 'OperationOutcome') {
      return [];
    }
    
    const issues = response.body.issue || [];
    return issues.map((issue: any) => {
      const severity = issue.severity || 'unknown';
      const code = issue.code || 'unknown';
      const details = issue.details?.text || issue.diagnostics || 'No details provided';
      return `${severity.toUpperCase()}: ${code} - ${details}`;
    });
  };

  const filterResponseContent = (content: string, search: string): string => {
    if (!search.trim()) return content;
    
    try {
      const lines = content.split('\n');
      const filteredLines = lines.filter(line => 
        line.toLowerCase().includes(search.toLowerCase())
      );
      return filteredLines.length > 0 ? filteredLines.join('\n') : 'No matches found';
    } catch {
      return content;
    }
  };

  const addToResponseHistory = (newResponse: any) => {
    const currentPath = substituteEnvVars(request.path);
    const historyEntry = {
      ...newResponse,
      path: currentPath,
      timestamp: new Date().toISOString()
    };
    
    setResponseHistory(prev => {
      // Keep only last 5 responses for the same path
      const pathHistory = prev.filter(r => r.path === currentPath).slice(-4);
      const otherHistory = prev.filter(r => r.path !== currentPath).slice(-20); // Keep 20 total
      const newHistory = [...otherHistory, ...pathHistory, historyEntry];
      
      // Persist to localStorage
      localStorage.setItem('simulator-response-history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const getPreviousResponses = (): any[] => {
    const currentPath = substituteEnvVars(request.path);
    return responseHistory.filter(r => r.path === currentPath).slice(-5);
  };

  // Capabilities functions
  const fetchCapabilities = async () => {
    if (capabilityStatement) return; // Already fetched this session
    
    try {
      const response = await apiRequest("POST", "/sim/send", {
        method: "GET",
        path: "/metadata",
        queryParams: {},
        headers: { "Accept": "application/fhir+json" },
        bodyType: 'json'
      });
      setCapabilityStatement(response.body);
    } catch (error) {
      console.error('Failed to fetch capability statement:', error);
      toast({
        title: "Error",
        description: "Failed to fetch server capabilities",
        variant: "destructive"
      });
    }
  };

  const getSupportedResources = (): Array<{type: string, interactions: string[]}> => {
    if (!capabilityStatement?.rest?.[0]?.resource) return [];
    
    return capabilityStatement.rest[0].resource.map((resource: any) => ({
      type: resource.type,
      interactions: resource.interaction?.map((i: any) => i.code) || []
    }));
  };

  const getCommonSearchParams = (resourceType: string): Array<{name: string, example: string}> => {
    const commonParams: Record<string, Array<{name: string, example: string}>> = {
      Patient: [
        { name: 'family', example: 'Smith' },
        { name: 'given', example: 'John' },
        { name: 'birthdate', example: '1990-01-01' },
        { name: 'gender', example: 'male' }
      ],
      Observation: [
        { name: 'subject', example: 'Patient/1' },
        { name: 'code', example: '8867-4' },
        { name: 'date', example: '2024-01-01' },
        { name: 'status', example: 'final' }
      ],
      Encounter: [
        { name: 'subject', example: 'Patient/1' },
        { name: 'status', example: 'finished' },
        { name: 'date', example: '2024-01-01' }
      ],
      Condition: [
        { name: 'subject', example: 'Patient/1' },
        { name: 'code', example: 'I10' },
        { name: 'clinical-status', example: 'active' }
      ]
    };
    
    return commonParams[resourceType] || [
      { name: 'id', example: '1' },
      { name: '_lastUpdated', example: '2024-01-01' }
    ];
  };

  const executeResourceAction = async (action: 'list' | 'search', resourceType: string, searchParam?: {name: string, example: string}) => {
    setResourceLoading(true);
    try {
      let path = `/${resourceType}`;
      const queryParams: Record<string, string> = {};
      
      if (action === 'list') {
        queryParams['_count'] = '10';
      } else if (action === 'search' && searchParam) {
        queryParams[searchParam.name] = searchParam.example;
        queryParams['_count'] = '10';
      }

      const response = await apiRequest("POST", "/sim/send", {
        method: "GET",
        path,
        queryParams,
        headers: { "Accept": "application/fhir+json" },
        bodyType: 'json'
      });
      
      setResourceData(response.body);
    } catch (error) {
      console.error(`Failed to fetch ${resourceType}:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch ${resourceType} data`,
        variant: "destructive"
      });
    } finally {
      setResourceLoading(false);
    }
  };

  const openInSimulator = (method: string, path: string, queryParams: Record<string, string> = {}) => {
    setRequest({
      method,
      path,
      queryParams,
      headers: { "Accept": "application/fhir+json" },
      bodyType: 'json'
    });
    setShowCapabilities(false); // Close capabilities panel
  };

  // Search Builder functions
  const getResourceSearchParameters = (resourceType: string): string[] => {
    if (!capabilityStatement?.rest?.[0]?.resource) return [];
    
    const resource = capabilityStatement.rest[0].resource.find((r: any) => r.type === resourceType);
    if (!resource?.searchParam) return [];
    
    return resource.searchParam.map((param: any) => param.name);
  };

  const getAllSearchParameters = (): string[] => {
    const commonParams = ['_id', '_lastUpdated', '_profile', '_security', '_source', '_tag'];
    const resourceParams = getResourceSearchParameters(searchBuilder.resourceType);
    return [...commonParams, ...resourceParams].sort();
  };

  const buildQueryString = () => {
    const params: Record<string, string> = {};
    
    // Add search rows
    searchBuilder.searchRows.forEach(row => {
      if (row.parameter && row.value) {
        const paramName = row.operator !== '=' ? `${row.parameter}${row.operator}` : row.parameter;
        params[paramName] = row.value;
      }
    });
    
    // Add special FHIR parameters
    if (searchBuilder.count) params['_count'] = searchBuilder.count;
    if (searchBuilder.sort) params['_sort'] = searchBuilder.sort;
    if (searchBuilder.include) params['_include'] = searchBuilder.include;
    if (searchBuilder.revinclude) params['_revinclude'] = searchBuilder.revinclude;
    if (searchBuilder.summary) params['_summary'] = searchBuilder.summary;
    
    return params;
  };

  const getPreviewUrl = () => {
    const queryParams = buildQueryString();
    const baseUrl = (fhirConfig && typeof fhirConfig === 'object' && 'useLocalFhir' in fhirConfig && fhirConfig.useLocalFhir) ? 'http://localhost:8080/fhir' : 'https://hapi.fhir.org/baseR4';
    const path = `/${searchBuilder.resourceType}`;
    const query = Object.entries(queryParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    return `${baseUrl}${path}${query ? `?${query}` : ''}`;
  };

  const addSearchRow = () => {
    setSearchBuilder(prev => ({
      ...prev,
      searchRows: [...prev.searchRows, { parameter: '', operator: '=', value: '' }]
    }));
  };

  const removeSearchRow = (index: number) => {
    setSearchBuilder(prev => ({
      ...prev,
      searchRows: prev.searchRows.filter((_, i) => i !== index)
    }));
  };

  const updateSearchRow = (index: number, field: string, value: string) => {
    setSearchBuilder(prev => ({
      ...prev,
      searchRows: prev.searchRows.map((row, i) => 
        i === index ? { ...row, [field]: value } : row
      )
    }));
  };

  const insertSearchIntoBuilder = () => {
    const queryParams = buildQueryString();
    const path = `/${searchBuilder.resourceType}`;
    
    setRequest({
      method: 'GET',
      path,
      queryParams,
      headers: { "Accept": "application/fhir+json" },
      bodyType: 'json'
    });
    
    setShowSearchBuilder(false);
  };

  const resetSearchBuilder = () => {
    setSearchBuilder({
      resourceType: '',
      searchRows: [{ parameter: '', operator: '=', value: '' }],
      count: '',
      sort: '',
      include: '',
      revinclude: '',
      summary: ''
    });
  };

  // Bundle Composer functions
  const getBundleTemplate = (type: string) => {
    const baseBundle = {
      resourceType: 'Bundle',
      id: `bundle-${Date.now()}`,
      type,
      timestamp: new Date().toISOString(),
      entry: []
    };

    if (type === 'transaction' || type === 'batch') {
      return {
        ...baseBundle,
        entry: bundleComposer.entries.map((entry, index) => ({
          fullUrl: entry.url || `urn:uuid:${Math.random().toString(36).substr(2, 9)}`,
          request: {
            method: entry.method,
            url: entry.url
          },
          resource: entry.resource
        }))
      };
    }

    return {
      ...baseBundle,
      entry: bundleComposer.entries.map(entry => ({
        fullUrl: entry.url || `urn:uuid:${Math.random().toString(36).substr(2, 9)}`,
        resource: entry.resource
      }))
    };
  };

  const addBundleEntry = () => {
    setBundleComposer(prev => ({
      ...prev,
      entries: [...prev.entries, { method: 'POST', url: '', resource: {} }]
    }));
  };

  const removeBundleEntry = (index: number) => {
    setBundleComposer(prev => ({
      ...prev,
      entries: prev.entries.filter((_, i) => i !== index)
    }));
  };

  const updateBundleEntry = (index: number, field: string, value: any) => {
    setBundleComposer(prev => ({
      ...prev,
      entries: prev.entries.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const loadTransactionTemplate = () => {
    const patientId = `patient-${Date.now()}`;
    const encounterId = `encounter-${Date.now()}`;
    
    setBundleComposer({
      resourceType: 'Bundle',
      type: 'transaction',
      entries: [
        {
          method: 'POST',
          url: 'Patient',
          resource: {
            resourceType: 'Patient',
            id: patientId,
            name: [{ given: ['John'], family: 'Doe' }],
            gender: 'male',
            birthDate: '1990-01-01'
          }
        },
        {
          method: 'POST',
          url: 'Encounter',
          resource: {
            resourceType: 'Encounter',
            id: encounterId,
            status: 'finished',
            class: {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: 'AMB',
              display: 'ambulatory'
            },
            subject: { reference: `Patient/${patientId}` },
            period: {
              start: new Date().toISOString(),
              end: new Date().toISOString()
            }
          }
        },
        {
          method: 'POST',
          url: 'Observation',
          resource: {
            resourceType: 'Observation',
            status: 'final',
            category: [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: 'vital-signs',
                display: 'Vital Signs'
              }]
            }],
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '8867-4',
                display: 'Heart rate'
              }]
            },
            subject: { reference: `Patient/${patientId}` },
            encounter: { reference: `Encounter/${encounterId}` },
            effectiveDateTime: new Date().toISOString(),
            valueQuantity: {
              value: 72,
              unit: 'beats/minute',
              system: 'http://unitsofmeasure.org',
              code: '/min'
            }
          }
        }
      ]
    });
  };

  const validateBundle = () => {
    const errors: string[] = [];
    
    if (!bundleComposer.type) {
      errors.push('Bundle type is required');
    }
    
    if (bundleComposer.entries.length === 0) {
      errors.push('Bundle must have at least one entry');
    }

    bundleComposer.entries.forEach((entry, index) => {
      if (!entry.resource || Object.keys(entry.resource).length === 0) {
        errors.push(`Entry ${index + 1}: Resource is required`);
      }
      
      if ((bundleComposer.type === 'transaction' || bundleComposer.type === 'batch') && !entry.method) {
        errors.push(`Entry ${index + 1}: HTTP method is required for ${bundleComposer.type} bundles`);
      }
    });

    return errors;
  };

  const sendBundle = () => {
    const errors = validateBundle();
    if (errors.length > 0) {
      toast({
        title: "Bundle Validation Failed",
        description: errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    const bundle = getBundleTemplate(bundleComposer.type);
    
    setRequest({
      method: 'POST',
      path: '',
      queryParams: {},
      headers: { "Accept": "application/fhir+json", "Content-Type": "application/fhir+json" },
      body: bundle,
      bodyType: 'json'
    });
    
    handleSendRequest();
  };

  // Conditional and Helper functions
  const setupConditionalCreate = () => {
    const { createResourceType, createCondition, createValue } = conditionalHelpers;
    if (!createCondition || !createValue) return;

    const ifNoneExist = `${createCondition}=${createValue}`;
    
    setRequest(prev => ({
      ...prev,
      method: 'POST',
      path: `/${createResourceType}`,
      headers: {
        ...prev.headers,
        'If-None-Exist': ifNoneExist,
        'Content-Type': 'application/fhir+json'
      }
    }));

    toast({
      title: "Conditional Create Setup",
      description: `Configured POST /${createResourceType} with If-None-Exist: ${ifNoneExist}`
    });
  };

  const setupConditionalUpdate = () => {
    const { updateResourceType, updateCondition, updateValue } = conditionalHelpers;
    if (!updateCondition || !updateValue) return;

    const searchUrl = `/${updateResourceType}?${updateCondition}=${encodeURIComponent(updateValue)}`;
    
    setRequest(prev => ({
      ...prev,
      method: 'PUT',
      path: searchUrl,
      headers: {
        ...prev.headers,
        'Content-Type': 'application/fhir+json'
      }
    }));

    toast({
      title: "Conditional Update Setup", 
      description: `Configured PUT ${searchUrl}`
    });
  };

  const fetchETag = async () => {
    if (!request.path || request.method !== 'GET') {
      toast({
        title: "ETag Fetch Error",
        description: "Set up a GET request first to fetch ETag",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await sendRequestMutation.mutateAsync();
      const etag = response.headers?.etag || response.headers?.ETag;
      if (etag) {
        setConditionalHelpers(prev => ({ ...prev, etag }));
        toast({
          title: "ETag Retrieved",
          description: `ETag: ${etag}`
        });
      } else {
        toast({
          title: "No ETag Found",
          description: "Server did not return an ETag header",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "ETag Fetch Failed",
        description: "Failed to fetch ETag from server",
        variant: "destructive"
      });
    }
  };

  const useETagForUpdate = () => {
    if (!conditionalHelpers.etag) {
      toast({
        title: "No ETag Available",
        description: "Fetch an ETag first using GET request",
        variant: "destructive"
      });
      return;
    }

    setRequest(prev => ({
      ...prev,
      method: 'PUT',
      headers: {
        ...prev.headers,
        'If-Match': conditionalHelpers.etag,
        'Content-Type': 'application/fhir+json'
      }
    }));

    toast({
      title: "ETag Applied",
      description: `Added If-Match header: ${conditionalHelpers.etag}`
    });
  };

  const addProfileToResource = () => {
    if (!conditionalHelpers.profileUrl || !request.body) return;

    try {
      const resource = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
      
      if (!resource.meta) {
        resource.meta = {};
      }
      if (!resource.meta.profile) {
        resource.meta.profile = [];
      }
      
      if (!resource.meta.profile.includes(conditionalHelpers.profileUrl)) {
        resource.meta.profile.push(conditionalHelpers.profileUrl);
      }

      setRequest(prev => ({ ...prev, body: resource }));

      toast({
        title: "Profile Added",
        description: `Added profile: ${conditionalHelpers.profileUrl}`
      });
    } catch (error) {
      toast({
        title: "Profile Addition Failed",
        description: "Invalid JSON in request body",
        variant: "destructive"
      });
    }
  };

  const validateResource = async () => {
    if (!request.body) {
      toast({
        title: "No Resource to Validate",
        description: "Add a resource to the request body first",
        variant: "destructive"
      });
      return;
    }

    try {
      const resource = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
      const resourceType = resource.resourceType;
      
      if (!resourceType) {
        toast({
          title: "Validation Error",
          description: "Resource must have a resourceType",
          variant: "destructive"
        });
        return;
      }

      // First try server validation if supported
      try {
        const validateResponse = await apiRequest('POST', `/sim/request`, {
          method: 'POST',
          path: `/${resourceType}/$validate`,
          headers: { 'Content-Type': 'application/fhir+json' },
          body: resource
        });

        if (validateResponse.body) {
          const outcome = typeof validateResponse.body === 'string' 
            ? JSON.parse(validateResponse.body) 
            : validateResponse.body;
          
          setResponse(prev => ({
            ...prev,
            body: formatJson(outcome),
            status: validateResponse.status,
            headers: validateResponse.headers || {}
          }));

          toast({
            title: "Server Validation Complete",
            description: "Check response for validation results"
          });
        }
      } catch (serverError) {
        // Fallback to local validation
        const localValidation = performLocalValidation(resource);
        
        const outcome = {
          resourceType: 'OperationOutcome',
          issue: localValidation.map(issue => ({
            severity: issue.severity,
            code: 'structure',
            details: { text: issue.message }
          }))
        };

        setResponse(prev => ({
          ...prev,
          body: formatJson(outcome),
          status: localValidation.some(i => i.severity === 'error') ? 400 : 200,
          headers: { 'Content-Type': 'application/fhir+json' }
        }));

        toast({
          title: "Local Validation Complete",
          description: `Found ${localValidation.length} issues`
        });
      }
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Invalid JSON in request body",
        variant: "destructive"
      });
    }
  };

  const performLocalValidation = (resource: any) => {
    const issues: Array<{severity: string, message: string}> = [];
    const resourceType = resource.resourceType;

    // Common validation rules
    if (!resourceType) {
      issues.push({ severity: 'error', message: 'resourceType is required' });
    }

    // Resource-specific validation
    switch (resourceType) {
      case 'Patient':
        if (!resource.name || !Array.isArray(resource.name) || resource.name.length === 0) {
          issues.push({ severity: 'warning', message: 'Patient should have at least one name' });
        }
        if (!resource.gender) {
          issues.push({ severity: 'warning', message: 'Patient should have a gender' });
        }
        break;

      case 'Observation':
        if (!resource.status) {
          issues.push({ severity: 'error', message: 'Observation.status is required' });
        }
        if (!resource.code) {
          issues.push({ severity: 'error', message: 'Observation.code is required' });
        }
        if (!resource.subject) {
          issues.push({ severity: 'warning', message: 'Observation should reference a subject' });
        }
        break;

      case 'Encounter':
        if (!resource.status) {
          issues.push({ severity: 'error', message: 'Encounter.status is required' });
        }
        if (!resource.class) {
          issues.push({ severity: 'error', message: 'Encounter.class is required' });
        }
        if (!resource.subject) {
          issues.push({ severity: 'warning', message: 'Encounter should reference a subject' });
        }
        break;

      default:
        if (resourceType) {
          issues.push({ severity: 'info', message: `No specific validation rules for ${resourceType}` });
        }
    }

    return issues;
  };


  // Sample functions
  const loadSample = (sample: any) => {
    setRequest({
      method: sample.method,
      path: sample.path,
      queryParams: sample.queryParams || {},
      headers: { "Accept": "application/fhir+json", "Content-Type": "application/fhir+json" },
      body: sample.body,
      bodyType: 'json'
    });
    setActiveTab('simulator');
    toast({
      title: "Sample Loaded",
      description: `${sample.name} loaded in Request Builder`
    });
  };

  const copySampleJSON = (sample: any) => {
    const jsonString = JSON.stringify(sample, null, 2);
    navigator.clipboard.writeText(jsonString);
    toast({
      title: "Copied to Clipboard",
      description: "Sample JSON copied successfully"
    });
  };

  // Import/Export functions
  const importPostmanCollection = (jsonString: string) => {
    try {
      const collection = JSON.parse(jsonString);
      if (!collection.info || !collection.item) {
        throw new Error("Invalid Postman collection format");
      }

      const requests = collection.item.map((item: any) => {
        const url = typeof item.request.url === 'string' ? item.request.url : item.request.url.raw;
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const queryParams: Record<string, string> = {};
        
        if (item.request.url.query) {
          item.request.url.query.forEach((param: any) => {
            queryParams[param.key] = param.value;
          });
        }

        const headers: Record<string, string> = {};
        if (item.request.header) {
          item.request.header.forEach((header: any) => {
            headers[header.key] = header.value;
          });
        }

        let body = undefined;
        if (item.request.body && item.request.body.raw) {
          try {
            body = JSON.parse(item.request.body.raw);
          } catch {
            body = item.request.body.raw;
          }
        }

        return {
          method: item.request.method,
          path,
          queryParams,
          headers,
          body,
          bodyType: 'json' as const
        };
      });

      saveCollectionMutation.mutate({
        name: collection.info.name,
        description: collection.info.description || '',
        requests,
        tags: []
      });

    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Invalid Postman collection format",
        variant: "destructive"
      });
    }
  };

  const exportToPostman = (collection: Collection) => {
    const postmanCollection = {
      info: {
        name: collection.name,
        description: collection.description,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: collection.requests.map((req) => ({
        name: `${req.method} ${req.path}`,
        request: {
          method: req.method,
          header: Object.entries(req.headers).map(([key, value]) => ({
            key,
            value,
            type: "text"
          })),
          url: {
            raw: `{{baseUrl}}${req.path}${Object.keys(req.queryParams).length ? '?' + new URLSearchParams(req.queryParams).toString() : ''}`,
            host: ["{{baseUrl}}"],
            path: req.path.split('/').filter(Boolean),
            query: Object.entries(req.queryParams).map(([key, value]) => ({
              key,
              value
            }))
          },
          body: req.body ? {
            mode: "raw",
            raw: typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2),
            options: {
              raw: {
                language: "json"
              }
            }
          } : undefined
        }
      })),
      variable: [
        {
          key: "baseUrl",
          value: "https://hapi.fhir.org/baseR4"
        }
      ]
    };

    const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.postman_collection.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `${collection.name} exported as Postman collection`
    });
  };

  // Challenge functions
  const runChallenge = async (challenge: any) => {
    try {
      const challengeResponse = await apiRequest('POST', '/sim/challenge', {
        challengeId: challenge.id,
        request: request,
        response: response
      });

      if (challengeResponse.success) {
        setUserPoints(prev => prev + challenge.points);
        if (challengeResponse.firstTime) {
          setUserBadges(prev => [...prev, challenge.id]);
        }
        
        toast({
          title: "Challenge Completed!",
          description: `Earned ${challenge.points} FHIR points!`
        });
      } else {
        toast({
          title: "Challenge Failed",
          description: challengeResponse.message || "Requirements not met",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Challenge Error",
        description: "Failed to validate challenge",
        variant: "destructive"
      });
    }
  };

  // Fetch history
  const { data: history = [] } = useQuery<HistoryEntry[]>({
    queryKey: ["/sim/history"],
  });

  // Fetch collections
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["/sim/collections"],
  });

  // Send request mutation
  // Utility functions
  const validateJSON = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const generateCurlCommand = (): string => {
    const substitutedPath = substituteEnvVars(request.path);
    const queryString = Object.entries(request.queryParams)
      .filter(([, value]) => value.trim())
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(substituteEnvVars(value))}`)
      .join('&');
    
    const fullUrl = `${substituteEnvVars(envVars.BASE_URL)}${substitutedPath}${queryString ? '?' + queryString : ''}`;
    
    let curlCommand = `curl -X ${request.method} "${fullUrl}"`;
    
    // Add headers
    Object.entries(request.headers).forEach(([key, value]) => {
      if (value.trim()) {
        curlCommand += ` -H "${key}: ${substituteEnvVars(value)}"`;
      }
    });
    
    // Add body
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const bodyString = typeof request.body === 'string' ? request.body : JSON.stringify(request.body, null, 2);
      curlCommand += ` -d '${substituteEnvVars(bodyString)}'`;
    }
    
    return curlCommand;
  };

  const clearRequest = () => {
    setRequest({
      method: "GET",
      path: "/Patient",
      queryParams: {},
      headers: {},
      bodyType: 'json'
    });
    setResponse(null);
  };

  const copyToCurlClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateCurlCommand());
      toast({ title: "Success", description: "cURL command copied to clipboard!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy to clipboard", variant: "destructive" });
    }
  };

  const sendRequestMutation = useMutation({
    mutationFn: (data: RequestData) => {
      // Add query params to path
      const queryString = Object.entries(data.queryParams)
        .filter(([_, value]) => value.trim() !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      const pathWithQuery = queryString ? `${data.path}?${queryString}` : data.path;
      
      // Substitute environment variables in all text fields
      const processedRequest = {
        method: data.method,
        path: substituteEnvVars(pathWithQuery),
        headers: Object.fromEntries(
          Object.entries(data.headers).filter(([_, value]) => value.trim() !== '')
          .map(([key, value]) => [key, substituteEnvVars(value)])
        ),
        body: data.body ? (typeof data.body === 'string' ? substituteEnvVars(data.body) : data.body) : undefined
      };

      return apiRequest("POST", "/sim/send", processedRequest);
    },
    onSuccess: (response) => {
      console.log("FHIR Simulator Response:", response);
      setResponse(response);
      addToResponseHistory(response);
      queryClient.invalidateQueries({ queryKey: ["/sim/history"] });
      toast({
        title: "Request Successful",
        description: `${response.status} ${response.statusText} (${response.elapsedMs}ms)`,
        variant: response.status < 400 ? "default" : "destructive"
      });
    },
    onError: (error) => {
      console.error("FHIR Simulator Error:", error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send request",
        variant: "destructive",
      });
    },
  });

  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/sim/history/clear"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/sim/history"] });
      toast({
        title: "History Cleared",
        description: "Request history has been cleared",
      });
    },
  });

  // Save collection mutation
  const saveCollectionMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; requests: RequestData[]; tags: string[] }) =>
      apiRequest("POST", "/sim/collections/save", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/sim/collections"] });
      toast({
        title: "Collection Saved",
        description: "Request collection has been saved",
      });
    },
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/sim/collections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/sim/collections"] });
    },
  });

  const handleSendRequest = async () => {
    if (!request.path) {
      toast({
        title: "Invalid Request",
        description: "Path is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendRequestMutation.mutateAsync(request);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setRequest({
      method: entry.method,
      path: entry.path,
      queryParams: {},
      headers: entry.headers || {},
      body: entry.body ? JSON.parse(entry.body) : undefined,
      bodyType: 'json'
    });
  };


  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-100 text-green-800";
    if (status >= 400 && status < 500) return "bg-yellow-100 text-yellow-800";
    if (status >= 500) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FHIR Simulator</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Test and experiment with FHIR API requests in a safe environment
              </p>
              {fhirConfig && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-sm">
                    Connected to: {fhirConfig && typeof fhirConfig === 'object' && 'useLocalFhir' in fhirConfig && fhirConfig.useLocalFhir ? 'Local HAPI' : 'Public HAPI'}
                  </Badge>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowCapabilities(!showCapabilities);
                if (!showCapabilities && !capabilityStatement) {
                  fetchCapabilities();
                }
              }}
              className="flex items-center gap-2"
              data-testid="capabilities-toggle"
            >
              <Database className="h-4 w-4" />
              Capabilities
              {showCapabilities ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 transition-all duration-200 ${
          showCapabilities ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {/* Left Panel: Collections, History, Samples, Challenges */}
          <div className="space-y-6">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="collections">Collections</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="samples">Samples</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
              </TabsList>

              <TabsContent value="collections" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Saved Collections</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => {
                        const name = prompt("Collection name:");
                        if (name) {
                          saveCollectionMutation.mutate({
                            name,
                            requests: [request],
                            tags: [],
                          });
                        }
                      }}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Current
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {collections.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No saved collections</p>
                      ) : (
                        <div className="space-y-2">
                          {collections.map((collection) => (
                            <div
                              key={collection.id}
                              className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{collection.name}</h4>
                                  {collection.description && (
                                    <p className="text-sm text-gray-500">{collection.description}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {collection.requests.length} requests
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => exportToPostman(collection)}
                                    data-testid={`export-collection-${collection.id}`}
                                  >
                                    <Download className="h-4 w-4" />
                                    Export
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteCollectionMutation.mutate(collection.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Request History</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => clearHistoryMutation.mutate()}
                      disabled={clearHistoryMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {history.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No request history</p>
                      ) : (
                        <div className="space-y-2">
                          {history.map((entry) => (
                            <div
                              key={entry.id}
                              className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                              onClick={() => loadFromHistory(entry)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {entry.method}
                                  </Badge>
                                  <Badge className={`text-xs ${getStatusColor(entry.responseStatus)}`}>
                                    {entry.responseStatus}
                                  </Badge>
                                </div>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {entry.elapsedMs}ms
                                </span>
                              </div>
                              <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                                {entry.path}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(entry.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="samples" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Sample Requests</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowImportDialog(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Tabs defaultValue="basics" orientation="horizontal">
                        <TabsList className="mb-4">
                          <TabsTrigger value="basics">Basics</TabsTrigger>
                          <TabsTrigger value="create">Create</TabsTrigger>
                          <TabsTrigger value="bundle">Bundle</TabsTrigger>
                          <TabsTrigger value="terminology">Terminology</TabsTrigger>
                          <TabsTrigger value="include">Include</TabsTrigger>
                        </TabsList>

                        {Object.entries(FHIR_SAMPLES).map(([category, samples]) => (
                          <TabsContent key={category} value={category} className="space-y-2">
                            {samples.map((sample, index) => (
                              <div
                                key={index}
                                className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {sample.method}
                                    </Badge>
                                    <h4 className="font-medium text-sm">{sample.name}</h4>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => loadSample(sample)}
                                      data-testid={`load-sample-${sample.name.replace(/\s+/g, '-').toLowerCase()}`}
                                    >
                                      <Play className="h-4 w-4" />
                                      Load
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copySampleJSON(sample)}
                                    >
                                      <Copy className="h-4 w-4" />
                                      Copy
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-1">
                                  {sample.path || 'Bundle Transaction'}
                                </p>
                                <p className="text-xs text-gray-500">{sample.description}</p>
                              </div>
                            ))}
                          </TabsContent>
                        ))}
                      </Tabs>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="challenges" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">FHIR Challenges</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{userPoints} points</Badge>
                      <Badge variant="outline">{userBadges.length} badges</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <Tabs defaultValue="beginner" orientation="horizontal">
                        <TabsList className="mb-4">
                          <TabsTrigger value="beginner">Beginner</TabsTrigger>
                          <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
                          <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        </TabsList>

                        {Object.entries(CHALLENGES).map(([level, challenges]) => (
                          <TabsContent key={level} value={level} className="space-y-4">
                            {challenges.map((challenge) => (
                              <div
                                key={challenge.id}
                                className={`p-4 border rounded-lg ${
                                  userBadges.includes(challenge.id)
                                    ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{challenge.title}</h4>
                                    {userBadges.includes(challenge.id) && (
                                      <Badge className="bg-green-100 text-green-800">
                                        ✓ Completed
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">{challenge.points} pts</Badge>
                                    <Button
                                      size="sm"
                                      onClick={() => runChallenge(challenge)}
                                      disabled={!response}
                                      data-testid={`challenge-${challenge.id}`}
                                    >
                                      {userBadges.includes(challenge.id) ? 'Retry' : 'Check'}
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {challenge.description}
                                </p>
                                {!response && (
                                  <p className="text-xs text-amber-600 mt-2">
                                    Send a request first to attempt this challenge
                                  </p>
                                )}
                              </div>
                            ))}
                          </TabsContent>
                        ))}
                      </Tabs>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel: Request Builder & Response Viewer */}
          <div className="space-y-6">
            {/* Environment Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Environment Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(envVars).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs font-medium">{key}</Label>
                      <Input
                        value={value}
                        onChange={(e) => setEnvVars(prev => ({ ...prev, [key]: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Request Builder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Method and Path */}
                <div className="flex gap-2">
                  <div className="w-32">
                    <Select value={request.method} onValueChange={(value) => setRequest(prev => ({ ...prev, method: value }))}>
                      <SelectTrigger data-testid="method-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HTTP_METHODS.map(method => (
                          <SelectItem key={method} value={method} data-testid={`method-${method.toLowerCase()}`}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="/Patient (supports {PATIENT_ID} variables)"
                      value={request.path}
                      onChange={(e) => setRequest(prev => ({ ...prev, path: e.target.value }))}
                      data-testid="path-input"
                    />
                  </div>
                </div>

                {/* Query Parameters */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Query Parameters</Label>
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700">
                      <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium">Key</div>
                      <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium">Value</div>
                    </div>
                    <div className="p-2 space-y-2">
                      {Object.entries(request.queryParams).map(([key, value], index) => (
                        <div key={index} className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="name"
                            value={key}
                            onChange={(e) => {
                              const newParams = { ...request.queryParams };
                              delete newParams[key];
                              if (e.target.value) {
                                newParams[e.target.value] = value;
                              }
                              setRequest(prev => ({ ...prev, queryParams: newParams }));
                            }}

                          />
                          <div className="flex gap-1">
                            <Input
                              placeholder="value (supports {PATIENT_ID})"
                              value={value}
                              onChange={(e) => {
                                setRequest(prev => ({
                                  ...prev,
                                  queryParams: { ...prev.queryParams, [key]: e.target.value }
                                }));
                              }}
  
                            />
                            <Button
  
                              variant="ghost"
                              onClick={() => {
                                const newParams = { ...request.queryParams };
                                delete newParams[key];
                                setRequest(prev => ({ ...prev, queryParams: newParams }));
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newKey = `param${Object.keys(request.queryParams).length + 1}`;
                          setRequest(prev => ({
                            ...prev,
                            queryParams: { ...prev.queryParams, [newKey]: '' }
                          }));
                        }}
                        className="w-full"
                      >
                        Add Parameter
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Headers */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Headers</Label>
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-2 gap-px bg-gray-200 dark:bg-gray-700">
                      <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium">Header</div>
                      <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium">Value</div>
                    </div>
                    <div className="p-2 space-y-2">
                      {Object.entries(request.headers).map(([key, value], index) => (
                        <div key={index} className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Content-Type"
                            value={key}
                            onChange={(e) => {
                              const newHeaders = { ...request.headers };
                              delete newHeaders[key];
                              if (e.target.value) {
                                newHeaders[e.target.value] = value;
                              }
                              setRequest(prev => ({ ...prev, headers: newHeaders }));
                            }}

                          />
                          <div className="flex gap-1">
                            <Input
                              placeholder="application/json"
                              value={value}
                              onChange={(e) => {
                                setRequest(prev => ({
                                  ...prev,
                                  headers: { ...prev.headers, [key]: e.target.value }
                                }));
                              }}
  
                            />
                            <Button
  
                              variant="ghost"
                              onClick={() => {
                                const newHeaders = { ...request.headers };
                                delete newHeaders[key];
                                setRequest(prev => ({ ...prev, headers: newHeaders }));
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newKey = 'Content-Type';
                          setRequest(prev => ({
                            ...prev,
                            headers: { ...prev.headers, [newKey]: 'application/fhir+json' }
                          }));
                        }}
                        className="w-full"
                      >
                        Add Header
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Request Body */}
                {(request.method === "POST" || request.method === "PUT" || request.method === "PATCH") && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Request Body</Label>
                    
                    <Tabs defaultValue="raw" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="raw">Raw</TabsTrigger>
                        <TabsTrigger value="bundle">Bundle Composer</TabsTrigger>
                        <TabsTrigger value="template">Templates</TabsTrigger>
                        <TabsTrigger value="helpers">Helpers</TabsTrigger>
                      </TabsList>
                      
                      {/* Raw Body Editor */}
                      <TabsContent value="raw" className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={request.bodyType === 'json' ? 'default' : 'outline'}
                            onClick={() => setRequest(prev => ({ ...prev, bodyType: 'json' }))}
                          >
                            JSON
                          </Button>
                          <Button
                            size="sm"
                            variant={request.bodyType === 'xml' ? 'default' : 'outline'}
                            onClick={() => setRequest(prev => ({ ...prev, bodyType: 'xml' }))}
                          >
                            XML
                          </Button>
                        </div>
                        <Textarea
                          placeholder={request.bodyType === 'json' ? 
                            'Enter JSON request body... (supports {PATIENT_ID} variables)' : 
                            'Enter XML request body... (supports {PATIENT_ID} variables)'
                          }
                          value={request.body ? (typeof request.body === 'string' ? request.body : formatJson(request.body)) : ""}
                          onChange={(e) => {
                            const text = e.target.value;
                            if (request.bodyType === 'json') {
                              try {
                                const body = text ? JSON.parse(text) : undefined;
                                setRequest(prev => ({ ...prev, body }));
                              } catch {
                                // Keep the raw text if it's not valid JSON yet
                                setRequest(prev => ({ ...prev, body: text }));
                              }
                            } else {
                              setRequest(prev => ({ ...prev, body: text }));
                            }
                          }}
                          rows={8}
                          className="font-mono text-sm"
                          data-testid="body-editor"
                        />
                        {request.bodyType === 'json' && request.body && !validateJSON(typeof request.body === 'string' ? request.body : JSON.stringify(request.body)) && (
                          <p className="text-red-500 text-xs">⚠️ Invalid JSON format</p>
                        )}
                      </TabsContent>

                      {/* Bundle Composer */}
                      <TabsContent value="bundle" className="space-y-4">
                        {/* Bundle Type Selection */}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">Bundle Type:</Label>
                          <Select
                            value={bundleComposer.type}
                            onValueChange={(value) => setBundleComposer(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transaction">Transaction</SelectItem>
                              <SelectItem value="batch">Batch</SelectItem>
                              <SelectItem value="collection">Collection</SelectItem>
                              <SelectItem value="searchset">Search Set</SelectItem>
                              <SelectItem value="history">History</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Bundle Entries */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Bundle Entries</Label>
                            <Button size="sm" variant="outline" onClick={addBundleEntry} data-testid="add-bundle-entry">
                              <Plus className="h-4 w-4 mr-1" />
                              Add Entry
                            </Button>
                          </div>
                          
                          <ScrollArea className="h-96 border rounded-lg p-2">
                            <div className="space-y-4">
                              {bundleComposer.entries.map((entry, index) => (
                                <div key={index} className="border rounded-lg p-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm">Entry {index + 1}</h4>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeBundleEntry(index)}
                                      disabled={bundleComposer.entries.length === 1}
                                      data-testid={`remove-entry-${index}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  {(bundleComposer.type === 'transaction' || bundleComposer.type === 'batch') && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs">HTTP Method</Label>
                                        <Select
                                          value={entry.method}
                                          onValueChange={(value) => updateBundleEntry(index, 'method', value)}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="GET">GET</SelectItem>
                                            <SelectItem value="POST">POST</SelectItem>
                                            <SelectItem value="PUT">PUT</SelectItem>
                                            <SelectItem value="PATCH">PATCH</SelectItem>
                                            <SelectItem value="DELETE">DELETE</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-xs">URL</Label>
                                        <Input
                                          placeholder="e.g. Patient, Patient/123"
                                          value={entry.url}
                                          onChange={(e) => updateBundleEntry(index, 'url', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div>
                                    <Label className="text-xs">Resource (JSON)</Label>
                                    <Textarea
                                      placeholder="Enter FHIR resource JSON..."
                                      value={typeof entry.resource === 'string' ? entry.resource : JSON.stringify(entry.resource, null, 2)}
                                      onChange={(e) => {
                                        try {
                                          const resource = e.target.value ? JSON.parse(e.target.value) : {};
                                          updateBundleEntry(index, 'resource', resource);
                                        } catch {
                                          updateBundleEntry(index, 'resource', e.target.value);
                                        }
                                      }}
                                      rows={4}
                                      className="font-mono text-xs"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Bundle Actions */}
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            onClick={loadTransactionTemplate}
                            data-testid="load-transaction-template"
                          >
                            Load Transaction Template
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const bundle = getBundleTemplate(bundleComposer.type);
                              setRequest(prev => ({ ...prev, body: bundle, bodyType: 'json' }));
                            }}
                            data-testid="preview-bundle"
                          >
                            Preview Bundle
                          </Button>
                          <Button
                            size="sm"
                            onClick={sendBundle}
                            disabled={validateBundle().length > 0}
                            data-testid="send-bundle"
                          >
                            Send Bundle
                          </Button>
                        </div>

                        {/* Validation Errors */}
                        {validateBundle().length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <h4 className="font-medium text-red-900 dark:text-red-300 text-sm mb-1">
                              Validation Errors:
                            </h4>
                            <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
                              {validateBundle().map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </TabsContent>

                      {/* Templates */}
                      <TabsContent value="template" className="space-y-4">
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          Quick templates for common FHIR resources and use cases.
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start"
                            onClick={() => {
                              const patient = {
                                resourceType: 'Patient',
                                name: [{ given: ['John'], family: 'Doe' }],
                                gender: 'male',
                                birthDate: '1990-01-01'
                              };
                              setRequest(prev => ({ ...prev, body: patient, bodyType: 'json' }));
                            }}
                          >
                            <div className="font-medium">Patient</div>
                            <div className="text-xs text-gray-500">Basic patient resource</div>
                          </Button>
                          
                          <Button
                            variant="outline"
                            className="h-auto p-4 flex flex-col items-start"
                            onClick={() => {
                              const observation = {
                                resourceType: 'Observation',
                                status: 'final',
                                code: {
                                  coding: [{
                                    system: 'http://loinc.org',
                                    code: '8867-4',
                                    display: 'Heart rate'
                                  }]
                                },
                                subject: { reference: 'Patient/example' },
                                valueQuantity: {
                                  value: 72,
                                  unit: 'beats/minute',
                                  system: 'http://unitsofmeasure.org',
                                  code: '/min'
                                }
                              };
                              setRequest(prev => ({ ...prev, body: observation, bodyType: 'json' }));
                            }}
                          >
                            <div className="font-medium">Observation</div>
                            <div className="text-xs text-gray-500">Vital signs observation</div>
                          </Button>
                        </div>
                      </TabsContent>

                      {/* Helpers */}
                      <TabsContent value="helpers" className="space-y-6">
                        {/* Conditional Operations */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-base">Conditional Operations</h3>
                          
                          {/* Conditional Create */}
                          <div className="border rounded-lg p-4 space-y-3">
                            <h4 className="font-medium text-sm">Conditional Create</h4>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Resource Type</Label>
                                <Select
                                  value={conditionalHelpers.createResourceType}
                                  onValueChange={(value) => setConditionalHelpers(prev => ({ ...prev, createResourceType: value }))}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Patient">Patient</SelectItem>
                                    <SelectItem value="Observation">Observation</SelectItem>
                                    <SelectItem value="Encounter">Encounter</SelectItem>
                                    <SelectItem value="Practitioner">Practitioner</SelectItem>
                                    <SelectItem value="Organization">Organization</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Condition</Label>
                                <Input
                                  className="h-8 text-xs"
                                  placeholder="identifier"
                                  value={conditionalHelpers.createCondition}
                                  onChange={(e) => setConditionalHelpers(prev => ({ ...prev, createCondition: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Value</Label>
                                <Input
                                  className="h-8 text-xs"
                                  placeholder="12345"
                                  value={conditionalHelpers.createValue}
                                  onChange={(e) => setConditionalHelpers(prev => ({ ...prev, createValue: e.target.value }))}
                                />
                              </div>
                            </div>
                            <Button size="sm" onClick={setupConditionalCreate} data-testid="setup-conditional-create">
                              Setup Conditional Create
                            </Button>
                          </div>

                          {/* Conditional Update */}
                          <div className="border rounded-lg p-4 space-y-3">
                            <h4 className="font-medium text-sm">Conditional Update</h4>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Resource Type</Label>
                                <Select
                                  value={conditionalHelpers.updateResourceType}
                                  onValueChange={(value) => setConditionalHelpers(prev => ({ ...prev, updateResourceType: value }))}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Patient">Patient</SelectItem>
                                    <SelectItem value="Observation">Observation</SelectItem>
                                    <SelectItem value="Encounter">Encounter</SelectItem>
                                    <SelectItem value="Practitioner">Practitioner</SelectItem>
                                    <SelectItem value="Organization">Organization</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Condition</Label>
                                <Input
                                  className="h-8 text-xs"
                                  placeholder="identifier"
                                  value={conditionalHelpers.updateCondition}
                                  onChange={(e) => setConditionalHelpers(prev => ({ ...prev, updateCondition: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Value</Label>
                                <Input
                                  className="h-8 text-xs"
                                  placeholder="12345"
                                  value={conditionalHelpers.updateValue}
                                  onChange={(e) => setConditionalHelpers(prev => ({ ...prev, updateValue: e.target.value }))}
                                />
                              </div>
                            </div>
                            <Button size="sm" onClick={setupConditionalUpdate} data-testid="setup-conditional-update">
                              Setup Conditional Update
                            </Button>
                          </div>
                        </div>

                        {/* ETag Support */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-base">ETag Support</h3>
                          <div className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <Label className="text-sm">Current ETag</Label>
                                <Input
                                  className="mt-1 text-xs font-mono"
                                  placeholder="No ETag fetched"
                                  value={conditionalHelpers.etag}
                                  readOnly
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={fetchETag}
                                disabled={request.method !== 'GET' || !request.path}
                                data-testid="fetch-etag"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Fetch ETag
                              </Button>
                              <Button
                                size="sm"
                                onClick={useETagForUpdate}
                                disabled={!conditionalHelpers.etag}
                                data-testid="use-etag"
                              >
                                Use for Update
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Set up a GET request first, then fetch ETag to use for safe updates with If-Match header.
                            </p>
                          </div>
                        </div>

                        {/* Resource Validation */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-base">Resource Validation</h3>
                          <div className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={validateResource}
                                disabled={!request.body}
                                data-testid="validate-resource"
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Validate Resource
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Validates resource using server $validate operation or local schema validation.
                            </p>
                          </div>
                        </div>

                        {/* Profile Support */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-base">Profile Hinting</h3>
                          <div className="border rounded-lg p-4 space-y-3">
                            <div>
                              <Label className="text-sm">Profile URL</Label>
                              <Input
                                className="mt-1"
                                placeholder="https://example.org/fhir/StructureDefinition/my-patient"
                                value={conditionalHelpers.profileUrl}
                                onChange={(e) => setConditionalHelpers(prev => ({ ...prev, profileUrl: e.target.value }))}
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={addProfileToResource}
                              disabled={!conditionalHelpers.profileUrl || !request.body}
                              data-testid="add-profile"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add to meta.profile
                            </Button>
                            <p className="text-xs text-gray-500">
                              Adds the profile URL to the resource's meta.profile array for validation hinting.
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button 
                    onClick={handleSendRequest}
                    disabled={isLoading || !request.path}
                    data-testid="send-button"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const name = prompt("Collection name:");
                      if (name) {
                        saveCollectionMutation.mutate({
                          name,
                          requests: [request],
                          tags: [],
                        });
                      }
                    }}
                    data-testid="save-collection-button"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save to Collection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearRequest}
                    data-testid="clear-button"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    onClick={copyToCurlClipboard}
                    data-testid="copy-curl-button"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Copy as cURL
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!capabilityStatement) fetchCapabilities();
                      setShowSearchBuilder(true);
                    }}
                    data-testid="search-builder-button"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Builder
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Response Viewer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Response
                  {response && (
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(response.status)}>
                        {response.status} {response.statusText}
                      </Badge>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {response.elapsedMs}ms
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatResponseSize(response)}
                      </span>
                    </div>
                  )}
                </CardTitle>
                {response && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={diffMode ? "default" : "outline"}
                        onClick={() => setDiffMode(!diffMode)}
                        disabled={getPreviousResponses().length === 0}
                      >
                        Diff
                      </Button>
                      {diffMode && getPreviousResponses().length > 0 && (
                        <Select value={selectedDiffResponse?.timestamp || ""} onValueChange={(value) => {
                          const selected = getPreviousResponses().find(r => r.timestamp === value);
                          setSelectedDiffResponse(selected);
                        }}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select response to compare" />
                          </SelectTrigger>
                          <SelectContent>
                            {getPreviousResponses().slice(0, -1).map((resp, index) => (
                              <SelectItem key={resp.timestamp} value={resp.timestamp}>
                                Response {index + 1} - {new Date(resp.timestamp).toLocaleTimeString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <span className="ml-2">Sending request...</span>
                  </div>
                ) : response ? (
                  <div className="space-y-4">
                    {/* Response Headers */}
                    {response.headers && Object.keys(response.headers).length > 0 && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Response Headers</Label>
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(response.headers).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="font-medium text-gray-600 dark:text-gray-400 w-1/3">{key}:</span>
                                <span className="text-gray-900 dark:text-gray-100 w-2/3">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* OperationOutcome Error Helper */}
                    {parseOperationOutcome(response).length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">
                          ⚠️ FHIR OperationOutcome Issues:
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {parseOperationOutcome(response).map((issue, index) => (
                            <li key={index} className="text-red-800 dark:text-red-200">• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Response Body Tabs */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Response Body</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search in response..."
                            value={responseSearch}
                            onChange={(e) => setResponseSearch(e.target.value)}
                            className="w-48"
                          />
                        </div>
                      </div>
                      
                      <Tabs value={responseViewMode} onValueChange={(value: any) => setResponseViewMode(value)}>
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="pretty">Pretty</TabsTrigger>
                          <TabsTrigger value="raw">Raw</TabsTrigger>
                          <TabsTrigger value="json">JSON</TabsTrigger>
                          <TabsTrigger value="xml">XML</TabsTrigger>
                        </TabsList>

                        <div className="mt-2">
                          {diffMode && selectedDiffResponse ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-500 mb-1 block">Current Response</Label>
                                <ScrollArea className="h-[400px] border rounded">
                                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 overflow-auto">
                                    {filterResponseContent(
                                      responseViewMode === 'pretty' ? formatJson(response.body) :
                                      responseViewMode === 'raw' ? JSON.stringify(response.body) :
                                      responseViewMode === 'json' ? formatJson(response.body) :
                                      '<?xml version="1.0"?>\n' + formatJson(response.body),
                                      responseSearch
                                    )}
                                  </pre>
                                </ScrollArea>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500 mb-1 block">Previous Response ({new Date(selectedDiffResponse.timestamp).toLocaleTimeString()})</Label>
                                <ScrollArea className="h-[400px] border rounded">
                                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 overflow-auto">
                                    {filterResponseContent(
                                      responseViewMode === 'pretty' ? formatJson(selectedDiffResponse.body) :
                                      responseViewMode === 'raw' ? JSON.stringify(selectedDiffResponse.body) :
                                      responseViewMode === 'json' ? formatJson(selectedDiffResponse.body) :
                                      '<?xml version="1.0"?>\n' + formatJson(selectedDiffResponse.body),
                                      responseSearch
                                    )}
                                  </pre>
                                </ScrollArea>
                              </div>
                            </div>
                          ) : (
                            <TabsContent value={responseViewMode} className="mt-0">
                              <ScrollArea className="h-[400px] border rounded">
                                <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 overflow-auto">
                                  {filterResponseContent(
                                    responseViewMode === 'pretty' ? formatJson(response.body) :
                                    responseViewMode === 'raw' ? JSON.stringify(response.body) :
                                    responseViewMode === 'json' ? formatJson(response.body) :
                                    '<?xml version="1.0"?>\n' + formatJson(response.body),
                                    responseSearch
                                  )}
                                </pre>
                              </ScrollArea>
                            </TabsContent>
                          )}
                        </div>
                      </Tabs>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ArrowDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Send a request to see the response here
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Capabilities Panel */}
          {showCapabilities && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Server Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!capabilityStatement ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                      <span className="ml-2">Loading capabilities...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Server Info */}
                      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                        <div className="text-sm">
                          <div><strong>Software:</strong> {capabilityStatement.software?.name || 'Unknown'}</div>
                          <div><strong>Version:</strong> {capabilityStatement.software?.version || 'Unknown'}</div>
                          <div><strong>FHIR Version:</strong> {capabilityStatement.fhirVersion || 'Unknown'}</div>
                        </div>
                      </div>

                      {/* Supported Resources */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Supported Resources</Label>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {getSupportedResources().map((resource, index) => (
                            <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{resource.type}</h4>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedResource(selectedResource === resource.type ? null : resource.type)}
                                  data-testid={`resource-${resource.type}`}
                                >
                                  {selectedResource === resource.type ? 'Close' : 'Explore'}
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {resource.interactions.map((interaction) => (
                                  <Badge key={interaction} variant="secondary" className="text-xs">
                                    {interaction}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resource Explorer */}
              {selectedResource && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      {selectedResource} Explorer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Quick Actions */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Quick Actions</Label>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Button
                            size="sm"
                            onClick={() => executeResourceAction('list', selectedResource)}
                            disabled={resourceLoading}
                            data-testid="list-resources"
                          >
                            List (10 items)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openInSimulator('GET', `/${selectedResource}`, { _count: '10' })}
                            data-testid="open-list-simulator"
                          >
                            Open in Simulator
                          </Button>
                        </div>
                      </div>

                      {/* Search Parameters */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Common Search Parameters</Label>
                        <div className="space-y-2">
                          {getCommonSearchParams(selectedResource).map((param, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex-1">
                                <code className="text-sm font-mono">{param.name}={param.example}</code>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => executeResourceAction('search', selectedResource, param)}
                                  disabled={resourceLoading}
                                  data-testid={`search-${param.name}`}
                                >
                                  Search
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const queryParams: Record<string, string> = {};
                                    queryParams[param.name] = param.example;
                                    queryParams['_count'] = '10';
                                    openInSimulator('GET', `/${selectedResource}`, queryParams);
                                  }}
                                  data-testid={`open-search-${param.name}`}
                                >
                                  Open in Simulator
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Results */}
                      {resourceLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                          <span className="ml-2">Loading data...</span>
                        </div>
                      ) : resourceData ? (
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Results</Label>
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                              Total: {resourceData.total || 0} | Showing: {resourceData.entry?.length || 0}
                            </div>
                            <ScrollArea className="h-48">
                              {resourceData.entry?.length > 0 ? (
                                <div className="space-y-2">
                                  {resourceData.entry.slice(0, 10).map((entry: any, index: number) => (
                                    <div key={index} className="border rounded p-2 text-xs">
                                      <div className="font-mono text-blue-600 dark:text-blue-400">
                                        ID: {entry.resource?.id}
                                      </div>
                                      {entry.resource?.resourceType === 'Patient' && (
                                        <div>
                                          Name: {entry.resource.name?.[0]?.given?.join(' ')} {entry.resource.name?.[0]?.family}
                                        </div>
                                      )}
                                      {entry.resource?.resourceType === 'Observation' && (
                                        <div>
                                          Code: {entry.resource.code?.coding?.[0]?.display || entry.resource.code?.text}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center text-gray-500 py-4">No data found</div>
                              )}
                            </ScrollArea>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Builder Modal */}
      <Dialog open={showSearchBuilder} onOpenChange={setShowSearchBuilder}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>FHIR Search Builder</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Resource Type Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Resource Type</Label>
              <Select
                value={searchBuilder.resourceType}
                onValueChange={(value) => setSearchBuilder(prev => ({ ...prev, resourceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resource type" />
                </SelectTrigger>
                <SelectContent>
                  {getSupportedResources().map(resource => (
                    <SelectItem key={resource.type} value={resource.type}>
                      {resource.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Parameters */}
            {searchBuilder.resourceType && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Search Parameters</Label>
                  <Button size="sm" variant="outline" onClick={addSearchRow}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Row
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {searchBuilder.searchRows.map((row, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      {/* Parameter Name */}
                      <div className="flex-1">
                        <Select
                          value={row.parameter}
                          onValueChange={(value) => updateSearchRow(index, 'parameter', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Parameter" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAllSearchParameters().map(param => (
                              <SelectItem key={param} value={param}>
                                {param}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Operator */}
                      <div className="w-32">
                        <Select
                          value={row.operator}
                          onValueChange={(value) => updateSearchRow(index, 'operator', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="=">=</SelectItem>
                            <SelectItem value=":contains">:contains</SelectItem>
                            <SelectItem value=":exact">:exact</SelectItem>
                            <SelectItem value=":missing">:missing</SelectItem>
                            <SelectItem value=":not">:not</SelectItem>
                            <SelectItem value=":text">:text</SelectItem>
                            <SelectItem value=":of-type">:of-type</SelectItem>
                            <SelectItem value=":below">:below</SelectItem>
                            <SelectItem value=":above">:above</SelectItem>
                            <SelectItem value=":in">:in</SelectItem>
                            <SelectItem value=":not-in">:not-in</SelectItem>
                            <SelectItem value="ge">ge (≥)</SelectItem>
                            <SelectItem value="le">le (≤)</SelectItem>
                            <SelectItem value="gt">gt (&gt;)</SelectItem>
                            <SelectItem value="lt">lt (&lt;)</SelectItem>
                            <SelectItem value="ne">ne (≠)</SelectItem>
                            <SelectItem value="sa">sa (starts after)</SelectItem>
                            <SelectItem value="eb">eb (ends before)</SelectItem>
                            <SelectItem value="ap">ap (approximately)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value */}
                      <div className="flex-1">
                        <Input
                          placeholder="Value"
                          value={row.value}
                          onChange={(e) => updateSearchRow(index, 'value', e.target.value)}
                        />
                      </div>

                      {/* Remove button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeSearchRow(index)}
                        disabled={searchBuilder.searchRows.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special FHIR Parameters */}
            {searchBuilder.resourceType && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">_count</Label>
                  <Input
                    placeholder="e.g. 10, 50"
                    value={searchBuilder.count}
                    onChange={(e) => setSearchBuilder(prev => ({ ...prev, count: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">_sort</Label>
                  <Input
                    placeholder="e.g. _lastUpdated, name"
                    value={searchBuilder.sort}
                    onChange={(e) => setSearchBuilder(prev => ({ ...prev, sort: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">_include</Label>
                  <Input
                    placeholder="e.g. Patient:organization"
                    value={searchBuilder.include}
                    onChange={(e) => setSearchBuilder(prev => ({ ...prev, include: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">_revinclude</Label>
                  <Input
                    placeholder="e.g. Observation:patient"
                    value={searchBuilder.revinclude}
                    onChange={(e) => setSearchBuilder(prev => ({ ...prev, revinclude: e.target.value }))}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label className="text-sm font-medium mb-2 block">_summary</Label>
                  <Select
                    value={searchBuilder.summary}
                    onValueChange={(value) => setSearchBuilder(prev => ({ ...prev, summary: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select summary mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="true">true</SelectItem>
                      <SelectItem value="text">text</SelectItem>
                      <SelectItem value="data">data</SelectItem>
                      <SelectItem value="count">count</SelectItem>
                      <SelectItem value="false">false</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* URL Preview */}
            {searchBuilder.resourceType && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Preview URL</Label>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <code className="text-sm break-all">{getPreviewUrl()}</code>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetSearchBuilder}>
                Reset
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSearchBuilder(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={insertSearchIntoBuilder}
                  disabled={!searchBuilder.resourceType}
                  data-testid="insert-search"
                >
                  Insert into Request Builder
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Postman Collection Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Postman Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Paste Postman Collection JSON
              </Label>
              <Textarea
                placeholder="Paste your exported Postman collection JSON here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="h-64"
              />
            </div>
            
            <div className="text-xs text-gray-500">
              <p className="mb-2">Supported features:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Request methods (GET, POST, PUT, DELETE, etc.)</li>
                <li>URL paths and query parameters</li>
                <li>Headers (Authorization, Content-Type, etc.)</li>
                <li>Request bodies (JSON format preferred)</li>
                <li>Collection name and description</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImportData('')}>
                  Clear
                </Button>
                <Button
                  onClick={() => {
                    importPostmanCollection(importData);
                    setImportData('');
                    setShowImportDialog(false);
                  }}
                  disabled={!importData.trim()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}