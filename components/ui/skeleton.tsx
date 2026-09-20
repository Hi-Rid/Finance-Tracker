import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-primary-100/50 dark:bg-primary-100/10 animate-pulse rounded-lg",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }