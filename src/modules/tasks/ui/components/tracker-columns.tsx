import { ColumnDef } from "@tanstack/react-table";
import { inferProcedureOutput } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";
import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import { Period, Status } from "@/generated/prisma/enums";
import { periodRoutes, STATUS_VARIANTS } from "../../constant";

type TrackerColumn = inferProcedureOutput<AppRouter["task"]["getManyByYear"]>["employees"][0];

export const columns: ColumnDef<TrackerColumn>[] = [
  {
    id: "employee",
    header: "Employee",
    meta: {
      width: "25%",
    },
    columns: [
      {
        id: "name",
        header: "",
        accessorFn: (row) => row.employee.name,
        cell: ({ row }) => (
          <div className="flex items-center text-sm w-full justify-between">
            <div className="flex items-center gap-2.5 my-1">
            <UserAvatar
              name={row.original.employee.name}
                className={{
                  container: "size-7",
                  fallback: "text-sm"
                }}
              />
              <div className="max-w-50">
                <div className="h-5 self-stretch text-sm font-medium leading-5 whitespace-nowrap overflow-hidden text-ellipsis text-primary">
                  {row.original.employee.name}
                </div>
                <div className="h-4 text-xs font-medium leading-3.5 whitespace-nowrap overflow-hidden text-ellipsis text-secondary">
                  {row.original.employee.department}
                </div>
              </div>
            </div>
          </div>
        ),
        meta: {
          width: "25%",
        },
        enableGlobalFilter: true,
      },
    ],
  },
  {
    id: "bonus",
    header: "Bonus",
    columns: [
      {
        id: "definition_bonus",
        header: "Definition",
        cell: ({ row }) => (
          <>
            {row.original.form.bonus?.tasks[0] && row.original.form.bonus?.tasks[0]?.status !== Status.NOT_STARTED && ( 
              <div className="justify-end absolute top-1.5 mx-1 inset-x-0.5 group-hover/row:flex hidden data-[disabled=true]:group-hover/row:hidden">
                <div className="sticky flex bg-popover p-0.5 h-6 shadow-[0px_4px_12px_-2px_#00000014,0_0_0_1.25px_#54483114] dark:shadow-[0_0_0_1px_#30302e,0px_4px_12px_-2px_#00000029] rounded end-1">
                  <Link 
                    href={`/performance/kpi/${row.original.form.bonus.id}/${periodRoutes[Period.IN_DRAFT]}`} 
                    className="flex items-center justify-center text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis text-primary tracking-wider uppercase px-1 hover:bg-accent rounded"
                  >
                    View
                  </Link>
                </div>
              </div>
            )}
            <StatusBadge {...STATUS_VARIANTS[row.original.form.bonus?.tasks[0]?.status ? row.original.form.bonus?.tasks[0]?.status : Status.NOT_STARTED]} />
          </>
        ),
        meta: {
          width: "15%",
        },
        enableGlobalFilter: false,
      },
      {
        id: "evaluation",
        header: "Evaluation",
        cell: ({ row }) => (
          <>
            {row.original.form.bonus?.tasks[1] && row.original.form.bonus?.tasks[1]?.status !== Status.NOT_STARTED && (
              <div 
                className="justify-end absolute top-1.5 mx-1 inset-x-0.5 group-hover/row:flex hidden data-[disabled=true]:group-hover/row:hidden"
              >
                <div className="sticky flex bg-popover p-0.5 h-6 shadow-[0px_4px_12px_-2px_#00000014,0_0_0_1.25px_#54483114] dark:shadow-[0_0_0_1px_#30302e,0px_4px_12px_-2px_#00000029] rounded end-1">
                  <Link 
                    href={`/performance/kpi/${row.original.form.bonus.id}/${periodRoutes[Period.EVALUATION]}`} 
                    className="flex items-center justify-center text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis text-primary tracking-wider uppercase px-1 hover:bg-accent rounded"
                  >
                    View
                  </Link>
                </div>
              </div>
            )}
            <StatusBadge {...STATUS_VARIANTS[row.original.form.bonus?.tasks[1]?.status ? row.original.form.bonus?.tasks[1]?.status : Status.NOT_STARTED]} />
          </>
        ),
        meta: {
          width: "15%",
        },
        enableGlobalFilter: false,
      },
    ],
    meta: {
      width: "30%",
      colSpan: 2,
    },
  },
  {
    id: "merit",
    header: "Merit",
    columns: [
      {
        id: "definition_merit",
        header: "Definition",
        cell: ({ row }) => (
          <>
            {row.original.form.merit?.tasks[0] && row.original.form.merit?.tasks[0]?.status !== Status.NOT_STARTED && (
              <div className="justify-end absolute top-1.5 mx-1 inset-x-0.5 group-hover/row:flex hidden data-[disabled=true]:group-hover/row:hidden">
                <div className="sticky flex bg-popover p-0.5 h-6 shadow-[0px_4px_12px_-2px_#00000014,0_0_0_1.25px_#54483114] dark:shadow-[0_0_0_1px_#30302e,0px_4px_12px_-2px_#00000029] rounded end-1">
                  <Link 
                    href={`/performance/merit/${row.original.form.merit.id}/${periodRoutes[Period.IN_DRAFT]}`} 
                    className="flex items-center justify-center text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis text-primary tracking-wider uppercase px-1 hover:bg-accent rounded"
                  >
                    View
                  </Link>
                </div>
              </div>
            )}
            <StatusBadge {...STATUS_VARIANTS[row.original.form.merit?.tasks[0]?.status ? row.original.form.merit?.tasks[0]?.status : Status.NOT_STARTED]} />
          </>
        ),
        meta: {
          width: "15%",
        },
        enableGlobalFilter: false,
      },
      {
        header: "Evaluation 1st",
        id: "evaluation1st_merit",  
        cell: ({ row }) => (
          <>
            {row.original.form.merit?.tasks[1] && row.original.form.merit?.tasks[1]?.status !== Status.NOT_STARTED && (
              <div className="justify-end absolute top-1.5 mx-1 inset-x-0.5 group-hover/row:flex hidden data-[disabled=true]:group-hover/row:hidden">
                <div className="sticky flex bg-popover p-0.5 h-6 shadow-[0px_4px_12px_-2px_#00000014,0_0_0_1.25px_#54483114] dark:shadow-[0_0_0_1px_#30302e,0px_4px_12px_-2px_#00000029] rounded end-1">
                  <Link 
                    href={`/performance/merit/${row.original.form.merit.id}/${periodRoutes[Period.EVALUATION_1ST]}`} 
                    className="flex items-center justify-center text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis text-primary tracking-wider uppercase px-1 hover:bg-accent rounded"
                  >
                    View
                  </Link>
                </div>
              </div>
            )}
            <StatusBadge {...STATUS_VARIANTS[row.original.form.merit?.tasks[1]?.status ? row.original.form.merit?.tasks[1]?.status : Status.NOT_STARTED]} />
          </>
        ),
        meta: {
          width: "15%",
        },
        enableGlobalFilter: false,
      },
      {
        header: "Evaluation 2nd",
        id: "evaluation2nd_merit",
        cell: ({ row }) => (
          <>
            {row.original.form.merit?.tasks[2] && row.original.form.merit?.tasks[2]?.status !== Status.NOT_STARTED && (
              <div className="justify-end absolute top-1.5 mx-1 inset-x-0.5 group-hover/row:flex hidden data-[disabled=true]:group-hover/row:hidden">
                <div className="sticky flex bg-popover p-0.5 h-6 shadow-[0px_4px_12px_-2px_#00000014,0_0_0_1.25px_#54483114] dark:shadow-[0_0_0_1px_#30302e,0px_4px_12px_-2px_#00000029] rounded end-1">
                  <Link 
                    href={`/performance/merit/${row.original.form.merit.id}/${periodRoutes[Period.EVALUATION_2ND]}`} 
                    className="flex items-center justify-center text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis text-primary tracking-wider uppercase px-1 hover:bg-accent rounded"
                  >
                    View
                  </Link>
                </div>
              </div>
            )}
            <StatusBadge {...STATUS_VARIANTS[row.original.form.merit?.tasks[2]?.status ? row.original.form.merit?.tasks[2]?.status : Status.NOT_STARTED]} />
          </>
        ),
        meta: {
          width: "15%",
        },
        enableGlobalFilter: false,
      },
    ],
    meta: {
      width: "45%",
      colSpan: 3,
    },
  },
];