import Link from "next/link";

import { format } from "date-fns";
import { GoProject } from "react-icons/go";

import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";
import { periodRoutes, STATUS_VARIANTS } from "../../constant";
import { StatusBadge } from "@/components/status-badge";
import { FormType } from "@/generated/prisma/enums";

interface Props {
  task: inferProcedureOutput<AppRouter["task"]["todo"]>[number];
}

export const TaskItem = ({ task }: Props) => {
  const status = STATUS_VARIANTS[task.status];

  const href = task.formType === FormType.KPI
    ? `/performance/kpi/${task.formId}/${periodRoutes[task.period]}`
    : `/performance/merit/${task.formId}/${periodRoutes[task.period]}`

  return (
    <div className="flex relative">
      <Link
        role="link"
        href={href}
        className="flex text-primary select-none transition hover:bg-primary/6 relative grow overflow-hidden rounded h-7.5 items-center px-1"
      >
        <div className="relative text-sm overflow-hidden items-center py-0 px-2 flex grow shrink basis-auto min-h-7.5 min-w-[120px]">
          <div className="max-w-full w-auto whitespace-nowrap break-normal leading-normal overflow-hidden text-ellipsis inline font-medium text-sm">
            {task.owner}
          </div>
          <div className="whitespace-nowrap overflow-hidden text-ellipsis text-tertiary text-xs inline-flex">
            <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis mx-[0.5em]">
              —
            </span>
            <span className="flex text-xs text-tertiary overflow-hidden">
              {task.year}
            </span>
          </div>
          <div className="flex items-center ms-4">
            <StatusBadge {...status} />
          </div>
        </div>
        <div className="leading-normal whitespace-nowrap overflow-hidden text-ellipsis inline text-xs text-tertiary">
          {format(task.updatedAt, "dd/LL/yyyy")}
        </div>
        <div className="relative text-sm overflow-hidden items-center py-0 px-2 flex grow-0 shrink-0 basis-auto min-h-7.5 min-w-[100px]">
          <div className="flex flex-row items-center gap-1">
            <div className="flex items-center justify-center size-5 shrink-0">
              <GoProject className="size-4" />
            </div>
            <div className="leading-1 font-medium whitespace-nowrap underline underline-offset-2 decoration-primary/16">
              {task.formType}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}