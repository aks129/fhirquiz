import { Button } from "@/components/ui/button";
import { Flask } from "lucide-react";
import { useLocation } from "wouter";

interface OpenInSimulatorButtonProps {
  method?: string;
  path?: string;
  body?: any;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "sm" | "default" | "lg";
}

export default function OpenInSimulatorButton({ 
  method = "GET", 
  path = "/Patient", 
  body,
  className = "",
  variant = "outline",
  size = "sm"
}: OpenInSimulatorButtonProps) {
  const [, setLocation] = useLocation();

  const handleOpenInSimulator = () => {
    // Store the request data in localStorage to be picked up by the simulator
    const requestData = {
      method,
      path,
      headers: {},
      body
    };
    
    localStorage.setItem('simulator-prefill', JSON.stringify(requestData));
    
    // Navigate to simulator
    setLocation('/simulator');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleOpenInSimulator}
      className={`flex items-center gap-2 ${className}`}
      data-testid="open-in-simulator"
    >
      <Flask className="h-4 w-4" />
      Open in Simulator
    </Button>
  );
}