import React, { useState } from "react";
import { C, btnPrimary } from "../../lib/constants";
import { Modal } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import type { CheckResult, ChecklistEntry, Site } from "../../types/db";

const RESULTS: { key: CheckResult; label: string; color: string }[] = [
  { key: "pass", label: "PASS", color: C.ok },
  { key: "warn", label: "WARN", color: C.soon },
  { key: "fail", label: "FAIL", color: C.late },
];

export const ChecklistModal: React.FC<{ site: Site; onClose: () => void }> = ({ site, onClose }) => {
  const { templates, markDone } = useApp();
  const [rows, setRows] = useState<Record<string, { result: CheckResult; note: string }>>(
    () => Object.fromEntries(templates.map((t) => [t.id, { result: "pass" as CheckResult, note: "" }]))
  );
  const [busy, setBusy] = useState(false);

  const setResult = (id: string, result: CheckResult) => setRows((r) => ({ ...r, [id]: { ...r[id], result } }));
  const setNote = (id: string, note: string) => setRows((r) => ({ ...r, [id]: { ...r[id], note } }));

  const submit = async () => {
    setBusy(true);
    const checklist: ChecklistEntry[] = templates.map((t) => ({
      item: t.label, result: rows[t.id]?.result ?? "pass", note: rows[t.id]?.note || undefined,
    }));
    const err = await markDone(site, checklist);
    setBusy(false);
    if (err) alert("기록 실패: " + err); else onClose();
  };

  return (
    <Modal title={`${site.name} — 점검 체크리스트`} onClose={onClose}>
      {templates.length === 0 && (
        <div className="text-xs" style={{ color: C.faint }}>등록된 체크리스트 항목이 없습니다. 항목 없이 완료 처리됩니다.</div>
      )}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {templates.map((t) => {
          const cur = rows[t.id]?.result ?? "pass";
          return (
            <div key={t.id} className="rounded-lg p-2.5" style={{ background: C.panel2, border: `1px solid ${C.line2}` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm flex-1" style={{ color: C.text }}>{t.label}</span>
                <div className="flex gap-1">
                  {RESULTS.map((r) => (
                    <button key={r.key} onClick={() => setResult(t.id, r.key)}
                      className="rounded-md px-2 py-1 text-[11px] font-bold"
                      style={cur === r.key
                        ? { background: `${r.color}26`, color: r.color, border: `1px solid ${r.color}66` }
                        : { background: "transparent", color: C.faint, border: `1px solid ${C.line}` }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              {cur !== "pass" && (
                <input value={rows[t.id]?.note || ""} onChange={(e) => setNote(t.id, e.target.value)} placeholder="발견사항 메모"
                  className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none" style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.text }} />
              )}
            </div>
          );
        })}
      </div>
      <button onClick={submit} disabled={busy} className="w-full rounded-lg py-2.5 text-sm font-semibold mt-1" style={btnPrimary}>
        {busy ? "기록 중…" : "점검 완료 기록"}
      </button>
    </Modal>
  );
};
