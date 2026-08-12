"use client";

import { useEffect, useRef } from "react";
import { BsPersonFill } from "react-icons/bs";
import { FaWeightHanging } from "react-icons/fa";

import { Employee } from "@/generated/prisma/client";
import { Separator } from "@/components/ui/separator";

import { UserAvatar } from "@/modules/auth/ui/components/user-avatar";
import { UserProfile } from "@/modules/auth/ui/components/user-profile";

export const EMPLOYEE_INFO_HEIGHT_VAR = "--employee-info-height";

interface Props {
  owner?: Employee;
  checker?: Employee | null;
  approver?: Employee;
  children: React.ReactNode;
}

interface InfoFieldProps {
  label: string;
  value?: string | null;
}

const InfoField = ({ label, value }: InfoFieldProps) => (
  <div className="grid min-w-0 grid-rows-[auto_auto] gap-0.5 overflow-hidden">
    <span className="text-[10px] font-medium uppercase tracking-wide text-secondary md:text-[11px] md:normal-case md:tracking-normal">
      {label}
    </span>
    <span title={value || undefined} className="truncate text-xs font-medium text-primary">
      {value || "-"}
    </span>
  </div>
);

interface RoleCellProps {
  label: string;
  employee?: Employee;
}

const RoleCell = ({ label, employee }: RoleCellProps) => (
  <div className="grid min-w-0 grid-rows-[auto_auto] gap-0.5">
    <div className="grid grid-cols-[auto_1fr] items-center gap-1 min-w-0 text-[11px] leading-4 text-secondary">
      <BsPersonFill className="size-3 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
    <UserProfile employee={employee} />
  </div>
);

export const EmployeeInfo = ({ owner, checker, approver, children }: Props) => {
  const sectionRef = useRef<HTMLElement>(null);

  const roleColumns = checker
    ? "grid-cols-1 sm:grid-cols-3 md:grid-cols-[repeat(3,minmax(72px,max-content))]"
    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(2,minmax(72px,max-content))]";

  useEffect(() => {
    const section = sectionRef.current;
    const parent = section?.parentElement;
    if (!section || !parent) return;

    const syncHeight = () => {
      parent.style.setProperty(EMPLOYEE_INFO_HEIGHT_VAR, `${section.offsetHeight}px`);
    };

    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(section);

    return () => {
      observer.disconnect();
      parent.style.removeProperty(EMPLOYEE_INFO_HEIGHT_VAR);
    };
  }, [checker, owner?.id, approver?.id]);

  return (
    <section
      ref={sectionRef}
      className="sticky top-0 z-100 flex flex-col border-y border-border bg-background md:grid md:grid-cols-[1fr_auto]"
    >
      <div className="grid min-w-0 grid-rows-[auto_auto] gap-0 px-3 py-2.5 md:py-1.5 md:pl-3 md:pr-2">
        <div className="flex flex-col gap-2.5 md:grid md:grid-cols-[minmax(0,12rem)_1px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center md:gap-x-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <UserAvatar
              name={owner?.name || ""}
              className={{
                container:
                  "size-9 shrink-0 rounded-sm flex items-center justify-center md:size-7 dark:shadow-[0_0_0_1.25px_#383836,0px_14px_28px_-6px_#0003,0px_2px_4px_-1px_#0000001f]",
                fallback: "bg-marine! rounded-sm text-white! text-base md:text-sm",
              }}
            />
            <div className="min-w-0 flex-1 leading-tight">
              <p
                title={owner?.name || undefined}
                className="truncate text-sm font-semibold text-primary md:text-xs md:font-medium"
              >
                {owner?.name || "-"}
              </p>
              <p
                title={owner?.email || undefined}
                className="truncate text-xs text-secondary md:text-[11px] md:leading-3.5"
              >
                {owner?.email || "-"}
              </p>
            </div>
          </div>

          <Separator
            orientation="vertical"
            className="hidden h-8 w-px! self-center rounded-md md:block"
          />

          <Separator orientation="horizontal" className="md:hidden" />

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:contents">
            <InfoField label="Position" value={owner?.position} />
            <InfoField label="Company/Division" value={owner?.division} />
            <InfoField label="Department/Section" value={owner?.department} />
          </div>
        </div>

        <div
          className={`mt-2.5 grid ${roleColumns} gap-x-3 gap-y-2.5 border-t border-dotted border-border pt-2.5 md:mt-1.5 md:gap-y-0 md:pt-1.5`}
        >
          <RoleCell label="พนักงาน (Employee)" employee={owner} />
          {checker && (
            <RoleCell label="ผู้ประเมินลำดับที่ 1 (Evaluator 1)" employee={checker} />
          )}
          <RoleCell label="ผู้ประเมินลำดับที่ 2 (Evaluator 2)" employee={approver} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5 md:grid md:grid-rows-[auto_1fr] md:content-start md:gap-2 md:border-t-0 md:border-l md:px-2 md:py-1.5">
        <div className="flex shrink-0 items-center gap-1.5 md:grid md:grid-cols-[auto_1fr] md:items-center md:gap-1">
          <div className="rounded bg-marine p-1">
            <FaWeightHanging className="text-white size-3" />
          </div>
          <p className="text-xs font-semibold text-marine">Weight</p>
        </div>
        {children}
      </div>
    </section>
  );
};
