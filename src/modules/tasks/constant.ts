import { FormType, Period, Status } from "@/generated/prisma/enums";

import { StatusVariant } from "@/modules/tasks/types";

export const routes: Record<FormType, string> = {
  [FormType.KPI]: "/kpi",
  [FormType.MERIT]: "/merit",
};

export const STATUSES: Record<Status, string> = {
  [Status.NOT_STARTED]: "Not Started",
  [Status.IN_DRAFT]: "In Draft",
  [Status.PENDING_CHECKER]: "Pending Checker",
  [Status.REJECTED_BY_CHECKER]: "Rejected by Checker",
  [Status.PENDING_APPROVER]: "Pending Approver",
  [Status.REJECTED_BY_APPROVER]: "Rejected by Approver",
  [Status.DONE]: "Done",
};  

export const STATUS_VARIANTS: Record<Status, {
  label: string;
  variant: StatusVariant;
}> = {
  [Status.NOT_STARTED]: { label: "Not Started", variant: "purple" },
  [Status.IN_DRAFT]: { label: "In Draft", variant: "orange" },
  [Status.PENDING_CHECKER]: { label: "Pending Checker", variant: "default" },
  [Status.REJECTED_BY_CHECKER]: { label: "Rejected by Checker", variant: "red" },
  [Status.PENDING_APPROVER]: { label: "Pending Approver", variant: "default" },
  [Status.REJECTED_BY_APPROVER]: { label: "Rejected by Approver", variant: "red" },
  [Status.DONE]: { label: "Done", variant: "green" },
};

export const periodRoutes: Record<Period, string> = {
  [Period.IN_DRAFT]: "definition",
  [Period.EVALUATION]: "evaluation",
  [Period.EVALUATION_1ST]: "evaluation1st",
  [Period.EVALUATION_2ND]: "evaluation2nd",
};