import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, envMissing } from "../lib/supabase";
import { cmp, dayDiff, iso, nextRoutine, parse, prevRoutine } from "../lib/date";
import type {
  AlertItem, ChecklistEntry, ChecklistTemplate, EnrichedSite, Inspection, Issue, IssueState, Site, TeamMember, TeamRole,
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
  inspections: Inspection[];
  issues: Issue[];
  templates: ChecklistTemplate[];
  loading: boolean;
  reload: () => Promise<void>;
  // 파생
  enriched: EnrichedSite[];
  adhoc: Inspection[];
  alerts: AlertItem[];
  nameOf: (id: string | null) => string;
  isLead: boolean;
  // 뮤테이션 (Supabase 호출은 전부 여기 모음)
  addSite: (p: Partial<Site>) => Promise<string | null>;
  addAdhoc: (p: { site_id: string; scheduled_for: string; notes?: string | null }) => Promise<string | null>;
  addIssue: (p: Partial<Issue>) => Promise<string | null>;
  markDone: (site: Site, checklist?: ChecklistEntry[]) => Promise<string | null>;
  advanceIssue: (issue: Issue) => Promise<void>;
  updateMember: (id: string, patch: { approved?: boolean; role?: TeamRole; name?: string }) => Promise<string | null>;
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
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
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
    const [s, m, ins, iss, tpl] = await Promise.all([
      supabase.from("sites").select("*").eq("active", true).order("created_at"),
      supabase.from("team_members").select("id,name,email,role,approved"),
      supabase.from("inspections").select("*"),
      supabase.from("issues").select("*").order("created_at", { ascending: false }),
      supabase.from("checklist_templates").select("*").eq("active", true).order("sort_order"),
    ]);
    setSites((s.data as Site[]) || []);
    setMembers((m.data as TeamMember[]) || []);
    setInspections((ins.data as Inspection[]) || []);
    setIssues((iss.data as Issue[]) || []);
    setTemplates((tpl.data as ChecklistTemplate[]) || []);
    setLoading(false);
  }, [me]);
  useEffect(() => { reload(); }, [reload]);

  const nameOf = useCallback(
    (id: string | null) => members.find((m) => m.id === id)?.name || "—",
    [members]
  );

  const adhoc = useMemo(() => inspections.filter((i) => i.kind === "adhoc"), [inspections]);

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
    adhoc.filter((a) => a.status === "scheduled").forEach((a) => {
      const g = dayDiff(parse(a.scheduled_for), today);
      const nm = sites.find((x) => x.id === a.site_id)?.name || "임시";
      if (g < 0) out.push({ name: nm, level: "late", kind: "adhoc", msg: `임시점검 ${-g}일 지연` });
      else if (g <= 3) out.push({ name: nm, level: "soon", kind: "adhoc", msg: `임시점검 ${g === 0 ? "오늘" : "D-" + g}` });
    });
    return out.sort((a, b) => (a.level === "late" ? 0 : 1) - (b.level === "late" ? 0 : 1));
  }, [enriched, adhoc, sites]);

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

  const addAdhoc = useCallback(async (p: { site_id: string; scheduled_for: string; notes?: string | null }) => {
    const { error } = await supabase.from("inspections").insert({ ...p, kind: "adhoc", status: "scheduled" });
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
    sites, members, inspections, issues, templates, loading, reload,
    enriched, adhoc, alerts, nameOf, isLead: me?.role === "lead" && !!me?.approved,
    addSite, addAdhoc, addIssue, markDone, advanceIssue, updateMember,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
