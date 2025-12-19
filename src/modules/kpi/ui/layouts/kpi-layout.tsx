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

  const { data: form } = useSuspenseQuery(trpc.kpi.getOne.queryOptions({ id, period }));

  const { weight } = useWeight();

  return (
    <>
      {/* <div className="sticky top-0 col-span-full z-100 bg-background after:absolute after:-bottom-px after:left-0 after:z-50 after:w-full after:h-[1.25px] after:bg-border after:block">
        <div className="flex items-center flex-wrap gap-1 px-3 py-2.5 select-none">
          <SquareLibraryIcon className="size-4.5 shrink-0 block" />
          <p className="text-sm font-medium">KPI Bonus</p>
        </div>
      </div> */}

      <EmployeeInfo 
        owner={form?.tasks!.owner} 
        checker={form?.tasks?.checker} 
        approver={form?.tasks?.approver} 
        weight={{
          actual: weight,
          full: validateWeight(form.tasks?.owner.rank as Rank),
        }}
      />
    </>
  );
};
