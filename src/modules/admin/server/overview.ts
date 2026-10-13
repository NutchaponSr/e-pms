import "server-only";

import { FormType, Period, Status } from "@/generated/prisma/enums";
import db from "@/lib/db";
import { periodRoutes } from "@/modules/tasks/constant";
import { getWindows, type WindowInfo } from "@/modules/tasks/windows";

const PERIODS: {
  formType: FormType;
  period: Period;
  label: string;
  scored: boolean;
}[] = [
  {
    formType: FormType.KPI,
    period: Period.IN_DRAFT,
    label: "KPI Bonus · Setting",
    scored: false,
  },
  {
    formType: FormType.KPI,
    period: Period.EVALUATION,
    label: "KPI Bonus · ประเมินปลายปี",
    scored: true,
  },
  {
    formType: FormType.MERIT,
    period: Period.IN_DRAFT,
    label: "Merit · Setting",
    scored: false,
  },
  {
    formType: FormType.MERIT,
    period: Period.EVALUATION_1ST,
    label: "Merit · ประเมินกลางปี",
    scored: true,
  },
  {
    formType: FormType.MERIT,
    period: Period.EVALUATION_2ND,
    label: "Merit · ประเมินปลายปี",
    scored: true,
  },
];

const STATUS_RANK: Record<Status, number> = {
  [Status.NOT_STARTED]: 0,
  [Status.IN_DRAFT]: 1,
  [Status.WAITING_APPROVER_1]: 2,
  [Status.WAITING_APPROVER_2]: 3,
  [Status.COMPLETED]: 4,
};

const EVALUATION_PERIODS = new Set<Period>([
  Period.EVALUATION,
  Period.EVALUATION_1ST,
  Period.EVALUATION_2ND,
]);

export interface OverviewInput {
  year: number;
  division?: string;
  department?: string;
  level?: string;
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function readPeriod(context: unknown): Period | null {
  if (!context || typeof context !== "object" || Array.isArray(context))
    return null;
  const period = (context as { period?: unknown }).period;
  if (typeof period !== "string") return null;
  return (Object.values(Period) as string[]).includes(period)
    ? (period as Period)
    : null;
}

function periodKey(formType: FormType, period: Period) {
  return `${formType}:${period}`;
}

function formatBeDate(year: number, month: number, day: number) {
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return `${dd}/${mm}/${year + 543}`;
}

function windowState(
  window: WindowInfo | null,
): "unset" | "open" | "closed" | "upcoming" {
  if (!window) return "unset";
  if (window.isOpen) return "open";
  return new Date() < window.openAt ? "upcoming" : "closed";
}

function windowRange(year: number, window: WindowInfo | null) {
  if (!window) return null;
  const wraps =
    window.close.month < window.open.month ||
    (window.close.month === window.open.month &&
      window.close.day < window.open.day);
  return `${formatBeDate(year, window.open.month, window.open.day)} – ${formatBeDate(
    wraps ? year + 1 : year,
    window.close.month,
    window.close.day,
  )}`;
}

/** คะแนน KPI ถ่วงน้ำหนักจาก Approver 2 เต็มตามน้ำหนักรวม (โดยทั่วไป 100) */
function kpiApproverScore(
  kpis: { achievementApprover: unknown; weight: unknown }[],
): number | null {
  if (kpis.length === 0) return null;
  if (kpis.some((kpi) => toNumber(kpi.achievementApprover) == null))
    return null;

  return kpis.reduce((total, kpi) => {
    const achievement = toNumber(kpi.achievementApprover) ?? 0;
    const weight = toNumber(kpi.weight) ?? 0;
    return total + (achievement / 100) * weight;
  }, 0);
}

/** Competency + Culture จาก Approver 2 ช่วงนั้น เต็มตามน้ำหนัก (โดยทั่วไป 100) */
function meritApproverScore(
  competencyRecords: {
    weight: unknown;
    competencyEvaluations: { period: Period; levelApprover: unknown }[];
  }[],
  cultureRecords: {
    cultureEvaluations: { period: Period; levelBehaviorApprover: unknown }[];
  }[],
  period: Period,
): number | null {
  const hasCompetency = competencyRecords.some((record) =>
    record.competencyEvaluations.some(
      (evaluation) =>
        evaluation.period === period &&
        toNumber(evaluation.levelApprover) != null,
    ),
  );
  const hasCulture = cultureRecords.some((record) =>
    record.cultureEvaluations.some(
      (evaluation) =>
        evaluation.period === period &&
        toNumber(evaluation.levelBehaviorApprover) != null,
    ),
  );

  if (!hasCompetency && !hasCulture) return null;

  const competency = competencyRecords.reduce((total, record) => {
    const evaluation = record.competencyEvaluations.find(
      (item) => item.period === period,
    );
    const level = toNumber(evaluation?.levelApprover) ?? 0;
    const weight = toNumber(record.weight) ?? 0;
    return total + (level / 5) * weight;
  }, 0);

  const cultureCount = cultureRecords.length;
  const culture =
    cultureCount === 0
      ? 0
      : cultureRecords.reduce((total, record) => {
          const evaluation = record.cultureEvaluations.find(
            (item) => item.period === period,
          );
          const level = toNumber(evaluation?.levelBehaviorApprover) ?? 0;
          return total + (level / 5) * (30 / cultureCount);
        }, 0);

  return competency + culture;
}

export async function getAdminOverview(input: OverviewInput) {
  const where = {
    ...(input.division ? { division: input.division } : {}),
    ...(input.department ? { department: input.department } : {}),
    ...(input.level ? { level: input.level } : {}),
  };

  const [employees, directories, kpiWindows, meritWindows] = await Promise.all([
    db.employee.findMany({
      where,
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        division: true,
        department: true,
        level: true,
        forms: {
          where: { year: input.year },
          select: {
            id: true,
            type: true,
            tasks: { select: { id: true, status: true, context: true } },
            kpis: { select: { achievementApprover: true, weight: true } },
            competencyRecords: {
              select: {
                weight: true,
                competencyEvaluations: {
                  select: { period: true, levelApprover: true },
                },
              },
            },
            cultureRecords: {
              select: {
                cultureEvaluations: {
                  select: { period: true, levelBehaviorApprover: true },
                },
              },
            },
          },
        },
      },
    }),
    db.employee.findMany({
      select: { division: true, department: true, level: true },
      orderBy: { division: "asc" },
    }),
    getWindows(input.year, FormType.KPI),
    getWindows(input.year, FormType.MERIT),
  ]);

