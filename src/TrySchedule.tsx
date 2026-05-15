// ============================================================
//  TrySchedule.tsx
//  트라이 일정 페이지 (전체가 이 파일 하나에 들어 있음)
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Plus, RefreshCw, Trophy, Flame, ChevronLeft, ChevronRight,
  CalendarDays, ChevronDown, Users, Calendar, X, Edit3, Pause, Play,
  Trash2, Clock, MessageSquare, UserPlus, UserMinus, Save,
} from "lucide-react";

// ============================================================
//  타입 & 상수
// ============================================================
type TryStatus = "active" | "cleared" | "paused";
type PartyRole = "딜러" | "서포터";
type Difficulty = "노말" | "하드" | "익스트림" | "헬";

interface TrySchedule {
  id: string;
  raid_name: string;
  difficulty: Difficulty | null;
  party_size: number;
  status: TryStatus;
  current_gate: number;
  total_gates: number;
  start_date: string | null;
  cleared_date: string | null;
  description: string | null;
  created_by: string;
  created_by_name?: string | null;
  created_at: string;
  updated_at: string;
}

interface TrySession {
  id: string;
  try_id: string;
  session_date: string;
  session_time: string | null;
  attempt_note: string | null;
  created_by: string;
  created_by_name?: string | null;
  created_at: string;
}

interface TryParticipant {
  id: string;
  try_id: string;
  user_id: string;
  character_name: string | null;
  role: PartyRole | null;
  joined_at: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

const DIFFICULTY_OPTIONS: Difficulty[] = ["노말", "하드", "익스트림", "헬"];
const PARTY_SIZE_OPTIONS = [4, 8] as const;
const ROLE_OPTIONS: PartyRole[] = ["딜러", "서포터"];

const STATUS_LABEL: Record<TryStatus, string> = {
  active: "진행 중",
  paused: "잠시 중단",
  cleared: "클리어",
};
const STATUS_COLOR: Record<TryStatus, string> = {
  active: "#a78bfa",
  paused: "#fbbf24",
  cleared: "#34d399",
};

const isStaff = (role?: string | null) => role === "admin" || role === "submaster";

// 트라이마다 고유 색상
const RAID_COLORS = [
  { bg: "rgba(167,139,250,0.85)", glow: "rgba(139,92,246,0.5)" },
  { bg: "rgba(244,114,182,0.85)", glow: "rgba(236,72,153,0.5)" },
  { bg: "rgba(96,165,250,0.85)",  glow: "rgba(59,130,246,0.5)" },
  { bg: "rgba(52,211,153,0.85)",  glow: "rgba(16,185,129,0.5)" },
  { bg: "rgba(251,191,36,0.85)",  glow: "rgba(245,158,11,0.5)" },
  { bg: "rgba(248,113,113,0.85)", glow: "rgba(239,68,68,0.5)" },
];
const hashColor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return RAID_COLORS[h % RAID_COLORS.length];
};

// ============================================================
//  메인 컴포넌트 (default export)
// ============================================================
interface Props {
  user: any;
  profile: any;
  supabase: any;
}

