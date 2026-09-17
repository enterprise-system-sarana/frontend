import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "flex h-11 w-full min-w-0 rounded-md",
        "border border-border/70",
        "bg-background",
        "px-3.5 py-2",
        "text-sm text-foreground",

        // Placeholder
        "placeholder:text-muted-foreground/60",

        // Smooth animation
        "transition-all duration-200 ease-out",

        // Remove default browser outline
        "outline-none",

        // File input
        "file:inline-flex file:h-7 file:border-0",
        "file:bg-transparent file:text-sm file:font-medium",
        "file:text-foreground",

        // Hover
        "hover:border-foreground/30 hover:bg-background",

        // Focus — neutral ring, no blue, no shadow
        "focus-visible:border-foreground/50",
        "focus-visible:ring-2",
        "focus-visible:ring-foreground/15",

        // Invalid
        "aria-invalid:border-destructive",
        "aria-invalid:ring-2",
        "aria-invalid:ring-destructive/15",

        // Disabled
        "disabled:pointer-events-none",
        "disabled:cursor-not-allowed",
        "disabled:bg-muted/50",
        "disabled:text-muted-foreground",
        "disabled:opacity-60",

        // Dark mode
        "dark:bg-card/60",
        "dark:border-border/60",
        "dark:hover:bg-card/80",
        "dark:focus-visible:border-foreground/60",

        // Responsive text
        "md:text-sm",

        className,
      )}
      {...props}
    />
  );
}

export { Input };
