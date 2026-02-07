export interface StatsResponse {
  summary: {
    totalClaudeCommits: number;
    totalAllCommits: number;
    overallPercentage: number;
    latestPercentage: number;
    latestDate: string | null;
    growth7d: number;
    growth30d: number;
    totalAllAiCommits: number;
    allAiPercentage: number;
    totalAllAiReviews: number;
    totalAllAiPRs: number;
  };
  daily: DailyStatRow[];
  weekly: WeeklyStatRow[];
}

export interface DailyStatRow {
  date: string;
  totalCommits: number;
  claudeCommits: number;
  opusCommits: number;
  sonnetCommits: number;
  haikuCommits: number;
  otherModelCommits: number;
  claudePercentage: number;
  copilotCommits: number;
  cursorCommits: number;
  geminiCommits: number;
  devinCommits: number;
  claudeCodeGenerated: number;
  devinBotCommits: number;
  dependabotCommits: number;
  renovateCommits: number;
  copilotReviews: number;
  coderabbitReviews: number;
  sourceryReviews: number;
  claudeCodePRs: number;
  copilotPRs: number;
  cursorPRs: number;
  devinPRs: number;
  allAiCommits: number;
  allAiPercentage: number;
  allAiReviews: number;
  allAiPRs: number;
  createdAt: string;
}

export interface WeeklyStatRow {
  weekStart: string;
  totalCommits: number;
  claudeCommits: number;
  opusCommits: number;
  sonnetCommits: number;
  haikuCommits: number;
  otherModelCommits: number;
  claudePercentage: number;
  copilotCommits: number;
  cursorCommits: number;
  geminiCommits: number;
  devinCommits: number;
  claudeCodeGenerated: number;
  devinBotCommits: number;
  dependabotCommits: number;
  renovateCommits: number;
  copilotReviews: number;
  coderabbitReviews: number;
  sourceryReviews: number;
  claudeCodePRs: number;
  copilotPRs: number;
  cursorPRs: number;
  devinPRs: number;
  allAiCommits: number;
  allAiPercentage: number;
  allAiReviews: number;
  allAiPRs: number;
  createdAt: string;
}

export type DateRange = "7d" | "30d" | "90d" | "1y" | "all";
