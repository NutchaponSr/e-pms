import { Fragment } from "react";
import { cva } from "class-variance-authority";
import type { FieldPath, UseFormReturn } from "react-hook-form";

import { cn } from "@/lib/utils";

import { useConfirm } from "@/hooks/use-confirm";

import type { Period } from "@/generated/prisma/enums";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { Badge } from "@/components/badge";
import { FormGenerator } from "@/components/form-generator";
import { CommentSection } from "@/components/comment-section";

import { useDeleteKpi } from "@/modules/kpi/api/use-delete-kpi";
import type { CommentWithEmployee } from "@/modules/comments/types";
import { useCreateComment } from "@/modules/comments/api/use-create-comment";

import type {
  KpiDefinition,
  KpiDefinitions,
} from "@/modules/kpi/schema/definition";
import type { Action } from "@/modules/tasks/permissions";
import { KPI_TARGET_FIELDS, kpiCategoies } from "@/modules/kpi/constants";

const CATEGORY_OPTIONS = Object.entries(kpiCategoies).map(([key, label]) => ({
  key,
  label,
}));

const DETAIL_FIELDS = [
  {
    name: "name",
    label: "ตัวชี้วัดหลัก",
    description: "(Key Performance Indicator (KPI))",
  },
  {
    name: "definition",
    label: "คำจำกัดความและสูตรคำนวณ",
    description: "(Definition and Calculation Formula)",
  },
  {
    name: "method",
    label: "รูปแบบและวิธีการรายงานผลสำเร็จ",
    description: "(Format/Method of Reporting Achievement)",
  },
] as const;

const labelClassName = {
  form: "gap-1",
  label:
    "text-xs font-medium text-secondary whitespace-normal overflow-visible",
  description:
    "text-[10px] leading-4 text-tertiary font-normal whitespace-normal overflow-visible",
};

const fieldClassName = {
  ...labelClassName,
  input:
    "min-h-0 h-auto w-full rounded border border-border bg-transparent px-3 py-2 text-sm",
};

const bigTextClassName = {
  ...labelClassName,
  input:
    "h-auto w-full field-sizing-content overflow-hidden rounded border border-border bg-transparent px-3 py-2 text-sm",
};

const targetFieldClassName = {
  ...labelClassName,
  form: "gap-1 flex-1 h-full min-h-0",
  input:
    "min-h-full h-auto lg:h-auto lg:min-h-full w-full overflow-hidden rounded border border-border bg-transparent px-3 py-2 text-sm",
};

const readFieldClassName = {
  ...labelClassName,
  input: "text-sm text-primary whitespace-pre-wrap wrap-break-word",
};

const readBigTextClassName = {
  ...labelClassName,
  form: "gap-1 flex-1 h-full min-h-0",
  input:
    "min-h-full h-auto overflow-hidden text-sm text-primary whitespace-pre-wrap wrap-break-word",
};

interface Props {
  kpi: KpiDefinition;
  index: number;
  period: Period;
  formId: string;
  form: UseFormReturn<KpiDefinitions>;
  comments: CommentWithEmployee[];
  permissions: Record<Action, boolean>;
  onLocalDelete?: () => void;
}

const header = cva(
  "h-8 border-r border-border bg-sidebar shadow-[inset_0_1.25px_0_rgba(42,28,0,0.07),inset_0_-1.25px_0_rgba(42,28,0,0.07)] dark:shadow-[inset_0_1.25px_0_rgba(255,255,243,0.082),inset_0_-1.25px_0_rgba(255,255,243,0.082)] px-2",
);

const TARGET_LG_ROWS = [
  "lg:row-start-2",
  "lg:row-start-3",
  "lg:row-start-4",
  "lg:row-start-5",
] as const;

