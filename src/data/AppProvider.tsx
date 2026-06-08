import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, envMissing } from "../lib/supabase";
import { cmp, dayDiff, iso, nextRoutine, parse, prevRoutine } from "../lib/date";
import type {
  AlertItem, ChecklistEntry, ChecklistTemplate, Engineer, EnrichedSite, Inspection, Issue, IssueState, Site, TeamMember, TeamRole, WorkOrder,
} from "../types/db";

interface AppCtx {
  // 인증
  session: Session | null;
  me: TeamMember | null;
  authReady: boolean;
  envMissing: boolean;
  signOut: () => Promise<void>;
  // 원본 데이터
  sites: Site[];
  members: TeamMember[];
  engineers: Engineer[];
  inspections: Inspection[];
  issues: Issue[];
  templates: ChecklistTemplate[];
  workOrders: WorkOrder[];
  loading: boolean;
  reload: () => Promise<void>;
  // 파생
  enriched: EnrichedSite[];
  alerts: AlertItem[];
  nameOf: (id: string | null) => string;
  engineerName: (id: string | null) => string;
  isLead: boolean;
  // 뮤테이션 (Supabase 호출은 전부 여기 모음)
  addSite: (p: Partial<Site>) => Promise<string | null>;
  updateSite: (id: string, patch: Partial<Site>) => Promise<string | null>;
  removeSite: (id: string) => Promise<string | null>;
  addIssue: (p: Partial<Issue>) => Promise<string | null>;
  markDone: (site: Site, checklist?: ChecklistEntry[]) => Promise<string | null>;
  advanceIssue: (issue: Issue) => Promise<void>;
  updateMember: (id: string, patch: { approved?: boolean; role?: TeamRole; name?: string }) => Promise<string | null>;
  addEngineer: (p: { name: string; rank?: string; dept?: string }) => Promise<string | null>;
  removeEngineer: (id: string) => Promise<string | null>;
  addWorkOrder: (p: Partial<WorkOrder>) => Promise<string | null>;
  updateWorkOrder: (id: string, patch: Partial<WorkOrder>) => Promise<string | null>;
  removeWorkOrder: (id: string) => Promise<string | null>;
}

