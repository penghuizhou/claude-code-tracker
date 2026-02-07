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

interface BotCommitsChartProps {
  data: DailyStatRow[];
}

const chartConfig = {
  claudeCodeGenerated: {
    label: "Claude Code (watermark)",
    color: "hsl(262, 83%, 58%)",
  },
  devinBotCommits: {
    label: "Devin Bot",
    color: "hsl(0, 70%, 55%)",
  },
  dependabotCommits: {
    label: "Dependabot",
    color: "hsl(210, 50%, 45%)",
  },
  renovateCommits: {
    label: "Renovate",
    color: "hsl(170, 60%, 40%)",
  },
} satisfies ChartConfig;

export function BotCommitsChart({ data }: BotCommitsChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    label: format(parseISO(d.date), "MMM d"),
    claudeCodeGenerated: d.claudeCodeGenerated,
    devinBotCommits: d.devinBotCommits,
    dependabotCommits: d.dependabotCommits,
    renovateCommits: d.renovateCommits,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bot & Automation Commits (Daily)</CardTitle>
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
                dataKey="claudeCodeGenerated"
                stackId="a"
                fill="var(--color-claudeCodeGenerated)"
              />
              <Bar
                dataKey="devinBotCommits"
                stackId="a"
                fill="var(--color-devinBotCommits)"
              />
              <Bar
                dataKey="dependabotCommits"
                stackId="a"
                fill="var(--color-dependabotCommits)"
              />
              <Bar
                dataKey="renovateCommits"
                stackId="a"
                fill="var(--color-renovateCommits)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
