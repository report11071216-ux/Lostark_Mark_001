import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shuffle,
  Users,
  RefreshCw,
  Search,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Member = {
  id: string;
  nickname: string | null;
  character_name: string | null;
  role: string | null;
};

type Team = Member[];

type Props = {
  user?: any;
  profile?: any;
  supabase: any;
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
// Fisher–Yates shuffle — returns a new array, leaves input intact
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getDisplayName = (m: Member) =>
  (m.nickname && m.nickname.trim()) ||
  (m.character_name && m.character_name.trim()) ||
  "이름없음";

// 팀 카드 컬러 팔레트 (퍼플/핑크/옐로우 등 순환)
const TEAM_PALETTE = [
  { from: "#a78bfa", to: "#7c3aed", glow: "rgba(139,92,246,0.35)" },
  { from: "#f9a8d4", to: "#db2777", glow: "rgba(219,39,119,0.30)" },
  { from: "#fcd34d", to: "#f59e0b", glow: "rgba(245,158,11,0.30)" },
  { from: "#6ee7b7", to: "#10b981", glow: "rgba(16,185,129,0.30)" },
  { from: "#67e8f9", to: "#0891b2", glow: "rgba(8,145,178,0.30)" },
  { from: "#fda4af", to: "#e11d48", glow: "rgba(225,29,72,0.30)" },
];

// 공통 카드 스타일 (앱 전반 디자인 토큰과 일치)
const CARD_STYLE: React.CSSProperties = {
  background:
    "linear-gradient(160deg, rgba(28,23,51,0.85) 0%, rgba(15,13,32,0.95) 100%)",
  border: "1px solid rgba(139,92,246,0.16)",
  boxShadow: "0 14px 36px rgba(0,0,0,0.22)",
};

// ─────────────────────────────────────────────────────────────
// Stepper sub-component (팀당 인원, 팀 개수 조절)
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
          aria-label={`${label} 감소`}
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
          aria-label={`${label} 증가`}
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
  const [picking, setPicking] = useState(false);

  // ── 길드원 목록 가져오기 ─────────────────────────────
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
          .select("id, nickname, character_name, role")
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
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // ── 파생 상태 ───────────────────────────────────────
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
  const canPick = selectedCount >= requiredSlots && requiredSlots > 0;

  // ── 선택 핸들러 ─────────────────────────────────────
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

  // ── 뽑기 실행 ───────────────────────────────────────
  const doPick = () => {
    if (!canPick) return;
    setPicking(true);
    setTeams([]);
    setWaiting([]);
    // 짧은 딜레이로 exit 애니메이션 → 재진입 느낌 살리기
    window.setTimeout(() => {
      const shuffled = shuffle(selectedMembers);
      const newTeams: Team[] = [];
      for (let i = 0; i < teamCount; i++) {
        const start = i * teamSize;
        newTeams.push(shuffled.slice(start, start + teamSize));
      }
      const leftover = shuffled.slice(teamCount * teamSize);
      setTeams(newTeams);
      setWaiting(leftover);
      setPicking(false);
    }, 180);
  };

  const reset = () => {
    setTeams([]);
    setWaiting([]);
  };

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── 헤더 + 설정 카드 ───────────────────────── */}
      <div className="rounded-[2rem] overflow-hidden" style={CARD_STYLE}>
        <div
          className="px-6 py-5 flex items-center justify-between"
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
          <Sparkles size={24} style={{ color: "#a78bfa" }} />
        </div>

        {/* 설정 */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stepper
            label="팀당 인원"
            value={teamSize}
            setValue={setTeamSize}
            min={1}
            max={20}
          />
          <Stepper
            label="팀 개수"
            value={teamCount}
            setValue={setTeamCount}
            min={1}
            max={20}
          />
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
                  color:
                    selectedCount >= requiredSlots ? "#6ee7b7" : "#fda4af",
                }}
              >
                {selectedCount}
              </span>
              명
            </div>
          </div>
        </div>

        {/* 액션 바 */}
        <div className="px-6 pb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={doPick}
            disabled={!canPick || picking}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: canPick
                ? "linear-gradient(135deg, #a78bfa, #7c3aed)"
                : "rgba(255,255,255,0.05)",
              color: "#fff",
              boxShadow: canPick
                ? "0 8px 24px rgba(124,58,237,0.35)"
                : "none",
            }}
          >
            <Shuffle size={16} />
            뽑기
          </button>

          {teams.length > 0 && (
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

          {!canPick && selectedCount > 0 && (
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

      {/* ── 결과 카드 ─────────────────────────────── */}
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
              className="px-6 py-4"
              style={{ borderBottom: "1px solid rgba(139,92,246,0.10)" }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.26em]"
                style={{ color: "#c4b5fd" }}
              >
                Result
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                뽑기 결과
              </h3>
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
                      {team.map((m, mi) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: idx * 0.08 + mi * 0.05 + 0.15,
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                              color: "#fff",
                            }}
                          >
                            {mi + 1}
                          </div>
                          <div className="text-sm text-white font-medium truncate">
                            {getDisplayName(m)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 대기 명단 */}
            {waiting.length > 0 && (
              <div className="px-6 pb-6">
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
              </div>
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
            <span
              className="text-xs"
              style={{ color: "rgba(155,159,196,0.55)" }}
            >
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

        {/* 검색 */}
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
              placeholder="닉네임 / 캐릭터명 검색"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        </div>

        {/* 멤버 그리드 */}
        <div className="p-6">
          {loading ? (
            <div
              className="text-center py-10 text-sm"
              style={{ color: "rgba(155,159,196,0.5)" }}
            >
              길드원 목록을 불러오는 중...
            </div>
          ) : error ? (
            <div
              className="text-center py-10 text-sm"
              style={{ color: "#fda4af" }}
            >
              {error}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div
              className="text-center py-10 text-sm"
              style={{ color: "rgba(155,159,196,0.5)" }}
            >
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
                      boxShadow: selected
                        ? "0 0 12px rgba(139,92,246,0.18)"
                        : "none",
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
                      {selected && (
                        <Check size={12} color="#fff" strokeWidth={3} />
                      )}
                    </div>
                    <span
                      className="text-sm truncate"
                      style={{
                        color: selected
                          ? "#fff"
                          : "rgba(226,232,240,0.85)",
                      }}
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
    </div>
  );
}
