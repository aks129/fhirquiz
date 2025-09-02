import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MiniAppDisplay } from "@/components/byod/mini-app-display";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import type { GeneratedApp } from "@shared/schema";

export default function MiniAppPage() {
  const params = useParams();
  const appId = params.id;

  const { data: apps, isLoading, error } = useQuery<GeneratedApp[]>({
    queryKey: ["/api/byod/apps"],
    retry: false
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your mini-app...</p>
        </div>
      </div>
    );
  }

  if (error || !apps) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">App Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The mini-app you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/byod">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to BYOD
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const app = apps.find(a => a.id === appId);

  if (!app) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">App Not Available</h2>
            <p className="text-muted-foreground mb-4">
              This mini-app hasn't been generated yet or is still processing.
            </p>
            <Link href="/byod">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to BYOD
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MiniAppDisplay
        appId={app.id}
        appName={app.appName}
        appType={app.appType}
        config={app.config}
        className="w-full"
      />
    </div>
  );
}