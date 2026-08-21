"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  employee: {
    label: "Owner",
    color: "var(--color-chart-1)",
  },
  evaluator1: {
    label: "Checker",
    color: "var(--color-chart-2)",
  },
  evaluator2: {
    label: "Approver",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

const series = [
  { dataKey: "employee", color: chartConfig.employee.color },
  { dataKey: "evaluator1", color: chartConfig.evaluator1.color },
  { dataKey: "evaluator2", color: chartConfig.evaluator2.color },
] as const;

export type MeritChartPoint = {
  period: string;
  employee: number;
  evaluator1: number;
  evaluator2: number;
};

export function MeritScoreChart({ data }: { data: MeritChartPoint[] }) {
  return (
    <div className="flex w-full h-full flex-col justify-center">
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={data}>
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
            cursor={{ opacity: 0.6 }}
          />
          {series.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.color}
              radius={4}
              barSize={64}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
