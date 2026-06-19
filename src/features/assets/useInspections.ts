import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { InspectionTemplate, InspectionRecord, InsSection, InsHeaderField } from "../../types/db";

export function useInspections() {
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // 템플릿 목록 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("inspection_templates").select("*").order("created_at", { ascending: false });
      if (!alive) return;
      setTemplates((data as InspectionTemplate[]) || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  // 템플릿 저장 (새로 만들기)
  const saveTemplate = useCallback(async (p: {
    name: string; title: string; subtitle: string;
    sections: InsSection[]; header_fields: InsHeaderField[];
  }) => {
    const { data, error } = await supabase.from("inspection_templates")
      .insert({ name: p.name, title: p.title || null, subtitle: p.subtitle || null, sections: p.sections, header_fields: p.header_fields })
      .select().single();
    if (error) { alert("템플릿 저장 실패: " + error.message); return null; }
    setTemplates((ts) => [data as InspectionTemplate, ...ts]);
    return data as InspectionTemplate;
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await supabase.from("inspection_templates").delete().eq("id", id);
    setTemplates((ts) => ts.filter((t) => t.id !== id));
  }, []);

  return { templates, loading, saveTemplate, deleteTemplate };
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
