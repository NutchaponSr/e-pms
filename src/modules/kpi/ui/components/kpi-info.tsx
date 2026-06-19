import { toast } from "sonner";
import { TargetIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import { useTRPC } from "@/trpc/client";
import { Period, Status, UserRole } from "@/generated/prisma/enums";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { Event } from "@/components/event";

import {
  dayOfYear,
  getDefinitionTaskButtonLabel,
  getEvaluationTaskButtonLabel,
  isInRange,
} from "@/modules/tasks/utils";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { Button } from "@/components/ui/button";
import { useExportKpi } from "../../api/use-export-kpi";
import { useCreateKpiTask } from "../../api/use-create-kpi-task";
import { authClient } from "@/lib/auth-client";

const chartConfig = {
  approval: {
    label: "Approval",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

interface Props {
  year: number;
}

export const KpiInfo = ({ year }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const { mutation: exportKpi, ctx: exportKpiCtx } = useExportKpi();
  const { mutation: createKpiTask, ctx: createKpiTaskCtx } = useCreateKpiTask();

  const { data } = useSuspenseQuery(trpc.kpi.getInfo.queryOptions({ year }));

  const draftCompleted = data.task.draft?.status === Status.COMPLETED;

  return (
    <section className="h-full flex flex-col">
      <div className="shrink-0 flex justify-between items-center h-8 pb-3.5 mx-2">
        <div className="contents">
          <div className="flex items-center text-xs font-medium text-secondary shrink-0 max-w-full">
            <div className="flex items-center justify-center size-4 me-2">
              <TargetIcon className="size-4 shrink-0 block text-secondary" />
            </div>
            <span className="whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm">
              KPI Bonus
            </span>
          </div>
        </div>

        {/* {!!data.task.draft && (
          <Button variant="secondary" size="sm" onClick={() => exportKpi({ id: data.task.draft!.formId })} disabled={exportKpiCtx.isPending}>
            Export
          </Button>
        )} */}
      </div>
      <div className="px-0 z-1 relative flex flex-col rounded-lg bg-[#ffffffe6] dark:bg-[#202020e6] dark:shadow-[unset] backdrop-blur-[48px] min-h-0 max-h-full py-0 flex-1 shadow-[0_12px_32px_0_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.05)]">
        <div className="basis-0 grow px-9 pt-8 pb-6 border-b border-border">
          <div className="flex flex-col justify-start min-h-full text-tertiary overflow-hidden text-sm">
            <Event
              title="KPI Setting"
              description="Define measurable goals aligned with team and company priorities"
              status={STATUS_VARIANTS[data.task.draft?.status!]}
              buttonCtx={{
                disabled: createKpiTaskCtx.isPending,
                active: isInRange(year, 1, dayOfYear(year, 4, 3), 2026),
                label: getDefinitionTaskButtonLabel(data.task.draft),
                onClick: () => {
                  if (!isInRange(year, 1, dayOfYear(year, 4, 3), 2026)) {
                    toast.error(
                      "You can only define KPIs from January to March",
                    );
                    return;
                  }

                  if (!!data.task.draft) {
                    router.push(
                      `/performance/kpi/${data.task.draft.formId}/definition`,
                    );
                  } else {
                    createKpiTask({
                      year,
                      period: Period.IN_DRAFT,
                    });
                  }
                },
              }}
            />
            <Event
              title="Year-end Evaluation"
              status={STATUS_VARIANTS[data.task.evaluation?.status!]}
              description="Measures achievement based on actual performance results"
              buttonCtx={{
                disabled: createKpiTaskCtx.isPending,
                active:
                  draftCompleted &&
                  isInRange(year, dayOfYear(year, 11, 1), dayOfYear(year, 12, 31)),
                label: getEvaluationTaskButtonLabel(data.task.evaluation),
                onClick: () => {
                  if (
                    !isInRange(year, dayOfYear(year, 11, 1), dayOfYear(year, 12, 31), 2025) &&
                    process.env.NODE_ENV !== "development"
                  ) {
                    toast.error(
                      "You can only evaluate KPIs from November to December",
                    );
                    return;
                  }

                  if (!draftCompleted) {
                    toast.error(
                      "Complete KPI Setting before starting Year-end Evaluation",
                    );
                    return;
                  }

                  if (!!data.task.evaluation) {
                    router.push(
                      `/performance/kpi/${data.task.evaluation.formId}/evaluation`,
                    );
                  } else {
                    createKpiTask({
                      year,
                      period: Period.EVALUATION,
                    });
                  }
                },
              }}
            />
          </div>
        </div>
        <div className="basis-0 grow px-9 pb-8 pt-6">
          <div className="flex w-full h-full flex-col justify-center">
            <ChartContainer config={chartConfig}>
              <BarChart 
                accessibilityLayer 
                data={data.chart}
                margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="1.25 4"
                  vertical={false}
                  stroke="var(--color-description)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  tickMargin={8}
                  tick={{ fill: "var(--color-chart)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-primary)" }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel />}
                  cursor={{
                    opacity: 0.6,
                  }}
                />
                <Bar 
                  dataKey="score" 
                  radius={4} 
                  fill="#5e9fe8" 
                  barSize={64}
                >
                  <LabelList
                    dataKey="score"
                    position="top"
                    fill="var(--color-primary)"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </section>
  );
};
