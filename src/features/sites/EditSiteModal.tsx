import React, { useState } from "react";
import { C, CYCLE, btnPrimary } from "../../lib/constants";
import { Field, Input, Modal, Select } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import type { CheckCycle, Site } from "../../types/db";

export const EditSiteModal: React.FC<{ site: Site; onClose: () => void }> = ({ site, onClose }) => {
  const { engineers, updateSite } = useApp();
  const [f, setF] = useState({
    name: site.name, url: site.url || "", cycle: site.cycle as CheckCycle, start_date: site.start_date,
    owner_primary_id: site.owner_primary_id || "", owner_secondary_id: site.owner_secondary_id || "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (!f.name) return;
    setBusy(true);
    const err = await updateSite(site.id, {
      name: f.name, url: f.url || null, cycle: f.cycle, start_date: f.start_date,
      owner_primary_id: f.owner_primary_id || null, owner_secondary_id: f.owner_secondary_id || null,
    });
    setBusy(false);
    if (err) alert("수정 실패: " + err); else onClose();
  };

  return (
    <Modal title="사이트 수정" onClose={onClose}>
      <Field label="사이트 이름"><Input value={f.name} onChange={set("name")} /></Field>
      <Field label="URL"><Input value={f.url} onChange={set("url")} placeholder="shop.corp.io" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="점검 주기">
          <Select value={f.cycle} onChange={set("cycle")}>
            {Object.entries(CYCLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <Field label="점검 기준일 (= 다음 점검일)"><Input type="date" value={f.start_date} onChange={set("start_date")} /></Field>
      </div>
      <div className="text-[11px]" style={{ color: C.faint }}>
        다음 점검일은 기준일 + 주기로 계산됩니다. 다음 점검을 특정 날짜로 맞추려면 기준일을 그 날짜로 설정하세요.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="정 담당">
          <Select value={f.owner_primary_id} onChange={set("owner_primary_id")}>
            <option value="">선택</option>{engineers.map((e) => <option key={e.id} value={e.id}>{e.name}{e.rank ? ` ${e.rank}` : ""}</option>)}
          </Select>
        </Field>
        <Field label="부 담당">
          <Select value={f.owner_secondary_id} onChange={set("owner_secondary_id")}>
            <option value="">선택</option>{engineers.map((e) => <option key={e.id} value={e.id}>{e.name}{e.rank ? ` ${e.rank}` : ""}</option>)}
          </Select>
        </Field>
      </div>
      <button onClick={save} disabled={busy} className="w-full rounded-lg py-2.5 text-sm font-semibold mt-1" style={btnPrimary}>
        {busy ? "저장 중…" : "저장"}
      </button>
    </Modal>
  );
};
