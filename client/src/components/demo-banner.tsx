import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/sessionStore";
import { useLocation } from "wouter";
import { Sparkles, LogOut } from "lucide-react";

export default function DemoBanner() {
  const { isDemoMode, clear } = useSessionStore();
  const [, setLocation] = useLocation();

  if (!isDemoMode) return null;

  const exitDemoMode = () => {
    clear();
    localStorage.removeItem('demo-mode');
    localStorage.removeItem('demo-lab-progress');
    localStorage.removeItem('demo-quiz-attempts');
    localStorage.removeItem('demo-certificates');
    localStorage.removeItem('demo-badges');
    setLocation("/");
  };

  return (
    <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 mb-4">
      <Sparkles className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-orange-800 dark:text-orange-200">
              🎮 You are in Demo Mode
            </span>
            <span className="text-orange-700 dark:text-orange-300 ml-2">
              Read-only for billing/admin features. Limited data persists locally.
            </span>
          </div>
          <Button
            onClick={exitDemoMode}
            variant="outline"
            size="sm"
            className="text-orange-600 border-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Exit Demo
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}