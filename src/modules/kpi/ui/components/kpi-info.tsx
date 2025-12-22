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

import { useGetTask } from "@/modules/tasks/api/use-get-task";
import { useCreateTask } from "@/modules/tasks/api/use-create-task";

import { isInRange } from "@/modules/tasks/utils";
import { STATUS_VARIANTS } from "@/modules/tasks/constant";

const chartData = [
  { approval: "Owner", score: 186 },
  { approval: "Checker", score: 305 },
  { approval: "Approver", score: 237 },
];
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
  const router = useRouter();

  const createTask = useCreateTask();
  const { data: form } = useGetTask(2025, FormType.KPI);

  console.log(form.task.evaluation);

  return (
    <section>
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
      </div>
      <div className="px-0 z-1 relative flex flex-col rounded-lg bg-[#202020e6] shadow-[unset] backdrop-blur-[48px] min-h-0 max-h-full py-0">
        <div className="basis-0 grow px-9 pt-8 pb-6 border-b border-border">
          <div className="flex flex-col justify-center min-h-full text-tertiary overflow-hidden text-sm">
            <Event
              dueDate="Jan - Mar"
              title="KPI Definition"
              description="Define measurable goals aligned with team and company priorities"
              status={STATUS_VARIANTS[form.task.draft?.status!]}
              buttonCtx={{
                active: form.task.draft !== null,
                label: !!form.task.draft ? "View" : "Create",
                onClick: () => {
                  if (!isInRange(year, 1, 3, 2025)) {
                    toast.error(
                      "You can only define KPIs from January to March",
                    );
                    return;
                  }

                  if (!!form.task.draft) {
                    router.push(
                      `/performance/kpi/${form.task.draft.formId}/definition`,
                    );
                  } else {
                    createTask({
                      year,
                      type: FormType.KPI,
                      period: Period.IN_DRAFT,
                    });
                  }
                },
              }}
            />
            <Event
              dueDate="Jan - Dec"
              title="Evaluation"
              status={STATUS_VARIANTS[form.task.evaluation?.status!]}
              description="Assessment of progress towards defined KPIs"
              buttonCtx={{
                active: form.task.draft?.status === Status.DONE,
                label: !!form.task.evaluation ? "Evaluate" : "Create",
                onClick: () => {
                  if (!isInRange(year, 1, 12, 2025)) {
                    toast.error(
                      "You can only evaluate KPIs from January to December",
                    );
                    return;
                  }

                  if (!!form.task.evaluation) {
                    router.push(
                      `/performance/kpi/${form.task.evaluation.formId}/evaluation`,
                    );
                  } else {
                    createTask({
                      year,
                      type: FormType.KPI,
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
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid
                  strokeDasharray="1.25 4"
                  vertical={false}
                  stroke="var(--color-description)"
                />
                <XAxis
                  dataKey="approval"
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
                <Bar dataKey="score" radius={4} fill="#5e9fe8" barSize={80}>
                  <LabelList
                    dataKey="score"
                    position="top"
                    fill="var(--color-primary)"
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
