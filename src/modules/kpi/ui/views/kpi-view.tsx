"use client";

import { Period } from "@/generated/prisma/enums";
import { KpiDefinitionScreen } from "@/modules/kpi/ui/screens/kpi-definition-screen";
import { Approval, canPerforms, getUserRole } from "@/modules/tasks/permissions";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

interface Props {
  id: string;
  period: Period;
  year: number;
}

export const KpiView = ({
  id,
  period,
  year,
}: Props) => {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(trpc.kpi.getOne.queryOptions({ id, period }));

  const permissions = canPerforms(data.permission.role as Approval, ["write", "read", "start-workflow", "approve"], data.permission.status);

  if (period === Period.IN_DRAFT) {
    return (
      <KpiDefinitionScreen 
        id={id} 
        form={data.form} 
        period={period} 
        year={2025} 
        permissions={permissions}
      />
    );
  }
};
