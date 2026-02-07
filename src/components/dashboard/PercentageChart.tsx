"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
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

interface PercentageChartProps {
  data: DailyStatRow[];
}

const chartConfig = {
  claudePercentage: {
    label: "Claude %",
    color: "hsl(262, 83%, 58%)",
  },
} satisfies ChartConfig;

export function PercentageChart({ data }: PercentageChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    claudePercentage: Math.round(d.claudePercentage * 100) / 100,
    label: format(parseISO(d.date), "MMM d"),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claude Share of All Commits (%)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            No data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={chartData}>
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
                tickFormatter={(v) => `${v}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value) => [`${value}%`, "Claude Share"]}
                  />
                }
              />
              <ReferenceLine
                y={4}
                stroke="hsl(0, 60%, 50%)"
                strokeDasharray="5 5"
                label={{ value: "~4% (SemiAnalysis)", position: "right", fill: "hsl(0, 60%, 50%)", fontSize: 12 }}
              />
              <Line
                dataKey="claudePercentage"
                type="monotone"
                stroke="var(--color-claudePercentage)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
