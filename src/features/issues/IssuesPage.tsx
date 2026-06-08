import React, { useState } from "react";
import { AlertTriangle, Search, Server, CircleDot, Plus } from "lucide-react";
import { C, SEVERITY, ISSUE_STATE, btnPrimary } from "../../lib/constants";
import { Panel } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import { AddIssueModal } from "./AddIssueModal";
import type { Issue, IssueState } from "../../types/db";

const FILTERS: [IssueState | "all", string][] = [
  ["all", "전체"], ["open", "미해결"], ["in_progress", "진행중"], ["resolved", "해결"],
];

export const IssuesPage: React.FC = () => {
  const { issues, sites, nameOf, advanceIssue } = useApp();
  const [filter, setFilter] = useState<IssueState | "all">("all");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);

  const siteName = (id: string | null) => sites.find((s) => s.id === id)?.name || "사이트 미지정";
  const filtered = issues.filter(
    (i) => (filter === "all" || i.state === filter) && (!q || (i.title + siteName(i.site_id)).toLowerCase().includes(q.toLowerCase()))
  );
  const groups: Record<string, Issue[]> = {};
  filtered.forEach((i) => { const n = siteName(i.site_id); (groups[n] = groups[n] || []).push(i); });

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-3 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
        <div className="flex items-center gap-2 mr-auto">
          <AlertTriangle size={15} style={{ color: C.late }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>이슈 / 장애 로그</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: C.panel2, border: `1px solid ${C.line}` }}>
          <Search size={13} style={{ color: C.faint }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색" className="bg-transparent outline-none text-xs w-24" style={{ color: C.text }} />
        </div>
        <div className="flex gap-1">
          {FILTERS.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium"
              style={{ background: filter === k ? `${C.accent}1a` : "transparent", color: filter === k ? C.accent : C.sub, border: `1px solid ${filter === k ? C.accent + "40" : C.line}` }}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={btnPrimary}>
          <Plus size={13} /> 이슈 등록
        </button>
      </div>

      <div>
        {Object.keys(groups).length === 0 && <div className="text-center py-12 text-sm" style={{ color: C.faint }}>조건에 맞는 이슈가 없습니다.</div>}
        {Object.entries(groups).map(([name, list]) => {
          const openCnt = list.filter((x) => x.state !== "resolved").length;
          return (
            <div key={name}>
              <div className="flex items-center gap-2 px-5 py-2.5" style={{ background: C.panel2, borderTop: `1px solid ${C.line2}` }}>
                <Server size={13} style={{ color: C.accent }} />
                <span className="text-xs font-semibold" style={{ color: C.text }}>{name}</span>
                <span className="font-mono text-xs" style={{ color: C.faint }}>{list.length}건</span>
                {openCnt > 0 && <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${C.late}1a`, color: C.late }}>미해결 {openCnt}</span>}
              </div>
              {list.map((i) => {
                const sev = SEVERITY[i.severity]; const st = ISSUE_STATE[i.state];
                return (
                  <div key={i.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]" style={{ borderTop: `1px solid ${C.line2}` }}>
                    <CircleDot size={14} style={{ color: sev.color }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: C.text }}>{i.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: C.faint }}>{nameOf(i.owner_id)} · <span className="font-mono">{(i.created_at || "").slice(0, 10)}</span></div>
                    </div>
                    <span className="text-xs font-semibold shrink-0" style={{ color: sev.color }}>{sev.label}</span>
                    <button onClick={() => advanceIssue(i)} className="rounded-full px-2.5 py-1 text-xs font-semibold shrink-0"
                      style={{ background: `${st.color}1a`, color: st.color, border: `1px solid ${st.color}33` }} title="클릭하여 상태 변경">
                      {st.label}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {modal && <AddIssueModal onClose={() => setModal(false)} />}
    </Panel>
  );
};
