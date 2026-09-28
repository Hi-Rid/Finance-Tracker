import { cn } from '@/lib/utils'

type PageWrapperProps = {
  children: React.ReactNode
  className?: string
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl py-4 md:py-8', className)}>
      {children}
    </div>
  )
}

type PageHeaderProps = {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4 md:mb-8',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight mb-0.5 md:mb-1">
          {title}
        </h1>
        {description && (
          <p className="text-xs md:text-sm text-muted-foreground truncate">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}