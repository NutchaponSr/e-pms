import { formatDecimal } from "@/lib/utils";
import { ALL, WINDOW_BADGE } from "./constants";
import { buddhistYear } from "./format";
import type { OverviewData } from "./types";

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function exportOverviewCsv({
  data,
  division,
  department,
  level,
}: {
  data: OverviewData;
  division: string;
  department: string;
  level: string;
}) {
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
}
