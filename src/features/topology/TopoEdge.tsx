import React from "react";
import {
  BaseEdge, EdgeLabelRenderer, getBezierPath, getSmoothStepPath, getStraightPath,
  type EdgeProps,
} from "@xyflow/react";

function lerp(ax: number, ay: number, bx: number, by: number, t: number) {
  return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t };
}

export const TopoEdge: React.FC<EdgeProps> = (props) => {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, data, type } = props;
  const d = (data || {}) as { src_port?: string; dst_port?: string; label?: string; parallel?: number };
  const par = d.parallel || 0;

  // 선 방향에 수직인 단위벡터로 평행 이동 (이중화 두 줄 벌리기)
  const dx = targetX - sourceX, dy = targetY - sourceY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;  // 수직 단위벡터
  const ox = nx * par, oy = ny * par;

  const sX = sourceX + ox, sY = sourceY + oy;
  const tX = targetX + ox, tY = targetY + oy;

  const params = { sourceX: sX, sourceY: sY, targetX: tX, targetY: tY, sourcePosition, targetPosition };
  let edgePath: string, labelX: number, labelY: number;
  if (type === "straight") {
    [edgePath, labelX, labelY] = getStraightPath(params);
  } else if (type === "smoothstep") {
    [edgePath, labelX, labelY] = getSmoothStepPath(params);
  } else {
    [edgePath, labelX, labelY] = getBezierPath(params);
  }

  const srcPos = lerp(sX, sY, tX, tY, 0.16);
  const dstPos = lerp(sX, sY, tX, tY, 0.84);

  const chip: React.CSSProperties = {
    position: "absolute", transform: "translate(-50%, -50%)",
    background: "#0d1117", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 5,
    padding: "1px 6px", fontSize: 10, color: "#cbd5e1", fontFamily: "monospace",
    pointerEvents: "all", whiteSpace: "nowrap",
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {d.src_port && (
          <div style={{ ...chip, left: srcPos.x, top: srcPos.y }} className="nodrag nopan">{d.src_port}</div>
        )}
        {d.label && (
          <div style={{ ...chip, left: labelX, top: labelY, background: "#161b24", color: "#e2e8f0", fontFamily: "inherit" }} className="nodrag nopan">{d.label}</div>
        )}
        {d.dst_port && (
          <div style={{ ...chip, left: dstPos.x, top: dstPos.y }} className="nodrag nopan">{d.dst_port}</div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};
