import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { C } from "../../lib/constants";
import { iso, parse, routineDatesInMonth } from "../../lib/date";
import { Panel } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import { AddAdhocModal } from "./AddAdhocModal";

type Item = { kind: "routine" | "adhoc"; name: string };

export const SchedulePage: React.FC = () => {
  const { sites, adhoc } = useApp();
  const now = new Date();
  const [cur, setCur] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [modal, setModal] = useState(false);
  const year = cur.getFullYear(), month = cur.getMonth();

  const byDate = useMemo(() => {
    const map: Record<string, Item[]> = {};
    sites.forEach((s) =>
      routineDatesInMonth(s, year, month).forEach((d) => {
        const k = iso(d); (map[k] = map[k] || []).push({ kind: "routine", name: s.name });
      })
    );
    adhoc.forEach((a) => {
      const d = parse(a.scheduled_for);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const k = iso(d); const s = sites.find((x) => x.id === a.site_id);
        (map[k] = map[k] || []).push({ kind: "adhoc", name: s ? s.name : "임시" });
      }
    });
    return map;
  }, [sites, adhoc, year, month]);

  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  return (
    <Panel>
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
        <div className="flex items-center gap-2">
          <CalendarDays size={15} style={{ color: C.accent }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>점검 일정</span>
          <span className="ml-3 inline-flex items-center gap-1 text-[11px]" style={{ color: C.sub }}>
            <span className="w-2.5 h-2.5 rounded" style={{ background: C.accent }} /> 정기
          </span>
          <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: C.sub }}>
            <span className="w-2.5 h-2.5 rounded" style={{ background: C.adhoc }} /> 임시
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setModal(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold mr-2" style={{ background: C.adhoc, color: "#2a1505" }}>
            <Zap size={12} /> 임시 점검
          </button>
          <button onClick={() => setCur(new Date(year, month - 1, 1))} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, color: C.sub }}>
            <ChevronLeft size={14} />
          </button>
          <span className="font-mono text-sm font-semibold px-2 min-w-[88px] text-center" style={{ color: C.text }}>
            {year}.{String(month + 1).padStart(2, "0")}
          </span>
          <button onClick={() => setCur(new Date(year, month + 1, 1))} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, color: C.sub }}>
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
            const isToday = k === iso(now);
            return (
              <div key={i} className="rounded-lg p-1.5 min-h-[68px] flex flex-col gap-1"
                style={{ background: items.length ? "rgba(45,212,191,0.04)" : C.panel2, border: isToday ? `1px solid ${C.accent}` : `1px solid ${C.line2}` }}>
                <div className="font-mono text-xs" style={{ color: isToday ? C.accent : C.faint }}>{d}</div>
                {items.slice(0, 3).map((it, idx) => (
                  <div key={idx} className="truncate rounded px-1 py-0.5 text-[10px] font-medium"
                    style={it.kind === "adhoc" ? { background: `${C.adhoc}22`, color: "#fdba74" } : { background: `${C.accent}1f`, color: "#5eead4" }}>
                    {it.kind === "adhoc" ? "⚡ " : ""}{it.name}
                  </div>
                ))}
                {items.length > 3 && <div className="text-[10px]" style={{ color: C.faint }}>+{items.length - 3}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {modal && <AddAdhocModal onClose={() => setModal(false)} />}
    </Panel>
  );
};
