import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getResourceStats } from "@/lib/fhir";
import { useToast } from "@/hooks/use-toast";

interface ResourceStatsProps {
  fhirServerUrl?: string;
  patientId?: string;
}

export default function ResourceStats({ fhirServerUrl, patientId }: ResourceStatsProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    patients: 0,
    encounters: 0,
    observations: 0,
    lastUpdated: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRefreshStats = async () => {
    if (!fhirServerUrl) {
      toast({
        title: "Error",
        description: "No FHIR server selected",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await getResourceStats(fhirServerUrl, patientId);
      setStats(result);
      toast({
        title: "Stats Updated",
        description: "Resource counts refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch stats",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statItems = [
    {
      label: "Patients",
      value: stats.patients,
      icon: "fas fa-user",
      color: "text-blue-500",
    },
    {
      label: "Encounters", 
      value: stats.encounters,
      icon: "fas fa-hospital",
      color: "text-green-500",
    },
    {
      label: "Observations",
      value: stats.observations,
      icon: "fas fa-microscope", 
      color: "text-purple-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <i className="fas fa-chart-bar text-primary"></i>
          <span>FHIR Resource Counts</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statItems.map((item) => (
            <div 
              key={item.label}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
              data-testid={`stat-${item.label.toLowerCase()}`}
            >
              <div className="flex items-center space-x-3">
                <i className={`${item.icon} ${item.color}`}></i>
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-lg font-bold text-foreground">{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
        
        <Button 
          onClick={handleRefreshStats}
          disabled={isLoading || !fhirServerUrl}
          className="w-full mt-4"
          data-testid="button-refresh-stats"
        >
          <i className="fas fa-sync-alt mr-2"></i>
          {isLoading ? "Refreshing..." : "Refresh Counts"}
        </Button>

        {stats.lastUpdated && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Last updated: {new Date(stats.lastUpdated).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
