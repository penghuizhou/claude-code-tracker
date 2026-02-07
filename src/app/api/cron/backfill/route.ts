import { NextRequest, NextResponse } from "next/server";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { ingestDate } from "@/lib/ingest";
import { DATE_FORMAT } from "@/lib/constants";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Require admin API key
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { from, to, date } = body as {
      from?: string;
      to?: string;
      date?: string;
    };

    let dates: string[];

    if (date) {
      // Single date backfill
      dates = [date];
    } else if (from && to) {
      // Date range backfill
      dates = eachDayOfInterval({
        start: parseISO(from),
        end: parseISO(to),
      }).map((d) => format(d, DATE_FORMAT));
    } else {
      return NextResponse.json(
        { error: 'Provide either "date" or "from" and "to" parameters' },
        { status: 400 }
      );
    }

    // Cap at 30 days per request
    if (dates.length > 30) {
      return NextResponse.json(
        { error: "Maximum 30 days per backfill request" },
        { status: 400 }
      );
    }

    const results = [];
    for (const d of dates) {
      const result = await ingestDate(d);
      results.push({ date: d, ...result });
    }

    return NextResponse.json({
      message: `Backfilled ${dates.length} day(s)`,
      results,
    });
  } catch (err) {
    console.error("Backfill error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
