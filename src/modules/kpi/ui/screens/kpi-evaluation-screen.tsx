import { Resolver, useFieldArray, useForm, useWatch } from "react-hook-form";
import { inferProcedureOutput } from "@trpc/server";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppRouter } from "@/trpc/routers/_app";

import { Form } from "@/components/ui/form";
import { Toolbar } from "@/components/toolbar";

import { Action, Approval } from "@/modules/tasks/permissions";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { KpisEvaluation, kpisEvaluationSchema } from "@/modules/kpi/schema/evaluation";
import { kpiEvaluationMap, validateWeight } from "../../utils";
import { Card } from "@/components/card";
import { Rank } from "@/types/employees";
import { StateInfo } from "@/components/state-info";
import { KpiEvaluationContent } from "../components/kpi-evaluation-content";
import { useCallback, useEffect, useMemo } from "react";
import { KpiEvaluation, Period } from "@/generated/prisma/client";
import { formatDecimal } from "@/lib/utils";
import { useWeight } from "../../stores/use-weight";
import { useSaveForm } from "@/modules/tasks/stores/use-save-form";
import { toast } from "sonner";
import { useStartWorkflow } from "@/modules/tasks/api/use-start-workflow";
import { useEvaluateKpis } from "../../api/use-evaluate-kpis";
import { EmployeeInfo } from "@/components/employee-info";
import { NumberTicker } from "@/components/number-ticker";

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
  const { save } = useSaveForm();
  const { setWeight } = useWeight();

  const evaluateKpis = useEvaluateKpis(id, period);
  const startWorkflow = useStartWorkflow(id, period);

  const map = useCallback((kpi: KpiEvaluation) => kpiEvaluationMap({ ...kpi, role }), [role]);

  const defaultValues = useMemo(() => {
    return {
      kpis: form.kpis?.map(map) ?? [],
    };
  }, [form.kpis, map]);

  const f = useForm<KpisEvaluation>({
    resolver: zodResolver(kpisEvaluationSchema) as Resolver<KpisEvaluation>,
    defaultValues,
  });

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

  const onSubmit = (data: KpisEvaluation) => {
    evaluateKpis({ kpis: data.kpis, saved: true });
  };

  useEffect(() => {
    if (!form.kpis) return;
    f.reset(
      {
        kpis: (form.kpis || []).map((kpi) => kpiEvaluationMap({ ...kpi, role })),
      },
      {
        keepDirty: false,
        keepTouched: false,
      },
    );
  }, [form.kpis, role, f]);

  useEffect(() => {
    setWeight(0);
  }, [setWeight]);

  return (
    <Form {...f}>
      <form onSubmit={f.handleSubmit(onSubmit)}>
        <EmployeeInfo
          owner={form.tasks?.owner}
          checker={form.tasks?.checker}
          approver={form.tasks?.approver}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start flex-col text-secondary">
              <span className="text-xs font-medium uppercase tracking-wide">
                Full
              </span>
            </div>
            <div className="flex flex-col items-start p-3">
              <NumberTicker
                value={validateWeight(form.tasks.owner.rank as Rank)}
                decimalPlaces={2}
                className="text-3xl font-semibold tracking-tighter whitespace-pre-wrap text-primary"
              />
            </div>
          </div>
        </EmployeeInfo>

        <div className="px-3 pt-3 w-full grid grid-cols-4 gap-2">
          <StateInfo value={validateWeight(form.tasks.owner.rank as Rank)} title="Full Score" />
          <StateInfo value={calculateAchievementSum.owner} title="Owner" decimalPlaces={2} />
          <StateInfo value={calculateAchievementSum.checker} title="Checker" decimalPlaces={2} />
          <StateInfo value={calculateAchievementSum.approver} title="Approver" decimalPlaces={2} />
        </div>

        <Toolbar
          {...props}
          status={STATUS_VARIANTS[form.tasks?.status]}
          onWorkflow={() => {
            if (!save) {
              toast.error("Please confirm the form before starting the workflow");
              return;
            }

            startWorkflow({ id: form.tasks!.id })
          }}
          onSaveDraft={() => evaluateKpis({ ...f.getValues(), saved: false })}
        />

        <div className="px-3 mx-auto w-full flex flex-col justify-start grow pb-45">
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
                  hasChecker={form.tasks.checker !== null} 
                  year={form.year}
                  role={role}
                  finalSumWeight={calculateAchievementSum.approver}
                />                
              </Card>
            ))}
          </div>
        </div>
      </form>
    </Form>
  );
};  