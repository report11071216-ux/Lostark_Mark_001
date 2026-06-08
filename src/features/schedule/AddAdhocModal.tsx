import React, { useState } from "react";
import { C } from "../../lib/constants";
import { iso } from "../../lib/date";
import { Field, Input, Modal, Select } from "../../components/ui";
import { useApp } from "../../data/AppProvider";

export const AddAdhocModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { sites, addAdhoc } = useApp();
  const [f, setF] = useState({ site_id: sites[0]?.id || "", scheduled_for: iso(new Date()), notes: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (!f.site_id) return;
    setBusy(true);
    const err = await addAdhoc({ site_id: f.site_id, scheduled_for: f.scheduled_for, notes: f.notes || null });
    setBusy(false);
    if (err) alert("저장 실패: " + err); else onClose();
  };

  return (
    <Modal title="임시 점검 추가 (갑자기 잡힌 일정)" onClose={onClose}>
      <Field label="대상 사이트">
        <Select value={f.site_id} onChange={set("site_id")}>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      <Field label="점검일"><Input type="date" value={f.scheduled_for} onChange={set("scheduled_for")} /></Field>
      <Field label="메모"><Input value={f.notes} onChange={set("notes")} placeholder="긴급 배포 후 확인 등" /></Field>
      <button onClick={save} disabled={busy} className="w-full rounded-lg py-2.5 text-sm font-semibold mt-1" style={{ background: C.adhoc, color: "#2a1505" }}>
        {busy ? "저장 중…" : "추가"}
      </button>
    </Modal>
  );
};
