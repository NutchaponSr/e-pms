"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { UserRole } from "@/generated/prisma/enums";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useTRPC } from "@/trpc/client";
import { selectOptions } from "./filter-options";
import { FilterSelect } from "./filter-select";

const ALL = "all";
const PAGE_SIZE = 12;

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

const FIELDS: { key: keyof typeof EMPTY_FORM; label: string; type?: string }[] =
  [
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

type EmployeeRow = {
  id: string;
  name: string;
  position: string;
  department: string;
  user: { banned: boolean | null } | null;
};

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "th"),
  );
}

export const EmployeesSection = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [division, setDivision] = useState(ALL);
  const [department, setDepartment] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [excludeAdmin, setExcludeAdmin] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const employeesQuery = useQuery(trpc.admin.getEmployees.queryOptions());

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

  const employees = useMemo(
    () => employeesQuery.data ?? [],
    [employeesQuery.data],
  );
  const needle = search.trim().toLowerCase();
  const filtersActive =
    needle.length > 0 ||
    division !== ALL ||
    department !== ALL ||
    level !== ALL ||
    !excludeAdmin;

  const divisions = useMemo(
    () => uniqueSorted(employees.map((employee) => employee.division)),
    [employees],
  );
  const departments = useMemo(
    () =>
      uniqueSorted(
        employees
          .filter(
            (employee) => division === ALL || employee.division === division,
          )
          .map((employee) => employee.department),
      ),
    [employees, division],
  );
  const levels = useMemo(
    () => uniqueSorted(employees.map((employee) => employee.level)),
    [employees],
  );

  const filtered = useMemo(
    () =>
      employees.filter((employee) => {
        if (division !== ALL && employee.division !== division) return false;
        if (department !== ALL && employee.department !== department) {
          return false;
        }
        if (level !== ALL && employee.level !== level) return false;
        if (excludeAdmin && employee.user?.role === UserRole.ADMIN) {
          return false;
        }
        if (!needle) return true;
        return `${employee.id} ${employee.name} ${employee.department}`
          .toLowerCase()
          .includes(needle);
      }),
    [employees, division, department, level, excludeAdmin, needle],
  );

  const clearFilters = () => {
    setSearch("");
    setDivision(ALL);
    setDepartment(ALL);
    setLevel(ALL);
    setExcludeAdmin(true);
  };

  return (
    <section className="flex flex-col gap-4 pt-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 max-w-xs flex-1 flex-col gap-1.5">
            <span className="text-[11px] font-medium text-tertiary">ค้นหา</span>
            <Input
              value={search}
              placeholder="รหัส ชื่อ หรือหน่วยงาน"
              onChange={(event) => setSearch(event.target.value)}
              className="bg-background"
            />
          </div>
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
                    <Label
                      htmlFor={`employee-${field.key}`}
                      className="text-xs"
                    >
                      {field.label}
                    </Label>
                    <Input
                      id={`employee-${field.key}`}
                      type={field.type ?? "text"}
                      value={form[field.key]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FilterSelect
            label="บริษัท"
            value={division}
            onValueChange={(value) => {
              setDivision(value);
              setDepartment(ALL);
            }}
            options={selectOptions("ทุกบริษัท", divisions)}
          />
          <FilterSelect
            label="หน่วยงาน"
            value={department}
            onValueChange={setDepartment}
            options={selectOptions("ทุกหน่วยงาน", departments)}
          />
          <FilterSelect
            label="Level"
            value={level}
            onValueChange={setLevel}
            options={selectOptions("ทุก Level", levels)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="employees-exclude-admin"
              checked={excludeAdmin}
              onCheckedChange={(checked) => setExcludeAdmin(checked === true)}
            />
            <label
              htmlFor="employees-exclude-admin"
              className="text-xs font-medium text-secondary"
            >
              ไม่รวมแอดมิน
            </label>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!filtersActive}
            onClick={clearFilters}
          >
            ล้างตัวกรอง
          </Button>
        </div>
      </div>

      {employeesQuery.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : employeesQuery.isError ? (
        <p className="px-3 py-8 text-center text-sm text-tertiary">
          โหลดรายชื่อพนักงานไม่สำเร็จ
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <EmployeeTable
            key={`${needle}:${division}:${department}:${level}:${excludeAdmin}`}
            employees={filtered}
            banPending={setBan.isPending}
            onToggleBan={(employeeId, banned) =>
              setBan.mutate({ employeeId, banned })
            }
          />
        </div>
      )}
    </section>
  );
};

function EmployeeTable({
  employees,
  banPending,
  onToggleBan,
}: {
  employees: EmployeeRow[];
  banPending: boolean;
  onToggleBan: (employeeId: string, banned: boolean) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const hasMore = visibleCount < employees.length;
  const preview = employees.slice(0, visibleCount);
  const { ref: loadMoreRef } = useIntersectionObserver({
    rootMargin: "160px",
    enabled: hasMore,
    onIntersect: () => {
      setVisibleCount((count) => Math.min(count + PAGE_SIZE, employees.length));
    },
  });

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-sidebar text-left text-xs text-secondary">
            <th className="px-3 py-2 font-normal">ID</th>
            <th className="px-3 py-2 font-normal">Name</th>
            <th className="px-3 py-2 font-normal">Position</th>
            <th className="px-3 py-2 font-normal">Department</th>
            <th className="px-3 py-2 font-normal">Account</th>
            <th className="px-3 py-2 text-right font-normal">Actions</th>
          </tr>
        </thead>
        <tbody>
          {preview.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-tertiary">
                ไม่มีพนักงานในตัวกรองนี้
              </td>
            </tr>
          ) : (
            preview.map((employee) => {
              const banned = employee.user?.banned === true;

              return (
                <tr
                  key={employee.id}
                  className="border-t border-border odd:bg-sidebar/50"
                >
                  <td className="px-3 py-2 font-mono text-xs">{employee.id}</td>
                  <td className="px-3 py-2">{employee.name}</td>
                  <td className="max-w-60 truncate px-3 py-2 text-tertiary">
                    {employee.position}
                  </td>
                  <td className="px-3 py-2 text-tertiary">
                    {employee.department}
                  </td>
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
                        disabled={banPending}
                        onClick={() => onToggleBan(employee.id, !banned)}
                      >
                        {banned ? "Enable" : "Disable"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {hasMore && (
        <div
          key={visibleCount}
          ref={loadMoreRef}
          aria-hidden
          className="h-px"
        />
      )}
      <div className="border-t border-border px-3 py-2.5 text-xs text-secondary">
        {hasMore
          ? `แสดง ${preview.length.toLocaleString("th-TH")} จาก ${employees.length.toLocaleString("th-TH")} คน · เลื่อนเพื่อดูเพิ่ม`
          : `แสดงทั้งหมด ${employees.length.toLocaleString("th-TH")} คน`}
      </div>
    </>
  );
}
