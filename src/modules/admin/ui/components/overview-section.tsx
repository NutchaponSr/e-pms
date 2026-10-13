"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DownloadIcon, InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Status } from "@/generated/prisma/enums";
import { cn, formatDecimal } from "@/lib/utils";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { useTRPC } from "@/trpc/client";

const ALL = "all";
const PREVIEW_COUNT = 9;

const cardClass =
  "rounded-xl bg-white/90 dark:bg-[#202020]/90 shadow-[0_12px_32px_0_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.05)]";

const AVATAR_COLORS = [
  "bg-[#e7f0ff] text-[#2f62c4] dark:bg-[#337ea940] dark:text-[#d6e8ff]",
  "bg-[#fff1e4] text-[#b86116] dark:bg-[#ff8f4733] dark:text-[#fbebde]",
  "bg-[#f3e9ff] text-[#6d3eaa] dark:bg-[#d093ff33] dark:text-[#f3ebf9]",
  "bg-[#e5f6ee] text-[#1c7a48] dark:bg-[#71ffaf33] dark:text-[#e8f1ec]",
];

const COUNT_COLUMNS = [
  {
    key: "notStarted",
    label: "Not Started",
    status: Status.NOT_STARTED,
    className:
      "bg-[#eceaf3] text-[#4d4660] dark:bg-[#d093ff2e] dark:text-[#f3ebf9]",
  },
  {
    key: "inDraft",
    label: "In Draft",
    status: Status.IN_DRAFT,
    className:
      "bg-[#f4eee4] text-[#6a5340] dark:bg-[#ff8f472e] dark:text-[#fbebde]",
  },
  {
    key: "approver1",
    label: "Approver 1",
    status: Status.WAITING_APPROVER_1,
    className:
      "bg-[#e6eef8] text-[#35557d] dark:bg-[#337ea940] dark:text-[#d6e8ff]",
  },
  {
    key: "approver2",
    label: "Approver 2",
    status: Status.WAITING_APPROVER_2,
    className:
      "bg-[#eee8f6] text-[#56457a] dark:bg-[#d093ff33] dark:text-[#f3ebf9]",
  },
  {
    key: "completed",
    label: "Completed",
    status: Status.COMPLETED,
    className:
      "bg-[#e5f4ec] text-[#1d6b40] dark:bg-[#71ffaf33] dark:text-[#e8f1ec]",
  },
] as const;

const WINDOW_BADGE = {
  open: {
    label: "เปิดอยู่",
    className:
      "bg-[#dff6ea] text-[#157a45] dark:bg-[#71ffaf33] dark:text-[#d9ffe9]",
  },
  closed: {
    label: "เปิดแล้ว",
    className:
      "bg-[#e7f6ee] text-[#3d8f62] dark:bg-[#00602640] dark:text-[#c9ead8]",
  },
  upcoming: {
    label: "ยังไม่เปิด",
    className:
      "bg-[#f1f0ee] text-[#6d6a64] dark:bg-white/10 dark:text-secondary",
  },
  unset: {
    label: "เปิดอยู่",
    className:
      "bg-[#e7f3ff] text-[#2d6cb5] dark:bg-[#337ea940] dark:text-[#d6e8ff]",
  },
} as const;

const STATUS_LABEL: Record<Status, string> = {
  [Status.NOT_STARTED]: "Not Started",
  [Status.IN_DRAFT]: "In Draft",
  [Status.WAITING_APPROVER_1]: "Approver 1",
  [Status.WAITING_APPROVER_2]: "Approver 2",
  [Status.COMPLETED]: "Completed",
};

type Drill = { key: string; status: Status } | null;

function yearOptions(currentYear: number) {
  return [
    currentYear + 1,
    ...Array.from({ length: 5 }, (_, index) => currentYear - index),
  ];
}

function buddhistYear(year: number) {
  return year + 543;
}

