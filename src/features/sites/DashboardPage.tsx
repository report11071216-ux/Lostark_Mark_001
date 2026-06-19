import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map as MapIcon, X, Share2, ExternalLink } from "lucide-react";
import { C, CYCLE } from "../../lib/constants";
import { useApp } from "../../data/AppProvider";
import { BuildingNode } from "./BuildingNode";
import type { Site } from "../../types/db";

export const DashboardPage: React.FC = () => {
  const { enriched, devices, vendors, engineerName, updateSite } = useApp();
  const nav = useNavigate();
  const boardRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);

  // 배치 좌표 (없으면 자동 그리드 배치)
  const posOf = (s: typeof enriched[number], idx: number) => {
    if (s.map_x != null && s.map_y != null) return { x: s.map_x, y: s.map_y };
    const cols = 4;
    return { x: 60 + (idx % cols) * 150, y: 50 + Math.floor(idx / cols) * 130 };
  };

  const onDown = (e: React.MouseEvent, id: string, pos: { x: number; y: number }) => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { id, offX: e.clientX - rect.left - pos.x, offY: e.clientY - rect.top - pos.y };
  };

  const onMove = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current; const rect = boardRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const x = Math.round((e.clientX - rect.left - d.offX) / 8) * 8;
    const y = Math.round((e.clientY - rect.top - d.offY) / 8) * 8;
    const el = document.getElementById(`bldg-${d.id}`);
    if (el) { el.style.left = `${x}px`; el.style.top = `${y}px`; }
  }, []);

  const onUp = useCallback((e: React.MouseEvent) => {
    const d = dragRef.current; const rect = boardRef.current?.getBoundingClientRect();
    dragRef.current = null;
    if (!d || !rect) return;
    const x = Math.round((e.clientX - rect.left - d.offX) / 8) * 8;
    const y = Math.round((e.clientY - rect.top - d.offY) / 8) * 8;
    // 거의 안 움직였으면 클릭으로 간주
    const moved = Math.abs(x - (posOf(enriched.find((s) => s.id === d.id)!, 0).x)) > 4;
    updateSite(d.id, { map_x: Math.max(0, x), map_y: Math.max(0, y) });
    if (!moved) setSel(d.id);
  }, [enriched, updateSite]);

  const selSite = enriched.find((s) => s.id === sel);
  const devCount = (siteId: string) => devices.filter((d) => d.site_id === siteId).length;
  const venCount = (siteId: string) => vendors.filter((v) => v.site_id === siteId).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapIcon size={17} style={{ color: C.accent }} />
        <span className="text-lg font-bold" style={{ color: C.text }}>사이트 맵</span>
        <span className="text-xs" style={{ color: C.faint }}>건물을 드래그해 배치 · 클릭하면 정보</span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <Legend color="#34d399" label="정상" />
          <Legend color="#fbbf24" label="임박" />
          <Legend color="#f87171" label="지연" />
        </div>
      </div>

      <div
        ref={boardRef}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={() => { dragRef.current = null; }}
        onClick={(e) => { if (e.target === boardRef.current) setSel(null); }}
        style={{
          position: "relative", height: "calc(100vh - 200px)", minHeight: 460, borderRadius: 16, overflow: "hidden",
          border: `1px solid ${C.line}`, userSelect: "none",
          background: `
            radial-gradient(800px 360px at 50% 0%, rgba(45,212,191,0.06), transparent),
            linear-gradient(180deg,#0c1018,#0a0e16)`,
        }}
      >
        {/* 아이소 격자 바닥 */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.5 }}>
          <defs>
            <pattern id="isoGrid" width="64" height="32" patternUnits="userSpaceOnUse" patternTransform="skewY(-12)">
              <path d="M0 0H64M0 0V32" fill="none" stroke="rgba(120,180,200,0.10)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#isoGrid)" />
        </svg>

        {enriched.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint, fontSize: 14 }}>
            등록된 사이트가 없습니다. "점검 현황"에서 사이트를 등록하세요.
          </div>
        )}

        {enriched.map((s, idx) => {
          const pos = posOf(s, idx);
          const blink = s.status === "late" || s.status === "soon";
          return (
            <div
              key={s.id}
              id={`bldg-${s.id}`}
              onMouseDown={(e) => onDown(e, s.id, pos)}
              style={{ position: "absolute", left: pos.x, top: pos.y, cursor: "grab", textAlign: "center", zIndex: sel === s.id ? 5 : 1 }}
            >
              <BuildingNode type={s.building_type} status={s.status} blink={blink} />
              <div style={{ marginTop: -8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.text, background: "rgba(10,14,22,0.85)", border: `1px solid ${C.line}`, borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.status === "late" ? "#f87171" : s.status === "soon" ? "#fbbf24" : "#34d399" }} />
                  {s.name}
                </span>
              </div>
            </div>
          );
        })}

        {/* 클릭 정보 패널 */}
        {selSite && (
          <div style={{ position: "absolute", right: 14, top: 14, width: 240, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, zIndex: 10, boxShadow: "0 14px 36px rgba(0,0,0,0.55)" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{selSite.name}</span>
              <button onClick={() => setSel(null)} style={{ marginLeft: "auto", color: C.faint }}><X size={15} /></button>
            </div>

            <PanelRow k="점검 주기" v={CYCLE[selSite.cycle]?.label || "—"} />
            <PanelRow k="정담당" v={engineerName(selSite.owner_primary_id) || "—"} accent />
            <PanelRow k="부담당" v={engineerName(selSite.owner_secondary_id) || "—"} />
            <PanelRow k="장비" v={`${devCount(selSite.id)}대 · 타사 ${venCount(selSite.id)}`} />

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={() => nav(`/sites/${selSite.id}`)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px", borderRadius: 9, background: C.accent, color: "#06241f", fontSize: 12.5, fontWeight: 700, border: "none", cursor: "pointer" }}>
                <ExternalLink size={13} /> 사이트 상세
              </button>
              <button onClick={() => nav(`/sites/${selSite.id}/topology`)} title="구성도" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 11px", borderRadius: 9, background: "transparent", color: C.accent, fontSize: 12.5, fontWeight: 600, border: `1px solid ${C.line}`, cursor: "pointer" }}>
                <Share2 size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Legend: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#8595ab" }}>
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} /> {label}
  </span>
);

const PanelRow: React.FC<{ k: string; v: string; accent?: boolean }> = ({ k, v, accent }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, padding: "6px 0", borderTop: `1px solid ${C.line2}` }}>
    <span style={{ color: C.faint }}>{k}</span>
    <span style={{ color: accent ? C.accent : C.text, fontWeight: accent ? 700 : 500 }}>{v}</span>
  </div>
);
