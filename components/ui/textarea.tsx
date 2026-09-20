import * as React from "react"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/60 flex field-sizing-content min-h-20 w-full rounded-lg border bg-transparent px-3 py-2 text-base transition-all outline-none",
        "focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-400/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }