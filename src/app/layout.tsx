import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Claude Code Commit Tracker",
  description:
    "Track Claude Code's growing footprint in public GitHub commits. Visualizing the trend from ~4% toward 20%+ by end of 2026.",
  openGraph: {
    title: "Claude Code Commit Tracker",
    description:
      "Track Claude Code's growing footprint in public GitHub commits.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Code Commit Tracker",
    description:
      "Track Claude Code's growing footprint in public GitHub commits.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
