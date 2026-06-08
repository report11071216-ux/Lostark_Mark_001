import React, { useState } from "react";
import { Server, AlertTriangle, Clock, Bell, Activity, Plus, Pencil, Trash2 } from "lucide-react";
import { C, CYCLE, btnPrimary } from "../../lib/constants";
import { iso } from "../../lib/date";
import { Panel, StatusPill } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import { AddSiteModal } from "./AddSiteModal";
import { EditSiteModal } from "./EditSiteModal";
import { ChecklistModal } from "./ChecklistModal";
import type { Site } from "../../types/db";

export const DashboardPage: React.FC = () => {
  const { enriched, issues, engineerName, removeSite } = useApp();
  const [modal, setModal] = useState(false);
  const [checkSite, setCheckSite] = useState<Site | null>(null);
  const [editSite, setEditSite] = useState<Site | null>(null);

  const late = enriched.filter((s) => s.status === "late").length;
  const soon = enriched.filter((s) => s.status === "soon").length;
  const openIssues = issues.filter((i) => i.state !== "resolved").length;
  const stats = [
    { label: "관리 사이트", value: enriched.length, color: C.accent, icon: Server },
    { label: "점검 지연", value: late, color: C.late, icon: AlertTriangle },
    { label: "점검 임박", value: soon, color: C.soon, icon: Clock },
    { label: "미해결 이슈", value: openIssues, color: C.running, icon: Bell },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Panel key={s.label} className="p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-medium" style={{ color: C.sub }}>{s.label}</span>
                <Icon size={15} style={{ color: s.color }} />
              </div>
              <div className="font-mono text-3xl font-bold" style={{ color: s.value > 0 || s.label === "관리 사이트" ? s.color : C.faint }}>
                {String(s.value).padStart(2, "0")}
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel>
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <Activity size={15} style={{ color: C.accent }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>사이트 점검 현황</span>
          <button onClick={() => setModal(true)} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={btnPrimary}>
            <Plus size={13} /> 사이트 등록
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: C.text }}>
            <thead>
              <tr style={{ color: C.faint }} className="text-xs">
                {["사이트", "주기", "담당(정/부)", "다음 점검", "상태", ""].map((h) => (
                  <th key={h} className="text-left font-medium px-5 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enriched.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10" style={{ color: C.faint }}>등록된 사이트가 없습니다. "사이트 등록"으로 추가하세요.</td></tr>
              )}
              {enriched.map((s) => (
                <tr key={s.id} style={{ borderTop: `1px solid ${C.line2}` }} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div className="font-medium">{s.name}</div>
                    <div className="font-mono text-xs" style={{ color: C.faint }}>{s.url || "—"}</div>
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: C.sub }}>{CYCLE[s.cycle]?.label}</td>
                  <td className="px-5 py-3.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${C.accent}1a`, color: C.accent }}>정</span>
                      <span style={{ color: C.text }}>{engineerName(s.owner_primary_id)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: C.panel2, color: C.faint, border: `1px solid ${C.line}` }}>부</span>
                      <span style={{ color: C.sub }}>{engineerName(s.owner_secondary_id)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs">
                    <span style={{ color: s.status === "late" ? C.late : s.status === "soon" ? C.soon : C.sub }}>{iso(s.next)}</span>
                    <span className="ml-1.5" style={{ color: C.faint }}>{s.gap < 0 ? `(${-s.gap}일 지연)` : s.gap === 0 ? "(오늘)" : `(D-${s.gap})`}</span>
                  </td>
                  <td className="px-5 py-3.5"><StatusPill status={s.status} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setCheckSite(s)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ border: `1px solid ${C.line}`, color: C.ok }}>✓ 점검 완료</button>
                      <button onClick={() => setEditSite(s)} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, color: C.sub }} title="수정"><Pencil size={13} /></button>
                      <button onClick={() => { if (confirm(`${s.name} 사이트를 목록에서 삭제할까요? (점검 이력은 보존됩니다)`)) removeSite(s.id); }} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${C.line}`, color: C.faint }} title="삭제"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {modal && <AddSiteModal onClose={() => setModal(false)} />}
      {editSite && <EditSiteModal site={editSite} onClose={() => setEditSite(null)} />}
      {checkSite && <ChecklistModal site={checkSite} onClose={() => setCheckSite(null)} />}
    </div>
  );
};
