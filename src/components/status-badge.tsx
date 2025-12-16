import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { StatusVariant } from "@/modules/tasks/types";

export const statusBadgeVariants = cva("", {
  variants: {
    text: {
      purple: "text-[#f3ebf9]",
      orange: "text-[#fbebde]"
    },
    background: {
      purple: "bg-[#d093ff6d]",
      orange: "bg-[#ff8f477b]"
    },
    dot: {
      purple: "bg-[#b577d6]",
      orange: "bg-[#d5803b]"
    },
    border: {
      purple: "border-[#b577d3]",
      orange: "border-[#d5803b]"
    },
  },
});

interface Props extends VariantProps<typeof statusBadgeVariants> {
  label: string;
  variant: StatusVariant;
}
export const StatusBadge = ({ label, variant }: Props) => {
  return (
    <div className={cn(
      statusBadgeVariants({ text: variant, background: variant, border: variant }), 
      "inline-flex items-center min-w-0 max-w-full h-5 m-0 px-2 leading-[120%] text-xs border-dashed border"
    )}>
      <div className="whitespace-nowrap overflow-hidden text-ellipsis inline-flex items-center h-5 leading-5">
        <div className="flex items-center">
          <div className={cn(statusBadgeVariants({ dot: variant }), "me-1.5 rounded-full size-2 inline-flex shrink-0")} />
        </div>
        <span className="whitespace-nowrap overflow-hidden text-ellipsis font-mono uppercase tracking-wider text-[11px] leading-4">
          {label}
        </span>
      </div>
    </div>
  );
} 