import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MiniAppDisplay } from "@/components/byod/mini-app-display";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ByodAppPage() {
  const params = useParams();
  const appId = params.id;

  const { data: appData, isLoading, error } = useQuery({
    queryKey: [`/api/byod/app/${appId}`],
    enabled: !!appId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Loading your mini-app...</p>
        </div>
      </div>
    );
  }

  if (error || !appData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">App Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The mini-app you're looking for doesn't exist or has been removed.
            </p>
            <a href="/byod" className="text-blue-600 hover:underline">
              Go back to BYOD
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MiniAppDisplay
        appId={appData.id}
        appName={appData.appName}
        appType={appData.appType}
        config={appData.config}
        data={appData.data}
      />
    </div>
  );
}