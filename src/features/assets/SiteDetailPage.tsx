import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Server, Plus, Monitor, Store, Pencil, Trash2, Share2, ClipboardCheck, Star, Folder } from "lucide-react";
import { C, DEVICE_CATEGORY, NET_ZONE } from "../../lib/constants";
import { Panel } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import { DeviceModal } from "./DeviceModal";
import { VendorModal } from "./VendorModal";
import { InspectionBuilder } from "./InspectionBuilder";
import type { Device, Vendor } from "../../types/db";

const GOLD = "#fbbf24";
type GroupBy = "none" | "net" | "cat" | "loc";
const GROUP_OPTS: { key: GroupBy; label: string }[] = [
  { key: "none", label: "없음" },
  { key: "net", label: "망구분" },
  { key: "cat", label: "구분" },
  { key: "loc", label: "위치" },
];

export const SiteDetailPage: React.FC = () => {
  const { siteId = "" } = useParams();
  const {
    sites, devices, vendors, siteLocations,
    removeDevice, removeVendor, toggleBookmark, addLocation, updateLocation, removeLocation,
  } = useApp();
  const [addDev, setAddDev] = useState(false);
  const [editDev, setEditDev] = useState<Device | null>(null);
  const [addVen, setAddVen] = useState(false);
  const [editVen, setEditVen] = useState<Vendor | null>(null);
  const [inspectDev, setInspectDev] = useState<Device | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const site = sites.find((s) => s.id === siteId);
  const devList = devices.filter((d) => d.site_id === siteId);
  const venList = vendors.filter((v) => v.site_id === siteId);
  const folders = siteLocations.filter((l) => l.site_id === siteId);

  if (!site) return (
    <Panel><div className="text-center py-10 text-sm" style={{ color: C.faint }}>사이트를 찾을 수 없습니다. <Link to="/sites" style={{ color: C.accent }}>목록으로</Link></div></Panel>
  );

  const cols = ["", "구분", "망", "관리", "위치", "시스템명", "모델명", "시리얼", "OS", "도입", "IP", "업체", ""];
  const folderName = (id: string | null) => folders.find((l) => l.id === id)?.name || "—";
  const byName = (a: Device, b: Device) => a.system_name.localeCompare(b.system_name, "ko");

  // ① 북마크 필터 적용된 기본 목록
  const base = devList.filter((d) => !onlyBookmarked || d.bookmarked);
  const shownFlat = [...base].sort(byName);

  // ② 그룹핑
  type Grp = { key: string; label: string; color?: string; list: Device[]; isFolder?: boolean };
  let groups: Grp[] = [];
  if (groupBy === "net") {
    groups = [
      ...Object.entries(NET_ZONE).map(([k, label]) => ({ key: k, label: label as string, list: base.filter((d) => d.net_zone === k).sort(byName) })),
      { key: "none", label: "망 미지정", list: base.filter((d) => !d.net_zone).sort(byName) },
    ];
  } else if (groupBy === "cat") {
    groups = Object.entries(DEVICE_CATEGORY).map(([k, v]) => ({ key: k, label: v.label, color: v.color, list: base.filter((d) => d.category === k).sort(byName) }));
  } else if (groupBy === "loc") {
    groups = [
      ...folders.map((l) => ({ key: l.id, label: l.name, list: base.filter((d) => d.location_id === l.id).sort(byName), isFolder: true })),
      { key: "none", label: "미지정", list: base.filter((d) => !d.location_id).sort(byName) },
    ];
  }
  const visibleGroups = groups.filter((g) => g.list.length > 0 || g.isFolder);

  const renderTable = (list: Device[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" style={{ color: C.text, minWidth: 940 }}>
        <thead><tr style={{ color: C.faint }}>{cols.map((h, i) => <th key={i} className="text-left font-medium px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan={cols.length} className="text-center py-8" style={{ color: C.faint }}>등록된 장비가 없습니다.</td></tr>}
          {list.map((d) => {
            const cat = DEVICE_CATEGORY[d.category];
            return (
              <tr key={d.id} style={{ borderTop: `1px solid ${C.line2}` }} className="hover:bg-white/[0.02]">
                <td className="px-2 py-2.5">
                  <button onClick={() => toggleBookmark(d)} title={d.bookmarked ? "북마크 해제" : "점검 대상 북마크"}>
                    <Star size={14} fill={d.bookmarked ? GOLD : "none"} style={{ color: d.bookmarked ? GOLD : C.faint }} />
                  </button>
                </td>
                <td className="px-3 py-2.5"><span className="rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap" style={{ background: `${cat.color}1a`, color: cat.color }}>{cat.label}</span></td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.sub }}>{d.net_zone ? NET_ZONE[d.net_zone] : "—"}</td>
                <td className="px-3 py-2.5" style={{ color: d.managed ? C.ok : C.faint }}>{d.managed ? "O" : "X"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: d.location_id ? C.sub : C.faint }}>{folderName(d.location_id)}</td>
                <td className="px-3 py-2.5 font-medium whitespace-nowrap">{d.system_name}</td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.sub }}>{d.model || "—"}</td>
                <td className="px-3 py-2.5 font-mono whitespace-nowrap" style={{ color: C.sub }}>{d.serial || "—"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.sub }}>{d.os || "—"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.sub }}>{d.introduced_on || "—"}</td>
                <td className="px-3 py-2.5 font-mono whitespace-nowrap" style={{ color: C.sub }}>{d.ip || "—"}</td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.sub }}>{d.vendor_name || "—"}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1.5 items-center">
                    <button onClick={() => setInspectDev(d)} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold whitespace-nowrap" style={{ background: `${C.accent}1a`, color: C.accent, border: `1px solid ${C.accent}40` }} title="정기점검">
                      <ClipboardCheck size={12} /> 점검
                    </button>
                    <button onClick={() => setEditDev(d)} style={{ color: C.faint }} title="수정"><Pencil size={13} /></button>
                    <button onClick={() => { if (confirm(`${d.system_name} 장비를 삭제할까요?`)) removeDevice(d.id); }} style={{ color: C.faint }} title="삭제"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const segStyle = (on: boolean): React.CSSProperties => on
    ? { background: `${C.accent}26`, color: C.accent, border: `1px solid ${C.accent}66` }
    : { background: "transparent", color: C.faint, border: `1px solid ${C.line}` };

  return (
    <div className="space-y-5">
      <div>
        <Link to="/sites" className="inline-flex items-center gap-1.5 text-xs mb-2" style={{ color: C.faint, textDecoration: "none" }}>
          <ArrowLeft size={13} /> 사이트 목록
        </Link>
        <div className="flex items-center gap-2.5">
          <Server size={18} style={{ color: C.accent }} />
          <span className="text-lg font-bold" style={{ color: C.text }}>{site.name}</span>
          <span className="text-xs" style={{ color: C.sub }}>{site.url || ""}</span>
          <span className="ml-auto text-xs px-2.5 py-1 rounded-lg" style={{ background: C.panel2, color: C.sub }}>장비 {devList.length} · 타사 {venList.length}</span>
          <Link to={`/sites/${siteId}/topology`} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: C.accent, color: "#06241f", textDecoration: "none" }}>
            <Share2 size={13} /> 구성도
          </Link>
        </div>
      </div>

      {/* 장비 현황 */}
      <Panel>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <div className="flex items-center gap-2">
            <Monitor size={15} style={{ color: C.accent }} />
            <span className="text-sm font-semibold" style={{ color: C.text }}>장비 현황</span>
            <span className="text-xs" style={{ color: C.faint }}>{base.length}{onlyBookmarked ? `/${devList.length}` : ""}대</span>
            <button onClick={() => setAddDev(true)} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: C.accent, color: "#06241f" }}>
              <Plus size={13} /> 장비 등록
            </button>
          </div>

          {/* ②① 컨트롤: 그룹핑 + 북마크 필터 */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[11px] mr-0.5" style={{ color: C.faint }}>그룹</span>
            {GROUP_OPTS.map((o) => (
              <button key={o.key} onClick={() => setGroupBy(o.key)} className="rounded-md px-2.5 py-1 text-[11px] font-medium" style={segStyle(groupBy === o.key)}>
                {o.label}
              </button>
            ))}
            <button onClick={() => setOnlyBookmarked((v) => !v)} className="ml-1 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium"
              style={onlyBookmarked ? { background: `${GOLD}26`, color: GOLD, border: `1px solid ${GOLD}66` } : { background: "transparent", color: C.faint, border: `1px solid ${C.line}` }}>
              <Star size={12} fill={onlyBookmarked ? GOLD : "none"} /> 북마크만
            </button>
          </div>

          {/* ③ 위치 폴더 관리 */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-1 text-[11px] mr-0.5" style={{ color: C.faint }}><Folder size={12} /> 위치 폴더</span>
            {folders.map((l) => (
              <span key={l.id} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px]" style={{ background: C.panel2, border: `1px solid ${C.line2}`, color: C.sub }}>
                {l.name}
                <button onClick={() => { const n = prompt("폴더 이름", l.name); if (n && n.trim()) updateLocation(l.id, { name: n.trim() }); }} style={{ color: C.faint }} title="이름변경"><Pencil size={11} /></button>
                <button onClick={() => { if (confirm(`'${l.name}' 폴더를 삭제할까요?\n(폴더 안 장비는 삭제되지 않고 '미지정'으로 이동합니다)`)) removeLocation(l.id); }} style={{ color: C.faint }} title="삭제"><Trash2 size={11} /></button>
              </span>
            ))}
            <button onClick={() => { const n = prompt("새 위치 폴더 이름 (예: 1층A동)"); if (n && n.trim()) addLocation({ site_id: siteId, name: n.trim(), sort_order: folders.length }); }} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ border: `1px dashed ${C.line}`, color: C.accent }}>
              <Plus size={11} /> 폴더
            </button>
          </div>
        </div>

        {/* 본문: 그룹 없음 = 단일 표 / 그룹 지정 = 그룹별 표 */}
        {groupBy === "none" ? renderTable(shownFlat) : (
          <div>
            {visibleGroups.length === 0 && <div className="text-center py-8 text-sm" style={{ color: C.faint }}>표시할 장비가 없습니다.</div>}
            {visibleGroups.map((g) => (
              <div key={g.key}>
                <div className="flex items-center gap-2 px-5 py-2" style={{ background: C.panel2, borderTop: `1px solid ${C.line2}` }}>
                  {g.color && <span className="inline-block w-2 h-2 rounded-full" style={{ background: g.color }} />}
                  <span className="text-xs font-semibold" style={{ color: C.text }}>{g.label}</span>
                  <span className="text-[11px]" style={{ color: C.faint }}>{g.list.length}</span>
                </div>
                {g.list.length > 0 ? renderTable(g.list) : <div className="text-center py-5 text-xs" style={{ color: C.faint }}>이 폴더에 장비가 없습니다.</div>}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* 타사 제품 */}
      <Panel>
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <Store size={15} style={{ color: C.accent }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>타사 제품 (업체 연락처)</span>
          <button onClick={() => setAddVen(true)} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ border: `1px solid ${C.line}`, color: C.accent }}>
            <Plus size={13} /> 타사 등록
          </button>
        </div>
        <div className="p-4">
          {venList.length === 0 && <div className="text-center py-6 text-sm" style={{ color: C.faint }}>등록된 타사 제품이 없습니다.</div>}
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            {venList.map((v) => (
              <div key={v.id} className="rounded-xl p-4" style={{ background: C.panel2, border: `1px solid ${C.line2}` }}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm font-semibold" style={{ color: C.text }}>{v.vendor_name}</span>
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => setEditVen(v)} style={{ color: C.faint }} title="수정"><Pencil size={12} /></button>
                    <button onClick={() => { if (confirm(`${v.vendor_name} 을(를) 삭제할까요?`)) removeVendor(v.id); }} style={{ color: C.faint }} title="삭제"><Trash2 size={12} /></button>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span style={{ color: C.faint }}>담당자</span><span style={{ color: C.text }}>{v.contact || "—"}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.faint }}>연락처</span><span className="font-mono" style={{ color: C.text }}>{v.phone || "—"}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.faint }}>이메일</span><span style={{ color: C.accent }}>{v.email || "—"}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {addDev && <DeviceModal siteId={siteId} onClose={() => setAddDev(false)} />}
      {editDev && <DeviceModal siteId={siteId} existing={editDev} onClose={() => setEditDev(null)} />}
      {addVen && <VendorModal siteId={siteId} onClose={() => setAddVen(false)} />}
      {editVen && <VendorModal siteId={siteId} existing={editVen} onClose={() => setEditVen(null)} />}
      {inspectDev && <InspectionBuilder device={inspectDev} onClose={() => setInspectDev(null)} />}
    </div>
  );
};
