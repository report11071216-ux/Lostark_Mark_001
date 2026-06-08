// ── DB enum 들 (schema.sql / migration_v3.sql 와 1:1) ──
export type TeamRole = "lead" | "engineer" | "viewer";
export type CheckCycle = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual";
export type InspectionKind = "routine" | "adhoc";
export type InspectionStatus = "scheduled" | "done" | "skipped";
export type IssueSeverity = "critical" | "major" | "minor";
export type IssueState = "open" | "in_progress" | "resolved";

// ── 테이블 행 타입 ──
export interface TeamMember {
  id: string;
  email: string | null;
  name: string | null;
  role: TeamRole;
  approved: boolean;
  created_at: string;
}

export interface Site {
  id: string;
  name: string;
  url: string | null;
  cycle: CheckCycle;
  owner_primary_id: string | null;
  owner_secondary_id: string | null;
  start_date: string; // YYYY-MM-DD
  active: boolean;
  created_at: string;
}

export interface Inspection {
  id: string;
  site_id: string;
  scheduled_for: string; // YYYY-MM-DD
  performed_at: string | null;
  performed_by: string | null;
  status: InspectionStatus;
  kind: InspectionKind;
  checklist: unknown;
  notes: string | null;
  created_at: string;
}

export interface Issue {
  id: string;
  site_id: string | null;
  title: string;
  description: string | null;
  severity: IssueSeverity;
  state: IssueState;
  owner_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ── 파생 타입 ──
export type SiteStatus = "ok" | "soon" | "late";
export interface EnrichedSite extends Site {
  next: Date;
  gap: number; // 다음 점검까지 남은 일수 (음수=지연)
  status: SiteStatus;
}
export interface AlertItem {
  name: string;
  level: "late" | "soon";
  kind: InspectionKind;
  msg: string;
}

// 체크리스트 템플릿 (lead 가 관리하는 점검 항목 정의)
export interface ChecklistTemplate {
  id: string;
  label: string;
  category: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

// 점검 시 기록되는 항목별 결과 (inspections.checklist JSON 에 배열로 저장)
export type CheckResult = "pass" | "warn" | "fail";
export interface ChecklistEntry {
  item: string;
  result: CheckResult;
  note?: string;
}
