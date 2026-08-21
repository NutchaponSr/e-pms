"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AccordionContent } from "@radix-ui/react-accordion";
import type { inferProcedureOutput } from "@trpc/server";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { Resolver } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { BsTriangleFill } from "react-icons/bs";
import { toast } from "sonner";

import { Card } from "@/components/card";
import { EmployeeInfo } from "@/components/employee-info";
import { FormGenerator } from "@/components/form-generator";
import { Toolbar } from "@/components/toolbar";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import type { Employee, Task } from "@/generated/prisma/client";
import type { Period as PeriodType } from "@/generated/prisma/enums";
import { Period } from "@/generated/prisma/enums";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { cn } from "@/lib/utils";
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import type { Action, Approval } from "@/modules/tasks/permissions";
import { Confirmation } from "@/modules/tasks/ui/components/confirmation";
import type { AppRouter } from "@/trpc/routers/_app";
import { formRecord } from "@/types/form";

import { useEvaluateBulkMerit } from "../../api/use-evaluation-bulk-merit";
import {
  COMPETENCY_ACTUAL_MAX_LENGTH,
  competencyAchievementLevels,
  cultureLevels,
  MERIT_EVALUATION_PERIOD_LABELS,
} from "../../constant";
import type { MeritEvaluation } from "../../schemas/evaluation";
import { meritEvaluationsSchema } from "../../schemas/evaluation";
import {
  exportMeritDefinition,
  meritEvaluationsMap,
  sumCompetencyByPeriod,
  sumCultureByPeriod,
} from "../../utils";
import { CompetencyEvaluationContent } from "../components/competency-evaluation-content";
import { CultureEvaluationContent } from "../components/culture-evaluation-content";
import { MeritEvaluationCriteriaGuide } from "../components/merit-evaluation-criteria-guide";
import { MeritEvaluationSummaryTable } from "../components/merit-evaluation-summary-table";

const CULTURE_TOTAL_WEIGHT = 30;

const BLUE_FORM_CLASS = {
  input: formRecord.blue.input,
  label: formRecord.blue.label,
  description: "text-xs text-secondary",
  form: "flex flex-col gap-2 flex-1 min-h-0 bg-transparent p-0 h-auto",
};

const FILL_HEIGHT_FORM_CLASS = {
  ...BLUE_FORM_CLASS,
  form: cn(BLUE_FORM_CLASS.form, "lg:flex-1 lg:min-h-0"),
  input: cn(BLUE_FORM_CLASS.input, "lg:min-h-10"),
};

const EVALUATION_COLUMN_CLASS =
  "flex flex-col gap-2 min-h-0 min-w-0 h-full p-2 bg-[#0080d51c] dark:bg-[#298bfd10] rounded-sm";
const MID_YEAR_COLUMN_CLASS =
  "flex flex-col gap-2 min-h-0 min-w-0 h-full p-2 bg-[#42230308] dark:bg-[#fcfcfc08] rounded-sm";

const OVERALL_COMMENT_SCROLL_AREA_CLASS_NAME = "lg:flex-1 lg:min-h-48 w-full";

const OVERALL_COMMENT_FIELDS = [
  {
    role: "owner" as const,
    name: "overallComments.commentOwner" as const,
    label: "พนักงาน (Employee)",
    midYearKey: "commentOwner" as const,
  },
  {
    role: "checker" as const,
    name: "overallComments.commentChecker" as const,
    label: "ผู้ประเมินลำดับที่ 1 (Evaluator 1)",
    midYearKey: "commentChecker" as const,
  },
  {
    role: "approver" as const,
    name: "overallComments.commentApprover" as const,
    label: "ผู้ประเมินลำดับที่ 2 (Evaluator 2)",
    midYearKey: "commentApprover" as const,
  },
];

interface Props {
  id: string;
  period: PeriodType;
  role: Approval;
  hasChecker: boolean;
  data: inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"];
  permissions: Record<Action, boolean>;
}

