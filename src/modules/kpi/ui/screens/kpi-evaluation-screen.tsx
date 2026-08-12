import { Resolver, useForm, useWatch } from "react-hook-form";
import { inferProcedureOutput } from "@trpc/server";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppRouter } from "@/trpc/routers/_app";

import { Form } from "@/components/ui/form";
import { Toolbar } from "@/components/toolbar";

import { Action, Approval } from "@/modules/tasks/permissions";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { KpisEvaluation, kpisEvaluationSchema } from "@/modules/kpi/schema/evaluation";
import { exportDefinitionKpi, kpiEvaluationMap, validateWeight } from "../../utils";
import { Card } from "@/components/card";
import { Rank } from "@/types/employees";
import { KpiEvaluationContent } from "../components/kpi-evaluation-content";
import { KpiEvaluationSummaryTable } from "../components/kpi-evaluation-summary-table";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Employee, KpiEvaluation, Task, Period } from "@/generated/prisma/client";
import { useWeight } from "../../stores/use-weight";
import { toast } from "sonner";
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { useEvaluateKpis } from "../../api/use-evaluate-kpis";
import { EmployeeInfo } from "@/components/employee-info";
import { createPortal } from "react-dom";
import { Confirmation } from "@/modules/tasks/ui/components/confirmation";
import { FormGenerator } from "@/components/form-generator";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { cn } from "@/lib/utils";
import { formRecord } from "@/types/form";
import { OVERALL_COMMENT_MAX_LENGTH } from "../../constants";

interface Props {
  id: string;
  role: Approval;
  period: Period;
  permissions: Record<Action, boolean>;
  form: inferProcedureOutput<AppRouter["kpi"]["getOne"]>["form"];
}

