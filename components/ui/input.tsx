import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-lg border px-3 py-2 text-base transition-all outline-none md:text-sm",
        // LIGHT — explicit warna text
        "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400",
        // DARK
        "dark:bg-white/5 dark:border-white/15 dark:text-white dark:placeholder:text-white/40",
        // Focus
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        "file:text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
      style={{ color: undefined, ...props.style }}
    />
  )
}

export { Input }