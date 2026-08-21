"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const EMPTY_FORM = {
  id: "",
  name: "",
  email: "",
  position: "",
  division: "",
  level: "",
  rank: "",
  department: "",
  password: "",
};

const FIELDS: { key: keyof typeof EMPTY_FORM; label: string; type?: string }[] = [
  { key: "id", label: "Employee ID" },
  { key: "name", label: "Full Name" },
  { key: "email", label: "Email (optional)" },
  { key: "position", label: "Position" },
  { key: "division", label: "Division" },
  { key: "level", label: "Level" },
  { key: "rank", label: "Rank" },
  { key: "department", label: "Department" },
  { key: "password", label: "Password (min 8 chars)", type: "password" },
];

export const EmployeesSection = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: employees, isLoading } = useQuery(
    trpc.admin.getEmployees.queryOptions(),
  );

  const invalidate = () =>
    queryClient.invalidateQueries(trpc.admin.getEmployees.queryOptions());

  const createEmployee = useMutation(
    trpc.admin.createEmployee.mutationOptions({
      onSuccess: () => {
        toast.success("Employee created");
        setOpen(false);
        setForm(EMPTY_FORM);
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const setBan = useMutation(
    trpc.admin.setEmployeeBan.mutationOptions({
      onSuccess: () => {
        toast.success("Employee access updated");
        invalidate();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const filtered = (employees ?? []).filter((employee) =>
    `${employee.id} ${employee.name} ${employee.department}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <section className="flex flex-col gap-4 pt-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          placeholder="Search by ID, name, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="size-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`employee-${field.key}`} className="text-xs">
                    {field.label}
                  </Label>
                  <Input
                    id={`employee-${field.key}`}
                    type={field.type ?? "text"}
                    value={form[field.key]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                disabled={createEmployee.isPending}
                onClick={() =>
                  createEmployee.mutate({
                    ...form,
                    email: form.email || undefined,
                  })
                }
              >
                {createEmployee.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                <th className="px-3 py-2 font-normal">Name</th>
                <th className="px-3 py-2 font-normal">Position</th>
                <th className="px-3 py-2 font-normal">Department</th>
                <th className="px-3 py-2 font-normal">Account</th>
                <th className="px-3 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => {
                const banned = employee.user?.banned === true;

                return (
                  <tr key={employee.id} className="border-t border-border odd:bg-sidebar/50">
                    <td className="px-3 py-2 font-mono text-xs">{employee.id}</td>
                    <td className="px-3 py-2">{employee.name}</td>
                    <td className="px-3 py-2 text-tertiary max-w-60 truncate">
                      {employee.position}
                    </td>
                    <td className="px-3 py-2 text-tertiary">{employee.department}</td>
                    <td className="px-3 py-2">
                      {!employee.user ? (
                        <StatusBadge label="No account" variant="purple" />
                      ) : banned ? (
                        <StatusBadge label="Disabled" variant="red" />
                      ) : (
                        <StatusBadge label="Active" variant="green" />
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {employee.user && (
                        <Button
                          size="sm"
                          variant={banned ? "secondary" : "destructive"}
                          disabled={setBan.isPending}
                          onClick={() =>
                            setBan.mutate({
                              employeeId: employee.id,
                              banned: !banned,
                            })
                          }
                        >
                          {banned ? "Enable" : "Disable"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-tertiary">
                    No employees found
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
