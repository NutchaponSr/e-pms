import { cn, formatDecimal } from "@/lib/utils";
import { cardClass } from "./constants";
import { SectionHeading } from "./section-heading";
import type { OverviewData } from "./types";

export function OverviewScoresSection({
  scores,
}: {
  scores: OverviewData["scores"];
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading
        title="สรุปคะแนนที่อนุมัติแล้ว"
        description="คะแนนถ่วงน้ำหนักจาก Approver 2 เฉพาะงาน Completed"
        aside="คะแนนเต็ม 100"
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {scores.map((score) => {
          const percent =
            score.average == null
              ? 0
              : Math.min(100, Math.max(0, (score.average / score.max) * 100));
          return (
            <article
              key={score.key}
              className={cn(cardClass, "flex flex-col gap-4 p-4")}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-primary">
                  {score.label}
                </p>
                <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-[#e5f4ec] px-2 text-[11px] font-medium text-[#1d6b40] dark:bg-[#71ffaf33] dark:text-[#e8f1ec]">
                  Completed เท่านั้น
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-semibold tracking-tight text-primary tabular-nums">
                  {score.average == null ? "–" : formatDecimal(score.average)}
                </span>
                <span className="mb-1 text-sm text-tertiary">
                  / {score.max}
                </span>
              </div>
              <p className="text-xs text-secondary">
                {score.scoredCount === 0
                  ? "ยังไม่มีคะแนนที่อนุมัติ"
                  : `เฉลี่ยจาก ${score.scoredCount.toLocaleString("th-TH")} คนที่ผ่าน Approver 2 · อีก ${score.pendingCount.toLocaleString("th-TH")} คนยังไม่เสร็จ`}
              </p>
              <div className="mt-auto h-2.5 overflow-hidden rounded-full bg-[#d9e6f7] dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-[#5b8def]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
