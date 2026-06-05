import { inferProcedureOutput } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";
import { CardInfo } from "@/components/card-info";
import { formatDecimal } from "@/lib/utils";
import { MeritEvaluation } from "../../schemas/evaluation";
import { UseFormReturn } from "react-hook-form";
import { Period } from "@/generated/prisma/enums";
import { Action } from "@/modules/tasks/permissions";
import { useMemo, useRef } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table } from "@/components/table";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { FormGenerator } from "@/components/form-generator";
import { formRecord } from "@/types/form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { AttachButton } from "@/components/attach-button";
import { useDeleteCompetencyFile } from "../../api/use-delete-competency-file";
import { useSyncCompetencyAttach } from "../../api/use-sync-competency-attach";
import { COMPETENCY_ACTUAL_MAX_LENGTH } from "../../constant";
import { HistoryActualPopover } from "./history-actual-popover";
import { HistoryResultPopover } from "./history-result-popover";

interface Props {
  index: number;
  period: Period;
  competencyRecord: inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"]["competencyRecords"][number];
  form: UseFormReturn<MeritEvaluation>;
  permissions: {
    canPerformOwner: boolean;
    canPerformChecker: boolean;
    canPerformApprover: boolean;
  },
  formId: string;
  hasChecker: boolean;
}

