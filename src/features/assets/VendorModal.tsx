import React, { useState } from "react";
import { btnPrimary } from "../../lib/constants";
import { Field, Input, Modal } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import type { Vendor } from "../../types/db";

export const VendorModal: React.FC<{ siteId: string; existing?: Vendor; onClose: () => void }> = ({ siteId, existing, onClose }) => {
  const { addVendor, updateVendor } = useApp();
  const [f, setF] = useState({
    vendor_name: existing?.vendor_name || "",
    contact: existing?.contact || "",
    phone: existing?.phone || "",
    email: existing?.email || "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (!f.vendor_name) { alert("업체명은 필수입니다."); return; }
    setBusy(true);
    const payload = { site_id: siteId, vendor_name: f.vendor_name, contact: f.contact || null, phone: f.phone || null, email: f.email || null };
    const err = existing ? await updateVendor(existing.id, payload) : await addVendor(payload);
    setBusy(false);
    if (err) alert("저장 실패: " + err); else onClose();
  };

  return (
    <Modal title={existing ? "타사 제품 수정" : "타사 제품 등록"} onClose={onClose}>
      <Field label="업체명"><Input value={f.vendor_name} onChange={set("vendor_name")} placeholder="(주)클라우드넷" /></Field>
      <Field label="담당자"><Input value={f.contact} onChange={set("contact")} placeholder="김상우 과장" /></Field>
      <Field label="연락처"><Input value={f.phone} onChange={set("phone")} placeholder="010-1234-5678" /></Field>
      <Field label="이메일"><Input value={f.email} onChange={set("email")} type="email" placeholder="contact@vendor.kr" /></Field>
      <button onClick={save} disabled={busy} className="w-full rounded-lg py-2.5 text-sm font-semibold mt-1" style={btnPrimary}>
        {busy ? "저장 중…" : existing ? "저장" : "등록"}
      </button>
    </Modal>
  );
};
