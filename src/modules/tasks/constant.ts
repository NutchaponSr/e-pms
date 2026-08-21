import { FormType, Period, Status } from "@/generated/prisma/enums";

import type { StatusVariant } from "@/modules/tasks/types";

export const routes: Record<FormType, string> = {
  [FormType.KPI]: "/kpi",
  [FormType.MERIT]: "/merit",
};

export const STATUSES: Record<Status, string> = {
  [Status.NOT_STARTED]: "Not Started",
  [Status.IN_DRAFT]: "In Draft",
  [Status.WAITING_APPROVER_1]: "Waiting Evaluator 1",
  [Status.WAITING_APPROVER_2]: "Waiting Evaluator 2",
  [Status.COMPLETED]: "Completed",
};

export const STATUS_VARIANTS: Record<
  Status,
  {
    label: string;
    variant: StatusVariant;
  }
> = {
  [Status.NOT_STARTED]: { label: "Not Started", variant: "purple" },
  [Status.IN_DRAFT]: { label: "In Draft", variant: "orange" },
  [Status.WAITING_APPROVER_1]: {
    label: "Waiting Evaluator 1",
    variant: "default",
  },
  [Status.WAITING_APPROVER_2]: {
    label: "Waiting Evaluator 2",
    variant: "default",
  },
  [Status.COMPLETED]: { label: "Completed", variant: "green" },
};

export function getTaskStatus(status?: Status) {
  return status ? STATUS_VARIANTS[status] : undefined;
}

export const periodRoutes: Record<Period, string> = {
  [Period.IN_DRAFT]: "definition",
  [Period.EVALUATION]: "evaluation",
  [Period.EVALUATION_1ST]: "evaluation1st",
  [Period.EVALUATION_2ND]: "evaluation2nd",
};

export const routePeriods: Record<string, Period> = {
  definition: Period.IN_DRAFT,
  evaluation: Period.EVALUATION,
  evaluation1st: Period.EVALUATION_1ST,
  evaluation2nd: Period.EVALUATION_2ND,
};

export function parsePeriodParam(slug: string): Period | undefined {
  return routePeriods[slug];
}

export const PERIOD_LABELS: Record<Period, string> = {
  [Period.IN_DRAFT]: "In Draft",
  [Period.EVALUATION]: "Evaluation",
  [Period.EVALUATION_1ST]: "Evaluation 1st",
  [Period.EVALUATION_2ND]: "Evaluation 2nd",
};

export const formType: Record<FormType, string> = {
  [FormType.MERIT]: "KPI Merit",
  [FormType.KPI]: "KPI Bonus",
};
