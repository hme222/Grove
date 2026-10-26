import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex min-h-touch items-center justify-center gap-2 rounded-control font-ui text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grove-lime focus-visible:ring-offset-2 focus-visible:ring-offset-grove-forest disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-rest hover:bg-primary/80",
        destructive:
          "bg-destructive text-destructive-foreground shadow-rest hover:bg-destructive/80",
        outline:
          "border-strong border-grove-fernLine bg-transparent text-grove-cream hover:bg-grove-moss focus-visible:border-grove-lime",
        chip:
          "whitespace-nowrap rounded-pill border-hairline border-grove-fernLine bg-transparent px-3 text-xs text-grove-cream hover:bg-grove-moss focus-visible:border-grove-lime aria-pressed:border-grove-lime aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:before:mr-1.5 aria-pressed:before:content-['✓']",
        secondary:
          "bg-secondary text-secondary-foreground shadow-rest hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2",
        sm: "rounded-control px-3 text-xs",
        lg: "rounded-control px-8",
        icon: "h-touch w-touch",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
