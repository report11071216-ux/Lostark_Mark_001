import React, { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

// 13종 입체 아이콘 (viewBox 0 0 32 32)
const ICONS: Record<string, { color: string; svg: React.ReactNode }> = {
  firewall: { color: "#f87171", svg: <><path d="M16 3l11 4v7c0 7-4.8 11.5-11 14C9.8 25.5 5 21 5 14V7l11-4z" fill="#7a2e2e" stroke="#f87171" strokeWidth="1.4"/><path d="M5.5 11h21M5.5 16h21M11 7.5v17M21 7.5v17" stroke="#f87171" strokeWidth="0.8" opacity="0.45"/><path d="M12 16l3 3 5.5-6" stroke="#fff" strokeWidth="2" fill="none"/></> },
  security: { color: "#f87171", svg: <path d="M16 3l11 4v7c0 7-4.8 11.5-11 14C9.8 25.5 5 21 5 14V7l11-4z" fill="#7a2e2e" stroke="#f87171" strokeWidth="1.4"/> },
  backbone: { color: "#2dd4bf", svg: <><rect x="2" y="10" width="28" height="13" rx="2.4" fill="#155e54" stroke="#2dd4bf" strokeWidth="1.4"/><rect x="2" y="10" width="28" height="4" rx="2.4" fill="#2dd4bf" opacity="0.35"/><rect x="5" y="17" width="3.4" height="3.4" rx="0.6" fill="#2dd4bf"/><rect x="10" y="17" width="3.4" height="3.4" rx="0.6" fill="#0a0e16"/><rect x="15" y="17" width="3.4" height="3.4" rx="0.6" fill="#2dd4bf"/><rect x="20" y="17" width="3.4" height="3.4" rx="0.6" fill="#0a0e16"/><rect x="24.8" y="17" width="3.4" height="3.4" rx="0.6" fill="#2dd4bf"/></> },
  switch:   { color: "#34d399", svg: <><rect x="3" y="12" width="26" height="10" rx="2.2" fill="#1d6b50" stroke="#34d399" strokeWidth="1.4"/><rect x="3" y="12" width="26" height="3.6" rx="2.2" fill="#34d399" opacity="0.35"/><rect x="6" y="17.5" width="3" height="3" rx="0.5" fill="#0a0e16"/><rect x="10.5" y="17.5" width="3" height="3" rx="0.5" fill="#0a0e16"/><rect x="15" y="17.5" width="3" height="3" rx="0.5" fill="#34d399"/><rect x="19.5" y="17.5" width="3" height="3" rx="0.5" fill="#0a0e16"/><rect x="24" y="17.5" width="3" height="3" rx="0.5" fill="#0a0e16"/></> },
  router:   { color: "#2dd4bf", svg: <><circle cx="16" cy="16" r="11" fill="#155e54" stroke="#2dd4bf" strokeWidth="1.4"/><path d="M16 16l6-6M22 10h-4M22 10v4" stroke="#2dd4bf" strokeWidth="1.6"/><path d="M16 16l-6 6M10 22h4M10 22v-4" stroke="#2dd4bf" strokeWidth="1.6"/></> },
  server:   { color: "#60a5fa", svg: <><rect x="7" y="4" width="18" height="24" rx="2.2" fill="#2b4a73" stroke="#60a5fa" strokeWidth="1.4"/><rect x="10" y="8" width="12" height="2.4" rx="1" fill="#60a5fa" opacity="0.7"/><rect x="10" y="13" width="12" height="2.4" rx="1" fill="#60a5fa" opacity="0.5"/><rect x="10" y="18" width="12" height="2.4" rx="1" fill="#60a5fa" opacity="0.4"/><circle cx="12" cy="24" r="1.2" fill="#34d399"/></> },
  storage:  { color: "#a78bfa", svg: <><ellipse cx="16" cy="8" rx="10" ry="4" fill="#4b3a73" stroke="#a78bfa" strokeWidth="1.4"/><path d="M6 8v16c0 2.2 4.5 4 10 4s10-1.8 10-4V8" fill="#3a2d5c" stroke="#a78bfa" strokeWidth="1.4"/><path d="M6 14c0 2.2 4.5 4 10 4s10-1.8 10-4M6 20c0 2.2 4.5 4 10 4s10-1.8 10-4" stroke="#a78bfa" strokeWidth="1" opacity="0.6"/></> },
  db:       { color: "#c084fc", svg: <><ellipse cx="16" cy="7" rx="9" ry="3.5" fill="#4b3a73" stroke="#c084fc" strokeWidth="1.4"/><path d="M7 7v18c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5V7" fill="#3a2d5c" stroke="#c084fc" strokeWidth="1.4"/><path d="M7 13c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5M7 19c0 1.9 4 3.5 9 3.5s9-1.6 9-3.5" stroke="#c084fc" strokeWidth="1" opacity="0.6"/></> },
  ap:       { color: "#22d3ee", svg: <><rect x="9" y="20" width="14" height="7" rx="2" fill="#155e6b" stroke="#22d3ee" strokeWidth="1.4"/><circle cx="16" cy="23.5" r="1.3" fill="#22d3ee"/><path d="M8 14a11 11 0 0116 0M11.5 16.5a6.5 6.5 0 019 0" stroke="#22d3ee" strokeWidth="1.6" fill="none"/></> },
  lb:       { color: "#fb923c", svg: <><circle cx="16" cy="7" r="3.4" fill="#7a4a1e" stroke="#fb923c" strokeWidth="1.4"/><circle cx="7" cy="25" r="3.4" fill="#7a4a1e" stroke="#fb923c" strokeWidth="1.4"/><circle cx="25" cy="25" r="3.4" fill="#7a4a1e" stroke="#fb923c" strokeWidth="1.4"/><path d="M16 10.4v5M16 15.4L8 21.5M16 15.4L24 21.5" stroke="#fb923c" strokeWidth="1.6"/></> },
  vm:       { color: "#818cf8", svg: <><rect x="5" y="5" width="10" height="10" rx="2" fill="#3a3f7a" stroke="#818cf8" strokeWidth="1.3"/><rect x="17" y="5" width="10" height="10" rx="2" fill="#3a3f7a" stroke="#818cf8" strokeWidth="1.3"/><rect x="5" y="17" width="10" height="10" rx="2" fill="#3a3f7a" stroke="#818cf8" strokeWidth="1.3"/><rect x="17" y="17" width="10" height="10" rx="2" fill="#4d5499" stroke="#818cf8" strokeWidth="1.3"/></> },
  cloud:    { color: "#7dd3fc", svg: <path d="M9 24a6 6 0 010-12 7.5 7.5 0 0114.3-2A5.2 5.2 0 0124 24H9z" fill="#1e4a63" stroke="#7dd3fc" strokeWidth="1.4"/> },
  internet: { color: "#38bdf8", svg: <><circle cx="16" cy="16" r="11" fill="#1e4a63" stroke="#38bdf8" strokeWidth="1.4"/><ellipse cx="16" cy="16" rx="4.5" ry="11" stroke="#38bdf8" strokeWidth="1"/><path d="M5 16h22M7 11h18M7 21h18" stroke="#38bdf8" strokeWidth="1" opacity="0.7"/></> },
  custom:   { color: "#8b96a8", svg: <><circle cx="16" cy="16" r="11" fill="#2a313d" stroke="#8b96a8" strokeWidth="1.4"/><path d="M16 11v6M16 21h.01" stroke="#8b96a8" strokeWidth="2"/></> },
};

const STATUS = {
  ok:   { label: "정상", color: "#34d399" },
  warn: { label: "점검중", color: "#fbbf24" },
  ext:  { label: "외부", color: "#8b96a8" },
};

export interface TopoNodeData {
  label: string;
  icon?: string;
  badge?: string;     // 보안 배지 글자
  ip?: string;
  sub?: string;
  status?: "ok" | "warn" | "ext";
  detail?: { model?: string; serial?: string; os?: string; vendor?: string; netZone?: string; managed?: boolean };
  [key: string]: unknown;
}

const handlePts = [
  { pos: Position.Top, id: "t" },
  { pos: Position.Bottom, id: "b" },
  { pos: Position.Left, id: "l" },
  { pos: Position.Right, id: "r" },
];

export const TopoCardNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as TopoNodeData;
  const ic = ICONS[d.icon || "custom"] || ICONS.custom;
  const st = d.status ? STATUS[d.status] : null;
  const [hover, setHover] = useState(false);
  const hStyle = { background: ic.color, width: 9, height: 9, border: "1.5px solid #0a0e16", opacity: hover ? 1 : 0, transition: "opacity .16s" } as React.CSSProperties;

  return (
    <div style={{ position: "relative", width: 96, textAlign: "center", cursor: "pointer", transform: hover ? "translateY(-3px)" : "none", transition: "transform .16s" }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>

      {handlePts.map((h) => (
        <React.Fragment key={h.id}>
          <Handle type="source" id={`s-${h.id}`} position={h.pos} style={hStyle} />
          <Handle type="target" id={`t-${h.id}`} position={h.pos} style={hStyle} />
        </React.Fragment>
      ))}

      {/* 아이콘 디스크 */}
      <div style={{
        position: "relative", width: 72, height: 72, borderRadius: 18, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `radial-gradient(circle at 32% 26%, ${ic.color}6e, ${ic.color}10 75%)`,
        border: `1px solid ${selected ? "#fff" : ic.color + "8c"}`,
        boxShadow: `0 10px 26px -6px rgba(0,0,0,0.7), 0 0 ${hover ? 30 : 22}px -6px ${ic.color}, inset 0 1px 0 rgba(255,255,255,0.14)`,
      }}>
        <svg width={38} height={38} viewBox="0 0 32 32" fill="none" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.5))" }}>{ic.svg}</svg>
        {d.badge && (
          <span style={{ position: "absolute", bottom: -6, right: -6, minWidth: 22, height: 19, padding: "0 5px", borderRadius: 10, background: "#0d1117", border: `1.5px solid ${ic.color}`, color: ic.color, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{d.badge}</span>
        )}
      </div>

      {/* 이름표 */}
      <div style={{ marginTop: 8, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1, background: "rgba(20,26,37,0.85)", border: "1px solid rgba(148,163,184,0.16)", borderRadius: 8, padding: "4px 9px", maxWidth: 120 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#eef5ff", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 108 }}>
          {st && <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.color, flexShrink: 0 }} />}
          {d.label}
        </span>
        {d.ip && <span style={{ fontSize: 9.5, color: "#8595ab", fontFamily: "monospace" }}>{d.ip}</span>}
      </div>

      {/* 호버 요약 팝업 */}
      {hover && (d.sub || d.ip || st) && (
        <div style={{ position: "absolute", top: -8, left: "100%", marginLeft: 8, width: 150, background: "#11151c", border: `1px solid ${ic.color}66`, borderRadius: 10, padding: "8px 10px", textAlign: "left", zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.6)", pointerEvents: "none" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "#eef5ff", marginBottom: 3 }}>{d.label}</div>
          {d.ip && <Row k="IP" v={d.ip} />}
          {d.sub && <Row k="구분" v={d.sub} />}
          {d.detail?.netZone && <Row k="망" v={d.detail.netZone} />}
          {d.detail?.os && <Row k="OS" v={d.detail.os} />}
          {st && <Row k="상태" v={st.label} color={st.color} />}
          <div style={{ fontSize: 9, color: "#5b6577", marginTop: 4 }}>클릭하면 전체 정보</div>
        </div>
      )}
    </div>
  );
};

const Row: React.FC<{ k: string; v: string; color?: string }> = ({ k, v, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 1 }}>
    <span style={{ color: "#8595ab" }}>{k}</span>
    <span style={{ color: color || "#cbd5e1", fontFamily: k === "IP" ? "monospace" : "inherit" }}>{v}</span>
  </div>
);

// 장비 구분 → 기본 아이콘 (icon_type 비었을 때만 사용)
export function iconForCategory(category?: string | null): string {
  switch (category) {
    case "security": return "security";
    case "network": return "switch";
    case "server": return "server";
    case "software": return "vm";
    default: return "custom";
  }
}
