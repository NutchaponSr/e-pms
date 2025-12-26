import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { StatusVariant } from "@/modules/tasks/types";

export const statusBadgeVariants = cva("", {
  variants: {
    text: {
      default: "text-[#494846] dark:text-[#f0efed]",
      purple: "text-[#553b69] dark:text-[#f3ebf9]",
      orange: "text-[#6a4222] dark:text-[#fbebde]",
      red: "text-[#6d3531] dark:text-[#fce9e7]",
      green: "text-[#2a533c] dark:text-[#e8f1ec]",
    },
    background: {
      default: "bg-[#1c13011c] dark:bg-[#fffceb4e]",
      purple: "bg-[#5c00a324] dark:bg-[#d093ff6d]",
      orange: "bg-[#c4580034] dark:bg-[#ff8f477b]",
      red: "bg-[#ce18002a] dark:bg-[#ff756b86]",
      green: "bg-[#00602628] dark:bg-[#71ffaf56]",
    },
    dot: {
      default: "bg-[#8e8b86]",
      purple: "bg-[#b577d6]",
      orange: "bg-[#d5803b]",
      red: "bg-[#e56458] dark:bg-[#ff756b]",
      green: "bg-[#46a171]"
    },
    border: {
      default: "border-[#8e8b86]",
      purple: "border-[#b577d3]",
      orange: "border-[#d5803b]",
      red: "border-[#e56458] dark:border-[#ff756b]",
      green: "border-[#46a171]"
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
      "inline-flex items-center min-w-0 max-w-full h-5 m-0 px-2 leading-[120%] text-xs border-dashed border select-none"
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