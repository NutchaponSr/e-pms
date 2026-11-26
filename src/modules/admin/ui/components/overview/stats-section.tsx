import { cn } from "@/lib/utils";
import { cardClass } from "./constants";
import type { OverviewData } from "./types";

export function OverviewStatsSection({
  employeeCount,
  completedTasks,
  totalSlots,
  incompleteTasks,
  pendingApprovals,
}: Pick<
  OverviewData,
  | "employeeCount"
  | "completedTasks"
  | "totalSlots"
  | "incompleteTasks"
  | "pendingApprovals"
>) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="พนักงานในรอบทั้งหมด"
        value={employeeCount.toLocaleString("th-TH")}
        hint="ตามตัวกรองปัจจุบัน"
        tone="text-marine"
      />
      <StatCard
        label="งานทุกรอบที่เสร็จแล้ว"
        value={`${completedTasks.toLocaleString("th-TH")} / ${totalSlots.toLocaleString("th-TH")}`}
        hint="นับแยกตามพนักงานและช่วงงาน"
        tone="text-[#1f8a4c] dark:text-[#8ee0b0]"
      />
      <StatCard
        label="งานที่ยังไม่เสร็จ"
        value={incompleteTasks.toLocaleString("th-TH")}
        hint="รวมทุกสถานะก่อน Completed"
        tone="text-[#c56a1a] dark:text-[#ffb110]"
      />
      <StatCard
        label="เอกสารค้างอนุมัติ"
        value={pendingApprovals.toLocaleString("th-TH")}
        hint="เฉพาะช่วงประเมิน ไม่รวม Setting"
        tone="text-[#cd3c3a]"
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: string;
}) {
  return (
    <article className={cn(cardClass, "flex flex-col gap-1 px-4 py-4")}>
      <p className="text-sm text-secondary">{label}</p>
      <p
        className={cn(
          "text-3xl font-semibold tracking-tight tabular-nums",
          tone,
        )}
      >
        {value}
      </p>
      <p className="text-xs text-tertiary">{hint}</p>
    </article>
  );
}