const Ctx = createContext<AppCtx | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within <AppProvider>");
  return v;
};

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [me, setMe] = useState<TeamMember | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);

  // 세션
  useEffect(() => {
    if (envMissing) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // 내 프로필
  useEffect(() => {
    if (envMissing || !session) { setMe(null); return; }
    supabase.from("team_members").select("*").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => setMe((data as TeamMember) ?? null));
  }, [session]);

  const reload = useCallback(async () => {
    if (envMissing || !me?.approved) return;
    setLoading(true);
    const [s, m, ins, iss, tpl, eng, wo] = await Promise.all([
      supabase.from("sites").select("*").eq("active", true).order("created_at"),
      supabase.from("team_members").select("id,name,email,role,approved"),
      supabase.from("inspections").select("*"),
      supabase.from("issues").select("*").order("created_at", { ascending: false }),
      supabase.from("checklist_templates").select("*").eq("active", true).order("sort_order"),
      supabase.from("engineers").select("*").eq("active", true).order("name"),
      supabase.from("work_orders").select("*").order("scheduled_at"),
    ]);
    setSites((s.data as Site[]) || []);
    setMembers((m.data as TeamMember[]) || []);
    setInspections((ins.data as Inspection[]) || []);
    setIssues((iss.data as Issue[]) || []);
    setTemplates((tpl.data as ChecklistTemplate[]) || []);
    setEngineers((eng.data as Engineer[]) || []);
    setWorkOrders((wo.data as WorkOrder[]) || []);
    setLoading(false);
  }, [me]);
  useEffect(() => { reload(); }, [reload]);

  const nameOf = useCallback(
    (id: string | null) => members.find((m) => m.id === id)?.name || "—",
    [members]
  );

  const engineerName = useCallback(
    (id: string | null) => engineers.find((e) => e.id === id)?.name || "—",
    [engineers]
  );

  const doneBySite = useMemo(() => {
    const map: Record<string, string> = {};
    inspections.filter((i) => i.status === "done").forEach((i) => {
      if (!map[i.site_id] || i.scheduled_for > map[i.site_id]) map[i.site_id] = i.scheduled_for;
    });
    return map;
  }, [inspections]);

  const enriched = useMemo<EnrichedSite[]>(() => {
    const today = new Date();
    return sites.map((s) => {
      const next = nextRoutine(s, today);
      const gap = dayDiff(next, today);
      const prev = prevRoutine(s, today);
      const lastDone = doneBySite[s.id] ? parse(doneBySite[s.id]) : null;
      const overdue = !!prev && cmp(prev, today) < 0 && (!lastDone || cmp(lastDone, prev) < 0);
      const status = overdue ? "late" : gap <= 3 ? "soon" : "ok";
      return { ...s, next, gap, status };
    });
  }, [sites, doneBySite]);

  const alerts = useMemo<AlertItem[]>(() => {
    const today = new Date();
    const out: AlertItem[] = [];
    enriched.forEach((s) => {
      if (s.status === "late") out.push({ name: s.name, level: "late", kind: "routine", msg: `정기점검 ${-s.gap > 0 ? -s.gap + "일 지연" : "지연"}` });
      else if (s.status === "soon") out.push({ name: s.name, level: "soon", kind: "routine", msg: `정기점검 ${s.gap === 0 ? "오늘" : "D-" + s.gap}` });
    });
    workOrders.filter((w) => w.status !== "done").forEach((w) => {
      const g = dayDiff(new Date(w.scheduled_at), today);
      if (g < 0) out.push({ name: w.title, level: "late", kind: "adhoc", msg: `작업 ${-g}일 경과` });
      else if (g <= 3) out.push({ name: w.title, level: "soon", kind: "adhoc", msg: `작업 ${g === 0 ? "오늘" : "D-" + g}` });
    });
    return out.sort((a, b) => (a.level === "late" ? 0 : 1) - (b.level === "late" ? 0 : 1));
  }, [enriched, workOrders]);

  // 브라우저 알림(권한 있을 때만)
  useEffect(() => {
    if (!alerts.length || typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      try { new Notification("점검 알림", { body: `${alerts.length}건의 점검이 임박/지연 상태입니다.` }); } catch { /* noop */ }
    }
  }, [alerts.length]);

  // ── 뮤테이션 ──
  const addSite = useCallback(async (p: Partial<Site>) => {
    const { error } = await supabase.from("sites").insert(p);
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload]);

  const updateSite = useCallback(async (id: string, patch: Partial<Site>) => {
    const { error } = await supabase.from("sites").update(patch).eq("id", id);
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload]);

  const removeSite = useCallback(async (id: string) => {
    const { error } = await supabase.from("sites").update({ active: false }).eq("id", id);
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload]);

  const addWorkOrder = useCallback(async (p: Partial<WorkOrder>) => {
    const { error } = await supabase.from("work_orders").insert({ ...p, created_by: session?.user.id ?? null });
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload, session]);

  const updateWorkOrder = useCallback(async (id: string, patch: Partial<WorkOrder>) => {
    const { error } = await supabase.from("work_orders").update(patch).eq("id", id);
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload]);

  const removeWorkOrder = useCallback(async (id: string) => {
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload]);

  const addIssue = useCallback(async (p: Partial<Issue>) => {
    const { error } = await supabase.from("issues").insert({ state: "open", ...p });
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload]);

  const markDone = useCallback(async (site: Site, checklist: ChecklistEntry[] = []) => {
    const prev = prevRoutine(site, new Date()) || new Date();
    const { error } = await supabase.from("inspections").insert({
      site_id: site.id, scheduled_for: iso(prev), kind: "routine", status: "done",
      performed_at: new Date().toISOString(), performed_by: session?.user.id ?? null,
      checklist,
    });
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload, session]);

  const updateMember = useCallback(async (id: string, patch: { approved?: boolean; role?: TeamRole; name?: string }) => {
    const { error } = await supabase.from("team_members").update(patch).eq("id", id);
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload]);

  const addEngineer = useCallback(async (p: { name: string; rank?: string; dept?: string }) => {
    const { error } = await supabase.from("engineers").insert({ name: p.name, rank: p.rank || null, dept: p.dept || null });
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload]);

  const removeEngineer = useCallback(async (id: string) => {
    const { error } = await supabase.from("engineers").update({ active: false }).eq("id", id);
    if (!error) await reload();
    return error?.message ?? null;
  }, [reload]);

  const advanceIssue = useCallback(async (issue: Issue) => {
    const next: IssueState = issue.state === "open" ? "in_progress" : issue.state === "in_progress" ? "resolved" : "open";
    await supabase.from("issues").update({
      state: next, resolved_at: next === "resolved" ? new Date().toISOString() : null,
    }).eq("id", issue.id);
    await reload();
  }, [reload]);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const value: AppCtx = {
    session, me, authReady, envMissing, signOut,
    sites, members, engineers, inspections, issues, templates, workOrders, loading, reload,
    enriched, alerts, nameOf, engineerName, isLead: me?.role === "lead" && !!me?.approved,
    addSite, updateSite, removeSite, addIssue, markDone, advanceIssue,
    updateMember, addEngineer, removeEngineer,
    addWorkOrder, updateWorkOrder, removeWorkOrder,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
