"use client";

import { cva } from "class-variance-authority";
import { CheckIcon } from "lucide-react";
import { useMemo, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { AttachButton } from "@/components/attach-button";
import { Badge } from "@/components/badge";
import { FormGenerator } from "@/components/form-generator";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { KpiEvaluation as KPI } from "@/generated/prisma/client";
import type { Period } from "@/generated/prisma/enums";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { cn, formatDecimal } from "@/lib/utils";
import type { Action, Approval } from "@/modules/tasks/permissions";
import { formRecord } from "@/types/form";

import { useDeleteKpiFile } from "../../api/use-delete-kpi-file";
import { useSyncKpiAttach } from "../../api/use-sync-kpi-attach";
import { KPI_ACTUAL_MAX_LENGTH, KPI_TARGET_FIELDS, kpiCategoies } from "../../constants";
import type { KpisEvaluation } from "../../schema/evaluation";

type AchievementField =
  | "achievementOwner"
  | "achievementChecker"
  | "achievementApprover";

type TargetRow = {
  id: string;
  label: string;
  detail: string | null;
};

type RoleKey = Approval;

interface Props {
  id: string;
  period: Period;
  index: number;
  kpi: KPI;
  role: Approval;
  form: UseFormReturn<KpisEvaluation>;
  permissions: Record<Action, boolean>;
  hasChecker: boolean;
}

const header = cva(
  "h-auto border-r border-border bg-sidebar shadow-[inset_0_-1.25px_0_rgba(42,28,0,0.07)] dark:shadow-[inset_0_-1.25px_0_rgba(255,255,243,0.082)] p-2",
);

const BLUE_FORM_CLASS = {
  input: formRecord.blue.input,
  label: formRecord.blue.label,
  description: "text-xs text-secondary",
  form: "flex flex-col gap-2 flex-1 min-h-0 bg-transparent p-0 h-auto",
};

const FILL_HEIGHT_FORM_CLASS = {
  ...BLUE_FORM_CLASS,
  form: cn(BLUE_FORM_CLASS.form, "lg:flex-1 lg:min-h-0"),
  input: cn(BLUE_FORM_CLASS.input, "lg:min-h-10"),
};

const EVALUATION_COLUMN_CLASS =
  "flex flex-col gap-2 min-h-0 min-w-0 h-full p-2 bg-[#0080d51c] dark:bg-[#298bfd10] rounded-sm";

const INFO_BLOCKS = [
  {
    key: "category",
    label: (
      <>
        มุมมอง KPI ตามกลยุทธ์องค์กร
        <br />
        (Link to Strategy)
      </>
    ),
    value: (kpi: KPI) => (kpi.category ? kpiCategoies[kpi.category] : null),
  },
  {
    key: "name",
    label: (
      <>
        ตัวชี้วัดหลัก
        <br />
        (Key Performance Indicator (KPI))
      </>
    ),
    value: (kpi: KPI) => kpi.name,
  },
  {
    key: "definition",
    label: (
      <>
        คำจำกัดความและสูตรคำนวณ
        <br />
        (Definition and Calculation Formula)
      </>
    ),
    value: (kpi: KPI) => kpi.definition,
  },
  {
    key: "method",
    label: (
      <>
        รูปแบบและวิธีการรายงานผลสำเร็จ
        <br />
        (Format/Method of Reporting Achievement)
      </>
    ),
    value: (kpi: KPI) => kpi.method,
  },
] as const;

const ACHIEVEMENT_COLUMNS = [
  {
    field: "achievementOwner" as const,
    role: "owner" as const,
    title: "พนักงาน",
    subtitle: "(Employee)",
    mobileTitle: "พนักงาน",
    mobileSubtitle: "(Emp)",
    borderColor: "border" as const,
    requiresChecker: false,
  },
  {
    field: "achievementChecker" as const,
    role: "checker" as const,
    title: "ผู้ประเมินคนที่ 1",
    subtitle: "(Evaluator 1)",
    mobileTitle: "ผู้ประเมิน 1",
    mobileSubtitle: "(E1)",
    borderColor: "foreground" as const,
    requiresChecker: true,
  },
  {
    field: "achievementApprover" as const,
    role: "approver" as const,
    title: "ผู้ประเมินคนที่ 2",
    subtitle: "(Evaluator 2)",
    mobileTitle: "ผู้ประเมิน 2",
    mobileSubtitle: "(E2)",
    borderColor: "foreground" as const,
    requiresChecker: false,
  },
];

const COMMENT_COLUMNS = [
  {
    field: "actualOwner" as const,
    role: "owner" as const,
    label: "พนักงาน (Employee)",
    description: "รายละเอียดของผลสำเร็จเพิ่มเติม (Detail of success result)",
    fillHeight: false,
    requiresChecker: false,
    showFileUpload: true,
  },
  {
    field: "actualChecker" as const,
    role: "checker" as const,
    label: "ผู้ประเมินคนที่ 1 (Evaluator 1)",
    description: "ความคิดเห็น (Comment)",
    fillHeight: true,
    requiresChecker: true,
    showFileUpload: false,
  },
  {
    field: "actualApprover" as const,
    role: "approver" as const,
    label: "ผู้ประเมินคนที่ 2 (Evaluator 2)",
    description: "ความคิดเห็น (Comment)",
    fillHeight: true,
    requiresChecker: false,
    showFileUpload: false,
  },
];

function AchievementRadioCell({
  id,
  label,
  value,
  checked,
  disabled,
  onValueChange,
  borderColor = "border",
}: {
  id: string;
  label: string;
  value: string;
  checked: boolean;
  disabled: boolean;
  onValueChange: (value: string) => void;
  borderColor?: "border" | "foreground";
}) {
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
          aria-label={label}
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
          <CheckIcon
            className={cn("size-4", checked ? "opacity-100" : "opacity-0")}
          />
        </label>
      </RadioGroup>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: React.ReactNode;
  value?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-secondary">{label}</p>
      <p className="text-sm leading-normal text-primary whitespace-pre-wrap [word-break:break-word] p-2 border-border border rounded">
        {value || "-"}
      </p>
    </div>
  );
}

function ColumnHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn(header(), className)}>
      <div className="flex items-start h-full">
        <div className="text-xs font-normal text-secondary leading-tight wrap-break-word">
          {title}
          <br />
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function AchievementGroupHeader({ columnCount }: { columnCount: number }) {
  return (
    <div
      className={cn(
        header(),
        "flex items-start justify-start text-start border-none",
        columnCount >= 3 ? "col-span-3" : "col-span-2",
      )}
    >
      <div className="text-xs font-normal text-secondary leading-tight wrap-break-word">
        ระดับความสำเร็จ (Level of Achievement)
      </div>
    </div>
  );
}

function KpiTitleCell({ index }: { index: number }) {
  return (
    <div className="flex items-start h-full gap-2">
      <Badge color="orange" label={(index + 1).toString()} />
      <div className="text-xs font-normal text-secondary leading-tight text-start">
        Individual KPI
      </div>
    </div>
  );
}

function WeightCell({ weight }: { weight: number }) {
  return (
    <div className="flex justify-start h-full p-2 text-start">
      <span className="text-sm tabular-nums">{formatDecimal(weight)}</span>
    </div>
  );
}

function EvaluationTable({
  index,
  kpi,
  hasChecker,
  targetRows,
  values,
  canPerform,
  onAchievementChange,
}: {
  index: number;
  kpi: KPI;
  hasChecker: boolean;
  targetRows: TargetRow[];
  values: KpisEvaluation["kpis"][number] | undefined;
  canPerform: Record<RoleKey, boolean>;
  onAchievementChange: (field: AchievementField, value: string) => void;
}) {
  const weight = Number(kpi.weight);
  const visibleAchievementColumns = ACHIEVEMENT_COLUMNS.filter(
    (column) => !column.requiresChecker || hasChecker,
  );
  const gridClass = hasChecker
    ? "grid-cols-[minmax(0,1fr)_88px_88px_minmax(0,1.4fr)_140px_140px_140px]"
    : "grid-cols-[minmax(0,1fr)_88px_88px_minmax(0,1.4fr)_140px_140px]";

  return (
    <div className="mt-0 min-w-full border-y border-border relative hidden lg:block overflow-x-auto">
      <div className={cn("grid divide-x divide-border min-w-180", gridClass)}>
        <div className={cn(header(), "row-span-2")}>
          <KpiTitleCell index={index} />
        </div>
        <ColumnHeader title="น้ำหนัก" subtitle="(Weight)" className="row-span-2" />
        <ColumnHeader title="เป้าหมาย" subtitle="(Target)" className="row-span-2" />
        <ColumnHeader
          title="รายละเอียดเป้าหมาย"
          subtitle="(Target Detail)"
          className="row-span-2"
        />
        <AchievementGroupHeader
          columnCount={visibleAchievementColumns.length}
        />
        {visibleAchievementColumns.map((column, columnIndex) => (
          <ColumnHeader
            key={column.field}
            title={column.title}
            subtitle={column.subtitle}
            className={
              columnIndex === visibleAchievementColumns.length - 1
                ? "border-none"
                : undefined
            }
          />
        ))}

        <div className="p-2 overflow-hidden">
          <div className="flex flex-col gap-3">
            {INFO_BLOCKS.map((item) => (
              <InfoBlock
                key={item.key}
                label={item.label}
                value={item.value(kpi)}
              />
            ))}
          </div>
        </div>

        <WeightCell weight={weight} />

        <div className="flex flex-col divide-y divide-border">
          {targetRows.map((row) => (
            <div
              key={row.id}
              className="flex flex-1 min-h-0 items-center justify-center p-3"
            >
              <span className="text-sm font-medium font-mono">{row.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col divide-y divide-border">
          {targetRows.map((row) => (
            <div key={row.id} className="flex flex-1 min-h-0 p-2">
              <p className="text-xs text-secondary whitespace-pre-wrap wrap-break-word">
                {row.detail || "-"}
              </p>
            </div>
          ))}
        </div>

        {visibleAchievementColumns.map((column) => (
          <div
            key={column.field}
            className="flex flex-col divide-y divide-border"
          >
            {targetRows.map((row) => {
              const current = values?.[column.field];
              const checked =
                current != null && current.toString() === row.id;

              return (
                <div
                  key={row.id}
                  className="flex flex-1 min-h-0 items-center justify-center p-3"
                >
                  <AchievementRadioCell
                    id={`${column.role}-${index}-${row.id}`}
                    label={`${column.title} ${row.label}`}
                    value={row.id}
                    checked={checked}
                    disabled={!canPerform[column.role]}
                    onValueChange={(value) =>
                      onAchievementChange(column.field, value)
                    }
                    borderColor={column.borderColor}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Layout สำหรับจอเล็ก (ต่ำกว่า lg): แยกเป็นการ์ดข้อมูล KPI ด้านบน
 * แล้วตามด้วยตาราง target แบบรายแถว — แถวจัดความสูงเองตาม grid ไม่ต้อง sync rowHeights
 */
function MobileEvaluationTable({
  index,
  kpi,
  hasChecker,
  targetRows,
  values,
  canPerform,
  onAchievementChange,
}: {
  index: number;
  kpi: KPI;
  hasChecker: boolean;
  targetRows: TargetRow[];
  values: KpisEvaluation["kpis"][number] | undefined;
  canPerform: Record<RoleKey, boolean>;
  onAchievementChange: (field: AchievementField, value: string) => void;
}) {
  const weight = Number(kpi.weight);
  const visibleAchievementColumns = ACHIEVEMENT_COLUMNS.filter(
    (column) => !column.requiresChecker || hasChecker,
  );
  const gridClass = hasChecker
    ? "grid-cols-[72px_minmax(0,1fr)_72px_72px_72px]"
    : "grid-cols-[72px_minmax(0,1fr)_72px_72px]";

  return (
    <div className="lg:hidden mt-0 min-w-full border-border relative">
      <div className="grid grid-cols-[minmax(0,1fr)_88px] divide-x divide-border">
        <div className={header()}>
          <KpiTitleCell index={index} />
        </div>
        <ColumnHeader
          title="น้ำหนัก"
          subtitle="(Weight)"
          className="border-none"
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_88px] divide-x divide-border">
        <div className="p-2 flex flex-col gap-3">
          {INFO_BLOCKS.map((item) => (
            <InfoBlock
              key={item.key}
              label={item.label}
              value={item.value(kpi)}
            />
          ))}
        </div>
        <WeightCell weight={weight} />
      </div>

      <div className={cn("grid divide-x divide-border", gridClass)}>
        <ColumnHeader
          title="เป้าหมาย"
          subtitle="(Target)"
          className="row-span-2"
        />
        <ColumnHeader
          title="รายละเอียดเป้าหมาย"
          subtitle="(Target Detail)"
          className="row-span-2"
        />
        <AchievementGroupHeader
          columnCount={visibleAchievementColumns.length}
        />
        {visibleAchievementColumns.map((column, columnIndex) => (
          <ColumnHeader
            key={column.field}
            title={column.mobileTitle}
            subtitle={column.mobileSubtitle}
            className={
              columnIndex === visibleAchievementColumns.length - 1
                ? "border-none"
                : undefined
            }
          />
        ))}
      </div>

      {targetRows.map((row) => (
        <div
          key={row.id}
          className={cn(
            "grid divide-x divide-border border-b border-border",
            gridClass,
          )}
        >
          <div className="flex items-center justify-center p-2">
            <span className="text-sm font-medium font-mono">{row.label}</span>
          </div>
          <div className="p-2">
            <p className="text-xs text-secondary whitespace-pre-wrap wrap-break-word">
              {row.detail || "-"}
            </p>
          </div>
          {visibleAchievementColumns.map((column) => {
            const current = values?.[column.field];
            const checked = current != null && current.toString() === row.id;

            return (
              <div
                key={column.field}
                className="flex items-center justify-center p-2"
              >
                <AchievementRadioCell
                  id={`m-${column.role}-${index}-${row.id}`}
                  label={`${column.title} ${row.label}`}
                  value={row.id}
                  checked={checked}
                  disabled={!canPerform[column.role]}
                  onValueChange={(value) =>
                    onAchievementChange(column.field, value)
                  }
                  borderColor={column.borderColor}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function EvaluationComments({
  form,
  index,
  hasChecker,
  canPerform,
  ownerActualRef,
  syncTextareaHeights,
  onUpload,
  onRemove,
}: {
  form: UseFormReturn<KpisEvaluation>;
  index: number;
  hasChecker: boolean;
  canPerform: Record<RoleKey, boolean>;
  ownerActualRef: React.RefObject<HTMLTextAreaElement | null>;
  syncTextareaHeights: () => void;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const visibleCommentColumns = COMMENT_COLUMNS.filter(
    (column) => !column.requiresChecker || hasChecker,
  );

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2",
        hasChecker
          ? "lg:grid-cols-3 lg:items-stretch"
          : "lg:grid-cols-2 lg:items-stretch",
      )}
    >
      {visibleCommentColumns.map((column) => (
        <div key={column.field} className={EVALUATION_COLUMN_CLASS}>
          <FormGenerator
            name={`kpis.${index}.${column.field}`}
            form={form}
            variant="bigText"
            disabled={!canPerform[column.role]}
            label={column.label}
            description={column.description}
            fillHeight={column.fillHeight}
            maxLength={KPI_ACTUAL_MAX_LENGTH}
            className={
              column.fillHeight ? FILL_HEIGHT_FORM_CLASS : BLUE_FORM_CLASS
            }
            textareaRef={
              column.showFileUpload
                ? (el) => {
                    ownerActualRef.current = el;
                    syncTextareaHeights();
                  }
                : undefined
            }
            onInput={
              column.showFileUpload ? () => syncTextareaHeights() : undefined
            }
            fileUpload={
              column.showFileUpload ? (
                <FormField
                  control={form.control}
                  name={`kpis.${index}.fileUrl`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-secondary flex flex-col gap-0.5 font-normal items-start">
                        <span>
                          ข้อมูล/หลักฐานการประเมิน (Evident Data/Evidence)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <AttachButton
                          value={field.value as string | null}
                          canPerform={canPerform.owner}
                          onChange={field.onChange}
                          onUpload={onUpload}
                          onRemove={onRemove}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}

export const KpiEvaluationContent = ({
  id,
  period,
  form,
  index,
  kpi,
  permissions,
  hasChecker,
  role,
}: Props) => {
  const { mutation: deleteKpiFile } = useDeleteKpiFile(id, period);
  const { mutation: syncKpiAttach } = useSyncKpiAttach(id, period);

  const targetRows = KPI_TARGET_FIELDS.map((item) => ({
    id: item.percent.replace("%", ""),
    label: item.percent,
    detail: kpi[item.name],
  }));

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

  const canPerform = {
    owner: permissions.write && role === "owner",
    checker: permissions.write && role === "checker",
    approver: permissions.write && role === "approver",
  };

  const visibleAchievementColumns = ACHIEVEMENT_COLUMNS.filter(
    (column) => !column.requiresChecker || hasChecker,
  );

  const handleAchievementChange = (
    field: AchievementField,
    value: string,
  ) => {
    form.setValue(`kpis.${index}.${field}`, value ? Number.parseFloat(value) : null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="w-full relative z-80 flex flex-col gap-4">
      <EvaluationTable
        index={index}
        kpi={kpi}
        hasChecker={hasChecker}
        targetRows={targetRows}
        values={values}
        canPerform={canPerform}
        onAchievementChange={handleAchievementChange}
      />

      <MobileEvaluationTable
        index={index}
        kpi={kpi}
        hasChecker={hasChecker}
        targetRows={targetRows}
        values={values}
        canPerform={canPerform}
        onAchievementChange={handleAchievementChange}
      />

      <div>
        {visibleAchievementColumns.map((column) => (
          <FormField
            key={column.field}
            control={form.control}
            name={`kpis.${index}.${column.field}`}
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>

      <EvaluationComments
        form={form}
        index={index}
        hasChecker={hasChecker}
        canPerform={canPerform}
        ownerActualRef={ownerActualRef}
        syncTextareaHeights={syncTextareaHeights}
        onUpload={(url) => syncKpiAttach({ id: kpi.id, fileUrl: url })}
        onRemove={() => deleteKpiFile({ id: kpi.id })}
      />
    </div>
  );
};