  const counts = new Map<string, Record<Status, number>>();

  for (const definition of PERIODS) {
    counts.set(periodKey(definition.formType, definition.period), {
      [Status.NOT_STARTED]: 0,
      [Status.IN_DRAFT]: 0,
      [Status.WAITING_APPROVER_1]: 0,
      [Status.WAITING_APPROVER_2]: 0,
      [Status.COMPLETED]: 0,
    });
  }

  const companySlots = new Map<string, { completed: number; total: number }>();
  const incomplete: {
    id: string;
    employeeId: string;
    name: string;
    division: string;
    department: string;
    periodKey: string;
    periodLabel: string;
    status: Status;
    tracking: string;
    href: string | null;
    rank: number;
  }[] = [];

  const scoreBuckets = PERIODS.filter((definition) => definition.scored).map(
    (definition) => ({
      key: periodKey(definition.formType, definition.period),
      label: definition.label,
      total: 0,
      scored: 0,
      pending: 0,
    }),
  );

  let completedTasks = 0;
  let pendingApprovals = 0;

  for (const employee of employees) {
    const company = employee.division || "ไม่ระบุ";
    const companyStat = companySlots.get(company) ?? { completed: 0, total: 0 };
    companyStat.total += PERIODS.length;
    companySlots.set(company, companyStat);

    const taskByPeriod = new Map<
      string,
      { id: string; status: Status; formId: string }
    >();

    for (const form of employee.forms) {
      for (const task of form.tasks) {
        const period = readPeriod(task.context);
        if (!period) continue;
        const key = periodKey(form.type, period);
        const current = taskByPeriod.get(key);
        if (
          !current ||
          STATUS_RANK[task.status] > STATUS_RANK[current.status]
        ) {
          taskByPeriod.set(key, {
            id: task.id,
            status: task.status,
            formId: form.id,
          });
        }
      }
    }

    for (const definition of PERIODS) {
      const key = periodKey(definition.formType, definition.period);
      const task = taskByPeriod.get(key);
      const status = task?.status ?? Status.NOT_STARTED;
      const bucket = counts.get(key);
      if (bucket) bucket[status] += 1;

      if (status === Status.COMPLETED) {
        completedTasks += 1;
        companyStat.completed += 1;
      }

      if (
        EVALUATION_PERIODS.has(definition.period) &&
        (status === Status.WAITING_APPROVER_1 ||
          status === Status.WAITING_APPROVER_2)
      ) {
        pendingApprovals += 1;
      }

      const draft = taskByPeriod.get(
        periodKey(definition.formType, Period.IN_DRAFT),
      );
      const tracking =
        definition.period === Period.IN_DRAFT
          ? "ช่วงตั้งค่า"
          : draft?.status === Status.COMPLETED
            ? "เสร็จช่วงดำเนินการ"
            : "รอช่วงก่อนหน้า";

      if (status !== Status.COMPLETED) {
        incomplete.push({
          id: task?.id ?? `${employee.id}:${key}`,
          employeeId: employee.id,
          name: employee.name,
          division: employee.division,
          department: employee.department,
          periodKey: key,
          periodLabel: definition.label,
          status,
          tracking,
          href: task
            ? `/performance/${definition.formType === FormType.KPI ? "kpi" : "merit"}/${task.formId}/${periodRoutes[definition.period]}?year=${input.year}`
            : null,
          rank: STATUS_RANK[status],
        });
      }

      const scoreBucket = scoreBuckets.find((item) => item.key === key);
      if (!scoreBucket) continue;

      if (status !== Status.COMPLETED) {
        scoreBucket.pending += 1;
        continue;
      }

      const form = employee.forms.find(
        (item) => item.type === definition.formType,
      );
      const score = !form
        ? null
        : definition.formType === FormType.KPI
          ? kpiApproverScore(form.kpis)
          : meritApproverScore(
              form.competencyRecords,
              form.cultureRecords,
              definition.period,
            );

      if (score == null) continue;
      scoreBucket.total += score;
      scoreBucket.scored += 1;
    }
  }

