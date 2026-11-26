import { Status } from "@/generated/prisma/enums";

export const ALL = "all";
export const PREVIEW_COUNT = 9;

export const cardClass =
  "rounded-xl bg-white/90 dark:bg-[#202020]/90 shadow-[0_12px_32px_0_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.05)]";

export const COUNT_COLUMNS = [
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

export const WINDOW_BADGE = {
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

export const STATUS_LABEL: Record<Status, string> = {
  [Status.NOT_STARTED]: "Not Started",
  [Status.IN_DRAFT]: "In Draft",
  [Status.WAITING_APPROVER_1]: "Approver 1",
  [Status.WAITING_APPROVER_2]: "Approver 2",
  [Status.COMPLETED]: "Completed",
};
