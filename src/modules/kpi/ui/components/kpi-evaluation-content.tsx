"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import { kpiCategoies } from "../../constants";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { FormGenerator } from "@/components/form-generator";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { KpiEvaluation as KPI, Period } from "@/generated/prisma/client";
import { KpisEvaluation } from "../../schema/evaluation";
import { Action, Approval } from "@/modules/tasks/permissions";
import { formRecord } from "@/types/form";
import { Badge } from "@/components/badge";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { cn, formatDecimal } from "@/lib/utils";
import { AttachButton } from "@/components/attach-button";
import { useDeleteKpiFile } from "../../api/use-delete-kpi-file";
import { useSyncKpiAttach } from "../../api/use-sync-kpi-attach";
import { cva } from "class-variance-authority";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckIcon } from "lucide-react";

interface Props {
  id: string;
  period: Period;
  index: number;
  kpi: KPI;
  role: Approval;
  form: UseFormReturn<KpisEvaluation>;
  permissions: Record<Action, boolean>;
  hasChecker: boolean;
  year: number;
  finalSumWeight: number;
}

const header = cva(
  "min-h-10 h-auto border-r border-border bg-sidebar shadow-[inset_0_1.25px_0_rgba(42,28,0,0.07),inset_0_-1.25px_0_rgba(42,28,0,0.07)] dark:shadow-[inset_0_1.25px_0_rgba(255,255,243,0.082),inset_0_-1.25px_0_rgba(255,255,243,0.082)] p-2",
);

interface AchievementRadioCellProps {
  id: string;
  value: string;
  checked: boolean;
  disabled: boolean;
  onValueChange: (value: string) => void;
  borderColor?: "border" | "foreground";
}

