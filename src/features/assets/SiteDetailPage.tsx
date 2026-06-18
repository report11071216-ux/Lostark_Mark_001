import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Server, Plus, Monitor, Store, Pencil, Trash2, Share2 } from "lucide-react";
import { C, DEVICE_CATEGORY, NET_ZONE } from "../../lib/constants";
import { Panel } from "../../components/ui";
import { useApp } from "../../data/AppProvider";
import { DeviceModal } from "./DeviceModal";
import { VendorModal } from "./VendorModal";
import type { Device, Vendor } from "../../types/db";

export const SiteDetailPage: React.FC = () => {
  const { siteId = "" } = useParams();
  const { sites, devices, vendors, removeDevice, removeVendor } = useApp();
  const [addDev, setAddDev] = useState(false);
  const [editDev, setEditDev] = useState<Device | null>(null);
  const [addVen, setAddVen] = useState(false);
  const [editVen, setEditVen] = useState<Vendor | null>(null);

  const site = sites.find((s) => s.id === siteId);
  const devList = devices.filter((d) => d.site_id === siteId);
  const venList = vendors.filter((v) => v.site_id === siteId);

  if (!site) return (
    <Panel><div className="text-center py-10 text-sm" style={{ color: C.faint }}>사이트를 찾을 수 없습니다. <Link to="/sites" style={{ color: C.accent }}>목록으로</Link></div></Panel>
  );

  const cols = ["구분", "망", "관리", "시스템명", "모델명", "시리얼", "OS", "도입", "IP", "업체", ""];

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
        <div className="flex items-center gap-2 px-5 py-3.5" style={{ borderBottom: `1px solid ${C.line2}` }}>
          <Monitor size={15} style={{ color: C.accent }} />
          <span className="text-sm font-semibold" style={{ color: C.text }}>장비 현황</span>
          <button onClick={() => setAddDev(true)} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: C.accent, color: "#06241f" }}>
            <Plus size={13} /> 장비 등록
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ color: C.text, minWidth: 820 }}>
            <thead><tr style={{ color: C.faint }}>{cols.map((h, i) => <th key={i} className="text-left font-medium px-3 py-2.5 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {devList.length === 0 && <tr><td colSpan={cols.length} className="text-center py-8" style={{ color: C.faint }}>등록된 장비가 없습니다.</td></tr>}
              {devList.map((d) => {
                const cat = DEVICE_CATEGORY[d.category];
                return (
                  <tr key={d.id} style={{ borderTop: `1px solid ${C.line2}` }} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5"><span className="rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap" style={{ background: `${cat.color}1a`, color: cat.color }}>{cat.label}</span></td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.sub }}>{d.net_zone ? NET_ZONE[d.net_zone] : "—"}</td>
                    <td className="px-3 py-2.5" style={{ color: d.managed ? C.ok : C.faint }}>{d.managed ? "O" : "X"}</td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{d.system_name}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.sub }}>{d.model || "—"}</td>
                    <td className="px-3 py-2.5 font-mono whitespace-nowrap" style={{ color: C.sub }}>{d.serial || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.sub }}>{d.os || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.sub }}>{d.introduced_on || "—"}</td>
                    <td className="px-3 py-2.5 font-mono whitespace-nowrap" style={{ color: C.sub }}>{d.ip || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: C.sub }}>{d.vendor_name || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
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
    </div>
  );
};
