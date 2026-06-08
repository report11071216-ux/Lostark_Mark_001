import React, { useMemo, useState } from "react";
import {
  Shield, LayoutDashboard, CalendarDays, AlertTriangle, Server,
  ChevronLeft, ChevronRight, Clock, CheckCircle2, CircleDot,
  Loader2, Search, LogIn, Activity, Bell,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   IT 정기점검 운영 콘솔 — 프로토타입 (목 데이터 / DB·인증 없이 미리보기)
   실제 배포 시: 목 데이터 → Supabase 쿼리로 교체, 로그인 → Supabase Auth로 교체
   ────────────────────────────────────────────────────────────── */

// ── 디자인 토큰 ───────────────────────────────────────────────
const C = {
  bg: "#0a0d12",
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
  running: "#60a5fa",
};

const STATUS = {
  ok:      { label: "정상",   color: C.ok,      icon: CheckCircle2 },
  soon:    { label: "임박",   color: C.soon,    icon: Clock },
  late:    { label: "지연",   color: C.late,    icon: AlertTriangle },
  running: { label: "점검중", color: C.running, icon: Loader2 },
};

const SEVERITY = {
  critical: { label: "Critical", color: "#f87171" },
  major:    { label: "Major",    color: "#fb923c" },
  minor:    { label: "Minor",    color: "#fbbf24" },
};
const ISSUE_STATE = {
  open:        { label: "미해결", color: "#f87171" },
  in_progress: { label: "진행중", color: "#60a5fa" },
  resolved:    { label: "해결",   color: "#34d399" },
};

// ── 날짜 유틸 ────────────────────────────────────────────────
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const daysBetween = (a, b) =>
  Math.round((new Date(a).setHours(0,0,0,0) - new Date(b).setHours(0,0,0,0)) / 86400000);
const CYCLE_DAYS = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };
const CYCLE_LABEL = { daily: "매일", weekly: "매주", biweekly: "격주", monthly: "매월" };

// ── 목 데이터: 관리 사이트 ────────────────────────────────────
const SITES = [
  { id: "s1", name: "메인 커머스",      url: "shop.corp.io",      cycle: "weekly",   lastCheck: iso(addDays(today, -2)),  ownerP: "김엔지", ownerS: "박운영" },
  { id: "s2", name: "사내 ERP",         url: "erp.corp.io",       cycle: "monthly",  lastCheck: iso(addDays(today, -33)), ownerP: "박운영", ownerS: "이결제" },
  { id: "s3", name: "고객 포털",        url: "portal.corp.io",    cycle: "weekly",   lastCheck: iso(addDays(today, -8)),  ownerP: "김엔지", ownerS: "최마케" },
  { id: "s4", name: "결제 게이트웨이",   url: "pay.corp.io",       cycle: "daily",    lastCheck: iso(addDays(today, 0)),   ownerP: "이결제", ownerS: "박운영", running: true },
  { id: "s5", name: "마케팅 LP",        url: "land.corp.io",      cycle: "biweekly", lastCheck: iso(addDays(today, -13)), ownerP: "최마케", ownerS: "김엔지" },
  { id: "s6", name: "API 게이트웨이",    url: "api.corp.io",       cycle: "daily",    lastCheck: iso(addDays(today, -1)),  ownerP: "박운영", ownerS: "이결제" },
];

const ISSUES = [
  { id: "i1", site: "결제 게이트웨이", title: "정기점검 중 응답지연 (p95 1.8s)", severity: "major",    state: "in_progress", owner: "이결제", created: iso(addDays(today, -1)) },
  { id: "i2", site: "사내 ERP",        title: "SSL 인증서 만료 D-9",            severity: "critical", state: "open",        owner: "박운영", created: iso(addDays(today, -1)) },
  { id: "i3", site: "고객 포털",        title: "점검 주기 8일 경과, 일정 지연",    severity: "minor",    state: "open",        owner: "김엔지", created: iso(addDays(today, -8)) },
  { id: "i4", site: "메인 커머스",      title: "이미지 CDN 캐시 미스 급증",        severity: "major",    state: "resolved",    owner: "김엔지", created: iso(addDays(today, -5)) },
  { id: "i5", site: "API 게이트웨이",   title: "5xx 비율 0.4% → 1.2% 상승",      severity: "major",    state: "open",        owner: "박운영", created: iso(addDays(today, -2)) },
  { id: "i6", site: "마케팅 LP",        title: "폼 제출 트래킹 누락",             severity: "minor",    state: "resolved",    owner: "최마케", created: iso(addDays(today, -11)) },
];

