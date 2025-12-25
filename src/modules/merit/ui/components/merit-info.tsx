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

import { FormType, Period, Status } from "@/generated/prisma/enums";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { Event } from "@/components/event";

import { useCreateTask } from "@/modules/tasks/api/use-create-task";

import { isInRange } from "@/modules/tasks/utils";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Select, SelectValue, SelectTrigger, SelectItem, SelectContent } from "@/components/ui/select";
import { useExportMerit } from "../../api/use-export-merit";
import { Button } from "@/components/ui/button";


const chartConfig = {
  approval: {
    label: "Approval",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

interface Props {
  year: number;
}

export const MeritInfo = ({ year }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState<"competency" | "culture">("competency");

  const createTask = useCreateTask();
  const { data } = useSuspenseQuery(trpc.merit.getInfo.queryOptions({ year }));
  const { mutation: exportMerit, ctx: exportMeritCtx } = useExportMerit();

  const chartData = data.chart.map((item) => ({
    period: item.period,
    owner: item[selectedCategory].owner,
    checker: item[selectedCategory].checker,
    approver: item[selectedCategory].approver,
  }));

  return (
    <section className="h-full flex flex-col">
      <div className="shrink-0 flex justify-between items-center h-8 pb-3.5 mx-2">
        <div className="contents">
          <div className="flex items-center text-xs font-medium text-secondary shrink-0 max-w-full">
            <div className="flex items-center justify-center size-4 me-2">
              <TargetIcon className="size-3.5 shrink-0 block text-secondary" />
            </div>
            <span className="whitespace-nowrap overflow-hidden text-ellipsis">
              Merit
            </span>
          </div>
        </div>

        {!!data.task.draft && (
          <Button variant="secondary" size="xs" onClick={() => exportMerit({ id: data.task.draft!.formId })} disabled={exportMeritCtx.isPending}>
            Export
          </Button>
        )}
      </div>
      <div className="px-0 z-1 relative flex flex-col rounded-lg bg-[#202020e6] shadow-[unset] backdrop-blur-[48px] min-h-0 max-h-full py-0 flex-1">
        <div className="basis-0 grow px-9 pt-8 pb-6 border-b border-border">
          <div className="flex flex-col justify-start min-h-full text-tertiary overflow-hidden text-sm">
            <Event
              dueDate="Jan - Mar"
              title="Merit Definition"
              description="Define measurable goals that will inform merit evaluation"
              status={STATUS_VARIANTS[data.task.draft?.status!]}
              buttonCtx={{
                active: data.task.draft !== null,
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
                      type: FormType.MERIT,
                      period: Period.IN_DRAFT,
                    });
                  }
                },
              }}
            />
            <Event
              dueDate="Jan - Jun"
              title="Evaluation 1st"
              status={STATUS_VARIANTS[data.task.evaluation1st?.status!]}
              description="Mid-year merit review to assess progress and performance"
              buttonCtx={{
                active: data.task.draft?.status === Status.DONE,
                label: !!data.task.evaluation1st ? "Evaluate" : "Create",
                onClick: () => {
                  if (!isInRange(year, 1, 12, 2025)) {
                    toast.error(
                      "You can only evaluate Merit from January to June",
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
                      type: FormType.MERIT,
                      period: Period.EVALUATION_1ST,
                    });
                  }
                },
              }}
            />
            <Event
              dueDate="Jul - Dec"
              title="Evaluation 2nd"
              status={STATUS_VARIANTS[data.task.evaluation2nd?.status!]}
              description="Year-end merit review for final performance assessment and bonus eligibility"
              buttonCtx={{
                active: data.task.evaluation1st?.status === Status.DONE,
                label: !!data.task.evaluation2nd ? "Evaluate" : "Create",
                onClick: () => {
                  if (!isInRange(year, 1, 12, 2025)) {
                    toast.error(
                      "You can only evaluate Merit from January to June",
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
                      type: FormType.MERIT,
                      period: Period.EVALUATION_1ST,
                    });
                  }
                },
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
                {Object.keys(chartData[0]).slice(1).map((key, index) => (
                  <Bar
                    key={index}
                    dataKey={key as string}
                    fill="#5e9fe8"
                    radius={4}
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
