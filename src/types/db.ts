// ── DB enum 들 (schema.sql / migration_v3.sql 와 1:1) ──
export type TeamRole = "lead" | "engineer" | "viewer";
export type CheckCycle = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual";
export type InspectionKind = "routine" | "adhoc";
export type InspectionStatus = "scheduled" | "done" | "skipped";
export type IssueSeverity = "critical" | "major" | "minor";
export type IssueState = "open" | "in_progress" | "resolved";

// ── 테이블 행 타입 ──
export interface Engineer {
  id: string;
  name: string;
  rank: string | null;   // 직급
  dept: string | null;   // 부서
  active: boolean;
  created_at: string;
}

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
  cycle: SiteCycle;
  start_date: string | null;
  owner_primary_id: string | null;
  owner_secondary_id: string | null;
  active: boolean;
  building_type: string | null;
  map_x: number | null;
  map_y: number | null;
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

// 장비 (사이트 소속)
export type DeviceCategory = "security" | "server" | "network" | "software" | "etc";
export type NetZone = "work" | "internet";
export interface Device {
  id: string;
  site_id: string;
  category: DeviceCategory;
  net_zone: NetZone | null;
  managed: boolean;          // 관리대상 O/X
  system_name: string;
  model: string | null;
  serial: string | null;
  os: string | null;
  introduced_on: string | null; // YYYY-MM
  ip: string | null;
  vendor_name: string | null;
  icon_type: string | null;
  icon_badge: string | null;
  bookmarked: boolean;          // ① 점검 대상 북마크 (팀 공용 별표)
  location_id: string | null;   // ③ 위치 폴더 (site_locations.id, 미지정이면 null)
  created_at: string;
}
// 타사 제품 (업체 연락처, 사이트 소속)
export interface Vendor {
  id: string;
  site_id: string;
  vendor_name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

// 위치 폴더 (사이트 소속) — 장비를 위치별로 묶는 폴더 (예: 본원, 1층A동)
export interface SiteLocation {
  id: string;
  site_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

// 작업/일정 (work_orders)
export type WorkType = "policy" | "install" | "relocate" | "inspect" | "meeting" | "etc";
export type WorkStatus = "planned" | "in_progress" | "done";
export interface WorkOrder {
  id: string;
  title: string;
  type: WorkType;
  status: WorkStatus;
  site_id: string | null;
  device_id: string | null;   // 작업 대상 장비 (devices.id, 없으면 null)
  assignee_id: string | null;
  scheduled_at: string; // ISO timestamp
  detail: string | null;
  created_by: string | null;
  created_at: string;
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

// ── 네트워크 구성도(토폴로지) ──
export interface TopoNode {
  id: string;
  site_id: string;
  device_id: string | null;
  label: string;
  kind: string;   // device / cloud / internet / custom
  x: number;
  y: number;
  created_at: string;
}
export interface TopoEdge {
  id: string;
  site_id: string;
  source_id: string;
  target_id: string;
  label: string | null;
  color: string;
  dashed: boolean;
  src_port: string | null;
  dst_port: string | null;
  edge_type: string;
  source_handle: string | null;
  target_handle: string | null;
  created_at: string;
}
export interface TopoLegend {
  id: string;
  site_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

// ── 대시보드 지역 구역 (아이소 마름모) ──
export interface MapZone {
  id: string;
  name: string;
  color: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  sort_order: number;
  created_at: string;
}

// ── 장비별 정기점검표 ──

// 섹션 타입: 2열 값형 / 반복 표형 / 자유 텍스트
export type InsSectionKind = "kv" | "table" | "text";

// 2열 값형의 한 행 (항목 + 값들)
export interface InsKvRow {
  label: string;            // 항목명
  values: string[];         // 열별 값 (1열 또는 2열: [업무망, 인터넷망])
}

// 반복 표형의 한 행 (셀 값 배열)
export type InsTableRow = string[];

// 섹션 하나
export interface InsSection {
  id: string;               // 클라이언트 생성 uid
  kind: InsSectionKind;
  title: string;            // 섹션 제목 (예: "시스템 점검")
  // kv 형
  columns?: string[];       // 값 열 이름 (예: ["업무망","인터넷망"] 또는 ["값"])
  rows?: InsKvRow[];
  // table 형
  tableColumns?: string[];  // 컬럼명 (예: ["위치","Hostname","모델명","Version"])
  tableRows?: InsTableRow[];
  // text 형
  text?: string;
}

// 헤더 필드 정의 (예: 고객명, 장비용도, IP …)
export interface InsHeaderField {
  key: string;              // 식별자
  label: string;            // 표시명
}

// 템플릿
export interface InspectionTemplate {
  id: string;
  name: string;
  title: string | null;
  subtitle: string | null;
  sections: InsSection[];
  header_fields: InsHeaderField[];
  folder_id: string | null;
  created_by: string | null;
  created_at: string;
}
// 점검 기록
export interface InspectionRecord {
  id: string;
  device_id: string | null;
  site_id: string | null;
  title: string | null;
  subtitle: string | null;
  inspected_on: string;     // YYYY-MM-DD
  inspector: string | null;
  header_values: Record<string, string>;
  sections: InsSection[];   // 값이 채워진 섹션
  created_by: string | null;
  created_at: string;
}

// 점검표 템플릿 폴더
export interface TemplateFolder {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}
