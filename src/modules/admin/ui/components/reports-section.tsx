"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { FormType, UserRole } from "@/generated/prisma/enums";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { downloadExcel } from "../utils";
import { selectOptions } from "./filter-options";
import { FilterSelect } from "./filter-select";
import { buddhistYear, yearOptions } from "./overview/format";

const ALL = "all";
const PAGE_SIZE = 12;

const cardClass =
  "rounded-xl bg-white/90 shadow-[0_12px_32px_0_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.05)] dark:bg-[#202020]/90";

type EmployeeRow = {
  id: string;
  name: string;
  position: string;
  rank: string;
  division: string;
  department: string;
  level: string;
};

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "th"),
  );
}

export const ReportsSection = () => {
  const trpc = useTRPC();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState(ALL);
  const [department, setDepartment] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [excludeAdmin, setExcludeAdmin] = useState(true);
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const employeesQuery = useQuery(trpc.admin.getEmployees.queryOptions());

  const exportSummary = useMutation(
    trpc.admin.exportSummary.mutationOptions({
      onSuccess: (result) => {
        downloadExcel(result.file, result.filename);
        toast.success(`ส่งออก ${result.count.toLocaleString("th-TH")} คน`, {
          id: `admin-export-${result.type}`,
        });
      },
      onError: (error, variables) => {
        toast.error(error.message, { id: `admin-export-${variables.type}` });
      },
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
        if (excludeAdmin && employee.user?.role === UserRole.ADMIN)
          return false;
        if (!needle) return true;
        return `${employee.id} ${employee.name}`.toLowerCase().includes(needle);
      }),
    [employees, division, department, level, excludeAdmin, needle],
  );

  const selectedEmployees = useMemo(
    () => employees.filter((employee) => selected.has(employee.id)),
    [employees, selected],
  );
  const exportEmployees =
    selectedEmployees.length > 0 ? selectedEmployees : filtered;

  const pendingType = exportSummary.isPending
    ? exportSummary.variables?.type
    : null;

  const toggleEmployee = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFiltered = () => {
    setSelected((current) => {
      const next = new Set(current);
      const ids = filtered.map((employee) => employee.id);
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      if (allSelected) {
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
  };

  const download = (type: FormType) => {
    const label = type === FormType.KPI ? "KPI Bonus" : "Merit";
    if (exportEmployees.length === 0) {
      toast.error("ไม่มีพนักงานในตัวกรองนี้", { id: `admin-export-${type}` });
      return;
    }
    toast.loading(`กำลังสร้างไฟล์ ${label}...`, {
      id: `admin-export-${type}`,
    });
    exportSummary.mutate({
      year,
      type,
      employeeIds: exportEmployees.map((employee) => employee.id),
    });
  };

  const clearFilters = () => {
    setSearch("");
    setDivision(ALL);
    setDepartment(ALL);
    setLevel(ALL);
    setExcludeAdmin(true);
  };

  return (
    <section className="flex flex-col gap-4 pt-2">
      <div className={cn(cardClass, "flex flex-col gap-4 p-4")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-primary">พนักงานทั้งองค์กร</h2>
            <p className="mt-0.5 max-w-xl text-xs text-tertiary">
              {selectedEmployees.length > 0
                ? `ส่งออก ${selectedEmployees.length.toLocaleString("th-TH")} คนที่เลือกไว้`
                : `ยังไม่เลือกคน จะส่งออก ${filtered.length.toLocaleString("th-TH")} คนตามตัวกรอง`}
              {" · "}คนที่ยังไม่มีฟอร์มจะเว้นคะแนนไว้
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <FilterSelect
              label="ปีประเมิน"
              className="w-36"
              value={String(year)}
              onValueChange={(value) => setYear(Number(value))}
              options={yearOptions(currentYear).map((option) => ({
                value: String(option),
                label: `${buddhistYear(option)}${option === currentYear ? " · ปัจจุบัน" : ""}`,
              }))}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={exportSummary.isPending}
              onClick={() => download(FormType.KPI)}
            >
              <DownloadIcon />
              {pendingType === FormType.KPI ? "กำลังสร้าง..." : "KPI Bonus"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={exportSummary.isPending}
              onClick={() => download(FormType.MERIT)}
            >
              <DownloadIcon />
              {pendingType === FormType.MERIT ? "กำลังสร้าง..." : "Merit"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[11px] font-medium text-tertiary">ค้นหา</span>
            <Input
              value={search}
              placeholder="รหัสหรือชื่อ"
              onChange={(event) => setSearch(event.target.value)}
              className="bg-background"
            />
          </div>
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
              id="reports-exclude-admin"
              checked={excludeAdmin}
              onCheckedChange={(checked) => setExcludeAdmin(checked === true)}
            />
            <label
              htmlFor="reports-exclude-admin"
              className="text-xs font-medium text-secondary"
            >
              ไม่รวมแอดมิน
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedEmployees.length === 0}
              onClick={() => setSelected(new Set())}
            >
              ล้างการเลือก
            </Button>
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
      </div>

      <div className={cn(cardClass, "overflow-hidden")}>
        {employeesQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : employeesQuery.isError ? (
          <p className="px-4 py-16 text-center text-sm text-secondary">
            โหลดรายชื่อพนักงานไม่สำเร็จ
          </p>
        ) : (
          <EmployeeTable
            key={`${needle}:${division}:${department}:${level}:${excludeAdmin}`}
            employees={filtered}
            selected={selected}
            onToggle={toggleEmployee}
            onToggleAll={toggleFiltered}
          />
        )}
      </div>
    </section>
  );
};

function EmployeeTable({
  employees,
  selected,
  onToggle,
  onToggleAll,
}: {
  employees: EmployeeRow[];
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const hasMore = visibleCount < employees.length;
  const preview = employees.slice(0, visibleCount);
  let selectedCount = 0;
  for (const employee of employees) {
    if (selected.has(employee.id)) selectedCount += 1;
  }
  const allSelected =
    employees.length > 0 && selectedCount === employees.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const { ref: loadMoreRef } = useIntersectionObserver({
    rootMargin: "160px",
    enabled: hasMore,
    onIntersect: () => {
      setVisibleCount((count) => Math.min(count + PAGE_SIZE, employees.length));
    },
  });

  return (
    <>
      <table className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[11px] font-medium text-tertiary">
            <th className="w-10 px-3 py-3 font-medium">
              <Checkbox
                id="reports-select-all"
                aria-label="เลือกทุกคนตามตัวกรอง"
                checked={
                  allSelected ? true : someSelected ? "indeterminate" : false
                }
                disabled={employees.length === 0}
                onCheckedChange={onToggleAll}
              />
            </th>
            <th className="px-4 py-3 font-medium">รหัส</th>
            <th className="px-3 py-3 font-medium">ชื่อ</th>
            <th className="px-3 py-3 font-medium">ตำแหน่ง</th>
            <th className="px-3 py-3 font-medium">ระดับ</th>
            <th className="px-3 py-3 font-medium">สังกัด</th>
            <th className="px-3 py-3 font-medium">หน่วยงาน</th>
          </tr>
        </thead>
        <tbody>
          {preview.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-4 py-10 text-center text-sm text-tertiary"
              >
                ไม่มีพนักงานในตัวกรองนี้
              </td>
            </tr>
          ) : (
            preview.map((employee) => (
              <tr
                key={employee.id}
                className="border-b border-border/80 last:border-b-0"
              >
                <td className="px-3 py-3">
                  <Checkbox
                    id={`reports-export-${employee.id}`}
                    aria-label={`เลือก ${employee.name}`}
                    checked={selected.has(employee.id)}
                    onCheckedChange={() => onToggle(employee.id)}
                  />
                </td>
                <td className="truncate px-4 py-3 font-medium text-primary">
                  {employee.id}
                </td>
                <td
                  className="truncate px-3 py-3 text-primary"
                  title={employee.name}
                >
                  {employee.name}
                </td>
                <td
                  className="truncate px-3 py-3 text-secondary"
                  title={employee.position}
                >
                  {employee.position}
                </td>
                <td className="truncate px-3 py-3 text-secondary">
                  {employee.rank}
                </td>
                <td
                  className="truncate px-3 py-3 text-secondary"
                  title={employee.division}
                >
                  {employee.division}
                </td>
                <td
                  className="truncate px-3 py-3 text-secondary"
                  title={employee.department}
                >
                  {employee.department}
                </td>
              </tr>
            ))
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
      <div className="border-t border-border px-4 py-2.5 text-xs text-secondary">
        {hasMore
          ? `แสดง ${preview.length.toLocaleString("th-TH")} จาก ${employees.length.toLocaleString("th-TH")} คน · เลื่อนเพื่อดูเพิ่ม`
          : `แสดงทั้งหมด ${employees.length.toLocaleString("th-TH")} คน`}
      </div>
    </>
  );
}
