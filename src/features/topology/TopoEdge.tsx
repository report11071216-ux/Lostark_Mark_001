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

  const params = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition };
  let edgePath: string, labelX: number, labelY: number;
  if (type === "straight") {
    [edgePath, labelX, labelY] = getStraightPath(params);
  } else if (type === "smoothstep") {
    [edgePath, labelX, labelY] = getSmoothStepPath(params);
  } else {
    [edgePath, labelX, labelY] = getBezierPath(params);
  }

  const d = (data || {}) as { src_port?: string; dst_port?: string; label?: string };
  const srcPos = lerp(sourceX, sourceY, targetX, targetY, 0.16);
  const dstPos = lerp(sourceX, sourceY, targetX, targetY, 0.84);

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