export default function TrySchedulePage({ user, profile, supabase }: Props) {
  const [tries, setTries] = useState<TrySchedule[]>([]);
  const [sessions, setSessions] = useState<TrySession[]>([]);
  const [participants, setParticipants] = useState<TryParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTryId, setSelectedTryId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTry, setEditingTry] = useState<TrySchedule | null>(null);

  // 데이터 로드
  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [trRes, ssRes, ppRes] = await Promise.all([
        supabase.from("try_schedules").select("*").order("created_at", { ascending: false }),
        supabase.from("try_sessions").select("*").order("session_date", { ascending: true }),
        supabase.from("try_participants").select("*"),
      ]);
      if (trRes.error) throw trRes.error;
      if (ssRes.error) throw ssRes.error;
      if (ppRes.error) throw ppRes.error;

      const userIds = new Set<string>();
      (trRes.data || []).forEach((t: any) => userIds.add(t.created_by));
      (ssRes.data || []).forEach((s: any) => userIds.add(s.created_by));
      (ppRes.data || []).forEach((p: any) => userIds.add(p.user_id));

      let profilesMap: Record<string, any> = {};
      if (userIds.size > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, character_name, avatar_url")
          .in("id", Array.from(userIds));
        (profs || []).forEach((p: any) => { profilesMap[p.id] = p; });
      }

      setTries((trRes.data || []).map((t: any) => ({
        ...t,
        created_by_name:
          profilesMap[t.created_by]?.display_name ||
          profilesMap[t.created_by]?.character_name || "익명",
      })));
      setSessions((ssRes.data || []).map((s: any) => ({
        ...s,
        created_by_name:
          profilesMap[s.created_by]?.display_name ||
          profilesMap[s.created_by]?.character_name || "익명",
      })));
      setParticipants((ppRes.data || []).map((p: any) => ({
        ...p,
        display_name:
          profilesMap[p.user_id]?.display_name ||
          profilesMap[p.user_id]?.character_name || "익명",
        avatar_url: profilesMap[p.user_id]?.avatar_url || null,
      })));
    } catch (e) {
      console.error("[TrySchedule] fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel("try_schedule_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "try_schedules" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "try_sessions" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "try_participants" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, fetchAll]);

  const activeTries  = useMemo(() => tries.filter(t => t.status !== "cleared"), [tries]);
  const clearedTries = useMemo(() => tries.filter(t => t.status === "cleared"), [tries]);
  const selectedTry  = useMemo(() => tries.find(t => t.id === selectedTryId) || null, [tries, selectedTryId]);
  const selectedSessions     = useMemo(() => sessions.filter(s => s.try_id === selectedTryId), [sessions, selectedTryId]);
  const selectedParticipants = useMemo(() => participants.filter(p => p.try_id === selectedTryId), [participants, selectedTryId]);

  const stats = useMemo(() => ({
    active: activeTries.length,
    cleared: clearedTries.length,
    totalSessions: sessions.length,
  }), [activeTries, clearedTries, sessions]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
      {/* 헤더 */}
      <div
        className="rounded-[2rem] overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, rgba(28,23,51,0.92) 0%, rgba(45,27,78,0.88) 50%, rgba(15,13,32,0.95) 100%)",
          border: "1px solid rgba(139,92,246,0.18)",
          boxShadow: "0 18px 44px rgba(0,0,0,0.28)",
        }}
      >
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 70%)", filter: "blur(8px)" }}
        />
        <div className="relative px-6 sm:px-8 py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] mb-1.5 flex items-center gap-2" style={{ color: "#c4b5fd" }}>
              <Swords size={12} />
              Raid Try Schedule
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">트라이 일정</h1>
            <p className="text-sm mt-1.5" style={{ color: "rgba(196,181,253,0.65)" }}>
              길드원과 함께 도전 중인 레이드를 기록해보세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAll}
              disabled={loading}
              className="h-10 w-10 flex items-center justify-center rounded-xl transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#c4b5fd" }}
              title="새로고침"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            {user && (
              <button
                onClick={() => { setEditingTry(null); setShowForm(true); }}
                className="h-10 px-4 flex items-center gap-2 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", boxShadow: "0 6px 18px rgba(139,92,246,0.35)" }}
              >
                <Plus size={16} />
                새 트라이 등록
              </button>
            )}
          </div>
        </div>

        <div className="px-6 sm:px-8 py-4 grid grid-cols-3 gap-4" style={{ borderTop: "1px solid rgba(139,92,246,0.10)" }}>
          <StatBox icon={<Flame size={14} />}  label="진행 중"    value={stats.active}        color={STATUS_COLOR.active} />
          <StatBox icon={<Trophy size={14} />} label="클리어"     value={stats.cleared}       color={STATUS_COLOR.cleared} />
          <StatBox icon={<Swords size={14} />} label="누적 세션"  value={stats.totalSessions} color="#f9a8d4" />
        </div>
      </div>

      {/* 캘린더 */}
      <CalendarView tries={tries} sessions={sessions} onSelectTry={setSelectedTryId} />

      {/* 진행 중 리스트 */}
      <TryList
        title="진행 중인 트라이"
        emptyText="진행 중인 트라이가 없습니다. 새 트라이를 등록해보세요!"
        tries={activeTries} sessions={sessions} participants={participants}
        onSelectTry={setSelectedTryId}
      />

      {/* 클리어 리스트 */}
      {clearedTries.length > 0 && (
        <TryList
          title="🏆 클리어한 트라이"
          emptyText=""
          tries={clearedTries} sessions={sessions} participants={participants}
          onSelectTry={setSelectedTryId}
          collapsedByDefault
        />
      )}

      {/* 모달 */}
      <AnimatePresence>
        {selectedTry && (
          <DetailModal
            key="detail"
            tryItem={selectedTry}
            sessions={selectedSessions}
            participants={selectedParticipants}
            user={user} profile={profile} supabase={supabase}
            onClose={() => setSelectedTryId(null)}
            onEdit={() => { setEditingTry(selectedTry); setShowForm(true); setSelectedTryId(null); }}
            onRefresh={fetchAll}
          />
        )}
        {showForm && (
          <FormModal
            key="form"
            user={user} supabase={supabase}
            editing={editingTry}
            onClose={() => { setShowForm(false); setEditingTry(null); }}
            onSaved={() => { setShowForm(false); setEditingTry(null); fetchAll(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
//  StatBox
// ============================================================
const StatBox: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  <div className="flex items-center gap-3">
    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
         style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(196,181,253,0.55)" }}>{label}</div>
      <div className="text-lg font-bold text-white leading-tight">{value}</div>
    </div>
  </div>
);

// ============================================================
//  CalendarView – 월별 캘린더
// ============================================================
const DAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

const CalendarView: React.FC<{
  tries: TrySchedule[]; sessions: TrySession[]; onSelectTry: (id: string) => void;
}> = ({ tries, sessions, onSelectTry }) => {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const cells: { date: string; day: number; otherMonth: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: "", day: 0, otherMonth: true });
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date: dateStr, day: d, otherMonth: false });
    }
    return cells;
  }, [year, month]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, TrySession[]> = {};
    sessions.forEach(s => {
      if (!s.session_date) return;
      (map[s.session_date] ||= []).push(s);
    });
    return map;
  }, [sessions]);

  const tryMap = useMemo(() => {
    const m: Record<string, TrySchedule> = {};
    tries.forEach(t => { m[t.id] = t; });
    return m;
  }, [tries]);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };
  const goToday   = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  return (
    <div className="rounded-[2rem] overflow-hidden"
         style={{
           background: "linear-gradient(160deg, rgba(28,23,51,0.85) 0%, rgba(15,13,32,0.95) 100%)",
           border: "1px solid rgba(139,92,246,0.16)",
           boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
         }}>
      <div className="flex items-center justify-between px-5 sm:px-6 py-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.10)" }}>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.26em]" style={{ color: "#c4b5fd" }}>
            <CalendarDays size={11} className="inline mr-1 -mt-0.5" />Calendar
          </div>
          <h2 className="text-base font-bold text-white mt-0.5">{year}년 {month + 1}월</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={goToday}
                  className="h-8 px-3 text-[11px] font-semibold rounded-lg transition-all"
                  style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#c4b5fd" }}>
            오늘
          </button>
          <button onClick={prevMonth}
                  className="h-8 w-8 flex items-center justify-center rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#c4b5fd" }}>
            <ChevronLeft size={14} />
          </button>
          <button onClick={nextMonth}
                  className="h-8 w-8 flex items-center justify-center rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#c4b5fd" }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-7 mb-2">
          {DAY_KR.map((d, i) => (
            <div key={d} className="text-center text-[10px] font-semibold py-1"
                 style={{
                   color: i === 0 ? "rgba(248,113,113,0.6)"
                        : i === 6 ? "rgba(96,165,250,0.6)"
                        : "rgba(155,159,196,0.55)",
                 }}>
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {grid.map((cell, idx) => {
            if (cell.otherMonth) return <div key={`empty-${idx}`} className="min-h-[64px] sm:min-h-[88px]" />;
            const daySessions = sessionsByDate[cell.date] || [];
            const isToday = cell.date === todayStr;
            const dayOfWeek = (idx % 7);
            return (
              <div key={cell.date}
                   className="min-h-[64px] sm:min-h-[88px] rounded-xl p-1.5 sm:p-2 flex flex-col gap-1 transition-all"
                   style={{
                     background: isToday ? "rgba(139,92,246,0.10)" : "rgba(255,255,255,0.015)",
                     border: isToday ? "1px solid rgba(167,139,250,0.55)" : "1px solid rgba(255,255,255,0.04)",
                   }}>
                <div className="text-[10px] sm:text-xs font-bold"
                     style={{
                       color: isToday ? "#fde68a"
                            : dayOfWeek === 0 ? "rgba(248,113,113,0.85)"
                            : dayOfWeek === 6 ? "rgba(96,165,250,0.85)"
                            : "rgba(226,232,240,0.75)",
                     }}>
                  {cell.day}
                </div>
                <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                  {daySessions.slice(0, 3).map(s => {
                    const t = tryMap[s.try_id];
                    if (!t) return null;
                    const color = hashColor(t.id);
                    return (
                      <button key={s.id} onClick={() => onSelectTry(t.id)}
                              className="text-left text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate transition-all hover:scale-105"
                              style={{ background: color.bg, color: "#fff", boxShadow: `0 0 8px ${color.glow}` }}
                              title={`${t.raid_name}${s.attempt_note ? ` – ${s.attempt_note}` : ""}`}>
                        {t.raid_name}
                      </button>
                    );
                  })}
                  {daySessions.length > 3 && (
                    <div className="text-[9px] font-semibold pl-1" style={{ color: "rgba(196,181,253,0.65)" }}>
                      +{daySessions.length - 3}개
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {tries.length > 0 && (
          <div className="mt-4 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid rgba(139,92,246,0.08)" }}>
            {tries.filter(t => t.status !== "cleared").slice(0, 8).map(t => {
              const c = hashColor(t.id);
              return (
                <button key={t.id} onClick={() => onSelectTry(t.id)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all hover:scale-105"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: c.bg }} />
                  <span style={{ color: "rgba(226,232,240,0.85)" }}>{t.raid_name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
//  TryList – 카드 그리드
// ============================================================
const TryList: React.FC<{
  title: string;
  emptyText: string;
  tries: TrySchedule[];
  sessions: TrySession[];
  participants: TryParticipant[];
  onSelectTry: (id: string) => void;
  collapsedByDefault?: boolean;
}> = ({ title, emptyText, tries, sessions, participants, onSelectTry, collapsedByDefault }) => {
  const [open, setOpen] = useState(!collapsedByDefault);
  return (
    <div className="rounded-[2rem] overflow-hidden"
         style={{
           background: "linear-gradient(160deg, rgba(28,23,51,0.85) 0%, rgba(15,13,32,0.95) 100%)",
           border: "1px solid rgba(139,92,246,0.16)",
           boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
         }}>
      <button onClick={() => setOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 sm:px-6 py-4 transition-all hover:bg-white/[0.02]"
              style={{ borderBottom: open ? "1px solid rgba(139,92,246,0.10)" : "none" }}>
        <div className="text-left">
          <div className="text-[10px] font-semibold uppercase tracking-[0.26em]" style={{ color: "#c4b5fd" }}>
            {collapsedByDefault ? "Completed" : "Active Tries"}
          </div>
          <h2 className="text-base font-bold text-white mt-0.5">
            {title} <span className="text-[11px] font-medium ml-1" style={{ color: "rgba(196,181,253,0.55)" }}>{tries.length}</span>
          </h2>
        </div>
        <ChevronDown size={18} className="transition-transform"
                     style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "#c4b5fd" }} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
            <div className="p-4 sm:p-5">
              {tries.length === 0 ? (
                <div className="text-center py-10 text-sm" style={{ color: "rgba(155,159,196,0.5)" }}>{emptyText}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {tries.map(t => (
                    <TryCard key={t.id} tryItem={t}
                             sessions={sessions.filter(s => s.try_id === t.id)}
                             participants={participants.filter(p => p.try_id === t.id)}
                             onClick={() => onSelectTry(t.id)} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================
//  TryCard
// ============================================================
const TryCard: React.FC<{
  tryItem: TrySchedule;
  sessions: TrySession[];
  participants: TryParticipant[];
  onClick: () => void;
}> = ({ tryItem, sessions, participants, onClick }) => {
  const today = new Date().toISOString().slice(0, 10);
  const nextSession = useMemo(
    () => sessions.filter(s => s.session_date >= today).sort((a, b) => a.session_date.localeCompare(b.session_date))[0],
    [sessions, today]
  );
  const latestSession = useMemo(
    () => [...sessions].sort((a, b) => b.session_date.localeCompare(a.session_date))[0],
    [sessions]
  );

  const progressPct = Math.round(
    (Math.max(0, tryItem.current_gate - 1) / Math.max(1, tryItem.total_gates)) * 100
  );
  const isCleared = tryItem.status === "cleared";
  const statusColor = STATUS_COLOR[tryItem.status];

  return (
    <motion.button whileHover={{ y: -2 }} transition={{ duration: 0.15 }} onClick={onClick}
                   className="relative text-left rounded-2xl overflow-hidden transition-all"
                   style={{
                     background: "linear-gradient(155deg, rgba(45,27,78,0.5) 0%, rgba(20,16,42,0.85) 100%)",
                     border: `1px solid ${isCleared ? "rgba(52,211,153,0.25)" : "rgba(139,92,246,0.18)"}`,
                     boxShadow: `0 8px 20px rgba(0,0,0,0.18)`,
                   }}>
      <div className="h-1 w-full" style={{ background: statusColor }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${statusColor}1f`, color: statusColor, border: `1px solid ${statusColor}55` }}>
            {isCleared && <Trophy size={9} />}
            {STATUS_LABEL[tryItem.status]}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: "rgba(196,181,253,0.65)" }}>{tryItem.party_size}인</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-white truncate">
          {tryItem.raid_name}
          {tryItem.difficulty && (
            <span className="text-sm font-medium ml-1.5" style={{ color: "#f9a8d4" }}>({tryItem.difficulty})</span>
          )}
        </h3>

        {!isCleared && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold" style={{ color: "rgba(196,181,253,0.7)" }}>
                {tryItem.current_gate}관문 / {tryItem.total_gates}관문
              </span>
              <span className="text-[10px] font-bold" style={{ color: statusColor }}>{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${statusColor}, #c4b5fd)`, boxShadow: `0 0 8px ${statusColor}88` }} />
            </div>
          </div>
        )}

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(226,232,240,0.7)" }}>
            <Users size={11} style={{ color: "#a78bfa" }} />
            <span className="font-semibold">{participants.length}</span>
            <span style={{ color: "rgba(155,159,196,0.55)" }}>/ {tryItem.party_size}명</span>
            {participants.length > 0 && (
              <div className="flex -space-x-1.5 ml-1">
                {participants.slice(0, 4).map(p => (
                  <div key={p.id}
                       className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                       style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "1.5px solid rgba(15,13,32,0.95)" }}
                       title={p.display_name || ""}>
                    {(p.display_name || "?").charAt(0)}
                  </div>
                ))}
                {participants.length > 4 && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                       style={{ background: "rgba(255,255,255,0.08)", color: "#c4b5fd", border: "1.5px solid rgba(15,13,32,0.95)" }}>
                    +{participants.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>

          {nextSession ? (
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(226,232,240,0.7)" }}>
              <Calendar size={11} style={{ color: "#fbbf24" }} />
              <span style={{ color: "#fbbf24" }}>다음:</span>
              <span className="font-semibold">{nextSession.session_date}</span>
              {nextSession.session_time && (
                <span style={{ color: "rgba(155,159,196,0.55)" }}>{nextSession.session_time.slice(0, 5)}</span>
              )}
            </div>
          ) : latestSession ? (
            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(155,159,196,0.55)" }}>
              <Calendar size={11} />
              <span>최근: {latestSession.session_date}</span>
            </div>
          ) : (
            <div className="text-[11px]" style={{ color: "rgba(155,159,196,0.4)" }}>아직 일정이 없습니다</div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

// ============================================================
//  DetailModal
// ============================================================
const DetailModal: React.FC<{
  tryItem: TrySchedule;
  sessions: TrySession[];
  participants: TryParticipant[];
  user: any; profile: any; supabase: any;
  onClose: () => void; onEdit: () => void; onRefresh: () => void;
}> = ({ tryItem, sessions, participants, user, profile, supabase, onClose, onEdit, onRefresh }) => {
  const [tab, setTab] = useState<"participants" | "timeline">("participants");
  const [busy, setBusy] = useState(false);

  const canEdit = !!user && (user.id === tryItem.created_by || isStaff(profile?.role));
  const myParticipation = participants.find(p => p.user_id === user?.id);
  const isFull = participants.length >= tryItem.party_size;

  const handleJoin = async (role: PartyRole) => {
    if (!user || !supabase) return;
    if (isFull && !myParticipation) { alert("슬롯이 모두 찼습니다."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("try_participants").insert({
        try_id: tryItem.id,
        user_id: user.id,
        character_name: profile?.character_name || profile?.display_name || null,
        role,
      });
      if (error) throw error;
      onRefresh();
    } catch (e: any) { alert("참가 신청 실패: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  const handleLeave = async () => {
    if (!myParticipation || !supabase) return;
    if (!confirm("정말 참가를 취소하시겠습니까?")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("try_participants").delete().eq("id", myParticipation.id);
      if (error) throw error;
      onRefresh();
    } catch (e: any) { alert("취소 실패: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  const handleKick = async (participantId: string) => {
    if (!canEdit || !supabase) return;
    if (!confirm("이 참가자를 제거하시겠습니까?")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("try_participants").delete().eq("id", participantId);
      if (error) throw error;
      onRefresh();
    } catch (e: any) { alert("제거 실패: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  const handleStatusChange = async (newStatus: "active" | "paused" | "cleared") => {
    if (!canEdit || !supabase) return;
    setBusy(true);
    try {
      const payload: any = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === "cleared") payload.cleared_date = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from("try_schedules").update(payload).eq("id", tryItem.id);
      if (error) throw error;
      onRefresh();
    } catch (e: any) { alert("상태 변경 실패: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  const handleDeleteTry = async () => {
    if (!canEdit || !supabase) return;
    if (!confirm("정말 이 트라이를 삭제하시겠습니까? 모든 일정/참가자 정보가 함께 삭제됩니다.")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("try_schedules").delete().eq("id", tryItem.id);
      if (error) throw error;
      onClose();
      onRefresh();
    } catch (e: any) { alert("삭제 실패: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  const statusColor = STATUS_COLOR[tryItem.status];
  const sortedSessions = [...sessions].sort((a, b) => b.session_date.localeCompare(a.session_date));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(8,5,20,0.78)", backdropFilter: "blur(8px)" }}
                onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.18 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl flex flex-col"
                  style={{
                    background: "linear-gradient(160deg, rgba(28,23,51,0.98) 0%, rgba(15,13,32,1) 100%)",
                    border: "1px solid rgba(139,92,246,0.22)",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                  }}>
        <div className="h-1 w-full shrink-0" style={{ background: statusColor }} />

        <div className="px-6 py-5 flex items-start justify-between gap-4 shrink-0" style={{ borderBottom: "1px solid rgba(139,92,246,0.10)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: `${statusColor}1f`, color: statusColor, border: `1px solid ${statusColor}55` }}>
                {STATUS_LABEL[tryItem.status]}
              </span>
              <span className="text-[10px] font-semibold" style={{ color: "rgba(196,181,253,0.55)" }}>
                {tryItem.party_size}인 · 등록: {tryItem.created_by_name || "익명"}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {tryItem.raid_name}
              {tryItem.difficulty && <span className="text-base font-medium ml-2" style={{ color: "#f9a8d4" }}>({tryItem.difficulty})</span>}
            </h2>
            {tryItem.description && (
              <p className="mt-2 text-sm whitespace-pre-wrap" style={{ color: "rgba(226,232,240,0.7)" }}>{tryItem.description}</p>
            )}
            {tryItem.status !== "cleared" && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(196,181,253,0.75)" }}>
                    {tryItem.current_gate}관문 진행 중 · 총 {tryItem.total_gates}관문
                  </span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full"
                       style={{
                         width: `${Math.round((Math.max(0, tryItem.current_gate - 1) / Math.max(1, tryItem.total_gates)) * 100)}%`,
                         background: `linear-gradient(90deg, ${statusColor}, #c4b5fd)`,
                         boxShadow: `0 0 10px ${statusColor}88`,
                       }} />
                </div>
              </div>
            )}
          </div>
          <button onClick={onClose}
                  className="h-9 w-9 flex items-center justify-center rounded-xl transition-all shrink-0"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#c4b5fd" }}>
            <X size={16} />
          </button>
        </div>

        {canEdit && (
          <div className="px-6 py-2.5 flex items-center gap-2 flex-wrap shrink-0"
               style={{ background: "rgba(139,92,246,0.06)", borderBottom: "1px solid rgba(139,92,246,0.10)" }}>
            <button onClick={onEdit} disabled={busy}
                    className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "#c4b5fd" }}>
              <Edit3 size={12} /> 정보 수정
            </button>
            {tryItem.status !== "cleared" ? (
              <>
                {tryItem.status === "active" ? (
                  <button onClick={() => handleStatusChange("paused")} disabled={busy}
                          className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                          style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)", color: "#fbbf24" }}>
                    <Pause size={12} /> 잠시 중단
                  </button>
                ) : (
                  <button onClick={() => handleStatusChange("active")} disabled={busy}
                          className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                          style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
                    <Play size={12} /> 재개
                  </button>
                )}
                <button onClick={() => handleStatusChange("cleared")} disabled={busy}
                        className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                        style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.35)", color: "#34d399" }}>
                  <Trophy size={12} /> 클리어!
                </button>
              </>
            ) : (
              <button onClick={() => handleStatusChange("active")} disabled={busy}
                      className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                      style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
                <Play size={12} /> 다시 진행 중으로
              </button>
            )}
            <button onClick={handleDeleteTry} disabled={busy}
                    className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 ml-auto"
                    style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.30)", color: "#f87171" }}>
              <Trash2 size={12} /> 트라이 삭제
            </button>
          </div>
        )}

        <div className="px-6 flex items-center gap-1 shrink-0" style={{ borderBottom: "1px solid rgba(139,92,246,0.10)" }}>
          {([
            { id: "participants" as const, label: `참가자 (${participants.length}/${tryItem.party_size})`, icon: <Users size={13} /> },
            { id: "timeline" as const,     label: `타임라인 (${sessions.length})`, icon: <Clock size={13} /> },
          ]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
                    className="relative flex items-center gap-1.5 py-3 px-3 text-[12px] font-semibold transition-colors"
                    style={{ color: tab === t.id ? "#fde68a" : "rgba(196,181,253,0.55)" }}>
              {t.icon}{t.label}
              {tab === t.id && (
                <motion.div layoutId="try-tab-underline"
                            className="absolute -bottom-px left-0 right-0 h-[2px]"
                            style={{ background: "linear-gradient(90deg, #fbbf24, #a78bfa)" }} />
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "participants" && (
            <ParticipantsTab participants={participants} partySize={tryItem.party_size}
                             myParticipation={myParticipation} canEdit={canEdit}
                             isCleared={tryItem.status === "cleared"} user={user} busy={busy}
                             onJoin={handleJoin} onLeave={handleLeave} onKick={handleKick} />
          )}
          {tab === "timeline" && (
            <TimelineTab tryItem={tryItem} sessions={sortedSessions} user={user}
                         supabase={supabase} busy={busy} setBusy={setBusy}
                         onRefresh={onRefresh} canEdit={canEdit} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================
//  ParticipantsTab
// ============================================================
const ParticipantsTab: React.FC<{
  participants: TryParticipant[]; partySize: number;
  myParticipation: TryParticipant | undefined;
  canEdit: boolean; isCleared: boolean; user: any; busy: boolean;
  onJoin: (role: PartyRole) => void; onLeave: () => void; onKick: (id: string) => void;
}> = ({ participants, partySize, myParticipation, canEdit, isCleared, user, busy, onJoin, onLeave, onKick }) => {
  const slots = Array.from({ length: partySize }, (_, i) => participants[i] || null);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slots.map((p, idx) => (
          <div key={p?.id || `empty-${idx}`}
               className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
               style={{
                 background: p ? "rgba(167,139,250,0.08)" : "rgba(255,255,255,0.02)",
                 border: p ? "1px solid rgba(167,139,250,0.25)" : "1px dashed rgba(255,255,255,0.08)",
               }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                 style={{
                   background: p ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "rgba(255,255,255,0.04)",
                   color: p ? "#fff" : "rgba(155,159,196,0.4)",
                 }}>
              {p ? (p.display_name || "?").charAt(0) : idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              {p ? (
                <>
                  <div className="text-sm font-semibold text-white truncate">
                    {p.character_name || p.display_name || "익명"}
                  </div>
                  <div className="text-[10px] font-semibold" style={{ color: p.role === "서포터" ? "#7dd3fc" : "#fca5a5" }}>
                    {p.role || "역할 미지정"}
                  </div>
                </>
              ) : (
                <div className="text-[11px]" style={{ color: "rgba(155,159,196,0.4)" }}>비어 있음</div>
              )}
            </div>
            {p && canEdit && p.user_id !== user?.id && (
              <button onClick={() => onKick(p.id)} disabled={busy}
                      className="h-7 w-7 flex items-center justify-center rounded-lg transition-all opacity-60 hover:opacity-100 disabled:opacity-30"
                      style={{ background: "rgba(248,113,113,0.10)", color: "#f87171" }}
                      title="강제 제거">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!isCleared && user && (
        <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(139,92,246,0.10)" }}>
          {myParticipation ? (
            <button onClick={onLeave} disabled={busy}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                    style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.30)", color: "#f87171" }}>
              <UserMinus size={14} /> 참가 취소 ({myParticipation.role || "역할 없음"})
            </button>
          ) : (
            <div>
              <div className="text-[11px] font-semibold mb-2" style={{ color: "rgba(196,181,253,0.7)" }}>
                참가할 역할을 선택하세요
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(role => (
                  <button key={role} onClick={() => onJoin(role)}
                          disabled={busy || participants.length >= partySize}
                          className="h-11 flex items-center justify-center gap-2 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
                          style={{
                            background: role === "서포터"
                              ? "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)"
                              : "linear-gradient(135deg, #f87171 0%, #dc2626 100%)",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
                          }}>
                    <UserPlus size={14} /> {role}로 참가
                  </button>
                ))}
              </div>
              {participants.length >= partySize && (
                <div className="mt-2 text-center text-[11px]" style={{ color: "#fbbf24" }}>슬롯이 모두 찼습니다</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
//  TimelineTab
// ============================================================
const TimelineTab: React.FC<{
  tryItem: TrySchedule; sessions: TrySession[]; user: any; supabase: any;
  busy: boolean; setBusy: (b: boolean) => void; onRefresh: () => void; canEdit: boolean;
}> = ({ tryItem, sessions, user, supabase, busy, setBusy, onRefresh, canEdit }) => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = async () => {
    if (!user || !supabase) return;
    if (!date) { alert("날짜를 입력해주세요"); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from("try_sessions").insert({
        try_id: tryItem.id,
        session_date: date,
        session_time: time || null,
        attempt_note: note.trim() || null,
        created_by: user.id,
      });
      if (error) throw error;
      setNote(""); setTime("");
      onRefresh();
    } catch (e: any) { alert("일정 추가 실패: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  const handleDeleteSession = async (id: string, ownerId: string) => {
    if (!supabase) return;
    if (user?.id !== ownerId && !canEdit) {
      alert("본인이 등록한 일정만 삭제할 수 있습니다."); return;
    }
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("try_sessions").delete().eq("id", id);
      if (error) throw error;
      onRefresh();
    } catch (e: any) { alert("삭제 실패: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      {user && (
        <div className="rounded-xl p-4"
             style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.18)" }}>
          <div className="text-[11px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#c4b5fd" }}>
            <Plus size={11} /> 새 일정 / 진행도 기록 추가
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-[10px] mb-0.5" style={{ color: "rgba(196,181,253,0.6)" }}>날짜</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                     className="w-full h-9 px-2.5 rounded-lg text-xs text-white"
                     style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.10)" }} />
            </div>
            <div>
              <label className="block text-[10px] mb-0.5" style={{ color: "rgba(196,181,253,0.6)" }}>시간 (선택)</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                     className="w-full h-9 px-2.5 rounded-lg text-xs text-white"
                     style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.10)" }} />
            </div>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="예: 3관문 첫 진입 / 카탈리스트 잡음 / 2넴 50% 도달 등"
                    rows={2}
                    className="w-full px-2.5 py-2 rounded-lg text-xs text-white resize-none"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.10)" }} />
          <button onClick={handleAdd} disabled={busy || !date}
                  className="mt-2 h-9 px-4 flex items-center gap-1.5 rounded-lg font-semibold text-xs text-white transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", boxShadow: "0 4px 12px rgba(139,92,246,0.35)" }}>
            <Plus size={12} /> 기록 추가
          </button>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: "rgba(155,159,196,0.45)" }}>
          아직 기록된 일정이 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, idx) => {
            const isToday = s.session_date === todayStr;
            const isPast = s.session_date < todayStr;
            const canDelete = s.created_by === user?.id || canEdit;
            return (
              <div key={s.id} className="relative pl-6 pb-4"
                   style={{ borderLeft: idx < sessions.length - 1 ? "2px solid rgba(139,92,246,0.15)" : "2px solid transparent" }}>
                <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full"
                     style={{
                       background: isToday ? "#fbbf24" : isPast ? "#a78bfa" : "#34d399",
                       boxShadow: `0 0 8px ${isToday ? "rgba(251,191,36,0.6)" : isPast ? "rgba(167,139,250,0.5)" : "rgba(52,211,153,0.5)"}`,
                     }} />
                <div className="rounded-xl px-3.5 py-2.5 group"
                     style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: isToday ? "#fde68a" : "#fff" }}>{s.session_date}</span>
                      {s.session_time && (
                        <span className="text-[10px] font-semibold" style={{ color: "rgba(196,181,253,0.6)" }}>
                          {s.session_time.slice(0, 5)}
                        </span>
                      )}
                      {isToday && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                          오늘
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: "rgba(155,159,196,0.45)" }}>{s.created_by_name}</span>
                      {canDelete && (
                        <button onClick={() => handleDeleteSession(s.id, s.created_by)} disabled={busy}
                                className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-md transition-all"
                                style={{ background: "rgba(248,113,113,0.10)", color: "#f87171" }}
                                title="삭제">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  {s.attempt_note ? (
                    <div className="text-sm whitespace-pre-wrap flex items-start gap-1.5" style={{ color: "rgba(226,232,240,0.85)" }}>
                      <MessageSquare size={11} className="mt-1 shrink-0" style={{ color: "#a78bfa" }} />
                      {s.attempt_note}
                    </div>
                  ) : (
                    <div className="text-xs" style={{ color: "rgba(155,159,196,0.45)" }}>메모 없음</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
//  FormModal (등록/수정)
// ============================================================
const FormModal: React.FC<{
  user: any; supabase: any;
  editing: TrySchedule | null;
  onClose: () => void; onSaved: () => void;
}> = ({ user, supabase, editing, onClose, onSaved }) => {
  const [raidName, setRaidName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [partySize, setPartySize] = useState<number>(8);
  const [totalGates, setTotalGates] = useState<number>(4);
  const [currentGate, setCurrentGate] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing) {
      setRaidName(editing.raid_name);
      setDifficulty(editing.difficulty || "");
      setPartySize(editing.party_size);
      setTotalGates(editing.total_gates);
      setCurrentGate(editing.current_gate);
      setStartDate(editing.start_date || "");
      setDescription(editing.description || "");
    } else {
      setStartDate(new Date().toISOString().slice(0, 10));
    }
  }, [editing]);

  const handleSubmit = async () => {
    if (!user || !supabase) return;
    if (!raidName.trim()) { alert("레이드 이름을 입력해주세요"); return; }
    if (currentGate < 1 || currentGate > totalGates) {
      alert("현재 관문은 1부터 총 관문 수 이하여야 합니다."); return;
    }
    setBusy(true);
    try {
      const payload = {
        raid_name: raidName.trim(),
        difficulty: difficulty || null,
        party_size: partySize,
        total_gates: totalGates,
        current_gate: currentGate,
        start_date: startDate || null,
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (editing) {
        const { error } = await supabase.from("try_schedules").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("try_schedules").insert({
          ...payload, created_by: user.id, status: "active",
        });
        if (error) throw error;
      }
      onSaved();
    } catch (e: any) { alert("저장 실패: " + (e.message || e)); }
    finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: "rgba(8,5,20,0.78)", backdropFilter: "blur(8px)" }}
                onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.18 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-3xl flex flex-col"
                  style={{
                    background: "linear-gradient(160deg, rgba(28,23,51,0.98) 0%, rgba(15,13,32,1) 100%)",
                    border: "1px solid rgba(139,92,246,0.22)",
                    boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                  }}>
        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid rgba(139,92,246,0.10)" }}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "#fff" }}>
              <Swords size={16} />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.26em]" style={{ color: "#c4b5fd" }}>
                {editing ? "Edit" : "New"}
              </div>
              <h2 className="text-base font-bold text-white">
                {editing ? "트라이 정보 수정" : "새 트라이 등록"}
              </h2>
            </div>
          </div>
          <button onClick={onClose}
                  className="h-9 w-9 flex items-center justify-center rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#c4b5fd" }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="레이드 이름 *">
            <input type="text" value={raidName} onChange={(e) => setRaidName(e.target.value)}
                   placeholder="예: 에키드나, 카멘, 모르둠..."
                   className="w-full h-10 px-3 rounded-lg text-sm text-white"
                   style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.10)" }} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="난이도">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | "")}
                      className="w-full h-10 px-3 rounded-lg text-sm text-white"
                      style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <option value="">선택 안함</option>
                {DIFFICULTY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="인원 수">
              <div className="grid grid-cols-2 gap-2">
                {PARTY_SIZE_OPTIONS.map(n => (
                  <button key={n} onClick={() => setPartySize(n)}
                          className="h-10 rounded-lg text-sm font-semibold transition-all"
                          style={{
                            background: partySize === n ? "linear-gradient(135deg, #8b5cf6, #7c3aed)" : "rgba(0,0,0,0.3)",
                            border: partySize === n ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.10)",
                            color: "#fff",
                          }}>
                    {n}인
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="총 관문 수">
              <input type="number" min={1} max={20} value={totalGates}
                     onChange={(e) => setTotalGates(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                     className="w-full h-10 px-3 rounded-lg text-sm text-white"
                     style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.10)" }} />
            </Field>
            <Field label="현재 진행 관문">
              <input type="number" min={1} max={totalGates} value={currentGate}
                     onChange={(e) => setCurrentGate(Math.max(1, Math.min(totalGates, Number(e.target.value) || 1)))}
                     className="w-full h-10 px-3 rounded-lg text-sm text-white"
                     style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.10)" }} />
            </Field>
          </div>

          <Field label="트라이 시작일">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                   className="w-full h-10 px-3 rounded-lg text-sm text-white"
                   style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.10)" }} />
          </Field>

          <Field label="공략 메모 (선택)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="공략 포인트, 주의사항, 사전 준비물 등..."
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none"
                      style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.10)" }} />
          </Field>
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-2 shrink-0" style={{ borderTop: "1px solid rgba(139,92,246,0.10)" }}>
          <button onClick={onClose} disabled={busy}
                  className="h-10 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "#c4b5fd" }}>
            취소
          </button>
          <button onClick={handleSubmit} disabled={busy || !raidName.trim()}
                  className="h-10 px-5 flex items-center gap-1.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", boxShadow: "0 6px 18px rgba(139,92,246,0.35)" }}>
            <Save size={14} /> {editing ? "수정 저장" : "등록하기"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "rgba(196,181,253,0.7)" }}>{label}</label>
    {children}
  </div>
);
