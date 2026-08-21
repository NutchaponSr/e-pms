"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const CYCLE_YEAR = 2000;

function toDateValue(value: { month: number; day: number } | null) {
  if (!value) return "";
  return `${CYCLE_YEAR}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

function parseMonthDay(value: string) {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [, month, day] = parts;
  if (!month || !day) return null;
  return { month, day };
}

export const WindowsSection = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [edited, setEdited] = useState<Record<string, { open?: string; close?: string }>>({});

  const { data: windows, isLoading } = useQuery(trpc.admin.getWindows.queryOptions());

  const invalidate = () =>
    queryClient.invalidateQueries(trpc.admin.getWindows.queryOptions());

  const upsertWindow = useMutation(
    trpc.admin.upsertWindow.mutationOptions({
      onSuccess: () => {
        toast.success("Window saved");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteWindow = useMutation(
    trpc.admin.deleteWindow.mutationOptions({
      onSuccess: () => {
        toast.success("Window cleared (always open)");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <section className="flex flex-col gap-4 pt-4">
      <p className="text-xs text-tertiary">
        Dates repeat every year (day and month only). Periods without dates are always open.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sidebar text-left text-xs text-secondary">
                <th className="px-3 py-2 font-normal">Period</th>
                <th className="px-3 py-2 font-normal">Open (day/month)</th>
                <th className="px-3 py-2 font-normal">Close (day/month)</th>
                <th className="px-3 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(windows ?? []).map((window) => {
                const key = `${window.formType}-${window.period}`;
                const openValue = edited[key]?.open ?? toDateValue(window.open);
                const closeValue = edited[key]?.close ?? toDateValue(window.close);

                return (
                  <tr key={key} className="border-t border-border odd:bg-sidebar/50">
                    <td className="px-3 py-2">{window.label}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="date"
                        value={openValue}
                        onChange={(e) =>
                          setEdited((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], open: e.target.value },
                          }))
                        }
                        className="w-40"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="date"
                        value={closeValue}
                        onChange={(e) =>
                          setEdited((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], close: e.target.value },
                          }))
                        }
                        className="w-40"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={!openValue || !closeValue || upsertWindow.isPending}
                          onClick={() => {
                            const open = parseMonthDay(openValue);
                            const close = parseMonthDay(closeValue);
                            if (!open || !close) return;

                            upsertWindow.mutate({
                              formType: window.formType,
                              period: window.period,
                              open,
                              close,
                            });
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={(!window.open && !window.close) || deleteWindow.isPending}
                          onClick={() => {
                            setEdited((prev) => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            });
                            deleteWindow.mutate({
                              formType: window.formType,
                              period: window.period,
                            });
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
