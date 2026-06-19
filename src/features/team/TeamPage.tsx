import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, Check, Pencil, UserPlus, Trash2, IdCard } from "lucide-react";
import { C, btnPrimary } from "../../lib/constants";
import { Panel, Select, Input } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import type { TeamRole } from "../../types/db";

const ROLE_LABEL: Record<TeamRole, string> = { lead: "Lead", engineer: "Engineer", viewer: "Viewer" };

export const TeamPage: React.FC = () => {
  const { me, members, engineers, isLead, updateMember, addEngineer, removeEngineer } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [eng, setEng] = useState({ name: "", rank: "", dept: "" });
  const [busy, setBusy] = useState(false);

  if (!isLead) return <Navigate to="/dashboard" replace />;

  const pending = members.filter((m) => !m.approved);
  const active = members.filter((m) => m.approved);
  const saveName = async (id: string) => { await updateMember(id, { name: nameDraft }); setEditing(null); };

  const submitEng = async () => {
    if (!eng.name.trim()) return;
    setBusy(true);
    const err = await addEngineer({ name: eng.name.trim(), rank: eng.rank.trim(), dept: eng.dept.trim() });
    setBusy(false);
    if (err) alert("등록 실패: " + err); else setEng({ name: "", rank: "", dept: "" });
  };

  const MemberRow = ({ m }: { m: typeof members[number] }) => {
    const isSelf = m.id === me?.id;   // 본인 계정이면 잠금
    return (
      <div className="flex items-center gap-3 px-5 py-3" style={{ borderTop: `1px solid ${C.line2}` }}>
        <div className="flex-1 min-w-0">
          {editing === m.id ? (
            <div className="flex items-center gap-2">
              <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoFocus
                className="rounded-md px-2 py-1 text-sm outline-none w-full" style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.text }} />
              <button onClick={() => saveName(m.id)} className="text-xs shrink-0" style={{ color: C.accent }}>저장</button>
              <button onClick={() => setEditing(null)} className="text-xs shrink-0" style={{ color: C.faint }}>취소</button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium truncate" style={{ color: C.text }}>{m.name || "(이름 없음)"}</span>
              {isSelf && <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${C.accent}1a`, color: C.accent }}>나</span>}
              <button onClick={() => { setEditing(m.id); setNameDraft(m.name || ""); }} className="shrink-0" style={{ color: C.faint }}><Pencil size={12} /></button>
            </div>
          )}
          <div className="font-mono text-xs truncate" style={{ color: C.faint }}>{m.email}</div>
        </div>

        {/* 역할 드롭다운 — 고정폭, 본인이면 비활성화 */}
        <div className="shrink-0" style={{ width: 116 }}>
          <Select value={m.role} disabled={isSelf}
            onChange={(e) => updateMember(m.id, { role: e.target.value as TeamRole })}
            style={isSelf ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
            {(["lead", "engineer", "viewer"] as TeamRole[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>
        </div>

        {/* 승인 버튼 — 본인이면 숨김(자기 잠금 방지) */}
        <div className="shrink-0" style={{ width: 72 }}>
          {isSelf ? (
            <span className="block text-center text-[11px]" style={{ color: C.faint }}>—</span>
          ) : m.approved ? (
            <button onClick={() => updateMember(m.id, { approved: false })} className="w-full rounded-lg px-2 py-1.5 text-xs font-medium" style={{ border: `1px solid ${C.line}`, color: C.sub }}>해제</button>
          ) : (
            <button onClick={() => updateMember(m.id, { approved: true })} className="w-full rounded-lg px-2 py-1.5 text-xs font-semibold flex items-center justify-center gap-1" style={{ background: `${C.ok}1a`, color: C.ok, border: `1px solid ${C.ok}40` }}>
              <Check size={12} /> 승인
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {/* 엔지니어 명부 */}
      <Panel>
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <IdCard size={15} style={{ color: C.accent }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>엔지니어 명부</span>
          <span className="text-xs" style={{ color: C.faint }}>사이트 정/부 담당 후보</span>
        </div>

        <div className="flex flex-wrap items-end gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <div style={{ flex: "2 1 140px" }}>
            <label className="text-xs" style={{ color: C.sub }}>이름</label>
            <Input value={eng.name} onChange={(e) => setEng({ ...eng, name: e.target.value })} placeholder="홍길동" />
          </div>
          <div style={{ flex: "1 1 100px" }}>
            <label className="text-xs" style={{ color: C.sub }}>직급</label>
            <Input value={eng.rank} onChange={(e) => setEng({ ...eng, rank: e.target.value })} placeholder="선임" />
          </div>
          <div style={{ flex: "1 1 100px" }}>
            <label className="text-xs" style={{ color: C.sub }}>부서</label>
            <Input value={eng.dept} onChange={(e) => setEng({ ...eng, dept: e.target.value })} placeholder="인프라팀" />
          </div>
          <button onClick={submitEng} disabled={busy} className="rounded-lg px-3 py-2.5 text-xs font-semibold flex items-center gap-1.5" style={btnPrimary}>
            <UserPlus size={13} /> 등록
          </button>
        </div>

        {engineers.length === 0 && <div className="text-center py-6 text-sm" style={{ color: C.faint }}>등록된 엔지니어가 없습니다.</div>}
        {engineers.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-5 py-3" style={{ borderTop: `1px solid ${C.line2}` }}>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium" style={{ color: C.text }}>{e.name}</span>
              {e.rank && <span className="ml-2 text-xs" style={{ color: C.sub }}>{e.rank}</span>}
            </div>
            <span className="text-xs" style={{ color: C.faint }}>{e.dept || "—"}</span>
            <button onClick={() => { if (confirm(`${e.name} 님을 명부에서 삭제할까요?`)) removeEngineer(e.id); }} style={{ color: C.faint }} title="삭제">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </Panel>

      {/* 로그인 계정: 승인 대기 */}
      {pending.length > 0 && (
        <Panel>
          <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
            <Users size={15} style={{ color: C.soon }} />
            <span className="text-sm font-semibold" style={{ color: C.text }}>로그인 계정 — 승인 대기</span>
            <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${C.soon}1a`, color: C.soon }}>{pending.length}</span>
          </div>
          {pending.map((m) => <MemberRow key={m.id} m={m} />)}
        </Panel>
      )}

      {/* 로그인 계정: 승인됨 */}
      <Panel>
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <Users size={15} style={{ color: C.accent }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>로그인 계정 ({active.length})</span>
        </div>
        {active.length === 0 && <div className="text-center py-8 text-sm" style={{ color: C.faint }}>승인된 계정이 없습니다.</div>}
        {active.map((m) => <MemberRow key={m.id} m={m} />)}
      </Panel>
    </div>
  );
};
