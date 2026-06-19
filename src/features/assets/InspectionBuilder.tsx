import React, { useState } from "react";
import { C } from "../../lib/constants";
import { X, Plus, Trash2, ChevronUp, ChevronDown, Save, FolderOpen, FileDown, Folder, FolderPlus, Pencil } from "lucide-react";
import { useApp } from "../../data/AppProvider";
import { useInspections, saveInspectionRecord } from "./useInspections";
import { InspectionPrint } from "./InspectionPrint";
import type { Device, InsSection, InsHeaderField, InspectionTemplate } from "../../types/db";

const uid = () => Math.random().toString(36).slice(2, 9);

const blankSection = (kind: InsSection["kind"]): InsSection => {
  if (kind === "kv") return { id: uid(), kind, title: "점검 항목", columns: ["업무망", "인터넷망"], rows: [{ label: "", values: ["", ""] }] };
  if (kind === "table") return { id: uid(), kind, title: "표", tableColumns: ["위치", "Hostname", "모델명", "Version"], tableRows: [["", "", "", ""]] };
  return { id: uid(), kind: "text", title: "특이사항", text: "" };
};

export const InspectionBuilder: React.FC<{ device: Device; onClose: () => void }> = ({ device, onClose }) => {
  const { me } = useApp();
  const I = useInspections();

  const [title, setTitle] = useState("정기점검표");
  const [subtitle, setSubtitle] = useState("");
  const [inspectedOn, setInspectedOn] = useState(new Date().toISOString().slice(0, 10));
  const [inspector, setInspector] = useState(me?.name || "");
  const [headerFields, setHeaderFields] = useState<InsHeaderField[]>([
    { key: "customer", label: "고객명" }, { key: "usage", label: "장비용도" },
  ]);
  const [headerValues, setHeaderValues] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<InsSection[]>([blankSection("kv")]);

  const [showLoad, setShowLoad] = useState(false);
  const [showSaveTpl, setShowSaveTpl] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplFolder, setTplFolder] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  const updateSection = (id: string, patch: Partial<InsSection>) =>
    setSections((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSection = (id: string) => setSections((ss) => ss.filter((s) => s.id !== id));
  const moveSection = (id: string, dir: -1 | 1) => setSections((ss) => {
    const i = ss.findIndex((s) => s.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= ss.length) return ss;
    const copy = [...ss]; [copy[i], copy[j]] = [copy[j], copy[i]]; return copy;
  });

  const addHeaderField = () => setHeaderFields((h) => [...h, { key: uid(), label: "항목" }]);
  const updateHeaderField = (key: string, label: string) => setHeaderFields((h) => h.map((f) => (f.key === key ? { ...f, label } : f)));
  const removeHeaderField = (key: string) => setHeaderFields((h) => h.filter((f) => f.key !== key));

  const loadTemplate = (t: InspectionTemplate) => {
    setTitle(t.title || "정기점검표"); setSubtitle(t.subtitle || "");
    setHeaderFields(t.header_fields || []);
    setSections((t.sections || []).map((s) => ({ ...s, id: uid() })));
    setShowLoad(false);
  };
  const doSaveTemplate = async () => {
    if (!tplName.trim()) return;
    await I.saveTemplate({ name: tplName.trim(), title, subtitle, sections, header_fields: headerFields, folder_id: tplFolder });
    setTplName(""); setShowSaveTpl(false);
    alert("템플릿으로 저장했습니다.");
  };

  const doSave = async () => {
    setBusy(true);
    const err = await saveInspectionRecord({
      device_id: device.id, site_id: device.site_id, title, subtitle,
      inspected_on: inspectedOn, inspector, header_values: headerValues, sections,
    });
    setBusy(false);
    if (err) alert("저장 실패: " + err); else { alert("점검 기록을 저장했습니다."); onClose(); }
  };

  if (preview) {
    return <InspectionPrint
      title={title} subtitle={subtitle} inspectedOn={inspectedOn} inspector={inspector}
      device={device} headerFields={headerFields} headerValues={headerValues} sections={sections}
      onBack={() => setPreview(false)} />;
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", justifyContent: "center", overflowY: "auto" }}>
      <div style={{ width: 760, maxWidth: "94vw", margin: "24px 0", height: "fit-content", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 16 }}>

        <div style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: C.panel, borderBottom: `1px solid ${C.line}`, borderRadius: "16px 16px 0 0", flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>정기점검 작성</span>
          <span style={{ fontSize: 11, color: C.sub }}>{device.system_name}{device.model ? ` · ${device.model}` : ""}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button onClick={() => setShowLoad(true)} style={barBtn}><FolderOpen size={13} /> 템플릿 불러오기</button>
            <button onClick={() => setShowSaveTpl(true)} style={barBtn}><Save size={13} /> 템플릿 저장</button>
            <button onClick={() => setPreview(true)} style={{ ...barBtn, color: C.accent, borderColor: `${C.accent}66` }}><FileDown size={13} /> 미리보기·출력</button>
            <button onClick={doSave} disabled={busy} style={{ ...barBtn, background: C.accent, color: "#06241f", border: "none", fontWeight: 700 }}>{busy ? "저장 중…" : "저장"}</button>
            <button onClick={onClose} style={{ ...barBtn, padding: "7px 9px" }}><X size={14} /></button>
          </div>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={lbl}>출력 제목</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="FW 정기점검표" style={inp} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={lbl}>영문 부제 (선택)</label>
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="FIREWALL ROUTINE INSPECTION" style={inp} />
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
              <span style={cardTitle}>헤더 정보</span>
              <button onClick={addHeaderField} style={{ ...miniBtn, marginLeft: "auto" }}><Plus size={12} /> 항목</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div><label style={lbl}>점검일자</label><input type="date" value={inspectedOn} onChange={(e) => setInspectedOn(e.target.value)} style={inp} /></div>
              <div><label style={lbl}>점검자</label><input value={inspector} onChange={(e) => setInspector(e.target.value)} style={inp} /></div>
              <div><label style={lbl}>장비명</label><input value={device.system_name} disabled style={{ ...inp, opacity: 0.6 }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {headerFields.map((f) => (
                <div key={f.key} style={{ display: "flex", gap: 5, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <input value={f.label} onChange={(e) => updateHeaderField(f.key, e.target.value)} style={{ ...inp, marginBottom: 4, fontSize: 11, color: C.sub }} />
                    <input value={headerValues[f.key] || ""} onChange={(e) => setHeaderValues((v) => ({ ...v, [f.key]: e.target.value }))} placeholder="값" style={inp} />
                  </div>
                  <button onClick={() => removeHeaderField(f.key)} style={{ color: C.faint, paddingBottom: 9 }}><X size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          {sections.map((s) => (
            <SectionEditor key={s.id} section={s}
              onChange={(p) => updateSection(s.id, p)}
              onRemove={() => removeSection(s.id)}
              onMoveUp={() => moveSection(s.id, -1)} onMoveDown={() => moveSection(s.id, 1)} />
          ))}

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
            <button onClick={() => setSections((ss) => [...ss, blankSection("kv")])} style={{ ...addBtn, borderColor: `${C.accent}66`, color: C.accent }}>+ 2열 값형</button>
            <button onClick={() => setSections((ss) => [...ss, blankSection("table")])} style={{ ...addBtn, borderColor: "#60a5fa66", color: "#60a5fa" }}>+ 반복 표형</button>
            <button onClick={() => setSections((ss) => [...ss, blankSection("text")])} style={{ ...addBtn, borderColor: C.line, color: C.sub }}>+ 자유 텍스트</button>
          </div>
        </div>
      </div>

      {showLoad && <LoadDialog I={I} onPick={loadTemplate} onClose={() => setShowLoad(false)} />}

      {showSaveTpl && (
        <Popup title="현재 양식을 템플릿으로 저장" onClose={() => setShowSaveTpl(false)}>
          <label style={lbl}>템플릿 이름</label>
          <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="FW 정기점검표" autoFocus style={inp} />
          <label style={lbl}>폴더</label>
          <select value={tplFolder || ""} onChange={(e) => setTplFolder(e.target.value || null)} style={inp}>
            <option value="">미분류</option>
            {I.folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button onClick={doSaveTemplate} style={{ width: "100%", marginTop: 8, padding: "9px", borderRadius: 8, background: C.accent, color: "#06241f", fontWeight: 700, border: "none", cursor: "pointer" }}>저장</button>
        </Popup>
      )}
    </div>
  );
};

// ───── 불러오기 다이얼로그 (폴더 + 카드) ─────
const LoadDialog: React.FC<{ I: ReturnType<typeof useInspections>; onPick: (t: InspectionTemplate) => void; onClose: () => void }> = ({ I, onPick, onClose }) => {
  const [activeFolder, setActiveFolder] = useState<string | "all" | "none">("all");
  const [newFolder, setNewFolder] = useState("");
  const [adding, setAdding] = useState(false);

  const shown = I.templates.filter((t) =>
    activeFolder === "all" ? true : activeFolder === "none" ? !t.folder_id : t.folder_id === activeFolder
  );
  const folderName = activeFolder === "all" ? "전체" : activeFolder === "none" ? "미분류" : I.folders.find((f) => f.id === activeFolder)?.name || "";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 640, maxWidth: "94vw", maxHeight: "82vh", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>템플릿 불러오기</span>
          <button onClick={onClose} style={{ marginLeft: "auto", color: C.faint }}><X size={16} /></button>
        </div>

        <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
          {/* 폴더 목록 */}
          <div style={{ width: 168, flexShrink: 0, overflowY: "auto" }}>
            <FolderRow active={activeFolder === "all"} onClick={() => setActiveFolder("all")} icon="📂" name="전체" count={I.templates.length} />
            {I.folders.map((f) => (
              <FolderRow key={f.id} active={activeFolder === f.id} onClick={() => setActiveFolder(f.id)} icon="📁" name={f.name}
                count={I.templates.filter((t) => t.folder_id === f.id).length}
                onRename={() => { const n = prompt("폴더 이름", f.name); if (n) I.renameFolder(f.id, n.trim()); }}
                onDelete={() => { if (confirm(`'${f.name}' 폴더를 삭제할까요? (안의 템플릿은 미분류로 이동)`)) { I.deleteFolder(f.id); if (activeFolder === f.id) setActiveFolder("all"); } }} />
            ))}
            <FolderRow active={activeFolder === "none"} onClick={() => setActiveFolder("none")} icon="📁" name="미분류" count={I.templates.filter((t) => !t.folder_id).length} />
            {adding ? (
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                <input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="폴더 이름" autoFocus
                  style={{ ...inp, marginBottom: 0, fontSize: 11, padding: "5px 7px" }}
                  onKeyDown={(e) => { if (e.key === "Enter" && newFolder.trim()) { I.addFolder(newFolder.trim()); setNewFolder(""); setAdding(false); } }} />
              </div>
            ) : (
              <button onClick={() => setAdding(true)} style={{ ...miniBtn, marginTop: 6, width: "100%", justifyContent: "center", borderStyle: "dashed", color: C.accent, borderColor: `${C.accent}55` }}><FolderPlus size={12} /> 폴더 추가</button>
            )}
          </div>

          {/* 템플릿 카드 */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 11, color: C.faint, marginBottom: 8 }}>{folderName} · {shown.length}개</div>
            {shown.length === 0 && <div style={{ fontSize: 12, color: C.faint, padding: "20px 0", textAlign: "center" }}>템플릿이 없습니다.</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {shown.map((t) => (
                <div key={t.id} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                  <div style={{ fontSize: 10.5, color: C.faint }}>{t.title || ""} · 섹션 {(t.sections || []).length}개</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 8, alignItems: "center" }}>
                    <button onClick={() => onPick(t)} style={{ flex: 1, fontSize: 11, padding: "5px", borderRadius: 6, background: `${C.accent}1a`, color: C.accent, fontWeight: 600, border: "none", cursor: "pointer" }}>불러오기</button>
                    <select value={t.folder_id || ""} onChange={(e) => I.moveTemplate(t.id, e.target.value || null)} title="폴더 이동"
                      style={{ fontSize: 10, padding: "4px", borderRadius: 6, background: "transparent", color: C.sub, border: `1px solid ${C.line}`, maxWidth: 70 }}>
                      <option value="">미분류</option>
                      {I.folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <button onClick={() => { if (confirm(`'${t.name}' 템플릿을 삭제할까요?`)) I.deleteTemplate(t.id); }} style={{ color: C.faint, padding: 2 }}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FolderRow: React.FC<{ active: boolean; onClick: () => void; icon: string; name: string; count: number; onRename?: () => void; onDelete?: () => void }> = ({ active, onClick, icon, name, count, onRename, onDelete }) => (
  <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 10px", borderRadius: 9, marginBottom: 4, cursor: "pointer", background: active ? `${C.accent}14` : "transparent", border: active ? `1px solid ${C.accent}40` : "1px solid transparent" }}>
    <span style={{ fontSize: 13 }}>{icon}</span>
    <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? C.accent : C.text, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
    {onRename && <button onClick={(e) => { e.stopPropagation(); onRename(); }} style={{ color: C.faint, padding: 1 }}><Pencil size={11} /></button>}
    {onDelete && <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ color: C.faint, padding: 1 }}><Trash2 size={11} /></button>}
    {!onRename && <span style={{ fontSize: 10, color: C.faint }}>{count}</span>}
  </div>
);

// ───── 섹션 편집기 ─────
const SectionEditor: React.FC<{ section: InsSection; onChange: (p: Partial<InsSection>) => void; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void; }> = ({ section: s, onChange, onRemove, onMoveUp, onMoveDown }) => {
  const tagColor = s.kind === "kv" ? C.accent : s.kind === "table" ? "#60a5fa" : C.sub;
  const tagLabel = s.kind === "kv" ? "2열 값형" : s.kind === "table" ? "반복 표형" : "자유 텍스트";
  return (
    <div style={{ ...card, border: `1px solid ${tagColor}44` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: `${tagColor}22`, color: tagColor }}>{tagLabel}</span>
        <input value={s.title} onChange={(e) => onChange({ title: e.target.value })} style={{ ...inp, marginBottom: 0, flex: 1, fontWeight: 600 }} />
        <button onClick={onMoveUp} style={iconBtn}><ChevronUp size={14} /></button>
        <button onClick={onMoveDown} style={iconBtn}><ChevronDown size={14} /></button>
        <button onClick={onRemove} style={{ ...iconBtn, color: C.late }}><Trash2 size={13} /></button>
      </div>
      {s.kind === "kv" && <KvEditor s={s} onChange={onChange} />}
      {s.kind === "table" && <TableEditor s={s} onChange={onChange} />}
      {s.kind === "text" && (
        <textarea value={s.text || ""} onChange={(e) => onChange({ text: e.target.value })} rows={3} placeholder="특이사항 / 작업 내용" style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} />
      )}
    </div>
  );
};

const KvEditor: React.FC<{ s: InsSection; onChange: (p: Partial<InsSection>) => void }> = ({ s, onChange }) => {
  const cols = s.columns || ["값"];
  const rows = s.rows || [];
  const setColCount = (n: number) => {
    const next = n === 1 ? ["값"] : ["업무망", "인터넷망"];
    onChange({ columns: next, rows: rows.map((r) => ({ ...r, values: Array.from({ length: n }, (_, i) => r.values[i] || "") })) });
  };
  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: C.sub }}>열:</span>
        <button onClick={() => setColCount(1)} style={{ ...miniBtn, background: cols.length === 1 ? `${C.accent}22` : "transparent", color: cols.length === 1 ? C.accent : C.sub }}>1열</button>
        <button onClick={() => setColCount(2)} style={{ ...miniBtn, background: cols.length === 2 ? `${C.accent}22` : "transparent", color: cols.length === 2 ? C.accent : C.sub }}>2열(업무/인터넷망)</button>
      </div>
      {cols.length === 2 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <div style={{ flex: 2 }} />
          {cols.map((c, i) => (
            <input key={i} value={c} onChange={(e) => { const nc = [...cols]; nc[i] = e.target.value; onChange({ columns: nc }); }} style={{ ...inp, marginBottom: 0, flex: 1, fontSize: 11, textAlign: "center", color: C.sub }} />
          ))}
          <div style={{ width: 22 }} />
        </div>
      )}
      {rows.map((r, ri) => (
        <div key={ri} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <input value={r.label} onChange={(e) => { const nr = [...rows]; nr[ri] = { ...r, label: e.target.value }; onChange({ rows: nr }); }} placeholder="점검 항목" style={{ ...inp, marginBottom: 0, flex: 2 }} />
          {cols.map((_, ci) => (
            <input key={ci} value={r.values[ci] || ""} onChange={(e) => { const nr = [...rows]; const nv = [...r.values]; nv[ci] = e.target.value; nr[ri] = { ...r, values: nv }; onChange({ rows: nr }); }} placeholder="값" style={{ ...inp, marginBottom: 0, flex: 1, textAlign: "center" }} />
          ))}
          <button onClick={() => onChange({ rows: rows.filter((_, x) => x !== ri) })} style={{ color: C.faint, width: 22 }}><X size={13} /></button>
        </div>
      ))}
      <button onClick={() => onChange({ rows: [...rows, { label: "", values: cols.map(() => "") }] })} style={{ ...miniBtn, marginTop: 4 }}><Plus size={12} /> 항목 추가</button>
    </>
  );
};

const TableEditor: React.FC<{ s: InsSection; onChange: (p: Partial<InsSection>) => void }> = ({ s, onChange }) => {
  const cols = s.tableColumns || [];
  const rows = s.tableRows || [];
  return (
    <>
      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
        {cols.map((c, ci) => (
          <input key={ci} value={c} onChange={(e) => { const nc = [...cols]; nc[ci] = e.target.value; onChange({ tableColumns: nc }); }} style={{ ...inp, marginBottom: 0, flex: 1, fontSize: 11, color: C.sub, textAlign: "center" }} />
        ))}
        <button onClick={() => onChange({ tableColumns: [...cols, "열"], tableRows: rows.map((r) => [...r, ""]) })} style={{ ...miniBtn, whiteSpace: "nowrap" }}>+열</button>
        <button onClick={() => { if (cols.length <= 1) return; onChange({ tableColumns: cols.slice(0, -1), tableRows: rows.map((r) => r.slice(0, -1)) }); }} style={{ ...miniBtn, whiteSpace: "nowrap" }}>−열</button>
      </div>
      {rows.map((r, ri) => (
        <div key={ri} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {cols.map((_, ci) => (
            <input key={ci} value={r[ci] || ""} onChange={(e) => { const nr = rows.map((row) => [...row]); nr[ri][ci] = e.target.value; onChange({ tableRows: nr }); }} style={{ ...inp, marginBottom: 0, flex: 1 }} />
          ))}
          <button onClick={() => onChange({ tableRows: rows.filter((_, x) => x !== ri) })} style={{ color: C.faint, width: 22 }}><X size={13} /></button>
        </div>
      ))}
      <button onClick={() => onChange({ tableRows: [...rows, cols.map(() => "")] })} style={{ ...miniBtn, marginTop: 4 }}><Plus size={12} /> 행 추가</button>
    </>
  );
};

const Popup: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{ width: 340, maxWidth: "90vw", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</span>
        <button onClick={onClose} style={{ marginLeft: "auto", color: C.faint }}><X size={15} /></button>
      </div>
      {children}
    </div>
  </div>
);

const lbl: React.CSSProperties = { display: "block", fontSize: 11, color: C.sub, marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: C.panel2, border: `1px solid ${C.line}`, color: C.text, borderRadius: 8, padding: "7px 9px", fontSize: 12.5, marginBottom: 8, outline: "none" };
const card: React.CSSProperties = { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, marginBottom: 10 };
const cardTitle: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: C.accent };
const barBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "7px 11px", borderRadius: 8, border: `1px solid ${C.line}`, background: "transparent", color: C.text, cursor: "pointer" };
const miniBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "5px 9px", borderRadius: 7, border: `1px solid ${C.line}`, background: "transparent", color: C.sub, cursor: "pointer" };
const iconBtn: React.CSSProperties = { color: C.faint, background: "none", border: "none", cursor: "pointer", padding: 2 };
const addBtn: React.CSSProperties = { fontSize: 11, padding: "8px 14px", borderRadius: 9, border: "1px dashed", background: "transparent", cursor: "pointer" };
