import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map as MapIcon, X, Share2, ExternalLink, Plus, Layers, Trash2 } from "lucide-react";
import { C, CYCLE } from "../../lib/constants";
import { useApp } from "../../data/AppProvider";
import { useMapZones } from "./useMapZones";
import { BuildingNode } from "./BuildingNode";
import type { MapZone } from "../../types/db";

// 아이소 마름모 꼭짓점 (중심 cx,cy / 가로 w / 세로 h)
const diamond = (cx: number, cy: number, w: number, h: number) =>
  `${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`;

export const DashboardPage: React.FC = () => {
  const { enriched, devices, vendors, engineerName, updateSite } = useApp();
  const Z = useMapZones();
  const nav = useNavigate();
  const boardRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [zoneMode, setZoneMode] = useState(false);
  const [editZone, setEditZone] = useState<MapZone | null>(null);
  const [newZone, setNewZone] = useState(false);
  const [zName, setZName] = useState("");
  const [zColor, setZColor] = useState("#2dd4bf");

  const dragB = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const dragZ = useRef<{ id: string; mode: "move" | "resize"; offX: number; offY: number } | null>(null);

  const posOf = (s: typeof enriched[number], idx: number) => {
    if (s.map_x != null && s.map_y != null) return { x: s.map_x, y: s.map_y };
    const cols = 4;
    return { x: 60 + (idx % cols) * 150, y: 50 + Math.floor(idx / cols) * 130 };
  };

  // ── 건물 드래그 ──
  const onBDown = (e: React.MouseEvent, id: string, pos: { x: number; y: number }) => {
    if (zoneMode) return;
    const r = boardRef.current?.getBoundingClientRect(); if (!r) return;
    dragB.current = { id, offX: e.clientX - r.left - pos.x, offY: e.clientY - r.top - pos.y };
  };

  // ── 구역 드래그 ──
  const onZDown = (e: React.MouseEvent, z: MapZone, mode: "move" | "resize") => {
    e.stopPropagation();
    const r = boardRef.current?.getBoundingClientRect(); if (!r) return;
    dragZ.current = { id: z.id, mode, offX: e.clientX - r.left - z.cx, offY: e.clientY - r.top - z.cy };
  };

  const onMove = useCallback((e: React.MouseEvent) => {
    const r = boardRef.current?.getBoundingClientRect(); if (!r) return;
    if (dragB.current) {
      const x = Math.round((e.clientX - r.left - dragB.current.offX) / 8) * 8;
      const y = Math.round((e.clientY - r.top - dragB.current.offY) / 8) * 8;
      const el = document.getElementById(`bldg-${dragB.current.id}`);
      if (el) { el.style.left = `${Math.max(0, x)}px`; el.style.top = `${Math.max(0, y)}px`; }
    } else if (dragZ.current) {
      const d = dragZ.current;
      if (d.mode === "move") {
        const cx = Math.round((e.clientX - r.left - d.offX) / 8) * 8;
        const cy = Math.round((e.clientY - r.top - d.offY) / 8) * 8;
        Z.updateZone(d.id, { cx: Math.max(40, cx), cy: Math.max(40, cy) });
      } else {
        const z = Z.zones.find((x) => x.id === d.id); if (!z) return;
        const w = Math.max(120, Math.round((e.clientX - r.left - z.cx) * 2 / 16) * 16);
        const h = Math.max(80, Math.round((e.clientY - r.top - z.cy) * 2 / 16) * 16);
        Z.updateZone(d.id, { w, h });
      }
    }
  }, [Z]);

  const onUp = useCallback((e: React.MouseEvent) => {
    const r = boardRef.current?.getBoundingClientRect();
    if (dragB.current && r) {
      const d = dragB.current;
      const x = Math.max(0, Math.round((e.clientX - r.left - d.offX) / 8) * 8);
      const y = Math.max(0, Math.round((e.clientY - r.top - d.offY) / 8) * 8);
      const orig = posOf(enriched.find((s) => s.id === d.id)!, 0);
      const moved = Math.abs(x - orig.x) > 4 || Math.abs(y - orig.y) > 4;
      updateSite(d.id, { map_x: x, map_y: y });
      if (!moved) setSel(d.id);
    }
    dragB.current = null; dragZ.current = null;
  }, [enriched, updateSite]);

  const selSite = enriched.find((s) => s.id === sel);
  const devCount = (id: string) => devices.filter((d) => d.site_id === id).length;
  const venCount = (id: string) => vendors.filter((v) => v.site_id === id).length;

  const submitZone = () => {
    if (!zName.trim()) return;
    Z.addZone(zName.trim(), zColor);
    setZName(""); setNewZone(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <MapIcon size={17} style={{ color: C.accent }} />
        <span className="text-lg font-bold" style={{ color: C.text }}>사이트 맵</span>
        <span className="text-xs" style={{ color: C.faint }}>{zoneMode ? "구역 편집 중 — 구역 드래그/크기조절" : "건물 드래그 배치 · 클릭 정보"}</span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-3 text-xs mr-2">
            <Legend color="#34d399" label="정상" /><Legend color="#fbbf24" label="임박" /><Legend color="#f87171" label="지연" />
          </div>
          <button onClick={() => { setZoneMode(!zoneMode); setSel(null); }} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{ border: `1px solid ${zoneMode ? C.accent : C.line}`, background: zoneMode ? `${C.accent}14` : "transparent", color: zoneMode ? C.accent : C.sub }}>
            <Layers size={13} /> 구역 {zoneMode ? "완료" : "편집"}
          </button>
          {zoneMode && (
            <button onClick={() => setNewZone(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: C.accent, color: "#06241f" }}>
              <Plus size={13} /> 구역 추가
            </button>
          )}
        </div>
      </div>

      {newZone && (
        <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <input type="color" value={zColor} onChange={(e) => setZColor(e.target.value)} style={{ width: 32, height: 32, padding: 0, border: "none", background: "none" }} />
          <input value={zName} onChange={(e) => setZName(e.target.value)} placeholder="구역 이름 (예: 서울, 강원, 원주)" autoFocus
            className="rounded-lg px-3 py-2 text-sm outline-none" style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.text, width: 240 }} />
          <button onClick={submitZone} className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: C.accent, color: "#06241f" }}>추가</button>
          <button onClick={() => setNewZone(false)} className="rounded-lg px-3 py-2 text-xs" style={{ border: `1px solid ${C.line}`, color: C.sub }}>취소</button>
        </div>
      )}

      <div
        ref={boardRef} onMouseMove={onMove} onMouseUp={onUp}
        onMouseLeave={() => { dragB.current = null; dragZ.current = null; }}
        onClick={(e) => { if (e.target === boardRef.current) { setSel(null); setEditZone(null); } }}
        style={{ position: "relative", height: "calc(100vh - 210px)", minHeight: 460, borderRadius: 16, overflow: "hidden",
          border: `1px solid ${C.line}`, userSelect: "none",
          background: `radial-gradient(800px 360px at 50% 0%, rgba(45,212,191,0.06), transparent), linear-gradient(180deg,#0c1018,#0a0e16)` }}
      >
        {/* 아이소 입체 바닥 + 구역 마름모 */}
        <svg viewBox="0 0 860 560" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            <linearGradient id="isoTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16242f" /><stop offset="100%" stopColor="#0d1822" /></linearGradient>
          </defs>
          <polygon points="430,40 830,300 430,540 30,300" fill="url(#isoTop)" stroke="rgba(45,212,191,0.22)" strokeWidth="1.5" />
          <polygon points="30,300 430,540 430,556 30,316" fill="#0a121a" stroke="rgba(45,212,191,0.12)" strokeWidth="1" />
          <polygon points="830,300 430,540 430,556 830,316" fill="#070e15" stroke="rgba(45,212,191,0.12)" strokeWidth="1" />
          <g stroke="rgba(120,180,200,0.10)" strokeWidth="1">
            <line x1="130" y1="105" x2="530" y2="365" /><line x1="230" y1="105" x2="630" y2="365" /><line x1="330" y1="105" x2="730" y2="365" />
            <line x1="730" y1="105" x2="330" y2="365" /><line x1="630" y1="105" x2="230" y2="365" /><line x1="530" y1="105" x2="130" y2="365" />
          </g>
        </svg>

        {/* 구역 마름모 (HTML-SVG 오버레이, 좌표는 board 픽셀) */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          {Z.zones.map((z) => (
            <g key={z.id}>
              <polygon points={diamond(z.cx, z.cy, z.w, z.h)} fill={`${z.color}1a`} stroke={z.color} strokeWidth={editZone?.id === z.id ? 2.5 : 1.6} strokeDasharray="6 5"
                style={{ pointerEvents: zoneMode ? "all" : "none", cursor: "move" }}
                onMouseDown={(e) => onZDown(e as unknown as React.MouseEvent, z, "move")}
                onClick={(e) => { e.stopPropagation(); if (zoneMode) setEditZone(z); }} />
              <text x={z.cx} y={z.cy - z.h / 2 + 18} fill={z.color} fontSize={13} fontWeight={800} textAnchor="middle" style={{ pointerEvents: "none" }}>{z.name}</text>
              {zoneMode && (
                <circle cx={z.cx + z.w / 2} cy={z.cy} r={6} fill={z.color} stroke="#0a0e16" strokeWidth={1.5}
                  style={{ pointerEvents: "all", cursor: "nwse-resize" }}
                  onMouseDown={(e) => onZDown(e as unknown as React.MouseEvent, z, "resize")} />
              )}
            </g>
          ))}
        </svg>

        {enriched.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint, fontSize: 14 }}>
            등록된 사이트가 없습니다. "점검 현황"에서 사이트를 등록하세요.
          </div>
        )}

        {/* 건물 */}
        {enriched.map((s, idx) => {
          const pos = posOf(s, idx);
          const blink = s.status === "late" || s.status === "soon";
          return (
            <div key={s.id} id={`bldg-${s.id}`} onMouseDown={(e) => onBDown(e, s.id, pos)}
              style={{ position: "absolute", left: pos.x, top: pos.y, cursor: zoneMode ? "default" : "grab", textAlign: "center", zIndex: sel === s.id ? 5 : 2, pointerEvents: zoneMode ? "none" : "auto" }}>
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

        {/* 건물 정보 패널 */}
        {selSite && !zoneMode && (
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

        {/* 구역 편집 패널 */}
        {editZone && zoneMode && (
          <div style={{ position: "absolute", right: 14, top: 14, width: 220, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, zIndex: 10, boxShadow: "0 14px 36px rgba(0,0,0,0.55)" }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>구역 편집</span>
              <button onClick={() => setEditZone(null)} style={{ marginLeft: "auto", color: C.faint }}><X size={14} /></button>
            </div>
            <label style={{ fontSize: 11, color: C.sub }}>이름</label>
            <input defaultValue={editZone.name} onBlur={(e) => Z.updateZone(editZone.id, { name: e.target.value })}
              className="w-full rounded-lg px-2.5 py-2 text-sm outline-none mt-1 mb-2" style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.text }} />
            <label style={{ fontSize: 11, color: C.sub }}>색상</label>
            <div className="flex items-center gap-2 mt-1 mb-3">
              <input type="color" defaultValue={editZone.color} onChange={(e) => Z.updateZone(editZone.id, { color: e.target.value })} style={{ width: 30, height: 30, padding: 0, border: "none", background: "none" }} />
              <span style={{ fontSize: 11, color: C.faint }}>마름모를 드래그해 이동, 우측 점으로 크기조절</span>
            </div>
            <button onClick={() => { if (confirm(`'${editZone.name}' 구역을 삭제할까요?`)) { Z.deleteZone(editZone.id); setEditZone(null); } }}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs" style={{ border: `1px solid ${C.line}`, color: C.late }}>
              <Trash2 size={13} /> 구역 삭제
            </button>
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
