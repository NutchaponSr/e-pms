import type { inferProcedureOutput } from "@trpc/server";
import { type ReactNode, useRef } from "react";
import { type UseFormReturn, useFormState } from "react-hook-form";
import { AttachButton } from "@/components/attach-button";
import { CardInfo } from "@/components/card-info";
import { FormGenerator } from "@/components/form-generator";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Period } from "@/generated/prisma/enums";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { cn, formatDecimal } from "@/lib/utils";
import type { AppRouter } from "@/trpc/routers/_app";
import { formRecord } from "@/types/form";
import { useDeleteCultureFile } from "../../api/use-delete-culture-file";
import { useSyncCultureAttach } from "../../api/use-sync-culture-attach";
import { COMPETENCY_ACTUAL_MAX_LENGTH } from "../../constant";
import type { MeritEvaluation } from "../../schemas/evaluation";

interface Props {
  index: number;
  period: Period;
  cultureRecord: inferProcedureOutput<
    AppRouter["merit"]["getOne"]
  >["form"]["cultureRecords"][number];
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

type CultureEvaluation = Props["cultureRecord"]["cultureEvaluations"][number];

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
  const { mutation: syncCultureAttach } = useSyncCultureAttach(formId, period);

  const eva1st = cultureRecord.cultureEvaluations.find(
    (eva) => eva.period === Period.EVALUATION_1ST,
  );
  const currentEvaluation = cultureRecord.cultureEvaluations.find(
    (evaluation) => evaluation.period === period,
  );

  const isYearEnd = period === Period.EVALUATION_2ND;
  const beliefs = Array.isArray(cultureRecord.culture?.belief)
    ? cultureRecord.culture.belief.map(String)
    : [];

  const ownerActualRef = useRef<HTMLTextAreaElement | null>(null);

  const textareaRefs = [ownerActualRef];

  const { groupSyncFunctions } = useSyncTextareaHeights([
    {
      refs: textareaRefs,
      breakpoint: "(min-width: 1024px)",
    },
  ]);

  const syncTextareaHeights = groupSyncFunctions[0];

  const evaluationSectionTitle =
    period === Period.EVALUATION_1ST
      ? "Mid-year Evaluation"
      : "Year-end Evaluation";

