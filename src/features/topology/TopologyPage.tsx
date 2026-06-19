import React, { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant,
  getNodesBounds, getViewportForBounds,
  type Connection, type Edge, type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";
import { ArrowLeft, Plus, Cable, Server, Trash2, X, Download, Check } from "lucide-react";
import { C } from "../../lib/constants";
import { useApp } from "../../data/AppProvider";
import { useTopology } from "./useTopology";
import { TopoCardNode } from "./TopoCardNode";

const nodeTypes = { card: TopoCardNode };

const KIND_OPTIONS = [
  { kind: "internet", label: "인터넷" },
  { kind: "cloud", label: "클라우드" },
  { kind: "switch", label: "스위치" },
  { kind: "lb", label: "부하분산(L4/L7)" },
  { kind: "ap", label: "무선 AP" },
  { kind: "db", label: "DB/스토리지" },
  { kind: "vm", label: "가상화" },
  { kind: "custom", label: "기타" },
];

const EDGE_TYPES: { key: string; label: string }[] = [
  { key: "default", label: "곡선" },
  { key: "smoothstep", label: "직각" },
  { key: "straight", label: "직선" },
];

export const TopologyPage: React.FC = () => {
  const { siteId = "" } = useParams();
  const { sites, devices } = useApp();
  const site = sites.find((s) => s.id === siteId);
  const siteDevices = devices.filter((d) => d.site_id === siteId);
  const T = useTopology(siteId, siteDevices);

  const [drawColor, setDrawColor] = useState("#34d399");
  const [drawLabel, setDrawLabel] = useState("");
  const [drawDashed, setDrawDashed] = useState(false);
  const [edgeType, setEdgeType] = useState("default");

  const [selEdge, setSelEdge] = useState<Edge | null>(null);
  const [panel, setPanel] = useState<"node" | "legend" | null>("node");
  const [saved, setSaved] = useState(true);

  const [customLabel, setCustomLabel] = useState("");
  const [customKind, setCustomKind] = useState("internet");
  const [legName, setLegName] = useState("");
  const [legColor, setLegColor] = useState("#34d399");

  const flash = useCallback(() => { setSaved(false); setTimeout(() => setSaved(true), 600); }, []);

  // 화면에 그릴 때 선 종류를 입혀줌
  const styledEdges = T.edges.map((e) => ({ ...e, type: edgeType }));

  const onConnect = useCallback((c: Connection) => {
    if (c.source && c.target) { T.addEdge(c.source, c.target, drawColor, drawLabel, drawDashed); flash(); }
  }, [T, drawColor, drawLabel, drawDashed, flash]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    T.saveNodePos(node.id, node.position.x, node.position.y); flash();
  }, [T, flash]);

  // Delete 키로 선택 삭제
  const onNodesDelete = useCallback((deleted: Node[]) => { deleted.forEach((n) => T.deleteNode(n.id)); flash(); }, [T, flash]);
  const onEdgesDelete = useCallback((deleted: Edge[]) => { deleted.forEach((e) => T.deleteEdge(e.id)); flash(); }, [T, flash]);

  // PNG 내보내기
  const exportPng = useCallback(() => {
    const vp = document.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!vp || T.nodes.length === 0) { alert("내보낼 노드가 없습니다."); return; }
    const bounds = getNodesBounds(T.nodes);
    const w = 1400, h = 900;
    const tf = getViewportForBounds(bounds, w, h, 0.5, 2, 0.15);
    toPng(vp, {
      backgroundColor: "#0a0e16", width: w, height: h,
      style: { width: `${w}px`, height: `${h}px`, transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.zoom})` },
    }).then((url) => {
      const a = document.createElement("a");
      a.download = `${site?.name || "topology"}_구성도.png`;
      a.href = url; a.click();
    }).catch(() => alert("이미지 생성에 실패했습니다."));
  }, [T.nodes, site]);

  if (!site) return <div style={{ color: C.faint, padding: 40, textAlign: "center" }}>사이트를 찾을 수 없습니다. <Link to="/sites" style={{ color: C.accent }}>목록으로</Link></div>;

  const devicesOnCanvas = new Set(T.nodes.map((n) => (n.data as { device_id?: string }).device_id).filter(Boolean));
  const availableDevices = siteDevices.filter((d) => !devicesOnCanvas.has(d.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
      {/* 툴바 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "8px 12px", marginBottom: 10, flexWrap: "wrap" }}>
        <Link to={`/sites/${siteId}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.faint, textDecoration: "none" }}>
          <ArrowLeft size={13} /> {site.name}
        </Link>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>네트워크 구성도</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: saved ? "#34d399" : C.soon }}>
          {saved ? <><Check size={12} /> 자동 저장됨</> : "저장 중…"}
        </span>

        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.sub }}>선:</span>
          <div style={{ display: "flex", border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
            {EDGE_TYPES.map((t) => (
              <button key={t.key} onClick={() => setEdgeType(t.key)}
                style={{ fontSize: 11, padding: "5px 10px", background: edgeType === t.key ? C.accent : "transparent", color: edgeType === t.key ? "#06241f" : C.sub, fontWeight: edgeType === t.key ? 600 : 400, border: "none", cursor: "pointer" }}>
                {t.label}
              </button>
            ))}
          </div>
          <span style={{ width: 1, height: 18, background: C.line, margin: "0 2px" }} />
          <button onClick={exportPng} style={topBtn}><Download size={13} /> PNG</button>
          <button onClick={() => setPanel(panel === "node" ? null : "node")} style={topBtn2(panel === "node")}><Plus size={13} /> 노드</button>
          <button onClick={() => setPanel(panel === "legend" ? null : "legend")} style={topBtn2(panel === "legend")}><Cable size={13} /> 선 색상</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
        {/* 캔버스 */}
        <div style={{ flex: 1, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.line}`, position: "relative", background: "#0a0e16" }}>
          <ReactFlow
            nodes={T.nodes} edges={styledEdges} nodeTypes={nodeTypes}
            onNodesChange={T.onNodesChange} onEdgesChange={T.onEdgesChange}
            onConnect={onConnect} onNodeDragStop={onNodeDragStop}
            onNodesDelete={onNodesDelete} onEdgesDelete={onEdgesDelete}
            onEdgeClick={(_, e) => setSelEdge(e)}
            deleteKeyCode={["Delete", "Backspace"]}
            fitView proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Lines} gap={28} color="rgba(120,160,220,0.05)" />
            <Controls style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: "none" }} />
            <MiniMap pannable zoomable style={{ background: C.panel, border: `1px solid ${C.line}` }} maskColor="rgba(0,0,0,0.65)" nodeColor={() => C.accent} />
          </ReactFlow>

          {selEdge && (
            <div style={{ position: "absolute", right: 12, top: 12, width: 220, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>연결선 편집</span>
                <button onClick={() => setSelEdge(null)} style={{ marginLeft: "auto", color: C.faint }}><X size={14} /></button>
              </div>
              <label style={lbl}>라벨</label>
              <input defaultValue={selEdge.label as string || ""} onBlur={(e) => { T.updateEdge(selEdge.id, { label: e.target.value }); flash(); }} style={inp} placeholder="예: G1/0/1, 10G" />
              <label style={lbl}>색상</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {T.legends.map((l) => (
                  <button key={l.id} onClick={() => { T.updateEdge(selEdge.id, { color: l.color }); flash(); }} title={l.name}
                    style={{ width: 22, height: 22, borderRadius: 6, background: l.color, border: `1px solid ${C.line}` }} />
                ))}
                <input type="color" onChange={(e) => { T.updateEdge(selEdge.id, { color: e.target.value }); flash(); }} style={{ width: 22, height: 22, padding: 0, border: "none", background: "none" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sub, marginBottom: 10 }}>
                <input type="checkbox" defaultChecked={selEdge.animated} onChange={(e) => { T.updateEdge(selEdge.id, { dashed: e.target.checked }); flash(); }} /> 점선(흐름 표시)
              </label>
              <button onClick={() => { T.deleteEdge(selEdge.id); setSelEdge(null); flash(); }} style={{ width: "100%", padding: "7px", borderRadius: 8, border: `1px solid ${C.line}`, color: C.late, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "transparent", cursor: "pointer" }}>
                <Trash2 size={13} /> 연결 삭제
              </button>
            </div>
          )}
        </div>

        {/* 사이드 패널 */}
        {panel && (
          <div style={{ width: 232, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, overflowY: "auto" }}>
            {panel === "node" && (
              <>
                <div style={sectTitle}><Server size={13} /> 장비 노드</div>
                <div style={{ fontSize: 11, color: C.faint, marginBottom: 6 }}>등록된 장비를 캔버스에 추가</div>
                {availableDevices.length === 0 && <div style={{ fontSize: 11, color: C.faint, marginBottom: 10 }}>추가할 장비가 없습니다.</div>}
                {availableDevices.map((d) => (
                  <button key={d.id} onClick={() => { T.addNode({ label: d.system_name, kind: "device", device_id: d.id }); flash(); }} style={listItem}>
                    <Plus size={12} /> {d.system_name}
                  </button>
                ))}

                <div style={{ ...sectTitle, marginTop: 16 }}><Plus size={13} /> 임의 노드</div>
                <div style={{ fontSize: 11, color: C.faint, marginBottom: 6 }}>인터넷·클라우드 등</div>
                <select value={customKind} onChange={(e) => setCustomKind(e.target.value)} style={inp}>
                  {KIND_OPTIONS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
                </select>
                <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="이름 (예: 외부 인터넷)" style={inp} />
                <button onClick={() => { if (!customLabel.trim()) return; T.addNode({ label: customLabel.trim(), kind: customKind }); setCustomLabel(""); flash(); }} style={{ ...primaryBtn, marginTop: 4 }}>추가</button>

                <div style={{ fontSize: 11, color: C.faint, marginTop: 16, lineHeight: 1.6 }}>
                  · 노드에 마우스를 올리면 <span style={{ color: C.late }}>X</span>로 삭제<br />
                  · 노드/선 선택 후 <b style={{ color: C.text }}>Delete</b> 키로도 삭제<br />
                  · 위치·연결은 자동 저장됩니다
                </div>
              </>
            )}

            {panel === "legend" && (
              <>
                <div style={sectTitle}><Cable size={13} /> 새 연결선 설정</div>
                <div style={{ fontSize: 11, color: C.faint, marginBottom: 6 }}>지금 그릴 선의 색·라벨</div>
                <label style={lbl}>색상</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {T.legends.map((l) => (
                    <button key={l.id} onClick={() => setDrawColor(l.color)} title={l.name}
                      style={{ width: 24, height: 24, borderRadius: 6, background: l.color, border: drawColor === l.color ? `2px solid #fff` : `1px solid ${C.line}` }} />
                  ))}
                  <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} style={{ width: 24, height: 24, padding: 0, border: "none", background: "none" }} />
                </div>
                <label style={lbl}>라벨(선택)</label>
                <input value={drawLabel} onChange={(e) => setDrawLabel(e.target.value)} placeholder="예: 주 회선" style={inp} />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sub, margin: "6px 0 12px" }}>
                  <input type="checkbox" checked={drawDashed} onChange={(e) => setDrawDashed(e.target.checked)} /> 점선(흐름 표시)
                </label>
                <div style={{ fontSize: 11, color: C.faint, marginBottom: 12 }}>노드 아래 점 → 다른 노드로 드래그하면 이 설정으로 연결됩니다.</div>

                <div style={sectTitle}>색상 범례 관리</div>
                {T.legends.map((l) => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, background: l.color }} />
                    <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{l.name}</span>
                    <button onClick={() => T.deleteLegend(l.id)} style={{ color: C.faint }}><Trash2 size={12} /></button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input type="color" value={legColor} onChange={(e) => setLegColor(e.target.value)} style={{ width: 30, height: 30, padding: 0, border: "none", background: "none" }} />
                  <input value={legName} onChange={(e) => setLegName(e.target.value)} placeholder="이름 (주 회선)" style={{ ...inp, marginBottom: 0 }} />
                </div>
                <button onClick={() => { if (!legName.trim()) return; T.addLegend(legName.trim(), legColor); setLegName(""); }} style={{ ...primaryBtn, marginTop: 6 }}>범례 추가</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const topBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "6px 11px", borderRadius: 8, border: `1px solid ${C.line}`, background: "transparent", color: C.text, cursor: "pointer" };
const topBtn2 = (on: boolean): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "6px 11px", borderRadius: 8, border: `1px solid ${on ? C.accent : C.line}`, background: on ? `${C.accent}14` : "transparent", color: on ? C.accent : C.sub, cursor: "pointer" });
const sectTitle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: C.text, marginBottom: 8 };
const lbl: React.CSSProperties = { display: "block", fontSize: 11, color: C.sub, marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: C.panel2, border: `1px solid ${C.line}`, color: C.text, borderRadius: 8, padding: "7px 9px", fontSize: 12.5, marginBottom: 8, outline: "none" };
const primaryBtn: React.CSSProperties = { width: "100%", background: C.accent, color: "#06241f", border: "none", borderRadius: 8, padding: "8px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const listItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left", background: C.panel2, border: `1px solid ${C.line}`, color: C.text, borderRadius: 8, padding: "7px 9px", fontSize: 12, marginBottom: 6, cursor: "pointer" };
