import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900" data-testid="authenticated-layout">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}