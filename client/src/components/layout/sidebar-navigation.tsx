import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { LabProgress } from "@/types/api";
import { getSessionId } from "@/lib/fhir";

export default function SidebarNavigation() {
  const [location] = useLocation();
  
  const { data: progress = [] } = useQuery<LabProgress[]>({
    queryKey: ["/api/lab/progress"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getProgressForDay = (day: number) => {
    const dayProgress = progress.filter((p: LabProgress) => p.labDay === day);
    const completed = dayProgress.filter((p: LabProgress) => p.completed).length;
    const total = dayProgress.length || 3; // Default to 3 steps per day
    return { completed, total, percentage: (completed / total) * 100 };
  };

  const isStepCompleted = (stepName: string) => {
    return progress.some((p: LabProgress) => p.stepName === stepName && p.completed);
  };

  const day1Progress = getProgressForDay(1);
  const day2Progress = getProgressForDay(2);
  const day3Progress = getProgressForDay(3);

  const navigationItems = [
    {
      id: "overview",
      path: "/overview",
      label: "Overview",
      icon: "fas fa-play-circle",
      completed: true,
    },
    {
      id: "day1",
      path: "/lab/day1", 
      label: "Day 1: Ingest & Land",
      icon: "1",
      completed: day1Progress.completed === day1Progress.total,
      progress: day1Progress,
      steps: [
        { name: "Server Setup", completed: isStepCompleted("server_setup") },
        { name: "Bundle Upload", completed: isStepCompleted("bundle_upload") },
        { name: "Export CSVs", completed: isStepCompleted("csv_export") },
      ],
    },
    {
      id: "day2",
      path: "/lab/day2",
      label: "Day 2: Transform & Analyze", 
      icon: "2",
      completed: day2Progress.completed === day2Progress.total,
      progress: day2Progress,
      locked: day1Progress.percentage < 100,
    },
    {
      id: "day3",
      path: "/lab/day3",
      label: "Day 3: Operationalize",
      icon: "3", 
      completed: day3Progress.completed === day3Progress.total,
      progress: day3Progress,
      locked: day2Progress.percentage < 100,
    },
    {
      id: "resources",
      path: "/resources",
      label: "Resources",
      icon: "fas fa-book-open",
    },
    {
      id: "gallery",
      path: "/gallery",
      label: "Results Gallery",
      icon: "fas fa-trophy",
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border min-h-screen sticky top-16">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Course Progress</h2>
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <div key={item.id} className="space-y-1">
              <Link href={item.path}>
                <button 
                  className={`w-full flex items-center justify-between text-left p-3 rounded-lg transition-colors ${
                    location === item.path 
                      ? "bg-accent text-accent-foreground font-medium"
                      : item.locked
                      ? "text-muted-foreground cursor-not-allowed opacity-60"
                      : "hover:bg-accent"
                  }`}
                  disabled={item.locked}
                  data-testid={`nav-${item.id}`}
                >
                  <span className="flex items-center space-x-3">
                    {item.icon.startsWith("fas") ? (
                      <i className={`${item.icon} text-primary`}></i>
                    ) : (
                      <div className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-medium ${
                        item.id === "day1" ? "bg-green-500" :
                        item.id === "day2" ? "bg-amber-500" :
                        item.id === "day3" ? "bg-purple-500" : "bg-gray-500"
                      }`}>
                        {item.icon}
                      </div>
                    )}
                    <span>{item.label}</span>
                  </span>
                  {item.completed ? (
                    <i className="fas fa-check-circle text-green-500"></i>
                  ) : item.progress ? (
                    <i className={`fas fa-circle ${
                      item.progress.percentage > 0 ? "text-amber-500" : "text-gray-300"
                    }`}></i>
                  ) : null}
                </button>
              </Link>
              
              {item.steps && location === item.path && (
                <div className="ml-9 space-y-1 text-sm">
                  {item.steps.map((step, index) => (
                    <div 
                      key={index}
                      className="flex items-center space-x-2 p-2 text-muted-foreground"
                      data-testid={`step-${step.name.toLowerCase().replace(' ', '-')}`}
                    >
                      <i className={`fas ${step.completed ? "fa-check text-green-500" : "fa-circle text-amber-500"}`}></i>
                      <span>{step.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