  const evaluationGridClass = cn(
    "grid grid-cols-1 gap-2",
    hasChecker
      ? "lg:grid-cols-3 lg:items-stretch"
      : "lg:grid-cols-2 lg:items-stretch",
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
  const midYearColumnClass =
    "flex flex-col gap-2 min-h-0 min-w-0 h-full p-2 bg-[#42230308] dark:bg-[#fcfcfc08] rounded-sm";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center grow gap-2 min-w-0">
          <div className="shrink-0 grow-0 self-start mt-0 size-10 flex justify-center items-center bg-marine rounded-full select-none">
            <div className="text-white text-xl font-semibold">
              {cultureRecord.culture.code}
            </div>
          </div>

          <div className="flex flex-col min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
            <div className="text-base leading-5 whitespace-nowrap overflow-hidden text-ellipsis font-medium">
              {cultureRecord.culture.name}
            </div>
            <div className="text-sm leading-5 whitespace-nowrap overflow-hidden text-ellipsis text-secondary">
              {cultureRecord.culture.description}
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 shrink-0 bg-[#0080d51c] dark:bg-[#298bfd10] p-2 rounded-sm">
          <h4 className="text-sm text-marine">น้ำหนัก (%)</h4>
          <p className="text-sm shadow-[0_4px_12px_0_rgba(25,25,25,0.029),0_1px_2px_0_rgba(25,25,25,0.019),0_0_0_1px_rgba(0,124,215,0.094)] dark:shadow-[0_4px_12px_0_rgba(25,25,25,0.4),0_0_0_1px_rgba(71,157,255,0.173)] bg-background py-1 px-2 rounded">
            {formatDecimal(weight)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <CardInfo
          label="พฤติกรรมที่คาดหวัง (Key Behavior)"
          variant="default"
          className="h-auto"
        >
          <div className="relative w-auto flex items-center px-2.5 py-2">
            {beliefs.length > 0 ? (
              <ul className="max-w-full w-full grow list-disc list-inside text-sm leading-normal min-h-6 text-primary">
                {beliefs.map((item) => (
                  <li className="text-primary" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="max-w-full w-full grow text-sm leading-normal min-h-6 text-primary">
                -
              </p>
            )}
          </div>
        </CardInfo>
        <CardInfo
          label="แนวทางในการประเมิน (Key Evidence)"
          variant="default"
          className="h-auto"
        >
          <div className="relative w-full flex items-center px-2.5 py-2">
            <p className="max-w-full w-auto whitespace-pre-wrap [word-break:break-word] grow text-sm leading-normal min-h-6 text-primary">
              {cultureRecord.evidence}
            </p>
          </div>
        </CardInfo>
      </div>

      {isYearEnd && (
        <MidYearEvaluationSection
          evaluation={eva1st}
          hasChecker={hasChecker}
          evaluationGridClass={evaluationGridClass}
          evaluationColumnClass={midYearColumnClass}
        />
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-marine">
          {evaluationSectionTitle}
        </h2>
        <div className={evaluationGridClass}>
          <div className={evaluationColumnClass}>
            <FormGenerator
              name={`cultures.${index}.actualOwner`}
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
                  name={`cultures.${index}.fileUrl`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between gap-0.5 text-xs text-marine whitespace-normal">
                        <span>
                          ข้อมูล/หลักฐานการประเมิน (Evident Data/Evidence)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <AttachButton
                          value={field.value as string | null}
                          canPerform={permissions.canPerformOwner}
                          onChange={field.onChange}
                          onUpload={(url) => {
                            if (currentEvaluation) {
                              syncCultureAttach({
                                id: currentEvaluation.id,
                                fileUrl: url,
                              });
                            }
                          }}
                          onRemove={() => {
                            if (currentEvaluation) {
                              deleteCultureFile({ id: currentEvaluation.id });
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              }
            />
            <EvaluationResultField
              form={form}
              name={`cultures.${index}.levelBehaviorOwner`}
              disabled={!permissions.canPerformOwner}
              displayLevel={currentEvaluation?.levelBehaviorOwner}
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
                maxLength={COMPETENCY_ACTUAL_MAX_LENGTH}
                fillHeight
                className={fillHeightFormClass}
              />
              <EvaluationResultField
                form={form}
                name={`cultures.${index}.levelBehaviorChecker`}
                disabled={!permissions.canPerformChecker}
                displayLevel={currentEvaluation?.levelBehaviorChecker}
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
              maxLength={COMPETENCY_ACTUAL_MAX_LENGTH}
              fillHeight
              className={fillHeightFormClass}
            />
            <EvaluationResultField
              form={form}
              name={`cultures.${index}.levelBehaviorApprover`}
              disabled={!permissions.canPerformApprover}
              displayLevel={currentEvaluation?.levelBehaviorApprover}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface MidYearEvaluationSectionProps {
  evaluation: CultureEvaluation | undefined;
  hasChecker: boolean;
  evaluationGridClass: string;
  evaluationColumnClass: string;
}

const MidYearEvaluationSection = ({
  evaluation,
  hasChecker,
  evaluationGridClass,
  evaluationColumnClass,
}: MidYearEvaluationSectionProps) => {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-marine">Mid-year Evaluation</h2>
      <div className={evaluationGridClass}>
        <div className={evaluationColumnClass}>
          <ReadOnlyTextBlock
            label="พนักงาน (Employee)"
            description="ผลลัพธ์การแสดงออกตามพฤติกรรมที่คาดหวัง (Result)"
            value={evaluation?.actualOwner}
            fileUpload={
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-0.5 text-xs text-marine whitespace-normal">
                  <span>ข้อมูล/หลักฐานการประเมิน (Evident Data/Evidence)</span>
                </div>
                <AttachButton
                  value={evaluation?.fileUrl ?? null}
                  canPerform={false}
                  onChange={() => {}}
                  onRemove={() => {}}
                />
              </div>
            }
          />
          <ReadOnlyResultField level={evaluation?.levelBehaviorOwner} />
        </div>

        {hasChecker && (
          <div className={evaluationColumnClass}>
            <ReadOnlyTextBlock
              label="ผู้ประเมินลำดับที่ 1 (Evaluator 1)"
              description="ความคิดเห็น (Comment)"
              value={evaluation?.actualChecker}
              fillHeight
            />
            <ReadOnlyResultField level={evaluation?.levelBehaviorChecker} />
          </div>
        )}

        <div className={evaluationColumnClass}>
          <ReadOnlyTextBlock
            label="ผู้ประเมินลำดับที่ 2 (Evaluator 2)"
            description="ความคิดเห็น (Comment)"
            value={evaluation?.actualApprover}
            fillHeight
          />
          <ReadOnlyResultField level={evaluation?.levelBehaviorApprover} />
        </div>
      </div>
    </div>
  );
};

interface ReadOnlyTextBlockProps {
  label: string;
  description: string;
  value: string | null | undefined;
  fillHeight?: boolean;
  fileUpload?: ReactNode;
}

const ReadOnlyTextBlock = ({
  label,
  description,
  value,
  fillHeight,
  fileUpload,
}: ReadOnlyTextBlockProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 min-h-0 bg-transparent p-0 h-auto",
        fillHeight && "lg:flex-1 lg:min-h-0",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={formRecord.blue.label}>{label}</span>
      </div>
      <span className="text-xs text-secondary">{description}</span>
      <p
        className={cn(
          formRecord.default.input,
          "whitespace-pre-wrap [word-break:break-word]",
          fillHeight && "lg:min-h-10 lg:flex-1",
        )}
      >
        {value?.trim() ? value : "-"}
      </p>
      {fileUpload}
    </div>
  );
};

const formatScore = (level: number | null | undefined, empty = "") =>
  level != null ? `${level}` : empty;

const ReadOnlyResultField = ({
  level,
}: {
  level: number | null | undefined;
}) => {
  return (
    <div className="flex flex-col gap-2 mt-auto pt-1">
      <span className="text-sm font-medium shrink-0 text-marine">
        ผลการประเมิน (Evaluation)
      </span>
      <p
        className={cn(
          formRecord.default.input,
          "min-h-10 flex items-center justify-end px-2.5",
        )}
      >
        {formatScore(level, "-")}
      </p>
    </div>
  );
};

interface EvaluationResultFieldProps {
  form: UseFormReturn<MeritEvaluation>;
  name: `cultures.${number}.${"levelBehaviorOwner" | "levelBehaviorChecker" | "levelBehaviorApprover"}`;
  disabled: boolean;
  displayLevel: number | null | undefined;
}

const CLEAR_LEVEL_VALUE = "__none__";

const EvaluationResultField = ({
  form,
  name,
  disabled,
  displayLevel,
}: EvaluationResultFieldProps) => {
  const formState = useFormState({ control: form.control });
  const hasError = Boolean(form.getFieldState(name, formState).error);

  const resolveLevel = (fieldValue: unknown) => {
    const value =
      fieldValue != null && fieldValue !== "" ? Number(fieldValue) : null;
    if (value != null && !Number.isNaN(value)) return value;
    return displayLevel ?? null;
  };

  return (
    <div className="flex flex-col gap-2 mt-auto pt-1">
      <span
        className={cn(
          "text-sm font-medium shrink-0",
          hasError ? "text-destructive" : "text-marine",
        )}
      >
        ผลการประเมิน (Evaluation)
      </span>

      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            {disabled ? (
              <p
                className={cn(
                  formRecord.blue.input,
                  "min-h-10 flex items-center justify-end px-2.5",
                )}
              >
                {formatScore(resolveLevel(field.value))}
              </p>
            ) : (
              <Select
                value={
                  field.value != null ? String(field.value) : CLEAR_LEVEL_VALUE
                }
                onValueChange={(value) => {
                  field.onChange(
                    value === CLEAR_LEVEL_VALUE ? null : Number(value),
                  );
                  void form.trigger(name);
                }}
              >
                <FormControl>
                  <SelectTrigger
                    className={cn(
                      formRecord.blue.input,
                      "w-full min-h-10 h-10",
                    )}
                  >
                    <SelectValue placeholder="เลือกระดับความสำเร็จ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    value={CLEAR_LEVEL_VALUE}
                    className="text-secondary"
                  >
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
  );
};
