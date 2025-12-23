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

export const MeritInfo = ({ year }: Props) => {
  const router = useRouter();

  const createTask = useCreateTask();
  const { data: form } = useGetTask(2025, FormType.MERIT);

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
      </div>
      <div className="px-0 z-1 relative flex flex-col rounded-lg bg-[#202020e6] shadow-[unset] backdrop-blur-[48px] min-h-0 max-h-full py-0 flex-1">
        <div className="basis-0 grow px-9 pt-8 pb-6 border-b border-border">
          <div className="flex flex-col justify-start min-h-full text-tertiary overflow-hidden text-sm">
            <Event
              dueDate="Jan - Mar"
              title="Merit Definition"
              description="Define measurable goals that will inform merit evaluation"
              status={STATUS_VARIANTS[form.task.draft?.status!]}
              buttonCtx={{
                active: form.task.draft !== null,
                label: !!form.task.draft ? "View" : "Create",
                onClick: () => {
                  if (!isInRange(year, 1, 3, 2025)) {
                    toast.error(
                      "You can only define Merit from January to March",
                    );
                    return;
                  }

                  if (!!form.task.draft) {
                    router.push(
                      `/performance/merit/${form.task.draft.formId}/definition`,
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
              status={STATUS_VARIANTS[form.task.evaluation1st?.status!]}
              description="Mid-year merit review to assess progress and performance"
              buttonCtx={{
                active: form.task.draft?.status === Status.DONE,
                label: !!form.task.evaluation1st ? "Evaluate" : "Create",
                onClick: () => {
                  if (!isInRange(year, 1, 12, 2025)) {
                    toast.error(
                      "You can only evaluate Merit from January to June",
                    );
                    return;
                  }

                  if (!!form.task.evaluation1st) {
                    router.push(
                      `/performance/merit/${form.task.evaluation1st.formId}/evaluation1st`,
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
              status={STATUS_VARIANTS[form.task.evaluation2nd?.status!]}
              description="Year-end merit review for final performance assessment and bonus eligibility"
              buttonCtx={{
                active: form.task.evaluation1st?.status === Status.DONE,
                label: !!form.task.evaluation2nd ? "Evaluate" : "Create",
                onClick: () => {
                  if (!isInRange(year, 1, 12, 2025)) {
                    toast.error(
                      "You can only evaluate Merit from January to June",
                    );
                    return;
                  }

                  if (!!form.task.evaluation2nd) {
                    router.push(
                      `/performance/merit/${form.task.evaluation2nd.formId}/evaluation2nd`,
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
