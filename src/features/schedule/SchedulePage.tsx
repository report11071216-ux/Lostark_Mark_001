import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { C, WORK_TYPE } from "../../lib/constants";
import { iso, routineDatesInMonth } from "../../lib/date";
import { Panel } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import { WorkOrderModal } from "./WorkOrderModal";
import type { WorkOrder } from "../../types/db";

type Item =
  | { kind: "routine"; name: string }
  | { kind: "work"; name: string; color: string; wo: WorkOrder };

export const SchedulePage: React.FC = () => {
  const { sites, workOrders } = useApp();
  const now = new Date();
  const [cur, setCur] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [editWO, setEditWO] = useState<WorkOrder | null>(null);
  const year = cur.getFullYear(), month = cur.getMonth();

  const byDate = useMemo(() => {
    const map: Record<string, Item[]> = {};
    sites.forEach((s) =>
      routineDatesInMonth(s, year, month).forEach((d) => {
        const k = iso(d); (map[k] = map[k] || []).push({ kind: "routine", name: s.name });
      })
    );
    workOrders.forEach((w) => {
      const d = new Date(w.scheduled_at);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const k = iso(d);
        (map[k] = map[k] || []).push({ kind: "work", name: w.title, color: WORK_TYPE[w.type]?.color || C.sub, wo: w });
      }
    });
    return map;
  }, [sites, workOrders, year, month]);

  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

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
          <button onClick={() => setCur(new Date(year, month - 1, 1))} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, color: C.sub }}><ChevronLeft size={14} /></button>
          <span className="font-mono text-sm font-semibold px-2 min-w-[88px] text-center" style={{ color: C.text }}>{year}.{String(month + 1).padStart(2, "0")}</span>
          <button onClick={() => setCur(new Date(year, month + 1, 1))} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, color: C.sub }}><ChevronRight size={14} /></button>
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
            const isToday = k === iso(now);
            return (
              <div key={i} className="group relative rounded-lg p-1.5 min-h-[76px] flex flex-col gap-1"
                style={{ background: items.length ? "rgba(45,212,191,0.04)" : C.panel2, border: isToday ? `1px solid ${C.accent}` : `1px solid ${C.line2}` }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs" style={{ color: isToday ? C.accent : C.faint }}>{d}</span>
                  <button onClick={() => setCreateDate(k)}
                    className="h-5 w-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `${C.accent}1a`, color: C.accent }} title="작업 추가">
                    <Plus size={12} />
                  </button>
                </div>
                {items.slice(0, 3).map((it, idx) =>
                  it.kind === "routine" ? (
                    <div key={idx} className="truncate rounded px-1 py-0.5 text-[10px] font-medium" style={{ background: `${C.accent}1f`, color: "#5eead4" }}>
                      {it.name}
                    </div>
                  ) : (
                    <button key={idx} onClick={() => setEditWO(it.wo)} className="truncate text-left rounded px-1 py-0.5 text-[10px] font-medium"
                      style={{ background: `${it.color}26`, color: it.color }} title="클릭하여 수정">
                      {it.name}
                    </button>
                  )
                )}
                {items.length > 3 && <div className="text-[10px]" style={{ color: C.faint }}>+{items.length - 3}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {createDate && <WorkOrderModal defaultDate={createDate} onClose={() => setCreateDate(null)} />}
      {editWO && <WorkOrderModal existing={editWO} onClose={() => setEditWO(null)} />}
    </Panel>
  );
};
