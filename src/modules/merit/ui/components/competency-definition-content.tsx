"use client";

import { useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { inferProcedureOutput } from "@trpc/server";
import { UseFormReturn, useWatch } from "react-hook-form";

import { AppRouter } from "@/trpc/routers/_app";

import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

import { FormGenerator } from "@/components/form-generator";

import { MeritDefinition } from "@/modules/merit/schemas/definition";
import { SelectCompetencyPopover } from "./select-competency-popover";
import { getCompetencyTypesByRankAndOrder } from "@/modules/merit/utils";
import { CardInfo } from "@/components/card-info";
import { formRecord } from "@/types/form";
import { useTRPC } from "@/trpc/client";
import { TargetIcon } from "lucide-react";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { CommentSection } from "@/components/comment-section";
import { Separator } from "@/components/ui/separator";
import { Period } from "@/generated/prisma/enums";
import { Action } from "@/modules/tasks/permissions";
import { useCreateComment } from "@/modules/comments/api/use-create-comment";

interface Props {
  index: number;
  form: UseFormReturn<MeritDefinition>;
  competencyRecord: inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"]["competencyRecords"][number];
  ownerRank: string;
  permissions: Record<Action, boolean>;
  period: Period
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

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const { groupSyncFunctions } = useSyncTextareaHeights([
    {
      refs: [inputRef, outputRef],
      breakpoint: "(min-width: 1024px)",
    },
  ]);

  const syncTextareaHeights = groupSyncFunctions[0];

  const selectedCompetencyId = useWatch({
    control: form.control,
    name: `competencies.${index}.competencyId`,
  });

  const { data: competencies } = useQuery(
    trpc.competency.getMany.queryOptions({ types: allowedTypes.types })
  );

  const selectedCompetency = useMemo(() => {
    const idToFind = selectedCompetencyId || competencyRecord.competencyId || competencyRecord.competency?.id;
    if (idToFind && competencies) {
      const found = competencies.find(c => c.id === idToFind);
      if (found) return found;
    }
    return competencyRecord.competency || null;
  }, [selectedCompetencyId, competencyRecord.competencyId, competencyRecord.competency, competencies]);

  const definition = selectedCompetency?.definition || "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center grow gap-2"> 
        <div className="shrink-0 grow-0 self-start mt-0 size-10 flex justify-center items-center bg-marine rounded-full select-none">
          <div className="text-white text-xl font-semibold">
            {index + 1}
          </div>
        </div>
        
        <FormField 
          control={form.control}
          name={`competencies.${index}.competencyId`}
          render={({ field }) => (
            <FormItem className="grow">
              <FormControl>
                <SelectCompetencyPopover
                  perform={permissions.write}
                  types={allowedTypes}
                  onSelect={(competency) => field.onChange(competency.id)}
                    selectedCompetencyId={field.value || competencyRecord.competencyId || selectedCompetency?.id || undefined}
                    value={field.value || competencyRecord.competencyId || selectedCompetency?.id || ""}
                    fallbackCompetency={competencyRecord.competency || null}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <CardInfo label="Description" variant="default" className="col-span-2">
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {definition}
            </p>
          </div>
        </CardInfo>
        <FormGenerator 
          name={`competencies.${index}.weight`}
          form={form}
          variant="numeric"
          disabled={!permissions.write}
          label="Weight"
          className={formRecord.blue}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="py-0.5 text-sm leading-4.5 text-secondary flex flex-row items-center font-medium gap-1 ms-1.5">
          <TargetIcon className="size-4 shrink-0 block text-secondary" />
          Expected Level
        </div>
        <FormField
          control={form.control}
          name={`competencies.${index}.expectedLevel`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="grid md:grid-cols-5 grid-cols-1 gap-2 overflow-hidden">
                  <div
                    role="button"
                    onClick={() => field.onChange(1)}
                    data-disabled={!permissions.write}
                    className="text-left cursor-pointer data-[disabled=true]:pointer-events-none"
                  >
                    <CardInfo
                      label="Level 1"
                      variant={field.value === 1 ? "default" : "gray"}
                    >
                      <div className="relative w-auto h-full px-2.5 py-2">
                        <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
                          {selectedCompetency?.t1}
                        </p>
                      </div>
                    </CardInfo>
                  </div>

                  <div
                    role="button"
                    onClick={() => field.onChange(2)}
                    data-disabled={!permissions.write}
                    className="text-left cursor-pointer data-[disabled=true]:pointer-events-none"
                  >
                    <CardInfo
                      label="Level 2"
                      variant={field.value === 2 ? "default" : "gray"}
                    >
                      <div className="relative w-auto flex h-full px-2.5 py-2">
                        <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
                          {selectedCompetency?.t2}
                        </p>
                      </div>
                    </CardInfo>
                  </div>

                  <div
                    role="button"
                    onClick={() => field.onChange(3)}
                    data-disabled={!permissions.write}
                    className="text-left cursor-pointer data-[disabled=true]:pointer-events-none"
                  >
                    <CardInfo
                      label="Level 3"
                      variant={field.value === 3 ? "default" : "gray"}
                    >
                      <div className="relative w-auto h-full px-2.5 py-2">
                        <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
                          {selectedCompetency?.t3}
                        </p>
                      </div>
                    </CardInfo>
                  </div>

                  <div
                    role="button"
                    onClick={() => field.onChange(4)}
                    data-disabled={!permissions.write}
                    className="text-left cursor-pointer data-[disabled=true]:pointer-events-none"
                  >
                    <CardInfo
                      label="Level 4"
                      variant={field.value === 4 ? "default" : "gray"}
                    >
                      <div className="relative w-auto h-full px-2.5 py-2">
                        <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
                          {selectedCompetency?.t4}
                        </p>
                      </div>
                    </CardInfo>
                  </div>

                  <div  
                    role="button"
                    onClick={() => field.onChange(5)}
                    data-disabled={!permissions.write}
                    className="text-left cursor-pointer data-[disabled=true]:pointer-events-none"
                  >
                    <CardInfo
                      label="Level 5"
                      variant={field.value === 5 ? "default" : "gray"}
                    >
                      <div className="relative w-auto h-full px-2.5 py-2">
                        <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
                          {selectedCompetency?.t5}
                        </p>
                      </div>
                    </CardInfo>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid lg:grid-cols-2 grid-cols-1 gap-4">
        <FormGenerator 
          name={`competencies.${index}.input`}
          form={form}
          variant="bigText"
          disabled={!permissions.write}
          label="Input"
          className={formRecord.blue}
          textareaRef={(el) => {
            inputRef.current = el;
            syncTextareaHeights();
          }}
          onInput={() => syncTextareaHeights()}
        />
        <FormGenerator 
          name={`competencies.${index}.output`}
          form={form}
          variant="bigText"
          disabled={!permissions.write}
          label="Output"
          className={formRecord.blue}
          textareaRef={(el) => {
            outputRef.current = el;
            syncTextareaHeights();
          }}
          onInput={() => syncTextareaHeights()}
        />
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
          })
        }} 
      />
    </div>
  );
};