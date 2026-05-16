import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shuffle,
  Users,
  RefreshCw,
  Search,
  Check,
  Sparkles,
  AlertCircle,
  Save,
  History,
  Copy,
  Trash2,
  X,
  Clock,
  Send,           // ← 추가
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Member = {
  id: string;
  nickname: string | null;
  role: string | null;
};

type Team = Member[];

type SavedResult = {
  id: string;
  created_by: string | null;
  creator_name: string | null;
  teams: string[][];
  waiting: string[];
  options: { team_size?: number; team_count?: number };
  created_at: string;
};

type Props = {
  user?: any;
  profile?: any;
  supabase: any;
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getDisplayName = (m: Member) =>
  (m.nickname && m.nickname.trim()) || "이름없음";

const formatRelativeTime = (iso: string): string => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
};

const TEAM_PALETTE = [
  { from: "#a78bfa", to: "#7c3aed", glow: "rgba(139,92,246,0.35)" },
  { from: "#f9a8d4", to: "#db2777", glow: "rgba(219,39,119,0.30)" },
  { from: "#fcd34d", to: "#f59e0b", glow: "rgba(245,158,11,0.30)" },
  { from: "#6ee7b7", to: "#10b981", glow: "rgba(16,185,129,0.30)" },
  { from: "#67e8f9", to: "#0891b2", glow: "rgba(8,145,178,0.30)" },
  { from: "#fda4af", to: "#e11d48", glow: "rgba(225,29,72,0.30)" },
];

const CARD_STYLE: React.CSSProperties = {
  background:
    "linear-gradient(160deg, rgba(28,23,51,0.85) 0%, rgba(15,13,32,0.95) 100%)",
  border: "1px solid rgba(139,92,246,0.16)",
  boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
};

const ROLL_TICK_MS = 70;
const REVEAL_FIRST_DELAY_MS = 600;
const REVEAL_STEP_MS = 220;

