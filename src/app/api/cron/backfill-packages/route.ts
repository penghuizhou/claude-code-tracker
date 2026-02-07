import { NextRequest, NextResponse } from "next/server";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { ingestPackageDownloads } from "@/lib/package-downloads";
import { DATE_FORMAT } from "@/lib/constants";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
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
      dates = [date];
    } else if (from && to) {
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

    if (dates.length > 60) {
      return NextResponse.json(
        { error: "Maximum 60 days per backfill request" },
        { status: 400 }
      );
    }

    const results = [];
    for (const d of dates) {
      const start = Date.now();
      try {
        const pkgResults = await ingestPackageDownloads(d);
        const durationMs = Date.now() - start;
        const totalDownloads = pkgResults.reduce((s, r) => s + r.downloads, 0);
        results.push({ date: d, status: "success", totalDownloads, durationMs });
      } catch (err) {
        const durationMs = Date.now() - start;
        results.push({
          date: d,
          status: "error",
          error: err instanceof Error ? err.message : String(err),
          durationMs,
        });
      }
    }

    return NextResponse.json({
      message: `Backfilled packages for ${dates.length} day(s)`,
      results,
    });
  } catch (err) {
    console.error("Package backfill error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
