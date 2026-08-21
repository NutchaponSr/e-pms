"use client";

import { useEffect, useRef } from "react";
import { TargetIcon } from "lucide-react";
import { useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";

import { cn } from "@/lib/utils";

import { useTRPC } from "@/trpc/client";
import { formRecord } from "@/types/form";
import type { AppRouter } from "@/trpc/routers/_app";
import type { Period } from "@/generated/prisma/enums";
import type { inferProcedureOutput } from "@trpc/server";

import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

import { CardInfo } from "@/components/card-info";
import { FormGenerator } from "@/components/form-generator";
import { CommentSection } from "@/components/comment-section";

import { SelectCompetencyPopover } from "@/modules/merit/ui/components/select-competency-popover";

import { useCreateComment } from "@/modules/comments/api/use-create-comment";

import type { Action } from "@/modules/tasks/permissions";
import { getCompetencyTypesByRankAndOrder } from "@/modules/merit/utils";
import type { MeritDefinition } from "@/modules/merit/schemas/definition";


const EXPECTED_LEVELS = [1, 2, 3, 4, 5] as const;

const BEHAVIOR_FIELDS = [
  {
    name: "input",
    label: "การแสดงออกตามพฤติกรรมที่คาดหวัง",
    description: "Demonstration of Expected Behavior",
  },
  {
    name: "output",
    label: "โครงการ/กิจกรรมที่ใช้เป็นตัวประเมินการแสดงออกตามพฤติกรรมที่คาดหวัง",
    description: "Detail of demonstration of expected behavior",
  },
] as const;

const behaviorFieldClassName = {
  ...formRecord.blue,
  form: cn(
    formRecord.blue.form,
    "h-full min-h-24 lg:grid lg:grid-rows-[auto_1fr_auto]",
  ),
  input: cn(formRecord.blue.input, "min-h-24"),
  label: cn(formRecord.blue.label, "whitespace-normal overflow-visible"),
  description: "text-marine whitespace-normal overflow-visible leading-4",
};

interface Props {
  index: number;
  form: UseFormReturn<MeritDefinition>;
  competencyRecord: inferProcedureOutput<
    AppRouter["merit"]["getOne"]
  >["form"]["competencyRecords"][number];
  ownerRank: string;
  permissions: Record<Action, boolean>;
  period: Period;
  formId: string;
}

export const CompetencyDefinitionContent = ({
  index,
  form,
  competencyRecord,
  ownerRank,
  permissions,
  period,
  formId,
}: Props) => {
  const trpc = useTRPC();
  const allowedTypes = getCompetencyTypesByRankAndOrder(ownerRank, index);
  const createComment = useCreateComment();
  const canWrite = permissions.write;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const { groupSyncFunctions } = useSyncTextareaHeights([
    { refs: [inputRef, outputRef], breakpoint: "(min-width: 1024px)" },
  ]);
  const syncTextareaHeights = groupSyncFunctions[0];
  const textareaRefByField = {
    input: inputRef,
    output: outputRef,
  } as const;

  const selectedCompetencyId = useWatch({
    control: form.control,
    name: `competencies.${index}.competencyId`,
  });

  const { data: competencies } = useQuery(
    trpc.competency.getMany.queryOptions({ types: allowedTypes.types }),
  );

  const selectedCompetency =
    competencies?.find(
      (c) =>
        c.id ===
        (selectedCompetencyId ||
          competencyRecord.competencyId ||
          competencyRecord.competency?.id),
    ) ??
    competencyRecord.competency ??
    null;

  const definition = selectedCompetency?.definition || "";
  const inputValue = useWatch({
    control: form.control,
    name: `competencies.${index}.input`,
  });
  const outputValue = useWatch({
    control: form.control,
    name: `competencies.${index}.output`,
  });

  useEffect(() => {
    syncTextareaHeights();
  }, [inputValue, outputValue, syncTextareaHeights]);

  const expectedLevelText = {
    1: selectedCompetency?.t1,
    2: selectedCompetency?.t2,
    3: selectedCompetency?.t3,
    4: selectedCompetency?.t4,
    5: selectedCompetency?.t5,
  } as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-5 gap-2 min-w-0">
        <div className="flex items-start gap-2 col-span-4 min-w-0 overflow-hidden">
          <div className="shrink-0 grow-0 self-start mt-0 size-10 flex justify-center items-center bg-marine rounded-full select-none">
            <div className="text-white text-xl font-semibold">{index + 1}</div>
          </div>

          <FormField
            control={form.control}
            name={`competencies.${index}.competencyId`}
            render={({ field }) => (
              <FormItem className="min-w-0 grow overflow-hidden">
                <FormControl>
                  <SelectCompetencyPopover
                    perform={canWrite}
                    types={allowedTypes}
                    onSelect={(competency) => field.onChange(competency.id)}
                    selectedCompetencyId={
                      field.value ||
                      competencyRecord.competencyId ||
                      selectedCompetency?.id ||
                      undefined
                    }
                    value={
                      field.value ||
                      competencyRecord.competencyId ||
                      selectedCompetency?.id ||
                      ""
                    }
                    fallbackCompetency={competencyRecord.competency || null}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormGenerator
          name={`competencies.${index}.weight`}
          form={form}
          variant="numeric"
          disabled={!canWrite}
          label={`น้ำหนัก \n(Weight)`}
          className={{
            ...formRecord.blue,
            form: cn(formRecord.blue.form, "min-w-0"),
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-2">
        <CardInfo label="คำนิยาม (Definition)" variant="default">
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {definition}
            </p>
          </div>
        </CardInfo>
      </div>

      <div className="flex flex-col gap-2">
        <div className="py-0.5 text-sm leading-4.5 text-secondary flex flex-row items-center font-medium gap-1 ms-1.5">
          <TargetIcon className="size-4 shrink-0 block text-secondary" />
          พฤติกรรมที่คาดหวัง (Expected Level)
        </div>
        <FormField
          control={form.control}
          name={`competencies.${index}.expectedLevel`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="grid md:grid-cols-5 grid-cols-1 gap-2 overflow-hidden items-stretch">
                  {EXPECTED_LEVELS.map((level) => (
                    <ExpectedLevelButton
                      key={level}
                      level={level}
                      selected={field.value === level}
                      disabled={!canWrite}
                      text={expectedLevelText[level]}
                      onSelect={() => field.onChange(level)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {BEHAVIOR_FIELDS.map((behaviorField) => (
          <FormGenerator
            key={behaviorField.name}
            name={`competencies.${index}.${behaviorField.name}`}
            form={form}
            variant="bigText"
            disabled={!canWrite}
            label={behaviorField.label}
            description={behaviorField.description}
            className={behaviorFieldClassName}
            isError={
              !!form.formState.errors.competencies?.[index]?.[
                behaviorField.name
              ]
            }
            textareaRef={(el) => {
              textareaRefByField[behaviorField.name].current = el;
              syncTextareaHeights();
            }}
            onInput={syncTextareaHeights}
          />
        ))}
      </div>

      <Separator />
      <CommentSection
        permissions={permissions}
        comments={competencyRecord.comments}
        onCreate={(content) => {
          createComment({
            connectId: competencyRecord.id,
            content,
            period,
            formId,
          });
        }}
      />
    </div>
  );
};

function ExpectedLevelButton({
  level,
  selected,
  disabled,
  text,
  onSelect,
}: {
  level: (typeof EXPECTED_LEVELS)[number];
  selected: boolean;
  disabled: boolean;
  text?: string | null;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="text-left cursor-pointer disabled:pointer-events-none disabled:cursor-default h-full min-h-0 w-full bg-transparent p-0 border-0"
    >
      <CardInfo
        label={`Level ${level}`}
        variant={selected ? "default" : "gray"}
      >
        <div className="relative w-auto h-full px-2.5 py-2">
          <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
            {text}
          </p>
        </div>
      </CardInfo>
    </button>
  );
}