// 사이트 → 다음 점검일 / 상태 계산
function enrich(site) {
  const next = iso(addDays(new Date(site.lastCheck), CYCLE_DAYS[site.cycle]));
  const gap = daysBetween(next, today); // 양수=남음, 음수=지연
  let status = "ok";
  if (site.running) status = "running";
  else if (gap < 0) status = "late";
  else if (gap <= 3) status = "soon";
  return { ...site, nextCheck: next, gap };
}

// ── 작은 UI 조각 ─────────────────────────────────────────────
function StatusPill({ status }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: `${s.color}1a`, color: s.color, border: `1px solid ${s.color}33` }}>
      <Icon size={12} className={status === "running" ? "animate-spin" : ""} />
      {s.label}
    </span>
  );
}

function Panel({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ background: C.panel, border: `1px solid ${C.line}`, ...style }}>
      {children}
    </div>
  );
}

// ── 로그인 게이트 (목) ────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [email, setEmail] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.bgGrad }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center"
            style={{ background: `${C.accent}1a`, border: `1px solid ${C.accent}40` }}>
            <Shield size={20} style={{ color: C.accent }} />
          </div>
          <div className="font-mono font-bold text-lg" style={{ color: C.text }}>ops.console</div>
        </div>
        <Panel className="p-7">
          <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>팀 계정으로 로그인</div>
          <div className="text-xs mb-5" style={{ color: C.sub }}>승인된 엔지니어만 접근할 수 있습니다.</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@corp.io" className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-3"
            style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.text }} />
          <input type="password" placeholder="••••••••" className="w-full rounded-lg px-3 py-2.5 text-sm outline-none mb-5"
            style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.text }} />
          <button onClick={onLogin}
            className="w-full rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: C.accent, color: "#06241f" }}>
            <LogIn size={15} /> 로그인
          </button>
          <div className="text-center text-xs mt-4" style={{ color: C.faint }}>
            (프로토타입 — 아무 값이나 입력해도 됩니다)
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ── 대시보드 탭 ──────────────────────────────────────────────
function Dashboard({ sites }) {
  const lateCount = sites.filter((s) => s.gap < 0 && !s.running).length;
  const soonCount = sites.filter((s) => s.gap >= 0 && s.gap <= 3 && !s.running).length;
  const openIssues = ISSUES.filter((i) => i.state !== "resolved").length;

  const stats = [
    { label: "관리 사이트", value: sites.length, color: C.accent, icon: Server },
    { label: "점검 지연", value: lateCount, color: C.late, icon: AlertTriangle },
    { label: "점검 임박", value: soonCount, color: C.soon, icon: Clock },
    { label: "미해결 이슈", value: openIssues, color: C.running, icon: Bell },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Panel key={s.label} className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-medium" style={{ color: C.sub }}>{s.label}</span>
                <Icon size={15} style={{ color: s.color }} />
              </div>
              <div className="font-mono text-3xl font-bold" style={{ color: s.value > 0 || s.label === "관리 사이트" ? s.color : C.faint }}>
                {String(s.value).padStart(2, "0")}
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel>
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <Activity size={15} style={{ color: C.accent }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>사이트 점검 현황</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: C.text }}>
            <thead>
              <tr style={{ color: C.faint }} className="text-xs">
                {["사이트", "주기", "담당", "최근 점검", "다음 점검", "상태"].map((h) => (
                  <th key={h} className="text-left font-medium px-5 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => {
                const status = s.running ? "running" : s.gap < 0 ? "late" : s.gap <= 3 ? "soon" : "ok";
                return (
                  <tr key={s.id} style={{ borderTop: `1px solid ${C.line2}` }} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{s.name}</div>
                      <div className="font-mono text-xs" style={{ color: C.faint }}>{s.url}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: C.sub }}>{CYCLE_LABEL[s.cycle]}</td>
                    <td className="px-5 py-3.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${C.accent}1a`, color: C.accent }}>정</span>
                        <span style={{ color: C.text }}>{s.ownerP}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: C.panel2, color: C.faint, border: `1px solid ${C.line}` }}>부</span>
                        <span style={{ color: C.sub }}>{s.ownerS}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: C.sub }}>{s.lastCheck}</td>
                    <td className="px-5 py-3.5 font-mono text-xs">
                      <span style={{ color: status === "late" ? C.late : status === "soon" ? C.soon : C.sub }}>
                        {s.nextCheck}
                      </span>
                      {!s.running && (
                        <span className="ml-1.5" style={{ color: C.faint }}>
                          {s.gap < 0 ? `(${-s.gap}일 지연)` : s.gap === 0 ? "(오늘)" : `(D-${s.gap})`}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5"><StatusPill status={status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

// ── 점검 일정(캘린더) 탭 ──────────────────────────────────────
function Schedule({ sites }) {
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  // 이번 달에 떨어지는 점검(다음 점검일 + 주기 반복 일부 표현)
  const byDate = useMemo(() => {
    const map = {};
    sites.forEach((s) => {
      // 다음 점검일 기준으로 주기만큼 앞뒤로 채워서 "반복" 표현
      const step = CYCLE_DAYS[s.cycle];
      let d = new Date(s.nextCheck);
      // 이번 달 범위로 끌어오기
      while (d.getMonth() > month || d.getFullYear() > year) d = addDays(d, -step);
      while (d.getMonth() < month && d.getFullYear() <= year) d = addDays(d, step);
      for (let cur = new Date(d); cur.getMonth() === month && cur.getFullYear() === year; cur = addDays(cur, step)) {
        const k = iso(cur);
        (map[k] = map[k] || []).push(s);
      }
    });
    return map;
  }, [sites, year, month]);

  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  const upcoming = sites
    .filter((s) => !s.running && s.gap >= 0)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 5);

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Panel className="lg:col-span-2">
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <div className="flex items-center gap-2">
            <CalendarDays size={15} style={{ color: C.accent }} />
            <span className="text-sm font-semibold" style={{ color: C.text }}>점검 일정</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
              style={{ border: `1px solid ${C.line}`, color: C.sub }}>
              <ChevronLeft size={14} />
            </button>
            <span className="font-mono text-sm font-semibold px-2 min-w-[88px] text-center" style={{ color: C.text }}>
              {year}.{String(month + 1).padStart(2, "0")}
            </span>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
              style={{ border: `1px solid ${C.line}`, color: C.sub }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="text-center text-xs font-medium pb-1" style={{ color: C.faint }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const k = iso(new Date(year, month, d));
              const items = byDate[k] || [];
              const isToday = k === iso(today);
              return (
                <div key={i} className="rounded-lg p-1.5 min-h-[64px] flex flex-col gap-1"
                  style={{
                    background: items.length ? "rgba(45,212,191,0.04)" : C.panel2,
                    border: isToday ? `1px solid ${C.accent}` : `1px solid ${C.line2}`,
                  }}>
                  <div className="font-mono text-xs" style={{ color: isToday ? C.accent : C.faint }}>{d}</div>
                  {items.slice(0, 3).map((s) => (
                    <div key={s.id} className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                      style={{ background: "rgba(96,165,250,0.12)", color: "#93c5fd" }}>
                      {s.name}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-[10px]" style={{ color: C.faint }}>+{items.length - 3}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <Clock size={15} style={{ color: C.soon }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>다가오는 점검</span>
        </div>
        <div className="p-3 space-y-2">
          {upcoming.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: C.panel2, border: `1px solid ${C.line2}` }}>
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(45,212,191,0.1)" }}>
                <Server size={15} style={{ color: C.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: C.text }}>{s.name}</div>
                <div className="font-mono text-xs" style={{ color: C.faint }}>{s.nextCheck} · {CYCLE_LABEL[s.cycle]}</div>
              </div>
              <span className="font-mono text-xs font-bold" style={{ color: s.gap <= 3 ? C.soon : C.sub }}>
                {s.gap === 0 ? "오늘" : `D-${s.gap}`}
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ── 이슈/장애 로그 탭 ─────────────────────────────────────────
function IssueLog() {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const filtered = ISSUES.filter((i) => {
    const okState = filter === "all" || i.state === filter;
    const okQ = !q || (i.title + i.site).toLowerCase().includes(q.toLowerCase());
    return okState && okQ;
  });

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
        <div className="flex items-center gap-2 mr-auto">
          <AlertTriangle size={15} style={{ color: C.late }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>이슈 / 장애 로그</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: C.panel2, border: `1px solid ${C.line}` }}>
          <Search size={13} style={{ color: C.faint }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색"
            className="bg-transparent outline-none text-xs w-28" style={{ color: C.text }} />
        </div>
        <div className="flex gap-1">
          {[["all", "전체"], ["open", "미해결"], ["in_progress", "진행중"], ["resolved", "해결"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: filter === k ? `${C.accent}1a` : "transparent",
                color: filter === k ? C.accent : C.sub,
                border: `1px solid ${filter === k ? C.accent + "40" : C.line}`,
              }}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        {(() => {
          const groups = {};
          filtered.forEach((i) => { (groups[i.site] = groups[i.site] || []).push(i); });
          const siteNames = Object.keys(groups);
          if (siteNames.length === 0) {
            return <div className="text-center py-12 text-sm" style={{ color: C.faint }}>조건에 맞는 이슈가 없습니다.</div>;
          }
          return siteNames.map((siteName) => {
            const list = groups[siteName];
            const openCnt = list.filter((x) => x.state !== "resolved").length;
            return (
              <div key={siteName}>
                <div className="flex items-center gap-2 px-5 py-2.5"
                  style={{ background: C.panel2, borderTop: `1px solid ${C.line2}` }}>
                  <Server size={13} style={{ color: C.accent }} />
                  <span className="text-xs font-semibold" style={{ color: C.text }}>{siteName}</span>
                  <span className="font-mono text-xs" style={{ color: C.faint }}>{list.length}건</span>
                  {openCnt > 0 && (
                    <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: `${C.late}1a`, color: C.late }}>미해결 {openCnt}</span>
                  )}
                </div>
                {list.map((i) => {
                  const sev = SEVERITY[i.severity];
                  const st = ISSUE_STATE[i.state];
                  return (
                    <div key={i.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                      style={{ borderTop: `1px solid ${C.line2}` }}>
                      <CircleDot size={14} style={{ color: sev.color }} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: C.text }}>{i.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: C.faint }}>
                          {i.owner} · <span className="font-mono">{i.created}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold shrink-0" style={{ color: sev.color }}>{sev.label}</span>
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold shrink-0"
                        style={{ background: `${st.color}1a`, color: st.color, border: `1px solid ${st.color}33` }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          });
        })()}
      </div>
    </Panel>
  );
}

// ── 앱 셸 ────────────────────────────────────────────────────
export default function OpsConsole() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const sites = useMemo(() => SITES.map(enrich), []);

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />;

  const TABS = [
    { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
    { id: "schedule",  label: "점검 일정", icon: CalendarDays },
    { id: "issues",    label: "이슈 로그", icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.bgGrad, color: C.text }}>
      {/* 헤더 */}
      <header className="flex items-center gap-4 px-6 py-3.5 sticky top-0 z-10"
        style={{ background: "rgba(10,13,18,0.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: `${C.accent}1a`, border: `1px solid ${C.accent}40` }}>
            <Shield size={16} style={{ color: C.accent }} />
          </div>
          <span className="font-mono font-bold text-sm">ops.console</span>
        </div>
        <nav className="flex items-center gap-1 ml-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  background: active ? `${C.accent}14` : "transparent",
                  color: active ? C.accent : C.sub,
                }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: C.faint }}>
          <span className="font-mono">{iso(today)}</span>
          <span className="h-7 w-7 rounded-full flex items-center justify-center font-semibold"
            style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.sub }}>K</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {tab === "dashboard" && <Dashboard sites={sites} />}
        {tab === "schedule"  && <Schedule sites={sites} />}
        {tab === "issues"    && <IssueLog />}
      </main>
    </div>
  );
}
