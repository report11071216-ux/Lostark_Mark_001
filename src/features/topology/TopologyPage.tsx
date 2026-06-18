import React, { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant,
  type Connection, type Edge, type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Plus, Cable, Server, Trash2, X } from "lucide-react";
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

export const TopologyPage: React.FC = () => {
  const { siteId = "" } = useParams();
  const { sites, devices } = useApp();
  const site = sites.find((s) => s.id === siteId);
  const siteDevices = devices.filter((d) => d.site_id === siteId);
  const T = useTopology(siteId, siteDevices);

  // 새 연결선에 적용할 색/라벨
  const [drawColor, setDrawColor] = useState("#34d399");
  const [drawLabel, setDrawLabel] = useState("");
  const [drawDashed, setDrawDashed] = useState(false);

  const [selEdge, setSelEdge] = useState<Edge | null>(null);
  const [panel, setPanel] = useState<"node" | "legend" | null>("node");

  // 임의 노드 추가 폼
  const [customLabel, setCustomLabel] = useState("");
  const [customKind, setCustomKind] = useState("internet");
  // 범례 추가 폼
  const [legName, setLegName] = useState("");
  const [legColor, setLegColor] = useState("#34d399");

  const onConnect = useCallback((c: Connection) => {
    if (c.source && c.target) T.addEdge(c.source, c.target, drawColor, drawLabel, drawDashed);
  }, [T, drawColor, drawLabel, drawDashed]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    T.saveNodePos(node.id, node.position.x, node.position.y);
  }, [T]);

  if (!site) return <div style={{ color: C.faint, padding: 40, textAlign: "center" }}>사이트를 찾을 수 없습니다. <Link to="/sites" style={{ color: C.accent }}>목록으로</Link></div>;

  const devicesOnCanvas = new Set(T.nodes.map((n) => (n.data as { device_id?: string }).device_id).filter(Boolean));
  const availableDevices = siteDevices.filter((d) => !devicesOnCanvas.has(d.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Link to={`/sites/${siteId}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.faint, textDecoration: "none" }}>
          <ArrowLeft size={13} /> {site.name}
        </Link>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text, marginLeft: 4 }}>네트워크 구성도</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button onClick={() => setPanel(panel === "node" ? null : "node")} style={tabBtn(panel === "node")}><Plus size={13} /> 노드</button>
          <button onClick={() => setPanel(panel === "legend" ? null : "legend")} style={tabBtn(panel === "legend")}><Cable size={13} /> 선 색상</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
        {/* 캔버스 */}
        <div style={{ flex: 1, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.line}`, position: "relative", background: "#0a0e16" }}>
          <ReactFlow
            nodes={T.nodes} edges={T.edges} nodeTypes={nodeTypes}
            onNodesChange={T.onNodesChange} onEdgesChange={T.onEdgesChange}
            onConnect={onConnect} onNodeDragStop={onNodeDragStop}
            onEdgeClick={(_, e) => setSelEdge(e)}
            fitView proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Lines} gap={30} color="rgba(120,160,220,0.06)" />
            <Controls style={{ background: C.panel2, border: `1px solid ${C.line}` }} />
            <MiniMap pannable zoomable style={{ background: C.panel }} maskColor="rgba(0,0,0,0.6)" nodeColor={() => C.accent} />
          </ReactFlow>

          {/* 선 편집 팝업 */}
          {selEdge && (
            <div style={{ position: "absolute", right: 12, top: 12, width: 220, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>연결선 편집</span>
                <button onClick={() => setSelEdge(null)} style={{ marginLeft: "auto", color: C.faint }}><X size={14} /></button>
              </div>
              <label style={lbl}>라벨</label>
              <input defaultValue={selEdge.label as string || ""} onBlur={(e) => T.updateEdge(selEdge.id, { label: e.target.value })} style={inp} placeholder="예: G1/0/1, 10G" />
              <label style={lbl}>색상</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {T.legends.map((l) => (
                  <button key={l.id} onClick={() => T.updateEdge(selEdge.id, { color: l.color })} title={l.name}
                    style={{ width: 22, height: 22, borderRadius: 6, background: l.color, border: `1px solid ${C.line}` }} />
                ))}
                <input type="color" onChange={(e) => T.updateEdge(selEdge.id, { color: e.target.value })} style={{ width: 22, height: 22, padding: 0, border: "none", background: "none" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.sub, marginBottom: 10 }}>
                <input type="checkbox" defaultChecked={selEdge.animated} onChange={(e) => T.updateEdge(selEdge.id, { dashed: e.target.checked })} /> 점선(흐름 표시)
              </label>
              <button onClick={() => { T.deleteEdge(selEdge.id); setSelEdge(null); }} style={{ width: "100%", padding: "7px", borderRadius: 8, border: `1px solid ${C.line}`, color: C.late, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
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
                  <button key={d.id} onClick={() => T.addNode({ label: d.system_name, kind: "device", device_id: d.id })}
                    style={listItem}>
                    <Plus size={12} /> {d.system_name}
                  </button>
                ))}

                <div style={{ ...sectTitle, marginTop: 16 }}><Plus size={13} /> 임의 노드</div>
                <div style={{ fontSize: 11, color: C.faint, marginBottom: 6 }}>인터넷·클라우드 등</div>
                <select value={customKind} onChange={(e) => setCustomKind(e.target.value)} style={inp}>
                  {KIND_OPTIONS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
                </select>
                <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="이름 (예: 외부 인터넷)" style={inp} />
                <button onClick={() => { if (!customLabel.trim()) return; T.addNode({ label: customLabel.trim(), kind: customKind }); setCustomLabel(""); }}
                  style={{ ...primaryBtn, marginTop: 4 }}>추가</button>
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
                <button onClick={() => { if (!legName.trim()) return; T.addLegend(legName.trim(), legColor); setLegName(""); }}
                  style={{ ...primaryBtn, marginTop: 6 }}>범례 추가</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const tabBtn = (on: boolean): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "6px 11px", borderRadius: 8, border: `1px solid ${on ? C.accent : C.line}`, background: on ? `${C.accent}14` : "transparent", color: on ? C.accent : C.sub });
const sectTitle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: C.text, marginBottom: 8 };
const lbl: React.CSSProperties = { display: "block", fontSize: 11, color: C.sub, marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: C.panel2, border: `1px solid ${C.line}`, color: C.text, borderRadius: 8, padding: "7px 9px", fontSize: 12.5, marginBottom: 8, outline: "none" };
const primaryBtn: React.CSSProperties = { width: "100%", background: C.accent, color: "#06241f", border: "none", borderRadius: 8, padding: "8px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const listItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left", background: C.panel2, border: `1px solid ${C.line}`, color: C.text, borderRadius: 8, padding: "7px 9px", fontSize: 12, marginBottom: 6, cursor: "pointer" };
