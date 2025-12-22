"use client"

import { UseFormReturn, useWatch } from "react-hook-form";
import { kpiCategoies } from "../../constants";
import { useMemo, useRef } from "react";
import { FormGenerator } from "@/components/form-generator";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { KpiEvaluation as KPI, Period } from "@/generated/prisma/client";
import { CardInfo } from "@/components/card-info";
import { KpisEvaluation } from "../../schema/evaluation";
import { Action, Approval } from "@/modules/tasks/permissions";
import { formRecord } from "@/types/form";
import { Badge } from "@/components/badge";
import { TargetTable } from "./target-table";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { formatDecimal } from "@/lib/utils";
import { KpiAttachButton } from "./kpi-attach-button";

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
  finalSumWeight,
}: Props) => {
  const targetPopulated = useMemo(() => {
    const targets =
      year >= 2025
        ? [
            {
              id: "70",
              title: "< 80%",
              detail: kpi.target70,
            },
            {
              id: "80",
              title: "> 80% <= 90%",
              detail: kpi.target80,
            },
            {
              id: "90",
              title: "> 90% <= 100%",
              detail: kpi.target90,
            },
            {
              id: "100",
              title: "> 100% <= 110%",
              detail: kpi.target100,
            },
            ...(kpi.target120
              ? [
                  {
                    id: "120",
                    title: "> 110% <= 120%",
                    detail: kpi.target120,
                  },
                ]
              : []),
          ]
        : [
            {
              id: "70",
              title: "< 70%",
              detail: kpi.target70,
            },
            {
              id: "80",
              title: "> 70% <= 80%",
              detail: kpi.target80,
            },
            {
              id: "90",
              title: "> 80% <= 90%",
              detail: kpi.target90,
            },
            {
              id: "100",
              title: "> 90% <= 100%",
              detail: kpi.target100,
            },
          ]
    return targets
  }, [kpi.target70, kpi.target80, kpi.target90, kpi.target100, kpi.target120, year]);

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

  const values = useWatch({
    control: form.control,
    name: `kpis.${index}`,
  });

  const canPerformOwner = permissions.write && role === "owner";
  const canPerformChecker = permissions.write && role === "checker";
  const canPerformApprover = permissions.write && role === "approver";

  return (
      <div className="w-full relative z-80 flex flex-col gap-4">
        <div className="shrink-0 grow-0 self-start mt-0 size-10 flex justify-center items-center bg-marine rounded-full select-none">
          <div className="text-white text-xl font-semibold">
            {index + 1}
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <CardInfo label="Individual KPI" className="h-auto">
            <div className="relative w-auto flex items-center px-2.5 py-2">
              <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
                {kpiCategoies[kpi.category!]}
              </p>
            </div>
          </CardInfo>
          <CardInfo label="ตัวชี้วัดการดำเนินงานหลัก" className="h-auto">
            <div className="relative w-auto flex items-center px-2.5 py-2">
              <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
                {kpi.name}
              </p>
            </div>
          </CardInfo>
          <CardInfo label="ความหมายและสูตรคำนวณ" className="h-auto">
            <div className="relative w-auto flex items-center px-2.5 py-2">
              <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
                {kpi.definition}
              </p>
            </div>
          </CardInfo>
          <CardInfo label="แหล่งข้อมูลที่ใช้วัดผลลัพธ์" className="h-auto">
            <div className="relative w-auto flex items-center px-2.5 py-2">
              <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
                {kpi.method}
              </p>
            </div>
          </CardInfo>
          <CardInfo label="น้ำหนัก (%)" className="h-auto">
            <div className="relative w-auto flex items-center px-2.5 py-2">
              <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
                {kpi.weight.toString()}
              </p>
            </div>
          </CardInfo>
        </div>

        <div className="flex flex-col gap-2">
          <TargetTable
            weight={Number(kpi.weight)}
            targets={targetPopulated}
            index={index}
            form={form}
            hasChecker={hasChecker}
            year={year}
            canPerformOwner={canPerformOwner}
            canPerformChecker={canPerformChecker}
            canPerformApprover={canPerformApprover}
            achievementOwner={values.achievementOwner}
            achievementChecker={values.achievementChecker}
            achievementApprover={values.achievementApprover}
          />    
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
        </div>

        <div className="grid grid-cols-7 gap-4">
          <FormGenerator
            name={`kpis.${index}.actualOwner`}
            form={form}
            variant="bigText"
            disabled={!canPerformOwner}
            label="Owner"
            description="รายละเอียดของผลสำเร็จเพิ่มเติม (Detail of success result)"
            className={{
              ...formRecord.default,
              form: "grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#fcfcfc08] rounded-sm flex flex-col gap-2 col-span-2",
            }}
            textareaRef={(el) => {
              ownerActualRef.current = el;
              syncTextareaHeights();
            }}
            onInput={() => syncTextareaHeights()}
            fileUpload={
              <FormField 
                control={form.control}
                name={`kpis.${index}.fileUrl`}
                render={() => (
                  <FormItem>
                    <FormControl>
                      <KpiAttachButton
                        id={kpi.id}
                        formId={id}
                        period={period}
                        value={values.fileUrl}
                        canPerform={canPerformOwner}
                        onChange={(url) => form.setValue(`kpis.${index}.fileUrl`, url)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            }
          />
          <FormGenerator
            name={`kpis.${index}.actualChecker`}
            form={form}
            variant="bigText"
            disabled={!canPerformChecker}
            label="Checker"
            description="ความคิดเห็น (Comment)"
            className={{
              ...formRecord.default,
              form: "grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#fcfcfc08] rounded-sm flex flex-col gap-2 col-span-2",
            }}
            textareaRef={(el) => {
              checkerActualRef.current = el;
              syncTextareaHeights();
            }}
            onInput={() => syncTextareaHeights()}
          />
          <FormGenerator
            name={`kpis.${index}.actualApprover`}
            form={form}
            variant="bigText"
            disabled={!canPerformApprover}
            label="Approver"
            description="ความคิดเห็น (Comment)"
            className={{
              ...formRecord.default,
              form: "grow-0 shrink-0 basis-auto p-2 box-content h-max dark:bg-[#fcfcfc08] rounded-sm flex flex-col gap-2 col-span-2",
            }}
            textareaRef={(el) => {
              approverActualRef.current = el;
              syncTextareaHeights();
            }}
            onInput={() => syncTextareaHeights()}
          />
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-row">
              <div className="flex items-center leading-4.5 min-w-0 text-sm text-secondary">
                <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                  % ผลสำเร็จ
                </div>
              </div>
            </div>

            <Badge color="orange" label={formatDecimal(finalSumWeight)} />
          </div>
        </div>
      </div>
  );
};
