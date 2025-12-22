import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-[1.25px] bg-background border-border text-primary placeholder:text-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded p-2 transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 text-sm focus-visible:border-marine focus-visible:ring-marine/40 focus-visible:ring-[2.5px]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
