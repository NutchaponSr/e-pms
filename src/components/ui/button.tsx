import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary dark:text-zinc-950 hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 dark:hover:bg-destructive/80",
        outline:
          "border border-border bg-background hover:bg-accent",
        secondary: "bg-[#2a1c0012] hover:bg-[#2a1c001a] dark:bg-[#fffff315] dark:hover:bg-[#fffff31f] text-primary",
        ghost:
          "hover:bg-accent dark:hover:bg-accent/50 text-primary hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        primary: "bg-marine text-white hover:bg-marine/90",
        primaryGhost: "text-marine bg-[#489cff36] hover:bg-[#489cff52]",
        dangerOutline: "text-destructive border border-destructive/24 hover:bg-[#fce9e7] dark:hover:bg-red-muted",
        mutedOultine: "text-primary hover:bg-[#f2f2f2] dark:hover:bg-[#333333] border border-border"
      },
      size: {
        default: "h-8 px-4 py-2 has-[>svg]:px-3",
        sm: "h-7 rounded-sm gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-sm px-6 has-[>svg]:px-4",
        xs: "h-6 rounded-sm gap-1.5 px-1.5 py-0.5 font-normal",
        icon: "size-7",
        xsIcon: "size-6",
      },
    },
    defaultVariants: {
      variant: "default",
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
