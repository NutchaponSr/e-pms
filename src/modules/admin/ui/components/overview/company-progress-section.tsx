"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { selectOptions } from "../filter-options";
import { FilterSelect } from "../filter-select";
import { ALL, cardClass } from "./constants";
import { buddhistYear, yearOptions } from "./format";
import { SectionHeading } from "./section-heading";
import type { OverviewData } from "./types";

export function OverviewCompanySection({
  year,
  currentYear,
  division,
  department,
  level,
  options,
  companies,
  filtersActive,
  onYearChange,
  onDivisionChange,
  onDepartmentChange,
  onLevelChange,
  onClear,
}: {
  year: number;
  currentYear: number;
  division: string;
  department: string;
  level: string;
  options: OverviewData["options"];
  companies: OverviewData["companies"];
  filtersActive: boolean;
  onYearChange: (year: number) => void;
  onDivisionChange: (division: string) => void;
  onDepartmentChange: (department: string) => void;
  onLevelChange: (level: string) => void;
  onClear: () => void;
}) {
  const years = yearOptions(currentYear);
  const departments = useMemo(() => {
    const names = options.departments
      .filter((item) => division === ALL || item.division === division)
      .map((item) => item.name);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, "th"));
  }, [options.departments, division]);

  return (
    <div className="order-1 flex flex-col gap-3 xl:order-2">
      <SectionHeading
        title="ความคืบหน้าตามบริษัท"
        description="สัดส่วน Completed จากงานทุกช่วง"
      />
      <div className={cn(cardClass, "flex flex-col gap-3 p-4")}>
        <FilterSelect
          label="ปีประเมิน"
          value={String(year)}
          onValueChange={(value) => onYearChange(Number(value))}
          options={years.map((option) => ({
            value: String(option),
            label: `${buddhistYear(option)}${option === currentYear ? " · ปัจจุบัน" : ""}`,
          }))}
        />
        <FilterSelect
          label="บริษัท"
          value={division}
          onValueChange={onDivisionChange}
          options={selectOptions("ทุกบริษัท", options.divisions)}
        />
        <FilterSelect
          label="หน่วยงาน"
          value={department}
          onValueChange={onDepartmentChange}
          options={selectOptions("ทุกหน่วยงาน", departments)}
        />
        <FilterSelect
          label="Level"
          value={level}
          onValueChange={onLevelChange}
          options={selectOptions("ทุก Level", options.levels)}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!filtersActive}
          onClick={onClear}
        >
          ล้างตัวกรอง
        </Button>
      </div>
      <div className={cn(cardClass, "flex flex-col gap-4 p-4")}>
        {companies.length === 0 ? (
          <p className="py-6 text-center text-xs text-tertiary">ไม่มีข้อมูลบริษัท</p>
        ) : (
          companies.map((company) => (
            <div key={company.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-primary">{company.name}</span>
                <span className="tabular-nums text-secondary">
                  {company.rate}%
                </span>
              </div>
              <Progress value={company.rate} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