export const KpiEvaluationScreen = ({
  id,
  form,
  role,
  period,
  ...props
}: Props) => {
  const { setWeight } = useWeight();

  const { mutation: evaluateKpis, mutationAsync: evaluateKpisAsync } = useEvaluateKpis(id, period);
  const startWorkflow = useStartWorkflow(id, period);

  const hasChecker = form.tasks.checker !== null;

  const map = useCallback((kpi: KpiEvaluation) => kpiEvaluationMap({ ...kpi, role }), [role]);

  const overallCommentsDefault = useMemo(
    () => ({
      role,
      commentOwner: form.overallComment?.commentOwner ?? null,
      commentChecker: form.overallComment?.commentChecker ?? null,
      commentApprover: form.overallComment?.commentApprover ?? null,
    }),
    [form.overallComment, role],
  );

  const defaultValues = useMemo(() => {
    return {
      kpis: form.kpis?.map(map) ?? [],
      overallComments: overallCommentsDefault,
    };
  }, [form.kpis, map, overallCommentsDefault]);

  const f = useForm<KpisEvaluation>({
    resolver: zodResolver(kpisEvaluationSchema) as Resolver<KpisEvaluation>,
    defaultValues,
    reValidateMode: "onChange",
  });

  const revalidateOverallComments = () => {
    void f.trigger([
      "overallComments.commentOwner",
      "overallComments.commentChecker",
      "overallComments.commentApprover",
    ]);
  };

  const kpis = useWatch({
    control: f.control,
    name: "kpis",
  });

  const calculateAchievementSum = useMemo(() => {
    let ownerSum = 0;
    let checkerSum = 0;
    let approverSum = 0;

    kpis?.forEach((kpi, index) => {
      const kpiData = form.kpis[index];
      const weight = Number(kpiData?.weight || 0);

      if (kpi.achievementOwner != null) {
        ownerSum += (Number(kpi.achievementOwner) / 100) * weight;
      }
      if (kpi.achievementChecker != null) {
        checkerSum += (Number(kpi.achievementChecker) / 100) * weight;
      }
      if (kpi.achievementApprover != null) {
        approverSum += (Number(kpi.achievementApprover) / 100) * weight;
      }
    });

    return {
      owner: ownerSum,
      checker: checkerSum,
      approver: approverSum,
    };
  }, [kpis, form.kpis]);

  const submitEvaluation = (values: KpisEvaluation, saved: boolean) => {
    evaluateKpis({
      kpis: values.kpis,
      overallComments: {
        commentOwner: values.overallComments.commentOwner,
        commentChecker: values.overallComments.commentChecker,
        commentApprover: values.overallComments.commentApprover,
      },
      saved,
    });
  };

  const submitEvaluationAsync = async (values: KpisEvaluation, saved: boolean) => {
    await evaluateKpisAsync({
      kpis: values.kpis,
      overallComments: {
        commentOwner: values.overallComments.commentOwner,
        commentChecker: values.overallComments.commentChecker,
        commentApprover: values.overallComments.commentApprover,
      },
      saved,
    });
  };

  const onSubmit = (data: KpisEvaluation) => {
    submitEvaluation(data, true);
  };

  useEffect(() => {
    if (!form.kpis) return;

    f.reset(
      {
        kpis: (form.kpis || []).map((kpi) => kpiEvaluationMap({ ...kpi, role })),
        overallComments: {
          role,
          commentOwner: form.overallComment?.commentOwner ?? null,
          commentChecker: form.overallComment?.commentChecker ?? null,
          commentApprover: form.overallComment?.commentApprover ?? null,
        },
      },
      {
        keepDirtyValues: true,
        keepTouched: false,
      },
    );
  }, [form.kpis, form.overallComment, role, f]);

  useEffect(() => {
    setWeight(0);
  }, [setWeight]);

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

  return (
    <Form {...f}>
      <form onSubmit={f.handleSubmit(onSubmit)}>
        <EmployeeInfo
          owner={form.tasks?.owner}
          checker={form.tasks?.checker}
          approver={form.tasks?.approver}
        >
          <KpiEvaluationSummaryTable
            hasChecker={hasChecker}
            full={validateWeight(form.tasks.owner.rank as Rank)}
            scores={{
              owner: calculateAchievementSum.owner,
              checker: calculateAchievementSum.checker,
              approver: calculateAchievementSum.approver,
            }}
          />
        </EmployeeInfo>

        <Toolbar
          {...props}
          status={STATUS_VARIANTS[form.tasks?.status]}
          onWorkflow={async () => {
            const ok = await f.trigger();
            if (!ok) {
              toast.error("Please fix validation errors before starting the workflow");
              return;
            }

            const values = f.getValues();
            await submitEvaluationAsync(values, true);
            f.reset(values);
            startWorkflow({ id: form.tasks!.id });
          }}
          onSaveDraft={async () => {
            const values = f.getValues();
            await submitEvaluationAsync(values, false);
            f.reset(values);
          }}
          onExport={async () => {
            const values = f.getValues();
            const kpis = form.kpis.map((kpi, index) => {
              const evaluated = values.kpis[index];
              return {
                ...kpi,
                actualOwner: evaluated?.actualOwner ?? kpi.actualOwner,
                actualChecker: evaluated?.actualChecker ?? kpi.actualChecker,
                actualApprover: evaluated?.actualApprover ?? kpi.actualApprover,
                achievementOwner: evaluated?.achievementOwner ?? kpi.achievementOwner,
                achievementChecker: evaluated?.achievementChecker ?? kpi.achievementChecker,
                achievementApprover: evaluated?.achievementApprover ?? kpi.achievementApprover,
              };
            });

            await exportDefinitionKpi({
              ...form,
              kpis,
              employee: form.tasks?.owner,
              task: form.tasks as Task & { checker?: Employee; approver: Employee },
              overallComment: form.overallComment
                ? {
                    ...form.overallComment,
                    commentOwner:
                      values.overallComments.commentOwner ?? form.overallComment.commentOwner,
                    commentChecker:
                      values.overallComments.commentChecker ?? form.overallComment.commentChecker,
                    commentApprover:
                      values.overallComments.commentApprover ?? form.overallComment.commentApprover,
                  }
                : {
                    id: "",
                    formId: form.id,
                    period,
                    commentOwner: values.overallComments.commentOwner,
                    commentChecker: values.overallComments.commentChecker,
                    commentApprover: values.overallComments.commentApprover,
                  },
            });
          }}
        />

        <div className="px-3 mx-auto w-full flex flex-col justify-start grow pb-45 gap-6">
          <div
            data-empty={form?.kpis.length === 0}
            className="grid grid-cols-1 gap-y-6 data-[empty=true]:hidden"
          >
            {form.kpis.map((kpi, index) => (
              <Card key={kpi.id} className="group/card">
                <KpiEvaluationContent
                  id={id}
                  period={period}
                  index={index}
                  form={f}
                  kpi={kpi}
                  permissions={props.permissions}
                  hasChecker={hasChecker}
                  year={form.year}
                  role={role}
                  finalSumWeight={calculateAchievementSum.approver}
                />
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-primary text-lg font-semibold">
              ข้อคิดเห็น/ข้อเสนอแนะภาพรวม (Overall Comments / Recommendations)
            </h2>
            <div className={evaluationGridClass}>
              <div className={evaluationColumnClass}>
                <FormGenerator
                  name="overallComments.commentOwner"
                  form={f}
                  variant="bigText"
                  label="พนักงาน (Employee)"
                  disabled={!(props.permissions.write && role === "owner")}
                  maxLength={OVERALL_COMMENT_MAX_LENGTH}
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
                    form={f}
                    variant="bigText"
                    label="ผู้ประเมินลำดับที่ 1 (Evaluator 1)"
                    disabled={!(props.permissions.write && role === "checker")}
                    maxLength={OVERALL_COMMENT_MAX_LENGTH}
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
                  form={f}
                  variant="bigText"
                  label="ผู้ประเมินลำดับที่ 2 (Evaluator 2)"
                  disabled={!(props.permissions.write && role === "approver")}
                  maxLength={OVERALL_COMMENT_MAX_LENGTH}
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

        {props.permissions.approve && createPortal(
          <Confirmation
            id={id}
            app="KPI Bonus"
            taskId={form.tasks.id}
            period={period}
            confirmTitle="Confirm KPI Evaluation"
            onSave={async () => {
              const ok = await f.trigger();
              if (!ok) {
                toast.error("Please fix validation errors before confirming");
                return false;
              }

              const values = f.getValues();
              await submitEvaluationAsync(values, false);
              f.reset(values);
              return true;
            }}
          />,
          document.body
        )}
      </form>
    </Form>
  );
};
