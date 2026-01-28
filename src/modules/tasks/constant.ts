import { FormType, Period, Status } from "@/generated/prisma/enums";

import { StatusVariant } from "@/modules/tasks/types";

export const routes: Record<FormType, string> = {
  [FormType.KPI]: "/kpi",
  [FormType.MERIT]: "/merit",
};

export const STATUSES: Record<Status, string> = {
  [Status.NOT_STARTED]: "Not Started",
  [Status.IN_DRAFT]: "In Draft",
  [Status.WAITING_APPROVER_1]: "Waiting Approver 1",
  [Status.WAITING_APPROVER_2]: "Waiting Approver 2",
  [Status.COMPLETED]: "Completed",
};  

export const STATUS_VARIANTS: Record<Status, {
  label: string;
  variant: StatusVariant;
}> = {
  [Status.NOT_STARTED]: { label: "Not Started", variant: "purple" },
  [Status.IN_DRAFT]: { label: "In Draft", variant: "orange" },
  [Status.WAITING_APPROVER_1]: { label: "Waiting Approver 1", variant: "default" },
  [Status.WAITING_APPROVER_2]: { label: "Waiting Approver 2", variant: "default" },
  [Status.COMPLETED]: { label: "Completed", variant: "green" },
};

export const periodRoutes: Record<Period, string> = {
  [Period.IN_DRAFT]: "definition",
  [Period.EVALUATION]: "evaluation",
  [Period.EVALUATION_1ST]: "evaluation1st",
  [Period.EVALUATION_2ND]: "evaluation2nd",
};

export const PERIOD_LABELS: Record<Period, string> = {
  [Period.IN_DRAFT]: "In Draft",
  [Period.EVALUATION]: "Evaluation",
  [Period.EVALUATION_1ST]: "Evaluation 1st",
  [Period.EVALUATION_2ND]: "Evaluation 2nd",
};

export const formType: Record<FormType, string> = {
  [FormType.MERIT]: "Merit",
  [FormType.KPI]: "KPI",
};