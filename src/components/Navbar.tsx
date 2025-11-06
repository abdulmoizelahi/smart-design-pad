import { Home, LayoutDashboard, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Digital Build
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <Button variant="default" className="gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
