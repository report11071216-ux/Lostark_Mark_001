/* ────────────────────────────────────────────────────────────────────
 *  AchievementsPage.tsx  (v2 — DB 연동 버전)
 *  ─ 모든 텍스트/티어/레어도 컬러를 Supabase에서 읽어옴
 *  ─ 관리자 패널에서 변경하면 즉시 반영
 *  ─ DB 로드 실패 시 폴백 값으로 안정 동작
 * ──────────────────────────────────────────────────────────────────── */

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Crown,
  Sparkles,
  Lock,
  Check,
  Star,
  Flame,
  Swords,
  Heart,
  MessageCircle,
  Target,
  Award,
  ChevronRight,
  Search,
  TrendingUp,
  Zap,
  Gem,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
 *  타입
 * ════════════════════════════════════════════════════════════ */

type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

type Category = "all" | "raid" | "social" | "dedication" | "support" | "hidden";

type TierRow = {
  id: string;
  key: string;
  name: string;
  min_points: number;
  gradient_from: string;
  gradient_to: string;
  glow_color: string;
  accent_color: string;
  icon: string;
  flavor: string;
  sort_order: number;
  enabled: boolean;
};

type RarityRow = {
  id: string;
  key: Rarity;
  label: string;
  label_ko: string;
  text_color: string;
  border_color: string;
  bg_from: string;
  bg_to: string;
  glow_color: string;
  sort_order: number;
};

type PageConfig = {
  header_eyebrow: string;
  header_title: string;
  header_subtitle: string;
  tab_overview: string;
  tab_achievements: string;
  tab_titles: string;
  tab_hall: string;
  tab_mvp: string;
  hero_card_label: string;
  tier_roadmap_title: string;
  tier_roadmap_subtitle: string;
  recent_title: string;
  recent_subtitle: string;
  hall_title: string;
  hall_subtitle: string;
  mvp_title: string;
  mvp_subtitle: string;
  empty_achievements: string;
  empty_hall: string;
  empty_titles_owned: string;
  empty_titles_all: string;
  loading_text: string;
  primary_accent: string;
  secondary_accent: string;
  background_glow_1: string;
  background_glow_2: string;
  noise_enabled: boolean;
  ornament_enabled: boolean;
  medallion_animation: boolean;
};

type Achievement = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: Exclude<Category, "all">;
  rarity: Rarity;
  hidden: boolean;
  icon: string;
  reward_title_id?: string | null;
  threshold?: number | null;
  sort_order?: number;
};

