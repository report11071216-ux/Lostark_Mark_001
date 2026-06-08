import React, { useState } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { C } from "../../lib/constants";
import type { AlertItem } from "../../types/db";

export const AlertsBell: React.FC<{ alerts: AlertItem[] }> = ({ alerts }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="relative h-8 w-8 rounded-lg flex items-center justify-center"
        style={{ border: `1px solid ${C.line}`, color: alerts.length ? C.soon : C.sub }}>
        <Bell size={15} />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: C.late, color: "#fff" }}>{alerts.length}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl z-50 overflow-hidden"
          style={{ background: C.panel, border: `1px solid ${C.line}`, boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
          <div className="px-4 py-2.5 text-xs font-semibold" style={{ color: C.text, borderBottom: `1px solid ${C.line2}` }}>
            점검 알림 {alerts.length}건
          </div>
          <div className="max-h-72 overflow-y-auto">
            {alerts.length === 0 && <div className="px-4 py-6 text-center text-xs" style={{ color: C.faint }}>임박/지연된 점검이 없습니다.</div>}
            {alerts.map((a, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-2.5" style={{ borderTop: i ? `1px solid ${C.line2}` : "none" }}>
                <span className="text-sm">{a.level === "late" ? "🔴" : a.kind === "adhoc" ? "⚡" : "🟡"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: C.text }}>{a.name}</div>
                  <div className="text-[11px]" style={{ color: a.level === "late" ? C.late : C.soon }}>{a.msg}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AlertBanner: React.FC<{ alerts: AlertItem[] }> = ({ alerts }) => {
  const lateCount = alerts.filter((a) => a.level === "late").length;
  if (!lateCount) return null;
  return (
    <div className="px-6 py-2.5 flex items-center gap-2 text-sm"
      style={{ background: `${C.late}14`, borderBottom: `1px solid ${C.late}33`, color: C.late }}>
      <AlertTriangle size={15} /> 지연된 점검 {lateCount}건이 있습니다. 종 아이콘에서 확인하세요.
    </div>
  );
};
