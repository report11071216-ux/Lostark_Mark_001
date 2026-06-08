import type { CheckCycle, IssueSeverity, IssueState, SiteStatus } from "../types/db";

export const C = {
  bgGrad: "radial-gradient(1200px 600px at 80% -10%, rgba(45,212,191,0.06), transparent 60%), #0a0d12",
  panel: "#11151c",
  panel2: "#161b24",
  line: "rgba(148,163,184,0.12)",
  line2: "rgba(148,163,184,0.08)",
  text: "#e2e8f0",
  sub: "#8b96a8",
  faint: "#5b6577",
  accent: "#2dd4bf",
  ok: "#34d399",
  soon: "#fbbf24",
  late: "#f87171",
  adhoc: "#fb923c",
  running: "#60a5fa",
} as const;

export const btnPrimary = { background: C.accent, color: "#06241f" } as const;

export const STATUS: Record<SiteStatus, { label: string; color: string }> = {
  ok: { label: "정상", color: C.ok },
  soon: { label: "임박", color: C.soon },
  late: { label: "지연", color: C.late },
};

export const SEVERITY: Record<IssueSeverity, { label: string; color: string }> = {
  critical: { label: "Critical", color: "#f87171" },
  major: { label: "Major", color: "#fb923c" },
  minor: { label: "Minor", color: "#fbbf24" },
};

export const ISSUE_STATE: Record<IssueState, { label: string; color: string }> = {
  open: { label: "미해결", color: "#f87171" },
  in_progress: { label: "진행중", color: "#60a5fa" },
  resolved: { label: "해결", color: "#34d399" },
};

// unit=day → n일마다 / unit=month → n개월마다
export const CYCLE: Record<CheckCycle, { label: string; unit: "day" | "month"; n: number }> = {
  daily: { label: "매일", unit: "day", n: 1 },
  weekly: { label: "매주", unit: "day", n: 7 },
  biweekly: { label: "격주", unit: "day", n: 14 },
  monthly: { label: "매월", unit: "month", n: 1 },
  quarterly: { label: "분기", unit: "month", n: 3 },
  semiannual: { label: "반기", unit: "month", n: 6 },
};
