import { zodResolver } from "@hookform/resolvers/zod";
import type { inferProcedureOutput } from "@trpc/server";
import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { Resolver } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Card } from "@/components/card";
import { EmployeeInfo } from "@/components/employee-info";
import { FormGenerator } from "@/components/form-generator";
import { Toolbar } from "@/components/toolbar";
import { Form } from "@/components/ui/form";
import type {
  Employee,
  KpiEvaluation,
  Task,
} from "@/generated/prisma/client";
import type { Period } from "@/generated/prisma/enums";
import { useSyncTextareaHeights } from "@/hooks/use-sync-textarea-heights";
import { cn } from "@/lib/utils";
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import type { Action, Approval } from "@/modules/tasks/permissions";
import { Confirmation } from "@/modules/tasks/ui/components/confirmation";
import type { AppRouter } from "@/trpc/routers/_app";
import type { Rank } from "@/types/employees";
import { formRecord } from "@/types/form";

import { useEvaluateKpis } from "../../api/use-evaluate-kpis";
import { OVERALL_COMMENT_MAX_LENGTH } from "../../constants";
import type { KpisEvaluation } from "../../schema/evaluation";
import { kpisEvaluationSchema } from "../../schema/evaluation";
import { useWeight } from "../../stores/use-weight";
import {
  exportDefinitionKpi,
  kpiEvaluationMap,
  validateWeight,
} from "../../utils";
import { KpiEvaluationContent } from "../components/kpi-evaluation-content";
import { KpiEvaluationSummaryTable } from "../components/kpi-evaluation-summary-table";

interface Props {
  id: string;
  role: Approval;
  period: Period;
  permissions: Record<Action, boolean>;
  form: inferProcedureOutput<AppRouter["kpi"]["getOne"]>["form"];
}

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

const OVERALL_COMMENT_SCROLL_AREA_CLASS_NAME = "lg:flex-1 lg:min-h-48 w-full";

const OVERALL_COMMENT_FIELDS = [
  {
    role: "owner" as const,
    name: "overallComments.commentOwner" as const,
    label: "พนักงาน (Employee)",
  },
  {
    role: "checker" as const,
    name: "overallComments.commentChecker" as const,
    label: "ผู้ประเมินลำดับที่ 1 (Evaluator 1)",
  },
  {
    role: "approver" as const,
    name: "overallComments.commentApprover" as const,
    label: "ผู้ประเมินลำดับที่ 2 (Evaluator 2)",
  },
];

function toEvaluationPayload(values: KpisEvaluation, saved: boolean) {
  return {
    kpis: values.kpis,
    overallComments: {
      commentOwner: values.overallComments.commentOwner,
      commentChecker: values.overallComments.commentChecker,
      commentApprover: values.overallComments.commentApprover,
    },
    saved,
  };
}

function sumAchievements(
  kpis: KpisEvaluation["kpis"] | undefined,
  source: KpiEvaluation[],
) {
  let owner = 0;
  let checker = 0;
  let approver = 0;

  kpis?.forEach((kpi, index) => {
    const weight = Number(source[index]?.weight || 0);

    if (kpi.achievementOwner != null) {
      owner += (Number(kpi.achievementOwner) / 100) * weight;
    }
    if (kpi.achievementChecker != null) {
      checker += (Number(kpi.achievementChecker) / 100) * weight;
    }
    if (kpi.achievementApprover != null) {
      approver += (Number(kpi.achievementApprover) / 100) * weight;
    }
  });

  return { owner, checker, approver };
}

