import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard,
  BookOpen,
  Upload,
  Images,
  Award,
  CreditCard,
  User,
  HelpCircle,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useSessionStore } from "@/stores/sessionStore";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface SidebarProps {
  className?: string;
}

const allNavigationItems = [
  { name: 'Dashboard', href: '/portal', icon: LayoutDashboard, requiresFlag: null },
  { name: 'Courses', href: '/bootcamp', icon: BookOpen, requiresFlag: null },
  { name: 'BYOD', href: '/byod', icon: Upload, requiresFlag: 'enableBYOD' },
  { name: 'Results Gallery', href: '/gallery', icon: Images, requiresFlag: null },
  { name: 'Rewards', href: '/rewards', icon: Award, requiresFlag: 'enableCertificates' },
  { name: 'Billing', href: '/billing', icon: CreditCard, requiresFlag: null },
  { name: 'Profile', href: '/profile', icon: User, requiresFlag: null },
  { name: 'Help', href: '/help', icon: HelpCircle, requiresFlag: null },
] as const;

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location] = useLocation();
  const { clear, user, profile } = useSessionStore();
  const { flags } = useFeatureFlags();

  // Filter navigation items based on feature flags
  const navigation = allNavigationItems.filter(item => {
    if (!item.requiresFlag) return true;
    return flags[item.requiresFlag];
  });

  const handleSignOut = () => {
    clear();
    window.location.href = '/';
  };

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )} data-testid="sidebar">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FB</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">FHIR Bootcamp</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2"
          data-testid="sidebar-toggle"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* User Profile */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 dark:text-white truncate" data-testid="sidebar-user-name">
                {profile?.full_name || user?.email?.split('@')[0] || 'Student'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400" data-testid="sidebar-user-points">
                {profile?.fhir_points || 0} FHIR Points
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href === '/portal' && location === '/') ||
              (item.href !== '/portal' && location.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      isCollapsed ? "px-2" : "px-3",
                      isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : ""
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <item.icon className={cn("w-5 h-5", isCollapsed ? "mx-auto" : "")} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start gap-3 h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20",
            isCollapsed ? "px-2" : "px-3"
          )}
          data-testid="sidebar-signout"
        >
          <LogOut className={cn("w-5 h-5", isCollapsed ? "mx-auto" : "")} />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}