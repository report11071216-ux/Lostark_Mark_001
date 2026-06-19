import React from "react";
import { ArrowLeft, Printer } from "lucide-react";
import type { Device, InsSection, InsHeaderField } from "../../types/db";

export const InspectionPrint: React.FC<{
  title: string; subtitle: string; inspectedOn: string; inspector: string;
  device: Device; headerFields: InsHeaderField[]; headerValues: Record<string, string>;
  sections: InsSection[]; onBack: () => void;
}> = ({ title, subtitle, inspectedOn, inspector, device, headerFields, headerValues, sections, onBack }) => {

  const dateStr = (() => {
    const [y, m, d] = inspectedOn.split("-");
    return `${y}. ${m}. ${d}`;
  })();

  return (
    <div style={{ position: "fixed", inset: 0, background: "#3a4555", zIndex: 120, overflowY: "auto" }}>
      {/* 상단 바 (인쇄 시 숨김) */}
      <div className="no-print" style={{ position: "sticky", top: 0, display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "#11151c", borderBottom: "1px solid rgba(148,163,184,0.16)" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#8595ab", background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={14} /> 편집으로
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginLeft: 8 }}>{title} 미리보기</span>
        <button onClick={() => window.print()} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, padding: "8px 16px", borderRadius: 9, background: "#2dd4bf", color: "#06241f", border: "none", cursor: "pointer" }}>
          <Printer size={14} /> 인쇄 / PDF 저장
        </button>
      </div>

      {/* A4 문서 */}
      <div style={{ display: "flex", justifyContent: "center", padding: "24px 0 60px" }}>
        <div className="a4-sheet" style={{ width: "210mm", minHeight: "297mm", background: "#fff", color: "#1a2230", padding: "16mm 15mm 0", boxShadow: "0 12px 40px rgba(0,0,0,0.4)", boxSizing: "border-box", display: "flex", flexDirection: "column", fontFamily: "'Pretendard',-apple-system,sans-serif" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "2.5px solid #0f766e", paddingBottom: 14 }}>
          <div>
            <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.5px", color: "#0f1822" }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: "#5b6577", marginTop: 3, letterSpacing: "1px" }}>{subtitle}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>점검일자</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f766e" }}>{dateStr}</div>
          </div>
        </div>

        {/* 헤더 정보 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
          <HCard label="장비명(모델)" value={`${device.system_name}${device.model ? ` / ${device.model}` : ""}`} />
          <HCard label="점검자" value={inspector || "—"} />
          {headerFields.map((f) => <HCard key={f.key} label={f.label} value={headerValues[f.key] || "—"} />)}
        </div>

        {/* 섹션들 */}
        {sections.map((s) => (
          <div key={s.id} style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <div style={{ width: 3, height: 14, background: "#0f766e", borderRadius: 2 }} />
              <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f1822" }}>{s.title}</span>
            </div>

            {/* 2열 값형 */}
            {s.kind === "kv" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                <thead>
                  <tr style={{ color: "#64748b" }}>
                    <th style={{ textAlign: "left", fontWeight: 600, padding: "5px 8px" }}>점검 항목</th>
                    {(s.columns || ["값"]).map((c, i) => <th key={i} style={{ textAlign: "center", fontWeight: 600, padding: "5px 8px", width: 110 }}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(s.rows || []).map((r, ri) => (
                    <tr key={ri} style={{ borderTop: "1px solid #e8edf0" }}>
                      <td style={{ padding: "7px 8px" }}>{r.label}</td>
                      {(s.columns || ["값"]).map((_, ci) => <td key={ci} style={{ textAlign: "center", padding: "7px 8px" }}>{cell(r.values[ci])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 반복 표형 */}
            {s.kind === "table" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ color: "#64748b" }}>
                    {(s.tableColumns || []).map((c, i) => <th key={i} style={{ textAlign: "left", fontWeight: 600, padding: "5px 8px", background: "#f1f5f5" }}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(s.tableRows || []).map((r, ri) => (
                    <tr key={ri} style={{ borderTop: "1px solid #e8edf0" }}>
                      {(s.tableColumns || []).map((_, ci) => <td key={ci} style={{ padding: "6px 8px" }}>{r[ci] || "—"}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 자유 텍스트 */}
            {s.kind === "text" && (
              <div style={{ background: "#f8fafa", border: "1px solid #e8edf0", borderRadius: 8, padding: "11px 13px", fontSize: 11, color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {s.text || ""}
              </div>
            )}
          </div>
        ))}

        {/* 푸터 (맨 아래 고정) */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderTop: "1.5px solid #e2e8f0", paddingTop: 12, paddingBottom: 14 }}>
          <div style={{ fontSize: 8.5, color: "#94a3b8", lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: "#475569" }}>주식회사 코넥</div>
            강원도 원주시 건강로 21길 조은빌딩 3층<br />TEL 033-733-2743 · FAX 033-731-2743 · kornec.com
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-1px", color: "#0f766e" }}>KOR<span style={{ color: "#1a2230" }}>NEC</span></div>
        </div>

        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .a4-sheet { box-shadow: none !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
};

// 값이 정상/완료/이상이면 배지로
const cell = (v?: string) => {
  if (!v) return "—";
  const ok = ["정상", "완료", "양호", "O", "o", "Pass", "pass"];
  const bad = ["이상", "불량", "실패", "X", "x", "Fail", "fail"];
  if (ok.includes(v.trim())) return <span style={{ background: "#dcfce7", color: "#15803d", padding: "1px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{v}</span>;
  if (bad.includes(v.trim())) return <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "1px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{v}</span>;
  return v;
};

const HCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ background: "#f1f5f5", borderRadius: 8, padding: "9px 12px" }}>
    <div style={{ fontSize: 9.5, color: "#64748b", fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: "#1a2230" }}>{value}</div>
  </div>
);
