import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { packageDownloads } from "@/db/schema";
import { asc, eq, gte, and } from "drizzle-orm";
import { format, subDays, subYears } from "date-fns";
import { DATE_FORMAT } from "@/lib/constants";

export const revalidate = 3600;

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

export interface PackageStatsResponse {
  npm: PackageTimeSeries[];
  pypi: PackageTimeSeries[];
}

export interface PackageTimeSeries {
  packageName: string;
  data: Array<{ date: string; downloads: number }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const startDate = getStartDate(range);

    // Fetch all package download data
    const whereClause = startDate
      ? gte(packageDownloads.date, startDate)
      : undefined;

    const rows = whereClause
      ? await db
          .select()
          .from(packageDownloads)
          .where(whereClause)
          .orderBy(asc(packageDownloads.date))
      : await db
          .select()
          .from(packageDownloads)
          .orderBy(asc(packageDownloads.date));

    // Group by registry and package
    const npmMap = new Map<string, Array<{ date: string; downloads: number }>>();
    const pypiMap = new Map<string, Array<{ date: string; downloads: number }>>();

    for (const row of rows) {
      const map = row.registry === "npm" ? npmMap : pypiMap;
      if (!map.has(row.packageName)) {
        map.set(row.packageName, []);
      }
      map.get(row.packageName)!.push({
        date: row.date,
        downloads: row.downloads,
      });
    }

    const toTimeSeries = (
      map: Map<string, Array<{ date: string; downloads: number }>>
    ): PackageTimeSeries[] =>
      Array.from(map.entries()).map(([packageName, data]) => ({
        packageName,
        data,
      }));

    const response: PackageStatsResponse = {
      npm: toTimeSeries(npmMap),
      pypi: toTimeSeries(pypiMap),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Package stats API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
