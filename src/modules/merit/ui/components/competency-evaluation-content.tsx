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
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/badge";
import { AttachButton } from "@/components/attach-button";
import { useDeleteCompetencyFile } from "../../api/use-delete-competency-file";
import { CompetencyResultTable } from "./competency-result-table";
import { HistoryActualPopover } from "./history-actual-popover";

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

  const eva1st = competencyRecord.competencyEvaluations.find((evaluation) => evaluation.period === Period.EVALUATION_1ST);
  const eva2nd = competencyRecord.competencyEvaluations.find((evaluation) => evaluation.period === Period.EVALUATION_2ND); 

  const data = useMemo(() => {
    return [
      {
        round: "ครั้งที่ 1 (ม.ค. - มิ.ย.)",
        result: eva1st?.result || "ข",
        owner: eva1st?.levelOwner,
        checker: eva1st?.levelChecker,
        approver: eva1st?.levelApprover,
        weight: Number(competencyRecord.weight) || 0,
        period: Period.EVALUATION_1ST,
      },
      {
        round: "ครั้งที่ 2 (ก.ค. - ธ.ค.)",
        result: eva2nd?.result || "-",
        owner: eva2nd?.levelOwner,
        checker: eva2nd?.levelChecker,
        approver: eva2nd?.levelApprover,
        weight: Number(competencyRecord.weight) || 0,
        period: Period.EVALUATION_2ND,
      },
    ]
  }, [competencyRecord.weight, eva1st, eva2nd]);

  const ownerActualRef = useRef<HTMLTextAreaElement | null>(null);
  const checkerActualRef = useRef<HTMLTextAreaElement | null>(null);
  const approverActualRef = useRef<HTMLTextAreaElement | null>(null);

  const { groupSyncFunctions } = useSyncTextareaHeights([
    {
      refs: [ownerActualRef, checkerActualRef, approverActualRef],
      breakpoint: "(min-width: 1024px)",
    },
  ]);
  
  const syncTextareaHeights = groupSyncFunctions[0];

  return (
    <div className="flex flex-col gap-4">
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

      <div className="grid grid-cols-7 gap-2">
        <CardInfo label="แผนงาน/โครงการ ที่จะพัฒนา" variant="default" className="col-span-2">
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {competencyRecord.input}
            </p>
          </div>
        </CardInfo>
        <CardInfo label="เป้าหมายที่จะพัฒนา" variant="default" className="col-span-2">
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {competencyRecord.output}
            </p>
          </div>
        </CardInfo>
        <CardInfo label="น้ำหนัก (%)" variant="default">
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {formatDecimal(Number(competencyRecord.weight))}
            </p>
          </div>
        </CardInfo>
        <CardInfo label="ระดับพฤติกรรมของ Competency" variant="default" className="col-span-2">
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
            {competencyRecord.competency?.[`t${competencyRecord.expectedLevel}` as 't1' | 't2' | 't3' | 't4' | 't5'] as string | null}
            </p>
          </div>
        </CardInfo>
      </div>
      
      <CompetencyResultTable 
        index={index}
        form={form}
        hasChecker={hasChecker}
        period={period}
        weight={Number(competencyRecord.weight) || 0}
        data={data}
        permissions={permissions}
      />

      <div className="grid grid-cols-7 gap-4">
        <FormGenerator
          name={`competencies.${index}.actualOwner`}
          form={form}
          variant="bigText"
          disabled={!permissions.canPerformOwner}
          label="Owner"
          description="รายละเอียดของผลสำเร็จเพิ่มเติม (Detail of success result)"
          className={{
            ...formRecord.default,
            form: "grow-0 shrink-0 basis-auto p-2 h-full dark:bg-[#fcfcfc08] rounded-sm flex flex-col gap-2 col-span-2",
          }}
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
                  <FormLabel className="text-xs text-secondary">Optional</FormLabel>
                  <FormControl>
                    <AttachButton
                      value={field.value as string | null}
                      canPerform={true}
                      onChange={field.onChange}
                      onRemove={() => deleteCompetencyFile({ id: eva1st!.id })}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          }
        >
          <HistoryActualPopover period={period} actual={eva2nd?.actualOwner} />
        </FormGenerator>
        <FormGenerator
          name={`competencies.${index}.actualChecker`}
          form={form}
          variant="bigText"
          disabled={!permissions.canPerformChecker}
          label="Checker"
          description="ความคิดเห็น (Comment)"
          className={{
            ...formRecord.default,
            form: "grow-0 shrink-0 basis-auto p-2 h-full dark:bg-[#fcfcfc08] rounded-sm flex flex-col gap-2 col-span-2",
          }}
          textareaRef={(el) => {
            checkerActualRef.current = el;
            syncTextareaHeights();
          }}
          onInput={() => syncTextareaHeights()}
        >
          <HistoryActualPopover period={period} actual={eva2nd?.actualChecker} />
        </FormGenerator>
        <FormGenerator
          name={`competencies.${index}.actualApprover`}
          form={form}
          variant="bigText"
          disabled={!permissions.canPerformApprover}
          label="Approver"
          description="ความคิดเห็น (Comment)"
          className={{
            ...formRecord.default,
            form: "grow-0 shrink-0 basis-auto p-2 h-full dark:bg-[#fcfcfc08] rounded-sm flex flex-col gap-2 col-span-2",
          }}
          textareaRef={(el) => {
            approverActualRef.current = el;
            syncTextareaHeights();
          }}
          onInput={() => syncTextareaHeights()}
        >
          <HistoryActualPopover period={period} actual={eva2nd?.actualApprover} />
        </FormGenerator>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-row">
            <div className="flex items-center leading-4.5 min-w-0 text-sm text-secondary">
              <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                % ผลสำเร็จ
              </div>
            </div>
          </div>

          <Badge color="orange" label={formatDecimal(Number(form.watch(`competencies.${index}.achievementApprover`)))} />
        </div>
      </div>
    </div>
  );
}