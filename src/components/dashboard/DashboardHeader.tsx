"use client";

import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./ThemeToggle";

interface DashboardHeaderProps {
  latestDate: string | null;
}

export function DashboardHeader({ latestDate }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Claude Code Commit Tracker
        </h1>
        <p className="text-muted-foreground mt-1">
          Tracking Claude Code&apos;s footprint in public GitHub commits
        </p>
      </div>
      <div className="flex items-center gap-2">
        {latestDate && (
          <Badge variant="secondary">Last updated: {latestDate}</Badge>
        )}
        <Badge variant="outline">
          Source: GH Archive
        </Badge>
        <ThemeToggle />
      </div>
    </div>
  );
}
