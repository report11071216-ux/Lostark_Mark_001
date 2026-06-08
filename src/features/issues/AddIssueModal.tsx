import React, { useState } from "react";
import { SEVERITY, btnPrimary } from "../../lib/constants";
import { Field, Input, Modal, Select } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import type { IssueSeverity } from "../../types/db";

export const AddIssueModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { sites, members, addIssue } = useApp();
  const [f, setF] = useState({ site_id: sites[0]?.id || "", title: "", severity: "minor" as IssueSeverity, owner_id: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (!f.title) return;
    setBusy(true);
    const err = await addIssue({ site_id: f.site_id || null, title: f.title, severity: f.severity, owner_id: f.owner_id || null });
    setBusy(false);
    if (err) alert("저장 실패: " + err); else onClose();
  };

  return (
    <Modal title="이슈 / 장애 등록" onClose={onClose}>
      <Field label="대상 사이트">
        <Select value={f.site_id} onChange={set("site_id")}>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      <Field label="제목"><Input value={f.title} onChange={set("title")} placeholder="SSL 인증서 만료 임박" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="심각도">
          <Select value={f.severity} onChange={set("severity")}>
            {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <Field label="담당">
          <Select value={f.owner_id} onChange={set("owner_id")}>
            <option value="">선택</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </Field>
      </div>
      <button onClick={save} disabled={busy} className="w-full rounded-lg py-2.5 text-sm font-semibold mt-1" style={btnPrimary}>
        {busy ? "저장 중…" : "등록"}
      </button>
    </Modal>
  );
};
