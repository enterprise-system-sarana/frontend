import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-xl",
        "border border-border/70 bg-background",
        "px-3.5 py-2.5 text-sm text-foreground",
        "placeholder:text-muted-foreground/60",
        "transition-all duration-200 ease-out",
        "outline-none",
        "hover:border-foreground/30 hover:bg-background",
        "focus-visible:border-foreground/50 focus-visible:ring-2 focus-visible:ring-foreground/15",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-60",
        "dark:bg-card/60 dark:border-border/60 dark:hover:bg-card/80 dark:focus-visible:border-foreground/60",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
