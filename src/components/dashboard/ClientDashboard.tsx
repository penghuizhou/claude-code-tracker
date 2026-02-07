"use client";

import { useState } from "react";
import useSWR from "swr";
import type { StatsResponse, DateRange } from "@/lib/types";
import { DashboardHeader } from "./DashboardHeader";
import { StatsCards } from "./StatsCards";
import { CommitTrendChart } from "./CommitTrendChart";
import { PercentageChart } from "./PercentageChart";
import { ModelBreakdownChart } from "./ModelBreakdownChart";
import { AIReviewChart } from "./AIReviewChart";
import { PRMentionsChart } from "./PRMentionsChart";
import { BotCommitsChart } from "./BotCommitsChart";
import { NpmDownloadsChart } from "./NpmDownloadsChart";
import { PyPIDownloadsChart } from "./PyPIDownloadsChart";
import { DateRangePicker } from "./DateRangePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface PackageTimeSeries {
  packageName: string;
  data: Array<{ date: string; downloads: number }>;
}

interface PackageStatsResponse {
  npm: PackageTimeSeries[];
  pypi: PackageTimeSeries[];
}

interface ClientDashboardProps {
  initialData: StatsResponse | null;
}

export function ClientDashboard({ initialData }: ClientDashboardProps) {
  const [range, setRange] = useState<DateRange>("all");

  const { data, error, isLoading } = useSWR<StatsResponse>(
    `/api/stats?range=${range}`,
    fetcher,
    {
      fallbackData: range === "30d" ? (initialData ?? undefined) : undefined,
      revalidateOnFocus: false,
      refreshInterval: 3600000,
    }
  );

  const { data: pkgData } = useSWR<PackageStatsResponse>(
    `/api/package-stats?range=${range}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 3600000,
    }
  );

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Failed to load data</h2>
          <p className="text-muted-foreground mt-2">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader latestDate={data.summary.latestDate} />

      <div className="flex items-center justify-between">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <StatsCards summary={data.summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CommitTrendChart data={data.daily} />
        <PercentageChart data={data.daily} />
      </div>

      <ModelBreakdownChart data={data.daily} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AIReviewChart data={data.daily} />
        <PRMentionsChart data={data.daily} />
      </div>

      <BotCommitsChart data={data.daily} />

      <Separator />

      <h2 className="text-xl font-semibold">AI SDK Adoption (Package Downloads)</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <NpmDownloadsChart data={pkgData?.npm ?? []} />
        <PyPIDownloadsChart data={pkgData?.pypi ?? []} />
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Data sourced from{" "}
        <a
          href="https://docs.github.com/en/rest/search"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          GitHub Search API
        </a>
        ,{" "}
        <a
          href="https://github.com/npm/registry/blob/main/docs/download-counts.md"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          npm
        </a>
        , and{" "}
        <a
          href="https://pypistats.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          PyPI Stats
        </a>
        . Commits identified by co-author trailers. Reviews &amp; PRs by bot
        activity and body mentions.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px]" />
        <Skeleton className="h-[380px]" />
      </div>
      <Skeleton className="h-[380px]" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px]" />
        <Skeleton className="h-[380px]" />
      </div>
      <Skeleton className="h-[380px]" />
      <Skeleton className="h-1" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px]" />
        <Skeleton className="h-[380px]" />
      </div>
    </div>
  );
}
