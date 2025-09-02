import { Card, CardContent } from "@/components/ui/card";

interface ProgressCardProps {
  day: number;
  title: string;
  description: string;
  completed: number;
  total: number;
  status: "complete" | "in-progress" | "pending";
}

export default function ProgressCard({ day, title, description, completed, total, status }: ProgressCardProps) {
  const percentage = (completed / total) * 100;
  
  const getStatusConfig = () => {
    switch (status) {
      case "complete":
        return {
          bgColor: "bg-green-500",
          textColor: "text-green-600",
          statusText: "Complete",
          statusBg: "bg-green-100",
          icon: "fas fa-check-circle text-green-500",
          progressColor: "bg-green-500",
        };
      case "in-progress":
        return {
          bgColor: "bg-amber-500",
          textColor: "text-amber-600", 
          statusText: "In Progress",
          statusBg: "bg-amber-100",
          icon: "fas fa-clock text-amber-500",
          progressColor: "bg-amber-500",
        };
      case "pending":
        return {
          bgColor: "bg-gray-400",
          textColor: "text-gray-500",
          statusText: "Pending",
          statusBg: "bg-gray-100",
          icon: "fas fa-circle text-gray-300",
          progressColor: "bg-gray-300",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow" data-testid={`progress-card-day${day}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${config.bgColor} text-white flex items-center justify-center font-semibold`}>
              {day}
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <i className={config.icon + " text-xl"}></i>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className={`${config.textColor} font-medium`}>
              {completed}/{total} {config.statusText}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className={`${config.progressColor} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
