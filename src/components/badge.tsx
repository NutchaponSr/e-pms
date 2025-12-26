import { XIcon } from "lucide-react";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const badgeVariant = cva("inline-flex items-center shrink max-w-full w-fit min-w-0 h-5 rounded-xs px-1.5 leading-[120%] text-sm whitespace-nowrap overflow-hidden text-ellipsis", 
  {
    variants: {
      color: {
        orange: "text-[#6a4222] dark:text-[#fbebde] bg-[#c4580034] dark:bg-[#ff8f477b]", 
      },
    },
    defaultVariants: {
      color: "orange",
    },
  },
);

interface Props extends VariantProps<typeof badgeVariant> {
  label: string;
  className?: string;
  onClick?: () => void;
}

export const Badge = ({
  color,
  label,
  className,
  onClick
}: Props) => {
  if (!label) return null;

  return (
    <div className={cn(badgeVariant({ color }))}>
      <p className={cn("whitespace-nowrap overflow-hidden text-ellipsis h-5 leading-5 text-sm", className)}>
        {label}
      </p>
      <div 
        role="button" 
        onClick={onClick}
        data-click={!!onClick}
        className="transition hidden items-center justify-center shrink-0 size-4 grow-0 ml-1 hover:bg-primary/6 rounded data-[click=true]:flex"
      >
        <XIcon className="size-3.5 shrink-0 grow-0 text-ter" />
      </div>
    </div>
  );
}