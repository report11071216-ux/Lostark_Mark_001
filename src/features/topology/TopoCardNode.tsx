import React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

// 유형 → 아이콘 + 색
const ICONS: Record<string, { color: string; path: React.ReactNode }> = {
  firewall: { color: "#f87171", path: <><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" /><path d="M9 12l2 2 4-4" /></> },
  switch:   { color: "#34d399", path: <><rect x="2" y="9" width="20" height="6" rx="1.5" /><path d="M6 9V6m12 3V6M9 15v3m6-3v3" /></> },
  server:   { color: "#60a5fa", path: <><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></> },
  db:       { color: "#a78bfa", path: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.6 3.6 3 8 3s8-1.4 8-3V5M4 12c0 1.6 3.6 3 8 3s8-1.4 8-3" /></> },
  cloud:    { color: "#38bdf8", path: <path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.3A3.5 3.5 0 0117 18H7z" /> },
  internet: { color: "#38bdf8", path: <path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.3A3.5 3.5 0 0117 18H7z" /> },
  ap:       { color: "#22d3ee", path: <><path d="M5 12.5a9 9 0 0114 0M8 15.5a5 5 0 018 0" /><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none" /></> },
  lb:       { color: "#fb923c", path: <><circle cx="12" cy="5" r="2.2" /><circle cx="5" cy="19" r="2.2" /><circle cx="19" cy="19" r="2.2" /><path d="M12 7.2v4M12 11.2L5.5 17M12 11.2L18.5 17" /></> },
  vm:       { color: "#818cf8", path: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></> },
  custom:   { color: "#8b96a8", path: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></> },
};

export interface TopoNodeData {
  label: string;
  icon?: string;
  ip?: string;
  sub?: string;
  status?: "ok" | "warn" | "ext";
  [key: string]: unknown;
}

const STATUS = {
  ok:   { label: "정상", color: "#34d399" },
  warn: { label: "점검중", color: "#fbbf24" },
  ext:  { label: "외부", color: "#8b96a8" },
};

export const TopoCardNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as TopoNodeData;
  const ic = ICONS[d.icon || "custom"] || ICONS.custom;
  const st = d.status ? STATUS[d.status] : null;

  const hStyle = { background: ic.color, width: 9, height: 9, border: "1.5px solid #0a0e16" } as React.CSSProperties;
  // 상하좌우 4방향, 각 위치마다 source+target 둘 다 둠 (어느 점에서든 양방향 연결)
  const handles = [
    { pos: Position.Top, id: "t" },
    { pos: Position.Bottom, id: "b" },
    { pos: Position.Left, id: "l" },
    { pos: Position.Right, id: "r" },
  ];

  return (
    <div style={{
      width: 158,
      background: "linear-gradient(180deg,#1a2230,#141a25)",
      border: `1px solid ${selected ? ic.color : "rgba(120,200,255,0.22)"}`,
      borderRadius: 12, padding: "10px 11px",
      boxShadow: `0 8px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)`,
      position: "relative",
    }}>
      {handles.map((h) => (
        <React.Fragment key={h.id}>
          <Handle type="source" id={`s-${h.id}`} position={h.pos} style={hStyle} />
          <Handle type="target" id={`t-${h.id}`} position={h.pos} style={hStyle} />
        </React.Fragment>
      ))}

      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ic.color, borderRadius: "12px 0 0 12px" }} />
      <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: `${ic.color}26`, boxShadow: `0 0 14px ${ic.color}80`, color: ic.color }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={ic.color} strokeWidth={1.8}>{ic.path}</svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#eaf2ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.label}</div>
          {d.ip && <div style={{ fontSize: 10, color: "#7d8aa0", fontFamily: "monospace" }}>{d.ip}</div>}
        </div>
      </div>
      {(d.sub || st) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 10, color: "#7d8aa0" }}>{d.sub || ""}</span>
          {st && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: `${st.color}29`, color: st.color }}>{st.label}</span>}
        </div>
      )}
    </div>
  );
};

export function iconForCategory(category?: string | null): string {
  switch (category) {
    case "security": return "firewall";
    case "network": return "switch";
    case "server": return "server";
    case "software": return "vm";
    default: return "custom";
  }
}
