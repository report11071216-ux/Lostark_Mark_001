import React from "react";
import { Link } from "react-router-dom";
import { Server, ChevronRight } from "lucide-react";
import { C } from "../../lib/constants";
import { Panel } from "../../components/ui";
import { useApp } from "../../data/AppProvider";

export const SitesPage: React.FC = () => {
  const { sites, devices, vendors } = useApp();
  return (
    <Panel>
      <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
        <Server size={15} style={{ color: C.accent }} />
        <span className="text-sm font-semibold" style={{ color: C.text }}>사이트</span>
        <span className="text-xs" style={{ color: C.faint }}>사이트를 선택해 장비·타사 제품을 관리하세요</span>
      </div>
      {sites.length === 0 && <div className="text-center py-10 text-sm" style={{ color: C.faint }}>등록된 사이트가 없습니다. 대시보드에서 먼저 사이트를 등록하세요.</div>}
      {sites.map((s) => {
        const dCnt = devices.filter((d) => d.site_id === s.id).length;
        const vCnt = vendors.filter((v) => v.site_id === s.id).length;
        return (
          <Link key={s.id} to={`/sites/${s.id}`}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
            style={{ borderTop: `1px solid ${C.line2}`, textDecoration: "none" }}>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${C.accent}1a` }}>
              <Server size={15} style={{ color: C.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: C.text }}>{s.name}</div>
              <div className="font-mono text-xs" style={{ color: C.faint }}>{s.url || "—"}</div>
            </div>
            <span className="text-xs" style={{ color: C.sub }}>장비 {dCnt} · 타사 {vCnt}</span>
            <ChevronRight size={16} style={{ color: C.faint }} />
          </Link>
        );
      })}
    </Panel>
  );
};
