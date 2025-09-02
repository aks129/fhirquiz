import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TrialBanner } from "../common/TrialBanner";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900" data-testid="authenticated-layout">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-4">
          <TrialBanner />
        </div>
        {children}
      </main>
    </div>
  );
}