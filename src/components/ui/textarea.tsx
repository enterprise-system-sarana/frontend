import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-lg",
        "border border-input bg-card shadow-2xs",
        "px-3 py-2.5 text-sm text-foreground",
        "placeholder:text-text-disabled",
        "transition-[border-color,box-shadow] duration-150 ease-out",
        "outline-none",
        "hover:border-primary/40",
        "focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-60",
        "dark:bg-card",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
