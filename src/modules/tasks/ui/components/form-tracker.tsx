import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getFilteredRowModel, getCoreRowModel, useReactTable, flexRender } from "@tanstack/react-table";
import { CircleDashedIcon, SearchIcon, SquareActivityIcon } from "lucide-react";
import { useState } from "react";
import { columns } from "./tracker-columns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { STATUS_VARIANTS } from "../../constant";
import { Status } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { Command } from "cmdk";
import { Checkbox } from "@/components/ui/checkbox";
import { statusBadgeVariants } from "@/components/status-badge";
import { StatusInfo } from "./status-info";

interface Props {
  year: number;
}

type FilterState = {
  search: string;
  status: string[];
};

export const FormTracker = ({ year }: Props) => {
  const trpc = useTRPC();

  const [globalFilter, setGlobalFilter] = useState<FilterState>({
    search: "",
    status: [],
  });

  const { data: tasks } = useSuspenseQuery(
    trpc.task.getManyByYear.queryOptions({ year }),
  );

  const table = useReactTable({
    data: tasks.employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const filter = filterValue as FilterState;

      const searchValue = (filter.search || "").toLowerCase().trim();
      const statusFilter = filter.status || [];

      if (searchValue) {
        const fullName = row.original.employee.name?.toLowerCase() || "";

        if (!fullName.includes(searchValue)) return false;
      }

      if (statusFilter.length > 0) {
        const allTasks = [
          ...(row.original.form.bonus?.tasks || []),
          ...(row.original.form.merit?.tasks || []),
        ];

        if (allTasks.length === 0)
          return statusFilter.includes("NOT_STARTED");

        const hasMatched = allTasks.some((task) =>
          statusFilter.includes(task.status as string),
        );

        if (!hasMatched) return false;
      }

      return true;
    },
  });

  const kpiBonus = table.getRowModel().rows.filter((row) => row.original.form.bonus);
  const merit = table.getRowModel().rows.filter((row) => row.original.form.merit);

  return (
    <section className="select-none">
      <div className="shrink-0 flex justify-between items-center h-8 pb-3.5 mx-2">
        <div className="contents">
          <div className="flex items-center text-xs font-medium text-secondary shrink-0 max-w-full">
            <div className="flex items-center justify-center size-4 me-2">
              <SquareActivityIcon className="size-3.5 shrink-0 block text-secondary" />
            </div>
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">Form tracker</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-4">
          <StatusInfo title="Employee" value={table.getRowModel().rows.length} />
          <StatusInfo title="Bonus Approved"  
            data={[
              {
                label: "Definition",
                value: kpiBonus.filter((row) =>
                  row.original.form.bonus?.tasks?.some(
                    (task) =>
                      task.status === Status.DONE &&
                      typeof task.context === "object" &&
                      task.context !== null &&
                      "period" in task.context &&
                      (task.context as { period?: string }).period === "IN_DRAFT"
                  )
                ).length,
              },
              {
                label: "Evaluation",
                value: kpiBonus.filter((row) =>
                  row.original.form.bonus?.tasks?.some(
                    (task) =>
                      task.status === Status.DONE &&
                      typeof task.context === "object" &&
                      task.context !== null &&
                      "period" in task.context &&
                      (task.context as { period?: string }).period === "EVALUATION"
                  )
                ).length,
              },
            ]}
          />
          <StatusInfo title="Merit Approved"  
            data={[
              {
                label: "Definition",
                value: merit.filter((row) =>
                  row.original.form.merit?.tasks?.some(
                    (task) =>
                      task.status === Status.DONE &&
                      typeof task.context === "object" &&
                      task.context !== null &&
                      "period" in task.context &&
                      (task.context as { period?: string }).period === "IN_DRAFT"
                  )
                ).length,
              },
              {
                label: "Evaluation 1st",
                value: merit.filter((row) =>
                  row.original.form.merit?.tasks?.some(
                    (task) =>
                      task.status === Status.DONE &&
                      typeof task.context === "object" &&
                      task.context !== null &&
                      "period" in task.context &&
                      (task.context as { period?: string }).period === "EVALUATION_1ST"
                  )
                ).length,
              },
              {
                label: "Evaluation 2nd",
                value: merit.filter((row) =>
                  row.original.form.merit?.tasks?.some(
                    (task) =>
                      task.status === Status.DONE &&
                      typeof task.context === "object" &&
                      task.context !== null &&
                      "period" in task.context &&
                      (task.context as { period?: string }).period === "EVALUATION_2ND"
                  )
                ).length,
              },
            ]}
          />
          <StatusInfo title="Pending"
            data={[
              {
                label: "KPI Bonus",
                value: kpiBonus.filter((row) => row.original.form.bonus?.tasks?.some((task) => task.status === Status.PENDING_APPROVER || task.status === Status.PENDING_CHECKER)).length,
              },
              {
                label: "Merit",
                value: merit.filter((row) => row.original.form.merit?.tasks?.some((task) => task.status === Status.PENDING_APPROVER || task.status === Status.PENDING_CHECKER)).length,
              },  
            ]}
          />  
        </div>

        <div className="flex items-center flex-wrap gap-y-4 gap-x-1">
          <div className="flex items-center w-full text-xs leading-4 relative rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.08)] bg-accent cursor-text px-2.5 py-1 max-w-[250px] me-auto">
            <SearchIcon className="size-4 mr-1.5" />
            <input 
              type="text"
              placeholder="Search..."
              className="w-full text-primary border-none bg-none resize-none focus-visible:outline-none font-normal placeholder:text-tertiary"
              value={globalFilter.search || ""}
              onChange={(e) => setGlobalFilter({ ...globalFilter, search: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  table.setGlobalFilter(globalFilter);
                }
              }}
            />
          </div>
          <div className="flex flex-wrap items-stretch gap-y-4 gap-x-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-sm font-normal">
                  <CircleDashedIcon />
                  {globalFilter.status.length > 0 
                    ? globalFilter.status.length === 1
                      ? STATUS_VARIANTS[globalFilter.status[0] as Status].label
                      : `${globalFilter.status.length} labels`
                    : "Status"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0" align="end">
                <Command>
                  <div className="shrink-0 border-b border-border/30">
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <div className="flex items-center w-full text-sm leading-5 relative rounded-sm shadow-[0_0_0_1.25px_#0f0f0f1a] dark:shadow-[0_0_0_1.25px_#ffffff13] bg-input cursor-text px-3 h-7 py-0.5 transition-all duration-200 focus-within:shadow-[0_0_0_1.5px_#ffffff20]">
                        <SearchIcon className="absolute left-2 h-4 w-4 pointer-events-none" />
                        <Command.Input 
                          placeholder="Search..."
                          className="w-full block resize-none p-0 pl-5 bg-transparent focus-visible:outline-none focus-visible:ring-0 text-sm placeholder:text-tertiary"
                        />
                      </div>
                    </div>
                  </div>  
                  <Command.List className="p-1">
                    {Object.entries(STATUS_VARIANTS).map(([statusKey, status]) => {
                      const statusKeyString = String(statusKey);
                      const isChecked = globalFilter.status.includes(statusKeyString);
                      return (
                        <Command.Item
                          key={statusKeyString}
                          value={status.label}
                          onSelect={() => {
                            const newStatus = isChecked
                              ? globalFilter.status.filter((s) => s !== statusKeyString)
                              : [...globalFilter.status, statusKeyString];
                            setGlobalFilter({ ...globalFilter, status: newStatus });
                          }}
                          className="cursor-pointer h-7 flex items-center gap-2 px-1.5 rounded w-full transition data-[selected=true]:bg-primary/6 mt-px"
                        >
                          <Checkbox checked={isChecked} />
                          <div className={cn("size-2 rounded-full", statusBadgeVariants({ background: status.variant }))} />
                          <span className="text-xs font-medium text-primary">{status.label}</span>
                        </Command.Item>
                      );
                    })}
                  </Command.List>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <table className="w-full border-collapse overflow-hidden">
          <thead className="border-y border-description bg-accent">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    style={{ width: header.column.columnDef.meta?.width }}
                    className={cn(
                      headerGroup.id === "0" && "border-r border-description border-b",
                      "border-r border-description first:border-b-0 last:border-r-0",
                    )}
                  >
                    <div className="flex items-center text-xs text-secondary font-normal h-8 px-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-start text-sm text-secondary font-normal h-10 px-2 border-b border-description">
                  No data found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-description relative group/row">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn("border-r border-description last:border-r-0")}
                      >
                        <div className="flex items-center text-xs text-secondary font-normal h-11 px-2 relative">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};