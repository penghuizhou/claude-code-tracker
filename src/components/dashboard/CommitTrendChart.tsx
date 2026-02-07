"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyStatRow } from "@/lib/types";
import { format, parseISO } from "date-fns";

interface CommitTrendChartProps {
  data: DailyStatRow[];
}

const chartConfig = {
  claudeCommits: {
    label: "Claude Commits",
    color: "hsl(262, 83%, 58%)",
  },
} satisfies ChartConfig;

export function CommitTrendChart({ data }: CommitTrendChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    claudeCommits: d.claudeCommits,
    label: format(parseISO(d.date), "MMM d"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Claude Commits</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            No data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillClaude" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-claudeCommits)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-claudeCommits)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
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
              <ChartTooltip
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey="claudeCommits"
                type="monotone"
                fill="url(#fillClaude)"
                stroke="var(--color-claudeCommits)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
