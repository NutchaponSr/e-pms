"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Status } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { OverviewCompanySection } from "./overview/company-progress-section";
import { ALL, STATUS_LABEL } from "./overview/constants";
import { exportOverviewCsv } from "./overview/export-csv";
import { OverviewIncompleteSection } from "./overview/incomplete-tasks-section";
import { OverviewPeriodSection } from "./overview/period-progress-section";
import { OverviewRoundBanner } from "./overview/round-banner";
import { OverviewScoresSection } from "./overview/scores-section";
import { OverviewStatsSection } from "./overview/stats-section";
import type { Drill } from "./overview/types";

export const OverviewSection = () => {
  const trpc = useTRPC();
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [division, setDivision] = useState(ALL);
  const [department, setDepartment] = useState(ALL);
  const [level, setLevel] = useState(ALL);
  const [drill, setDrill] = useState<Drill>(null);

  const filtersActive = division !== ALL || department !== ALL || level !== ALL;

  const { data, isLoading, isError, isFetching } = useQuery({
    ...trpc.admin.getOverview.queryOptions({
      year,
      division: division === ALL ? undefined : division,
      department: department === ALL ? undefined : department,
      level: level === ALL ? undefined : level,
    }),
    placeholderData: keepPreviousData,
  });

  const visibleIncomplete = useMemo(() => {
    const rows = data?.incomplete ?? [];
    if (!drill) return rows;
    return rows.filter(
      (item) => item.periodKey === drill.key && item.status === drill.status,
    );
  }, [data?.incomplete, drill]);

  const clearFilters = () => {
    setDivision(ALL);
    setDepartment(ALL);
    setLevel(ALL);
    setDrill(null);
  };

  const toggleDrill = (key: string, status: Status) => {
    setDrill((current) =>
      current?.key === key && current.status === status
        ? null
        : { key, status },
    );
    document
      .getElementById("admin-incomplete")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading && !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="py-16 text-center text-sm text-secondary">
        โหลดภาพรวมไม่สำเร็จ
      </p>
    );
  }

  const drillLabel = drill
    ? `${data.periods.find((period) => period.key === drill.key)?.label ?? ""} · ${STATUS_LABEL[drill.status]}`
    : null;

  return (
    <div className={cn("flex flex-col gap-4 pb-8", isFetching && "opacity-80")}>
      <div className="flex justify-end px-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            exportOverviewCsv({ data, division, department, level })
          }
          disabled={!data}
        >
          <DownloadIcon />
          ส่งออกสรุป CSV
        </Button>
      </div>

      <OverviewRoundBanner
        year={data.year}
        employeeCount={data.employeeCount}
      />
      <OverviewStatsSection
        employeeCount={data.employeeCount}
        completedTasks={data.completedTasks}
        totalSlots={data.totalSlots}
        incompleteTasks={data.incompleteTasks}
        pendingApprovals={data.pendingApprovals}
      />
      <OverviewPeriodSection
        periods={data.periods}
        employeeCount={data.employeeCount}
        drill={drill}
        onToggle={toggleDrill}
      />
      <OverviewScoresSection scores={data.scores} />

      <section
        id="admin-incomplete"
        className="grid scroll-mt-16 grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_280px]"
      >
        <OverviewIncompleteSection
          key={`${year}:${division}:${department}:${level}:${drill?.key ?? ""}:${drill?.status ?? ""}`}
          items={visibleIncomplete}
          drillLabel={drillLabel}
          onClearDrill={() => setDrill(null)}
        />
        <OverviewCompanySection
          year={year}
          currentYear={currentYear}
          division={division}
          department={department}
          level={level}
          options={data.options}
          companies={data.companies}
          filtersActive={filtersActive}
          onYearChange={(value) => {
            setYear(value);
            setDrill(null);
          }}
          onDivisionChange={(value) => {
            setDivision(value);
            setDepartment(ALL);
            setDrill(null);
          }}
          onDepartmentChange={(value) => {
            setDepartment(value);
            setDrill(null);
          }}
          onLevelChange={(value) => {
            setLevel(value);
            setDrill(null);
          }}
          onClear={clearFilters}
        />
      </section>
    </div>
  );
};
