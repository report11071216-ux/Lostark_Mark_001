import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { MapZone } from "../../types/db";

export function useMapZones() {
  const [zones, setZones] = useState<MapZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("map_zones").select("*").order("sort_order");
      if (!alive) return;
      setZones((data as MapZone[]) || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const addZone = useCallback(async (name: string, color: string) => {
    const { data, error } = await supabase.from("map_zones")
      .insert({ name, color, cx: 260, cy: 180, w: 260, h: 150, sort_order: zones.length })
      .select().single();
    if (error) { alert("구역 추가 실패: " + error.message); return; }
    setZones((zs) => [...zs, data as MapZone]);
  }, [zones.length]);

  const updateZone = useCallback(async (id: string, patch: Partial<Pick<MapZone, "name" | "color" | "cx" | "cy" | "w" | "h">>) => {
    // 화면은 즉시 반영, DB는 뒤따라 저장
    setZones((zs) => zs.map((z) => (z.id === id ? { ...z, ...patch } : z)));
    await supabase.from("map_zones").update(patch).eq("id", id);
  }, []);

  const deleteZone = useCallback(async (id: string) => {
    await supabase.from("map_zones").delete().eq("id", id);
    setZones((zs) => zs.filter((z) => z.id !== id));
  }, []);

  return { zones, loading, addZone, updateZone, deleteZone };
}
