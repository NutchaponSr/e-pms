"use client";

import { SquareLibraryIcon } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Period } from "@/generated/prisma/enums";

import { EmployeeInfo } from "@/components/employee-info";

interface Props {
  id: string;
  period: Period;
}

export const KpiLayout = ({ id, period }: Props) => {
  const trpc = useTRPC();

  const form = useSuspenseQuery(trpc.kpi.getOne.queryOptions({ id, period }));

  return (
    <>
      <div className="sticky top-0 col-span-full z-100 bg-background after:absolute after:-bottom-px after:left-0 after:z-50 after:w-full after:h-[1.25px] after:bg-border after:block">
        <div className="flex items-center flex-wrap gap-1 px-3 py-2.5 select-none">
          <SquareLibraryIcon className="size-4.5 shrink-0 block" />
          <p className="text-sm font-medium">KPI Bonus</p>
        </div>
      </div>

      <EmployeeInfo 
        owner={form.data?.tasks!.owner} 
        checker={form.data?.tasks?.checker} 
        approver={form.data?.tasks?.approver} 
      />
    </>
  );
};