export const KpiEvaluationScreen = ({
  id,
  form,
  role,
  period,
  permissions,
}: Props) => {
  const { setWeight } = useWeight();
  const { mutation: evaluateKpis, mutationAsync: evaluateKpisAsync } =
    useEvaluateKpis(id, period);
  const startWorkflow = useStartWorkflow(id, period);

  const hasChecker = form.tasks.checker !== null;

  const defaultValues = useMemo(
    () => ({
      kpis: form.kpis?.map((kpi) => kpiEvaluationMap({ ...kpi, role })) ?? [],
      overallComments: {
        role,
        commentOwner: form.overallComment?.commentOwner ?? null,
        commentChecker: form.overallComment?.commentChecker ?? null,
        commentApprover: form.overallComment?.commentApprover ?? null,
      },
    }),
    [form.kpis, form.overallComment, role],
  );

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

  const calculateAchievementSum = useMemo(
    () => sumAchievements(kpis, form.kpis),
    [kpis, form.kpis],
  );

  const onSubmit = (data: KpisEvaluation) => {
    evaluateKpis(toEvaluationPayload(data, true));
  };

  const saveDraft = async () => {
    const values = f.getValues();
    await evaluateKpisAsync(toEvaluationPayload(values, false));
    f.reset(values);
  };

  const saveForConfirmation = async () => {
    const ok = await f.trigger();
    if (!ok) {
      toast.error("Please fix validation errors before confirming");
      return false;
    }

    const values = f.getValues();
    await evaluateKpisAsync(toEvaluationPayload(values, false));
    f.reset(values);
    return true;
  };

  const onWorkflow = async () => {
    const ok = await f.trigger();
    if (!ok) {
      toast.error("Please fix validation errors before starting the workflow");
      return;
    }

    const values = f.getValues();
    await evaluateKpisAsync(toEvaluationPayload(values, true));
    f.reset(values);
    startWorkflow({ id: form.tasks.id });
  };

  const onExport = async () => {
    const values = f.getValues();
    const exportedKpis = form.kpis.map((kpi, index) => {
      const evaluated = values.kpis[index];
      return {
        ...kpi,
        actualOwner: evaluated?.actualOwner ?? kpi.actualOwner,
        actualChecker: evaluated?.actualChecker ?? kpi.actualChecker,
        actualApprover: evaluated?.actualApprover ?? kpi.actualApprover,
        achievementOwner: evaluated?.achievementOwner ?? kpi.achievementOwner,
        achievementChecker:
          evaluated?.achievementChecker ?? kpi.achievementChecker,
        achievementApprover:
          evaluated?.achievementApprover ?? kpi.achievementApprover,
      };
    });

    await exportDefinitionKpi({
      ...form,
      kpis: exportedKpis,
      employee: form.tasks?.owner,
      task: form.tasks as Task & { checker?: Employee; approver: Employee },
      overallComment: form.overallComment
        ? {
            ...form.overallComment,
            commentOwner:
              values.overallComments.commentOwner ??
              form.overallComment.commentOwner,
            commentChecker:
              values.overallComments.commentChecker ??
              form.overallComment.commentChecker,
            commentApprover:
              values.overallComments.commentApprover ??
              form.overallComment.commentApprover,
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
  };

  useEffect(() => {
    if (!form.kpis) return;

    f.reset(defaultValues, {
      keepDirtyValues: true,
      keepTouched: false,
    });
  }, [defaultValues, f, form.kpis]);

  useEffect(() => {
    setWeight(0);
  }, [setWeight]);

  const evaluationGridClass = cn(
    "grid grid-cols-1 gap-2",
    hasChecker ? "lg:grid-cols-3 lg:items-stretch" : "lg:grid-cols-2 lg:items-stretch",
  );

  const overallOwnerCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const overallCheckerCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const overallApproverCommentRef = useRef<HTMLTextAreaElement | null>(null);

  const commentRefs = {
    owner: overallOwnerCommentRef,
    checker: overallCheckerCommentRef,
    approver: overallApproverCommentRef,
  };

  const overallCommentTextareaRefs = useMemo(
    () =>
      hasChecker
        ? [
            overallOwnerCommentRef,
            overallCheckerCommentRef,
            overallApproverCommentRef,
          ]
        : [overallOwnerCommentRef, overallApproverCommentRef],
    [hasChecker],
  );

  const { groupSyncFunctions: overallCommentSyncFunctions } =
    useSyncTextareaHeights([
      { refs: overallCommentTextareaRefs, breakpoint: "(min-width: 1024px)" },
    ]);

  const syncOverallCommentTextareaHeights = overallCommentSyncFunctions[0];

  const visibleOverallComments = OVERALL_COMMENT_FIELDS.filter(
    (field) => field.role !== "checker" || hasChecker,
  );

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
          permissions={permissions}
          status={STATUS_VARIANTS[form.tasks?.status]}
          onWorkflow={onWorkflow}
          onSaveDraft={saveDraft}
          onExport={onExport}
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
                  permissions={permissions}
                  hasChecker={hasChecker}
                  role={role}
                />
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-primary text-lg font-semibold">
              ข้อคิดเห็น/ข้อเสนอแนะภาพรวม (Overall Comments / Recommendations)
            </h2>
            <div className={evaluationGridClass}>
              {visibleOverallComments.map((field) => (
                <div key={field.name} className={EVALUATION_COLUMN_CLASS}>
                  <FormGenerator
                    name={field.name}
                    form={f}
                    variant="bigText"
                    label={field.label}
                    disabled={!(permissions.write && role === field.role)}
                    maxLength={OVERALL_COMMENT_MAX_LENGTH}
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

        {permissions.approve &&
          typeof document !== "undefined" &&
          createPortal(
            <Confirmation
              id={id}
              app="KPI Bonus"
              taskId={form.tasks.id}
              period={period}
              confirmTitle="Confirm KPI Evaluation"
              onSave={saveForConfirmation}
            />,
            document.body,
          )}
      </form>
    </Form>
  );
};
