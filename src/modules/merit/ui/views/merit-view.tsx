"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Period } from "@/generated/prisma/enums";

import { MeritDefinitionScreen } from "@/modules/merit/ui/screens/merit-definition";

import { Approval, canPerforms } from "@/modules/tasks/permissions";
import { MeritEvaluationScreen } from "../screens/merit-evaluation";

interface Props {
  id: string;
  period: Period;
}

export const MeritView = ({ id, period }: Props) => {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(trpc.merit.getOne.queryOptions({ id, period }));

  const permissions = canPerforms(
    data.permission.role as Approval, 
    ["write", "read", "start-workflow", "approve"], 
    data.permission.status
  );

  if (period === Period.IN_DRAFT) {
    return <MeritDefinitionScreen id={id} period={period} data={data.form} permissions={permissions} />;
  }

  if (period === Period.EVALUATION_1ST || period === Period.EVALUATION_2ND) {
    return (
      <MeritEvaluationScreen 
        id={id} 
        period={period} 
        data={data.form} 
        permissions={permissions} 
        role={data.permission.role as Approval} 
        hasChecker={!!data.permission.checkerId}
      />
    );
  }

  return null;
};
