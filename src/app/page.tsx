import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import type { StatsResponse } from "@/lib/types";

async function getInitialStats(): Promise<StatsResponse | null> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/stats?range=30d`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Home() {
  const initialData = await getInitialStats();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ClientDashboard initialData={initialData} />
    </main>
  );
}
