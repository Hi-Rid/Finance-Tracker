import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary-400/30 bg-primary-400/10 text-primary-600 dark:bg-primary-400/10 dark:text-primary-300 dark:border-primary-400/30",
        primary:
          "border-transparent bg-primary-500 text-white",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/30",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/30",
        danger:
          "border-red-500/30 bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/30",
        outline:
          "border-current text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }