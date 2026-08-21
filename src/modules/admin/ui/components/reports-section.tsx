"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DownloadIcon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { FormType } from "@/generated/prisma/enums";

import {
  formType as FORM_TYPE_LABELS,
  PERIOD_LABELS,
  STATUS_VARIANTS,
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

import { downloadExcel } from "../utils";

export const ReportsSection = () => {
  const trpc = useTRPC();

  const [employeeId, setEmployeeId] = useState<string>("");
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: employees } = useQuery(trpc.admin.getEmployees.queryOptions());

  const { data: forms, isLoading } = useQuery({
    ...trpc.admin.getEmployeeForms.queryOptions({ employeeId, year }),
    enabled: !!employeeId,
  });

  const exportForm = useMutation(
    trpc.admin.exportForm.mutationOptions({
      onSuccess: (res) => {
        const prefix = res.type === FormType.KPI ? "kpi" : "merit";
        downloadExcel(res.file, `${prefix}-export-${res.id}.xlsx`);
        toast.success("Exported", { id: "admin-export" });
      },
      onError: (error) => toast.error(error.message, { id: "admin-export" }),
    }),
  );

  const selectedEmployee = (employees ?? []).find((e) => e.id === employeeId);

  return (
    <section className="flex flex-col gap-4 pt-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={employeeId} onValueChange={setEmployeeId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {(employees ?? []).map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.id} — {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-28"
        />
      </div>

      {!employeeId ? (
        <p className="text-sm text-tertiary py-8 text-center">
          Select an employee to view their forms
        </p>
      ) : isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sidebar text-left text-xs text-secondary">
                <th className="px-3 py-2 font-normal">Form</th>
                <th className="px-3 py-2 font-normal">Progress</th>
                <th className="px-3 py-2 font-normal text-right">Export</th>
              </tr>
            </thead>
            <tbody>
              {(forms ?? []).map((form) => (
                <tr key={form.id} className="border-t border-border odd:bg-sidebar/50">
                  <td className="px-3 py-2">
                    {FORM_TYPE_LABELS[form.type]}{" "}
                    <span className="text-tertiary">({form.year})</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {form.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-1.5">
                          <span className="text-xs text-tertiary">
                            {PERIOD_LABELS[task.period]}:
                          </span>
                          <StatusBadge
                            label={STATUS_VARIANTS[task.status].label}
                            variant={STATUS_VARIANTS[task.status].variant}
                          />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={exportForm.isPending}
                      onClick={() => {
                        toast.loading("Exporting...", { id: "admin-export" });
                        exportForm.mutate({ formId: form.id });
                      }}
                    >
                      <DownloadIcon className="size-4" />
                      Excel
                    </Button>
                  </td>
                </tr>
              ))}
              {(forms ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-tertiary">
                    No forms found for {selectedEmployee?.name ?? employeeId} in {year}
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
