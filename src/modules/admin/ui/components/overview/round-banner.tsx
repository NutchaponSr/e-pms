import { InfoIcon } from "lucide-react";
import { buddhistYear } from "./format";

export function OverviewRoundBanner({
  year,
  employeeCount,
}: {
  year: number;
  employeeCount: number;
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f3f7ff] px-4 py-3 dark:bg-[#337ea91f]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-marine shadow-[0_0_0_1.25px_rgba(35,131,226,0.15)] dark:bg-[#202020]">
          <InfoIcon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary">
            รอบประเมิน {buddhistYear(year)}
          </p>
          <p className="text-xs text-secondary">
            แสดงข้อมูลตามบริษัท หน่วยงาน และ Level ที่เลือก ·
            คลิกจำนวนสถานะที่ยังไม่เสร็จเพื่อดูรายการ
          </p>
        </div>
      </div>
      <p className="text-xs text-secondary">
        {employeeCount.toLocaleString("th-TH")} พนักงานในรอบนี้
      </p>
    </section>
  );
}
