/* ────────────────────────────────────────────────────────────────────
 *  AchievementsPage.tsx
 *  ─ MMORPG 스타일 업적 / 티어 / 칭호 / 명예의 전당 시스템
 *  ─ app.tsx 의 기존 `RankingPage` 를 대체합니다
 *  ─ 의존성: framer-motion, lucide-react, @supabase/supabase-js, tailwindcss
 *  ─ 동일 파일 안의 supabase / cn / safeSingle 등은 부모 스코프 그대로 사용
 * ──────────────────────────────────────────────────────────────────── */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Crown,
  Shield,
  Sparkles,
  Lock,
  Check,
  Star,
  Flame,
  Moon,
  Sun,
  Swords,
  Heart,
  MessageCircle,
  Calendar,
  Target,
  Award,
  ChevronRight,
  Search,
  TrendingUp,
  Zap,
  Gem,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
 *  ❶  티어 시스템 (포인트 기반, 자동 산출)
 *      평균 길드원이 주 50P → 시즌(12주) 600P
 *      티어가 너무 빨리 끝나지도, 너무 멀어지지도 않게 배분
 * ════════════════════════════════════════════════════════════ */

type TierKey =
  | "iron"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master"
  | "grandmaster"
  | "legend"
  | "mythic";

type TierDef = {
  key: TierKey;
  name: string;          // 표시명
  min: number;           // 최소 포인트
  /** 메탈 그라데이션 (텍스트 / 보더) */
  gradient: string;
  /** 글로우 컬러 */
  glow: string;
  /** 보조 색 (chip 등) */
  accent: string;
  icon: string;          // emoji
  flavor: string;        // 영문 캐치프레이즈
};

const TIERS: TierDef[] = [
  { key: "iron",        name: "강철",     min: 0,    gradient: "from-stone-500 to-stone-300",     glow: "rgba(168,162,158,0.35)", accent: "#A8A29E", icon: "⚙️", flavor: "The First Step" },
  { key: "bronze",      name: "동",       min: 100,  gradient: "from-amber-700 to-amber-400",     glow: "rgba(217,119,6,0.45)",   accent: "#D97706", icon: "🛡️", flavor: "Hardened by Battle" },
  { key: "silver",      name: "은",       min: 300,  gradient: "from-slate-400 to-slate-100",     glow: "rgba(203,213,225,0.45)", accent: "#CBD5E1", icon: "⚔️", flavor: "Steel and Will" },
  { key: "gold",        name: "금",       min: 600,  gradient: "from-amber-400 to-yellow-200",    glow: "rgba(252,211,77,0.55)",  accent: "#FCD34D", icon: "🏅", flavor: "Marked with Glory" },
  { key: "platinum",    name: "플래티넘",  min: 1000, gradient: "from-cyan-300 to-teal-100",       glow: "rgba(103,232,249,0.55)", accent: "#67E8F9", icon: "💠", flavor: "Beyond the Veil" },
  { key: "diamond",     name: "다이아",    min: 1600, gradient: "from-indigo-400 to-sky-200",      glow: "rgba(129,140,248,0.6)",  accent: "#818CF8", icon: "💎", flavor: "Brilliance Forged" },
  { key: "master",      name: "마스터",    min: 2400, gradient: "from-violet-400 to-fuchsia-200", glow: "rgba(167,139,250,0.65)", accent: "#A78BFA", icon: "🔮", flavor: "Wielder of the Arts" },
  { key: "grandmaster", name: "그랜드마스터", min: 3600, gradient: "from-fuchsia-500 to-pink-300", glow: "rgba(232,121,249,0.7)",  accent: "#E879F9", icon: "👑", flavor: "Beyond Mastery" },
  { key: "legend",      name: "전설",      min: 5200, gradient: "from-orange-500 via-red-400 to-yellow-300", glow: "rgba(248,113,113,0.8)", accent: "#F87171", icon: "🔥", flavor: "Etched in Legend" },
  { key: "mythic",      name: "신화",      min: 7500, gradient: "from-yellow-300 via-pink-400 to-cyan-300", glow: "rgba(244,114,182,0.9)", accent: "#F472B6", icon: "✨", flavor: "Born of Myth" },
];

const getTierByPoints = (points: number): TierDef => {
  let current = TIERS[0];
  for (const t of TIERS) if (points >= t.min) current = t;
  return current;
};

const getNextTier = (points: number): TierDef | null => {
  const idx = TIERS.findIndex((t) => t.min > points);
  return idx === -1 ? null : TIERS[idx];
};

/* ════════════════════════════════════════════════════════════
 *  ❷  레어도 / 카테고리 (UI 컬러 매핑)
 * ════════════════════════════════════════════════════════════ */

type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

