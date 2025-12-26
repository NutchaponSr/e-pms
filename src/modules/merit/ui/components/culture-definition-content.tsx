import { inferProcedureOutput } from "@trpc/server";
import { UseFormReturn } from "react-hook-form";
import { MeritDefinition } from "@/modules/merit/schemas/definition";
import { AppRouter } from "@/trpc/routers/_app";
import { FormGenerator } from "@/components/form-generator";
import { formRecord } from "@/types/form";
import { Separator } from "@/components/ui/separator";
import { CommentSection } from "@/components/comment-section";
import { Action } from "@/modules/tasks/permissions";
import { useCreateComment } from "@/modules/comments/api/use-create-comment";
import { Period } from "@/generated/prisma/enums";
import { useRef } from "react";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { CardInfo } from "@/components/card-info";
import { formatDecimal } from "@/lib/utils";

interface Props {
  index: number;
  period: Period;
  formId: string;
  form: UseFormReturn<MeritDefinition>;
  cultureRecord: inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"]["cultureRecords"][number];
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

  const evidenceRef = useRef<HTMLTextAreaElement>(null);

  const { groupSyncFunctions } = useSyncTextareaHeights([
    {
      refs: [evidenceRef],
      breakpoint: "(min-width: 1024px)",
    },
  ]);

  const syncTextareaHeights = groupSyncFunctions[0];

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

      <div className="grid grid-cols-3 gap-2">
        <FormGenerator 
          name={`cultures.${index}.evidence`}
          form={form}
          variant="bigText"
          disabled={!permissions.write}
          label="Evidence"
          className={{
            ...formRecord.blue,
            form: "col-span-2 grow-0 shrink-0 basis-auto p-2 box-content h-max bg-[#0080d50c] dark:bg-[#298bfd10] rounded-sm flex flex-col gap-2",
          }}
          textareaRef={(el) => {
            evidenceRef.current = el;
            syncTextareaHeights();
          }}
          onInput={() => syncTextareaHeights()}
        />
        <CardInfo label="Weight" variant="default">
          <div className="relative w-auto flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6">
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
          })
        }} 
      />
    </div>
  );
};