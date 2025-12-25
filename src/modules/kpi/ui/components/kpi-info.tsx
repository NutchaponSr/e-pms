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
import { Period, Status } from "@/generated/prisma/enums";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { Event } from "@/components/event";

import { isInRange } from "@/modules/tasks/utils";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { Button } from "@/components/ui/button";
import { useExportKpi } from "../../api/use-export-kpi";
import { useCreateKpiTask } from "../../api/use-create-kpi-task";

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

  const { mutation: exportKpi, ctx: exportKpiCtx } = useExportKpi();
  const { mutation: createKpiTask, ctx: createKpiTaskCtx } = useCreateKpiTask();

  const { data } = useSuspenseQuery(trpc.kpi.getInfo.queryOptions({ year }));

  return (
    <section className="h-full flex flex-col">
      <div className="shrink-0 flex justify-between items-center h-8 pb-3.5 mx-2">
        <div className="contents">
          <div className="flex items-center text-xs font-medium text-secondary shrink-0 max-w-full">
            <div className="flex items-center justify-center size-4 me-2">
              <TargetIcon className="size-3.5 shrink-0 block text-secondary" />
            </div>
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">
              KPI Bonus
            </span>
          </div>
        </div>

        {!!data.task.draft && (
          <Button variant="secondary" size="sm" onClick={() => exportKpi({ id: data.task.draft!.formId })} disabled={exportKpiCtx.isPending}>
            Export
          </Button>
        )}
      </div>
      <div className="px-0 z-1 relative flex flex-col rounded-lg bg-[#202020e6] shadow-[unset] backdrop-blur-[48px] min-h-0 max-h-full py-0 flex-1">
        <div className="basis-0 grow px-9 pt-8 pb-6 border-b border-border">
          <div className="flex flex-col justify-start min-h-full text-tertiary overflow-hidden text-sm">
            <Event
              dueDate="Jan - Mar"
              title="KPI Definition"
              description="Define measurable goals aligned with team and company priorities"
              status={STATUS_VARIANTS[data.task.draft?.status!]}
              buttonCtx={{
                disabled: createKpiTaskCtx.isPending,
                active: data.task.draft !== null,
                label: !!data.task.draft ? "View" : "Create",
                onClick: () => {
                  if (!isInRange(year, 1, 3, 2025)) {
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
              dueDate="Jan - Dec"
              title="Evaluation"
              status={STATUS_VARIANTS[data.task.evaluation?.status!]}
              description="Assessment of progress towards defined KPIs"
              buttonCtx={{
                disabled: createKpiTaskCtx.isPending,
                active: data.task.draft?.status === Status.DONE,
                label: !!data.task.evaluation ? "Evaluate" : "Create",
                onClick: () => {
                  if (!isInRange(year, 1, 12, 2025)) {
                    toast.error(
                      "You can only evaluate KPIs from January to December",
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
                  tick={{ fill: "var(--color-primary)" }}
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
