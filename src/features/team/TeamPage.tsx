import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, Check, Pencil } from "lucide-react";
import { C } from "../../lib/constants";
import { Panel, Select } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import type { TeamRole } from "../../types/db";

const ROLE_LABEL: Record<TeamRole, string> = { lead: "Lead", engineer: "Engineer", viewer: "Viewer" };

export const TeamPage: React.FC = () => {
  const { members, isLead, updateMember } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  if (!isLead) return <Navigate to="/dashboard" replace />;

  const pending = members.filter((m) => !m.approved);
  const active = members.filter((m) => m.approved);

  const saveName = async (id: string) => { await updateMember(id, { name: nameDraft }); setEditing(null); };

  const Row = ({ m }: { m: typeof members[number] }) => (
    <div className="flex items-center gap-3 px-5 py-3" style={{ borderTop: `1px solid ${C.line2}` }}>
      <div className="flex-1 min-w-0">
        {editing === m.id ? (
          <div className="flex items-center gap-2">
            <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus
              className="rounded-md px-2 py-1 text-sm outline-none" style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.text }} />
            <button onClick={() => saveName(m.id)} className="text-xs" style={{ color: C.accent }}>저장</button>
            <button onClick={() => setEditing(null)} className="text-xs" style={{ color: C.faint }}>취소</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium" style={{ color: C.text }}>{m.name || "(이름 없음)"}</span>
            <button onClick={() => { setEditing(m.id); setNameDraft(m.name || ""); }} style={{ color: C.faint }}><Pencil size={12} /></button>
          </div>
        )}
        <div className="font-mono text-xs" style={{ color: C.faint }}>{m.email}</div>
      </div>
      <Select value={m.role} onChange={(e) => updateMember(m.id, { role: e.target.value as TeamRole })}
        style={{ width: 120 }}>
        {(["lead", "engineer", "viewer"] as TeamRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </Select>
      {m.approved ? (
        <button onClick={() => updateMember(m.id, { approved: false })} className="rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ border: `1px solid ${C.line}`, color: C.sub }}>승인 취소</button>
      ) : (
        <button onClick={() => updateMember(m.id, { approved: true })} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1" style={{ background: `${C.ok}1a`, color: C.ok, border: `1px solid ${C.ok}40` }}>
          <Check size={12} /> 승인
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      {pending.length > 0 && (
        <Panel>
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
            <Users size={15} style={{ color: C.soon }} />
            <span className="text-sm font-semibold" style={{ color: C.text }}>승인 대기</span>
            <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${C.soon}1a`, color: C.soon }}>{pending.length}</span>
          </div>
          {pending.map((m) => <Row key={m.id} m={m} />)}
        </Panel>
      )}
      <Panel>
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <Users size={15} style={{ color: C.accent }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>팀원 ({active.length})</span>
        </div>
        {active.length === 0 && <div className="text-center py-8 text-sm" style={{ color: C.faint }}>승인된 팀원이 없습니다.</div>}
        {active.map((m) => <Row key={m.id} m={m} />)}
      </Panel>
    </div>
  );
};
