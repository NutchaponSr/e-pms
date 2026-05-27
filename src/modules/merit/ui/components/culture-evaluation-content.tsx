import { inferProcedureOutput } from "@trpc/server";

import { Period } from "@/generated/prisma/enums";
import { AppRouter } from "@/trpc/routers/_app";
import { UseFormReturn } from "react-hook-form";
import { MeritEvaluation } from "../../schemas/evaluation";
import { CardInfo } from "@/components/card-info";
import { formatDecimal } from "@/lib/utils";
import { useMemo, useRef } from "react";
import { FormGenerator } from "@/components/form-generator";
import { formRecord } from "@/types/form";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AttachButton } from "@/components/attach-button";
import { useDeleteCultureFile } from "../../api/use-delete-culture-file";
import { HistoryActualPopover } from "./history-actual-popover";
import { HistoryResultPopover } from "./history-result-popover";

interface Props {
  index: number;
  period: Period;
  cultureRecord: inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"]["cultureRecords"][number];
  form: UseFormReturn<MeritEvaluation>;
  permissions: {
    canPerformOwner: boolean;
    canPerformChecker: boolean;
    canPerformApprover: boolean;
  };
  hasChecker: boolean;
  formId: string;
  weight: number;
}

export const CultureEvaluationContent = ({
  index,
  period,
  cultureRecord,
  form,
  permissions,
  formId,
  weight,
  hasChecker,
}: Props) => {
  const { mutation: deleteCultureFile } = useDeleteCultureFile(formId, period);

  const eva1st = cultureRecord.cultureEvaluations.find((eva) => eva.period === Period.EVALUATION_1ST);
  const eva2nd = cultureRecord.cultureEvaluations.find((eva) => eva.period === Period.EVALUATION_2ND);

  const ownerActualRef = useRef<HTMLTextAreaElement | null>(null);
  const checkerActualRef = useRef<HTMLTextAreaElement | null>(null);
  const approverActualRef = useRef<HTMLTextAreaElement | null>(null);

  const textareaRefs = useMemo(
    () =>
      hasChecker
        ? [ownerActualRef, checkerActualRef, approverActualRef]
        : [ownerActualRef, approverActualRef],
    [hasChecker],
  );

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
    hasChecker ? "lg:grid-cols-3" : "lg:grid-cols-2",
  );

  const blueFormClass = {
    input: formRecord.blue.input,
    label: formRecord.blue.label,
    description: "text-xs text-secondary",
    form: "flex flex-col gap-2 flex-1 min-h-0 bg-transparent p-0 h-auto",
  };

  const evaluationColumnClass =
    "flex flex-col gap-2 min-h-0 h-full p-2 bg-[#0080d51c] dark:bg-[#298bfd10] rounded-sm";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center grow gap-2">
        <div className="shrink-0 grow-0 self-start mt-0 size-10 flex justify-center items-center bg-marine rounded-full select-none">
          <div className="text-white text-xl font-semibold">
            {cultureRecord.culture.code}
          </div>
        </div>

        <div className="flex flex-col whitespace-nowrap overflow-hidden text-ellipsis">
          <div className="text-base leading-5 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
            {cultureRecord.culture.name}
          </div>
          <div className="text-sm leading-4 whitespace-nowrap overflow-hidden text-ellipsis text-secondary">
            {cultureRecord.culture.description}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <CardInfo label="Behavior" variant="default" className="col-span-2 h-auto">
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-full whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {Array.isArray(cultureRecord.culture?.belief) ? cultureRecord.culture?.belief?.map((item, idx) => (
                <li className="list-disc list-inside text-primary" key={idx}>{String(item)}</li>
              )) : null}
            </p>
          </div>
        </CardInfo>
        <CardInfo label="Evidence" variant="default" className="col-span-2 h-auto">
          <div className="relative w-full flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {cultureRecord.evidence}
            </p>
          </div>
        </CardInfo>
        <CardInfo label="น้ำหนัก (%)" variant="default" className="col-span-1 h-auto">
          <div className="relative w-full flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {formatDecimal(weight)}
            </p>
          </div>
        </CardInfo>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-marine">{evaluationSectionTitle}</h2>
        <div className={evaluationGridClass}>
          <div className={evaluationColumnClass}>
            <FormGenerator
              name={`cultures.${index}.actualOwner`}
              form={form}
              variant="bigText"
              label="พนักงาน (Employee)"
              disabled={!permissions.canPerformOwner}
              description="ผลลัพธ์ (Result) การแสดงออกตามพฤติกรรมที่คาดหวัง"
              className={blueFormClass}
              textareaRef={(el) => {
                ownerActualRef.current = el;
                syncTextareaHeights();
              }}
              onInput={() => syncTextareaHeights()}
              fileUpload={
                <FormField
                  control={form.control}
                  name={`cultures.${index}.fileUrl`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-marine">
                        ข้อมูล/หลักฐานการประเมิน (Evident Data/Evidence)
                      </FormLabel>
                      <FormControl>
                        <AttachButton
                          value={field.value as string | null}
                          canPerform={permissions.canPerformOwner}
                          onChange={field.onChange}
                          onRemove={() => deleteCultureFile({ id: eva1st!.id })}
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
              name={`cultures.${index}.levelBehaviorOwner`}
              disabled={!permissions.canPerformOwner}
              midYearLevel={eva1st?.levelBehaviorOwner}
            />
          </div>

          {hasChecker && (
            <div className={evaluationColumnClass}>
              <FormGenerator
                name={`cultures.${index}.actualChecker`}
                form={form}
                variant="bigText"
                label="ผู้ประเมินลำดับที่ 1 (Evaluator 1)"
                disabled={!permissions.canPerformChecker}
                description="ความคิดเห็น (Comment)"
                className={blueFormClass}
                textareaRef={(el) => {
                  checkerActualRef.current = el;
                  syncTextareaHeights();
                }}
                onInput={() => syncTextareaHeights()}
              >
                <HistoryActualPopover period={period} actual={eva1st?.actualChecker} />
              </FormGenerator>
              <EvaluationResultField
                form={form}
                period={period}
                name={`cultures.${index}.levelBehaviorChecker`}
                disabled={!permissions.canPerformChecker}
                midYearLevel={eva1st?.levelBehaviorChecker}
              />
            </div>
          )}

          <div className={evaluationColumnClass}>
            <FormGenerator
              name={`cultures.${index}.actualApprover`}
              form={form}
              variant="bigText"
              label="ผู้ประเมินลำดับที่ 2 (Evaluator 2)"
              disabled={!permissions.canPerformApprover}
              description="ความคิดเห็น (Comment)"
              className={blueFormClass}
              textareaRef={(el) => {
                approverActualRef.current = el;
                syncTextareaHeights();
              }}
              onInput={() => syncTextareaHeights()}
            >
              <HistoryActualPopover period={period} actual={eva1st?.actualApprover} />
            </FormGenerator>
            <EvaluationResultField
              form={form}
              period={period}
              name={`cultures.${index}.levelBehaviorApprover`}
              disabled={!permissions.canPerformApprover}
              midYearLevel={eva1st?.levelBehaviorApprover}
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
  name: `cultures.${number}.${"levelBehaviorOwner" | "levelBehaviorChecker" | "levelBehaviorApprover"}`;
  disabled: boolean;
  midYearLevel: number | null | undefined;
}

const formatLevel = (level: number | null | undefined) =>
  level != null ? `Level ${level}` : "-";

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
          ผลการประเมิน (Evaluation Result)
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
                  value={field.value != null ? String(field.value) : ""}
                  onValueChange={(value) => {
                    field.onChange(value ? Number(value) : null);
                    void form.trigger(name);
                  }}
                >
                  <FormControl>
                    <SelectTrigger className={cn(formRecord.blue.input, "w-full min-h-10 h-10")}>
                      <SelectValue placeholder="เลือกระดับพฤติกรรม" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                    value={field.value != null ? String(field.value) : ""}
                    onValueChange={(value) => {
                      field.onChange(value ? Number(value) : null);
                      void form.trigger(name);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className={cn(formRecord.blue.input, "w-full min-h-10 h-10")}>
                        <SelectValue placeholder="เลือกระดับพฤติกรรม" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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