const RARITY_STYLE: Record<Rarity, {
  text: string; border: string; bg: string; chip: string; glow: string; label: string;
}> = {
  common:    { text: "text-slate-300",   border: "border-slate-500/30",  bg: "from-slate-800/60 to-slate-900/60",    chip: "bg-slate-500/15 text-slate-300 border-slate-500/30",   glow: "rgba(148,163,184,0.15)", label: "COMMON"    },
  rare:      { text: "text-sky-300",     border: "border-sky-400/40",    bg: "from-sky-900/40 to-slate-900/60",      chip: "bg-sky-500/15 text-sky-200 border-sky-500/30",         glow: "rgba(56,189,248,0.3)",   label: "RARE"      },
  epic:      { text: "text-violet-300",  border: "border-violet-400/50", bg: "from-violet-900/40 to-slate-900/60",   chip: "bg-violet-500/15 text-violet-200 border-violet-500/30", glow: "rgba(167,139,250,0.4)", label: "EPIC"      },
  legendary: { text: "text-amber-300",   border: "border-amber-400/60",  bg: "from-amber-900/40 to-slate-900/70",    chip: "bg-amber-500/15 text-amber-200 border-amber-500/40",   glow: "rgba(252,211,77,0.5)",   label: "LEGENDARY" },
  mythic:    { text: "text-pink-300",    border: "border-pink-400/60",   bg: "from-pink-900/40 via-purple-900/40 to-cyan-900/40", chip: "bg-pink-500/15 text-pink-200 border-pink-500/40", glow: "rgba(244,114,182,0.6)", label: "MYTHIC" },
};

type Category =
  | "all"
  | "raid"
  | "social"
  | "dedication"
  | "support"
  | "hidden";

const CATEGORIES: { key: Category; label: string; icon: any }[] = [
  { key: "all",        label: "전체",     icon: Sparkles },
  { key: "raid",       label: "레이드",   icon: Swords },
  { key: "social",     label: "소셜",     icon: MessageCircle },
  { key: "dedication", label: "헌신",     icon: Flame },
  { key: "support",    label: "서포트",   icon: Heart },
  { key: "hidden",     label: "비밀",     icon: Lock },
];

/* ════════════════════════════════════════════════════════════
 *  ❸  공통 유틸
 * ════════════════════════════════════════════════════════════ */

const cn = (...a: any[]) => a.filter(Boolean).join(" ");

const formatNum = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

/* ════════════════════════════════════════════════════════════
 *  ❹  타입 정의 (DB 매핑)
 * ════════════════════════════════════════════════════════════ */

type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: Exclude<Category, "all">;
  rarity: Rarity;
  hidden: boolean;
  icon: string;          // emoji 또는 lucide name (여기선 emoji 사용)
  reward_title_id?: string | null;
  /** 클라이언트 진척도 계산용 (선택) */
  threshold?: number | null;
};

type Title = {
  id: string;
  code: string;
  name: string;
  description: string;
  rarity: Rarity;
  /** 칭호 표시용 컬러 (선택) */
  color?: string | null;
};

type UserAchievement = {
  achievement_id: string;
  achieved_at: string;
  progress?: number | null;
};

type UserTitle = {
  title_id: string;
  acquired_at: string;
};

type HallEntry = {
  id: string;
  season_name: string;
  category: string;     // points / weekly / support / participation
  rank: number;
  profile_id: string;
  nickname: string;
  value: number;
  achieved_at: string;
};

type MVPRow = {
  category: string;
  profile_id: string;
  nickname: string;
  value: number;
  rank_name?: string | null;
};

/* ════════════════════════════════════════════════════════════
 *  ❺  메인 컴포넌트
 *
 *  Props
 *    user     : Supabase auth user
 *    profile  : profiles row (points, nickname, rank_name, equipped_title_id 등)
 *    supabase : 부모에서 export 된 클라이언트 (또는 props 로 받기)
 * ════════════════════════════════════════════════════════════ */

type Props = {
  user: any;
  profile: any;
  supabase: any;             // 부모의 createClient 결과
  /** 프로필 업데이트 후 부모 갱신용 (선택) */
  onProfileChanged?: () => void;
};