type MeritForm = Props["data"];
type OverallComment = NonNullable<MeritForm["overallComments"]>[number];

function subscribeToDocument() {
  return () => {};
}

function getDocumentBody() {
  return document.body;
}

function getServerDocumentBody(): HTMLElement | null {
  return null;
}

function evaluationGridClass(hasChecker: boolean) {
  return cn(
    "grid grid-cols-1 gap-2",
    hasChecker
      ? "lg:grid-cols-3 lg:items-stretch"
      : "lg:grid-cols-2 lg:items-stretch",
  );
}

function toEvaluationPayload(values: MeritEvaluation, saved: boolean) {
  const {
    requireEvaluationResults: _requireEvaluationResults,
    ...evaluationValues
  } = values;
  return { ...evaluationValues, saved };
}

function weightedScore(achievement: unknown, weight: number, maxLevel = 5) {
  return (Number(achievement ?? 0) / maxLevel) * weight;
}

function computeLiveScores(
  competencies: MeritEvaluation["competencies"] | undefined,
  cultures: MeritEvaluation["cultures"] | undefined,
  competencyRecords: MeritForm["competencyRecords"],
  cultureCount: number,
) {
  const competencyFull = competencyRecords.reduce(
    (acc, record) => acc + Number(record.weight ?? 0),
    0,
  );
  const cultureWeight =
    cultureCount === 0 ? 0 : CULTURE_TOTAL_WEIGHT / cultureCount;

  const competencyByRole = (
    key: "achievementOwner" | "achievementChecker" | "achievementApprover",
  ) =>
    competencies?.reduce((acc, competency, index) => {
      const weight = Number(competencyRecords[index]?.weight ?? 0);
      return acc + weightedScore(competency?.[key], weight);
    }, 0) ?? 0;

  const cultureByRole = (
    key:
      | "levelBehaviorOwner"
      | "levelBehaviorChecker"
      | "levelBehaviorApprover",
  ) =>
    cultures?.reduce(
      (acc, culture) => acc + weightedScore(culture?.[key], cultureWeight),
      0,
    ) ?? 0;

  return {
    competencyFull,
    cultureFull: CULTURE_TOTAL_WEIGHT,
    owner: {
      competency: competencyByRole("achievementOwner"),
      culture: cultureByRole("levelBehaviorOwner"),
    },
    checker: {
      competency: competencyByRole("achievementChecker"),
      culture: cultureByRole("levelBehaviorChecker"),
    },
    approver: {
      competency: competencyByRole("achievementApprover"),
      culture: cultureByRole("levelBehaviorApprover"),
    },
  };
}

