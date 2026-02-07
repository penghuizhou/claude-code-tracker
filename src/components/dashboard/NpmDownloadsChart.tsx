"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

interface PackageTimeSeries {
  packageName: string;
  data: Array<{ date: string; downloads: number }>;
}

interface NpmDownloadsChartProps {
  data: PackageTimeSeries[];
}

// Map raw package names to safe CSS keys
const PKG_META: Record<string, { key: string; label: string; color: string }> = {
  openai: { key: "npm_openai", label: "openai", color: "hsl(160, 60%, 45%)" },
  "@anthropic-ai/sdk": { key: "npm_anthropic", label: "anthropic", color: "hsl(262, 83%, 58%)" },
  "@langchain/core": { key: "npm_langchain", label: "langchain", color: "hsl(35, 90%, 55%)" },
  ai: { key: "npm_vercelai", label: "vercel/ai", color: "hsl(210, 70%, 50%)" },
  "@google/generative-ai": { key: "npm_googlegenai", label: "google-genai", color: "hsl(4, 80%, 55%)" },
  "@aws-sdk/client-bedrock-runtime": { key: "npm_bedrock", label: "bedrock", color: "hsl(30, 70%, 50%)" },
};

function getKey(pkg: string) {
  return PKG_META[pkg]?.key ?? pkg.replace(/[^a-zA-Z0-9]/g, "_");
}

export function NpmDownloadsChart({ data }: NpmDownloadsChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>npm AI SDK Downloads (Daily)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-[300px] items-center justify-center">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build unified date array with safe keys
  const dateMap = new Map<string, Record<string, number>>();
  for (const series of data) {
    const key = getKey(series.packageName);
    for (const point of series.data) {
      if (!dateMap.has(point.date)) {
        dateMap.set(point.date, {});
      }
      dateMap.get(point.date)![key] = point.downloads;
    }
  }

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pkgs]) => ({
      date,
      label: format(parseISO(date), "MMM d"),
      ...pkgs,
    }));

  const chartConfig: ChartConfig = {};
  for (const series of data) {
    const meta = PKG_META[series.packageName];
    const key = getKey(series.packageName);
    chartConfig[key] = {
      label: meta?.label ?? series.packageName,
      color: meta?.color ?? "hsl(0, 0%, 50%)",
    };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>npm AI SDK Downloads (Daily)</CardTitle>
      </CardHeader>
      <CardContent>
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
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1000
                    ? `${(v / 1000).toFixed(0)}k`
                    : String(v)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    typeof value === "number"
                      ? value.toLocaleString()
                      : String(value)
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {data.map((series) => {
              const key = getKey(series.packageName);
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={false}
                />
              );
            })}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
