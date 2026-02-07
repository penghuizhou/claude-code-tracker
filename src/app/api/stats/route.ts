import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyStats, weeklyStats } from "@/db/schema";
import { desc, asc, gte, sql } from "drizzle-orm";
import { format, subDays, subMonths, subYears } from "date-fns";
import { DATE_FORMAT } from "@/lib/constants";

export const revalidate = 3600; // ISR: revalidate every hour

function getStartDate(range: string): string | null {
  const now = new Date();
  switch (range) {
    case "7d":
      return format(subDays(now, 7), DATE_FORMAT);
    case "30d":
      return format(subDays(now, 30), DATE_FORMAT);
    case "90d":
      return format(subDays(now, 90), DATE_FORMAT);
    case "1y":
      return format(subYears(now, 1), DATE_FORMAT);
    case "all":
      return null;
    default:
      return format(subDays(now, 30), DATE_FORMAT);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const startDate = from || getStartDate(range);

    // Fetch daily stats
    let dailyQuery = db
      .select()
      .from(dailyStats)
      .orderBy(asc(dailyStats.date));

    const daily = startDate
      ? await dailyQuery.where(gte(dailyStats.date, startDate))
      : await dailyQuery;

    // Fetch weekly stats
    let weeklyQuery = db
      .select()
      .from(weeklyStats)
      .orderBy(asc(weeklyStats.weekStart));

    const weekly = startDate
      ? await weeklyQuery.where(gte(weeklyStats.weekStart, startDate))
      : await weeklyQuery;

    // Compute summary
    const totalClaudeCommits = daily.reduce(
      (sum, d) => sum + d.claudeCommits,
      0
    );
    const totalAllCommits = daily.reduce((sum, d) => sum + d.totalCommits, 0);
    const overallPercentage =
      totalAllCommits > 0 ? (totalClaudeCommits / totalAllCommits) * 100 : 0;

    // Latest day stats
    const latestDay = daily.length > 0 ? daily[daily.length - 1] : null;

    // Growth calculations
    const last7 = daily.slice(-7);
    const prev7 = daily.slice(-14, -7);
    const last30 = daily.slice(-30);
    const prev30 = daily.slice(-60, -30);

    const avgLast7 =
      last7.length > 0
        ? last7.reduce((s, d) => s + d.claudePercentage, 0) / last7.length
        : 0;
    const avgPrev7 =
      prev7.length > 0
        ? prev7.reduce((s, d) => s + d.claudePercentage, 0) / prev7.length
        : 0;
    const avgLast30 =
      last30.length > 0
        ? last30.reduce((s, d) => s + d.claudePercentage, 0) / last30.length
        : 0;
    const avgPrev30 =
      prev30.length > 0
        ? prev30.reduce((s, d) => s + d.claudePercentage, 0) / prev30.length
        : 0;

    const growth7d = avgPrev7 > 0 ? ((avgLast7 - avgPrev7) / avgPrev7) * 100 : 0;
    const growth30d =
      avgPrev30 > 0 ? ((avgLast30 - avgPrev30) / avgPrev30) * 100 : 0;

    const totalAllAiCommits = daily.reduce(
      (sum, d) => sum + d.allAiCommits,
      0
    );
    const allAiPercentage =
      totalAllCommits > 0
        ? (totalAllAiCommits / totalAllCommits) * 100
        : 0;

    const totalAllAiReviews = daily.reduce(
      (sum, d) => sum + d.allAiReviews,
      0
    );
    const totalAllAiPRs = daily.reduce(
      (sum, d) => sum + d.allAiPRs,
      0
    );

    const response = {
      summary: {
        totalClaudeCommits,
        totalAllCommits,
        overallPercentage: Math.round(overallPercentage * 100) / 100,
        latestPercentage: latestDay
          ? Math.round(latestDay.claudePercentage * 100) / 100
          : 0,
        latestDate: latestDay?.date || null,
        growth7d: Math.round(growth7d * 100) / 100,
        growth30d: Math.round(growth30d * 100) / 100,
        totalAllAiCommits,
        allAiPercentage: Math.round(allAiPercentage * 100) / 100,
        totalAllAiReviews,
        totalAllAiPRs,
      },
      daily,
      weekly,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Stats API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
