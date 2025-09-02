import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LabStepProps {
  stepNumber: number;
  title: string;
  description: string;
  status: "complete" | "in-progress" | "pending";
  children: ReactNode;
}

export default function LabStep({ stepNumber, title, description, status, children }: LabStepProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "complete":
        return {
          borderColor: "border-green-200",
          bgColor: "bg-green-50",
          iconColor: "text-green-500",
          icon: "fas fa-check-circle",
          statusText: "Complete",
          statusBg: "bg-green-100",
          statusTextColor: "text-green-600",
          titleColor: "text-green-800",
          descColor: "text-green-700",
        };
      case "in-progress":
        return {
          borderColor: "border-amber-200",
          bgColor: "bg-amber-50",
          iconColor: "text-amber-500",
          icon: "fas fa-clock",
          statusText: "In Progress",
          statusBg: "bg-amber-100",
          statusTextColor: "text-amber-600",
          titleColor: "text-amber-800",
          descColor: "text-amber-700",
        };
      case "pending":
        return {
          borderColor: "border-gray-200",
          bgColor: "bg-gray-50",
          iconColor: "text-gray-400",
          icon: "fas fa-circle",
          statusText: "Pending",
          statusBg: "bg-gray-200",
          statusTextColor: "text-gray-500",
          titleColor: "text-gray-600",
          descColor: "text-gray-600",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`border ${config.borderColor} rounded-lg p-4 ${config.bgColor}`} data-testid={`lab-step-${stepNumber}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <i className={`${config.icon} ${config.iconColor}`}></i>
          <h3 className={`font-medium ${config.titleColor}`}>
            Step {stepNumber}: {title}
          </h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${config.statusBg} ${config.statusTextColor}`}>
          {config.statusText}
        </span>
      </div>
      
      <p className={`text-sm ${config.descColor} mb-4`}>{description}</p>
      
      <div className={status === "pending" ? "opacity-60 pointer-events-none" : ""}>
        {children}
      </div>
    </div>
  );
}