export const MeritEvaluationScreen = ({
  id,
  period,
  data,
  permissions,
  role,
  hasChecker,
}: Props) => {
  const sortedCompetencyRecords = [...data.competencyRecords].sort(
    (a, b) => a.order - b.order,
  );
  const sortedCultureRecords = [...data.cultureRecords].sort(
    (a, b) => a.order - b.order,
  );
  const evaluations = meritEvaluationsMap(data, period, role);

  const startWorkflow = useStartWorkflow(id, period);
  const { mutation: evaluateBulkMerit, mutationAsync: evaluateBulkMeritAsync } =
    useEvaluateBulkMerit(id, period);
  const portalTarget = useSyncExternalStore(
    subscribeToDocument,
    getDocumentBody,
    getServerDocumentBody,
  );

  const form = useForm<MeritEvaluation>({
    resolver: zodResolver(meritEvaluationsSchema) as Resolver<MeritEvaluation>,
    defaultValues: evaluations,
    reValidateMode: "onChange",
  });

  const revalidateOverallComments = () => {
    void form.trigger([
      "overallComments.commentOwner",
      "overallComments.commentChecker",
      "overallComments.commentApprover",
    ]);
  };

  useEffect(() => {
    if (!data) return;

    form.reset(meritEvaluationsMap(data, period, role), {
      keepDirtyValues: true,
      keepTouched: false,
    });
  }, [data, form, period, role]);

  const submitEvaluation = (values: MeritEvaluation, saved: boolean) => {
    evaluateBulkMerit({
      formId: id,
      period,
      ...toEvaluationPayload(values, saved),
    });
  };

  const submitEvaluationAsync = async (
    values: MeritEvaluation,
    saved: boolean,
  ) => {
    await evaluateBulkMeritAsync({
      formId: id,
      period,
      ...toEvaluationPayload(values, saved),
    });
  };

  const onSubmit = (values: MeritEvaluation) => {
    submitEvaluation(values, true);
  };

  const competencies = useWatch({
    control: form.control,
    name: "competencies",
  });

  const cultures = useWatch({
    control: form.control,
    name: "cultures",
  });

  const scores = computeLiveScores(
    competencies,
    cultures,
    sortedCompetencyRecords,
    sortedCultureRecords.length,
  );

  const midYearOverall = {
    competency: sumCompetencyByPeriod(
      sortedCompetencyRecords,
      Period.EVALUATION_1ST,
      "levelOwner",
    ),
    culture: sumCultureByPeriod(
      sortedCultureRecords,
      Period.EVALUATION_1ST,
      "levelBehaviorOwner",
    ),
  };

  const rolePermissions = {
    canPerformOwner: permissions.write && role === "owner",
    canPerformChecker: permissions.write && role === "checker",
    canPerformApprover: permissions.write && role === "approver",
  };

  const validateThenSave = async (errorMessage: string, saved: boolean) => {
    form.setValue("requireEvaluationResults", true);
    const ok = await form.trigger();
    form.setValue("requireEvaluationResults", false);

    if (!ok) {
      toast.error(errorMessage);
      return false;
    }

    const values = form.getValues();
    await submitEvaluationAsync(values, saved);
    form.reset(values);
    return true;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <EmployeeInfo
          owner={data.tasks?.owner}
          checker={data.tasks?.checker}
          approver={data.tasks?.approver}
        >
          <MeritEvaluationSummaryTable
            period={period}
            hasChecker={hasChecker}
            competencyFull={scores.competencyFull}
            cultureFull={scores.cultureFull}
            scores={{
              owner: scores.owner,
              checker: scores.checker,
              approver: scores.approver,
            }}
            midYearOverall={
              period === Period.EVALUATION_2ND ? midYearOverall : undefined
            }
          />
        </EmployeeInfo>

        <Toolbar
          onWorkflow={async () => {
            const ok = await validateThenSave(
              "Please fix validation errors before starting the workflow",
              true,
            );
            if (!ok) return;
            startWorkflow({ id: data.tasks.id });
          }}
          onExport={async () => {
            await exportMeritDefinition({
              ...data,
              competencyRecords: data.competencyRecords,
              cultureRecords: data.cultureRecords,
              employee: data.tasks?.owner,
              task: data.tasks as Task & {
                checker?: Employee;
                approver: Employee;
              },
            });
          }}
          onSaveDraft={async () => {
            const values = form.getValues();
            await submitEvaluationAsync(values, false);
            form.reset(values);
          }}
          permissions={permissions}
          status={STATUS_VARIANTS[data.tasks.status]}
        />

        <div className="px-3 mx-auto w-full flex flex-col justify-start grow pb-45">
          <Accordion
            defaultValue={["competency", "culture", "overall-comments"]}
            type="multiple"
            className="space-y-4"
          >
            <CompetencyEvaluationSection
              records={sortedCompetencyRecords}
              period={period}
              form={form}
              permissions={rolePermissions}
              hasChecker={hasChecker}
              formId={id}
            />
            <CultureEvaluationSection
              records={sortedCultureRecords}
              period={period}
              form={form}
              permissions={rolePermissions}
              hasChecker={hasChecker}
              formId={id}
            />
            <OverallCommentsSection
              form={form}
              period={period}
              hasChecker={hasChecker}
              role={role}
              write={permissions.write}
              overallComments={data.overallComments}
              revalidateOverallComments={revalidateOverallComments}
            />
          </Accordion>
        </div>

        {permissions.approve &&
          portalTarget &&
          createPortal(
            <Confirmation
              id={id}
              app="Merit"
              taskId={data.tasks.id}
              period={period}
              confirmTitle="Confirm Merit Evaluation"
              onSave={() =>
                validateThenSave(
                  "Please fix validation errors before confirming",
                  false,
                )
              }
            />,
            portalTarget,
          )}
      </form>
    </Form>
  );
};

