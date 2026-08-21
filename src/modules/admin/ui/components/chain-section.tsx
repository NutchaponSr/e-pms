"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

interface Editing {
  employeeId: string;
  employeeName: string;
  checkerId: string | null;
  approverId: string | null;
}

export const ChainSection = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);

  const { data: employees, isLoading } = useQuery(
    trpc.admin.getEmployees.queryOptions(),
  );

  const updateChain = useMutation(
    trpc.admin.updateApprovalChain.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          result.advancedTasks > 0
            ? `Approval chain updated (${result.advancedTasks} task(s) moved to Evaluator 2)`
            : "Approval chain updated",
        );
        setEditing(null);
        queryClient.invalidateQueries(trpc.admin.getEmployees.queryOptions());
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const employeeById = new Map((employees ?? []).map((e) => [e.id, e]));

  const filtered = (employees ?? []).filter((employee) =>
    `${employee.id} ${employee.name}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const renderPerson = (id: string | null) => {
    if (!id) return <span className="text-tertiary">—</span>;
    const person = employeeById.get(id);
    return (
      <span>
        <span className="font-mono text-xs text-tertiary me-1.5">{id}</span>
        {person?.name ?? "Unknown"}
      </span>
    );
  };

  return (
    <section className="flex flex-col gap-4 pt-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search by ID or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-xs text-tertiary">
          Changing the chain also updates tasks that are not completed yet
        </p>
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
                <th className="px-3 py-2 font-normal">ID</th>
                <th className="px-3 py-2 font-normal">Employee</th>
                <th className="px-3 py-2 font-normal">Evaluator 1 (Checker)</th>
                <th className="px-3 py-2 font-normal">Evaluator 2 (Approver)</th>
                <th className="px-3 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.id} className="border-t border-border odd:bg-sidebar/50">
                  <td className="px-3 py-2 font-mono text-xs">{employee.id}</td>
                  <td className="px-3 py-2">{employee.name}</td>
                  <td className="px-3 py-2">{renderPerson(employee.checkerId)}</td>
                  <td className="px-3 py-2">{renderPerson(employee.approverId)}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setEditing({
                          employeeId: employee.id,
                          employeeName: employee.name,
                          checkerId: employee.checkerId,
                          approverId: employee.approverId,
                        })
                      }
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-tertiary">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Approval Chain — {editing?.employeeName} ({editing?.employeeId})
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Evaluator 1 (Checker)</Label>
                <Select
                  value={editing.checkerId ?? NONE}
                  onValueChange={(value) =>
                    setEditing((prev) =>
                      prev ? { ...prev, checkerId: value === NONE ? null : value } : prev,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select checker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {(employees ?? [])
                      .filter((e) => e.id !== editing.employeeId)
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.id} — {e.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Evaluator 2 (Approver)</Label>
                <Select
                  value={editing.approverId ?? ""}
                  onValueChange={(value) =>
                    setEditing((prev) => (prev ? { ...prev, approverId: value } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {(employees ?? [])
                      .filter((e) => e.id !== editing.employeeId)
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.id} — {e.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              disabled={updateChain.isPending || !editing?.approverId}
              onClick={() => {
                if (!editing?.approverId) return;

                updateChain.mutate({
                  employeeId: editing.employeeId,
                  checkerId: editing.checkerId,
                  approverId: editing.approverId,
                });
              }}
            >
              {updateChain.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
