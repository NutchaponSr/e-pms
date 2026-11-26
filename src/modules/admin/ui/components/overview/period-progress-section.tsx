import { Progress } from "@/components/ui/progress";
import { Status } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { COUNT_COLUMNS, cardClass, WINDOW_BADGE } from "./constants";
import { SectionHeading } from "./section-heading";
import type { Drill, OverviewData } from "./types";

export function OverviewPeriodSection({
  periods,
  employeeCount,
  drill,
  onToggle,
}: {
  periods: OverviewData["periods"];
  employeeCount: number;
  drill: Drill;
  onToggle: (key: string, status: Status) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading
        title="ความคืบหน้าแต่ละช่วง"
        description="ตัวเลขคือจำนวนพนักงานในแต่ละสถานะของช่วงนั้น"
        aside={`${employeeCount.toLocaleString("th-TH")} คน`}
      />
      <div className={cn(cardClass, "overflow-x-auto")}>
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] font-medium text-tertiary">
              <th className="px-4 py-3 font-medium">ช่วงงาน</th>
              <th className="px-3 py-3 font-medium">ช่วงเปิด–ปิด</th>
              {COUNT_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className="px-2 py-3 text-center font-medium"
                >
                  {column.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium">เสร็จ</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr
                key={period.key}
                className="border-b border-border/80 last:border-b-0"
              >
                <td className="px-4 py-3 font-medium text-primary">
                  {period.label}
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <span
                      className={cn(
                        "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium",
                        WINDOW_BADGE[period.state].className,
                      )}
                    >
                      {WINDOW_BADGE[period.state].label}
                    </span>
                    <span className="text-[11px] text-tertiary">
                      {period.rangeLabel ?? "ไม่ได้กำหนดช่วง"}
                    </span>
                  </div>
                </td>
                {COUNT_COLUMNS.map((column) => {
                  const count = period.counts[column.key];
                  const active =
                    drill?.key === period.key && drill.status === column.status;
                  const interactive =
                    column.status !== Status.COMPLETED && count > 0;
                  return (
                    <td key={column.key} className="px-2 py-3 text-center">
                      <button
                        type="button"
                        disabled={!interactive}
                        onClick={() => onToggle(period.key, column.status)}
                        className={cn(
                          "inline-flex h-7 min-w-8 items-center justify-center rounded-full px-2 text-xs tabular-nums",
                          column.className,
                          interactive && "hover:opacity-80",
                          !interactive && "cursor-default",
                          active && "ring-2 ring-marine/50",
                        )}
                      >
                        {count}
                      </button>
                    </td>
                  );
                })}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Progress value={period.completionRate} className="w-16" />
                    <span className="w-9 text-right text-xs tabular-nums text-secondary">
                      {period.completionRate}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
