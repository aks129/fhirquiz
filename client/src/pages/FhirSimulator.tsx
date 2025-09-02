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
import { Play, Save, Trash2, Clock, Download, Upload, FileText, ArrowDown } from "lucide-react";
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
  const [loading, setLoading] = useState(false);

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
      // Substitute environment variables in all text fields
      const processedRequest = {
        ...data,
        path: substituteEnvVars(data.path),
        queryParams: Object.fromEntries(
          Object.entries(data.queryParams).map(([key, value]) => [key, substituteEnvVars(value)])
        ),
        headers: Object.fromEntries(
          Object.entries(data.headers).map(([key, value]) => [key, substituteEnvVars(value)])
        ),
        body: data.body ? (typeof data.body === 'string' ? substituteEnvVars(data.body) : data.body) : undefined
      };

      return apiRequest("POST", "/sim/send", processedRequest);
    },
    onSuccess: (response) => {
      setResponse(response);
      queryClient.invalidateQueries({ queryKey: ["/sim/history"] });
    },
    onError: (error) => {
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

    setLoading(true);
    try {
      await sendRequestMutation.mutateAsync(request);
    } finally {
      setLoading(false);
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

  const loadSample = (sample: any) => {
    setRequest({
      method: sample.method,
      path: sample.path,
      queryParams: {},
      headers: {},
      body: sample.body,
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FHIR Simulator</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Test and experiment with FHIR API requests in a safe environment
          </p>
          {fhirConfig && (
            <div className="mt-2">
              <Badge variant="outline" className="text-sm">
                Connected to: {(fhirConfig as any)?.useLocalFhir ? 'Local HAPI' : 'Public HAPI'}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                <Button
      
                                  variant="ghost"
                                  onClick={() => deleteCollectionMutation.mutate(collection.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                  <CardHeader>
                    <CardTitle className="text-lg">Sample Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {SAMPLE_REQUESTS.map((sample, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => loadSample(sample)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {sample.method}
                              </Badge>
                              <h4 className="font-medium text-sm">{sample.name}</h4>
                            </div>
                            <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-1">
                              {sample.path}
                            </p>
                            <p className="text-xs text-gray-500">{sample.description}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="challenges" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">FHIR Challenges</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                          <h4 className="font-medium text-blue-900 dark:text-blue-300">
                            🔍 Challenge 1: Find Patient Demographics
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                            Search for patients born after 1990 and retrieve their basic demographics.
                          </p>
                        </div>
                        
                        <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                          <h4 className="font-medium text-green-900 dark:text-green-300">
                            📊 Challenge 2: Vital Signs Analysis
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                            Find all heart rate observations for a specific patient and calculate the average.
                          </p>
                        </div>
                        
                        <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                          <h4 className="font-medium text-purple-900 dark:text-purple-300">
                            🏥 Challenge 3: Encounter Tracking
                          </h4>
                          <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">
                            Retrieve all encounters for a patient and identify the most recent hospitalization.
                          </p>
                        </div>
                        
                        <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                          <h4 className="font-medium text-orange-900 dark:text-orange-300">
                            💊 Challenge 4: Medication History
                          </h4>
                          <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                            Create a medication request and link it to a patient encounter.
                          </p>
                        </div>
                      </div>
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
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Request Body</Label>
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
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button 
                    onClick={handleSendRequest}
                    disabled={loading || !request.path}
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
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                    <span className="ml-2">Sending request...</span>
                  </div>
                ) : response ? (
                  <ScrollArea className="h-[400px]">
                    <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
                      {formatJson(response.body)}
                    </pre>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ArrowDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Send a request to see the response here
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}