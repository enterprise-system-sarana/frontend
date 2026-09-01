import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTERS } from "@/constants/Route";
import {
  ArrowLeft,
  Home,
  Package,
  ShoppingCart,
  Boxes,
} from "lucide-react";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  const quickLinks = [
    {
      title: "Products",
      description: "Manage catalog, models, and variants",
      icon: Package,
      path: ROUTERS.PRODUCT,
    },
    {
      title: "Purchases",
      description: "Track supplier orders and records",
      icon: ShoppingCart,
      path: ROUTERS.PURCHASE,
    },
    {
      title: "Stock",
      description: "View real-time store inventories",
      icon: Boxes,
      path: ROUTERS.STOCK,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full py-12 px-4 text-center select-none animate-in fade-in-50 duration-300">
      {/* Background Decorative Aura */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent blur-2xl -z-10" />
        
        <div className="flex items-center justify-center">
          <span className="text-8xl sm:text-9xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground via-foreground/70 to-foreground/20 font-mono">
            404
          </span>
        </div>

        {/* <div className="absolute -bottom-2 right-1/2 translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold shadow-xs">
          <HelpCircle className="h-3.5 w-3.5" />
          Page Not Found
        </div> */}
      </div>

      {/* Main Title and Message */}
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2 mt-4">
        Oops! Page not found
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        The page you are looking for doesn't exist, may have been removed, or is temporarily unavailable.
      </p>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        <Button
          onClick={() => navigate(ROUTERS.DASHBOARD)}
          className="rounded-md gap-2 h-10 px-5 shadow-xs"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="rounded-md gap-2 h-10 px-5 border-border/80"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>

      {/* Helpful Navigation Cards */}
      <div className="w-full max-w-2xl border-t border-border/60 pt-8">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Or explore helpful sections:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.title}
                type="button"
                onClick={() => navigate(link.path)}
                className="group flex flex-col p-4 rounded-md border border-border/60 bg-card/60 hover:bg-muted/50 hover:border-primary/40 transition-all duration-200 shadow-2xs cursor-pointer"
              >
                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.title}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {link.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
