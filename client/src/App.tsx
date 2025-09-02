import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Overview from "@/pages/overview";
import Day1Lab from "@/pages/day1-lab";
import Day2Lab from "@/pages/day2-lab";
import Day3Lab from "@/pages/day3-lab";
import Resources from "@/pages/resources";
import ResultsGallery from "@/pages/results-gallery";
import Troubleshooting from "@/pages/troubleshooting";
import { QuizDay1 } from "@/pages/quiz-day1";
import { QuizDay2 } from "@/pages/quiz-day2";
import { QuizDay3 } from "@/pages/quiz-day3";
import { QuizFhir } from "@/pages/quiz-fhir";
import ByodPage from "@/pages/byod";
import MiniAppPage from "@/pages/mini-app";
import DemoPage from "@/pages/demo";
import AdminDashboard from "@/pages/AdminDashboard";
import InstructorDashboard from "@/pages/InstructorDashboard";
import Catalog from "@/pages/Catalog";
import BillingSuccess from "@/pages/BillingSuccess";
import BillingCancel from "@/pages/BillingCancel";
import Rewards from "@/pages/rewards";
import Profile from "@/pages/profile";
import Auth from "@/pages/auth";
import Portal from "@/pages/Portal";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import NavigationHeader from "@/components/layout/navigation-header";
import SidebarNavigation from "@/components/layout/sidebar-navigation";
import MarketingHeader from "@/components/layout/marketing-header";
import SEOHead from "@/components/seo-head";
import DemoBanner from "@/components/demo-banner";

function Router() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Determine if we're in marketing mode or app mode
  const marketingPaths = ["/", "/curriculum", "/pricing", "/docs", "/terms", "/privacy", "/contact"];
  const isMarketingMode = marketingPaths.includes(location) || (!user && location === "/");
  
  // Handle portal routing
  const isPortalPath = location === "/portal";
  if (isPortalPath && !user) {
    // Redirect unauthenticated users to auth
    window.location.href = "/auth";
    return null;
  }

  // Marketing mode layout
  if (isMarketingMode) {
    return (
      <div className="min-h-screen">
        <SEOHead />
        <MarketingHeader />
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/curriculum" component={() => <div>Curriculum page</div>} />
          <Route path="/pricing" component={() => <div>Pricing page</div>} />
          <Route path="/docs" component={() => <div>Documentation page</div>} />
          <Route path="/terms" component={() => <div>Terms page</div>} />
          <Route path="/privacy" component={() => <div>Privacy page</div>} />
          <Route path="/contact" component={() => <div>Contact page</div>} />
          <Route component={NotFound} />
        </Switch>
      </div>
    );
  }

  // Check if we're in portal mode (new authenticated dashboard)
  const portalPaths = ["/portal", "/bootcamp", "/byod", "/gallery", "/rewards", "/billing", "/profile", "/help"];
  const isPortalMode = portalPaths.some(path => location.startsWith(path));

  if (isPortalMode && user) {
    return (
      <AuthenticatedLayout>
        <Switch>
          <Route path="/portal" component={Portal} />
          <Route path="/bootcamp" component={Overview} />
          <Route path="/byod" component={ByodPage} />
          <Route path="/gallery" component={ResultsGallery} />
          <Route path="/rewards" component={Rewards} />
          <Route path="/billing/success" component={BillingSuccess} />
          <Route path="/billing/cancel" component={BillingCancel} />
          <Route path="/profile" component={Profile} />
          <Route path="/help" component={() => <div className="p-6"><h1>Help & Support</h1><p>Coming soon...</p></div>} />
          <Route component={NotFound} />
        </Switch>
      </AuthenticatedLayout>
    );
  }

  // App mode layout (authenticated or app paths)
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <NavigationHeader />
      <div className="flex max-w-7xl mx-auto">
        <SidebarNavigation />
        <main className="flex-1 p-6 lg:p-8">
          <DemoBanner />
          <Switch>
            <Route path="/overview" component={Overview} />
            <Route path="/lab" component={() => { window.location.href = "/lab/day1"; return null; }} />
            <Route path="/lab/day1" component={Day1Lab} />
            <Route path="/lab/day2" component={Day2Lab} />
            <Route path="/lab/day3" component={Day3Lab} />
            <Route path="/quiz/day1" component={QuizDay1} />
            <Route path="/quiz/day2" component={QuizDay2} />
            <Route path="/quiz/day3" component={QuizDay3} />
            <Route path="/quiz/fhir" component={QuizFhir} />
            <Route path="/mini-app/:id" component={MiniAppPage} />
            <Route path="/demo" component={DemoPage} />
            <Route path="/resources" component={Resources} />
            <Route path="/troubleshooting" component={Troubleshooting} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/instructor" component={InstructorDashboard} />
            <Route path="/catalog" component={Catalog} />
            <Route path="/auth" component={Auth} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
