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

interface PRMentionsChartProps {
  data: DailyStatRow[];
}

const chartConfig = {
  claudeCodePRs: {
    label: "Claude Code",
    color: "hsl(262, 83%, 58%)",
  },
  copilotPRs: {
    label: "Copilot",
    color: "hsl(210, 70%, 50%)",
  },
  cursorPRs: {
    label: "Cursor",
    color: "hsl(35, 90%, 55%)",
  },
  devinPRs: {
    label: "Devin",
    color: "hsl(0, 70%, 55%)",
  },
} satisfies ChartConfig;

export function PRMentionsChart({ data }: PRMentionsChartProps) {
  const chartData = data.map((d) => ({
    date: d.date,
    label: format(parseISO(d.date), "MMM d"),
    claudeCodePRs: d.claudeCodePRs,
    copilotPRs: d.copilotPRs,
    cursorPRs: d.cursorPRs,
    devinPRs: d.devinPRs,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Tool Mentions in PRs (PRs / Day)</CardTitle>
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
                dataKey="claudeCodePRs"
                stackId="a"
                fill="var(--color-claudeCodePRs)"
              />
              <Bar
                dataKey="copilotPRs"
                stackId="a"
                fill="var(--color-copilotPRs)"
              />
              <Bar
                dataKey="cursorPRs"
                stackId="a"
                fill="var(--color-cursorPRs)"
              />
              <Bar
                dataKey="devinPRs"
                stackId="a"
                fill="var(--color-devinPRs)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