export const KpiDefinitionContent = ({
  index,
  form,
  onLocalDelete,
  kpi,
  formId,
  period,
  comments,
  permissions,
}: Props) => {
  const createComment = useCreateComment();
  const [ConfirmationDialog, confirm] = useConfirm({
    title: "Delete KPI",
    description: "Are you sure you want to delete this KPI?",
  });
  const { mutation: deleteKpi } = useDeleteKpi(formId, period);
  const canWrite = permissions.write;
  const valueClassName = canWrite ? fieldClassName : readFieldClassName;
  const detailClassName = canWrite ? bigTextClassName : readFieldClassName;
  const targetClassName = canWrite ? targetFieldClassName : readBigTextClassName;
  const fieldName = (name: string) =>
    `kpis.${index}.${name}` as FieldPath<KpiDefinitions>;

  const onDelete = async () => {
    const ok = await confirm();
    if (!ok) return;
    deleteKpi({ id: kpi.id });
    onLocalDelete?.();
  };

  return (
    <>
      <div className="mt-0 min-w-full border-b relative overflow-hidden">
        <ConfirmationDialog />
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_120px_120px_minmax(0,1fr)] lg:gap-0">
          <div className="grid grid-cols-[minmax(0,1fr)_120px] lg:contents">
            <div className={cn(header(), "lg:col-start-1 lg:row-start-1")}>
              <div className="flex items-center h-full gap-2">
                <Badge color="orange" label={(index + 1).toString()} />
                <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis text-start grow">
                  Individual KPI
                </div>
                {permissions.delete && (
                  <Button
                    type="button"
                    variant="dangerOutline"
                    size="xxs"
                    onClick={onDelete}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <ColumnHeader
              title="น้ำหนัก (Weight)"
              className="max-lg:border-r-0 lg:col-start-2 lg:row-start-1"
            />

            <div className="min-w-0 border-r border-border p-2 lg:col-start-1 lg:row-start-2 lg:row-span-4">
              <div className="flex flex-col gap-4">
                <FormGenerator
                  name={fieldName("category")}
                  form={form}
                  variant="selection"
                  disabled={!canWrite}
                  label="มุมมอง KPI ตามกลยุทธ์องค์กร"
                  description="(Link to Strategy)"
                  placeholder="Select an individual KPI"
                  selectOptions={CATEGORY_OPTIONS}
                  className={valueClassName}
                />
                {DETAIL_FIELDS.map((item) => (
                  <FormGenerator
                    key={item.name}
                    name={fieldName(item.name)}
                    form={form}
                    variant="bigText"
                    disabled={!canWrite}
                    label={item.label}
                    description={item.description}
                    className={detailClassName}
                  />
                ))}
              </div>
            </div>
            <div className="min-w-0 p-2 lg:col-start-2 lg:row-start-2 lg:row-span-4 lg:border-r lg:border-border">
              <FormGenerator
                name={fieldName("weight")}
                form={form}
                variant="numeric"
                disabled={!canWrite}
                className={
                  canWrite
                    ? {
                        ...fieldClassName,
                        input:
                          "w-full text-sm min-h-9! border border-border rounded px-3",
                      }
                    : readFieldClassName
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-[6.25rem_minmax(0,1fr)] max-lg:border-t max-lg:border-border lg:contents">
            <ColumnHeader
              title="เป้าหมาย (Target)"
              className="lg:col-start-3 lg:row-start-1"
            />
            <ColumnHeader
              title="รายละเอียดเป้าหมาย (Target Detail)"
              className="border-none lg:col-start-4 lg:row-start-1"
            />
            {KPI_TARGET_FIELDS.map((item, rowIndex) => {
              const isLast = rowIndex === KPI_TARGET_FIELDS.length - 1;
              return (
                <Fragment key={item.name}>
                  <div
                    className={cn(
                      "flex items-center justify-center border-r border-border px-3 py-2 lg:col-start-3",
                      TARGET_LG_ROWS[rowIndex],
                      !isLast && "border-b border-border",
                    )}
                  >
                    <span className="text-sm font-medium font-mono">
                      {item.percent}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex h-full min-h-0 min-w-0 flex-col p-2 lg:col-start-4",
                      TARGET_LG_ROWS[rowIndex],
                      !isLast && "border-b border-border",
                    )}
                  >
                    <FormGenerator
                      name={fieldName(item.name)}
                      form={form}
                      variant="bigText"
                      disabled={!canWrite}
                      fillHeight
                      className={targetClassName}
                    />
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
      <CommentSection
        permissions={permissions}
        comments={comments}
        onCreate={(content) => {
          createComment({
            connectId: kpi.id,
            content,
            period,
            formId,
          });
        }}
      />
      <Separator />
    </>
  );
};

function ColumnHeader({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={cn(header(), className)}>
      <div className="flex items-center h-full">
        <div className="text-xs font-normal text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </div>
      </div>
    </div>
  );
}
