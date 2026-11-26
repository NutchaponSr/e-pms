"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/utils";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { cardClass, PREVIEW_COUNT, STATUS_LABEL } from "./constants";
import { SectionHeading } from "./section-heading";
import type { OverviewData } from "./types";

const AVATAR_COLORS = [
  "bg-[#e7f0ff] text-[#2f62c4] dark:bg-[#337ea940] dark:text-[#d6e8ff]",
  "bg-[#fff1e4] text-[#b86116] dark:bg-[#ff8f4733] dark:text-[#fbebde]",
  "bg-[#f3e9ff] text-[#6d3eaa] dark:bg-[#d093ff33] dark:text-[#f3ebf9]",
  "bg-[#e5f6ee] text-[#1c7a48] dark:bg-[#71ffaf33] dark:text-[#e8f1ec]",
];

function avatarColor(id: string) {
  const hash = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function OverviewIncompleteSection({
  items,
  drillLabel,
  onClearDrill,
}: {
  items: OverviewData["incomplete"];
  drillLabel: string | null;
  onClearDrill: () => void;
}) {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(PREVIEW_COUNT);
  const hasMore = visibleCount < items.length;
  const preview = items.slice(0, visibleCount);

  const { ref: loadMoreRef } = useIntersectionObserver({
    rootMargin: "160px",
    enabled: hasMore,
    onIntersect: () => {
      setVisibleCount((count) => Math.min(count + PREVIEW_COUNT, items.length));
    },
  });

  return (
    <div className="order-2 flex min-w-0 flex-col gap-3 xl:order-1">
      <SectionHeading
        title="งานที่ยังไม่เสร็จ"
        description="เรียงรายการที่ใกล้เสร็จไว้ก่อน · กดเข้าหน้าพนักงานเพื่อแก้ไข"
        aside={`${items.length.toLocaleString("th-TH")} รายการ`}
      />
      <div className={cn(cardClass, "overflow-hidden")}>
        {drillLabel && (
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
            <p className="text-xs text-secondary">กำลังดู {drillLabel}</p>
            <Button variant="ghost" size="xs" onClick={onClearDrill}>
              ดูทั้งหมด
            </Button>
          </div>
        )}
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col />
            <col className="w-[30%]" />
            <col className="w-[20%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-[11px] font-medium text-tertiary">
              <th className="px-4 py-3 font-medium">พนักงาน</th>
              <th className="px-3 py-3 font-medium">ช่วงงาน</th>
              <th className="px-3 py-3 font-medium">สถานะ</th>
              <th className="px-3 py-3 font-medium">การติดตาม</th>
            </tr>
          </thead>
          <tbody>
            {preview.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-tertiary"
                >
                  ไม่มีงานค้างในมุมมองนี้
                </td>
              </tr>
            ) : (
              preview.map((item) => {
                const detail = `${item.employeeId} · ${item.division} / ${item.department}`;

                return (
                  <tr
                    key={item.id}
                    tabIndex={item.href ? 0 : undefined}
                    aria-label={item.href ? `ดูงานของ ${item.name}` : undefined}
                    className={cn(
                      "border-b border-border/80 last:border-b-0",
                      item.href &&
                        "cursor-pointer hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none",
                    )}
                    onClick={() => {
                      if (item.href) router.push(item.href);
                    }}
                    onKeyDown={(event) => {
                      if (!item.href || event.key !== "Enter") return;
                      event.preventDefault();
                      router.push(item.href);
                    }}
                  >
                    <td className="overflow-hidden px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                            avatarColor(item.employeeId),
                          )}
                        >
                          {item.name.trim().charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="truncate text-sm font-medium text-primary"
                            title={item.name}
                          >
                            {item.name}
                          </p>
                          <p
                            className="truncate text-[11px] text-tertiary"
                            title={detail}
                          >
                            {detail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="overflow-hidden px-3 py-3 text-secondary">
                      <p className="truncate" title={item.periodLabel}>
                        {item.periodLabel}
                      </p>
                    </td>
                    <td className="overflow-hidden px-3 py-3">
                      <StatusBadge
                        label={STATUS_LABEL[item.status]}
                        variant={STATUS_VARIANTS[item.status].variant}
                      />
                    </td>
                    <td className="overflow-hidden px-3 py-3">
                      <span
                        className="inline-flex h-5 max-w-full items-center truncate rounded-full bg-[#fdeee8] px-2 text-[11px] font-medium text-[#a24b3a] dark:bg-[#ff756b33] dark:text-[#fce9e7]"
                        title={item.tracking}
                      >
                        {item.tracking}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {hasMore && (
          <div
            key={visibleCount}
            ref={loadMoreRef}
            aria-hidden
            className="h-px"
          />
        )}
        {items.length > PREVIEW_COUNT && (
          <div className="border-t border-border px-4 py-2.5 text-xs text-secondary">
            {hasMore
              ? `แสดง ${preview.length.toLocaleString("th-TH")} จาก ${items.length.toLocaleString("th-TH")} รายการ · เลื่อนเพื่อดูเพิ่ม`
              : `แสดงทั้งหมด ${items.length.toLocaleString("th-TH")} รายการ`}
          </div>
        )}
      </div>
    </div>
  );
}
