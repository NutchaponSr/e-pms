import { inferProcedureOutput } from "@trpc/server";

import { Period } from "@/generated/prisma/enums";
import { AppRouter } from "@/trpc/routers/_app";
import { UseFormReturn } from "react-hook-form";
import { MeritEvaluation } from "../../schemas/evaluation";
import { CardInfo } from "@/components/card-info";
import { formatDecimal } from "@/lib/utils";
import { useMemo, useRef } from "react";
import { FormGenerator } from "@/components/form-generator";
import { CultureResultTable } from "./culture-result-table";
import { formRecord } from "@/types/form";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { AttachButton } from "@/components/attach-button";
import { useDeleteCultureFile } from "../../api/use-delete-culture-file";
import { Badge } from "@/components/badge";
import { HistoryActualPopover } from "./history-actual-popover";

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
  hasChecker,
  formId,
  weight,
}: Props) => {
  const { mutation: deleteCultureFile } = useDeleteCultureFile(formId, period);

  const eva1st = cultureRecord.cultureEvaluations.find((eva) => eva.period === Period.EVALUATION_1ST);
  const eva2nd = cultureRecord.cultureEvaluations.find((eva) => eva.period === Period.EVALUATION_2ND);

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

  const data = useMemo(() => {
    return [
      {
        round: "ครั้งที่ 1 (ม.ค. - มิ.ย.)",
        result: eva1st?.result || "",
        owner: eva1st?.levelBehaviorOwner,
        checker: eva1st?.levelBehaviorChecker,
        approver: eva1st?.levelBehaviorApprover,
        weight: weight,
        period: Period.EVALUATION_1ST,
      },
      {
        round: "ครั้งที่ 2 (ก.ค. - ธ.ค.)",
        result: eva2nd?.result || "",
        owner: eva2nd?.levelBehaviorOwner,
        checker: eva2nd?.levelBehaviorChecker,
        approver: eva2nd?.levelBehaviorApprover,
        weight: weight,
        period: Period.EVALUATION_2ND,
      },
    ]
  }, [eva1st, eva2nd, weight]);

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

      <CultureResultTable 
        index={index}
        form={form}
        hasChecker={hasChecker}
        period={period}
        weight={weight}
        data={data}
        permissions={permissions}
      />

      <div className="grid grid-cols-7 gap-4">
        <FormGenerator
          name={`cultures.${index}.actualOwner`}
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
              name={`cultures.${index}.fileUrl`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-secondary">Optional</FormLabel>
                  <FormControl>
                    <AttachButton
                      value={field.value as string | null}
                      canPerform={true}
                      onChange={field.onChange}
                      onRemove={() => deleteCultureFile({ id: eva1st!.id })}
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
          name={`cultures.${index}.actualChecker`}
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
          name={`cultures.${index}.actualApprover`}
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

          <Badge color="orange" label={formatDecimal(Number(form.watch(`cultures.${index}.levelBehaviorApprover`)))} />
        </div>
      </div>
    </div>
  );
};