import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-brand-foreground hover:bg-brand-hover active:bg-brand-active shadow-sm shadow-brand/20",
        navy:
          "bg-primary-800 text-white hover:bg-primary-900 active:bg-primary-900 shadow-sm",
        outline:
          "border border-brand bg-transparent text-brand hover:bg-brand-soft",
        ghost:
          "bg-transparent text-brand hover:bg-brand-soft",
        danger:
          "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm",
        success:
          "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-sm",
        secondary:
          "bg-brand-soft text-brand-soft-foreground hover:bg-brand-soft/80",
        link:
          "text-brand underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }