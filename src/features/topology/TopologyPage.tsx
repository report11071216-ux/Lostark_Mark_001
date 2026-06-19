import React, { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant,
  getNodesBounds, getViewportForBounds,
  type Connection, type Edge, type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";
import { ArrowLeft, Plus, Cable, Server, Download, Check, X } from "lucide-react";
import { C } from "../../lib/constants";
import { useApp } from "../../data/AppProvider";
import { useTopology } from "./useTopology";
import { TopoCardNode } from "./TopoCardNode";
import { TopoEdge } from "./TopoEdge";
import { EdgeModal, type EdgeDraft } from "./EdgeModal";

const nodeTypes = { card: TopoCardNode };
const edgeTypes = { default: TopoEdge, smoothstep: TopoEdge, straight: TopoEdge };

const KIND_OPTIONS = [
  { kind: "internet", label: "인터넷" },
  { kind: "cloud", label: "클라우드" },
  { kind: "backbone", label: "백본" },
  { kind: "switch", label: "스위치" },
  { kind: "router", label: "라우터" },
  { kind: "firewall", label: "방화벽" },
  { kind: "security", label: "보안" },
  { kind: "lb", label: "부하분산" },
  { kind: "ap", label: "무선 AP" },
  { kind: "db", label: "DB" },
  { kind: "storage", label: "스토리지" },
  { kind: "vm", label: "가상화" },
  { kind: "custom", label: "기타" },
];

export const TopologyPage: React.FC = () => {
  const { siteId = "" } = useParams();
  const { sites, devices } = useApp();
  const site = sites.find((s) => s.id === siteId);
  const siteDevices = devices.filter((d) => d.site_id === siteId);
  const T = useTopology(siteId, siteDevices);

  const [panel, setPanel] = useState<"node" | "legend" | null>("node");
  const [saved, setSaved] = useState(true);
  const [edgeModal, setEdgeModal] = useState<{ draft: EdgeDraft; editId: string | null; sh?: string | null; th?: string | null } | null>(null);
  const [infoNode, setInfoNode] = useState<Node | null>(null);

  const [customLabel, setCustomLabel] = useState("");
  const [customKind, setCustomKind] = useState("internet");
  const [legName, setLegName] = useState("");
  const [legColor, setLegColor] = useState("#34d399");

  const flash = useCallback(() => { setSaved(false); setTimeout(() => setSaved(true), 600); }, []);

  const nodeName = useCallback((id: string) => {
    const n = T.nodes.find((x) => x.id === id);
    return (n?.data as { label?: string })?.label || "노드";
  }, [T.nodes]);

  const styledEdges: Edge[] = T.edges.map((e) => ({ ...e, label: undefined }));

 // 예비 회선도 주 회선과 같은 방향 핸들에 붙여 가운데로 모음
  const altHandles = (sh?: string | null, th?: string | null): { s: string; t: string } => {
    return { s: sh || "s-r", t: th || "t-l" };
  };

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target) return;
    setEdgeModal({
      editId: null, sh: c.sourceHandle, th: c.targetHandle,
      draft: { source: c.source, target: c.target, src_port: "", dst_port: "", color: "#34d399", label: "", dashed: false, edge_type: "default" },
    });
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, e: Edge) => {
    const d = (e.data || {}) as Partial<EdgeDraft>;
    setEdgeModal({
      editId: e.id,
      draft: {
        source: e.source, target: e.target,
        src_port: d.src_port || "", dst_port: d.dst_port || "",
        color: d.color || "#34d399", label: d.label || "", dashed: !!d.dashed, edge_type: d.edge_type || "default",
      },
    });
  }, []);

  const saveEdge = useCallback((d: EdgeDraft) => {
    if (edgeModal?.editId) {
      T.updateEdge(edgeModal.editId, { src_port: d.src_port, dst_port: d.dst_port, color: d.color, label: d.label, dashed: d.dashed, edge_type: d.edge_type });
    } else {
      // 주 회선
      T.addEdge({ source: d.source, target: d.target, src_port: d.src_port, dst_port: d.dst_port, color: d.color, label: d.label, dashed: d.dashed, edge_type: d.edge_type, source_handle: edgeModal?.sh, target_handle: edgeModal?.th });
      // 예비 회선 (이중화 체크 시) — 다른 핸들에 붙여 두 줄로
      if (d.ha) {
        const alt = altHandles(edgeModal?.sh, edgeModal?.th);
        T.addEdge({ source: d.source, target: d.target, src_port: d.src_port2 || "", dst_port: d.dst_port2 || "", color: d.color2 || "#fbbf24", label: "", dashed: d.dashed, edge_type: d.edge_type, source_handle: alt.s, target_handle: alt.t });
      }
    }
    setEdgeModal(null); flash();
  }, [edgeModal, T, flash]);

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    T.saveNodePos(node.id, node.position.x, node.position.y); flash();
  }, [T, flash]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => setInfoNode(node), []);

  const onNodesDelete = useCallback((deleted: Node[]) => { deleted.forEach((n) => T.deleteNode(n.id)); flash(); }, [T, flash]);
  const onEdgesDelete = useCallback((deleted: Edge[]) => { deleted.forEach((e) => T.deleteEdge(e.id)); flash(); }, [T, flash]);

  const exportPng = useCallback(() => {
    const vp = document.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!vp || T.nodes.length === 0) { alert("내보낼 노드가 없습니다."); return; }
    const bounds = getNodesBounds(T.nodes);
    const w = 1400, h = 900;
    const tf = getViewportForBounds(bounds, w, h, 0.5, 2, 0.15);
    toPng(vp, { backgroundColor: "#0a0e16", width: w, height: h, style: { width: `${w}px`, height: `${h}px`, transform: `translate(${tf.x}px, ${tf.y}px) scale(${tf.zoom})` } })
      .then((url) => { const a = document.createElement("a"); a.download = `${site?.name || "topology"}_구성도.png`; a.href = url; a.click(); })
      .catch(() => alert("이미지 생성에 실패했습니다."));
  }, [T.nodes, site]);

  if (!site) return <div style={{ color: C.faint, padding: 40, textAlign: "center" }}>사이트를 찾을 수 없습니다. <Link to="/sites" style={{ color: C.accent }}>목록으로</Link></div>;

  const devicesOnCanvas = new Set(T.nodes.map((n) => (n.data as { device_id?: string }).device_id).filter(Boolean));
  const availableDevices = siteDevices.filter((d) => !devicesOnCanvas.has(d.id));
  const info = infoNode?.data as { label?: string; ip?: string; sub?: string; detail?: { model?: string; serial?: string; os?: string; vendor?: string; netZone?: string; managed?: boolean } } | undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "8px 12px", marginBottom: 10, flexWrap: "wrap" }}>
        <Link to={`/sites/${siteId}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: C.faint, textDecoration: "none" }}>
          <ArrowLeft size={13} /> {site.name}
        </Link>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>네트워크 구성도</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: saved ? "#34d399" : C.soon }}>
          {saved ? <><Check size={12} /> 자동 저장됨</> : "저장 중…"}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={exportPng} style={topBtn}><Download size={13} /> PNG</button>
          <button onClick={() => setPanel(panel === "node" ? null : "node")} style={topBtn2(panel === "node")}><Plus size={13} /> 노드</button>
          <button onClick={() => setPanel(panel === "legend" ? null : "legend")} style={topBtn2(panel === "legend")}><Cable size={13} /> 선 색상</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.line}`, position: "relative", background: "#0a0e16" }}>
          <ReactFlow
            nodes={T.nodes} edges={styledEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
            onNodesChange={T.onNodesChange} onEdgesChange={T.onEdgesChange}
            onConnect={onConnect} onNodeDragStop={onNodeDragStop} onNodeClick={onNodeClick}
            onNodesDelete={onNodesDelete} onEdgesDelete={onEdgesDelete} onEdgeClick={onEdgeClick}
            deleteKeyCode={["Delete", "Backspace"]}
            snapToGrid snapGrid={[16, 16]}
            fitView proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Lines} gap={28} color="rgba(120,160,220,0.05)" />
            <Controls style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: "none" }} />
            <MiniMap pannable zoomable style={{ background: C.panel, border: `1px solid ${C.line}` }} maskColor="rgba(0,0,0,0.65)" nodeColor={() => C.accent} />
          </ReactFlow>

          {infoNode && info && (
            <div style={{ position: "absolute", right: 12, top: 12, width: 230, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, zIndex: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{info.label}</span>
                <button onClick={() => setInfoNode(null)} style={{ marginLeft: "auto", color: C.faint }}><X size={14} /></button>
              </div>
              <InfoRow k="IP" v={info.ip} mono />
              <InfoRow k="구분" v={info.sub} />
              <InfoRow k="망" v={info.detail?.netZone} />
              <InfoRow k="관리대상" v={info.detail?.managed === undefined ? undefined : info.detail.managed ? "O" : "X"} />
              <InfoRow k="모델" v={info.detail?.model} />
              <InfoRow k="시리얼" v={info.detail?.serial} mono />
              <InfoRow k="OS" v={info.detail?.os} />
              <InfoRow k="업체" v={info.detail?.vendor} />
              {!info.detail && <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>임의 노드 (장비 미연동)</div>}
            </div>
          )}
        </div>

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
                <select value={customKind} onChange={(e) => setCustomKind(e.target.value)} style={inp}>
                  {KIND_OPTIONS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
                </select>
                <input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="이름 (예: 외부 인터넷)" style={inp} />
                <button onClick={() => { if (!customLabel.trim()) return; T.addNode({ label: customLabel.trim(), kind: customKind }); setCustomLabel(""); flash(); }} style={{ ...primaryBtn, marginTop: 4 }}>추가</button>
                <div style={{ fontSize: 11, color: C.faint, marginTop: 16, lineHeight: 1.6 }}>
                  · 노드 옆 점 → 다른 노드로 드래그 → <b style={{ color: C.text }}>포트 입력창</b><br />
                  · 이중화는 연결창에서 <b style={{ color: C.text }}>이중화 체크</b><br />
                  · 노드 클릭 → 전체 정보<br />
                  · Delete 키로 삭제
                </div>
              </>
            )}
            {panel === "legend" && (
              <>
                <div style={sectTitle}><Cable size={13} /> 색상 범례 관리</div>
                <div style={{ fontSize: 11, color: C.faint, marginBottom: 8 }}>연결 시 빠르게 고를 색을 미리 등록</div>
                {T.legends.map((l) => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, background: l.color }} />
                    <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{l.name}</span>
                    <button onClick={() => T.deleteLegend(l.id)} style={{ color: C.faint, background: "none", border: "none", cursor: "pointer" }}>✕</button>
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

      {edgeModal && (
        <EdgeModal
          initial={edgeModal.draft} legends={T.legends}
          sourceName={nodeName(edgeModal.draft.source)} targetName={nodeName(edgeModal.draft.target)}
          onSave={saveEdge} onClose={() => setEdgeModal(null)}
          onDelete={edgeModal.editId ? () => { T.deleteEdge(edgeModal.editId!); setEdgeModal(null); flash(); } : undefined}
        />
      )}
    </div>
  );
};

const InfoRow: React.FC<{ k: string; v?: string; mono?: boolean }> = ({ k, v, mono }) =>
  v ? (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, padding: "3px 0", borderTop: `1px solid ${C.line2}` }}>
      <span style={{ color: C.faint }}>{k}</span>
      <span style={{ color: C.text, fontFamily: mono ? "monospace" : "inherit", textAlign: "right", maxWidth: 140, wordBreak: "break-all" }}>{v}</span>
    </div>
  ) : null;

const topBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "6px 11px", borderRadius: 8, border: `1px solid ${C.line}`, background: "transparent", color: C.text, cursor: "pointer" };
const topBtn2 = (on: boolean): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "6px 11px", borderRadius: 8, border: `1px solid ${on ? C.accent : C.line}`, background: on ? `${C.accent}14` : "transparent", color: on ? C.accent : C.sub, cursor: "pointer" });
const sectTitle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: C.text, marginBottom: 8 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: C.panel2, border: `1px solid ${C.line}`, color: C.text, borderRadius: 8, padding: "7px 9px", fontSize: 12.5, marginBottom: 8, outline: "none" };
const primaryBtn: React.CSSProperties = { width: "100%", background: C.accent, color: "#06241f", border: "none", borderRadius: 8, padding: "8px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const listItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left", background: C.panel2, border: `1px solid ${C.line}`, color: C.text, borderRadius: 8, padding: "7px 9px", fontSize: 12, marginBottom: 6, cursor: "pointer" };
