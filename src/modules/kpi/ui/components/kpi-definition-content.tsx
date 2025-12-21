import * as React from "react";
import { KpiDefinition, KpiDefinitions } from "../../schema/definition";
import { UseFormReturn } from "react-hook-form";
import { kpiCategoies } from "../../constants";
import { MoreHorizontalIcon, TargetIcon } from "lucide-react";
import { CommentSection } from "@/components/comment-section";
import { Separator } from "@/components/ui/separator";
import { useCreateComment } from "@/modules/comments/api/use-create-comment";
import { Period } from "@/generated/prisma/enums";
import { CommentWithEmployee } from "@/modules/comments/types";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BsTrash3 } from "react-icons/bs";
import { useDeleteKpi } from "../../api/use-delete-kpi";
import { FormGenerator } from "@/components/form-generator";
import { formRecord } from "@/types/form";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { Action } from "@/modules/tasks/permissions";

interface Props {
  kpi: KpiDefinition;
  index: number;
  period: Period;
  formId: string;
  form: UseFormReturn<KpiDefinitions>;
  comments: CommentWithEmployee[];
  permissions: Record<Action, boolean>;
}

export const KpiDefinitionContent = ({ index, form, ...props }: Props) => {
  const createComment = useCreateComment();
  const deleteKpi = useDeleteKpi(props.formId, props.period);

  // Refs for textarea elements
  const objectiveRef = React.useRef<HTMLTextAreaElement | null>(null);
  const definitionRef = React.useRef<HTMLTextAreaElement | null>(null);
  const methodRef = React.useRef<HTMLTextAreaElement | null>(null);
  const target70Ref = React.useRef<HTMLTextAreaElement | null>(null);
  const target80Ref = React.useRef<HTMLTextAreaElement | null>(null);
  const target90Ref = React.useRef<HTMLTextAreaElement | null>(null);
  const target100Ref = React.useRef<HTMLTextAreaElement | null>(null);
  const target120Ref = React.useRef<HTMLTextAreaElement | null>(null);

  // Use hook to sync textarea heights
  const { groupSyncFunctions } = useSyncTextareaHeights([
    {
      refs: [objectiveRef, definitionRef, methodRef],
      breakpoint: "(min-width: 1024px)",
    },
    {
      refs: [target70Ref, target80Ref, target90Ref, target100Ref, target120Ref],
      breakpoint: "(min-width: 768px)",
    },
  ]);

  const syncTextareaHeights = groupSyncFunctions[0];
  const syncTargetTextareaHeights = groupSyncFunctions[1];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center grow gap-2"> 
        <div className="shrink-0 grow-0 self-start mt-0 size-10 flex justify-center items-center bg-marine rounded-full select-none">
          <div className="text-white text-xl font-semibold">
            {index + 1}
          </div>
        </div>
        <FormGenerator 
          name={`kpis.${index}.name`}
          form={form}
          variant="text"
          disabled={!props.permissions.write}
          placeholder="KPI's Name"
          className={{
            form: "grow",
            input: "max-w-full w-full whitespace-pre-wrap wrap-break-word p-0.5 -m-0.5 leading-9 overflow-hidden focus-visible:outline-none resize-none h-full field-sizing-content break-all text-2xl font-bold cursor-text",
          }}
        />
      </div>

      <div className="grid lg:grid-cols-4 grid-cols-2 gap-2 overflow-hidden">
        <FormGenerator 
          name={`kpis.${index}.category`}
          form={form}
          variant="selection"
          disabled={!props.permissions.write}
          label="Category"
          placeholder="Select a Category"
          className={formRecord.blue}
          selectOptions={Object.entries(kpiCategoies).map(([key, value]) => ({
            key,
            label: value,
          }))}
        />
        <FormGenerator 
          name={`kpis.${index}.weight`}
          form={form}
          variant="numeric"
          disabled={!props.permissions.write}
          label="Weight"
          className={formRecord.blue}
        />
        <FormGenerator 
          name={`kpis.${index}.strategy`}
          form={form}
          variant="text"
          disabled={!props.permissions.write}
          label="Strategy"
          className={formRecord.blue}
        />
        <FormGenerator 
          name={`kpis.${index}.type`}
          form={form}
          variant="selection"
          disabled={!props.permissions.write}
          label="Type"
          className={formRecord.blue}
          selectOptions={[{
            key: "improvement",
            label: "Improvement",
          }, {
            key: "project",
            label: "Project",
          }]}
          placeholder="Select a Type"
        />
      </div>

      <div className="grid lg:grid-cols-3 grid-cols-1 gap-2 overflow-hidden">
        <FormGenerator 
          name={`kpis.${index}.objective`}
          form={form}
          variant="bigText"
          disabled={!props.permissions.write}
          label="Objective"
          className={formRecord.blue}
          textareaRef={(el) => {
            objectiveRef.current = el;
            syncTextareaHeights();
          }}
          onInput={() => syncTextareaHeights()}
        />
        <FormGenerator 
          name={`kpis.${index}.definition`}
          form={form}
          variant="bigText"
          disabled={!props.permissions.write}
          label="Definition"
          className={formRecord.blue}
          textareaRef={(el) => {
            definitionRef.current = el;
            syncTextareaHeights();
          }}
          onInput={() => syncTextareaHeights()}
        />
        <FormGenerator 
          name={`kpis.${index}.method`}
          form={form}
          variant="bigText"
          disabled={!props.permissions.write}
          label="Method"
          className={formRecord.blue}
          textareaRef={(el) => {
            methodRef.current = el;
            syncTextareaHeights();
          }}
          onInput={() => syncTextareaHeights()}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="py-0.5 text-sm leading-4.5 text-secondary flex flex-row items-center font-medium gap-1 ms-1.5">
          <TargetIcon className="size-4 shrink-0 block text-secondary" />
          Target
        </div>
        <div className="grid md:grid-cols-5 grid-cols-1 gap-2 overflow-hidden">
          <FormGenerator 
            name={`kpis.${index}.target70`}
            form={form}
            variant="bigText"
            disabled={!props.permissions.write}
            label="Need Improve (<80%)"
            className={formRecord.default}
            textareaRef={(el) => {
              target70Ref.current = el;
              syncTargetTextareaHeights();
            }}
            onInput={() => syncTargetTextareaHeights()}
          />
          <FormGenerator 
            name={`kpis.${index}.target80`}
            form={form}
            variant="bigText"
            disabled={!props.permissions.write}
            label="Level 2 (90%)"
            className={formRecord.default}
            textareaRef={(el) => {
              target80Ref.current = el;
              syncTargetTextareaHeights();
            }}
            onInput={() => syncTargetTextareaHeights()}
          />
          <FormGenerator 
            name={`kpis.${index}.target90`}
            form={form}
            variant="bigText"
            disabled={!props.permissions.write}
            label="Meet expert (100%)"
            className={formRecord.default}
            textareaRef={(el) => {
              target90Ref.current = el;
              syncTargetTextareaHeights();
            }}
            onInput={() => syncTargetTextareaHeights()}
          />
          <FormGenerator 
            name={`kpis.${index}.target100`}
            form={form}
            variant="bigText"
            disabled={!props.permissions.write}
            label="Level 4 (110%)"
            className={formRecord.default}
            textareaRef={(el) => {
              target100Ref.current = el;
              syncTargetTextareaHeights();
            }}
            onInput={() => syncTargetTextareaHeights()}
          />
          <FormGenerator 
            name={`kpis.${index}.target120`}
            form={form}
            variant="bigText"
            disabled={!props.permissions.write}
            label="Outstand (120%)"
            className={formRecord.default}
            textareaRef={(el) => {
              target120Ref.current = el;
              syncTargetTextareaHeights();
            }}
            onInput={() => syncTargetTextareaHeights()}
          />
        </div>
      </div>
      <Separator />
      <CommentSection 
        permissions={props.permissions}
        comments={props.comments}
        onCreate={(content) => {
          createComment({ 
            connectId: props.kpi.id, 
            content, 
            period: props.period, 
            formId: props.formId 
          })
        }} 
      />

      <div data-show={props.permissions.write} className="absolute end-4 mt-0 transition group-hover/card:opacity-100 opacity-0 z-999 data-[show=false]:group-hover/card:opacity-0">
        <div className="flex items-center gap-0.5 bg-[#202020] dark:shadow-[0_0_0_1.25px_#383836,0px_4px_12px_-2px_#00000029] rounded-sm w-fit p-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="xsIcon" variant="ghost" type="button" className="text-tertiary hover:text-tertiary">
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={() => deleteKpi({ id: props.kpi.id })}>
                <BsTrash3 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