// ─────────────────────────────────────────────────────────────
// Stepper
// ─────────────────────────────────────────────────────────────
const Stepper = ({
  label,
  value,
  setValue,
  min = 1,
  max = 99,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min?: number;
  max?: number;
}) => {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2"
        style={{ color: "#c4b5fd" }}
      >
        {label}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setValue(clamp(value - 1))}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold transition-all hover:bg-white/10"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          −
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(clamp(Number(e.target.value) || min))}
          className="flex-1 text-center text-lg font-bold text-white bg-transparent focus:outline-none"
          min={min}
          max={max}
        />
        <button
          onClick={() => setValue(clamp(value + 1))}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold transition-all hover:bg-white/10"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function TeamPicker({ user, profile, supabase }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const [teamSize, setTeamSize] = useState(3);
  const [teamCount, setTeamCount] = useState(3);

  const [teams, setTeams] = useState<Team[]>([]);
  const [waiting, setWaiting] = useState<Member[]>([]);

  const [rolling, setRolling] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [rollTick, setRollTick] = useState(0);
  const rollTimerRef = useRef<number | null>(null);
  const revealTimersRef = useRef<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [savedThisResult, setSavedThisResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<SavedResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── 디스코드 전송 상태 ─────────────────────── (추가)
  const [sending, setSending] = useState(false);
  const [sentToDiscord, setSentToDiscord] = useState(false);

  const isLoggedIn = !!user?.id;

  // ── 길드원 fetch ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchMembers = async () => {
      if (!supabase) {
        setError("Supabase가 초기화되지 않았습니다.");
        setLoading(false);
        return;
      }
      try {
        const { data, error: err } = await supabase
          .from("profiles")
          .select("id, nickname, role")
          .order("nickname", { ascending: true });
        if (err) throw err;
        if (!cancelled) {
          setMembers((data as Member[]) || []);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled)
          setError(e?.message || "길드원 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchMembers();
    return () => { cancelled = true; };
  }, [supabase]);

  // ── 히스토리 fetch ────────────────────────────
  const fetchHistory = async () => {
    if (!supabase) return;
    setHistoryLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("team_picker_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (err) throw err;
      setHistory((data as SavedResult[]) || []);
    } catch (e: any) {
      console.error("history fetch failed:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current) window.clearInterval(rollTimerRef.current);
      revealTimersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  // ── 파생 상태 ────────────────────────────────
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      getDisplayName(m).toLowerCase().includes(q)
    );
  }, [members, search]);

  const selectedMembers = useMemo(
    () => members.filter((m) => selectedIds.has(m.id)),
    [members, selectedIds]
  );

  const requiredSlots = teamSize * teamCount;
  const selectedCount = selectedIds.size;
  const canPick =
    selectedCount >= requiredSlots && requiredSlots > 0 && !rolling;

  const totalSlots = teams.reduce((s, t) => s + t.length, 0);
  const allRevealed = totalSlots > 0 && revealedCount >= totalSlots;

  // ── 선택 핸들러 ──────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredMembers.forEach((m) => next.add(m.id));
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  // ── 뽑기 ────────────────────────────────────
  const doPick = () => {
    if (!canPick) return;

    const shuffled = shuffle(selectedMembers);
    const newTeams: Team[] = [];
    for (let i = 0; i < teamCount; i++) {
      const start = i * teamSize;
      newTeams.push(shuffled.slice(start, start + teamSize));
    }
    const leftover = shuffled.slice(teamCount * teamSize);

    if (rollTimerRef.current) window.clearInterval(rollTimerRef.current);
    revealTimersRef.current.forEach((t) => window.clearTimeout(t));
    revealTimersRef.current = [];

    setTeams(newTeams);
    setWaiting(leftover);
    setRevealedCount(0);
    setSavedThisResult(false);
    setSentToDiscord(false); // ← 다시 뽑으면 전송 상태 초기화
    setRolling(true);

    rollTimerRef.current = window.setInterval(() => {
      setRollTick((t) => t + 1);
    }, ROLL_TICK_MS);

    const total = newTeams.reduce((s, t) => s + t.length, 0);
    for (let i = 0; i < total; i++) {
      const t = window.setTimeout(() => {
        setRevealedCount((c) => c + 1);
      }, REVEAL_FIRST_DELAY_MS + i * REVEAL_STEP_MS);
      revealTimersRef.current.push(t);
    }
    const finalTimer = window.setTimeout(() => {
      if (rollTimerRef.current) {
        window.clearInterval(rollTimerRef.current);
        rollTimerRef.current = null;
      }
      setRolling(false);
    }, REVEAL_FIRST_DELAY_MS + total * REVEAL_STEP_MS + 100);
    revealTimersRef.current.push(finalTimer);
  };

  const reset = () => {
    if (rollTimerRef.current) window.clearInterval(rollTimerRef.current);
    revealTimersRef.current.forEach((t) => window.clearTimeout(t));
    revealTimersRef.current = [];
    rollTimerRef.current = null;
    setTeams([]);
    setWaiting([]);
    setRevealedCount(0);
    setRolling(false);
    setSavedThisResult(false);
    setSentToDiscord(false); // ← 초기화
  };

  const getSlotDisplay = (teamIdx: number, memberIdx: number): string => {
    const member = teams[teamIdx]?.[memberIdx];
    if (!member) return "?";
    let globalIdx = memberIdx;
    for (let i = 0; i < teamIdx; i++) globalIdx += teams[i].length;
    const isLocked = globalIdx < revealedCount;
    if (isLocked) return getDisplayName(member);
    const pool = selectedMembers.length > 0 ? selectedMembers : members;
    if (pool.length === 0) return "?";
    const r = Math.floor(Math.random() * pool.length);
    return getDisplayName(pool[r]) || "?";
  };

  // ── 결과 저장 ────────────────────────────────
  const saveResult = async () => {
    if (!supabase || !isLoggedIn) {
      setToast("로그인이 필요합니다");
      return;
    }
    if (teams.length === 0 || !allRevealed) return;
    setSaving(true);
    try {
      const payload = {
        created_by: user.id,
        creator_name: profile?.nickname || profile?.character_name || "익명",
        teams: teams.map((t) => t.map((m) => getDisplayName(m))),
        waiting: waiting.map((m) => getDisplayName(m)),
        options: { team_size: teamSize, team_count: teamCount },
      };
      const { error: err } = await supabase
        .from("team_picker_results")
        .insert(payload);
      if (err) throw err;
      setSavedThisResult(true);
      setToast("결과를 저장했습니다");
      fetchHistory();
    } catch (e: any) {
      setToast(`저장 실패: ${e?.message || "오류"}`);
    } finally {
      setSaving(false);
    }
  };

  // ── 디스코드로 보내기 ────────────────────────── (추가)
  const sendToDiscord = async () => {
    if (teams.length === 0 || !allRevealed || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/discord-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teams: teams.map((t) => t.map((m) => getDisplayName(m))),
          waiting: waiting.map((m) => getDisplayName(m)),
          options: { team_size: teamSize, team_count: teamCount },
          creator_name:
            profile?.nickname || profile?.character_name || "익명",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setSentToDiscord(true);
      setToast("디스코드 채널로 전송했습니다 🎉");
    } catch (e: any) {
      setToast(`전송 실패: ${e?.message || "오류"}`);
    } finally {
      setSending(false);
    }
  };

  // ── 디스코드용 텍스트 복사 ───────────────────
  const copyResultText = async () => {
    if (teams.length === 0) return;
    const lines: string[] = ["🎲 **팀원 뽑기 결과**", ""];
    teams.forEach((team, i) => {
      lines.push(
        `**팀 ${i + 1}** — ${team.map((m) => getDisplayName(m)).join(", ")}`
      );
    });
    if (waiting.length > 0) {
      lines.push("");
      lines.push(`🪑 대기: ${waiting.map((m) => getDisplayName(m)).join(", ")}`);
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setToast("디스코드용 텍스트를 복사했습니다");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setToast("복사 실패 - 브라우저 권한을 확인해주세요");
    }
  };

  // ── 히스토리 항목 삭제 ───────────────────────
  const deleteHistory = async (id: string) => {
    if (!supabase) return;
    if (!window.confirm("이 결과를 삭제할까요?")) return;
    try {
      const { error: err } = await supabase
        .from("team_picker_results")
        .delete()
        .eq("id", id);
      if (err) throw err;
      setHistory((prev) => prev.filter((h) => h.id !== id));
      setToast("삭제됨");
    } catch (e: any) {
      setToast(`삭제 실패: ${e?.message || "오류"}`);
    }
  };

  const _ = rollTick;

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 relative">
      {/* 토스트 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(167,139,250,0.85))",
              boxShadow: "0 12px 32px rgba(124,58,237,0.4)",
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 헤더 + 설정 ───────────────────────────── */}
      <div className="rounded-[2rem] overflow-hidden" style={CARD_STYLE}>
        <div
          className="px-6 py-5 flex items-center justify-between gap-3 flex-wrap"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.10)" }}
        >
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.26em]"
              style={{ color: "#c4b5fd" }}
            >
              Team Picker
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              팀원 랜덤 뽑기
            </h2>
            <p
              className="text-xs mt-1"
              style={{ color: "rgba(155,159,196,0.65)" }}
            >
              길드원을 선택하고 팀 인원 / 팀 개수를 정한 뒤 뽑기를 누르세요.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] transition-all"
            >
              <History size={14} />
              히스토리
            </button>
            <Sparkles size={24} style={{ color: "#a78bfa" }} />
          </div>
        </div>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stepper label="팀당 인원" value={teamSize} setValue={setTeamSize} min={1} max={20} />
          <Stepper label="팀 개수" value={teamCount} setValue={setTeamCount} min={1} max={20} />
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2"
              style={{ color: "#c4b5fd" }}
            >
              현황
            </div>
            <div className="text-sm text-white">
              필요 인원{" "}
              <span className="font-bold" style={{ color: "#a78bfa" }}>
                {requiredSlots}
              </span>
              명
            </div>
            <div className="text-sm text-white mt-1">
              선택됨{" "}
              <span
                className="font-bold"
                style={{
                  color: selectedCount >= requiredSlots ? "#6ee7b7" : "#fda4af",
                }}
              >
                {selectedCount}
              </span>
              명
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={doPick}
            disabled={!canPick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canPick
                ? "linear-gradient(135deg, #a78bfa, #7c3aed)"
                : "rgba(255,255,255,0.05)",
              color: "#fff",
              boxShadow: canPick ? "0 8px 24px rgba(124,58,237,0.35)" : "none",
            }}
          >
            <Shuffle size={16} className={rolling ? "animate-spin" : ""} />
            {rolling ? "뽑는 중..." : "뽑기"}
          </button>

          {teams.length > 0 && !rolling && (
            <>
              <button
                onClick={doPick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] transition-all"
              >
                <RefreshCw size={14} />
                다시 뽑기
              </button>
              <button
                onClick={reset}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white transition-all"
              >
                결과 초기화
              </button>
            </>
          )}

          {!canPick && selectedCount > 0 && !rolling && (
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "#fda4af" }}
            >
              <AlertCircle size={14} />
              {requiredSlots - selectedCount}명 더 선택해 주세요.
            </div>
          )}
        </div>
      </div>

      {/* ── 결과 카드 (슬롯머신) ──────────────────── */}
      <AnimatePresence mode="wait">
        {teams.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-[2rem] overflow-hidden"
            style={CARD_STYLE}
          >
            <div
              className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap"
              style={{ borderBottom: "1px solid rgba(139,92,246,0.10)" }}
            >
              <div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.26em]"
                  style={{ color: "#c4b5fd" }}
                >
                  {rolling ? "Rolling..." : "Result"}
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {rolling ? "뽑는 중" : "뽑기 결과"}
                </h3>
              </div>

              {allRevealed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 flex-wrap"
                >
                  {/* 복사 버튼 */}
                  <button
                    onClick={copyResultText}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] transition-all"
                    title="디스코드에 붙여넣기용 텍스트로 복사"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "복사됨" : "복사"}
                  </button>

                  {/* ── 디스코드로 보내기 버튼 (추가) ── */}
                  <button
                    onClick={sendToDiscord}
                    disabled={sending || sentToDiscord}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: sentToDiscord
                        ? "rgba(110,231,183,0.15)"
                        : "linear-gradient(135deg, rgba(88,101,242,0.25), rgba(88,101,242,0.15))",
                      border: sentToDiscord
                        ? "1px solid rgba(110,231,183,0.4)"
                        : "1px solid rgba(88,101,242,0.5)",
                      color: sentToDiscord ? "#6ee7b7" : "#fff",
                    }}
                    title="팀 결과를 디스코드 채널로 전송"
                  >
                    {sentToDiscord ? (
                      <Check size={12} />
                    ) : (
                      <Send size={12} className={sending ? "animate-pulse" : ""} />
                    )}
                    {sending ? "전송 중..." : sentToDiscord ? "전송됨" : "디스코드로 보내기"}
                  </button>

                  {/* 저장 버튼 */}
                  <button
                    onClick={saveResult}
                    disabled={saving || savedThisResult || !isLoggedIn}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: savedThisResult
                        ? "rgba(110,231,183,0.15)"
                        : "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(124,58,237,0.15))",
                      border: savedThisResult
                        ? "1px solid rgba(110,231,183,0.4)"
                        : "1px solid rgba(167,139,250,0.4)",
                      color: savedThisResult ? "#6ee7b7" : "#fff",
                    }}
                    title={isLoggedIn ? "히스토리에 저장" : "로그인 필요"}
                  >
                    {savedThisResult ? <Check size={12} /> : <Save size={12} />}
                    {saving ? "저장 중" : savedThisResult ? "저장됨" : "저장"}
                  </button>
                </motion.div>
              )}
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team, idx) => {
                const palette = TEAM_PALETTE[idx % TEAM_PALETTE.length];
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                    className="rounded-2xl p-4"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      boxShadow: `0 0 24px ${palette.glow}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider"
                        style={{
                          background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                          color: "#fff",
                        }}
                      >
                        Team {idx + 1}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: "rgba(155,159,196,0.55)" }}
                      >
                        {team.length}명
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {team.map((_member, mi) => {
                        let globalIdx = mi;
                        for (let i = 0; i < idx; i++)
                          globalIdx += teams[i].length;
                        const isLocked = globalIdx < revealedCount;
                        const display = getSlotDisplay(idx, mi);
                        const justLocked =
                          isLocked && globalIdx === revealedCount - 1;
                        return (
                          <motion.div
                            key={mi}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              scale: justLocked ? [1, 1.06, 1] : 1,
                            }}
                            transition={{
                              duration: 0.25,
                              delay: idx * 0.08 + mi * 0.05 + 0.15,
                              scale: { duration: 0.4 },
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{
                              background: isLocked
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(255,255,255,0.02)",
                              border: isLocked
                                ? "1px solid rgba(167,139,250,0.25)"
                                : "1px dashed rgba(255,255,255,0.08)",
                              transition: "all 0.2s",
                            }}
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                              style={{
                                background: isLocked
                                  ? `linear-gradient(135deg, ${palette.from}, ${palette.to})`
                                  : "rgba(255,255,255,0.08)",
                                color: "#fff",
                                opacity: isLocked ? 1 : 0.5,
                              }}
                            >
                              {mi + 1}
                            </div>
                            <div
                              className="text-sm font-medium truncate flex-1"
                              style={{
                                color: isLocked ? "#fff" : "rgba(167,139,250,0.6)",
                                fontFamily: isLocked ? "inherit" : "monospace",
                              }}
                            >
                              {display}
                            </div>
                            {!isLocked && rolling && (
                              <span
                                className="text-[9px] uppercase tracking-wider shrink-0"
                                style={{ color: "rgba(167,139,250,0.5)" }}
                              >
                                rolling
                              </span>
                            )}
                            {justLocked && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs shrink-0"
                              >
                                ✨
                              </motion.span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {waiting.length > 0 && allRevealed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="px-6 pb-6"
              >
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px dashed rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2"
                    style={{ color: "rgba(155,159,196,0.7)" }}
                  >
                    대기 명단 ({waiting.length}명)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {waiting.map((m) => (
                      <span
                        key={m.id}
                        className="px-2.5 py-1 rounded-lg text-xs text-slate-300"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {getDisplayName(m)}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 길드원 선택 카드 ───────────────────────── */}
      <div className="rounded-[2rem] overflow-hidden" style={CARD_STYLE}>
        <div
          className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.10)" }}
        >
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: "#c4b5fd" }} />
            <h3 className="text-base font-bold text-white">길드원 선택</h3>
            <span className="text-xs" style={{ color: "rgba(155,159,196,0.55)" }}>
              ({selectedCount}/{members.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={selectAllFiltered}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06] transition-all"
            >
              필터 전체 선택
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white transition-all"
            >
              선택 해제
            </button>
          </div>
        </div>

        <div className="px-6 pt-4">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "rgba(155,159,196,0.5)" }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="닉네임 검색"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-10 text-sm" style={{ color: "rgba(155,159,196,0.5)" }}>
              길드원 목록을 불러오는 중...
            </div>
          ) : error ? (
            <div className="text-center py-10 text-sm" style={{ color: "#fda4af" }}>
              {error}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-10 text-sm" style={{ color: "rgba(155,159,196,0.5)" }}>
              표시할 길드원이 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredMembers.map((m) => {
                const selected = selectedIds.has(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleSelect(m.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-left"
                    style={{
                      background: selected
                        ? "rgba(139,92,246,0.12)"
                        : "rgba(255,255,255,0.025)",
                      border: selected
                        ? "1px solid rgba(167,139,250,0.5)"
                        : "1px solid rgba(255,255,255,0.05)",
                      boxShadow: selected ? "0 0 12px rgba(139,92,246,0.18)" : "none",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: selected
                          ? "linear-gradient(135deg, #a78bfa, #7c3aed)"
                          : "rgba(255,255,255,0.04)",
                        border: selected
                          ? "1px solid rgba(167,139,250,0.6)"
                          : "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {selected && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                    <span
                      className="text-sm truncate"
                      style={{ color: selected ? "#fff" : "rgba(226,232,240,0.85)" }}
                    >
                      {getDisplayName(m)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 히스토리 모달 ───────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] rounded-[2rem] overflow-hidden flex flex-col"
              style={CARD_STYLE}
            >
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(139,92,246,0.10)" }}
              >
                <div className="flex items-center gap-2">
                  <History size={16} style={{ color: "#c4b5fd" }} />
                  <div>
                    <div
                      className="text-[10px] font-semibold uppercase tracking-[0.26em]"
                      style={{ color: "#c4b5fd" }}
                    >
                      History
                    </div>
                    <h3 className="text-base font-bold text-white">지난 뽑기 결과</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {historyLoading ? (
                  <div className="text-center py-10 text-sm" style={{ color: "rgba(155,159,196,0.5)" }}>
                    불러오는 중...
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-10 text-sm" style={{ color: "rgba(155,159,196,0.5)" }}>
                    아직 저장된 결과가 없습니다.
                  </div>
                ) : (
                  history.map((h) => {
                    const isOwn = h.created_by === user?.id;
                    return (
                      <div
                        key={h.id}
                        className="rounded-2xl p-4"
                        style={{
                          background: "rgba(255,255,255,0.025)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold" style={{ color: "#c4b5fd" }}>
                              {h.creator_name || "익명"}
                            </span>
                            <span
                              className="flex items-center gap-1 text-[11px]"
                              style={{ color: "rgba(155,159,196,0.55)" }}
                            >
                              <Clock size={10} />
                              {formatRelativeTime(h.created_at)}
                            </span>
                            {h.options?.team_size && h.options?.team_count && (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-md"
                                style={{
                                  background: "rgba(167,139,250,0.1)",
                                  color: "#a78bfa",
                                  border: "1px solid rgba(167,139,250,0.2)",
                                }}
                              >
                                {h.options.team_count}팀 × {h.options.team_size}명
                              </span>
                            )}
                          </div>
                          {isOwn && (
                            <button
                              onClick={() => deleteHistory(h.id)}
                              className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
                              title="삭제"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {h.teams.map((team, ti) => {
                            const palette = TEAM_PALETTE[ti % TEAM_PALETTE.length];
                            return (
                              <div
                                key={ti}
                                className="rounded-xl p-2.5"
                                style={{
                                  background: "rgba(255,255,255,0.02)",
                                  border: "1px solid rgba(255,255,255,0.04)",
                                }}
                              >
                                <div
                                  className="text-[10px] font-bold uppercase tracking-wider mb-1.5 inline-block px-1.5 py-0.5 rounded"
                                  style={{
                                    background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                                    color: "#fff",
                                  }}
                                >
                                  Team {ti + 1}
                                </div>
                                <div className="text-xs text-slate-200 leading-relaxed">
                                  {team.join(", ")}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {h.waiting && h.waiting.length > 0 && (
                          <div className="mt-2 text-[11px]" style={{ color: "rgba(155,159,196,0.6)" }}>
                            🪑 대기: {h.waiting.join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
