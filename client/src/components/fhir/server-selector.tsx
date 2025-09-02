import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FhirServer } from "@/types/api";
import { testFhirServer } from "@/lib/fhir";
import { getSelectedServer, setSelectedServer } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ServerSelectorProps {
  onServerChange?: (server: any) => void;
}

export default function ServerSelector({ onServerChange }: ServerSelectorProps) {
  const { toast } = useToast();
  const [selectedServerId, setSelectedServerId] = useState(getSelectedServer() || "");
  const [customUrl, setCustomUrl] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [useLocalFhir, setUseLocalFhir] = useState(() => 
    localStorage.getItem('useLocalFhir') === 'true'
  );

  const { data: servers = [] } = useQuery<FhirServer[]>({
    queryKey: ["/api/fhir/servers"],
  });

  // Query for FHIR base URL status
  const { data: fhirConfig } = useQuery({
    queryKey: ["/ops/fhir-base"],
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Mutation to toggle local FHIR usage
  const localFhirMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest('/ops/use-local-fhir', {
        method: 'POST',
        body: { enabled }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "FHIR Server Updated",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update FHIR server preference",
        variant: "destructive",
      });
    }
  });

  const selectedServer = servers.find((s: FhirServer) => s.id === selectedServerId);

  useEffect(() => {
    console.log('ServerSelector selectedServer changed:', selectedServer);
    if (selectedServer && onServerChange) {
      console.log('Calling onServerChange with:', selectedServer);
      onServerChange(selectedServer);
    }
  }, [selectedServer, onServerChange]);

  const handleLocalFhirToggle = (enabled: boolean) => {
    setUseLocalFhir(enabled);
    localStorage.setItem('useLocalFhir', enabled.toString());
    localFhirMutation.mutate(enabled);
  };

  const handleServerChange = (value: string) => {
    if (value === "custom") {
      setShowCustom(true);
      setSelectedServerId("");
    } else {
      setSelectedServerId(value);
      setSelectedServer(value);
      setShowCustom(false);
      setConnectionResult(null);
    }
  };

  const handleTestConnection = async () => {
    let serverUrl: string;
    
    if (useLocalFhir || fhirConfig?.useLocalFhir) {
      // Use local FHIR server
      serverUrl = fhirConfig?.localFhirUrl || 'http://localhost:8080/fhir';
    } else if (showCustom) {
      // Use custom URL
      serverUrl = customUrl;
    } else if (selectedServer) {
      // Use selected server
      serverUrl = selectedServer.baseUrl;
    } else {
      toast({
        title: "Error",
        description: "Please select a server or enter a custom URL",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      const result = await testFhirServer(serverUrl);
      setConnectionResult(result);
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to FHIR server (${result.fhirVersion}) in ${result.responseTime}ms`,
        });
        
        // Mark server setup as complete
        fetch("/api/lab/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-ID": localStorage.getItem('fhir-bootcamp-session') || '',
          },
          body: JSON.stringify({
            labDay: 1,
            stepName: "server_setup",
            completed: true,
          }),
        });
        
        // Force update the parent with the current server state
        if (onServerChange) {
          const currentServer = servers.find((s: FhirServer) => s.id === selectedServerId);
          if (currentServer) {
            console.log('Forcing server change callback with:', currentServer);
            // Use setTimeout to ensure this happens after the current render cycle
            setTimeout(() => {
              onServerChange(currentServer);
            }, 100);
          }
        }
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionResult({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Get active server info for display
  const getActiveServerInfo = () => {
    if (fhirConfig?.useLocalFhir) {
      return {
        name: "Local HAPI",
        url: fhirConfig.localFhirUrl,
        isLocal: true
      };
    }
    if (selectedServer) {
      return {
        name: selectedServer.name,
        url: selectedServer.baseUrl,
        isLocal: false
      };
    }
    return {
      name: "Public HAPI",
      url: fhirConfig?.fallbackUrl || "https://hapi.fhir.org/baseR4",
      isLocal: false
    };
  };

  const activeServer = getActiveServerInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="fas fa-server text-primary"></i>
            <span>FHIR Server Configuration</span>
          </div>
          <Badge variant={activeServer.isLocal ? "default" : "secondary"}>
            Active: {activeServer.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Local FHIR Toggle */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="local-fhir-toggle" className="font-medium">
              Use Local FHIR (Docker)
            </Label>
            <p className="text-xs text-muted-foreground">
              Override server selection with local HAPI instance
            </p>
          </div>
          <Switch
            id="local-fhir-toggle"
            checked={useLocalFhir}
            onCheckedChange={handleLocalFhirToggle}
            disabled={localFhirMutation.isPending}
            data-testid="switch-local-fhir"
          />
        </div>
        <div>
          <Label htmlFor="server-select">Select FHIR Server</Label>
          <Select value={selectedServerId} onValueChange={handleServerChange}>
            <SelectTrigger data-testid="select-fhir-server">
              <SelectValue placeholder="Choose a FHIR server..." />
            </SelectTrigger>
            <SelectContent>
              {servers.map((server: FhirServer) => (
                <SelectItem key={server.id} value={server.id}>
                  {server.name}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom Server...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showCustom && (
          <div>
            <Label htmlFor="custom-url">Custom FHIR Server URL</Label>
            <Input
              id="custom-url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://your-fhir-server.com/fhir/R4"
              data-testid="input-custom-url"
            />
          </div>
        )}

        {/* Test Connection Button - Always visible */}
        <div className="space-y-3">
          <Button 
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="w-full"
            data-testid="button-test-connection"
          >
            <i className="fas fa-satellite-dish mr-2"></i>
            {isTestingConnection ? "Testing Connection..." : "Test Connection"}
          </Button>

          {connectionResult && (
            <div className={`p-3 rounded-lg border ${
              connectionResult.success 
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}>
              <div className="flex items-center space-x-2">
                <i className={`fas ${connectionResult.success ? "fa-check-circle" : "fa-times-circle"}`}></i>
                <span className="font-medium">
                  {connectionResult.success ? "Connection Successful" : "Connection Failed"}
                </span>
              </div>
              {connectionResult.success && (
                <div className="mt-2 text-sm">
                  <div>FHIR Version: {connectionResult.fhirVersion}</div>
                  <div>Response Time: {connectionResult.responseTime}ms</div>
                </div>
              )}
              {connectionResult.error && (
                <div className="mt-2 text-sm">{connectionResult.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Local FHIR Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
            <div>
              <p className="text-sm text-blue-700 font-medium">Local FHIR Server</p>
              <p className="text-xs text-blue-600">
                Local endpoint is http://localhost:8080/fhir. Run <code className="bg-blue-100 px-1 rounded">make up</code> to start Docker. 
                Public endpoints remain available if local is off.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <i className="fas fa-shield-alt text-amber-600 mt-0.5"></i>
            <div>
              <p className="text-sm text-amber-700 font-medium">Safety Notice</p>
              <p className="text-xs text-amber-600">Never use real patient data (PII/PHI) on public test servers. This bootcamp uses only synthetic data.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
