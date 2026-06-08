import React, { useMemo, useState } from "react";
import { Printer, FileText } from "lucide-react";
import { C } from "../../lib/constants";
import { Panel } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import type { ChecklistEntry } from "../../types/db";

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const inMonth = (isoDate: string | null, key: string) => !!isoDate && isoDate.slice(0, 7) === key;

export const ReportPage: React.FC = () => {
  const { sites, inspections, issues, nameOf } = useApp();
  const [month, setMonth] = useState(ym(new Date()));

  const data = useMemo(() => {
    const done = inspections.filter((i) => i.status === "done" && inMonth(i.scheduled_for, month));
    const findings: { site: string; entry: ChecklistEntry }[] = [];
    done.forEach((i) => {
      const list = (Array.isArray(i.checklist) ? i.checklist : []) as ChecklistEntry[];
      const sname = sites.find((s) => s.id === i.site_id)?.name || "미지정";
      list.filter((e) => e.result !== "pass").forEach((e) => findings.push({ site: sname, entry: e }));
    });
    const newIssues = issues.filter((i) => inMonth((i.created_at || "").slice(0, 10), month));
    const resolved = issues.filter((i) => inMonth((i.resolved_at || "").slice(0, 10), month));
    return { done, findings, newIssues, resolved };
  }, [inspections, issues, sites, month]);

  const RESULT_COLOR: Record<string, string> = { warn: C.soon, fail: C.late, pass: C.ok };

  return (
    <div className="space-y-4">
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #report-print, #report-print * { visibility: visible !important; }
        #report-print { position: absolute; left: 0; top: 0; width: 100%; background: #fff !important; color: #111 !important; }
        #report-print * { color: #111 !important; border-color: #ccc !important; background: transparent !important; }
        .no-print { display: none !important; }
      }`}</style>

      <div className="flex items-center gap-3 no-print">
        <FileText size={16} style={{ color: C.accent }} />
        <span className="text-sm font-semibold" style={{ color: C.text }}>월간 점검 보고서</span>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg px-3 py-1.5 text-sm outline-none" style={{ background: C.panel2, border: `1px solid ${C.line}`, color: C.text }} />
        <button onClick={() => window.print()} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: C.accent, color: "#06241f" }}>
          <Printer size={13} /> 인쇄 / PDF 저장
        </button>
      </div>

      <div id="report-print">
        <Panel className="p-6">
          <div className="mb-5">
            <div className="text-lg font-bold" style={{ color: C.text }}>정기점검 월간 보고서</div>
            <div className="text-xs mt-1" style={{ color: C.sub }}>대상 기간 {month} · 생성일 {new Date().toISOString().slice(0, 10)}</div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              ["점검 수행", data.done.length],
              ["발견사항", data.findings.length],
              ["신규 이슈", data.newIssues.length],
              ["해결 이슈", data.resolved.length],
            ].map(([label, val]) => (
              <div key={label as string} className="rounded-lg p-3" style={{ background: C.panel2 }}>
                <div className="text-xs mb-1" style={{ color: C.sub }}>{label}</div>
                <div className="font-mono text-2xl font-bold" style={{ color: C.text }}>{val as number}</div>
              </div>
            ))}
          </div>

          <div className="text-sm font-semibold mb-2" style={{ color: C.text }}>점검 수행 내역</div>
          <table className="w-full text-sm mb-6" style={{ color: C.text }}>
            <thead><tr style={{ color: C.faint }} className="text-xs text-left">
              <th className="py-1.5 pr-3">사이트</th><th className="py-1.5 pr-3">수행일</th><th className="py-1.5 pr-3">유형</th><th className="py-1.5">담당</th>
            </tr></thead>
            <tbody>
              {data.done.length === 0 && <tr><td colSpan={4} className="py-4 text-center" style={{ color: C.faint }}>해당 월 점검 기록이 없습니다.</td></tr>}
              {data.done.map((i) => (
                <tr key={i.id} style={{ borderTop: `1px solid ${C.line2}` }}>
                  <td className="py-2 pr-3">{sites.find((s) => s.id === i.site_id)?.name || "미지정"}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{i.scheduled_for}</td>
                  <td className="py-2 pr-3 text-xs">{i.kind === "adhoc" ? "임시" : "정기"}</td>
                  <td className="py-2 text-xs">{nameOf(i.performed_by)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-sm font-semibold mb-2" style={{ color: C.text }}>발견사항 (WARN/FAIL)</div>
          <div className="mb-6">
            {data.findings.length === 0 && <div className="text-xs py-2" style={{ color: C.faint }}>발견사항 없음 — 모든 항목 정상.</div>}
            {data.findings.map((f, idx) => (
              <div key={idx} className="flex items-start gap-3 py-2 text-sm" style={{ borderTop: idx ? `1px solid ${C.line2}` : "none" }}>
                <span className="font-bold text-[11px] mt-0.5" style={{ color: RESULT_COLOR[f.entry.result] }}>{f.entry.result.toUpperCase()}</span>
                <div className="flex-1">
                  <span style={{ color: C.text }}>{f.entry.item}</span>
                  {f.entry.note && <span style={{ color: C.sub }}> — {f.entry.note}</span>}
                  <div className="text-xs" style={{ color: C.faint }}>{f.site}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-sm font-semibold mb-2" style={{ color: C.text }}>이슈 요약</div>
          <div>
            {data.newIssues.length === 0 && <div className="text-xs py-2" style={{ color: C.faint }}>해당 월 신규 이슈 없음.</div>}
            {data.newIssues.map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-2 text-sm" style={{ borderTop: `1px solid ${C.line2}` }}>
                <span style={{ color: C.text, flex: 1 }}>{i.title}</span>
                <span className="text-xs" style={{ color: C.faint }}>{(i.created_at || "").slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};
