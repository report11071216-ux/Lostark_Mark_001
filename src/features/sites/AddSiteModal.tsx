import React, { useState } from "react";
import { C, CYCLE, btnPrimary } from "../../lib/constants";
import { iso } from "../../lib/date";
import { Field, Input, Modal, Select } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import type { CheckCycle } from "../../types/db";

export const AddSiteModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { engineers, addSite } = useApp();
  const [f, setF] = useState({
    name: "", url: "", cycle: "monthly" as CheckCycle, start_date: iso(new Date()),
    owner_primary_id: "", owner_secondary_id: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (!f.name) return;
    setBusy(true);
    const err = await addSite({
      name: f.name, url: f.url || null, cycle: f.cycle, start_date: f.start_date,
      owner_primary_id: f.owner_primary_id || null, owner_secondary_id: f.owner_secondary_id || null,
    });
    setBusy(false);
    if (err) alert("저장 실패: " + err); else onClose();
  };

  return (
    <Modal title="사이트 등록" onClose={onClose}>
      <Field label="사이트 이름"><Input value={f.name} onChange={set("name")} placeholder="메인 커머스" /></Field>
      <Field label="URL"><Input value={f.url} onChange={set("url")} placeholder="shop.corp.io" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="점검 주기">
          <Select value={f.cycle} onChange={set("cycle")}>
            {Object.entries(CYCLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <Field label="점검 기준일"><Input type="date" value={f.start_date} onChange={set("start_date")} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="정 담당">
          <Select value={f.owner_primary_id} onChange={set("owner_primary_id")}>
            <option value="">선택</option>{engineers.map((e) => <option key={e.id} value={e.id}>{e.name}{e.rank ? ` ${e.rank}` : ""}{e.dept ? ` · ${e.dept}` : ""}</option>)}
          </Select>
        </Field>
        <Field label="부 담당">
          <Select value={f.owner_secondary_id} onChange={set("owner_secondary_id")}>
            <option value="">선택</option>{engineers.map((e) => <option key={e.id} value={e.id}>{e.name}{e.rank ? ` ${e.rank}` : ""}{e.dept ? ` · ${e.dept}` : ""}</option>)}
          </Select>
        </Field>
      </div>
      <button onClick={save} disabled={busy} className="w-full rounded-lg py-2.5 text-sm font-semibold mt-1" style={btnPrimary}>
        {busy ? "저장 중…" : "등록"}
      </button>
    </Modal>
  );
};
