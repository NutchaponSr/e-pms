"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  approval: {
    label: "Approval",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

export type KpiChartPoint = {
  label: string;
  score: number | string;
};

export function KpiScoreChart({ data }: { data: KpiChartPoint[] }) {
  return (
    <div className="flex w-full h-full flex-col justify-center">
      <ChartContainer config={chartConfig}>
        <BarChart
          accessibilityLayer
          data={data}
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
            cursor={{ opacity: 0.6 }}
          />
          <Bar dataKey="score" radius={4} fill="#5e9fe8" barSize={64}>
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
  );
}
