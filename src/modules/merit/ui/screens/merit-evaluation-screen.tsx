import { inferProcedureOutput } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";
import { Period } from "@/generated/prisma/enums";

import { Action, Approval } from "@/modules/tasks/permissions";
import { exportMeritDefinition, meritEvaluationsMap, sumCompetencyByPeriod, sumCultureByPeriod } from "../../utils";
import { useEffect, useMemo, useRef } from "react";
import { MeritEvaluation, meritEvaluationsSchema } from "../../schemas/evaluation";
import { Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { EmployeeInfo } from "@/components/employee-info";
import { Toolbar } from "@/components/toolbar";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { Button } from "@/components/ui/button";
import { BsTriangleFill } from "react-icons/bs";
import { Accordion, AccordionTrigger, AccordionItem } from "@/components/ui/accordion";
import { AccordionContent } from "@radix-ui/react-accordion";
import { CompetencyEvaluationContent } from "../components/competency-evaluation-content";
import { Card } from "@/components/card";
import { CultureEvaluationContent } from "../components/culture-evaluation-content";
import { useEvaluateBulkMerit } from "../../api/use-evaluation-bulk-merit";
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { toast } from "sonner";
import {
  COMPETENCY_ACTUAL_MAX_LENGTH,
  competencyAchievementLevels,
  cultureLevels,
  MERIT_EVALUATION_PERIOD_LABELS,
} from "../../constant";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { FormGenerator } from "@/components/form-generator";
import { cn } from "@/lib/utils";
import { formRecord } from "@/types/form";
import { Confirmation } from "@/modules/tasks/ui/components/confirmation";
import { createPortal } from "react-dom";
import { Employee, Task } from "@/generated/prisma/client";
import { MeritEvaluationSummaryTable } from "../components/merit-evaluation-summary-table";
import { MeritEvaluationCriteriaGuide } from "../components/merit-evaluation-criteria-guide";

interface Props {
  id: string;
  period: Period;
  role: Approval;
  hasChecker: boolean;
  data: inferProcedureOutput<AppRouter["merit"]["getOne"]>["form"];
  permissions: Record<Action, boolean>;
}

export const MeritEvaluationScreen = ({ id, period, data, permissions, role, hasChecker }: Props) => {
  const sortedCompetencyRecords = useMemo(
    () => [...data.competencyRecords].sort((a, b) => a.order - b.order),
    [data.competencyRecords],
  );

  const sortedCultureRecords = useMemo(
    () => [...data.cultureRecords].sort((a, b) => a.order - b.order),
    [data.cultureRecords],
  );

  const evaluations = meritEvaluationsMap(data, period, role);
  
  const startWorkflow = useStartWorkflow(id, period);
  const { mutation: evaluateBulkMerit, mutationAsync: evaluateBulkMeritAsync } = useEvaluateBulkMerit(id, period);

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
    const { requireEvaluationResults: _requireEvaluationResults, ...evaluationValues } = values;

    evaluateBulkMerit({
      formId: id,
      period,
      ...evaluationValues,
      saved,
    });
  };

  const submitEvaluationAsync = async (values: MeritEvaluation, saved: boolean) => {
    const { requireEvaluationResults: _requireEvaluationResults, ...evaluationValues } = values;

    await evaluateBulkMeritAsync({
      formId: id,
      period,
      ...evaluationValues,
      saved,
    });
  };

  const onSubmit = (data: MeritEvaluation) => {
    submitEvaluation(data, true);
  };

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

  const overallCommentScrollAreaClassName = "lg:flex-1 lg:min-h-48 w-full";

  const evaluationGridClass = cn(
    "grid grid-cols-1 gap-2",
    hasChecker ? "lg:grid-cols-3 lg:items-stretch" : "lg:grid-cols-2 lg:items-stretch",
  );

  const evaluationColumnClass =
    "flex flex-col gap-2 min-h-0 min-w-0 h-full p-2 bg-[#0080d51c] dark:bg-[#298bfd10] rounded-sm";

  const overallOwnerCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const overallCheckerCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const overallApproverCommentRef = useRef<HTMLTextAreaElement | null>(null);

  const overallCommentTextareaRefs = useMemo(
    () =>
      hasChecker
        ? [overallOwnerCommentRef, overallCheckerCommentRef, overallApproverCommentRef]
        : [overallOwnerCommentRef, overallApproverCommentRef],
    [hasChecker],
  );

  const { groupSyncFunctions: overallCommentSyncFunctions } = useSyncTextareaHeights([
    { refs: overallCommentTextareaRefs, breakpoint: "(min-width: 1024px)" },
  ]);

  const syncOverallCommentTextareaHeights = overallCommentSyncFunctions[0];

  const periodLabel = MERIT_EVALUATION_PERIOD_LABELS[period];
  const isYearEnd = period === Period.EVALUATION_2ND;
  const midYearOverallComment = useMemo(
    () => data.overallComments?.find((comment) => comment.period === Period.EVALUATION_1ST),
    [data.overallComments],
  );

  // useWatch find total competency and culture achievement for each role
  const competencies = useWatch({
    control: form.control,
    name: "competencies",
  });

  const cultures = useWatch({
    control: form.control,
    name: "cultures",
  });

  const scores = useMemo(() => {
    // Calculate competency achievement for each role
    const competencyOwner = competencies?.reduce((acc, competency, index) => {
      const achievement = Number(competency?.achievementOwner ?? 0);
      const weight = Number(sortedCompetencyRecords[index]?.weight ?? 0);
      return acc + (achievement / 5) * weight;
    }, 0) ?? 0;

    const competencyChecker = competencies?.reduce((acc, competency, index) => {
      const achievement = Number(competency?.achievementChecker ?? 0);
      const weight = Number(sortedCompetencyRecords[index]?.weight ?? 0);
      return acc + (achievement / 5) * weight;
    }, 0) ?? 0;

    const competencyApprover = competencies?.reduce((acc, competency, index) => {
      const achievement = Number(competency?.achievementApprover ?? 0);
      const weight = Number(sortedCompetencyRecords[index]?.weight ?? 0);
      return acc + (achievement / 5) * weight;
    }, 0) ?? 0;

    // Calculate culture achievement for each role
    const cultureWeight = 30 / sortedCultureRecords.length;
    const cultureOwner = cultures?.reduce((acc, culture) => {
      const achievement = Number(culture?.levelBehaviorOwner ?? 0);
      return acc + (achievement / 5) * cultureWeight;
    }, 0) ?? 0;

    const cultureChecker = cultures?.reduce((acc, culture) => {
      const achievement = Number(culture?.levelBehaviorChecker ?? 0);
      return acc + (achievement / 5) * cultureWeight;
    }, 0) ?? 0;

    const cultureApprover = cultures?.reduce((acc, culture) => {
      const achievement = Number(culture?.levelBehaviorApprover ?? 0);
      return acc + (achievement / 5) * cultureWeight;
    }, 0) ?? 0;

    const competencyFull = sortedCompetencyRecords.reduce(
      (acc, record) => acc + Number(record.weight ?? 0),
      0,
    );
    const cultureFull = 30;

    return {
      competencyFull,
      cultureFull,
      owner: {
        competency: competencyOwner,
        culture: cultureOwner,
      },
      checker: {
        competency: competencyChecker,
        culture: cultureChecker,
      },
      approver: {
        competency: competencyApprover,
        culture: cultureApprover,
      },
    };
  }, [competencies, cultures, sortedCompetencyRecords, sortedCultureRecords.length]);

  const midYearOverall = useMemo(
    () => ({
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
    }),
    [sortedCompetencyRecords, sortedCultureRecords],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <EmployeeInfo owner={data.tasks?.owner} checker={data.tasks?.checker} approver={data.tasks?.approver}>
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
            midYearOverall={period === Period.EVALUATION_2ND ? midYearOverall : undefined}
          />
        </EmployeeInfo>

        <Toolbar 
          onWorkflow={async () => {
            form.setValue("requireEvaluationResults", true);
            const ok = await form.trigger();
            form.setValue("requireEvaluationResults", false);

            if (!ok) {
              toast.error("Please fix validation errors before starting the workflow");
              return;
            }

            const values = form.getValues();
            await submitEvaluationAsync(values, true);
            form.reset(values);
            startWorkflow({ id: data.tasks.id });
          }}
          onExport={async () => {
            await exportMeritDefinition({
              ...data,
              competencyRecords: data.competencyRecords,
              cultureRecords: data.cultureRecords,
              employee: data.tasks?.owner,
              task: data.tasks as Task & { checker?: Employee; approver: Employee },
            });
          }}
          onSaveDraft={async () => {
            const values = form.getValues();
            await submitEvaluationAsync(values, false);
            form.reset(values);
          }}
          permissions={permissions}
          status={STATUS_VARIANTS[data.tasks?.status!]}
        />

        <div className="px-3 mx-auto w-full flex flex-col justify-start grow pb-45">
          <Accordion
            defaultValue={["competency", "culture", "overall-comments"]}
            type="multiple"
            className="space-y-4"
          >
            <AccordionItem value="competency">
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

                    <h2 className="text-primary text-lg font-semibold">
                      สมรรถนะ (Competency)  
                    </h2>
                  </div>
                </div>
              </div>
              <AccordionContent>
                <MeritEvaluationCriteriaGuide 
                  description="พิจารณาจากการแสดงออกตามพฤติกรรมที่คาดหวัง (Demonstration of Expectation Behavior) กับผลลัพธ์ของโครงการ กิจกรรมที่ใช้เป็นตัวประเมินการแสดงออกตามพฤติกรรมที่คาดหวัง (Project/Activities Demonstrating Expected Behavior)"
                  levels={competencyAchievementLevels}
                />
                <div className="grid grid-cols-1 gap-y-6">
                  {sortedCompetencyRecords.map((competencyRecord, index) => (
                      <Card key={competencyRecord.id}>
                        <CompetencyEvaluationContent 
                          index={index} 
                          period={period} 
                          competencyRecord={competencyRecord} 
                          form={form} 
                          permissions={{
                            canPerformOwner: permissions.write && role === "owner",
                            canPerformChecker: permissions.write && role === "checker",
                            canPerformApprover: permissions.write && role === "approver",
                          }}
                          hasChecker={hasChecker}
                          formId={id}
                        />
                      </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="culture">
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
                    <h2 className="text-primary text-lg font-semibold">
                      วัฒนธรรม (Culture)
                    </h2>
                  </div>
                </div>
              </div>
              <AccordionContent>
                <MeritEvaluationCriteriaGuide 
                  description="พิจารณาจากการแสดงออกตามพฤติกรรมที่คาดหวัง ตามแนวทางในการประเมิน (Key Evidence Guideline) ที่กาหนดโดย N-1 ของแต่ละสายงาน"
                  levels={cultureLevels}
                />
                <div className="grid grid-cols-1 gap-y-6">
                  {sortedCultureRecords.map((cultureRecord, index) => (
                    <Card key={cultureRecord.id}>
                      <CultureEvaluationContent 
                        index={index}
                        period={period}
                        cultureRecord={cultureRecord}
                        form={form}
                        permissions={{
                          canPerformOwner: permissions.write && role === "owner",
                          canPerformChecker: permissions.write && role === "checker",
                          canPerformApprover: permissions.write && role === "approver",
                        }}
                        weight={30 / sortedCultureRecords.length}
                        hasChecker={hasChecker}
                        formId={id}
                      />
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="overall-comments">
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
                    <h2 className="text-primary text-lg font-semibold">
                      ข้อคิดเห็น/ข้อเสนอแนะภาพรวม (Overall Comments / Recommendations)
                    </h2>
                  </div>
                </div>
              </div>
              <AccordionContent>
                <div className="flex flex-col gap-4">
                  {isYearEnd && (
                    <div className="flex flex-col gap-2">
                      <h2 className="text-sm font-medium text-marine">
                        {MERIT_EVALUATION_PERIOD_LABELS[Period.EVALUATION_1ST]}
                      </h2>
                      <div className={evaluationGridClass}>
                        <div className={evaluationColumnClass}>
                          <ReadOnlyOverallComment
                            label="พนักงาน (Employee)"
                            value={midYearOverallComment?.commentOwner}
                          />
                        </div>
                        {hasChecker && (
                          <div className={evaluationColumnClass}>
                            <ReadOnlyOverallComment
                              label="ผู้ประเมินลำดับที่ 1 (Evaluator 1)"
                              value={midYearOverallComment?.commentChecker}
                            />
                          </div>
                        )}
                        <div className={evaluationColumnClass}>
                          <ReadOnlyOverallComment
                            label="ผู้ประเมินลำดับที่ 2 (Evaluator 2)"
                            value={midYearOverallComment?.commentApprover}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {periodLabel && (
                      <h2 className="text-sm font-medium text-marine">
                        {periodLabel}
                      </h2>
                    )}
                    <div className={evaluationGridClass}>
                      <div className={evaluationColumnClass}>
                        <FormGenerator
                          name="overallComments.commentOwner"
                          form={form}
                          variant="bigText"
                          label="พนักงาน (Employee)"
                          disabled={!(permissions.write && role === "owner")}
                          maxLength={COMPETENCY_ACTUAL_MAX_LENGTH}
                          fillHeight
                          className={fillHeightFormClass}
                          scrollAreaClassName={overallCommentScrollAreaClassName}
                          textareaRef={(el) => {
                            overallOwnerCommentRef.current = el;
                            syncOverallCommentTextareaHeights();
                          }}
                          onInput={() => {
                            revalidateOverallComments();
                            syncOverallCommentTextareaHeights();
                          }}
                        />
                      </div>
                      {hasChecker && (
                        <div className={evaluationColumnClass}>
                          <FormGenerator
                            name="overallComments.commentChecker"
                            form={form}
                            variant="bigText"
                            label="ผู้ประเมินลำดับที่ 1 (Evaluator 1)"
                            disabled={!(permissions.write && role === "checker")}
                            maxLength={COMPETENCY_ACTUAL_MAX_LENGTH}
                            fillHeight
                            className={fillHeightFormClass}
                            scrollAreaClassName={overallCommentScrollAreaClassName}
                            textareaRef={(el) => {
                              overallCheckerCommentRef.current = el;
                              syncOverallCommentTextareaHeights();
                            }}
                            onInput={() => {
                              revalidateOverallComments();
                              syncOverallCommentTextareaHeights();
                            }}
                          />
                        </div>
                      )}
                      <div className={evaluationColumnClass}>
                        <FormGenerator
                          name="overallComments.commentApprover"
                          form={form}
                          variant="bigText"
                          label="ผู้ประเมินลำดับที่ 2 (Evaluator 2)"
                          disabled={!(permissions.write && role === "approver")}
                          maxLength={COMPETENCY_ACTUAL_MAX_LENGTH}
                          fillHeight
                          className={fillHeightFormClass}
                          scrollAreaClassName={overallCommentScrollAreaClassName}
                          textareaRef={(el) => {
                            overallApproverCommentRef.current = el;
                            syncOverallCommentTextareaHeights();
                          }}
                          onInput={() => {
                            revalidateOverallComments();
                            syncOverallCommentTextareaHeights();
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {permissions.approve && createPortal(
          <Confirmation 
            id={id} 
            app="Merit"
            taskId={data.tasks.id} 
            period={period} 
            confirmTitle="Confirm Merit Evaluation"
            onSave={async () => {
              form.setValue("requireEvaluationResults", true);
              const ok = await form.trigger();
              form.setValue("requireEvaluationResults", false);

              if (!ok) {
                toast.error("Please fix validation errors before confirming");
                return false;
              }

              const values = form.getValues();
              await submitEvaluationAsync(values, false);
              form.reset(values);
              return true;
            }}
          />,
          document.body
        )}
      </form>
    </Form>
  );
}

const ReadOnlyOverallComment = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => {
  return (
    <div className="flex flex-col gap-2 min-h-0 bg-transparent p-0 h-auto lg:flex-1 lg:min-h-0">
      <span className={formRecord.blue.label}>{label}</span>
      <p
        className={cn(
          formRecord.blue.input,
          "whitespace-pre-wrap [word-break:break-word] lg:min-h-48 lg:flex-1",
        )}
      >
        {value?.trim() ? value : "-"}
      </p>
    </div>
  );
};