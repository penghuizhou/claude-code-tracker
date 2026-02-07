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

interface ModelBreakdownChartProps {
  data: DailyStatRow[];
}

const chartConfig = {
  claudeCommits: {
    label: "Claude",
    color: "hsl(262, 83%, 58%)",
  },
  cursorCommits: {
    label: "Cursor",
    color: "hsl(35, 90%, 55%)",
  },
  copilotCommits: {
    label: "Copilot",
    color: "hsl(210, 70%, 50%)",
  },
  geminiCommits: {
    label: "Gemini",
    color: "hsl(150, 60%, 45%)",
  },
  devinCommits: {
    label: "Devin",
    color: "hsl(0, 70%, 55%)",
  },
} satisfies ChartConfig;

export function ModelBreakdownChart({ data }: ModelBreakdownChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    label: format(parseISO(d.date), "MMM d"),
    claudeCommits: d.claudeCommits,
    cursorCommits: d.cursorCommits,
    copilotCommits: d.copilotCommits,
    geminiCommits: d.geminiCommits,
    devinCommits: d.devinCommits,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Tool Breakdown (Daily Commits)</CardTitle>
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
                dataKey="claudeCommits"
                stackId="a"
                fill="var(--color-claudeCommits)"
              />
              <Bar
                dataKey="cursorCommits"
                stackId="a"
                fill="var(--color-cursorCommits)"
              />
              <Bar
                dataKey="copilotCommits"
                stackId="a"
                fill="var(--color-copilotCommits)"
              />
              <Bar
                dataKey="geminiCommits"
                stackId="a"
                fill="var(--color-geminiCommits)"
              />
              <Bar
                dataKey="devinCommits"
                stackId="a"
                fill="var(--color-devinCommits)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