function avatarColor(id: string) {
  const hash = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export const OverviewSection = () => {
  const router = useRouter();
  const trpc = useTRPC();
  const currentYear = new Date().getFullYear();
  const years = yearOptions(currentYear);

  const [year, setYear] = useState(currentYear);
  const [division, setDivision] = useState(ALL);
  const [department, setDepartment] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [drill, setDrill] = useState<Drill>(null);
  const [showAll, setShowAll] = useState(false);

  const filtersActive = division !== ALL || department !== ALL || level !== ALL;

  const { data, isLoading, isError, isFetching } = useQuery({
    ...trpc.admin.getOverview.queryOptions({
      year,
      division: division === ALL ? undefined : division,
      department: department === ALL ? undefined : department,
      level: level === ALL ? undefined : level,
    }),
    placeholderData: keepPreviousData,
  });

  const resetDrill = () => {
    setDrill(null);
    setShowAll(false);
  };

  const departments = useMemo(() => {
    const rows = data?.options.departments ?? [];
    const names = rows
      .filter((item) => division === ALL || item.division === division)
      .map((item) => item.name);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, "th"));
  }, [data?.options.departments, division]);

  const visibleIncomplete = useMemo(() => {
    const rows = data?.incomplete ?? [];
    if (!drill) return rows;
    return rows.filter(
      (item) => item.periodKey === drill.key && item.status === drill.status,
    );
  }, [data?.incomplete, drill]);

  const preview = showAll
    ? visibleIncomplete
    : visibleIncomplete.slice(0, PREVIEW_COUNT);

  const clearFilters = () => {
    setDivision(ALL);
    setDepartment(ALL);
    setLevel(ALL);
    resetDrill();
  };

  const toggleDrill = (key: string, status: Status) => {
    setShowAll(false);
    setDrill((current) =>
      current?.key === key && current.status === status
        ? null
        : { key, status },
    );
    document
      .getElementById("admin-incomplete")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exportCsv = () => {
    if (!data) return;

    const lines = [
      ["รอบประเมิน", buddhistYear(data.year)].map(csvCell).join(","),
      ["บริษัท", division === ALL ? "ทุกบริษัท" : division].map(csvCell).join(","),
      ["หน่วยงาน", department === ALL ? "ทุกหน่วยงาน" : department]
        .map(csvCell)
        .join(","),
      ["Level", level === ALL ? "ทุก Level" : level].map(csvCell).join(","),
      ["พนักงานในรอบ", data.employeeCount].map(csvCell).join(","),
      ["งานที่เสร็จ", `${data.completedTasks}/${data.totalSlots}`]
        .map(csvCell)
        .join(","),
      ["งานที่ยังไม่เสร็จ", data.incompleteTasks].map(csvCell).join(","),
      ["เอกสารค้างอนุมัติ", data.pendingApprovals].map(csvCell).join(","),
      "",
      [
        "ช่วงงาน",
        "สถานะช่วง",
        "ช่วงเปิด-ปิด",
        "Not Started",
        "In Draft",
        "Approver 1",
        "Approver 2",
        "Completed",
        "เสร็จ %",
      ]
        .map(csvCell)
        .join(","),
      ...data.periods.map((period) =>
        [
          period.label,
          WINDOW_BADGE[period.state].label,
          period.rangeLabel ?? "ไม่ได้กำหนดช่วง",
          period.counts.notStarted,
          period.counts.inDraft,
          period.counts.approver1,
          period.counts.approver2,
          period.counts.completed,
          period.completionRate,
        ]
          .map(csvCell)
          .join(","),
      ),
      "",
      ["ช่วงประเมิน", "คะแนนเฉลี่ย", "คะแนนเต็ม", "จำนวนที่อนุมัติ", "ยังไม่เสร็จ"]
        .map(csvCell)
        .join(","),
      ...data.scores.map((score) =>
        [
          score.label,
          score.average == null ? "" : formatDecimal(score.average),
          score.max,
          score.scoredCount,
          score.pendingCount,
        ]
          .map(csvCell)
          .join(","),
      ),
    ];

    const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `epms-overview-${buddhistYear(data.year)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="py-16 text-center text-sm text-secondary">
        โหลดภาพรวมไม่สำเร็จ
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4 pb-8", isFetching && "opacity-80")}>
      <div className="flex justify-end px-1">
        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={!data}
        >
          <DownloadIcon />
          ส่งออกสรุป CSV
        </Button>
      </div>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f3f7ff] px-4 py-3 dark:bg-[#337ea91f]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-marine shadow-[0_0_0_1.25px_rgba(35,131,226,0.15)] dark:bg-[#202020]">
            <InfoIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">
              รอบประเมิน {buddhistYear(data.year)}
            </p>
            <p className="text-xs text-secondary">
              แสดงข้อมูลตามบริษัท หน่วยงาน และ Level ที่เลือก ·
              คลิกจำนวนสถานะที่ยังไม่เสร็จเพื่อดูรายการ
            </p>
          </div>
        </div>
        <p className="text-xs text-secondary">
          {data.employeeCount.toLocaleString("th-TH")} พนักงานในรอบนี้
        </p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="พนักงานในรอบทั้งหมด"
          value={data.employeeCount.toLocaleString("th-TH")}
          hint="ตามตัวกรองปัจจุบัน"
          tone="text-marine"
        />
        <StatCard
          label="งานทุกรอบที่เสร็จแล้ว"
          value={`${data.completedTasks.toLocaleString("th-TH")} / ${data.totalSlots.toLocaleString("th-TH")}`}
          hint="นับแยกตามพนักงานและช่วงงาน"
          tone="text-[#1f8a4c] dark:text-[#8ee0b0]"
        />
        <StatCard
          label="งานที่ยังไม่เสร็จ"
          value={data.incompleteTasks.toLocaleString("th-TH")}
          hint="รวมทุกสถานะก่อน Completed"
          tone="text-[#c56a1a] dark:text-[#ffb110]"
        />
        <StatCard
          label="เอกสารค้างอนุมัติ"
          value={data.pendingApprovals.toLocaleString("th-TH")}
          hint="เฉพาะช่วงประเมิน ไม่รวม Setting"
          tone="text-[#cd3c3a]"
        />
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading
          title="ความคืบหน้าแต่ละช่วง"
          description="ตัวเลขคือจำนวนพนักงานในแต่ละสถานะของช่วงนั้น"
          aside={`${data.employeeCount.toLocaleString("th-TH")} คน`}
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
              {data.periods.map((period) => (
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
                      drill?.key === period.key &&
                      drill.status === column.status;
                    const interactive =
                      column.status !== Status.COMPLETED && count > 0;
                    return (
                      <td key={column.key} className="px-2 py-3 text-center">
                        <button
                          type="button"
                          disabled={!interactive}
                          onClick={() => toggleDrill(period.key, column.status)}
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
                      <Progress
                        value={period.completionRate}
                        className="w-16"
                      />
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

      <section
        id="admin-incomplete"
        className="grid scroll-mt-16 grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_280px]"
      >
        <div className="order-2 flex min-w-0 flex-col gap-3 xl:order-1">
          <SectionHeading
            title="งานที่ยังไม่เสร็จ"
            description="เรียงรายการที่ใกล้เสร็จไว้ก่อน · กดเข้าหน้าพนักงานเพื่อแก้ไข"
            aside={`${visibleIncomplete.length.toLocaleString("th-TH")} รายการ`}
          />
          <div className={cn(cardClass, "overflow-hidden")}>
            {drill && (
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
                <p className="text-xs text-secondary">
                  กำลังดู{" "}
                  {
                    data.periods.find((period) => period.key === drill.key)
                      ?.label
                  }{" "}
                  · {STATUS_LABEL[drill.status]}
                </p>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setDrill(null)}
                >
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
            {visibleIncomplete.length > PREVIEW_COUNT && (
              <div className="border-t border-border px-4 py-2.5 text-xs text-secondary">
                {showAll
                  ? `แสดงทั้งหมด ${visibleIncomplete.length.toLocaleString("th-TH")} รายการ`
                  : `แสดง ${PREVIEW_COUNT} รายการแรก`}
                {" · "}
                <button
                  type="button"
                  className="font-medium text-marine hover:underline"
                  onClick={() => setShowAll((value) => !value)}
                >
                  {showAll ? "ย่อรายการ" : "ดูรายชื่อทั้งหมด"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="order-1 flex flex-col gap-3 xl:order-2">
          <SectionHeading
            title="ความคืบหน้าตามบริษัท"
            description="สัดส่วน Completed จากงานทุกช่วง"
          />
          <div className={cn(cardClass, "flex flex-col gap-3 p-4")}>
            <FilterField label="ปีประเมิน">
              <Select
                value={String(year)}
                onValueChange={(value) => {
                  setYear(Number(value));
                  resetDrill();
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {buddhistYear(option)}
                      {option === currentYear ? " · ปัจจุบัน" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="บริษัท">
              <Select
                value={division}
                onValueChange={(value) => {
                  setDivision(value);
                  setDepartment(ALL);
                  resetDrill();
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>ทุกบริษัท</SelectItem>
                  {data.options.divisions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="หน่วยงาน">
              <Select
                value={department}
                onValueChange={(value) => {
                  setDepartment(value);
                  resetDrill();
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>ทุกหน่วยงาน</SelectItem>
                  {departments.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Level">
              <Select
                value={level}
                onValueChange={(value) => {
                  setLevel(value);
                  resetDrill();
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>ทุก Level</SelectItem>
                  {data.options.levels.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterField>
            <Button
              variant="outline"
              size="sm"
              disabled={!filtersActive}
              onClick={clearFilters}
            >
              ล้างตัวกรอง
            </Button>
          </div>
          <div className={cn(cardClass, "flex flex-col gap-4 p-4")}>
            {data.companies.length === 0 ? (
              <p className="py-6 text-center text-xs text-tertiary">
                ไม่มีข้อมูลบริษัท
              </p>
            ) : (
              data.companies.map((company) => (
                <div key={company.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-primary">
                      {company.name}
                    </span>
                    <span className="tabular-nums text-secondary">
                      {company.rate}%
                    </span>
                  </div>
                  <Progress value={company.rate} />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading
          title="สรุปคะแนนที่อนุมัติแล้ว"
          description="คะแนนถ่วงน้ำหนักจาก Approver 2 เฉพาะงาน Completed"
          aside="คะแนนเต็ม 100"
        />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {data.scores.map((score) => {
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
    </div>
  );
};

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] font-medium text-tertiary">{label}</span>
      {children}
    </div>
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

function SectionHeading({
  title,
  description,
  aside,
}: {
  title: string;
  description?: string;
  aside?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div>
        <h2 className="text-sm font-medium text-primary">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-tertiary">{description}</p>
        )}
      </div>
      {aside && <p className="shrink-0 text-xs text-secondary">{aside}</p>}
    </div>
  );
}
