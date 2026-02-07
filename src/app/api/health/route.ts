import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dailyStats } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const latest = await db
      .select({ date: dailyStats.date })
      .from(dailyStats)
      .orderBy(desc(dailyStats.date))
      .limit(1);

    return NextResponse.json({
      status: "ok",
      latestDate: latest[0]?.date || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