type Title = {
  id: string;
  code: string;
  name: string;
  description: string;
  rarity: Rarity;
  color?: string | null;
  sort_order?: number;
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
  category: string;
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
 *  폴백 데이터 (DB 로드 실패 / 첫 렌더 시 사용)
 * ════════════════════════════════════════════════════════════ */

const FALLBACK_CONFIG: PageConfig = {
  header_eyebrow: "Halls of Renown",
  header_title: "명예의 전당",
  header_subtitle: "길드의 전사들이 새긴 발자국. 그대의 이름도 여기에 기록될 것이다.",
  tab_overview: "개요",
  tab_achievements: "업적",
  tab_titles: "칭호",
  tab_hall: "명예의 전당",
  tab_mvp: "시즌 MVP",
  hero_card_label: "Current Tier",
  tier_roadmap_title: "Tier Roadmap",
  tier_roadmap_subtitle: "모든 티어의 정점을 향해",
  recent_title: "Recent Achievements",
  recent_subtitle: "최근 새겨진 위업",
  hall_title: "Hall of Fame",
  hall_subtitle: "지난 시즌의 영웅들",
  mvp_title: "Season MVP",
  mvp_subtitle: "이번 시즌의 선두주자들",
  empty_achievements: "아직 달성한 업적이 없어요. 첫 발자국을 새겨보세요.",
  empty_hall: "아직 기록된 시즌이 없습니다.",
  empty_titles_owned: "아직 획득한 칭호가 없습니다.",
  empty_titles_all: "모든 칭호를 수집했습니다! 🎉",
  loading_text: "Loading Halls of Glory",
  primary_accent: "#F0B429",
  secondary_accent: "#A78BFA",
  background_glow_1: "#F0B429",
  background_glow_2: "#A78BFA",
  noise_enabled: true,
  ornament_enabled: true,
  medallion_animation: true,
};

const FALLBACK_TIERS: TierRow[] = [
  { id: "f1",  key: "iron",        name: "강철",         min_points: 0,    gradient_from: "#78716C", gradient_to: "#D6D3D1", glow_color: "rgba(168,162,158,0.35)", accent_color: "#A8A29E", icon: "⚙️",  flavor: "The First Step",      sort_order: 0, enabled: true },
  { id: "f2",  key: "bronze",      name: "동",           min_points: 100,  gradient_from: "#B45309", gradient_to: "#FBBF24", glow_color: "rgba(217,119,6,0.45)",   accent_color: "#D97706", icon: "🛡️",  flavor: "Hardened by Battle",  sort_order: 1, enabled: true },
  { id: "f3",  key: "silver",      name: "은",           min_points: 300,  gradient_from: "#94A3B8", gradient_to: "#F1F5F9", glow_color: "rgba(203,213,225,0.45)", accent_color: "#CBD5E1", icon: "⚔️",  flavor: "Steel and Will",      sort_order: 2, enabled: true },
  { id: "f4",  key: "gold",        name: "금",           min_points: 600,  gradient_from: "#F59E0B", gradient_to: "#FEF3C7", glow_color: "rgba(252,211,77,0.55)",  accent_color: "#FCD34D", icon: "🏅",  flavor: "Marked with Glory",   sort_order: 3, enabled: true },
  { id: "f5",  key: "platinum",    name: "플래티넘",     min_points: 1000, gradient_from: "#22D3EE", gradient_to: "#CFFAFE", glow_color: "rgba(103,232,249,0.55)", accent_color: "#67E8F9", icon: "💠",  flavor: "Beyond the Veil",     sort_order: 4, enabled: true },
  { id: "f6",  key: "diamond",     name: "다이아",       min_points: 1600, gradient_from: "#6366F1", gradient_to: "#E0F2FE", glow_color: "rgba(129,140,248,0.6)",  accent_color: "#818CF8", icon: "💎",  flavor: "Brilliance Forged",   sort_order: 5, enabled: true },
  { id: "f7",  key: "master",      name: "마스터",       min_points: 2400, gradient_from: "#8B5CF6", gradient_to: "#F5F3FF", glow_color: "rgba(167,139,250,0.65)", accent_color: "#A78BFA", icon: "🔮",  flavor: "Wielder of the Arts", sort_order: 6, enabled: true },
  { id: "f8",  key: "grandmaster", name: "그랜드마스터", min_points: 3600, gradient_from: "#D946EF", gradient_to: "#FCE7F3", glow_color: "rgba(232,121,249,0.7)",  accent_color: "#E879F9", icon: "👑",  flavor: "Beyond Mastery",      sort_order: 7, enabled: true },
  { id: "f9",  key: "legend",      name: "전설",         min_points: 5200, gradient_from: "#F97316", gradient_to: "#FCD34D", glow_color: "rgba(248,113,113,0.8)",  accent_color: "#F87171", icon: "🔥",  flavor: "Etched in Legend",    sort_order: 8, enabled: true },
  { id: "f10", key: "mythic",      name: "신화",         min_points: 7500, gradient_from: "#FDE047", gradient_to: "#67E8F9", glow_color: "rgba(244,114,182,0.9)",  accent_color: "#F472B6", icon: "✨",  flavor: "Born of Myth",        sort_order: 9, enabled: true },
];

const FALLBACK_RARITIES: Record<Rarity, RarityRow> = {
  common:    { id: "fr1", key: "common",    label: "COMMON",    label_ko: "일반", text_color: "#CBD5E1", border_color: "rgba(148,163,184,0.3)", bg_from: "rgba(30,41,59,0.6)",  bg_to: "rgba(15,23,42,0.6)",   glow_color: "rgba(148,163,184,0.15)", sort_order: 0 },
  rare:      { id: "fr2", key: "rare",      label: "RARE",      label_ko: "레어", text_color: "#7DD3FC", border_color: "rgba(56,189,248,0.4)",  bg_from: "rgba(12,74,110,0.4)", bg_to: "rgba(15,23,42,0.6)",   glow_color: "rgba(56,189,248,0.3)",   sort_order: 1 },
  epic:      { id: "fr3", key: "epic",      label: "EPIC",      label_ko: "에픽", text_color: "#C4B5FD", border_color: "rgba(167,139,250,0.5)", bg_from: "rgba(76,29,149,0.4)", bg_to: "rgba(15,23,42,0.6)",   glow_color: "rgba(167,139,250,0.4)",  sort_order: 2 },
  legendary: { id: "fr4", key: "legendary", label: "LEGENDARY", label_ko: "전설", text_color: "#FCD34D", border_color: "rgba(252,211,77,0.6)",  bg_from: "rgba(120,53,15,0.4)", bg_to: "rgba(15,23,42,0.7)",   glow_color: "rgba(252,211,77,0.5)",   sort_order: 3 },
  mythic:    { id: "fr5", key: "mythic",    label: "MYTHIC",    label_ko: "신화", text_color: "#F9A8D4", border_color: "rgba(244,114,182,0.6)", bg_from: "rgba(131,24,67,0.4)", bg_to: "rgba(76,29,149,0.4)",  glow_color: "rgba(244,114,182,0.6)",  sort_order: 4 },
};

/* ════════════════════════════════════════════════════════════
 *  Helpers
 * ════════════════════════════════════════════════════════════ */

const cn = (...a: any[]) => a.filter(Boolean).join(" ");

const formatNum = (n: number) => new Intl.NumberFormat("ko-KR").format(n);

const buildGradient = (from: string, to: string) =>
  `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;

const buildGradientH = (from: string, to: string) =>
  `linear-gradient(90deg, ${from} 0%, ${to} 100%)`;

const CATEGORIES_META: { key: Category; label: string; icon: any }[] = [
  { key: "all",        label: "전체",   icon: Sparkles },
  { key: "raid",       label: "레이드", icon: Swords },
  { key: "social",     label: "소셜",   icon: MessageCircle },
  { key: "dedication", label: "헌신",   icon: Flame },
  { key: "support",    label: "서포트", icon: Heart },
  { key: "hidden",     label: "비밀",   icon: Lock },
];

/* ════════════════════════════════════════════════════════════
 *  Props
 * ════════════════════════════════════════════════════════════ */

type Props = {
  user: any;
  profile: any;
  supabase: any;
  onProfileChanged?: () => void;
};

export const AchievementsPage: React.FC<Props> = ({ user, profile, supabase, onProfileChanged }) => {
  /* ─ View tab ─ */
  type View = "overview" | "achievements" | "titles" | "hall" | "mvp";
  const [view, setView] = useState<View>("overview");

  /* ─ DB Data ─ */
  const [config, setConfig] = useState<PageConfig>(FALLBACK_CONFIG);
  const [tiers, setTiers] = useState<TierRow[]>(FALLBACK_TIERS);
  const [rarities, setRarities] = useState<Record<Rarity, RarityRow>>(FALLBACK_RARITIES);
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

  /* ─ Derived: Tier 계산 ─ */
  const myPoints = Number(profile?.points || 0);
  const sortedTiers = useMemo(
    () => tiers.filter((t) => t.enabled).sort((a, b) => a.min_points - b.min_points),
    [tiers]
  );

  const myTier = useMemo(() => {
    let current = sortedTiers[0] || FALLBACK_TIERS[0];
    for (const t of sortedTiers) {
      if (myPoints >= t.min_points) current = t;
    }
    return current;
  }, [myPoints, sortedTiers]);

  const nextTier = useMemo(() => {
    return sortedTiers.find((t) => t.min_points > myPoints) || null;
  }, [myPoints, sortedTiers]);

  const tierProgress = useMemo(() => {
    if (!nextTier) return 1;
    const span = nextTier.min_points - myTier.min_points;
    const have = myPoints - myTier.min_points;
    return Math.max(0, Math.min(1, span > 0 ? have / span : 0));
  }, [myPoints, myTier, nextTier]);

  /* ─ 대표 칭호 ─ */
  const equippedTitleId: string | null = profile?.equipped_title_id || null;
  const equippedTitle = useMemo(
    () => titles.find((t) => t.id === equippedTitleId) || null,
    [titles, equippedTitleId]
  );

  /* ════════ DB 로드 ════════ */
  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [
        cfgRes, tierRes, rarityRes,
        aRes, tRes, uaRes, utRes, hRes,
      ] = await Promise.all([
        supabase.from("achievement_page_config").select("*").eq("id", 1).maybeSingle(),
        supabase.from("tiers").select("*").order("sort_order"),
        supabase.from("rarities").select("*").order("sort_order"),
        supabase.from("achievements").select("*").order("sort_order").order("category").order("title"),
        supabase.from("titles").select("*").order("sort_order").order("name"),
        user ? supabase.from("user_achievements").select("achievement_id, achieved_at, progress").eq("user_id", user.id) : Promise.resolve({ data: [] }),
        user ? supabase.from("user_titles").select("title_id, acquired_at").eq("user_id", user.id) : Promise.resolve({ data: [] }),
        supabase.from("season_results").select("id, season_name, category, rank, profile_id, nickname, value, achieved_at").order("achieved_at", { ascending: false }).limit(60),
      ]);

      if (cfgRes.data) setConfig({ ...FALLBACK_CONFIG, ...cfgRes.data });
      if (tierRes.data && tierRes.data.length > 0) setTiers(tierRes.data as TierRow[]);
      if (rarityRes.data && rarityRes.data.length > 0) {
        const map: Record<string, RarityRow> = {};
        for (const r of rarityRes.data as RarityRow[]) map[r.key] = r;
        setRarities({ ...FALLBACK_RARITIES, ...map } as Record<Rarity, RarityRow>);
      }
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

  /* ════════ 현재 시즌 MVP ════════ */
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
  const achievementSet = useMemo(() => new Set(myAchievements.map((m) => m.achievement_id)), [myAchievements]);
  const titleSet = useMemo(() => new Set(myTitles.map((m) => m.title_id)), [myTitles]);

  const visibleAchievements = useMemo(() => {
    const q = search.trim().toLowerCase();
    return achievements.filter((a) => {
      if (category === "hidden") {
        if (!a.hidden) return false;
      } else if (category !== "all" && a.category !== category) {
        return false;
      }
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
          <div className="text-amber-200/70 text-xs tracking-[0.4em] uppercase">{config.loading_text}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto px-3 sm:px-6 py-8 sm:py-16">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.12] blur-[120px]"
          style={{ background: `radial-gradient(circle, ${config.background_glow_1} 0%, transparent 60%)` }}
        />
        <div
          className="absolute -bottom-40 right-0 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[100px]"
          style={{ background: `radial-gradient(circle, ${config.background_glow_2} 0%, transparent 60%)` }}
        />
        {config.noise_enabled && <NoiseOverlay />}
      </div>

      {/* 페이지 헤더 */}
      <header className="text-center mb-10 sm:mb-14">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4"
          style={{ borderColor: `${config.primary_accent}50`, background: `${config.primary_accent}10` }}
        >
          <Crown className="w-3.5 h-3.5" style={{ color: config.primary_accent }} />
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.4em] font-semibold" style={{ color: `${config.primary_accent}cc` }}>
            {config.header_eyebrow}
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(to bottom, ${config.primary_accent}, ${config.primary_accent}99)` }}
          >
            {config.header_title}
          </span>
        </h1>
        <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-xl mx-auto whitespace-pre-line">
          {config.header_subtitle}
        </p>
      </header>

      {/* 내 영웅 카드 */}
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
        rarities={rarities}
        config={config}
      />

      {/* 뷰 탭 */}
      <ViewTabs view={view} setView={setView} config={config} accent={config.primary_accent} />

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
              sortedTiers={sortedTiers}
              rarities={rarities}
              config={config}
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
              rarities={rarities}
              config={config}
            />
          )}

          {view === "titles" && (
            <TitlesSection
              titles={titles}
              titleSet={titleSet}
              equippedTitleId={equippedTitleId}
              onEquip={equipTitle}
              rarities={rarities}
              config={config}
            />
          )}

          {view === "hall" && <HallOfFameSection entries={hall} config={config} />}

          {view === "mvp" && <MVPSection rows={mvp} config={config} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
 *  영웅 카드
 * ════════════════════════════════════════════════════════════ */

const MyHeroCard: React.FC<{
  nickname: string;
  points: number;
  tier: TierRow;
  nextTier: TierRow | null;
  progress: number;
  completedCount: number;
  totalCount: number;
  titlesCount: number;
  equippedTitle: Title | null;
  rarities: Record<Rarity, RarityRow>;
  config: PageConfig;
}> = ({ nickname, points, tier, nextTier, progress, completedCount, totalCount, titlesCount, equippedTitle, rarities, config }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-10 sm:mb-12"
    >
      <div
        className="absolute -inset-1 rounded-3xl opacity-60 blur-2xl"
        style={{ background: `radial-gradient(ellipse at center, ${tier.glow_color}, transparent 70%)` }}
      />
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0a0d1a]/95 via-[#0d1018]/95 to-[#070912]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {config.ornament_enabled && <CornerOrnaments accent={tier.accent_color} />}

        {/* 상단 라인 */}
        <div className="h-[2px] w-full" style={{ background: buildGradientH(tier.gradient_from, tier.gradient_to) }} />

        <div className="p-5 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
            {/* 좌측: 메달 */}
            <div className="relative flex-shrink-0 mx-auto md:mx-0">
              <TierMedallion tier={tier} animated={config.medallion_animation} noise={config.noise_enabled} />
            </div>

            {/* 우측 정보 */}
            <div className="flex-1 min-w-0 w-full">
              {equippedTitle ? (
                <div className="mb-2">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] sm:text-xs font-semibold tracking-wider uppercase"
                    style={{
                      borderColor: rarities[equippedTitle.rarity].border_color,
                      background: `linear-gradient(135deg, ${rarities[equippedTitle.rarity].bg_from}, ${rarities[equippedTitle.rarity].bg_to})`,
                      color: equippedTitle.color || rarities[equippedTitle.rarity].text_color,
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {equippedTitle.name}
                  </span>
                </div>
              ) : (
                <div className="mb-2 text-[10px] text-slate-600 uppercase tracking-[0.3em]">No Title Equipped</div>
              )}

              <h2 className="text-2xl sm:text-4xl font-bold text-white truncate">{nickname}</h2>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{config.hero_card_label}</span>
                <span
                  className="text-lg sm:text-xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: buildGradientH(tier.gradient_from, tier.gradient_to) }}
                >
                  {tier.name}
                </span>
                <span className="text-slate-600">·</span>
                <span className="font-mono text-sm" style={{ color: config.primary_accent }}>
                  {formatNum(points)} P
                </span>
              </div>

              {/* 진척 게이지 */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider mb-1.5">
                  {nextTier ? (
                    <>
                      <span className="text-slate-500">to {nextTier.name}</span>
                      <span className="text-slate-400 font-mono">{formatNum(nextTier.min_points - points)} P</span>
                    </>
                  ) : (
                    <span style={{ color: `${config.primary_accent}cc` }}>최고 티어 달성</span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden relative">
                  <motion.div
                    className="h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                      background: buildGradientH(tier.gradient_from, tier.gradient_to),
                      boxShadow: `0 0 16px ${tier.glow_color}`,
                    }}
                  />
                  <motion.div
                    className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "400%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                    style={{ mixBlendMode: "overlay" }}
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-5">
                <MiniStat icon={Award}  label="업적"   value={`${completedCount}/${totalCount}`} accent={config.primary_accent} />
                <MiniStat icon={Trophy} label="칭호"   value={`${titlesCount}`}                  accent={config.secondary_accent} />
                <MiniStat icon={Gem}    label="포인트" value={formatNum(points)}                  accent="#67E8F9" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

const TierMedallion: React.FC<{ tier: TierRow; animated: boolean; noise: boolean }> = ({ tier, animated, noise }) => {
  return (
    <div className="relative h-28 w-28 sm:h-32 sm:w-32">
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full opacity-70"
          style={{ background: `conic-gradient(from 0deg, transparent 0deg, ${tier.glow_color} 120deg, transparent 240deg)` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      )}
      <div className="absolute inset-1 rounded-full p-[2px]" style={{ background: buildGradient(tier.gradient_from, tier.gradient_to) }}>
        <div className="h-full w-full rounded-full bg-[#0a0d1a] flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 30% 30%, ${tier.glow_color}, transparent 60%)` }} />
          <span className="text-4xl sm:text-5xl drop-shadow-[0_0_12px_rgba(252,211,77,0.6)]">{tier.icon}</span>
          {noise && <NoiseOverlay opacity={0.3} />}
        </div>
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ icon: any; label: string; value: string; accent: string }> = ({ icon: Icon, label, value, accent }) => (
  <div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4 hover:bg-white/[0.05] transition-all">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500">{label}</span>
    </div>
    <div className="text-base sm:text-lg font-semibold text-white font-mono tabular-nums">{value}</div>
  </div>
);

/* ════════════════════════════════════════════════════════════
 *  탭
 * ════════════════════════════════════════════════════════════ */

const ViewTabs: React.FC<{ view: string; setView: (v: any) => void; config: PageConfig; accent: string }> = ({ view, setView, config, accent }) => {
  const tabs = [
    { key: "overview",     label: config.tab_overview,     icon: Star },
    { key: "achievements", label: config.tab_achievements, icon: Award },
    { key: "titles",       label: config.tab_titles,       icon: Crown },
    { key: "hall",         label: config.tab_hall,         icon: Trophy },
    { key: "mvp",          label: config.tab_mvp,          icon: Zap },
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
                  className="absolute inset-0 rounded-xl border"
                  style={{
                    background: `linear-gradient(135deg, ${accent}30, ${accent}10)`,
                    borderColor: `${accent}60`,
                    boxShadow: `0 4px 24px ${accent}25`,
                  }}
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
 *  Overview
 * ════════════════════════════════════════════════════════════ */

const OverviewSection: React.FC<{
  tier: TierRow;
  nextTier: TierRow | null;
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
  sortedTiers: TierRow[];
  rarities: Record<Rarity, RarityRow>;
  config: PageConfig;
}> = ({ tier, completionPct, completed, total, myTitles, totalTitles, recentAchievements, hall, onJump, sortedTiers, rarities, config }) => {
  return (
    <div className="space-y-8">
      <Panel title={config.tier_roadmap_title} subtitle={config.tier_roadmap_subtitle}>
        <TierRoadmap currentTier={tier} sortedTiers={sortedTiers} />
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Panel title="Achievement Progress" subtitle="업적 수집율">
          <div className="flex items-center gap-6">
            <RingProgress value={completionPct} accent={config.primary_accent} />
            <div className="flex-1">
              <div className="text-3xl font-bold text-white">
                {completed}<span className="text-slate-600 text-xl">/{total}</span>
              </div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">unlocked</div>
              <button
                onClick={() => onJump("achievements")}
                className="mt-3 inline-flex items-center gap-1 text-xs hover:opacity-80"
                style={{ color: config.primary_accent }}
              >
                업적 보러가기 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Title Collection" subtitle="수집한 칭호">
          <div className="flex items-center gap-6">
            <RingProgress value={totalTitles === 0 ? 0 : (myTitles / totalTitles) * 100} accent={config.secondary_accent} />
            <div className="flex-1">
              <div className="text-3xl font-bold text-white">
                {myTitles}<span className="text-slate-600 text-xl">/{totalTitles}</span>
              </div>
              <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">acquired</div>
              <button
                onClick={() => onJump("titles")}
                className="mt-3 inline-flex items-center gap-1 text-xs hover:opacity-80"
                style={{ color: config.secondary_accent }}
              >
                칭호 보러가기 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title={config.recent_title} subtitle={config.recent_subtitle}>
        {recentAchievements.length === 0 ? (
          <div className="py-10 text-center text-slate-600 text-sm">{config.empty_achievements}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentAchievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} unlocked unlockedAt={null} compact rarities={rarities} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title={config.hall_title} subtitle={config.hall_subtitle}>
        {hall.length === 0 ? (
          <div className="py-10 text-center text-slate-600 text-sm">{config.empty_hall}</div>
        ) : (
          <div className="space-y-2">
            {hall.map((h) => <HallRow key={h.id} entry={h} accent={config.primary_accent} />)}
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

const TierRoadmap: React.FC<{ currentTier: TierRow; sortedTiers: TierRow[] }> = ({ currentTier, sortedTiers }) => {
  const count = sortedTiers.length;
  const cols = count <= 5 ? "grid-cols-5" : "grid-cols-5 sm:grid-cols-10";
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-7 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent hidden sm:block" />
      <div className={`grid ${cols} gap-2 sm:gap-3`}>
        {sortedTiers.map((t) => {
          const isCurrent = t.key === currentTier.key;
          const reached = currentTier.min_points >= t.min_points;
          return (
            <div key={t.id} className="flex flex-col items-center gap-2 group">
              <div className={cn(
                "relative h-12 w-12 sm:h-14 sm:w-14 rounded-full transition-all",
                reached ? "scale-100" : "scale-90 grayscale opacity-40",
                isCurrent && "scale-110"
              )}>
                <div className="absolute inset-0 rounded-full p-[1.5px]" style={{ background: buildGradient(t.gradient_from, t.gradient_to) }}>
                  <div className="h-full w-full rounded-full bg-[#0a0d1a] flex items-center justify-center text-lg sm:text-xl">
                    {t.icon}
                  </div>
                </div>
                {isCurrent && (
                  <motion.div
                    className="absolute -inset-1 rounded-full border-2"
                    style={{ borderColor: `${t.accent_color}99` }}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.3, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              <div className="text-center">
                <div className={cn("text-[10px] sm:text-xs font-semibold leading-tight", reached ? "text-white" : "text-slate-600")}>{t.name}</div>
                <div className="text-[9px] text-slate-500 font-mono">{t.min_points}P</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
 *  Achievements
 * ════════════════════════════════════════════════════════════ */

const AchievementsSection: React.FC<{
  achievements: Achievement[];
  achievementSet: Set<string>;
  myAchievements: UserAchievement[];
  category: Category;
  setCategory: (c: Category) => void;
  search: string;
  setSearch: (s: string) => void;
  rarities: Record<Rarity, RarityRow>;
  config: PageConfig;
}> = ({ achievements, achievementSet, myAchievements, category, setCategory, search, setSearch, rarities, config }) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES_META.map((c) => {
            const Icon = c.icon;
            const active = category === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                style={
                  active
                    ? { background: `${config.primary_accent}25`, borderColor: `${config.primary_accent}60`, color: config.primary_accent }
                    : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.1)", color: "rgb(148,163,184)" }
                }
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
                <AchievementCard achievement={a} unlocked={unlocked} unlockedAt={at} rarities={rarities} />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AchievementCard: React.FC<{
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt: string | null;
  compact?: boolean;
  rarities: Record<Rarity, RarityRow>;
}> = ({ achievement, unlocked, unlockedAt, compact, rarities }) => {
  const isHidden = achievement.hidden && !unlocked;
  const rarity = rarities[achievement.rarity] || rarities.common;

  return (
    <div
      className={cn(
        "group relative rounded-2xl border overflow-hidden transition-all",
        unlocked ? "hover:scale-[1.02]" : "hover:border-white/15",
        compact ? "p-3" : "p-4"
      )}
      style={
        unlocked
          ? {
              borderColor: rarity.border_color,
              background: `linear-gradient(135deg, ${rarity.bg_from}, ${rarity.bg_to})`,
              boxShadow: `0 0 24px ${rarity.glow_color}`,
            }
          : { borderColor: "rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.4)" }
      }
    >
      {unlocked && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none">
          <div
            className="absolute -right-8 top-3 rotate-45 w-24 text-center text-[8px] font-bold tracking-widest py-0.5"
            style={{
              color: rarity.text_color,
              background: `linear-gradient(90deg, transparent, ${rarity.glow_color}, transparent)`,
            }}
          >
            {rarity.label}
          </div>
        </div>
      )}

      <div className={cn("flex gap-3", compact ? "flex-col items-center text-center" : "items-start")}>
        <div
          className={cn(
            "flex-shrink-0 flex items-center justify-center rounded-xl border",
            unlocked ? "" : "grayscale",
            compact ? "h-12 w-12 text-2xl" : "h-14 w-14 text-3xl"
          )}
          style={
            unlocked
              ? { borderColor: rarity.border_color, background: `radial-gradient(circle, ${rarity.glow_color}, transparent 70%)` }
              : { borderColor: "rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.4)" }
          }
        >
          {isHidden ? <Lock className="w-5 h-5 text-slate-600" /> : achievement.icon}
        </div>

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
          <p className={cn("mt-1 text-xs leading-relaxed line-clamp-2", unlocked ? "text-slate-400" : "text-slate-600")}>
            {isHidden ? "조건을 만족하면 공개됩니다." : achievement.description}
          </p>
          {!compact && (
            <div className="mt-2.5 flex items-center justify-between text-[10px] uppercase tracking-wider">
              <span className="font-semibold" style={unlocked ? { color: rarity.text_color } : { color: "rgb(51,65,85)" }}>
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
 *  Titles
 * ════════════════════════════════════════════════════════════ */

const TitlesSection: React.FC<{
  titles: Title[];
  titleSet: Set<string>;
  equippedTitleId: string | null;
  onEquip: (id: string | null) => void;
  rarities: Record<Rarity, RarityRow>;
  config: PageConfig;
}> = ({ titles, titleSet, equippedTitleId, onEquip, rarities, config }) => {
  const owned = titles.filter((t) => titleSet.has(t.id));
  const locked = titles.filter((t) => !titleSet.has(t.id));

  return (
    <div className="space-y-8">
      <Panel title="보유 칭호" subtitle="대표 칭호로 설정해 프로필에 새기세요">
        {owned.length === 0 ? (
          <div className="py-10 text-center text-slate-600 text-sm">{config.empty_titles_owned}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              onClick={() => onEquip(null)}
              className={cn(
                "rounded-2xl border-2 border-dashed p-4 text-left transition-all",
                !equippedTitleId
                  ? "bg-white/5"
                  : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              )}
              style={!equippedTitleId ? { borderColor: `${config.primary_accent}80`, background: `${config.primary_accent}10` } : {}}
            >
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-1">no title</div>
              <div className="text-sm text-slate-300">칭호 표시 안함</div>
              {!equippedTitleId && (
                <div className="mt-2 text-[10px] uppercase tracking-wider" style={{ color: config.primary_accent }}>● 선택됨</div>
              )}
            </button>
            {owned.map((t) => (
              <TitleCard key={t.id} title={t} owned equipped={equippedTitleId === t.id} onClick={() => onEquip(t.id)} rarities={rarities} accent={config.primary_accent} />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="미획득 칭호" subtitle="다음 위업을 향해">
        {locked.length === 0 ? (
          <div className="py-10 text-center text-emerald-400/70 text-sm">{config.empty_titles_all}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locked.map((t) => <TitleCard key={t.id} title={t} owned={false} rarities={rarities} accent={config.primary_accent} />)}
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
  rarities: Record<Rarity, RarityRow>;
  accent: string;
}> = ({ title, owned, equipped, onClick, rarities, accent }) => {
  const r = rarities[title.rarity] || rarities.common;
  return (
    <button
      onClick={onClick}
      disabled={!owned}
      className={cn(
        "relative rounded-2xl border p-4 text-left transition-all overflow-hidden",
        owned ? "hover:scale-[1.02] cursor-pointer" : "cursor-not-allowed"
      )}
      style={{
        borderColor: owned ? r.border_color : "rgba(255,255,255,0.05)",
        background: owned ? `linear-gradient(135deg, ${r.bg_from}, ${r.bg_to})` : "rgba(0,0,0,0.4)",
        boxShadow: owned ? `0 0 18px ${r.glow_color}` : "none",
        outline: equipped ? `2px solid ${accent}80` : "none",
        outlineOffset: equipped ? "2px" : 0,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold tracking-widest uppercase" style={owned ? { color: r.text_color } : { color: "rgb(51,65,85)" }}>
          {r.label}
        </span>
        {equipped && (
          <span className="text-[9px] uppercase tracking-wider rounded-full px-2 py-0.5 border" style={{ color: accent, background: `${accent}25`, borderColor: `${accent}60` }}>
            장착 중
          </span>
        )}
      </div>
      <div
        className={cn("text-lg font-bold mb-1", owned ? "" : "text-slate-600")}
        style={owned ? { color: title.color || "#FFFFFF" } : {}}
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
 *  Hall of Fame
 * ════════════════════════════════════════════════════════════ */

const HallOfFameSection: React.FC<{ entries: HallEntry[]; config: PageConfig }> = ({ entries, config }) => {
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
      <Panel title={config.hall_title} subtitle={config.empty_hall}>
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
        <Panel key={season} title={season} subtitle="Season Champions" ornate accent={config.primary_accent}>
          <div className="space-y-2">
            {list.sort((a, b) => a.rank - b.rank).map((e) => <HallRow key={e.id} entry={e} accent={config.primary_accent} />)}
          </div>
        </Panel>
      ))}
    </div>
  );
};

const HallRow: React.FC<{ entry: HallEntry; accent: string }> = ({ entry, accent }) => {
  const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;
  const cat = entry.category === "points" ? "포인트" : entry.category === "weekly" ? "주간 활동" : entry.category === "support" ? "서폿 기여" : "참여율";
  const isFirst = entry.rank === 1;

  return (
    <div
      className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border transition-all"
      style={
        isFirst
          ? {
              background: `linear-gradient(90deg, ${accent}18, ${accent}05 60%, transparent)`,
              borderColor: `${accent}50`,
              boxShadow: `0 0 24px ${accent}25`,
            }
          : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.1)" }
      }
    >
      <div className={cn("text-2xl sm:text-3xl w-10 text-center flex-shrink-0", isFirst && "drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]")}>
        {medal}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("font-semibold truncate", isFirst ? "text-amber-100" : "text-white")}>{entry.nickname}</div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mt-0.5">{cat}</div>
      </div>
      <div className="font-mono text-sm sm:text-base tabular-nums" style={isFirst ? { color: accent } : { color: "rgb(203,213,225)" }}>
        {entry.category === "participation" ? `${entry.value}%` : formatNum(entry.value)}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
 *  MVP
 * ════════════════════════════════════════════════════════════ */

const MVPSection: React.FC<{ rows: MVPRow[]; config: PageConfig }> = ({ rows, config }) => {
  const meta: Record<string, { label: string; icon: any; accent: string }> = {
    points:        { label: "포인트 챔피언", icon: Gem,        accent: config.primary_accent },
    weekly:        { label: "주간 활동왕",   icon: TrendingUp, accent: "#67E8F9" },
    support:       { label: "서폿의 정수",   icon: Heart,      accent: "#F472B6" },
    participation: { label: "출석의 화신",   icon: Target,     accent: config.secondary_accent },
  };

  return (
    <div className="space-y-5">
      <Panel title={config.mvp_title} subtitle={config.mvp_subtitle} ornate accent={config.primary_accent}>
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
                  className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1018]/80 to-[#070912]/80 p-5 overflow-hidden"
                  style={{ boxShadow: `0 0 30px ${m.accent}20` }}
                >
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
                    <div className="text-2xl font-bold text-white truncate">{r.nickname}</div>
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
 *  공통
 * ════════════════════════════════════════════════════════════ */

const Panel: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; ornate?: boolean; accent?: string }> = ({ title, subtitle, children, ornate, accent }) => (
  <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0d1a]/80 to-[#070912]/80 backdrop-blur-md overflow-hidden">
    {ornate && (
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent || "#F0B429"}99, transparent)` }}
      />
    )}
    <div className="p-5 sm:p-6">
      <header className="mb-5">
        <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
        {subtitle && <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 mt-1">{subtitle}</p>}
      </header>
      {children}
    </div>
  </div>
);

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
