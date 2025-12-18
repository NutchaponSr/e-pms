"use client";

import { Period } from "@/generated/prisma/enums";
import { KpiDefinitionScreen } from "@/modules/kpi/ui/screens/kpi-definition-screen";
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

  const { data: form } = useSuspenseQuery(trpc.kpi.getOne.queryOptions({ id, period }));

  console.log(period);

  if (period === Period.IN_DRAFT) {
    return <KpiDefinitionScreen id={id} form={form} period={period} year={2025} />;
  }
};