const AchievementRadioCell = ({
  id,
  value,
  checked,
  disabled,
  onValueChange,
  borderColor = "border",
}: AchievementRadioCellProps) => {
  return (
    <div className="flex items-center justify-center">
      <RadioGroup
        className="items-center"
        value={checked ? value : ""}
        disabled={disabled}
        onValueChange={onValueChange}
      >
        <RadioGroupItem
          id={id}
          value={value}
          aria-label={id}
          className="sr-only"
          disabled={disabled}
        />
        <label
          htmlFor={id}
          className={cn(
            "size-5 rounded-xs border grid place-items-center cursor-pointer bg-background",
            borderColor === "border" ? "border-border" : "border-foreground",
            checked && "bg-marine text-white border-marine",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <CheckIcon className={cn("size-4", checked ? "opacity-100" : "opacity-0")} />
        </label>
      </RadioGroup>
    </div>
  );
};

const InfoBlock = ({
  label,
  value,
}: {
  label: React.ReactNode;
  value?: string | null;
}) => (
  <div className="flex flex-col gap-1">
    <p className="text-xs text-secondary">{label}</p>
    <p className="text-sm leading-normal text-primary whitespace-pre-wrap [word-break:break-word]">
      {value || "-"}
    </p>
  </div>
);

export const KpiEvaluationContent = ({
  id,
  period,
  form,
  index,
  kpi,
  permissions,
  hasChecker,
  year,
  role,
}: Props) => {
  const { mutation: deleteKpiFile } = useDeleteKpiFile(id, period);
  const { mutation: syncKpiAttach } = useSyncKpiAttach(id, period);

  const targetRows = useMemo(
    () => [
      { id: "70", label: "70%", detail: kpi.target70 },
      { id: "80", label: "80%", detail: kpi.target80 },
      { id: "90", label: "90%", detail: kpi.target90 },
      { id: "100", label: "100%", detail: kpi.target100 },
    ],
    [kpi.target70, kpi.target80, kpi.target90, kpi.target100, year],
  );

  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const detailRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const updateHeights = () => {
      const heights = detailRefs.current.map((ref) => {
        if (!ref) return 81;
        return ref.offsetHeight;
      });
      setRowHeights(heights);
    };

    const timeoutId = setTimeout(updateHeights, 0);
    const rafId = requestAnimationFrame(updateHeights);

    const observers: ResizeObserver[] = [];
    detailRefs.current.forEach((ref) => {
      if (!ref) return;
      const observer = new ResizeObserver(updateHeights);
      observer.observe(ref);
      observers.push(observer);
    });

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [targetRows]);

  const ownerActualRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRefs = useMemo(() => [ownerActualRef], []);

  const { groupSyncFunctions } = useSyncTextareaHeights([
    {
      refs: textareaRefs,
      breakpoint: "(min-width: 1024px)",
    },
  ]);
  const syncTextareaHeights = groupSyncFunctions[0];

  const values = useWatch({
    control: form.control,
    name: `kpis.${index}`,
  });

  const canPerformOwner = permissions.write && role === "owner";
  const canPerformChecker = permissions.write && role === "checker";
  const canPerformApprover = permissions.write && role === "approver";

  const evaluationGridClass = cn(
    "grid grid-cols-1 gap-2",
    hasChecker ? "lg:grid-cols-3 lg:items-stretch" : "lg:grid-cols-2 lg:items-stretch",
  );

  const blueFormClass = {
    input: formRecord.blue.input,
    label: formRecord.blue.label,
    description: "text-xs text-secondary",
    form: "flex flex-col gap-2 flex-1 min-h-0 bg-transparent p-0 h-auto",
  };

  const fillHeightFormClass = {
    ...blueFormClass,
    form: cn(blueFormClass.form, "lg:flex-1 lg:min-h-0"),
    input: cn(blueFormClass.input, "lg:min-h-10"),
  };

  const evaluationColumnClass =
    "flex flex-col gap-2 min-h-0 min-w-0 h-full p-2 bg-[#0080d51c] dark:bg-[#298bfd10] rounded-sm";

  const gridClass = hasChecker
    ? "grid-cols-[minmax(0,1fr)_88px_minmax(0,1.4fr)_100px_100px_100px]"
    : "grid-cols-[minmax(0,1fr)_88px_minmax(0,1.4fr)_100px_100px]";

  const handleAchievementChange = (
    field: "achievementOwner" | "achievementChecker" | "achievementApprover",
    value: string,
  ) => {
    form.setValue(`kpis.${index}.${field}`, value ? Number.parseFloat(value) : null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const weight = Number(kpi.weight);

  return (
    <div className="w-full relative z-80 flex flex-col gap-4">
      <div className="mt-0 min-w-full border border-border relative overflow-hidden rounded-sm">
        <div className={cn("grid divide-x divide-border", gridClass)}>
          <div className={cn(header())}>
            <div className="flex items-center justify-between h-full gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge color="orange" label={(index + 1).toString()} />
                <div className="text-xs font-normal text-secondary leading-tight text-start">
                  Individual KPI
                </div>
              </div>
              <div className="flex flex-row items-center gap-2 shrink-0 bg-[#0080d51c] dark:bg-[#298bfd10] p-1.5 rounded-sm">
                <h4 className="text-xs text-marine whitespace-nowrap">น้ำหนัก (%)</h4>
                <p className="text-xs shadow-[0_4px_12px_0_rgba(25,25,25,0.029),0_1px_2px_0_rgba(25,25,25,0.019),0_0_0_1px_rgba(0,124,215,0.094)] dark:shadow-[0_4px_12px_0_rgba(25,25,25,0.4),0_0_0_1px_rgba(71,157,255,0.173)] bg-background py-0.5 px-2 rounded tabular-nums">
                  {formatDecimal(weight)}
                </p>
              </div>
            </div>
          </div>
          <div className={cn(header())}>
            <div className="flex items-center h-full">
              <div className="text-xs font-normal text-secondary leading-tight">
                เป้าหมาย
                <br />
                (Target)
              </div>
            </div>
          </div>
          <div className={cn(header())}>
            <div className="flex items-center h-full">
              <div className="text-xs font-normal text-secondary leading-tight">
                รายละเอียดเป้าหมาย
                <br />
                (Target Detail)
              </div>
            </div>
          </div>
          <div className={cn(header())}>
            <div className="flex items-center h-full">
              <div className="text-xs font-normal text-secondary leading-tight">
                พนักงาน
                <br />
                (Employee)
              </div>
            </div>
          </div>
          {hasChecker && (
            <div className={cn(header())}>
              <div className="flex items-center h-full">
                <div className="text-xs font-normal text-secondary leading-tight">
                  ผู้ประเมินคนที่ 1
                  <br />
                  (Evaluator 1)
                </div>
              </div>
            </div>
          )}
          <div className={cn("border-none", header())}>
            <div className="flex items-center h-full">
              <div className="text-xs font-normal text-secondary leading-tight">
                ผู้ประเมินคนที่ 2
                <br />
                (Evaluator 2)
              </div>
            </div>
          </div>

          <div className="p-2 overflow-hidden">
            <div className="flex flex-col gap-3">
              <InfoBlock
                label={
                  <>
                    มุมมอง KPI ตามกลยุทธ์องค์กร
                    <br />
                    (Link to Strategy)
                  </>
                }
                value={kpi.category ? kpiCategoies[kpi.category] : null}
              />
              <InfoBlock
                label={
                  <>
                    ตัวชี้วัดหลัก
                    <br />
                    (Key Performance Indicator (KPI))
                  </>
                }
                value={kpi.name}
              />
              <InfoBlock
                label={
                  <>
                    คำจำกัดความและสูตรคำนวณ
                    <br />
                    (Definition and Calculation Formula)
                  </>
                }
                value={kpi.definition}
              />
              <InfoBlock
                label={
                  <>
                    รูปแบบและวิธีการรายงานผลสำเร็จ
                    <br />
                    (Format/Method of Reporting Achievement)
                  </>
                }
                value={kpi.method}
              />
            </div>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {targetRows.map((row, rangeIndex) => (
              <div
                key={row.id}
                className="flex items-center justify-center p-3"
                style={{
                  height: rowHeights[rangeIndex] ? `${rowHeights[rangeIndex]}px` : "auto",
                  minHeight: rowHeights[rangeIndex] ? `${rowHeights[rangeIndex]}px` : "81px",
                }}
              >
                <span className="text-sm font-medium font-mono">{row.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col divide-y divide-border">
            {targetRows.map((row, rangeIndex) => (
              <div
                key={row.id}
                ref={(el) => {
                  detailRefs.current[rangeIndex] = el;
                }}
                className="p-2"
              >
                <p className="text-xs text-secondary whitespace-pre-wrap wrap-break-word min-h-16">
                  {row.detail || "-"}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col divide-y divide-border">
            {targetRows.map((row, rangeIndex) => {
              const valueStr = row.id;
              const checked =
                values.achievementOwner != null && values.achievementOwner.toString() === valueStr;

              return (
                <div
                  key={row.id}
                  className="flex items-center justify-center p-3"
                  style={{
                    height: rowHeights[rangeIndex] ? `${rowHeights[rangeIndex]}px` : "auto",
                    minHeight: rowHeights[rangeIndex] ? `${rowHeights[rangeIndex]}px` : "81px",
                  }}
                >
                  <AchievementRadioCell
                    id={`owner-${index}-${valueStr}`}
                    value={valueStr}
                    checked={checked}
                    disabled={!canPerformOwner}
                    onValueChange={(v) => handleAchievementChange("achievementOwner", v)}
                  />
                </div>
              );
            })}
          </div>

          {hasChecker && (
            <div className="flex flex-col divide-y divide-border">
              {targetRows.map((row, rangeIndex) => {
                const valueStr = row.id;
                const checked =
                  values.achievementChecker != null &&
                  values.achievementChecker.toString() === valueStr;

                return (
                  <div
                    key={row.id}
                    className="flex items-center justify-center p-3"
                    style={{
                      height: rowHeights[rangeIndex] ? `${rowHeights[rangeIndex]}px` : "auto",
                      minHeight: rowHeights[rangeIndex] ? `${rowHeights[rangeIndex]}px` : "81px",
                    }}
                  >
                    <AchievementRadioCell
                      id={`checker-${index}-${valueStr}`}
                      value={valueStr}
                      checked={checked}
                      disabled={!canPerformChecker}
                      onValueChange={(v) => handleAchievementChange("achievementChecker", v)}
                      borderColor="foreground"
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col divide-y divide-border">
            {targetRows.map((row, rangeIndex) => {
              const valueStr = row.id;
              const checked =
                values.achievementApprover != null &&
                values.achievementApprover.toString() === valueStr;

              return (
                <div
                  key={row.id}
                  className="flex items-center justify-center p-3"
                  style={{
                    height: rowHeights[rangeIndex] ? `${rowHeights[rangeIndex]}px` : "auto",
                    minHeight: rowHeights[rangeIndex] ? `${rowHeights[rangeIndex]}px` : "81px",
                  }}
                >
                  <AchievementRadioCell
                    id={`approver-${index}-${valueStr}`}
                    value={valueStr}
                    checked={checked}
                    disabled={!canPerformApprover}
                    onValueChange={(v) => handleAchievementChange("achievementApprover", v)}
                    borderColor="foreground"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            "grid divide-x divide-border border-t border-border bg-[#2383e224]",
            gridClass,
          )}
        >
          <div className="col-span-3 flex items-center justify-end px-3 py-2">
            <span className="font-medium text-secondary text-[10px] uppercase tracking-[1px] select-none">
              % Success Weight
            </span>
          </div>
          <div className="flex items-center justify-center px-2 py-2">
            <span className="text-sm tabular-nums">
              {formatDecimal((Number(values.achievementOwner) / 100) * weight)}%
            </span>
          </div>
          {hasChecker && (
            <div className="flex items-center justify-center px-2 py-2">
              <span className="text-sm tabular-nums">
                {formatDecimal((Number(values.achievementChecker) / 100) * weight)}%
              </span>
            </div>
          )}
          <div className="flex items-center justify-center px-2 py-2">
            <span className="text-sm tabular-nums">
              {formatDecimal((Number(values.achievementApprover) / 100) * weight)}%
            </span>
          </div>
        </div>
      </div>

      <div>
        <FormField
          control={form.control}
          name={`kpis.${index}.achievementOwner`}
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`kpis.${index}.achievementChecker`}
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`kpis.${index}.achievementApprover`}
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className={evaluationGridClass}>
        <div className={evaluationColumnClass}>
          <FormGenerator
            name={`kpis.${index}.actualOwner`}
            form={form}
            variant="bigText"
            disabled={!canPerformOwner}
            label="พนักงาน (Employee)"
            description="รายละเอียดของผลสำเร็จเพิ่มเติม (Detail of success result)"
            className={blueFormClass}
            textareaRef={(el) => {
              ownerActualRef.current = el;
              syncTextareaHeights();
            }}
            onInput={() => syncTextareaHeights()}
            fileUpload={
              <FormField
                control={form.control}
                name={`kpis.${index}.fileUrl`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-secondary flex flex-col gap-0.5 font-normal items-start">
                      <span>ข้อมูล/หลักฐานการประเมิน (Evident Data/Evidence)</span>
                      <span className="font-normal text-secondary">ไม่บังคับแนบไฟล์ (optional)</span>
                    </FormLabel>
                    <FormControl>
                      <AttachButton
                        value={field.value as string | null}
                        canPerform={canPerformOwner}
                        onChange={field.onChange}
                        onUpload={(url) => syncKpiAttach({ id: kpi.id, fileUrl: url })}
                        onRemove={() => deleteKpiFile({ id: kpi.id })}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            }
          />
        </div>

        {hasChecker && (
          <div className={evaluationColumnClass}>
            <FormGenerator
              name={`kpis.${index}.actualChecker`}
              form={form}
              variant="bigText"
              disabled={!canPerformChecker}
              label="ผู้ประเมินคนที่ 1 (Evaluator 1)"
              description="ความคิดเห็น (Comment)"
              fillHeight
              className={fillHeightFormClass}
            />
          </div>
        )}

        <div className={evaluationColumnClass}>
          <FormGenerator
            name={`kpis.${index}.actualApprover`}
            form={form}
            variant="bigText"
            disabled={!canPerformApprover}
            label="ผู้ประเมินคนที่ 2 (Evaluator 2)"
            description="ความคิดเห็น (Comment)"
            fillHeight
            className={fillHeightFormClass}
          />
        </div>
      </div>
    </div>
  );
};
