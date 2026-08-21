"use client";

import { useEffect, useRef } from "react";
import { useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import { cn, formatDecimal } from "@/lib/utils";

import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";

import { formRecord } from "@/types/form";
import type { AppRouter } from "@/trpc/routers/_app";
import type { Period } from "@/generated/prisma/enums";
import type { inferProcedureOutput } from "@trpc/server";

import { Separator } from "@/components/ui/separator";

import { CardInfo } from "@/components/card-info";
import { FormGenerator } from "@/components/form-generator";
import { CommentSection } from "@/components/comment-section";

import { useCreateComment } from "@/modules/comments/api/use-create-comment";

import type { Action } from "@/modules/tasks/permissions";
import type { MeritDefinition } from "@/modules/merit/schemas/definition";

const evidenceFieldClassName = {
  ...formRecord.blue,
  form: cn(
    formRecord.blue.form,
    "col-span-2 h-full min-h-0 lg:grid lg:grid-rows-[auto_1fr_auto]",
  ),
  input: cn(formRecord.blue.input, "min-h-20"),
  label: cn(formRecord.blue.label, "whitespace-normal overflow-visible"),
};

interface Props {
  index: number;
  period: Period;
  formId: string;
  form: UseFormReturn<MeritDefinition>;
  cultureRecord: inferProcedureOutput<
    AppRouter["merit"]["getOne"]
  >["form"]["cultureRecords"][number];
  ownerRank: string;
  permissions: Record<Action, boolean>;
  weight: number;
}

export const CultureDefinitionContent = ({
  index,
  form,
  period,
  formId,
  weight,
  cultureRecord,
  permissions,
}: Props) => {
  const createComment = useCreateComment();
  const canWrite = permissions.write;
  const evidenceRef = useRef<HTMLTextAreaElement>(null);
  const { groupSyncFunctions } = useSyncTextareaHeights([
    { refs: [evidenceRef], breakpoint: "(min-width: 1024px)" },
  ]);
  const syncTextareaHeights = groupSyncFunctions[0];

  const evidenceValue = useWatch({
    control: form.control,
    name: `cultures.${index}.evidence`,
  });

  useEffect(() => {
    syncTextareaHeights();
  }, [evidenceValue, syncTextareaHeights]);

  const { name, description, code, belief } = cultureRecord.culture;
  const beliefs = Array.isArray(belief) ? belief.map(String) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 min-w-0 overflow-hidden">
        <div className="shrink-0 size-10 flex justify-center items-center bg-marine rounded-full select-none">
          <div className="text-white text-xl font-semibold">{code}</div>
        </div>

        <div className="flex min-w-0 flex-col overflow-hidden">
          <div className="truncate text-base font-medium leading-5">{name}</div>
          <div className="truncate text-sm leading-4 text-secondary">
            {description}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 items-stretch min-w-0">
        <CardInfo
          label="พฤติกรรมที่คาดหวัง (Expected Behavior)"
          variant="default"
          className="col-span-2 min-w-0"
        >
          <div className="relative flex h-full items-start px-2.5 py-2">
            {beliefs.length > 0 ? (
              <ul className="max-w-full w-full grow list-disc list-inside text-sm leading-normal min-h-6 text-primary">
                {beliefs.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="max-w-full w-full grow text-sm leading-normal min-h-6 text-primary">
                -
              </p>
            )}
          </div>
        </CardInfo>

        <FormGenerator
          name={`cultures.${index}.evidence`}
          form={form}
          variant="bigText"
          disabled={!canWrite}
          label="แนวทางในการประเมิน (Key Evidence Guideline)"
          className={evidenceFieldClassName}
          textareaRef={(el) => {
            evidenceRef.current = el;
            syncTextareaHeights();
          }}
          onInput={syncTextareaHeights}
        />

        <CardInfo label="น้ำหนัก (Weight)" variant="default" className="min-w-0">
          <div className="relative flex h-full items-start px-2.5 py-2">
            <p className="max-w-full grow whitespace-pre-wrap [word-break:break-word] text-sm leading-normal min-h-6">
              {formatDecimal(weight)}
            </p>
          </div>
        </CardInfo>
      </div>

      <Separator />
      <CommentSection
        permissions={permissions}
        comments={cultureRecord.comments}
        onCreate={(content) => {
          createComment({
            connectId: cultureRecord.id,
            content,
            period,
            formId,
          });
        }}
      />
    </div>
  );
};
