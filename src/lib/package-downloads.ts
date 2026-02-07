import { db } from "./db";
import { packageDownloads } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// AI SDK packages to track
export const NPM_PACKAGES = [
  "openai",
  "@anthropic-ai/sdk",
  "@langchain/core",
  "ai", // Vercel AI SDK
  "@google/generative-ai",
  "@aws-sdk/client-bedrock-runtime",
] as const;

export const PYPI_PACKAGES = [
  "openai",
  "anthropic",
  "langchain-core",
  "google-generativeai",
  "boto3", // AWS SDK (baseline)
  "transformers", // Hugging Face
] as const;

interface NpmPointResponse {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

interface PyPIOverallResponse {
  data: Array<{
    category: string;
    date: string;
    downloads: number;
  }>;
  package: string;
  type: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchNpmDownloads(
  pkg: string,
  date: string
): Promise<number> {
  const url = `https://api.npmjs.org/downloads/point/${date}/${encodeURIComponent(pkg)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "claude-code-tracker" },
  });

  if (!res.ok) {
    if (res.status === 404) return 0; // package didn't exist yet
    throw new Error(`npm API error ${res.status} for ${pkg}`);
  }

  const data: NpmPointResponse = await res.json();
  return data.downloads;
}

async function fetchPyPIDownloads(
  pkg: string,
  date: string
): Promise<number> {
  const url = `https://pypistats.org/api/packages/${encodeURIComponent(pkg)}/overall?start_date=${date}&end_date=${date}&mirrors=true`;
  const res = await fetch(url, {
    headers: { "User-Agent": "claude-code-tracker" },
  });

  if (!res.ok) {
    if (res.status === 404) return 0;
    throw new Error(`PyPI stats API error ${res.status} for ${pkg}`);
  }

  const data: PyPIOverallResponse = await res.json();
  // Sum "with_mirrors" category for the date
  const row = data.data.find(
    (d) => d.category === "with_mirrors" && d.date === date
  );
  return row?.downloads ?? 0;
}

export interface PackageDownloadResult {
  registry: string;
  packageName: string;
  downloads: number;
}

/**
 * Fetch and store package download counts for a given date.
 * Makes ~12 API calls (6 npm + 6 PyPI) with small delays.
 */
export async function ingestPackageDownloads(
  date: string
): Promise<PackageDownloadResult[]> {
  const results: PackageDownloadResult[] = [];
  const delay = 500; // npm/PyPI are more generous with rate limits

  // npm packages
  for (const pkg of NPM_PACKAGES) {
    try {
      const downloads = await fetchNpmDownloads(pkg, date);
      results.push({ registry: "npm", packageName: pkg, downloads });
    } catch (err) {
      console.error(`Failed to fetch npm/${pkg} for ${date}:`, err);
      results.push({ registry: "npm", packageName: pkg, downloads: 0 });
    }
    await sleep(delay);
  }

  // PyPI packages
  for (const pkg of PYPI_PACKAGES) {
    try {
      const downloads = await fetchPyPIDownloads(pkg, date);
      results.push({ registry: "pypi", packageName: pkg, downloads });
    } catch (err) {
      console.error(`Failed to fetch pypi/${pkg} for ${date}:`, err);
      results.push({ registry: "pypi", packageName: pkg, downloads: 0 });
    }
    await sleep(delay);
  }

  // Store in database
  for (const r of results) {
    // Check if row already exists
    const existing = await db
      .select()
      .from(packageDownloads)
      .where(
        and(
          eq(packageDownloads.date, date),
          eq(packageDownloads.registry, r.registry),
          eq(packageDownloads.packageName, r.packageName)
        )
      );

    if (existing.length > 0) {
      // Update
      await db
        .update(packageDownloads)
        .set({ downloads: r.downloads, createdAt: new Date().toISOString() })
        .where(
          and(
            eq(packageDownloads.date, date),
            eq(packageDownloads.registry, r.registry),
            eq(packageDownloads.packageName, r.packageName)
          )
        );
    } else {
      // Insert
      await db.insert(packageDownloads).values({
        date,
        registry: r.registry,
        packageName: r.packageName,
        downloads: r.downloads,
      });
    }
  }

  return results;
}
