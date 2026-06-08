import React, { useState } from "react";
import { C, DEVICE_CATEGORY, NET_ZONE, btnPrimary } from "../../lib/constants";
import { Field, Input, Modal, Select } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import type { Device, DeviceCategory, NetZone } from "../../types/db";

export const DeviceModal: React.FC<{ siteId: string; existing?: Device; onClose: () => void }> = ({ siteId, existing, onClose }) => {
  const { addDevice, updateDevice } = useApp();
  const [f, setF] = useState({
    category: (existing?.category || "server") as DeviceCategory,
    net_zone: (existing?.net_zone || "work") as NetZone,
    managed: existing ? existing.managed : true,
    system_name: existing?.system_name || "",
    model: existing?.model || "",
    serial: existing?.serial || "",
    os: existing?.os || "",
    introduced_on: existing?.introduced_on || "",
    ip: existing?.ip || "",
    vendor_name: existing?.vendor_name || "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (!f.system_name) { alert("시스템명은 필수입니다."); return; }
    setBusy(true);
    const payload = {
      site_id: siteId, category: f.category, net_zone: f.net_zone, managed: f.managed,
      system_name: f.system_name, model: f.model || null, serial: f.serial || null,
      os: f.os || null, introduced_on: f.introduced_on || null, ip: f.ip || null, vendor_name: f.vendor_name || null,
    };
    const err = existing ? await updateDevice(existing.id, payload) : await addDevice(payload);
    setBusy(false);
    if (err) alert("저장 실패: " + err); else onClose();
  };

  return (
    <Modal title={existing ? "장비 수정" : "장비 등록"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="구분">
          <Select value={f.category} onChange={set("category")}>
            {Object.entries(DEVICE_CATEGORY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <Field label="망 구분">
          <Select value={f.net_zone} onChange={set("net_zone")}>
            {Object.entries(NET_ZONE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="관리대상">
        <div className="flex gap-1.5">
          {[["true", "O (관리)"], ["false", "X (비관리)"]].map(([v, l]) => (
            <button key={v} onClick={() => setF({ ...f, managed: v === "true" })}
              className="rounded-md px-3 py-1.5 text-xs font-medium"
              style={f.managed === (v === "true") ? { background: `${C.accent}26`, color: C.accent, border: `1px solid ${C.accent}66` } : { background: "transparent", color: C.faint, border: `1px solid ${C.line}` }}>
              {l}
            </button>
          ))}
        </div>
      </Field>
      <Field label="시스템명"><Input value={f.system_name} onChange={set("system_name")} placeholder="메인 방화벽" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="장비 모델명"><Input value={f.model} onChange={set("model")} placeholder="PA-3220" /></Field>
        <Field label="시리얼 넘버"><Input value={f.serial} onChange={set("serial")} placeholder="PA32-0091" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="운영체제"><Input value={f.os} onChange={set("os")} placeholder="PAN-OS 11" /></Field>
        <Field label="도입년월"><Input type="month" value={f.introduced_on} onChange={set("introduced_on")} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="장비 IP"><Input value={f.ip} onChange={set("ip")} placeholder="10.0.0.1" /></Field>
        <Field label="업체명"><Input value={f.vendor_name} onChange={set("vendor_name")} placeholder="팔로알토" /></Field>
      </div>
      <button onClick={save} disabled={busy} className="w-full rounded-lg py-2.5 text-sm font-semibold mt-1" style={btnPrimary}>
        {busy ? "저장 중…" : existing ? "저장" : "등록"}
      </button>
    </Modal>
  );
};
