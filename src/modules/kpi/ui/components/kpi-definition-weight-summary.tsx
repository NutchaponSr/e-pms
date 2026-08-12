"use client";

import { NumberTicker } from "@/components/number-ticker";
import { Progress } from "@/components/ui/progress";
import { cn, formatDecimal } from "@/lib/utils";

interface Props {
  actual: number;
  full: number;
}

export const KpiDefinitionWeightSummary = ({ actual, full }: Props) => {
  const percent = full > 0 ? Math.min((actual / full) * 100, 100) : 0;
  const isComplete = actual === full;
  const isOver = actual > full;

  return (
    <div className="w-full min-w-[min(100%,18rem)]">
      <div className="overflow-hidden rounded border border-border/80 bg-background text-xs">
        <div className="grid grid-cols-2 border-b border-border bg-[#2383e218] dark:bg-[#298bfd14]">
          <div className="border-r border-border/70 px-2.5 py-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-secondary">
              Actual
            </p>
            <NumberTicker
              value={actual}
              decimalPlaces={1}
              delay={0.2}
              className={cn(
                "tabular-nums text-sm font-semibold",
                isOver ? "text-destructive" : "text-primary",
              )}
            />
          </div>
          <div className="px-2.5 py-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-secondary">
              Full
            </p>
            <p className="tabular-nums text-sm font-semibold text-primary">
              {formatDecimal(full, 1)}
            </p>
          </div>
        </div>

        <div className="space-y-1 px-2.5 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-secondary">Progress</span>
            <span
              className={cn(
                "tabular-nums text-[10px] font-semibold",
                isOver && "text-destructive",
                isComplete && "text-marine",
                !isOver && !isComplete && "text-secondary",
              )}
            >
              {formatDecimal(percent, 0)}%
            </span>
          </div>
          <Progress className="h-1.5 w-full" value={percent} />
        </div>
      </div>
    </div>
  );
};