function EvaluationAccordionHeader({ title }: { title: string }) {
  return (
    <div className="h-10.5 z-87 relative text-sm">
      <div className="flex items-center h-full pt-0 mb-2">
        <div className="flex items-center h-full overflow-hidden gap-1">
          <AccordionTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="xsIcon"
              className="group rounded"
            >
              <BsTriangleFill className="text-primary rotate-90 size-3 transition-transform group-data-[state=open]:rotate-180" />
            </Button>
          </AccordionTrigger>
          <h2 className="text-primary text-lg font-semibold">{title}</h2>
        </div>
      </div>
    </div>
  );
}

function CompetencyEvaluationSection({
  records,
  period,
  form,
  permissions,
  hasChecker,
  formId,
}: {
  records: MeritForm["competencyRecords"];
  period: PeriodType;
  form: ReturnType<typeof useForm<MeritEvaluation>>;
  permissions: {
    canPerformOwner: boolean;
    canPerformChecker: boolean;
    canPerformApprover: boolean;
  };
  hasChecker: boolean;
  formId: string;
}) {
  return (
    <AccordionItem value="competency">
      <EvaluationAccordionHeader title="สมรรถนะ (Competency)" />
      <AccordionContent>
        <MeritEvaluationCriteriaGuide
          description="พิจารณาจากการแสดงออกตามพฤติกรรมที่คาดหวัง (Demonstration of Expectation Behavior) กับผลลัพธ์ของโครงการ กิจกรรมที่ใช้เป็นตัวประเมินการแสดงออกตามพฤติกรรมที่คาดหวัง (Project/Activities Demonstrating Expected Behavior)"
          levels={competencyAchievementLevels}
        />
        <div className="grid grid-cols-1 gap-y-6">
          {records.map((competencyRecord, index) => (
            <Card key={competencyRecord.id}>
              <CompetencyEvaluationContent
                index={index}
                period={period}
                competencyRecord={competencyRecord}
                form={form}
                permissions={permissions}
                hasChecker={hasChecker}
                formId={formId}
              />
            </Card>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function CultureEvaluationSection({
  records,
  period,
  form,
  permissions,
  hasChecker,
  formId,
}: {
  records: MeritForm["cultureRecords"];
  period: PeriodType;
  form: ReturnType<typeof useForm<MeritEvaluation>>;
  permissions: {
    canPerformOwner: boolean;
    canPerformChecker: boolean;
    canPerformApprover: boolean;
  };
  hasChecker: boolean;
  formId: string;
}) {
  const cultureWeight =
    records.length === 0 ? 0 : CULTURE_TOTAL_WEIGHT / records.length;

  return (
    <AccordionItem value="culture">
      <EvaluationAccordionHeader title="วัฒนธรรม (Culture)" />
      <AccordionContent>
        <MeritEvaluationCriteriaGuide
          description="พิจารณาจากการแสดงออกตามพฤติกรรมที่คาดหวัง ตามแนวทางในการประเมิน (Key Evidence Guideline) ที่กาหนดโดย N-1 ของแต่ละสายงาน"
          levels={cultureLevels}
        />
        <div className="grid grid-cols-1 gap-y-6">
          {records.map((cultureRecord, index) => (
            <Card key={cultureRecord.id}>
              <CultureEvaluationContent
                index={index}
                period={period}
                cultureRecord={cultureRecord}
                form={form}
                permissions={permissions}
                weight={cultureWeight}
                hasChecker={hasChecker}
                formId={formId}
              />
            </Card>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function OverallCommentsSection({
  form,
  period,
  hasChecker,
  role,
  write,
  overallComments,
  revalidateOverallComments,
}: {
  form: ReturnType<typeof useForm<MeritEvaluation>>;
  period: PeriodType;
  hasChecker: boolean;
  role: Approval;
  write: boolean;
  overallComments: MeritForm["overallComments"];
  revalidateOverallComments: () => void;
}) {
  const periodLabel = MERIT_EVALUATION_PERIOD_LABELS[period];
  const isYearEnd = period === Period.EVALUATION_2ND;
  const midYearOverallComment = overallComments?.find(
    (comment) => comment.period === Period.EVALUATION_1ST,
  );
  const fields = hasChecker
    ? OVERALL_COMMENT_FIELDS
    : OVERALL_COMMENT_FIELDS.filter((field) => field.role !== "checker");

  const overallOwnerCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const overallCheckerCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const overallApproverCommentRef = useRef<HTMLTextAreaElement | null>(null);

  const commentRefs = {
    owner: overallOwnerCommentRef,
    checker: overallCheckerCommentRef,
    approver: overallApproverCommentRef,
  };

  const overallCommentTextareaRefs = hasChecker
    ? [
        overallOwnerCommentRef,
        overallCheckerCommentRef,
        overallApproverCommentRef,
      ]
    : [overallOwnerCommentRef, overallApproverCommentRef];

  const { groupSyncFunctions: overallCommentSyncFunctions } =
    useSyncTextareaHeights([
      { refs: overallCommentTextareaRefs, breakpoint: "(min-width: 1024px)" },
    ]);

  const syncOverallCommentTextareaHeights = overallCommentSyncFunctions[0];
  const gridClass = evaluationGridClass(hasChecker);

  return (
    <AccordionItem value="overall-comments">
      <EvaluationAccordionHeader title="ข้อคิดเห็น/ข้อเสนอแนะภาพรวม (Overall Comments / Recommendations)" />
      <AccordionContent>
        <div className="flex flex-col gap-4">
          {isYearEnd && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-marine">
                {MERIT_EVALUATION_PERIOD_LABELS[Period.EVALUATION_1ST]}
              </h2>
              <div className={gridClass}>
                {fields.map((field) => (
                  <div key={field.role} className={MID_YEAR_COLUMN_CLASS}>
                    <ReadOnlyOverallComment
                      label={field.label}
                      value={
                        midYearOverallComment?.[
                          field.midYearKey as keyof OverallComment
                        ] as string | null | undefined
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {periodLabel && (
              <h2 className="text-sm font-medium text-marine">{periodLabel}</h2>
            )}
            <div className={gridClass}>
              {fields.map((field) => (
                <div key={field.role} className={EVALUATION_COLUMN_CLASS}>
                  <FormGenerator
                    name={field.name}
                    form={form}
                    variant="bigText"
                    label={field.label}
                    disabled={!(write && role === field.role)}
                    maxLength={COMPETENCY_ACTUAL_MAX_LENGTH}
                    fillHeight
                    className={FILL_HEIGHT_FORM_CLASS}
                    scrollAreaClassName={OVERALL_COMMENT_SCROLL_AREA_CLASS_NAME}
                    textareaRef={(el) => {
                      commentRefs[field.role].current = el;
                      syncOverallCommentTextareaHeights();
                    }}
                    onInput={() => {
                      revalidateOverallComments();
                      syncOverallCommentTextareaHeights();
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function ReadOnlyOverallComment({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-2 min-h-0 bg-transparent p-0 h-auto lg:flex-1 lg:min-h-0">
      <span className={formRecord.blue.label}>{label}</span>
      <p
        className={cn(
          formRecord.default.input,
          "whitespace-pre-wrap [word-break:break-word] lg:min-h-48 lg:flex-1",
        )}
      >
        {value?.trim() ? value : "-"}
      </p>
    </div>
  );
}
