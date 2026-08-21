"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { Period } from "@/generated/prisma/enums";
import type { KpiPeriod } from "@/modules/kpi/constants";
import { KpiDefinitionScreen } from "@/modules/kpi/ui/screens/kpi-definition-screen";
import { KpiEvaluationScreen } from "@/modules/kpi/ui/screens/kpi-evaluation-screen";
import {
  type Action,
  type Approval,
  canPerforms,
} from "@/modules/tasks/permissions";
import { useTRPC } from "@/trpc/client";

const KPI_ACTIONS: Action[] = [
  "write",
  "read",
  "start-workflow",
  "approve",
  "delete",
];

interface Props {
  id: string;
  period: KpiPeriod;
  year: number;
}

export const KpiView = ({ id, period, year }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.kpi.getOne.queryOptions({ id, period }),
  );

  const role = data.permission.role as Approval;
  const permissions = canPerforms(role, KPI_ACTIONS, data.permission.status);

  if (period === Period.IN_DRAFT) {
    return (
      <KpiDefinitionScreen
        id={id}
        form={data.form}
        period={period}
        year={year}
        permissions={permissions}
      />
    );
  }

  return (
    <KpiEvaluationScreen
      id={id}
      period={period}
      role={role}
      form={data.form}
      permissions={permissions}
    />
  );
};
