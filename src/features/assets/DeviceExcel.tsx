import React, { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { C, DEVICE_CATEGORY, NET_ZONE } from "../../lib/constants";
import { supabase } from "../../lib/supabase";
import { useApp } from "../../data/AppProvider";

// 내보내기/가져오기 공통 헤더 (순서 = 열 순서)
const HEADERS = ["구분", "망구분", "관리대상", "위치", "시스템명", "모델명", "시리얼", "운영체제", "도입년월", "IP", "업체명"];

// SheetJS를 필요할 때만 CDN에서 로드 (package.json 의존성 추가 없음)
const loadXLSX = () => import(/* @vite-ignore */ "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");

export const DeviceExcel: React.FC<{ siteId: string; siteName: string }> = ({ siteId, siteName }) => {
  const { devices, siteLocations, reload } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const folders = siteLocations.filter((l) => l.site_id === siteId);
  const folderName = (id: string | null) => folders.find((l) => l.id === id)?.name || "";

  // 라벨 → enum 키 역매핑 (가져오기용)
  const catKey = (label: unknown): string => {
    const t = String(label ?? "").trim();
    return (Object.keys(DEVICE_CATEGORY) as string[]).find((k) => (DEVICE_CATEGORY as any)[k].label === t) || "etc";
  };
  const zoneKey = (label: unknown): string | null => {
    const t = String(label ?? "").trim();
    return (Object.keys(NET_ZONE) as string[]).find((k) => (NET_ZONE as any)[k] === t) || null;
  };

  // ── 내보내기 ──
  const exportXlsx = async () => {
    setBusy(true);
    try {
      const XLSX: any = await loadXLSX();
      const list = devices.filter((d) => d.site_id === siteId);
      const aoa = [
        HEADERS,
        ...list.map((d) => [
          DEVICE_CATEGORY[d.category]?.label || "",
          d.net_zone ? NET_ZONE[d.net_zone] : "",
          d.managed ? "O" : "X",
          folderName(d.location_id),
          d.system_name || "",
          d.model || "",
          d.serial || "",
          d.os || "",
          d.introduced_on || "",
          d.ip || "",
          d.vendor_name || "",
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = HEADERS.map(() => ({ wch: 14 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "장비현황");
      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${siteName}_장비현황_${today}.xlsx`);
    } catch (e) {
      alert("내보내기 실패: " + ((e as any)?.message || e));
    }
    setBusy(false);
  };

  // ── 가져오기 ──
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!confirm(`'${file.name}'의 장비를 이 사이트에 가져올까요?\n기존 장비는 그대로 두고 새로 추가됩니다.`)) return;
    setBusy(true);
    try {
      const XLSX: any = await loadXLSX();
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, unknown>[];

      const payload: Record<string, unknown>[] = [];
      let skipped = 0;
      for (const r of rows) {
        const name = String(r["시스템명"] ?? "").trim();
        if (!name) { skipped++; continue; }
        const loc = folders.find((l) => l.name === String(r["위치"] ?? "").trim());
        const managedRaw = String(r["관리대상"] ?? "").trim().toUpperCase();
        payload.push({
          site_id: siteId,
          category: catKey(r["구분"]),
          net_zone: zoneKey(r["망구분"]),
          managed: !(managedRaw === "X" || managedRaw === "0" || managedRaw === "FALSE"),
          system_name: name,
          model: String(r["모델명"] ?? "").trim() || null,
          serial: String(r["시리얼"] ?? "").trim() || null,
          os: String(r["운영체제"] ?? "").trim() || null,
          introduced_on: String(r["도입년월"] ?? "").trim() || null,
          ip: String(r["IP"] ?? "").trim() || null,
          vendor_name: String(r["업체명"] ?? "").trim() || null,
          location_id: loc ? loc.id : null,
        });
      }

      if (payload.length === 0) { alert("가져올 행이 없습니다. (시스템명 열이 비어있는지 확인하세요)"); setBusy(false); return; }
      const { error } = await supabase.from("devices").insert(payload);
      if (error) {
        alert("가져오기 실패: " + error.message);
      } else {
        await reload();
        alert(`${payload.length}개 장비를 가져왔습니다.${skipped ? ` (시스템명이 빈 ${skipped}행은 건너뜀)` : ""}`);
      }
    } catch (e) {
      alert("가져오기 실패: " + ((e as any)?.message || e));
    }
    setBusy(false);
  };

  const btn: React.CSSProperties = { border: `1px solid ${C.line}`, color: C.sub };
  return (
    <>
      <button onClick={exportXlsx} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={btn} title="현재 사이트 장비를 Excel로 내보내기">
        <Download size={13} /> 내보내기
      </button>
      <button onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold" style={btn} title="Excel 파일에서 장비 가져오기">
        <Upload size={13} /> 가져오기
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={onFile} style={{ display: "none" }} />
    </>
  );
};
