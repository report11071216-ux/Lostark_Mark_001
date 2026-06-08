import React, { useState } from "react";
import { C, WORK_TYPE, WORK_STATUS, btnPrimary } from "../../lib/constants";
import { Field, Input, Modal, Select } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import type { WorkOrder, WorkStatus, WorkType } from "../../types/db";

const pad = (n: number) => String(n).padStart(2, "0");
const toDate = (isoTs: string) => { const d = new Date(isoTs); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const toTime = (isoTs: string) => { const d = new Date(isoTs); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

export const WorkOrderModal: React.FC<{
  defaultDate?: string;      // YYYY-MM-DD (생성 시 클릭한 날짜)
  existing?: WorkOrder;      // 수정 시
  onClose: () => void;
}> = ({ defaultDate, existing, onClose }) => {
  const { sites, engineers, addWorkOrder, updateWorkOrder, removeWorkOrder } = useApp();
  const [f, setF] = useState({
    title: existing?.title || "",
    type: (existing?.type || "policy") as WorkType,
    status: (existing?.status || "planned") as WorkStatus,
    site_id: existing?.site_id || "",
    assignee_id: existing?.assignee_id || "",
    date: existing ? toDate(existing.scheduled_at) : (defaultDate || ""),
    time: existing ? toTime(existing.scheduled_at) : "09:00",
    detail: existing?.detail || "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (!f.title || !f.date) { alert("제목과 날짜는 필수입니다."); return; }
    setBusy(true);
    const scheduled_at = new Date(`${f.date}T${f.time || "00:00"}`).toISOString();
    const payload = {
      title: f.title, type: f.type, status: f.status,
      site_id: f.site_id || null, assignee_id: f.assignee_id || null,
      scheduled_at, detail: f.detail || null,
    };
    const err = existing ? await updateWorkOrder(existing.id, payload) : await addWorkOrder(payload);
    setBusy(false);
    if (err) alert("저장 실패: " + err); else onClose();
  };

  const del = async () => {
    if (!existing) return;
    if (!confirm("이 작업을 삭제할까요?")) return;
    const err = await removeWorkOrder(existing.id);
    if (err) alert("삭제 실패: " + err); else onClose();
  };

  return (
    <Modal title={existing ? "작업 / 일정 수정" : "작업 / 일정 등록"} onClose={onClose}>
      <Field label="작업 유형">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(WORK_TYPE).map(([k, v]) => {
            const on = f.type === k;
            return (
              <button key={k} onClick={() => setF({ ...f, type: k as WorkType })}
                className="rounded-md px-2.5 py-1 text-xs font-medium"
                style={on ? { background: `${v.color}26`, color: v.color, border: `1px solid ${v.color}66` } : { background: "transparent", color: C.faint, border: `1px solid ${C.line}` }}>
                {v.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="제목"><Input value={f.title} onChange={set("title")} placeholder="본사 방화벽 정책 추가 (8443 허용)" /></Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="대상 자산 (선택)">
          <Select value={f.site_id} onChange={set("site_id")}>
            <option value="">없음</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="담당">
          <Select value={f.assignee_id} onChange={set("assignee_id")}>
            <option value="">선택</option>{engineers.map((e) => <option key={e.id} value={e.id}>{e.name}{e.rank ? ` ${e.rank}` : ""}</option>)}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="날짜"><Input type="date" value={f.date} onChange={set("date")} /></Field>
        <Field label="시간"><Input type="time" value={f.time} onChange={set("time")} /></Field>
        <Field label="상태">
          <Select value={f.status} onChange={set("status")}>
            {Object.entries(WORK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="상세 내용">
        <textarea value={f.detail} onChange={set("detail")} rows={3} placeholder="작업 절차, 사전 백업, 검증 방법 등"
          className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
          style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.text }} />
      </Field>

      <div className="flex gap-2 mt-1">
        {existing && <button onClick={del} className="rounded-lg px-3 py-2.5 text-sm font-medium" style={{ border: `1px solid ${C.line}`, color: C.late }}>삭제</button>}
        <button onClick={save} disabled={busy} className="flex-1 rounded-lg py-2.5 text-sm font-semibold" style={btnPrimary}>
          {busy ? "저장 중…" : existing ? "저장" : "등록"}
        </button>
      </div>
    </Modal>
  );
};