  incomplete.sort(
    (a, b) =>
      b.rank - a.rank ||
      a.employeeId.localeCompare(b.employeeId) ||
      a.periodLabel.localeCompare(b.periodLabel),
  );

  const employeeCount = employees.length;
  const totalSlots = employeeCount * PERIODS.length;

  const divisions = [
    ...new Set(directories.map((item) => item.division).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "th"));
  const levels = [
    ...new Set(directories.map((item) => item.level).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "th"));
  const departments = directories
    .filter((item) => item.department)
    .map((item) => ({ division: item.division, name: item.department }));

  return {
    year: input.year,
    employeeCount,
    completedTasks,
    totalSlots,
    incompleteTasks: totalSlots - completedTasks,
    pendingApprovals,
    options: { divisions, departments, levels },
    periods: PERIODS.map((definition) => {
      const key = periodKey(definition.formType, definition.period);
      const window =
        (definition.formType === FormType.KPI ? kpiWindows : meritWindows)[
          definition.period
        ] ?? null;
      const statusCounts = counts.get(key) ?? {
        [Status.NOT_STARTED]: 0,
        [Status.IN_DRAFT]: 0,
        [Status.WAITING_APPROVER_1]: 0,
        [Status.WAITING_APPROVER_2]: 0,
        [Status.COMPLETED]: 0,
      };
      const completed = statusCounts[Status.COMPLETED];
      return {
        key,
        label: definition.label,
        state: windowState(window),
        rangeLabel: windowRange(input.year, window),
        counts: {
          notStarted: statusCounts[Status.NOT_STARTED],
          inDraft: statusCounts[Status.IN_DRAFT],
          approver1: statusCounts[Status.WAITING_APPROVER_1],
          approver2: statusCounts[Status.WAITING_APPROVER_2],
          completed,
        },
        completionRate:
          employeeCount === 0
            ? 0
            : Math.round((completed / employeeCount) * 100),
      };
    }),
    incomplete: incomplete.map(({ rank: _rank, ...item }) => item),
    companies: [...companySlots.entries()]
      .map(([name, stat]) => ({
        name,
        rate:
          stat.total === 0
            ? 0
            : Math.round((stat.completed / stat.total) * 100),
      }))
      .sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name, "th")),
    scores: scoreBuckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      average: bucket.scored === 0 ? null : bucket.total / bucket.scored,
      max: 100,
      scoredCount: bucket.scored,
      pendingCount: bucket.pending,
    })),
  };
}
