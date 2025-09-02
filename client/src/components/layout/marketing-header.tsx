import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { Menu, Shield } from "lucide-react";

export default function MarketingHeader() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Curriculum", path: "/curriculum" },
    { label: "Pricing", path: "/pricing" },
    { label: "Demo", path: "/demo" },
    { label: "Docs", path: "/docs" }
  ];

  const handlePortalClick = () => {
    if (user) {
      setLocation("/portal");
    } else {
      setLocation("/auth");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">FHIR Bootcamp</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Portal Button */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={handlePortalClick}
              variant={user ? "default" : "outline"}
              data-testid="portal-button"
            >
              {user ? "Go to Portal" : "Sign In"}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => {
                        handlePortalClick();
                        setIsOpen(false);
                      }}
                      className="w-full"
                      variant={user ? "default" : "outline"}
                    >
                      {user ? "Go to Portal" : "Sign In"}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}