"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Period } from "@/generated/prisma/enums";

import { EmployeeInfo } from "@/components/employee-info";
import { useWeight } from "../../stores/use-weight";
import { validateWeight } from "../../utils";
import { Rank } from "@/types/employees";

interface Props {
  id: string;
  period: Period;
}

export const KpiLayout = ({ id, period }: Props) => {
  const trpc = useTRPC();

  const { data } = useSuspenseQuery(trpc.kpi.getOne.queryOptions({ id, period }));

  const { weight } = useWeight();

  return (
    <>
      <EmployeeInfo 
        owner={data.form?.tasks!.owner} 
        checker={data.form?.tasks?.checker} 
        approver={data.form?.tasks?.approver} 
        showActualWeight={period === Period.IN_DRAFT}
        weight={{
          actual: weight,
          full: validateWeight(data.form?.tasks?.owner.rank as Rank),
        }}
      />
    </>
  );
};
