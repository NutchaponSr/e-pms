import { cva, VariantProps } from "class-variance-authority";
import { BriefcaseIcon, Building2Icon, BuildingIcon, LucideIcon, TrendingUpIcon, UserIcon } from "lucide-react";
import { Rank } from "./types/employees";

export const appVariants = cva("", {
  variants: {
    border: {
      danger: "border-[#fdd3cd] dark:border-[#362422]",
      marine: "border-[#e6f1fa] dark:border-[#2383e212]",
      warning: "border-[#ffe4af] dark:border-[#98663026]",
      sunset: "border-[#ffdec4] dark:border-[#d95f0d26]",
    },
    background: {
      danger: "bg-[#fef3f1] dark:bg-[#de55581a]",
      marine: "bg-[#f2f9ff] dark:bg-[#337ea914]",
      warning: "bg-[#fff5e0] dark:bg-[#a269321a]",
      sunset: "bg-[#fff5ed] dark:bg-[#d95f0d1a]",
    },
    icon: {
      danger: "text-[#cd3c3a]",
      marine: "text-[#2383e2]",
      warning: "text-[#ffb110]",
      sunset: "text-[#d95f0d]",
    }
  }
});
interface AppCategory extends VariantProps<typeof appVariants> {
  title: string;
  items: {
    title: string;
    href: string;
    description: string;
    icon: LucideIcon;
  }[];
  categoryIcon: LucideIcon;
}

export const APP_CATEGORIES: AppCategory[] = [
  {
    title: "Performance & Tasks",
    items: [
      {
        title: "e-PMS",
        href: "/performance",
        description: "Track and manage employee performance reviews and goals",
        icon: TrendingUpIcon,
      },
    ],
    border: "warning",
    background: "warning",
    icon: "warning",
    categoryIcon: TrendingUpIcon
  },
  {
    title: "People Management",
    items: [],
    border: "marine",
    background: "marine",
    icon: "marine",
    categoryIcon: UserIcon
  },
  {
    title: "Compensation & Benefits",
    items: [],
    border: "danger",
    background: "danger",
    icon: "danger",
    categoryIcon: BriefcaseIcon
  },
  {
    title: "Workplace & Culture",
    items: [],
    border: "sunset",
    background: "sunset",
    icon: "sunset",
    categoryIcon: BuildingIcon
  },
  {
    title: "Tools & Planning",
    items: [],
    border: "warning",
    background: "warning",
    icon: "warning",
    categoryIcon: Building2Icon
  }
];

/** ชื่อแสดงผลต่อ rank (ค่า value ตรงกับคอลัมน์ rank ใน src/data/employee.csv) */
export const RANK_LABELS: Record<Rank, string> = {
  [Rank.PRESIDENT]: "President",
  [Rank.MD]: "MD",
  [Rank.VP]: "VP",
  [Rank.GM]: "GM",
  [Rank.AGM]: "AGM",
  [Rank.MGR]: "Manager",
  [Rank.SMGR]: "Senior Manager",
  [Rank.CHIEF]: "Chief",
  [Rank.FOREMAN]: "Foreman",
  [Rank.OFFICER]: "Officer",
  [Rank.STAFF]: "Staff",
  [Rank.WORKER]: "Worker",
};

/** ลำดับ seniority — อ้างอิง rank ที่มีใน employee.csv + SMGR ใน enum */
export const RANK_ORDER = [
  Rank.PRESIDENT,
  Rank.MD,
  Rank.VP,
  Rank.GM,
  Rank.AGM,
  Rank.MGR,
  Rank.SMGR,
  Rank.CHIEF,
  Rank.FOREMAN,
  Rank.OFFICER,
  Rank.STAFF,
  Rank.WORKER,
] as const satisfies readonly Rank[];

export type RankRecord = {
  value: Rank;
  label: string;
};

export const RANK_RECORDS: readonly RankRecord[] = RANK_ORDER.map((value) => ({
  value,
  label: RANK_LABELS[value],
}));

/** rank ที่ปรากฏใน employee.csv (ไม่มี SMGR) */
export const EMPLOYEE_CSV_RANKS = [
  Rank.PRESIDENT,
  Rank.MD,
  Rank.VP,
  Rank.GM,
  Rank.AGM,
  Rank.MGR,
  Rank.CHIEF,
  Rank.FOREMAN,
  Rank.OFFICER,
  Rank.STAFF,
  Rank.WORKER,
] as const satisfies readonly Rank[];

export function isEmployeeCsvRank(rank: string): rank is (typeof EMPLOYEE_CSV_RANKS)[number] {
  return (EMPLOYEE_CSV_RANKS as readonly string[]).includes(rank);
}

export function parseRankFromCsv(rank: string): Rank | null {
  const normalized = rank.trim();
  return (Object.values(Rank) as string[]).includes(normalized) ? (normalized as Rank) : null;
}