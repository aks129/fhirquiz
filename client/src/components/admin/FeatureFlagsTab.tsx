import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Flag, Clock, User, Settings } from "lucide-react";

interface FeatureFlag {
  id: string;
  flagKey: string;
  flagName: string;
  description: string | null;
  isEnabled: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

export function FeatureFlagsTab() {
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch feature flags
  const { data: flags = [], isLoading } = useQuery({
    queryKey: ['/api/admin/feature-flags'],
    retry: false
  });

  // Update feature flag mutation
  const updateMutation = useMutation({
    mutationFn: async ({ flagKey, isEnabled }: { flagKey: string; isEnabled: boolean }) => {
      return apiRequest('PUT', `/api/admin/feature-flags/${flagKey}`, { isEnabled });
    },
    onMutate: ({ flagKey }) => {
      setPendingUpdates(prev => new Set(prev.add(flagKey)));
    },
    onSuccess: (_, { flagKey }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['/config/features'] });
      toast({ 
        title: "Feature flag updated", 
        description: `Successfully updated ${flagKey}` 
      });
    },
    onError: (error, { flagKey }) => {
      toast({ 
        title: "Failed to update feature flag", 
        description: error.message,
        variant: "destructive" 
      });
    },
    onSettled: (_, __, { flagKey }) => {
      setPendingUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(flagKey);
        return newSet;
      });
    }
  });

  const handleToggle = (flagKey: string, isEnabled: boolean) => {
    updateMutation.mutate({ flagKey, isEnabled });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFlagDescription = (flagKey: string) => {
    switch (flagKey) {
      case 'enableDemo':
        return 'Controls visibility of demo mode and simulation features in navigation';
      case 'enableBYOD':
        return 'Controls access to Bring Your Own Data functionality';
      case 'enableDeepDive':
        return 'Controls access to advanced deep dive learning modules';
      case 'enableCertificates':
        return 'Controls certificate generation and rewards features';
      default:
        return 'Custom feature flag';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Feature Flags</h2>
          <p className="text-muted-foreground">
            Control application features and navigation visibility at runtime
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] })}
          disabled={isLoading}
        >
          <Settings className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading feature flags...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {flags.map((flag: FeatureFlag) => (
            <Card key={flag.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flag className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{flag.flagName}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={flag.isEnabled ? "default" : "secondary"}>
                      {flag.isEnabled ? "ENABLED" : "DISABLED"}
                    </Badge>
                    <Switch
                      checked={flag.isEnabled}
                      onCheckedChange={(checked) => handleToggle(flag.flagKey, checked)}
                      disabled={pendingUpdates.has(flag.flagKey)}
                      data-testid={`switch-${flag.flagKey}`}
                    />
                  </div>
                </div>
                <CardDescription>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{flag.flagKey}</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {flag.description || getFlagDescription(flag.flagKey)}
                </p>
                
                <Separator />
                
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Last updated: {formatDate(flag.updatedAt)}</span>
                  </div>
                  {flag.updatedBy && (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>Updated by: {flag.updatedBy}</span>
                    </div>
                  )}
                </div>

                {pendingUpdates.has(flag.flagKey) && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-md border">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Updating...</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">How Feature Flags Work</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
          <p>• <strong>Real-time Updates:</strong> Changes take effect immediately for new requests</p>
          <p>• <strong>Navigation Control:</strong> Flags control which menu items and features are visible</p>
          <p>• <strong>API Access:</strong> Public endpoint at <code>/config/features</code> provides flag states</p>
          <p>• <strong>Frontend Integration:</strong> Components check flags on boot and hide/show features accordingly</p>
        </CardContent>
      </Card>
    </div>
  );
}