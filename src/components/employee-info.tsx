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
    <span className="text-[11px] font-medium text-secondary">{label}</span>
    <span className="truncate text-xs text-primary">{value || "-"}</span>
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
    ? "grid-cols-[repeat(3,minmax(72px,max-content))]"
    : "grid-cols-[repeat(2,minmax(72px,max-content))]";

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
      className="sticky top-0 z-100 grid grid-cols-[1fr_auto] border-y border-border bg-background"
    >
      <div className="grid min-w-0 grid-rows-[auto_auto] gap-0 py-1.5 pl-3 pr-2">
        <div className="grid grid-cols-[auto_1px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-2.5">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2">
            <UserAvatar
              name={owner?.name || ""}
              className={{
                container:
                  "shrink-0 rounded size-6 flex items-center justify-center dark:shadow-[0_0_0_1.25px_#383836,0px_14px_28px_-6px_#0003,0px_2px_4px_-1px_#0000001f]",
                fallback: "bg-marine! rounded text-white! text-sm",
              }}
            />
            <div className="grid min-w-0 grid-rows-[auto_auto] leading-tight">
              <span className="truncate text-xs font-medium">{owner?.name}</span>
              <span className="truncate text-[11px] leading-3.5 text-secondary">
                {owner?.email || "-"}
              </span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-full w-px! self-stretch rounded-md" />

          <InfoField label="Position" value={owner?.position} />
          <InfoField label="Company/Division" value={owner?.division} />
          <InfoField label="Department/Section" value={owner?.department} />
        </div>

        <div
          className={`mt-1.5 grid ${roleColumns} gap-x-3 border-t border-dotted border-border pt-1.5`}
        >
          <RoleCell label="พนักงาน (Employee)" employee={owner} />
          {checker && (
            <RoleCell label="ผู้ประเมินลำดับที่ 1 (Evaluator 1)" employee={checker} />
          )}
          <RoleCell label="ผู้ประเมินลำดับที่ 2 (Evaluator 2)" employee={approver} />
        </div>
      </div>

      <div className="grid grid-rows-[auto_1fr] content-start gap-1 border-l border-border px-2 py-1.5">
        <div className="grid grid-cols-[auto_1fr] items-center gap-1">
          <div className="rounded-sm bg-marine p-0.5">
            <FaWeightHanging className="size-3 text-white" />
          </div>
          <p className="text-xs font-semibold text-marine">Weight</p>
        </div>
        {children}
      </div>
    </section>
  );
};
