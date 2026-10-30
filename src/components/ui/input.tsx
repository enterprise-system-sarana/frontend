import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base
        "flex h-9 w-full min-w-0 rounded-lg",
        "border border-input",
        "bg-card shadow-2xs",
        "px-3 py-2",
        "text-sm text-foreground",

        // Placeholder
        "placeholder:text-text-disabled",

        // Smooth animation
        "transition-[border-color,box-shadow] duration-150 ease-out",

        // Remove default browser outline
        "outline-none",

        // File input
        "file:inline-flex file:h-7 file:border-0",
        "file:bg-transparent file:text-sm file:font-medium",
        "file:text-foreground",

        // Hover
        "hover:border-primary/40",

        // Focus — brand ring
        "focus-visible:border-primary",
        "focus-visible:ring-3",
        "focus-visible:ring-primary/15",

        // Invalid
        "aria-invalid:border-destructive",
        "aria-invalid:ring-3",
        "aria-invalid:ring-destructive/15",

        // Disabled
        "disabled:pointer-events-none",
        "disabled:cursor-not-allowed",
        "disabled:bg-muted",
        "disabled:text-muted-foreground",
        "disabled:opacity-60",

        // Dark mode
        "dark:bg-card",

        // Responsive text
        "md:text-sm",

        className,
      )}
      {...props}
    />
  );
}

export { Input };
