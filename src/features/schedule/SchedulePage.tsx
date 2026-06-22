import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { C, WORK_TYPE, WORK_STATUS } from "../../lib/constants";
import { iso, routineDatesInMonth } from "../../lib/date";
import { Panel } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import { WorkOrderModal } from "./WorkOrderModal";
import type { WorkOrder } from "../../types/db";

type View = "month" | "week" | "list";
type Item =
  | { kind: "routine"; name: string; siteId: string }
  | { kind: "work"; name: string; color: string; wo: WorkOrder };

const pad = (n: number) => String(n).padStart(2, "0");
const timeOf = (ts: string) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

export const SchedulePage: React.FC = () => {
  const { sites, devices, engineers, workOrders, engineerName, updateWorkOrder } = useApp();
  const now = new Date();
  const [cur, setCur] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [view, setView] = useState<View>("month");
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [editWO, setEditWO] = useState<WorkOrder | null>(null);
  const [dragWO, setDragWO] = useState<WorkOrder | null>(null);
  // 필터
  const [fAssignee, setFAssignee] = useState("");
  const [fSite, setFSite] = useState("");
  const [fDevice, setFDevice] = useState("");

  const year = cur.getFullYear(), month = cur.getMonth();

  const siteName = (id: string | null) => sites.find((s) => s.id === id)?.name || "—";
  const deviceName = (id: string | null) => devices.find((d) => d.id === id)?.system_name || "—";

  // 작업 필터 통과 여부
  const woPass = (w: WorkOrder) =>
    (!fAssignee || w.assignee_id === fAssignee) &&
    (!fSite || w.site_id === fSite) &&
    (!fDevice || w.device_id === fDevice);
  // 정기점검은 담당/장비 필터가 걸리면 제외 (해당 정보가 없으므로)
  const routineOn = !fAssignee && !fDevice;

  // 특정 월의 날짜별 아이템
  const monthItems = (y: number, m: number) => {
    const map: Record<string, Item[]> = {};
    if (routineOn) {
      sites.forEach((s) => {
        if (fSite && s.id !== fSite) return;
        routineDatesInMonth(s, y, m).forEach((d) => {
          const k = iso(d); (map[k] = map[k] || []).push({ kind: "routine", name: s.name, siteId: s.id });
        });
      });
    }
    workOrders.forEach((w) => {
      if (!woPass(w)) return;
      const d = new Date(w.scheduled_at);
      if (d.getFullYear() === y && d.getMonth() === m) {
        const k = iso(d); (map[k] = map[k] || []).push({ kind: "work", name: w.title, color: WORK_TYPE[w.type]?.color || C.sub, wo: w });
      }
    });
    return map;
  };

  // 월 뷰 맵
  const monthMap = useMemo(() => monthItems(year, month), [sites, workOrders, year, month, fAssignee, fSite, fDevice]);

  // 주 뷰: 일~토 7일
  const weekStart = useMemo(() => { const d = new Date(cur); d.setDate(cur.getDate() - cur.getDay()); d.setHours(0, 0, 0, 0); return d; }, [cur]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; }), [weekStart]);
  const weekMap = useMemo(() => {
    const months = new Map<string, Record<string, Item[]>>();
    weekDays.forEach((d) => { const key = `${d.getFullYear()}-${d.getMonth()}`; if (!months.has(key)) months.set(key, monthItems(d.getFullYear(), d.getMonth())); });
    const all: Record<string, Item[]> = {};
    months.forEach((mp) => Object.entries(mp).forEach(([k, v]) => { all[k] = (all[k] || []).concat(v); }));
    return all;
  }, [weekDays, sites, workOrders, fAssignee, fSite, fDevice]);

  // 리스트 뷰: 작업만, 최신순
  const listWO = useMemo(() => workOrders.filter(woPass).slice().sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at)),
    [workOrders, fAssignee, fSite, fDevice]);

  // 드래그로 일정 변경 (작업만)
  const onDropDay = (k: string) => {
    if (!dragWO) return;
    const old = new Date(dragWO.scheduled_at);
    const [Y, M, D] = k.split("-").map(Number);
    const nd = new Date(Y, M - 1, D, old.getHours(), old.getMinutes());
    updateWorkOrder(dragWO.id, { scheduled_at: nd.toISOString() });
    setDragWO(null);
  };

  const go = (dir: number) => {
    if (view === "month") setCur(new Date(year, month + dir, 1));
    else if (view === "week") { const d = new Date(cur); d.setDate(d.getDate() + dir * 7); setCur(d); }
  };

  const navLabel = view === "month"
    ? `${year}.${pad(month + 1)}`
    : view === "week"
      ? `${pad(weekStart.getMonth() + 1)}.${pad(weekStart.getDate())} – ${pad(weekDays[6].getMonth() + 1)}.${pad(weekDays[6].getDate())}`
      : "전체 작업";

  const segStyle = (on: boolean): React.CSSProperties => on
    ? { background: `${C.accent}26`, color: C.accent, border: `1px solid ${C.accent}66` }
    : { background: "transparent", color: C.faint, border: `1px solid ${C.line}` };
  const selStyle: React.CSSProperties = { background: C.panel2, border: `1px solid ${C.line}`, color: C.text, borderRadius: 6, fontSize: 11, padding: "4px 6px", outline: "none" };

  const filterDevices = fSite ? devices.filter((d) => d.site_id === fSite) : devices;

  // 한 셀(날짜) 렌더 — 월/주 공용
  const dayCell = (d: Date, big: boolean) => {
    const k = iso(d);
    const map = view === "week" ? weekMap : monthMap;
    const items = map[k] || [];
    const isToday = k === iso(now);
    const limit = big ? 8 : 3;
    return (
      <div key={k} className="group relative rounded-lg p-1.5 flex flex-col gap-1"
        style={{ minHeight: big ? 160 : 76, background: items.length ? "rgba(45,212,191,0.04)" : C.panel2, border: isToday ? `1px solid ${C.accent}` : `1px solid ${C.line2}` }}
        onDragOver={(e) => { if (dragWO) e.preventDefault(); }}
        onDrop={() => onDropDay(k)}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs" style={{ color: isToday ? C.accent : C.faint }}>{big ? `${pad(d.getMonth() + 1)}.${pad(d.getDate())}` : d.getDate()}</span>
          <button onClick={() => setCreateDate(k)} className="h-5 w-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `${C.accent}1a`, color: C.accent }} title="작업 추가">
            <Plus size={12} />
          </button>
        </div>
        {items.slice(0, limit).map((it, idx) =>
          it.kind === "routine" ? (
            <div key={idx} className="truncate rounded px-1 py-0.5 text-[10px] font-medium" style={{ background: `${C.accent}1f`, color: "#5eead4" }}>{it.name}</div>
          ) : (
            <button key={idx} draggable onDragStart={() => setDragWO(it.wo)} onDragEnd={() => setDragWO(null)} onClick={() => setEditWO(it.wo)}
              className="truncate text-left rounded px-1 py-0.5 text-[10px] font-medium" style={{ background: `${it.color}26`, color: it.color, cursor: "grab" }} title="클릭=수정 · 드래그=날짜 이동">
              {big ? `${timeOf(it.wo.scheduled_at)} ` : ""}{it.name}
            </button>
          )
        )}
        {items.length > limit && <div className="text-[10px]" style={{ color: C.faint }}>+{items.length - limit}</div>}
      </div>
    );
  };

  // 월 셀 배열
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const monthCells: (Date | null)[] = [];
  for (let i = 0; i < first; i++) monthCells.push(null);
  for (let dd = 1; dd <= total; dd++) monthCells.push(new Date(year, month, dd));

  return (
    <Panel>
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarDays size={15} style={{ color: C.accent }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>점검 · 작업 일정</span>
          <span className="ml-2 inline-flex items-center gap-1 text-[11px]" style={{ color: C.sub }}>
            <span className="w-2.5 h-2.5 rounded" style={{ background: C.accent }} /> 정기점검
          </span>
          {Object.values(WORK_TYPE).map((v) => (
            <span key={v.label} className="inline-flex items-center gap-1 text-[11px]" style={{ color: C.sub }}>
              <span className="w-2.5 h-2.5 rounded" style={{ background: v.color }} /> {v.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCreateDate(iso(now))} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold mr-2" style={{ background: C.accent, color: "#06241f" }}>
            <Plus size={12} /> 작업 등록
          </button>
          {view !== "list" && (
            <>
              <button onClick={() => setCur(new Date(now.getFullYear(), now.getMonth(), now.getDate()))} className="rounded-lg px-2.5 py-1.5 text-xs" style={{ border: `1px solid ${C.line}`, color: C.sub }}>오늘</button>
              <button onClick={() => go(-1)} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, color: C.sub }}><ChevronLeft size={14} /></button>
            </>
          )}
          <span className="font-mono text-sm font-semibold px-2 min-w-[120px] text-center" style={{ color: C.text }}>{navLabel}</span>
          {view !== "list" && (
            <button onClick={() => go(1)} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, color: C.sub }}><ChevronRight size={14} /></button>
          )}
        </div>
      </div>

      {/* 뷰 토글 + 필터 */}
      <div className="flex flex-wrap items-center gap-1.5 px-5 py-2.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
        {([["month", "월"], ["week", "주"], ["list", "리스트"]] as [View, string][]).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} className="rounded-md px-2.5 py-1 text-[11px] font-medium" style={segStyle(view === v)}>{label}</button>
        ))}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} style={selStyle}>
            <option value="">담당 전체</option>
            {engineers.map((e) => <option key={e.id} value={e.id}>{e.name}{e.rank ? ` ${e.rank}` : ""}</option>)}
          </select>
          <select value={fSite} onChange={(e) => { setFSite(e.target.value); setFDevice(""); }} style={selStyle}>
            <option value="">사이트 전체</option>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={fDevice} onChange={(e) => setFDevice(e.target.value)} style={selStyle} disabled={!fSite}>
            <option value="">{fSite ? "장비 전체" : "사이트 먼저"}</option>
            {filterDevices.map((d) => <option key={d.id} value={d.id}>{d.system_name}</option>)}
          </select>
          {(fAssignee || fSite || fDevice) && (
            <button onClick={() => { setFAssignee(""); setFSite(""); setFDevice(""); }} className="rounded-md px-2 py-1 text-[11px]" style={{ border: `1px solid ${C.line}`, color: C.sub }}>초기화</button>
          )}
        </div>
      </div>

      <div className="p-4">
        {view === "list" ? (
          <div className="space-y-1.5">
            {listWO.length === 0 && <div className="text-center py-10 text-sm" style={{ color: C.faint }}>조건에 맞는 작업이 없습니다.</div>}
            {listWO.map((w) => {
              const d = new Date(w.scheduled_at);
              const wt = WORK_TYPE[w.type]; const ws = WORK_STATUS[w.status];
              return (
                <button key={w.id} onClick={() => setEditWO(w)} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/[0.02]" style={{ background: C.panel2, border: `1px solid ${C.line2}` }}>
                  <div className="font-mono text-xs whitespace-nowrap" style={{ color: C.sub, width: 116 }}>{d.getFullYear()}.{pad(d.getMonth() + 1)}.{pad(d.getDate())} {timeOf(w.scheduled_at)}</div>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap" style={{ background: `${wt?.color || C.sub}26`, color: wt?.color || C.sub }}>{wt?.label || w.type}</span>
                  <span className="text-xs font-medium truncate flex-1" style={{ color: C.text }}>{w.title}</span>
                  <span className="text-[11px] whitespace-nowrap" style={{ color: C.faint }}>{siteName(w.site_id)}{w.device_id ? ` · ${deviceName(w.device_id)}` : ""}</span>
                  <span className="text-[11px] whitespace-nowrap" style={{ color: C.sub }}>{w.assignee_id ? engineerName(w.assignee_id) : "—"}</span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap" style={{ background: C.panel, color: C.sub, border: `1px solid ${C.line2}` }}>{ws?.label || w.status}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                <div key={d} className="text-center text-xs font-medium pb-1" style={{ color: C.faint }}>{d}</div>
              ))}
            </div>
            {view === "month" ? (
              <div className="grid grid-cols-7 gap-1.5">
                {monthCells.map((d, i) => (d === null ? <div key={i} /> : dayCell(d, false)))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map((d) => dayCell(d, true))}
              </div>
            )}
          </>
        )}
      </div>

      {createDate && <WorkOrderModal defaultDate={createDate} onClose={() => setCreateDate(null)} />}
      {editWO && <WorkOrderModal existing={editWO} onClose={() => setEditWO(null)} />}
    </Panel>
  );
};
