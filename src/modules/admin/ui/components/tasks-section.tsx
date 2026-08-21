"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLinkIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { FormType, Status } from "@/generated/prisma/enums";

import {
  formType as FORM_TYPE_LABELS,
  PERIOD_LABELS,
  periodRoutes,
  STATUS_VARIANTS,
  STATUSES,
} from "@/modules/tasks/constant";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export const TasksSection = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [year, setYear] = useState(new Date().getFullYear());
  const [type, setType] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [pendingStatus, setPendingStatus] = useState<Record<string, Status>>({});

  const input = {
    year,
    ...(type !== ALL ? { type: type as FormType } : {}),
  };

  const { data: tasks, isLoading } = useQuery(
    trpc.admin.getTasks.queryOptions(input),
  );

  const setTaskStatus = useMutation(
    trpc.admin.setTaskStatus.mutationOptions({
      onSuccess: () => {
        toast.success("Task status updated");
        queryClient.invalidateQueries(trpc.admin.getTasks.queryOptions(input));
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const filtered = (tasks ?? []).filter((task) =>
    `${task.owner.id} ${task.owner.name}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <section className="flex flex-col gap-4 pt-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-28"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Form type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            <SelectItem value={FormType.KPI}>KPI Bonus</SelectItem>
            <SelectItem value={FormType.MERIT}>KPI Merit</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search by employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sidebar text-left text-xs text-secondary">
                <th className="px-3 py-2 font-normal">Employee</th>
                <th className="px-3 py-2 font-normal">Form</th>
                <th className="px-3 py-2 font-normal">Period</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 font-normal">Set Status</th>
                <th className="px-3 py-2 font-normal text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => {
                const selected = pendingStatus[task.id] ?? task.status;
                const href = `/performance/${task.formType === FormType.KPI ? "kpi" : "merit"}/${task.formId}/${periodRoutes[task.period]}?year=${task.year}`;

                return (
                  <tr key={task.id} className="border-t border-border odd:bg-sidebar/50">
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-tertiary me-1.5">
                        {task.owner.id}
                      </span>
                      {task.owner.name}
                    </td>
                    <td className="px-3 py-2">{FORM_TYPE_LABELS[task.formType]}</td>
                    <td className="px-3 py-2 text-tertiary">
                      {PERIOD_LABELS[task.period]}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        label={STATUS_VARIANTS[task.status].label}
                        variant={STATUS_VARIANTS[task.status].variant}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={selected}
                          onValueChange={(value) =>
                            setPendingStatus((prev) => ({
                              ...prev,
                              [task.id]: value as Status,
                            }))
                          }
                        >
                          <SelectTrigger size="sm" className="w-44">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(Status).map((status) => (
                              <SelectItem key={status} value={status}>
                                {STATUSES[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={selected === task.status || setTaskStatus.isPending}
                          onClick={() =>
                            setTaskStatus.mutate({
                              taskId: task.id,
                              status: selected,
                            })
                          }
                        >
                          Apply
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={href} target="_blank">
                          <ExternalLinkIcon className="size-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-tertiary">
                    No tasks found for {year}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
