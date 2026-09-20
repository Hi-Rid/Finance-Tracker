"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
  variant?: "default" | "success" | "warning" | "danger"
}

function Progress({
  className,
  value,
  indicatorClassName,
  variant = "default",
  ...props
}: ProgressProps) {
  const variantClass = {
    default: "bg-brand",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
  }[variant]

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary-100 dark:bg-primary-100/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all duration-500",
          variantClass,
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }