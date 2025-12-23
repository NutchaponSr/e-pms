"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Period } from "@/generated/prisma/enums";

import { MeritDefinitionScreen } from "@/modules/merit/ui/screens/merit-definition";

import { Approval, canPerforms } from "@/modules/tasks/permissions";

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

  return null;
};