export const CompetencyEvaluationContent = ({ 
  index, 
  competencyRecord, 
  form,
  permissions,
  formId,
  period,
  hasChecker,
}: Props) => {
  const { mutation: deleteCompetencyFile } = useDeleteCompetencyFile(formId, period);
  const { mutation: syncCompetencyAttach } = useSyncCompetencyAttach(formId, period);

  const eva1st = competencyRecord.competencyEvaluations.find((evaluation) => evaluation.period === Period.EVALUATION_1ST);
  const eva2nd = competencyRecord.competencyEvaluations.find((evaluation) => evaluation.period === Period.EVALUATION_2ND);
  const currentEvaluation = competencyRecord.competencyEvaluations.find(
    (evaluation) => evaluation.period === period,
  );

  const ownerActualRef = useRef<HTMLTextAreaElement | null>(null);

  const textareaRefs = useMemo(() => [ownerActualRef], []);

  const { groupSyncFunctions } = useSyncTextareaHeights([
    {
      refs: textareaRefs,
      breakpoint: "(min-width: 1024px)",
    },
  ]);

  const syncTextareaHeights = groupSyncFunctions[0];

  const evaluationSectionTitle =
    period === Period.EVALUATION_1ST ? "Mid-year Evaluation" : "Year-end Evaluation";

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center grow gap-2"> 
          <div className="shrink-0 grow-0 self-start mt-0 size-10 flex justify-center items-center bg-marine rounded-full select-none">
            <div className="text-white text-xl font-semibold">
              {index + 1}
            </div>
          </div>

          <h1 className="text-primary text-xl font-semibold whitespace-break-spaces overflow-hidden text-ellipsis leading-7">
            {competencyRecord.competency?.name} 
          </h1>
        </div>

        <div className="flex flex-row items-center gap-2 bg-[#0080d51c] dark:bg-[#298bfd10] p-2 rounded-sm">
          <h4 className="text-sm text-marine">
            น้ำหนัก (%)
          </h4>
          <p className="text-sm shadow-[0_4px_12px_0_rgba(25,25,25,0.029),0_1px_2px_0_rgba(25,25,25,0.019),0_0_0_1px_rgba(0,124,215,0.094)] dark:shadow-[0_4px_12px_0_rgba(25,25,25,0.4),0_0_0_1px_rgba(71,157,255,0.173)] bg-background py-1 px-2 rounded">
            {formatDecimal(Number(competencyRecord.weight))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        <CardInfo 
          label={`พฤติกรรมที่คาดหวัง\n(Expected Level)`} 
          variant="default" 
          className="col-span-2"
        >
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
            {competencyRecord.competency?.[`t${competencyRecord.expectedLevel}` as 't1' | 't2' | 't3' | 't4' | 't5'] as string | null}
            </p>
          </div>
        </CardInfo>
        <CardInfo 
          label={`การแสดงออกตามพฤติกรรมที่คาดหวัง\n(Demonstration of Expected Behavior)`} 
          variant="default" 
          className="col-span-2"
        >
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {competencyRecord.output}
            </p>
          </div>
        </CardInfo>
        <CardInfo 
          label={`โครงการ/กิจกรรมที่ใช้เป็นตัวแสดงออกตามพฤติกรรมที่คาดหวัง\n(Projects / Activities Demonstrating Expected Behavior)`} 
          variant="default" 
          className="col-span-2"
        >
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {competencyRecord.input}
            </p>
          </div>
        </CardInfo>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-marine">{evaluationSectionTitle}</h2>
        <div className={evaluationGridClass}>
          <div className={evaluationColumnClass}>
            <FormGenerator
              name={`competencies.${index}.actualOwner`}
              form={form}
              variant="bigText"
              label="พนักงาน (Employee)"
              disabled={!permissions.canPerformOwner}
              description="ผลลัพธ์การแสดงออกตามพฤติกรรมที่คาดหวัง (Result)"
              maxLength={COMPETENCY_ACTUAL_MAX_LENGTH}
              className={blueFormClass}
              textareaRef={(el) => {
                ownerActualRef.current = el;
                syncTextareaHeights();
              }}
              onInput={() => syncTextareaHeights()}
              fileUpload={
                <FormField
                  control={form.control}
                  name={`competencies.${index}.fileUrl`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-secondary">
                        ข้อมูล/หลักฐานการประเมิน (Evident Data/Evidence)
                      </FormLabel>
                      <FormControl>
                        <AttachButton
                          value={field.value as string | null}
                          canPerform={permissions.canPerformOwner}
                          onChange={field.onChange}
                          onUpload={(url) => {
                            if (currentEvaluation) {
                              syncCompetencyAttach({ id: currentEvaluation.id, fileUrl: url });
                            }
                          }}
                          onRemove={() => {
                            if (currentEvaluation) {
                              deleteCompetencyFile({ id: currentEvaluation.id });
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              }
            >
              <HistoryActualPopover period={period} actual={eva1st?.actualOwner} />
            </FormGenerator>
            <EvaluationResultField
              form={form}
              period={period}
              name={`competencies.${index}.achievementOwner`}
              disabled={!permissions.canPerformOwner}
              midYearLevel={eva1st?.levelOwner}
            />
          </div>

          {hasChecker && (
            <div className={evaluationColumnClass}>
              <FormGenerator
                name={`competencies.${index}.actualChecker`}
                form={form}
                variant="bigText"
                label="ผู้ประเมินลำดับที่ 1 (Evaluator 1)"
                disabled={!permissions.canPerformChecker}
                description="ความคิดเห็น (Comment)"
                maxLength={COMPETENCY_ACTUAL_MAX_LENGTH}
                fillHeight
                className={fillHeightFormClass}
              >
                <HistoryActualPopover period={period} actual={eva1st?.actualChecker} />
              </FormGenerator>
              <EvaluationResultField
                form={form}
                period={period}
                name={`competencies.${index}.achievementChecker`}
                disabled={!permissions.canPerformChecker}
                midYearLevel={eva1st?.levelChecker}
              />
            </div>
          )}

          <div className={evaluationColumnClass}>
            <FormGenerator
              name={`competencies.${index}.actualApprover`}
              form={form}
              variant="bigText"
              label="ผู้ประเมินลำดับที่ 2 (Evaluator 2)"
              disabled={!permissions.canPerformApprover}
              description="ความคิดเห็น (Comment)"
              maxLength={COMPETENCY_ACTUAL_MAX_LENGTH}
              fillHeight
              className={fillHeightFormClass}
            >
              <HistoryActualPopover period={period} actual={eva1st?.actualApprover} />
            </FormGenerator>
            <EvaluationResultField
              form={form}
              period={period}
              name={`competencies.${index}.achievementApprover`}
              disabled={!permissions.canPerformApprover}
              midYearLevel={eva1st?.levelApprover}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface EvaluationResultFieldProps {
  form: UseFormReturn<MeritEvaluation>;
  period: Period;
  name: `competencies.${number}.${"achievementOwner" | "achievementChecker" | "achievementApprover"}`;
  disabled: boolean;
  midYearLevel: number | null | undefined;
}

const formatLevel = (level: number | null | undefined) =>
  level != null ? `Level ${level}` : "-";

const CLEAR_LEVEL_VALUE = "__none__";

const EvaluationResultField = ({
  form,
  period,
  name,
  disabled,
  midYearLevel,
}: EvaluationResultFieldProps) => {
  const isYearEnd = period === Period.EVALUATION_2ND;

  return (
    <div className="flex flex-col gap-2 mt-auto pt-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-marine shrink-0">
          ผลการประเมิน (Evaluation)
        </span>
        {isYearEnd && (
          <HistoryResultPopover
            period={period}
            midYearLevel={midYearLevel}
          />
        )}
      </div>

      {isYearEnd ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-marine">Mid-year Evaluation</span>
          <p className={cn(formRecord.blue.input, "min-h-10 flex items-center px-2.5 text-sm")}>
            {formatLevel(midYearLevel)}
          </p>
        </div>
      ) : (
        <FormField
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem>
              {disabled ? (
                <p className={cn(formRecord.blue.input, "min-h-10 flex items-center justify-end px-2.5")}>
                  {field.value ? `${field.value}` : ""}
                </p>
              ) : (
                <Select
                  value={field.value != null ? String(field.value) : CLEAR_LEVEL_VALUE}
                  onValueChange={(value) => {
                    field.onChange(value === CLEAR_LEVEL_VALUE ? null : Number(value));
                    void form.trigger(name);
                  }}
                >
                  <FormControl>
                    <SelectTrigger className={cn(formRecord.blue.input, "w-full min-h-10 h-10")}>
                      <SelectValue placeholder="เลือกระดับความสำเร็จ" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CLEAR_LEVEL_VALUE} className="text-secondary">
                      เลือกระดับความสำเร็จ
                    </SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {isYearEnd && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-marine">Year-end Evaluation</span>
          <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                {disabled ? (
                  <p className={cn(formRecord.blue.input, "min-h-10 flex items-center justify-end px-2.5")}>
                    {field.value ? `${field.value}` : ""}
                  </p>
                ) : (
                  <Select
                    value={field.value != null ? String(field.value) : CLEAR_LEVEL_VALUE}
                    onValueChange={(value) => {
                      field.onChange(value === CLEAR_LEVEL_VALUE ? null : Number(value));
                      void form.trigger(name);
                    }}
                  >
                  <FormControl>
                    <SelectTrigger className={cn(formRecord.blue.input, "w-full min-h-10 h-10")}>
                      <SelectValue placeholder="เลือกระดับความสำเร็จ" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CLEAR_LEVEL_VALUE} className="text-secondary">
                      เลือกระดับความสำเร็จ
                    </SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
          />
        </div>
      )}
    </div>
  );
};