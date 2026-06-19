import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { InspectionTemplate, InspectionRecord, InsSection, InsHeaderField, TemplateFolder } from "../../types/db";

export function useInspections() {
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [t, f] = await Promise.all([
        supabase.from("inspection_templates").select("*").order("created_at", { ascending: false }),
        supabase.from("template_folders").select("*").order("sort_order"),
      ]);
      if (!alive) return;
      setTemplates((t.data as InspectionTemplate[]) || []);
      setFolders((f.data as TemplateFolder[]) || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // ── 폴더 ──
  const addFolder = useCallback(async (name: string) => {
    const { data, error } = await supabase.from("template_folders")
      .insert({ name, sort_order: folders.length }).select().single();
    if (error) { alert("폴더 추가 실패: " + error.message); return null; }
    setFolders((fs) => [...fs, data as TemplateFolder]);
    return data as TemplateFolder;
  }, [folders.length]);

  const renameFolder = useCallback(async (id: string, name: string) => {
    setFolders((fs) => fs.map((f) => (f.id === id ? { ...f, name } : f)));
    await supabase.from("template_folders").update({ name }).eq("id", id);
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    await supabase.from("template_folders").delete().eq("id", id);
    setFolders((fs) => fs.filter((f) => f.id !== id));
    // 폴더 안 템플릿은 미분류로 (DB는 on delete set null, 화면도 반영)
    setTemplates((ts) => ts.map((t) => (t.folder_id === id ? { ...t, folder_id: null } : t)));
  }, []);

  // ── 템플릿 ──
  const saveTemplate = useCallback(async (p: {
    name: string; title: string; subtitle: string;
    sections: InsSection[]; header_fields: InsHeaderField[]; folder_id: string | null;
  }) => {
    const { data, error } = await supabase.from("inspection_templates")
      .insert({ name: p.name, title: p.title || null, subtitle: p.subtitle || null, sections: p.sections, header_fields: p.header_fields, folder_id: p.folder_id })
      .select().single();
    if (error) { alert("템플릿 저장 실패: " + error.message); return null; }
    setTemplates((ts) => [data as InspectionTemplate, ...ts]);
    return data as InspectionTemplate;
  }, []);

  const moveTemplate = useCallback(async (id: string, folder_id: string | null) => {
    setTemplates((ts) => ts.map((t) => (t.id === id ? { ...t, folder_id } : t)));
    await supabase.from("inspection_templates").update({ folder_id }).eq("id", id);
  }, []);

  const renameTemplate = useCallback(async (id: string, name: string) => {
    setTemplates((ts) => ts.map((t) => (t.id === id ? { ...t, name } : t)));
    await supabase.from("inspection_templates").update({ name }).eq("id", id);
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await supabase.from("inspection_templates").delete().eq("id", id);
    setTemplates((ts) => ts.filter((t) => t.id !== id));
  }, []);

  return { templates, folders, loading, addFolder, renameFolder, deleteFolder, saveTemplate, moveTemplate, renameTemplate, deleteTemplate };
}

// 특정 장비의 점검 기록 목록
export function useDeviceRecords(deviceId: string | null) {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!deviceId) { setRecords([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("inspection_records").select("*").eq("device_id", deviceId).order("inspected_on", { ascending: false });
    setRecords((data as InspectionRecord[]) || []);
    setLoading(false);
  }, [deviceId]);

  useEffect(() => { reload(); }, [reload]);

  return { records, loading, reload };
}

// 점검 기록 저장 (빌더에서 호출)
export async function saveInspectionRecord(p: {
  device_id: string; site_id: string;
  title: string; subtitle: string;
  inspected_on: string; inspector: string;
  header_values: Record<string, string>;
  sections: InsSection[];
}): Promise<string | null> {
  const { error } = await supabase.from("inspection_records").insert({
    device_id: p.device_id, site_id: p.site_id,
    title: p.title || null, subtitle: p.subtitle || null,
    inspected_on: p.inspected_on, inspector: p.inspector || null,
    header_values: p.header_values, sections: p.sections,
  });
  return error ? error.message : null;
}

// 점검 기록 삭제
export async function deleteInspectionRecord(id: string): Promise<void> {
  await supabase.from("inspection_records").delete().eq("id", id);
}
