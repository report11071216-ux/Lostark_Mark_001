import React, { useState } from "react";
import { C } from "../../lib/constants";
import type { TopoLegend } from "../../types/db";

export interface EdgeDraft {
  source: string; target: string;
  src_port: string; dst_port: string;
  color: string; label: string; dashed: boolean; edge_type: string;
  // 이중화(2회선)
  ha?: boolean;
  src_port2?: string; dst_port2?: string; color2?: string;
}

const EDGE_TYPES = [
  { key: "default", label: "곡선" },
  { key: "smoothstep", label: "직각" },
  { key: "straight", label: "직선" },
];

export const EdgeModal: React.FC<{
  initial: EdgeDraft;
  legends: TopoLegend[];
  sourceName: string;
  targetName: string;
  onSave: (d: EdgeDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
}> = ({ initial, legends, sourceName, targetName, onSave, onClose, onDelete }) => {
  const [f, setF] = useState<EdgeDraft>({ color2: "#fbbf24", src_port2: "", dst_port2: "", ha: false, ...initial });
  const set = <K extends keyof EdgeDraft>(k: K, v: EdgeDraft[K]) => setF({ ...f, [k]: v });

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>케이블 연결</div>

        {/* 주 회선 포트 */}
        <div style={{ fontSize: 11, color: C.accent, marginBottom: 6, fontWeight: 600 }}>{f.ha ? "주 회선" : "회선"}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>출발: {sourceName}</label>
            <input value={f.src_port} onChange={(e) => set("src_port", e.target.value)} placeholder="포트 (예: Gi 0/1)" style={inp} autoFocus />
          </div>
          <div style={{ alignSelf: "flex-end", paddingBottom: 9, color: C.faint }}>→</div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>도착: {targetName}</label>
            <input value={f.dst_port} onChange={(e) => set("dst_port", e.target.value)} placeholder="포트 (예: Gi 0/1)" style={inp} />
          </div>
        </div>

        {/* 이중화 체크 (신규 연결일 때만) */}
        {!onDelete && (
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.text, marginBottom: f.ha ? 10 : 14, fontWeight: 600 }}>
            <input type="checkbox" checked={!!f.ha} onChange={(e) => set("ha", e.target.checked)} /> 이중화 (주/예비 2회선)
          </label>
        )}

        {/* 예비 회선 포트 (이중화 체크 시) */}
        {f.ha && (
          <>
            <div style={{ fontSize: 11, color: "#fbbf24", marginBottom: 6, fontWeight: 600 }}>예비 회선</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>출발 포트</label>
                <input value={f.src_port2} onChange={(e) => set("src_port2", e.target.value)} placeholder="예: Gi 0/2" style={inp} />
              </div>
              <div style={{ alignSelf: "flex-end", paddingBottom: 9, color: C.faint }}>→</div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>도착 포트</label>
                <input value={f.dst_port2} onChange={(e) => set("dst_port2", e.target.value)} placeholder="예: Gi 0/2" style={inp} />
              </div>
            </div>
          </>
        )}

        {/* 선 모양 */}
        <label style={lbl}>선 모양</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {EDGE_TYPES.map((t) => (
            <button key={t.key} onClick={() => set("edge_type", t.key)}
              style={{ flex: 1, fontSize: 12, padding: "7px", borderRadius: 8, cursor: "pointer", border: `1px solid ${f.edge_type === t.key ? C.accent : C.line}`, background: f.edge_type === t.key ? `${C.accent}14` : "transparent", color: f.edge_type === t.key ? C.accent : C.sub }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 색상 (주 회선) */}
        <label style={lbl}>{f.ha ? "주 회선 색" : "색상"}</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: f.ha ? 10 : 12, alignItems: "center" }}>
          {legends.map((l) => (
            <button key={l.id} onClick={() => set("color", l.color)} title={l.name}
              style={{ width: 26, height: 26, borderRadius: 6, background: l.color, border: f.color === l.color ? "2px solid #fff" : `1px solid ${C.line}`, cursor: "pointer" }} />
          ))}
          <input type="color" value={f.color} onChange={(e) => set("color", e.target.value)} style={{ width: 26, height: 26, padding: 0, border: "none", background: "none" }} />
        </div>

        {/* 예비 회선 색 */}
        {f.ha && (
          <>
            <label style={lbl}>예비 회선 색</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
              {legends.map((l) => (
                <button key={l.id} onClick={() => set("color2", l.color)} title={l.name}
                  style={{ width: 26, height: 26, borderRadius: 6, background: l.color, border: f.color2 === l.color ? "2px solid #fff" : `1px solid ${C.line}`, cursor: "pointer" }} />
              ))}
              <input type="color" value={f.color2} onChange={(e) => set("color2", e.target.value)} style={{ width: 26, height: 26, padding: 0, border: "none", background: "none" }} />
            </div>
          </>
        )}

        {/* 가운데 라벨 + 점선 */}
        <label style={lbl}>가운데 라벨 (선택)</label>
        <input value={f.label} onChange={(e) => set("label", e.target.value)} placeholder="예: 광케이블, 10G" style={inp} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sub, margin: "4px 0 14px" }}>
          <input type="checkbox" checked={f.dashed} onChange={(e) => set("dashed", e.target.checked)} /> 점선(흐름 표시)
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          {onDelete && <button onClick={onDelete} style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.line}`, color: C.late, background: "transparent", fontSize: 13, cursor: "pointer" }}>삭제</button>}
          <button onClick={onClose} style={{ marginLeft: "auto", padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.line}`, color: C.sub, background: "transparent", fontSize: 13, cursor: "pointer" }}>취소</button>
          <button onClick={() => onSave(f)} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: C.accent, color: "#06241f", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>저장</button>
        </div>
      </div>
    </div>
  );
};

const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 };
const modal: React.CSSProperties = { width: 380, maxWidth: "90vw", maxHeight: "88vh", overflowY: "auto", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18 };
const lbl: React.CSSProperties = { display: "block", fontSize: 11, color: C.sub, marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: C.panel2, border: `1px solid ${C.line}`, color: C.text, borderRadius: 8, padding: "8px 10px", fontSize: 13, marginBottom: 8, outline: "none" };
