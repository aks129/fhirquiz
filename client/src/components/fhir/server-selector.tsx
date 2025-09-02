import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { FhirServer } from "@/types/api";
import { testFhirServer } from "@/lib/fhir";
import { getSelectedServer, setSelectedServer } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

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

  const { data: servers = [] } = useQuery<FhirServer[]>({
    queryKey: ["/api/fhir/servers"],
  });

  const selectedServer = servers.find((s: FhirServer) => s.id === selectedServerId);

  useEffect(() => {
    if (selectedServer && onServerChange) {
      onServerChange(selectedServer);
    }
  }, [selectedServer, onServerChange]);

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
    const serverUrl = showCustom ? customUrl : selectedServer?.baseUrl;
    
    if (!serverUrl) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <i className="fas fa-server text-primary"></i>
          <span>FHIR Server Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {(selectedServer || customUrl) && (
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
        )}

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