export const AchievementsPage: React.FC<Props> = ({ user, profile, supabase, onProfileChanged }) => {
  /* ─ View tab ─ */
  type View = "overview" | "achievements" | "titles" | "hall" | "mvp";
  const [view, setView] = useState<View>("overview");

  /* ─ Data ─ */
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([]);
  const [myTitles, setMyTitles] = useState<UserTitle[]>([]);
  const [hall, setHall] = useState<HallEntry[]>([]);
  const [mvp, setMvp] = useState<MVPRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* ─ Filters ─ */
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");

  /* ─ Stats ─ */
  const myPoints = Number(profile?.points || 0);
  const myTier = useMemo(() => getTierByPoints(myPoints), [myPoints]);
  const nextTier = useMemo(() => getNextTier(myPoints), [myPoints]);
  const tierProgress = useMemo(() => {
    if (!nextTier) return 1;
    const span = nextTier.min - myTier.min;
    const have = myPoints - myTier.min;
    return Math.max(0, Math.min(1, have / span));
  }, [myPoints, myTier, nextTier]);

  /* ─ 대표 칭호 ─ */
  const equippedTitleId: string | null = profile?.equipped_title_id || null;
  const equippedTitle = useMemo(
    () => titles.find((t) => t.id === equippedTitleId) || null,
    [titles, equippedTitleId]
  );

  /* ════════ 데이터 로드 ════════ */
  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [aRes, tRes, uaRes, utRes, hRes] = await Promise.all([
        supabase.from("achievements").select("*").order("category").order("rarity").order("title"),
        supabase.from("titles").select("*").order("rarity").order("name"),
        user ? supabase.from("user_achievements").select("achievement_id, achieved_at, progress").eq("user_id", user.id) : Promise.resolve({ data: [] }),
        user ? supabase.from("user_titles").select("title_id, acquired_at").eq("user_id", user.id) : Promise.resolve({ data: [] }),
        supabase.from("season_results").select("id, season_name, category, rank, profile_id, nickname, value, achieved_at").order("achieved_at", { ascending: false }).limit(60),
      ]);
      setAchievements((aRes.data || []) as Achievement[]);
      setTitles((tRes.data || []) as Title[]);
      setMyAchievements((uaRes.data || []) as UserAchievement[]);
      setMyTitles((utRes.data || []) as UserTitle[]);
      setHall((hRes.data || []) as HallEntry[]);
    } catch (err) {
      console.error("[Achievements] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  /* ════════ 현재 시즌 MVP (실시간) ════════ */
  const fetchMVP = useCallback(async () => {
    if (!supabase) return;
    try {
      const [points, weekly, support, part] = await Promise.all([
        supabase.from("profiles").select("id, nickname, points, rank_name").order("points", { ascending: false }).limit(1),
        supabase.from("weekly_activity_ranking").select("*").limit(1),
        supabase.from("support_contribution_ranking").select("*").limit(1),
        supabase.from("participation_rate_ranking").select("*").limit(1),
      ]);
      const rows: MVPRow[] = [];
      if (points.data?.[0]) rows.push({ category: "points",        profile_id: points.data[0].id,                       nickname: points.data[0].nickname,                            value: Number(points.data[0].points || 0), rank_name: points.data[0].rank_name });
      if (weekly.data?.[0]) rows.push({ category: "weekly",        profile_id: weekly.data[0].profile_id || weekly.data[0].id, nickname: weekly.data[0].owner_nickname || weekly.data[0].nickname, value: Number(weekly.data[0].weekly_count || 0) });
      if (support.data?.[0]) rows.push({ category: "support",      profile_id: support.data[0].profile_id || support.data[0].id, nickname: support.data[0].owner_nickname || support.data[0].nickname, value: Number(support.data[0].support_score || 0) });
      if (part.data?.[0]) rows.push({ category: "participation",  profile_id: part.data[0].profile_id || part.data[0].id,     nickname: part.data[0].owner_nickname || part.data[0].nickname,     value: Number(part.data[0].participation_rate || 0) });
      setMvp(rows);
    } catch (err) {
      console.error("[Achievements] MVP error:", err);
    }
  }, [supabase]);

  useEffect(() => { fetchAll(); fetchMVP(); }, [fetchAll, fetchMVP]);

  /* ════════ 대표 칭호 설정 ════════ */
  const equipTitle = async (titleId: string | null) => {
    if (!user || !supabase) return;
    const { error } = await supabase
      .from("profiles")
      .update({ equipped_title_id: titleId })
      .eq("id", user.id);
    if (error) {
      console.error(error);
      alert("칭호 변경 실패: " + error.message);
      return;
    }
    onProfileChanged?.();
  };

  /* ════════ 파생 데이터 ════════ */

  const achievementSet = useMemo(() => {
    const s = new Set(myAchievements.map((m) => m.achievement_id));
    return s;
  }, [myAchievements]);

  const titleSet = useMemo(() => {
    const s = new Set(myTitles.map((m) => m.title_id));
    return s;
  }, [myTitles]);

  const visibleAchievements = useMemo(() => {
    const q = search.trim().toLowerCase();
    return achievements.filter((a) => {
      // 카테고리
      if (category === "hidden") {
        if (!a.hidden) return false;
      } else if (category !== "all" && a.category !== category) {
        return false;
      }
      // 검색 (숨겨진 미달성은 검색 안 됨)
      if (q) {
        const isHidden = a.hidden && !achievementSet.has(a.id);
        if (isHidden) return false;
        if (!a.title.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [achievements, category, search, achievementSet]);

  const completedCount = achievementSet.size;
  const totalCount = achievements.length;
  const completionPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  /* ════════════════════════════════════════════════════════
   *  Render
   * ════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="inline-block text-4xl mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            ⚜️
          </motion.div>
          <div className="text-amber-200/70 text-xs tracking-[0.4em] uppercase">Loading Halls of Glory</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto px-3 sm:px-6 py-8 sm:py-16">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.12] blur-[120px]" style={{ background: "radial-gradient(circle, #F0B429 0%, transparent 60%)" }} />
        <div className="absolute -bottom-40 right-0 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[100px]" style={{ background: "radial-gradient(circle, #A78BFA 0%, transparent 60%)" }} />
        <NoiseOverlay />
      </div>

      {/* 페이지 헤더 */}
      <header className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-500/5 mb-4">
          <Crown className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-amber-200/80 font-semibold">Halls of Renown</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          <span className="bg-gradient-to-b from-amber-100 to-amber-400 bg-clip-text text-transparent">명예의 전당</span>
        </h1>
        <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          길드의 전사들이 새긴 발자국. 그대의 이름도 여기에 기록될 것이다.
        </p>
      </header>

      {/* 내 프로필 카드 */}
      <MyHeroCard
        nickname={profile?.nickname || "Adventurer"}
        points={myPoints}
        tier={myTier}
        nextTier={nextTier}
        progress={tierProgress}
        completedCount={completedCount}
        totalCount={totalCount}
        titlesCount={myTitles.length}
        equippedTitle={equippedTitle}
      />

      {/* 탭 네비게이션 */}
      <ViewTabs view={view} setView={setView} />

      {/* 본문 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {view === "overview" && (
            <OverviewSection
              tier={myTier}
              nextTier={nextTier}
              points={myPoints}
              progress={tierProgress}
              completionPct={completionPct}
              completed={completedCount}
              total={totalCount}
              myTitles={myTitles.length}
              totalTitles={titles.length}
              recentAchievements={
                myAchievements
                  .slice()
                  .sort((a, b) => +new Date(b.achieved_at) - +new Date(a.achieved_at))
                  .slice(0, 4)
                  .map((ua) => achievements.find((a) => a.id === ua.achievement_id))
                  .filter(Boolean) as Achievement[]
              }
              hall={hall.slice(0, 3)}
              onJump={setView}
            />
          )}

          {view === "achievements" && (
            <AchievementsSection
              achievements={visibleAchievements}
              achievementSet={achievementSet}
              myAchievements={myAchievements}
              category={category}
              setCategory={setCategory}
              search={search}
              setSearch={setSearch}
            />
          )}

          {view === "titles" && (
            <TitlesSection
              titles={titles}
              titleSet={titleSet}
              equippedTitleId={equippedTitleId}
              onEquip={equipTitle}
            />
          )}

          {view === "hall" && <HallOfFameSection entries={hall} />}

          {view === "mvp" && <MVPSection rows={mvp} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
 *  ⓐ 내 영웅 카드 (Hero Card)
 * ════════════════════════════════════════════════════════════ */

const MyHeroCard: React.FC<{
  nickname: string;
  points: number;
  tier: TierDef;
  nextTier: TierDef | null;
  progress: number;
  completedCount: number;
  totalCount: number;
  titlesCount: number;
  equippedTitle: Title | null;
}> = ({ nickname, points, tier, nextTier, progress, completedCount, totalCount, titlesCount, equippedTitle }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-10 sm:mb-12"
    >
      {/* 글로우 */}
      <div className="absolute -inset-1 rounded-3xl opacity-60 blur-2xl" style={{ background: `radial-gradient(ellipse at center, ${tier.glow}, transparent 70%)` }} />

      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0a0d1a]/95 via-[#0d1018]/95 to-[#070912]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {/* Ornament corner */}
        <CornerOrnaments accent={tier.accent} />

        {/* 메탈 그라데이션 상단 라인 */}
        <div className={cn("h-[2px] w-full bg-gradient-to-r", tier.gradient)} />

        <div className="p-5 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
            {/* 좌측: 티어 메달 */}
            <div className="relative flex-shrink-0 mx-auto md:mx-0">
              <TierMedallion tier={tier} />
            </div>

            {/* 우측: 정보 */}
            <div className="flex-1 min-w-0 w-full">
              {/* 칭호 */}
              {equippedTitle ? (
                <div className="mb-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] sm:text-xs font-semibold tracking-wider uppercase",
                      RARITY_STYLE[equippedTitle.rarity].chip
                    )}
                    style={equippedTitle.color ? { color: equippedTitle.color } : undefined}
                  >
                    <Sparkles className="w-3 h-3" />
                    {equippedTitle.name}
                  </span>
                </div>
              ) : (
                <div className="mb-2 text-[10px] text-slate-600 uppercase tracking-[0.3em]">No Title Equipped</div>
              )}

              {/* 닉네임 */}
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white truncate">{nickname}</h2>

              {/* 티어 배지 */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Current Tier</span>
                <span className={cn("font-serif text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r", tier.gradient)}>
                  {tier.name}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-300 font-mono text-sm">{formatNum(points)} P</span>
              </div>

              {/* 다음 티어까지 게이지 */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider mb-1.5">
                  {nextTier ? (
                    <>
                      <span className="text-slate-500">to {nextTier.name}</span>
                      <span className="text-slate-400 font-mono">{formatNum(nextTier.min - points)} P</span>
                    </>
                  ) : (
                    <span className="text-amber-300/80">최고 티어 달성</span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden relative">
                  <motion.div
                    className={cn("h-full bg-gradient-to-r", tier.gradient)}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ boxShadow: `0 0 16px ${tier.glow}` }}
                  />
                  {/* 광택 애니 */}
                  <motion.div
                    className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "400%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                    style={{ mixBlendMode: "overlay" }}
                  />
                </div>
              </div>

              {/* 미니 스탯 */}
              <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-5">
                <MiniStat icon={Award}   label="업적"  value={`${completedCount}/${totalCount}`} accent="#FCD34D" />
                <MiniStat icon={Trophy}  label="칭호"  value={`${titlesCount}`}                  accent="#A78BFA" />
                <MiniStat icon={Gem}     label="포인트" value={formatNum(points)}                accent="#67E8F9" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

/* ════════ 메달 (티어 아이콘) ════════ */
const TierMedallion: React.FC<{ tier: TierDef }> = ({ tier }) => {
  return (
    <div className="relative h-28 w-28 sm:h-32 sm:w-32">
      {/* 회전 광 */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-70"
        style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${tier.glow} 120deg, transparent 240deg)` }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      {/* 외곽 */}
      <div className={cn("absolute inset-1 rounded-full bg-gradient-to-br p-[2px]", tier.gradient)}>
        <div className="h-full w-full rounded-full bg-[#0a0d1a] flex items-center justify-center relative overflow-hidden">
          {/* 내부 스파클 배경 */}
          <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 30% 30%, ${tier.glow}, transparent 60%)` }} />
          {/* 아이콘 */}
          <span className="text-4xl sm:text-5xl drop-shadow-[0_0_12px_rgba(252,211,77,0.6)]">{tier.icon}</span>
          {/* 노이즈 */}
          <NoiseOverlay opacity={0.3} />
        </div>
      </div>
    </div>
  );
};

/* ════════ 미니 스탯 ════════ */
const MiniStat: React.FC<{ icon: any; label: string; value: string; accent: string }> = ({ icon: Icon, label, value, accent }) => (
  <div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 group hover:bg-white/[0.05] transition-all">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500">{label}</span>
    </div>
    <div className="text-base sm:text-lg font-semibold text-white font-mono tabular-nums">{value}</div>
  </div>
);

/* ════════════════════════════════════════════════════════════
 *  ⓑ 뷰 탭
 * ════════════════════════════════════════════════════════════ */

const ViewTabs: React.FC<{ view: string; setView: (v: any) => void }> = ({ view, setView }) => {
  const tabs = [
    { key: "overview",     label: "개요",        icon: Star },
    { key: "achievements", label: "업적",        icon: Award },
    { key: "titles",       label: "칭호",        icon: Crown },
    { key: "hall",         label: "명예의 전당",  icon: Trophy },
    { key: "mvp",          label: "시즌 MVP",    icon: Zap },
  ];
  return (
    <div className="mb-8 overflow-x-auto scrollbar-none -mx-3 sm:mx-0 px-3 sm:px-0">
      <div className="inline-flex items-center gap-1 p-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = view === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={cn(
                "relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all",
                active ? "text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {active && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/40 shadow-[0_4px_24px_rgba(252,211,77,0.15)]"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
 *  ⓒ Overview Section
 * ════════════════════════════════════════════════════════════ */

const OverviewSection: React.FC<{
  tier: TierDef;
  nextTier: TierDef | null;
  points: number;
  progress: number;
  completionPct: number;
  completed: number;
  total: number;
  myTitles: number;
  totalTitles: number;
  recentAchievements: Achievement[];
  hall: HallEntry[];
  onJump: (v: any) => void;
}> = ({ tier, nextTier, points, completionPct, completed, total, myTitles, totalTitles, recentAchievements, hall, onJump }) => {
  return (
    <div className="space-y-8">
      {/* 티어 로드맵 */}
      <Panel title="Tier Roadmap" subtitle="모든 티어의 정점을 향해">
        <TierRoadmap currentPoints={points} />
      </Panel>

      {/* 진척도 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Panel title="Achievement Progress" subtitle="업적 수집율">
          <div className="flex items-center gap-6">
            <RingProgress value={completionPct} accent="#FCD34D" />
            <div className="flex-1">
              <div className="text-3xl font-bold text-white font-serif">{completed}<span className="text-slate-600 text-xl">/{total}</span></div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">unlocked</div>
              <button
                onClick={() => onJump("achievements")}
                className="mt-3 inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200"
              >
                업적 보러가기 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Title Collection" subtitle="수집한 칭호">
          <div className="flex items-center gap-6">
            <RingProgress value={totalTitles === 0 ? 0 : (myTitles / totalTitles) * 100} accent="#A78BFA" />
            <div className="flex-1">
              <div className="text-3xl font-bold text-white font-serif">{myTitles}<span className="text-slate-600 text-xl">/{totalTitles}</span></div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">acquired</div>
              <button
                onClick={() => onJump("titles")}
                className="mt-3 inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
              >
                칭호 보러가기 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </Panel>
      </div>

      {/* 최근 달성 */}
      <Panel title="Recent Achievements" subtitle="최근 새겨진 위업">
        {recentAchievements.length === 0 ? (
          <div className="py-10 text-center text-slate-600 text-sm">
            아직 달성한 업적이 없어요. 첫 발자국을 새겨보세요.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentAchievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} unlocked unlockedAt={null} compact />
            ))}
          </div>
        )}
      </Panel>

      {/* 명예의 전당 미리보기 */}
      <Panel title="Hall of Fame" subtitle="지난 시즌의 영웅들">
        {hall.length === 0 ? (
          <div className="py-10 text-center text-slate-600 text-sm">아직 기록된 시즌이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {hall.map((h) => <HallRow key={h.id} entry={h} />)}
            <button
              onClick={() => onJump("hall")}
              className="w-full mt-2 py-2.5 rounded-xl border border-white/10 text-xs uppercase tracking-[0.3em] text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all"
            >
              전체 보기 →
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
};

/* ════════ Tier Roadmap ════════ */
const TierRoadmap: React.FC<{ currentPoints: number }> = ({ currentPoints }) => {
  return (
    <div className="relative">
      {/* 라인 */}
      <div className="absolute left-0 right-0 top-7 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent hidden sm:block" />
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
        {TIERS.map((t) => {
          const reached = currentPoints >= t.min;
          const isCurrent = getTierByPoints(currentPoints).key === t.key;
          return (
            <div key={t.key} className="flex flex-col items-center gap-2 group">
              <div className={cn(
                "relative h-12 w-12 sm:h-14 sm:w-14 rounded-full transition-all",
                reached ? "scale-100" : "scale-90 grayscale opacity-40",
                isCurrent && "scale-110"
              )}>
                <div className={cn("absolute inset-0 rounded-full bg-gradient-to-br p-[1.5px]", t.gradient)}>
                  <div className="h-full w-full rounded-full bg-[#0a0d1a] flex items-center justify-center text-lg sm:text-xl">
                    {t.icon}
                  </div>
                </div>
                {isCurrent && (
                  <motion.div
                    className="absolute -inset-1 rounded-full border-2 border-amber-300/60"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.3, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-[10px] sm:text-xs font-semibold leading-tight",
                  reached ? "text-white" : "text-slate-600"
                )}>{t.name}</div>
                <div className="text-[9px] text-slate-500 font-mono">{t.min}P</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ════════ Ring Progress ════════ */
const RingProgress: React.FC<{ value: number; accent: string }> = ({ value, accent }) => {
  const radius = 30;
  const circ = 2 * Math.PI * radius;
  const v = Math.max(0, Math.min(100, value));
  const offset = circ - (v / 100) * circ;
  return (
    <div className="relative h-20 w-20 flex-shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
        <motion.circle
          cx="40" cy="40" r={radius}
          stroke={accent}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 4px ${accent})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold font-mono text-white">{Math.round(v)}<span className="text-slate-500 text-xs">%</span></span>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
 *  ⓓ Achievements Section
 * ════════════════════════════════════════════════════════════ */

const AchievementsSection: React.FC<{
  achievements: Achievement[];
  achievementSet: Set<string>;
  myAchievements: UserAchievement[];
  category: Category;
  setCategory: (c: Category) => void;
  search: string;
  setSearch: (s: string) => void;
}> = ({ achievements, achievementSet, myAchievements, category, setCategory, search, setSearch }) => {
  return (
    <div className="space-y-5">
      {/* 필터 */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  active
                    ? "bg-amber-500/15 border-amber-400/40 text-amber-200"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                )}
              >
                <Icon className="w-3 h-3" /> {c.label}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="업적 검색..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* 그리드 */}
      {achievements.length === 0 ? (
        <div className="py-16 text-center text-slate-600 text-sm">조건에 맞는 업적이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a, i) => {
            const unlocked = achievementSet.has(a.id);
            const at = myAchievements.find((m) => m.achievement_id === a.id)?.achieved_at || null;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <AchievementCard achievement={a} unlocked={unlocked} unlockedAt={at} />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ════════ 업적 카드 ════════ */
const AchievementCard: React.FC<{
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt: string | null;
  compact?: boolean;
}> = ({ achievement, unlocked, unlockedAt, compact }) => {
  const isHidden = achievement.hidden && !unlocked;
  const rarity = RARITY_STYLE[achievement.rarity];

  return (
    <div
      className={cn(
        "group relative rounded-2xl border overflow-hidden transition-all",
        unlocked
          ? cn("bg-gradient-to-br", rarity.bg, rarity.border, "hover:scale-[1.02]")
          : "bg-black/40 border-white/5 hover:border-white/15",
        compact ? "p-3" : "p-4"
      )}
      style={unlocked ? { boxShadow: `0 0 24px ${rarity.glow}` } : {}}
    >
      {/* 레어도 모서리 표시 */}
      {unlocked && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
          <div
            className={cn("absolute -right-8 top-3 rotate-45 w-24 text-center text-[8px] font-bold tracking-widest py-0.5", rarity.text)}
            style={{ background: `linear-gradient(90deg, transparent, ${rarity.glow}, transparent)` }}
          >
            {rarity.label}
          </div>
        </div>
      )}

      <div className={cn("flex gap-3", compact ? "flex-col items-center text-center" : "items-start")}>
        {/* 아이콘 */}
        <div
          className={cn(
            "flex-shrink-0 flex items-center justify-center rounded-xl border",
            unlocked ? rarity.border : "border-white/10 grayscale",
            compact ? "h-12 w-12 text-2xl" : "h-14 w-14 text-3xl"
          )}
          style={unlocked ? { background: `radial-gradient(circle, ${rarity.glow}, transparent 70%)` } : { background: "rgba(0,0,0,0.4)" }}
        >
          {isHidden ? <Lock className="w-5 h-5 text-slate-600" /> : achievement.icon}
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className={cn(
              "font-semibold truncate",
              compact ? "text-sm" : "text-base",
              unlocked ? "text-white" : "text-slate-500"
            )}>
              {isHidden ? "???" : achievement.title}
            </h3>
            {unlocked && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
          </div>
          <p className={cn(
            "mt-1 text-xs leading-relaxed line-clamp-2",
            unlocked ? "text-slate-400" : "text-slate-600"
          )}>
            {isHidden ? "조건을 만족하면 공개됩니다." : achievement.description}
          </p>
          {!compact && (
            <div className="mt-2.5 flex items-center justify-between text-[10px] uppercase tracking-wider">
              <span className={cn("font-semibold", unlocked ? rarity.text : "text-slate-700")}>
                {unlocked ? rarity.label : "LOCKED"}
              </span>
              {unlocked && unlockedAt && (
                <span className="text-slate-500 font-mono">{new Date(unlockedAt).toLocaleDateString("ko-KR")}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
 *  ⓔ Titles Section
 * ════════════════════════════════════════════════════════════ */

const TitlesSection: React.FC<{
  titles: Title[];
  titleSet: Set<string>;
  equippedTitleId: string | null;
  onEquip: (id: string | null) => void;
}> = ({ titles, titleSet, equippedTitleId, onEquip }) => {
  const owned = titles.filter((t) => titleSet.has(t.id));
  const locked = titles.filter((t) => !titleSet.has(t.id));

  return (
    <div className="space-y-8">
      {/* 보유 */}
      <Panel title="보유 칭호" subtitle="대표 칭호로 설정해 프로필에 새기세요">
        {owned.length === 0 ? (
          <div className="py-10 text-center text-slate-600 text-sm">아직 획득한 칭호가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 미장착 옵션 */}
            <button
              onClick={() => onEquip(null)}
              className={cn(
                "rounded-2xl border-2 border-dashed p-4 text-left transition-all",
                !equippedTitleId
                  ? "border-amber-400/50 bg-amber-500/5"
                  : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              )}
            >
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">no title</div>
              <div className="text-sm text-slate-300">칭호 표시 안함</div>
              {!equippedTitleId && <div className="mt-2 text-[10px] text-amber-300 uppercase tracking-wider">● 선택됨</div>}
            </button>

            {owned.map((t) => (
              <TitleCard
                key={t.id}
                title={t}
                owned
                equipped={equippedTitleId === t.id}
                onClick={() => onEquip(t.id)}
              />
            ))}
          </div>
        )}
      </Panel>

      {/* 잠긴 */}
      <Panel title="미획득 칭호" subtitle="다음 위업을 향해">
        {locked.length === 0 ? (
          <div className="py-10 text-center text-emerald-400/70 text-sm">모든 칭호를 수집했습니다! 🎉</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locked.map((t) => <TitleCard key={t.id} title={t} owned={false} />)}
          </div>
        )}
      </Panel>
    </div>
  );
};

const TitleCard: React.FC<{
  title: Title;
  owned: boolean;
  equipped?: boolean;
  onClick?: () => void;
}> = ({ title, owned, equipped, onClick }) => {
  const r = RARITY_STYLE[title.rarity];
  return (
    <button
      onClick={onClick}
      disabled={!owned}
      className={cn(
        "relative rounded-2xl border p-4 text-left transition-all overflow-hidden group",
        owned ? cn("bg-gradient-to-br", r.bg, r.border, "hover:scale-[1.02] cursor-pointer") : "bg-black/40 border-white/5 cursor-not-allowed",
        equipped && "ring-2 ring-amber-400/60"
      )}
      style={owned ? { boxShadow: `0 0 18px ${r.glow}` } : {}}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn("text-[10px] font-bold tracking-widest uppercase", owned ? r.text : "text-slate-700")}>
          {r.label}
        </span>
        {equipped && (
          <span className="text-[9px] uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-400/30 rounded-full px-2 py-0.5">
            장착 중
          </span>
        )}
      </div>
      <div className={cn(
        "font-serif text-lg font-bold mb-1",
        owned ? "text-white" : "text-slate-600"
      )}
        style={owned && title.color ? { color: title.color } : undefined}
      >
        {owned ? title.name : "???"}
      </div>
      <p className={cn("text-xs leading-relaxed", owned ? "text-slate-400" : "text-slate-600")}>
        {owned ? title.description : "조건을 만족하면 공개됩니다."}
      </p>
    </button>
  );
};

/* ════════════════════════════════════════════════════════════
 *  ⓕ Hall of Fame Section
 * ════════════════════════════════════════════════════════════ */

const HallOfFameSection: React.FC<{ entries: HallEntry[] }> = ({ entries }) => {
  // 시즌별 그룹
  const grouped = useMemo(() => {
    const map = new Map<string, HallEntry[]>();
    for (const e of entries) {
      const arr = map.get(e.season_name) || [];
      arr.push(e);
      map.set(e.season_name, arr);
    }
    return Array.from(map.entries());
  }, [entries]);

  if (entries.length === 0) {
    return (
      <Panel title="Hall of Fame" subtitle="아직 기록된 시즌이 없습니다">
        <div className="py-16 text-center">
          <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <div className="text-slate-600 text-sm">첫 시즌이 끝나면 영웅들의 이름이 새겨집니다.</div>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([season, list]) => (
        <Panel key={season} title={season} subtitle="Season Champions" ornate>
          <div className="space-y-2">
            {list.sort((a, b) => a.rank - b.rank).map((e) => <HallRow key={e.id} entry={e} />)}
          </div>
        </Panel>
      ))}
    </div>
  );
};

const HallRow: React.FC<{ entry: HallEntry }> = ({ entry }) => {
  const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;
  const cat = entry.category === "points" ? "포인트" : entry.category === "weekly" ? "주간 활동" : entry.category === "support" ? "서폿 기여" : "참여율";
  const isFirst = entry.rank === 1;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all",
        isFirst
          ? "bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-amber-400/30 shadow-[0_0_24px_rgba(252,211,77,0.15)]"
          : "bg-white/[0.02] border-white/10 hover:bg-white/5"
      )}
    >
      <div className={cn("text-2xl sm:text-3xl w-10 text-center flex-shrink-0", isFirst && "drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]")}>
        {medal}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("font-semibold truncate", isFirst ? "text-amber-100" : "text-white")}>{entry.nickname}</div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mt-0.5">{cat}</div>
      </div>
      <div className={cn("font-mono text-sm sm:text-base tabular-nums", isFirst ? "text-amber-300" : "text-slate-300")}>
        {entry.category === "participation" ? `${entry.value}%` : formatNum(entry.value)}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
 *  ⓖ MVP Section (current season)
 * ════════════════════════════════════════════════════════════ */

const MVPSection: React.FC<{ rows: MVPRow[] }> = ({ rows }) => {
  const meta: Record<string, { label: string; icon: any; accent: string }> = {
    points:        { label: "포인트 챔피언",   icon: Gem,        accent: "#FCD34D" },
    weekly:        { label: "주간 활동왕",     icon: TrendingUp, accent: "#67E8F9" },
    support:       { label: "서폿의 정수",      icon: Heart,      accent: "#F472B6" },
    participation: { label: "출석의 화신",      icon: Target,     accent: "#A78BFA" },
  };

  return (
    <div className="space-y-5">
      <Panel title="Season MVP" subtitle="이번 시즌의 선두주자들" ornate>
        {rows.length === 0 ? (
          <div className="py-10 text-center text-slate-600 text-sm">시즌 데이터를 불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rows.map((r, i) => {
              const m = meta[r.category];
              if (!m) return null;
              const Icon = m.icon;
              return (
                <motion.div
                  key={r.category}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1018]/80 to-[#070912]/80 p-5 overflow-hidden group"
                  style={{ boxShadow: `0 0 30px ${m.accent}20` }}
                >
                  {/* 글로우 */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: m.accent }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center border border-white/10"
                          style={{ background: `radial-gradient(circle, ${m.accent}20, transparent 70%)` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: m.accent }} />
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{m.label}</div>
                      </div>
                      <span className="text-3xl drop-shadow-[0_0_8px_rgba(252,211,77,0.5)]">🥇</span>
                    </div>
                    <div className="font-serif text-2xl font-bold text-white truncate">{r.nickname}</div>
                    {r.rank_name && <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{r.rank_name}</div>}
                    <div className="mt-3 text-xl font-mono tabular-nums" style={{ color: m.accent }}>
                      {r.category === "participation" ? `${r.value}%` : `${formatNum(r.value)}${r.category === "points" ? " P" : r.category === "weekly" ? " 회" : " 점"}`}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
 *  ⓗ 공통 Panel
 * ════════════════════════════════════════════════════════════ */

const Panel: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; ornate?: boolean }> = ({ title, subtitle, children, ornate }) => (
  <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0d1a]/80 to-[#070912]/80 backdrop-blur-md overflow-hidden">
    {ornate && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />}
    <div className="p-5 sm:p-6">
      <header className="mb-5">
        <h3 className="font-serif text-lg sm:text-xl font-bold text-white">{title}</h3>
        {subtitle && <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 mt-1">{subtitle}</p>}
      </header>
      {children}
    </div>
  </div>
);

/* ════════ Corner Ornaments ════════ */
const CornerOrnaments: React.FC<{ accent: string }> = ({ accent }) => (
  <>
    {(["top-3 left-3", "top-3 right-3 rotate-90", "bottom-3 left-3 -rotate-90", "bottom-3 right-3 rotate-180"]).map((cls, i) => (
      <svg
        key={i}
        className={cn("absolute w-6 h-6 pointer-events-none opacity-50", cls)}
        viewBox="0 0 24 24"
        fill="none"
        stroke={accent}
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M2 8 L2 2 L8 2" />
        <path d="M2 12 L2 5" opacity="0.5" />
      </svg>
    ))}
  </>
);

/* ════════ Noise Overlay (SVG fract noise) ════════ */
const NoiseOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.4 }) => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay" style={{ opacity }}>
    <filter id="noiseFilter">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.08 0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
  </svg>
);

export default AchievementsPage;
