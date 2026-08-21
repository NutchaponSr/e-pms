"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Event } from "@/components/event";
import { InfoPanel } from "@/components/info-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Period, Status } from "@/generated/prisma/enums";
import { getTaskStatus } from "@/modules/tasks/constant";
import { openPeriodTask } from "@/modules/tasks/ui/open-period-task";
import {
  getDefinitionTaskButtonLabel,
  getEvaluationTaskButtonLabel,
} from "@/modules/tasks/utils";
import { isWindowActive } from "@/modules/tasks/window-utils";
import { useTRPC } from "@/trpc/client";
import { useCreateMeritTask } from "../../api/use-create-merit-task";

const MeritScoreChart = dynamic(() =>
  import("./merit-score-chart").then((mod) => mod.MeritScoreChart),
);

type MeritCategory = "competency" | "culture";

interface Props {
  year: number;
}

export const MeritInfo = ({ year }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] =
    useState<MeritCategory>("competency");
  const { data } = useSuspenseQuery(trpc.merit.getInfo.queryOptions({ year }));
  const { mutation: createTask, ctx: createMeritTaskCtx } =
    useCreateMeritTask();

  const draftCompleted = data.task.draft?.status === Status.COMPLETED;
  const evaluation1stCompleted =
    data.task.evaluation1st?.status === Status.COMPLETED;
  const isCurrentYear = year === new Date().getFullYear();
  const draftActive = isCurrentYear && isWindowActive(data.windows.draft);
  const evaluation1stActive = isWindowActive(data.windows.evaluation1st);
  const evaluation2ndActive = isWindowActive(data.windows.evaluation2nd);

  const chartData = data.chart.map((item) => ({
    period: item.period,
    ...item[selectedCategory],
  }));

  return (
    <InfoPanel
      title="KPI Merit"
      chart={
        <>
          <div className="flex justify-end">
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                if (value === "competency" || value === "culture") {
                  setSelectedCategory(value);
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="competency">Competency</SelectItem>
                <SelectItem value="culture">Culture</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <MeritScoreChart data={chartData} />
        </>
      }
    >
      <Event
        title="KPI Setting"
        description="Define behaviors indicators that align with expected competencies and company culture"
        status={getTaskStatus(data.task.draft?.status)}
        buttonCtx={{
          disabled: createMeritTaskCtx.isPending,
          active: draftActive,
          label: getDefinitionTaskButtonLabel(data.task.draft),
          onClick: () =>
            openPeriodTask({
              window: data.windows.draft,
              windowLabel: "KPI Setting",
              href: data.task.draft
                ? `/performance/merit/${data.task.draft.formId}/definition`
                : undefined,
              onCreate: () => createTask({ year, period: Period.IN_DRAFT }),
              push: router.push,
            }),
        }}
      />
      <Event
        title="Mid-year Evaluation"
        description="Mid-year review to assess performance progress and behavioral expectations"
        status={getTaskStatus(data.task.evaluation1st?.status)}
        buttonCtx={{
          disabled: createMeritTaskCtx.isPending,
          active: draftCompleted && evaluation1stActive,
          label: getEvaluationTaskButtonLabel(data.task.evaluation1st),
          onClick: () =>
            openPeriodTask({
              window: data.windows.evaluation1st,
              windowLabel: "Mid-year Evaluation",
              blockedMessage: draftCompleted
                ? undefined
                : "Complete KPI Setting before starting Mid-year Evaluation",
              href: data.task.evaluation1st
                ? `/performance/merit/${data.task.evaluation1st.formId}/evaluation1st`
                : undefined,
              onCreate: () =>
                createTask({ year, period: Period.EVALUATION_1ST }),
              push: router.push,
            }),
        }}
      />
      <Event
        title="Year-end Evaluation"
        description="Year-end assessment of performance results and behavioral outcomes"
        status={getTaskStatus(data.task.evaluation2nd?.status)}
        buttonCtx={{
          disabled: createMeritTaskCtx.isPending,
          active: draftCompleted && evaluation1stCompleted && evaluation2ndActive,
          label: getEvaluationTaskButtonLabel(data.task.evaluation2nd),
          onClick: () =>
            openPeriodTask({
              window: data.windows.evaluation2nd,
              windowLabel: "Year-end Evaluation",
              blockedMessage: !draftCompleted
                ? "Complete KPI Setting before starting Year-end Evaluation"
                : evaluation1stCompleted
                  ? undefined
                  : "Complete Mid-year Evaluation before starting Year-end Evaluation",
              href: data.task.evaluation2nd
                ? `/performance/merit/${data.task.evaluation2nd.formId}/evaluation2nd`
                : undefined,
              onCreate: () =>
                createTask({ year, period: Period.EVALUATION_2ND }),
              push: router.push,
            }),
        }}
      />
    </InfoPanel>
  );
};
