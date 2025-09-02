import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
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
import NavigationHeader from "@/components/layout/navigation-header";
import SidebarNavigation from "@/components/layout/sidebar-navigation";

function Router() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <NavigationHeader />
      <div className="flex max-w-7xl mx-auto">
        <SidebarNavigation />
        <main className="flex-1 p-6 lg:p-8">
          <Switch>
            <Route path="/" component={Overview} />
            <Route path="/overview" component={Overview} />
            <Route path="/lab" component={() => { window.location.href = "/lab/day1"; return null; }} />
            <Route path="/lab/day1" component={Day1Lab} />
            <Route path="/lab/day2" component={Day2Lab} />
            <Route path="/lab/day3" component={Day3Lab} />
            <Route path="/quiz/day1" component={QuizDay1} />
            <Route path="/quiz/day2" component={QuizDay2} />
            <Route path="/quiz/day3" component={QuizDay3} />
            <Route path="/quiz/fhir" component={QuizFhir} />
            <Route path="/byod" component={ByodPage} />
            <Route path="/mini-app/:id" component={MiniAppPage} />
            <Route path="/demo" component={DemoPage} />
            <Route path="/resources" component={Resources} />
            <Route path="/gallery" component={ResultsGallery} />
            <Route path="/troubleshooting" component={Troubleshooting} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
