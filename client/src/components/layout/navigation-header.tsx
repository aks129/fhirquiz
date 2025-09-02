import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { FhirServer } from "@/types/api";
import { testFhirServer } from "@/lib/fhir";
import { getSelectedServer, setSelectedServer } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export default function NavigationHeader() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [selectedServerId, setSelectedServerId] = useState(getSelectedServer() || "");
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { data: servers = [] } = useQuery<FhirServer[]>({
    queryKey: ["/api/fhir/servers"],
  });

  const selectedServer = servers.find((s: FhirServer) => s.id === selectedServerId);

  const handleServerChange = (serverId: string) => {
    setSelectedServerId(serverId);
    setSelectedServer(serverId);
  };

  const handleTestConnection = async () => {
    if (!selectedServer) {
      toast({
        title: "Error",
        description: "Please select a FHIR server first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      const result = await testFhirServer(selectedServer.baseUrl);
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to ${selectedServer.name} (${result.fhirVersion}) in ${result.responseTime}ms`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const navItems = [
    { path: "/overview", label: "Overview" },
    { path: "/lab", label: "Labs" },
    { path: "/resources", label: "Resources" },
    { path: "/gallery", label: "Results Gallery" },
  ];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <i className="fas fa-heartbeat text-2xl text-primary"></i>
              <h1 className="text-xl font-bold text-foreground">FHIR Healthcare Bootcamp</h1>
            </Link>
            <span className="hidden sm:inline-block text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Interactive Learning Platform
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                href={item.path}
                className={`text-sm font-medium transition-colors ${
                  location.startsWith(item.path) 
                    ? "text-foreground" 
                    : "text-muted-foreground hover:text-primary"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <Select value={selectedServerId} onValueChange={handleServerChange}>
              <SelectTrigger className="w-64" data-testid="select-fhir-server">
                <SelectValue placeholder="Select FHIR Server" />
              </SelectTrigger>
              <SelectContent>
                {servers.map((server: FhirServer) => (
                  <SelectItem key={server.id} value={server.id}>
                    {server.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleTestConnection}
              disabled={!selectedServer || isTestingConnection}
              data-testid="button-test-connection"
            >
              <i className="fas fa-satellite-dish mr-2"></i>
              {isTestingConnection ? "Testing..." : "Test Connection"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
