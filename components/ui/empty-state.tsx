import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-100/10 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-primary-400" />
        </div>
      )}
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}