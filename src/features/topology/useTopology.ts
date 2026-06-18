import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNodesState, useEdgesState, type Node, type Edge } from "@xyflow/react";
import { supabase } from "../../lib/supabase";
import { DEVICE_CATEGORY } from "../../lib/constants";
import type { Device, TopoEdge, TopoLegend, TopoNode } from "../../types/db";
import { iconForCategory } from "./TopoCardNode";

const toEdge = (e: TopoEdge): Edge => ({
  id: e.id, source: e.source_id, target: e.target_id,
  label: e.label || undefined,
  style: { stroke: e.color, strokeWidth: 2.5, strokeDasharray: e.dashed ? "6 8" : undefined },
  animated: e.dashed,
  labelStyle: { fill: "#e2e8f0", fontSize: 11 }, labelBgStyle: { fill: "#161b24" },
});

export function useTopology(siteId: string, devices: Device[]) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [legends, setLegends] = useState<TopoLegend[]>([]);
  const [loading, setLoading] = useState(true);

  // devices를 ref에 담아 toNode가 항상 최신을 보되 재생성되지 않게 함
  const devMapRef = useRef<Record<string, Device>>({});
  devMapRef.current = useMemo(() => Object.fromEntries(devices.map((d) => [d.id, d])), [devices]);

  const toNode = useCallback((n: TopoNode): Node => {
    const dev = n.device_id ? devMapRef.current[n.device_id] : null;
    const data = dev
      ? { device_id: n.device_id, label: n.label, icon: iconForCategory(dev.category), ip: dev.ip || undefined, sub: DEVICE_CATEGORY[dev.category]?.label, status: dev.managed ? "ok" : undefined }
      : { device_id: null, label: n.label, icon: n.kind, status: n.kind === "internet" || n.kind === "cloud" ? "ext" : undefined };
    return { id: n.id, type: "card", position: { x: n.x, y: n.y }, data };
  }, []);

  // 최초 1회만 로드 (siteId 바뀔 때만)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [n, e, l] = await Promise.all([
        supabase.from("topo_nodes").select("*").eq("site_id", siteId),
        supabase.from("topo_edges").select("*").eq("site_id", siteId),
        supabase.from("topo_legends").select("*").eq("site_id", siteId).order("sort_order"),
      ]);
      if (!alive) return;
      setNodes(((n.data as TopoNode[]) || []).map(toNode));
      setEdges(((e.data as TopoEdge[]) || []).map(toEdge));
      setLegends((l.data as TopoLegend[]) || []);
      setLoading(false);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const addNode = useCallback(async (p: { label: string; kind: string; device_id?: string | null }) => {
    const { data, error } = await supabase.from("topo_nodes")
      .insert({ site_id: siteId, label: p.label, kind: p.kind, device_id: p.device_id ?? null, x: 100 + Math.random() * 260, y: 80 + Math.random() * 180 })
      .select().single();
    if (error) { alert("노드 추가 실패: " + error.message); return; }
    setNodes((nds) => [...nds, toNode(data as TopoNode)]);
  }, [siteId, toNode, setNodes]);

  const saveNodePos = useCallback(async (id: string, x: number, y: number) => {
    await supabase.from("topo_nodes").update({ x, y }).eq("id", id);
  }, []);

  const deleteNode = useCallback(async (id: string) => {
    await supabase.from("topo_nodes").delete().eq("id", id);
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  const addEdge = useCallback(async (source: string, target: string, color: string, label: string, dashed: boolean) => {
    const { data, error } = await supabase.from("topo_edges")
      .insert({ site_id: siteId, source_id: source, target_id: target, color, label: label || null, dashed })
      .select().single();
    if (error) { alert("연결 실패: " + error.message); return; }
    setEdges((eds) => [...eds, toEdge(data as TopoEdge)]);
  }, [siteId, setEdges]);

  const updateEdge = useCallback(async (id: string, patch: { label?: string; color?: string; dashed?: boolean }) => {
    const { data } = await supabase.from("topo_edges").update(patch).eq("id", id).select().single();
    if (data) setEdges((eds) => eds.map((e) => (e.id === id ? toEdge(data as TopoEdge) : e)));
  }, [setEdges]);

  const deleteEdge = useCallback(async (id: string) => {
    await supabase.from("topo_edges").delete().eq("id", id);
    setEdges((eds) => eds.filter((e) => e.id !== id));
  }, [setEdges]);

  const addLegend = useCallback(async (name: string, color: string) => {
    const { data } = await supabase.from("topo_legends").insert({ site_id: siteId, name, color, sort_order: legends.length }).select().single();
    if (data) setLegends((ls) => [...ls, data as TopoLegend]);
  }, [siteId, legends.length]);

  const deleteLegend = useCallback(async (id: string) => {
    await supabase.from("topo_legends").delete().eq("id", id);
    setLegends((ls) => ls.filter((l) => l.id !== id));
  }, []);

  return {
    nodes, edges, legends, loading,
    onNodesChange, onEdgesChange,
    addNode, saveNodePos, deleteNode,
    addEdge, updateEdge, deleteEdge,
    addLegend, deleteLegend,
  };
}
