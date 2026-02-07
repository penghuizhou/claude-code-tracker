"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyStatRow } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface AIReviewChartProps {
  data: DailyStatRow[];
}

const chartConfig = {
  coderabbitReviews: {
    label: "CodeRabbit",
    color: "hsl(30, 80%, 55%)",
  },
  copilotReviews: {
    label: "Copilot",
    color: "hsl(210, 70%, 50%)",
  },
  sourceryReviews: {
    label: "Sourcery",
    color: "hsl(280, 60%, 55%)",
  },
} satisfies ChartConfig;

export function AIReviewChart({ data }: AIReviewChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    label: format(parseISO(d.date), "MMM d"),
    coderabbitReviews: d.coderabbitReviews,
    copilotReviews: d.copilotReviews,
    sourceryReviews: d.sourceryReviews,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Code Review (PRs Reviewed / Day)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            No data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="coderabbitReviews"
                stackId="a"
                fill="var(--color-coderabbitReviews)"
              />
              <Bar
                dataKey="copilotReviews"
                stackId="a"
                fill="var(--color-copilotReviews)"
              />
              <Bar
                dataKey="sourceryReviews"
                stackId="a"
                fill="var(--color-sourceryReviews)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
