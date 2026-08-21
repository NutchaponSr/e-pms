"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Event } from "@/components/event";
import { InfoPanel } from "@/components/info-panel";
import { Period, Status } from "@/generated/prisma/enums";
import { getTaskStatus } from "@/modules/tasks/constant";
import { openPeriodTask } from "@/modules/tasks/ui/open-period-task";
import {
  getDefinitionTaskButtonLabel,
  getEvaluationTaskButtonLabel,
} from "@/modules/tasks/utils";
import { isWindowActive } from "@/modules/tasks/window-utils";
import { useTRPC } from "@/trpc/client";
import { useCreateKpiTask } from "../../api/use-create-kpi-task";

const KpiScoreChart = dynamic(() =>
  import("./kpi-score-chart").then((mod) => mod.KpiScoreChart),
);

interface Props {
  year: number;
}

export const KpiInfo = ({ year }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const { mutation: createKpiTask, ctx: createKpiTaskCtx } = useCreateKpiTask();
  const { data } = useSuspenseQuery(trpc.kpi.getInfo.queryOptions({ year }));

  const draftCompleted = data.task.draft?.status === Status.COMPLETED;
  const isCurrentYear = year === new Date().getFullYear();
  const draftActive = isCurrentYear && isWindowActive(data.windows.draft);
  const evaluationActive = isWindowActive(data.windows.evaluation);

  return (
    <InfoPanel title="KPI Bonus" chart={<KpiScoreChart data={data.chart} />}>
      <Event
        title="KPI Setting"
        description="Define measurable goals aligned with team and company priorities"
        status={getTaskStatus(data.task.draft?.status)}
        buttonCtx={{
          disabled: createKpiTaskCtx.isPending,
          active: draftActive,
          label: getDefinitionTaskButtonLabel(data.task.draft),
          onClick: () =>
            openPeriodTask({
              window: data.windows.draft,
              windowLabel: "KPI Setting",
              href: data.task.draft
                ? `/performance/kpi/${data.task.draft.formId}/definition`
                : undefined,
              onCreate: () => createKpiTask({ year, period: Period.IN_DRAFT }),
              push: router.push,
            }),
        }}
      />
      <Event
        title="Year-end Evaluation"
        description="Measures achievement based on actual performance results"
        status={getTaskStatus(data.task.evaluation?.status)}
        buttonCtx={{
          disabled: createKpiTaskCtx.isPending,
          active: draftCompleted && evaluationActive,
          label: getEvaluationTaskButtonLabel(data.task.evaluation),
          onClick: () =>
            openPeriodTask({
              window: data.windows.evaluation,
              windowLabel: "Year-end Evaluation",
              blockedMessage: draftCompleted
                ? undefined
                : "Complete KPI Setting before starting Year-end Evaluation",
              href: data.task.evaluation
                ? `/performance/kpi/${data.task.evaluation.formId}/evaluation`
                : undefined,
              onCreate: () =>
                createKpiTask({ year, period: Period.EVALUATION }),
              push: router.push,
            }),
        }}
      />
    </InfoPanel>
  );
};
