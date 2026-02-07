"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="text-muted-foreground mt-2 text-center">
        An error occurred while loading the dashboard.
      </p>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </main>
  );
}
