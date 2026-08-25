import { ShieldAlert, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  resource?: string;
  showBackButton?: boolean;
  className?: string;
}

export function AccessDenied({
  title = "Access Denied",
  message,
  resource,
  showBackButton = false,
  className = "min-h-[50vh]",
}: AccessDeniedProps) {
  const navigate = useNavigate();

  const displayMessage =
    message ||
    (resource
      ? `You do not have permission to view or access ${resource}.`
      : "You do not have permission to access this page or perform this action. Please contact your system administrator.");

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 ${className}`}
    >
      <div className="relative mb-4 flex items-center justify-center">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-xs ring-8 ring-destructive/5">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs">
          <Lock className="h-3 w-3" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground font-heading tracking-tight mb-1.5">
        {title}
      </h2>

      <p className="text-muted-foreground text-xs max-w-sm leading-relaxed mb-4">
        {displayMessage}
      </p>

      {showBackButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-xs h-8 px-3 rounded-lg border-border/80"
        >
          Go Back
        </Button>
      )}
    </div>
  );
}

export default AccessDenied;
