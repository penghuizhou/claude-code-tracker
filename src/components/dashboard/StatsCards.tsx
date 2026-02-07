"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatsResponse } from "@/lib/types";

interface StatsCardsProps {
  summary: StatsResponse["summary"];
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function GrowthIndicator({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground text-xs">--</span>;
  const isPositive = value > 0;
  return (
    <span
      className={`text-xs font-medium ${
        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      }`}
    >
      {isPositive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export function StatsCards({ summary }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            All AI Commits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(summary.totalAllAiCommits)}
          </div>
          <p className="text-muted-foreground text-xs">
            {summary.allAiPercentage.toFixed(2)}% of {formatNumber(summary.totalAllCommits)} total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Claude Share
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.latestPercentage.toFixed(2)}%
          </div>
          <p className="text-muted-foreground text-xs">
            {formatNumber(summary.totalClaudeCommits)} commits (latest daily %)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            AI Code Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(summary.totalAllAiReviews)}
          </div>
          <p className="text-muted-foreground text-xs">
            PRs reviewed by AI bots
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            7d Growth
          </CardTitle>
          <GrowthIndicator value={summary.growth7d} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <GrowthIndicator value={summary.growth30d} />
          </div>
          <p className="text-muted-foreground text-xs">
            30d growth vs previous 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
