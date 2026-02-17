import { toast } from "sonner";
import { TargetIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import { FormType, Period, Status, UserRole } from "@/generated/prisma/enums";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { Event } from "@/components/event";

import { isInRange } from "@/modules/tasks/utils";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Select, SelectValue, SelectTrigger, SelectItem, SelectContent } from "@/components/ui/select";
import { useExportMerit } from "../../api/use-export-merit";
import { Button } from "@/components/ui/button";
import { useCreateMeritTask } from "../../api/use-create-merit-task";
import { authClient } from "@/lib/auth-client";

const chartConfig = {
  owner: {
    label: "Owner",
    color: "var(--color-chart-1)",
  },
  checker: {
    label: "Checker",
    color: "var(--color-chart-2)",
  },
  approver: {
    label: "Approver",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

interface Props {
  year: number;
}

export const MeritInfo = ({ year }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: session } = authClient.useSession();

  const isAdmin = session?.user.role === UserRole.ADMIN;

  const [selectedCategory, setSelectedCategory] = useState<"competency" | "culture">("competency");

  const { data } = useSuspenseQuery(trpc.merit.getInfo.queryOptions({ year }));

  const { mutation: exportMerit, ctx: exportMeritCtx } = useExportMerit();
  const { mutation: createTask, ctx: createMeritTaskCtx } = useCreateMeritTask();

  const chartData = data.chart.map((item) => ({
    period: item.period,
    employee: item[selectedCategory].employee,
    evaluator1: item[selectedCategory].evaluator1,
    evaluator2: item[selectedCategory].evaluator2,
  }));

  return (
    <section className="h-full flex flex-col">
      <div className="shrink-0 flex justify-between items-center h-8 pb-3.5 mx-2">
        <div className="contents">
          <div className="flex items-center text-xs font-medium text-secondary shrink-0 max-w-full">
            <div className="flex items-center justify-center size-4 me-2">
              <TargetIcon className="size-4 shrink-0 block text-secondary" />
            </div>
            <span className="whitespace-nowrap overflow-hidden text-ellipsis font-medium text-sm">
              KPI Merit
            </span>
          </div>
        </div>

        {!!data.task.draft && isAdmin && (
          <Button variant="secondary" size="sm" onClick={() => exportMerit({ id: data.task.draft!.formId })} disabled={exportMeritCtx.isPending}>
            Export
          </Button>
        )}
      </div>
      <div className="px-0 z-1 relative flex flex-col rounded-lg bg-[#ffffffe6] dark:bg-[#202020e6] dark:shadow-[unset] backdrop-blur-[48px] min-h-0 max-h-full py-0 flex-1 shadow-[0_12px_32px_0_rgba(0,0,0,0.02),0_0_0_1.25px_rgba(0,0,0,0.05)]">
        <div className="basis-0 grow px-9 pt-8 pb-6 border-b border-border">
          <div className="flex flex-col justify-start min-h-full text-tertiary overflow-hidden text-sm">
            <Event
              title="KPI Setting"
              description="Define behaviors indicators that align with expected competencies and company culture"
              status={STATUS_VARIANTS[data.task.draft?.status!]}
              buttonCtx={{  
                disabled: createMeritTaskCtx.isPending,
                active: isInRange(year, 1, 3) && data.task.draft?.status !== Status.COMPLETED,
                label: !!data.task.draft ? "View" : "Create",
                onClick: () => {
                  if (!isInRange(year, 1, 3, 2025)) {
                    toast.error(
                      "You can only define Merit from January to March",
                    );
                    return;
                  }

                  if (!!data.task.draft) {
                    router.push(
                      `/performance/merit/${data.task.draft.formId}/definition`,
                    );
                  } else {
                    createTask({
                      year,
                      period: Period.IN_DRAFT,
                    });
                  }
                },
              }}
            />
            <Event  
              title="Mid-year Evaluation"
              status={STATUS_VARIANTS[data.task.evaluation1st?.status!]}
              description="Mid-year review to assess performance progress and behavioral expectations"
              buttonCtx={{
                disabled: createMeritTaskCtx.isPending,
                active: (isInRange(year, 6, 7) && data.task.evaluation1st?.status !== Status.COMPLETED),
                label: !!data.task.evaluation1st ? "Evaluate" : "Create",
                onClick: () => {
                  if (!isInRange(year, 6, 7, 2025) && process.env.NODE_ENV !== "development") {
                    toast.error(
                      "You can only evaluate Merit from June to July",
                    );
                    return;
                  }

                  if (!!data.task.evaluation1st) {
                    router.push(
                      `/performance/merit/${data.task.evaluation1st.formId}/evaluation1st`,
                    );
                  } else {
                    createTask({
                      year,
                      period: Period.EVALUATION_1ST,
                    });
                  }
                },
              }}
            />
            <Event
              title="Year-end Evaluation"
              status={STATUS_VARIANTS[data.task.evaluation2nd?.status!]}
              description="Year-end assessment of performance results and behavioral outcomes"
              buttonCtx={{
                active: (isInRange(year, 11, 12) && data.task.evaluation2nd?.status !== Status.COMPLETED),
                label: !!data.task.evaluation2nd ? "Evaluate" : "Create",
                onClick: () => {
                  if (!isInRange(year, 11, 12, 2025)) {
                    toast.error(
                      "You can only evaluate Merit from November to December",
                    );
                    return;
                  }

                  if (!!data.task.evaluation2nd) {
                    router.push(
                      `/performance/merit/${data.task.evaluation2nd.formId}/evaluation2nd`,
                    );
                  } else {
                    createTask({
                      year,
                      period: Period.EVALUATION_2ND,
                    });
                  }
                },
                disabled: createMeritTaskCtx.isPending,
              }}
            />
          </div>
        </div>
        <div className="basis-0 grow px-9 pb-8 pt-6">
          <div className="flex justify-end">
            <Select
              value={selectedCategory}
              onValueChange={(value: "competency" | "culture") =>
                setSelectedCategory(value)
              }
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

          <div className="flex w-full h-full flex-col justify-center">
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid
                  strokeDasharray="1.25 4"
                  vertical={false}
                  stroke="var(--color-description)"
                />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  tickMargin={8}
                  tick={{ fill: "var(--color-chart)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-chart)" }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel />}
                  cursor={{
                    opacity: 0.6,
                  }}
                />
                {Object.keys(chartData[0]).slice(1).map((key, index) => (
                  <Bar
                    key={index}
                    dataKey={key as string}
                    fill={chartConfig[key as keyof typeof chartConfig]?.color}
                    radius={4}
                    barSize={64}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </section>
  );
};
