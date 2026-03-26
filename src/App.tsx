

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Plus,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Settings,
  Image as ImageIcon,
  Send,
  Edit3,
  CalendarDays,
  Users,
  Sparkles,
  Swords,
  Trophy,
  BarChart3,
  Bell,
  Crown,
  Pin,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

const supabaseConfigError =
  !supabaseUrl || !supabaseKey
    ? "Vercel 환경변수(VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)가 비어 있습니다."
    : null;

if (supabaseConfigError) {
  console.error("Missing Supabase env:", {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseKey,
  });
}

const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });

const withTimeout = async <T,>(promise: Promise<T>, ms = 12000): Promise<T> => {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      window.setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
    ),
  ]);
};


const CACHE_KEYS = {
  posts: "inxx_cache_posts_v2",
  settings: "inxx_cache_settings_v2",
};

const readCache = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("cache read failed:", error);
    return fallback;
  }
};

const writeCache = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("cache write failed:", error);
  }
};

const getSupabaseOrThrow = () => {
  if (!supabase) {
    throw new Error(supabaseConfigError || "Supabase client is not initialized.");
  }
  return supabase;
};

type UserLike = any;
type ProfileLike = any;
type PostLike = any;
type ScheduleLike = any;
type ParticipantLike = any;

const RAID_EXPERIENCE_OPTIONS = ["트라이", "클경", "반숙", "숙련"];
const RAID_TYPE_OPTIONS = ["8인", "4인"];
const CONTENT_MODE_OPTIONS = ["raid", "anime"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const defaultSettings = {
  guild_name: "INXX",
  guild_description: "로스트아크 길드 홈페이지에 오신 것을 환영합니다.",
};

const emptyRaidForm = {
  raid_name: "",
  difficulty: "노말",
  raid_time: "20:00",
  raid_type: "8인",
  experience: "트라이",
  type: "raid",
};

const difficultyOptions = ["노말", "하드", "나이트메어"];

const classNameByMode = (mode: string) => {
  if (mode === "anime") {
    return {
      card: "from-emerald-900/30 to-teal-900/20 border-emerald-500/30 hover:border-emerald-400",
      badge: "text-emerald-300",
      bar: "bg-emerald-500",
      chip: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
    };
  }

  return {
    card: "from-purple-900/30 to-indigo-900/20 border-purple-500/30 hover:border-purple-400",
    badge: "text-purple-300",
    bar: "bg-purple-500",
    chip: "bg-purple-500/15 text-purple-300 border border-purple-500/20",
  };
};

const getCapacity = (raid: any) => {
  const maxParticipants =
    Number(raid.max_participants) ||
    (raid.raid_type === "4인" ? 4 : 8);

  if (raid.type === "anime") {
    return {
      maxParticipants,
      dealerLimit: maxParticipants,
      supportLimit: 0,
    };
  }

  return maxParticipants === 4
    ? { maxParticipants: 4, dealerLimit: 3, supportLimit: 1 }
    : { maxParticipants: 8, dealerLimit: 6, supportLimit: 2 };
};

const formatDate = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getWeekdayIndexMondayStart = (date: Date) => {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
};

const formatMonthLabel = (year: number, month: number) =>
  `${year}.${String(month + 1).padStart(2, "0")}`;

const formatShortDate = (date: string) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  return value.toLocaleDateString("ko-KR");
};

const safeSingle = async (builder: any) => {
  const { data, error } = await builder.maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return data;
};


const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
};

const toNumber = (value: any) => {
  const num = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(num) ? num : 0;
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");


type BadgeEffectKey = "none" | "violet" | "sunset" | "ocean" | "emerald" | "rose" | "gold";

type BadgeLike = {
  badge_item_id: string;
  badge_name: string;
  badge_color?: string | null;
  badge_card_effect?: BadgeEffectKey | string | null;
  badge_gradient_from?: string | null;
  badge_gradient_to?: string | null;
  badge_glow_color?: string | null;
};

const normalizeBadgeEffectKey = (value: any): BadgeEffectKey => {
  const normalized = String(value || "none").trim().toLowerCase();
  if (["violet", "sunset", "ocean", "emerald", "rose", "gold"].includes(normalized)) {
    return normalized as BadgeEffectKey;
  }
  return "none";
};

const hexToRgba = (hex: string | null | undefined, alpha = 1) => {
  const raw = String(hex || "").trim().replace("#", "");
  const normalized =
    raw.length === 3
      ? raw.split("").map((char) => char + char).join("")
      : raw.length === 6
      ? raw
      : "8b5cf6";

  const num = Number.parseInt(normalized, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const BADGE_CARD_EFFECT_PRESETS: Record<
  BadgeEffectKey,
  {
    label: string;
    from: string;
    to: string;
    glow: string;
    accent: string;
  }
> = {
  none: {
    label: "효과 없음",
    from: "#0f172a",
    to: "#111827",
    glow: "#8b5cf6",
    accent: "#c4b5fd",
  },
  violet: {
    label: "바이올렛 오라",
    from: "#7c3aed",
    to: "#312e81",
    glow: "#a78bfa",
    accent: "#ddd6fe",
  },
  sunset: {
    label: "선셋 플레어",
    from: "#fb7185",
    to: "#f59e0b",
    glow: "#fdba74",
    accent: "#ffe4e6",
  },
  ocean: {
    label: "오션 웨이브",
    from: "#06b6d4",
    to: "#2563eb",
    glow: "#67e8f9",
    accent: "#cffafe",
  },
  emerald: {
    label: "에메랄드 미스트",
    from: "#10b981",
    to: "#065f46",
    glow: "#6ee7b7",
    accent: "#d1fae5",
  },
  rose: {
    label: "로즈 블룸",
    from: "#ec4899",
    to: "#be185d",
    glow: "#f9a8d4",
    accent: "#fce7f3",
  },
  gold: {
    label: "골드 라이트",
    from: "#f59e0b",
    to: "#b45309",
    glow: "#fcd34d",
    accent: "#fef3c7",
  },
};

const getBadgeVisualTheme = (badge: any) => {
  const effectKey = normalizeBadgeEffectKey(badge?.badge_card_effect);
  const preset = BADGE_CARD_EFFECT_PRESETS[effectKey] || BADGE_CARD_EFFECT_PRESETS.none;
  const from = badge?.badge_gradient_from || badge?.gradient_from || preset.from;
  const to = badge?.badge_gradient_to || badge?.gradient_to || preset.to;
  const glow = badge?.badge_glow_color || badge?.glow_color || badge?.badge_color || preset.glow;
  const accent = badge?.badge_color || preset.accent;

  return {
    effectKey,
    label: preset.label,
    from,
    to,
    glow,
    accent,
    chipBackground: `linear-gradient(135deg, ${hexToRgba(from, 0.28)}, ${hexToRgba(to, 0.2)})`,
    chipBorder: hexToRgba(glow, 0.58),
    chipText: accent,
    cardBackground: `linear-gradient(135deg, ${hexToRgba(from, 0.3)} 0%, ${hexToRgba(to, 0.22)} 42%, rgba(15, 23, 42, 0.94) 100%)`,
    cardBorder: hexToRgba(glow, 0.5),
    cardShadow: `0 0 0 1px ${hexToRgba(glow, 0.16)} inset, 0 24px 48px ${hexToRgba(glow, 0.16)}`,
    aura: `radial-gradient(circle at top right, ${hexToRgba(glow, 0.3)} 0%, transparent 58%)`,
  };
};

const normalizeEquippedBadges = (input: any): BadgeLike[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((item: any) => {
        if (!item) return null;
        if (typeof item === "string") {
          return {
            badge_item_id: item,
            badge_name: item,
            badge_color: null,
            badge_card_effect: "none",
            badge_gradient_from: null,
            badge_gradient_to: null,
            badge_glow_color: null,
          };
        }
        return {
          badge_item_id: String(item.badge_item_id || item.id || item.badge_name || ""),
          badge_name: item.badge_name || item.name || item.label || "뱃지",
          badge_color: item.badge_color || item.color || null,
          badge_card_effect: item.badge_card_effect || item.card_effect || "none",
          badge_gradient_from: item.badge_gradient_from || item.gradient_from || null,
          badge_gradient_to: item.badge_gradient_to || item.gradient_to || null,
          badge_glow_color: item.badge_glow_color || item.glow_color || null,
        };
      })
      .filter(Boolean) as BadgeLike[];
  }

  if (typeof input === "string") {
    try {
      return normalizeEquippedBadges(JSON.parse(input));
    } catch {
      return input.trim()
        ? [{
            badge_item_id: input,
            badge_name: input,
            badge_color: null,
            badge_card_effect: "none",
            badge_gradient_from: null,
            badge_gradient_to: null,
            badge_glow_color: null,
          }]
        : [];
    }
  }

  return [];
};

const getCharacterBadges = (character: any): BadgeLike[] => {
  const equipped = normalizeEquippedBadges(character?.equipped_badges);
  const topLevelBadgeTheme = {
    badge_card_effect: character?.badge_card_effect || "none",
    badge_gradient_from: character?.badge_gradient_from || null,
    badge_gradient_to: character?.badge_gradient_to || null,
    badge_glow_color: character?.badge_glow_color || null,
  };

  if (equipped.length > 0) {
    return equipped.map((badge: any, index: number) => ({
      ...badge,
      badge_card_effect:
        badge?.badge_card_effect ||
        badge?.card_effect ||
        (index === 0 ? topLevelBadgeTheme.badge_card_effect : "none"),
      badge_gradient_from:
        badge?.badge_gradient_from ||
        badge?.gradient_from ||
        (index === 0 ? topLevelBadgeTheme.badge_gradient_from : null),
      badge_gradient_to:
        badge?.badge_gradient_to ||
        badge?.gradient_to ||
        (index === 0 ? topLevelBadgeTheme.badge_gradient_to : null),
      badge_glow_color:
        badge?.badge_glow_color ||
        badge?.glow_color ||
        (index === 0 ? topLevelBadgeTheme.badge_glow_color : null),
    }));
  }

  if (Array.isArray(character?.equipped_badge_names) && character.equipped_badge_names.length > 0) {
    return character.equipped_badge_names.map((name: string, index: number) => ({
      badge_item_id: `${name}-${index}`,
      badge_name: name,
      badge_color: null,
      badge_card_effect: index === 0 ? topLevelBadgeTheme.badge_card_effect : "none",
      badge_gradient_from: index === 0 ? topLevelBadgeTheme.badge_gradient_from : null,
      badge_gradient_to: index === 0 ? topLevelBadgeTheme.badge_gradient_to : null,
      badge_glow_color: index === 0 ? topLevelBadgeTheme.badge_glow_color : null,
    }));
  }

  if (character?.badge_name) {
    return [
      {
        badge_item_id: String(character.badge_item_id || character.equipped_badge_id || character.badge_name),
        badge_name: character.badge_name,
        badge_color: character.badge_color || null,
        badge_card_effect: character?.badge_card_effect || "none",
        badge_gradient_from: character?.badge_gradient_from || null,
        badge_gradient_to: character?.badge_gradient_to || null,
        badge_glow_color: character?.badge_glow_color || null,
      },
    ];
  }

  return [];
};

const getPrimaryBadgeTheme = (character: any) => {
  const badges = getCharacterBadges(character);
  const primaryBadge =
    badges.find((badge: any) => normalizeBadgeEffectKey(badge?.badge_card_effect) !== "none") ||
    badges[0] || {
      badge_color: character?.profile_theme || character?.theme_color || "#8b5cf6",
      badge_card_effect: "none",
      badge_gradient_from: character?.profile_theme || character?.theme_color || "#8b5cf6",
      badge_gradient_to: "#1f2937",
      badge_glow_color: character?.profile_theme || character?.theme_color || "#8b5cf6",
    };

  const theme = getBadgeVisualTheme(primaryBadge);
  return {
    primaryBadge,
    theme,
  };
};

const uploadGuildImage = async (file: File, userId: string) => {
  const client = getSupabaseOrThrow();
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await client.storage
    .from("guild-images")
    .upload(fileName, file, { upsert: true, contentType: file.type || undefined });

  if (error) throw error;

  const { data } = client.storage.from("guild-images").getPublicUrl(fileName);
  return data.publicUrl;
};

const createPreviewUrl = (file: File | null, fallback?: string | null) => {
  if (!file) return fallback || null;
  try {
    return URL.createObjectURL(file);
  } catch {
    return fallback || null;
  }
};


const HomeNoticeSection = ({ user, profile }: { user: UserLike; profile: ProfileLike }) => {
  const [notices, setNotices] = useState<PostLike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("is_notice", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error(error);
      setNotices([]);
    } else {
      setNotices(data || []);
    }
    setLoading(false);
  };

  return (
    <section className="max-w-7xl mx-auto px-6 pt-8 md:pt-12 pb-6">
      <div className="rounded-[2rem] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-white/5 to-transparent overflow-hidden">
        <div className="p-6 md:p-8 border-b border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300 text-[11px] font-black tracking-[0.2em] uppercase">
                <Bell size={14} />
                Guild Notice
              </div>
              <h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
                길드 공지사항
              </h2>
              <p className="mt-2 text-gray-400">
                히어로 섹션 대신 최신 공지와 고정 공지를 바로 보이게 했어.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-fit">
              <MiniStat label="공지" value={notices.length} />
              <MiniStat label="고정" value={notices.filter((x) => x.is_pinned).length} />
              <MiniStat label="권한" value={profile?.role === "admin" ? "관리자" : user ? "길드원" : "게스트"} />
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-3">
          {loading && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-gray-500">
              공지 불러오는 중...
            </div>
          )}

          {!loading && notices.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-gray-500">
              아직 등록된 공지가 없어.
            </div>
          )}

          {!loading &&
            notices.map((notice) => (
              <button
                key={notice.id}
                className={cn(
                  "w-full text-left rounded-2xl border p-4 md:p-5 transition hover:border-amber-400/40",
                  notice.is_pinned
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-white/5 border-white/10"
                )}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {notice.is_pinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/20">
                      <Pin size={12} />
                      PIN
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/20">
                    공지
                  </span>
                  <span className="text-xs text-gray-500">{formatDateTime(notice.created_at)}</span>
                </div>
                <div className="text-lg md:text-xl font-black">{notice.title}</div>
                <div className="mt-2 text-sm text-gray-300 line-clamp-2">{notice.content}</div>
              </button>
            ))}
        </div>
      </div>
    </section>
  );
};

const MiniStat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
    <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">{label}</div>
    <div className="mt-1 text-lg font-black">{value}</div>
  </div>
);




const formatInputDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const isShopItemAvailable = (item: any) => {
  const now = Date.now();
  const from = item?.available_from ? new Date(item.available_from).getTime() : null;
  const to = item?.available_to ? new Date(item.available_to).getTime() : null;
  if (!item?.is_active) return false;
  if (from && now < from) return false;
  if (to && now > to) return false;
  return true;
};

const getShopItemStatusText = (item: any) => {
  if (!item?.is_active) return "판매 중지";
  const now = Date.now();
  const from = item?.available_from ? new Date(item.available_from).getTime() : null;
  const to = item?.available_to ? new Date(item.available_to).getTime() : null;
  if (from && now < from) return `오픈 예정 · ${formatDateTime(item.available_from)}`;
  if (to && now > to) return "판매 종료";
  if (from || to) {
    return `판매 기간 · ${item.available_from ? formatDateTime(item.available_from) : "즉시"} ~ ${item.available_to ? formatDateTime(item.available_to) : "상시"}`;
  }
  return "상시 판매";
};

const BADGE_PRESET_COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#22c55e",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
];
export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState<UserLike>(null);
  const [profile, setProfile] = useState<ProfileLike>(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(supabaseConfigError);
  const [contentView, setContentView] = useState("레이드");
  const [posts, setPosts] = useState<PostLike[]>([]);
  const [settings, setSettings] = useState(defaultSettings);


useEffect(() => {
  let mounted = true;

  if (!supabase) {
    setLoading(false);
    return () => {
      mounted = false;
    };
  }

  const cachedPosts = readCache<PostLike[]>(CACHE_KEYS.posts, []);
  const cachedSettings = readCache<typeof defaultSettings>(CACHE_KEYS.settings, defaultSettings);

  if (cachedPosts.length > 0) {
    setPosts(cachedPosts);
  }

  if (cachedSettings) {
    setSettings({
      guild_name: cachedSettings.guild_name ?? defaultSettings.guild_name,
      guild_description: cachedSettings.guild_description ?? defaultSettings.guild_description,
    });
  }

  const init = async () => {
    const client = getSupabaseOrThrow();
    const loadingGuard = window.setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 1200);

    try {
      let currentUser: any = null;

      try {
        const sessionResult = await withTimeout(client.auth.getSession(), 2500);
        const sessionError = sessionResult.error;

        if (sessionError) {
          console.error("getSession error:", sessionError);
        }

        currentUser = sessionResult.data.session?.user ?? null;
      } catch (error) {
        console.error("getSession timeout or failure:", error);
        currentUser = null;
      }

      if (!mounted) return;

      setUser(currentUser);

      if (currentUser) {
        void fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      void fetchInitialData();

      if (mounted) {
        setBootError(null);
      }
    } catch (error: any) {
      console.error("App init error:", error);

      if (mounted) {
        setBootError(null);
      }
    } finally {
      window.clearTimeout(loadingGuard);

      if (mounted) {
        setLoading(false);
      }
    }
  };

  init();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        void fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        void fetchInitialData();
      }
    } catch (error) {
      console.error("Auth state change error:", error);
    }
  });

  return () => {
    mounted = false;
    subscription?.unsubscribe();
  };
}, []);

 

  const fetchProfile = async (userId: string) => {
    try {
      const client = getSupabaseOrThrow();
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("fetchProfile error:", error);
        return;
      }

      if (data) setProfile(data);
      else setProfile(null);
    } catch (error) {
      console.error("fetchProfile unexpected error:", error);
    }
  };


const fetchInitialData = async () => {
  try {
    const client = getSupabaseOrThrow();

    const [postsRes, settingsRes] = await Promise.allSettled([
      client.from("posts").select("*").order("created_at", { ascending: false }),
      client.from("settings").select("*").limit(1).maybeSingle(),
    ]);

    if (postsRes.status === "fulfilled") {
      const { data, error } = postsRes.value;
      if (error) {
        console.error("posts fetch error:", error);
      } else if (Array.isArray(data)) {
        setPosts(data);
        writeCache(CACHE_KEYS.posts, data);
      }
    } else {
      console.error("posts fetch failed:", postsRes.reason);
    }

    if (settingsRes.status === "fulfilled") {
      const { data, error } = settingsRes.value;
      if (error) {
        console.error("settings fetch error:", error);
      } else if (data) {
        const nextSettings = {
          guild_name: data.guild_name ?? defaultSettings.guild_name,
          guild_description:
            data.guild_description ?? defaultSettings.guild_description,
        };

        setSettings(nextSettings);
        writeCache(CACHE_KEYS.settings, nextSettings);
      }
    } else {
      console.error("settings fetch failed:", settingsRes.reason);
    }
  } catch (error) {
    console.error("fetchInitialData unexpected error:", error);
  }
};

  const handleLogout = async () => {
    const client = getSupabaseOrThrow();
    await client.auth.signOut();
    setUser(null);
    setProfile(null);
    setActiveTab("home");
  };

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center text-purple-300 font-black italic">
          INXX SYSTEM LOADING...
        </div>
      </PageShell>
    );
  }

  if (bootError) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-2xl rounded-[2rem] border border-red-500/30 bg-red-950/20 p-8 text-left">
            <div className="text-[11px] font-black tracking-[0.3em] uppercase text-red-300">
              Boot Error
            </div>
            <h1 className="mt-3 text-3xl font-black">홈페이지 초기화 실패</h1>
            <p className="mt-4 text-sm leading-6 text-gray-300">
              {bootError}
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-gray-400">
              Vercel 프로젝트 환경변수와 Supabase 연결값을 다시 확인한 뒤 재배포하세요.
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="relative z-10">
        {profile?.role === "admin" && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-purple-900 to-red-900 text-[10px] font-black py-1 text-center tracking-[0.3em] uppercase">
            👑 Administrator Session Active
          </div>
        )}

        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          profile={profile}
          onLogout={handleLogout}
        />

        <main className={profile?.role === "admin" ? "pt-20" : "pt-16"}>
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <HomeNoticeSection user={user} profile={profile} />
                <RaidCalendar user={user} profile={profile} />

                <div className="max-w-7xl mx-auto px-6 mb-12">
                  <div className="flex justify-center gap-6 md:gap-12 border-b border-white/5 pb-6 overflow-x-auto">
                    {["레이드", "가디언 토벌", "클래스"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setContentView(tab)}
                        className={`text-lg md:text-xl font-black italic uppercase transition-all whitespace-nowrap ${
                          contentView === tab
                            ? "text-purple-400 scale-105 underline underline-offset-8"
                            : "text-gray-600 hover:text-gray-400"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <MainContentViewer type={contentView} />
              </motion.div>
            )}

            {activeTab === "posts" && (
              <motion.div
                key="posts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PostBoard posts={posts} user={user} profile={profile} onRefresh={fetchInitialData} />
              </motion.div>
            )}

            {activeTab === "myroom" && (
              <motion.div
                key="myroom"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MyRoom user={user} profile={profile} />
              </motion.div>
            )}

            {activeTab === "guild" && (
              <motion.div
                key="guild"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GuildMembersPage />
              </motion.div>
            )}

            {activeTab === "ranking" && (
              <motion.div
                key="ranking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RankingPage user={user} profile={profile} />
              </motion.div>
            )}

            {activeTab === "shop" && (
              <motion.div
                key="shop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PointShopPage user={user} profile={profile} />
              </motion.div>
            )}

            {activeTab === "admin" && profile?.role === "admin" && (
              <motion.div
                key="admin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AdminPanel settings={settings} setSettings={setSettings} user={user} profile={profile} />
              </motion.div>
            )}

            {(activeTab === "login" || activeTab === "signup") && (
              <motion.div
                key="auth"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Auth mode={activeTab} setMode={setActiveTab} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </PageShell>
  );
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen relative overflow-hidden bg-[#05070d] text-white font-sans selection:bg-purple-500/30">
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,101,242,0.20),_transparent_30%),radial-gradient(circle_at_20%_80%,_rgba(168,85,247,0.16),_transparent_26%),radial-gradient(circle_at_80%_30%,_rgba(59,130,246,0.14),_transparent_22%)]" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 0.8px, transparent 0.8px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -top-24 left-[8%] h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute top-[18%] right-[6%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/16 blur-3xl" />
      <div className="absolute bottom-[-120px] left-[28%] h-[520px] w-[520px] rounded-full bg-sky-500/16 blur-3xl" />
    </div>
    {children}
  </div>
);

const Hero = ({ settings }: any) => {
  return (
    <section className="relative h-[58vh] md:h-[72vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.20),transparent_25%),radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.18),transparent_28%),linear-gradient(180deg,rgba(5,7,13,0.1),rgba(5,7,13,0.88))]" />

      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-purple-500/5 text-purple-300 text-[10px] font-black mb-6 border border-purple-500/10 tracking-[0.35em] uppercase italic">
            <Sparkles size={12} />
            Lost Ark Guild System
          </span>

          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 font-mono leading-none">
            {settings?.guild_name}
          </h1>

          <p className="text-gray-300 text-base md:text-xl max-w-2xl mx-auto font-bold italic uppercase tracking-tight opacity-80">
            {settings?.guild_description}
          </p>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </section>
  );
};


const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: any) => {
  const navItems = [
    { id: "home", label: "홈" },
    { id: "posts", label: "게시판" },
    { id: "ranking", label: "랭킹" },
    { id: "guild", label: "길드" },
    ...(user ? [{ id: "shop", label: "포인트샵" }, { id: "myroom", label: "마이룸" }] : []),
    ...(profile?.role === "admin" ? [{ id: "admin", label: "관리자" }] : []),
    ...(user ? [] : [{ id: "login", label: "로그인" }, { id: "signup", label: "회원가입" }]),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setActiveTab("home")}
        >
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase font-mono italic">
            INXX
          </span>
        </div>

        <div className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`text-xs font-black tracking-[0.2em] transition-all uppercase ${
                activeTab === item.id
                  ? "text-purple-400"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
          {user && (
            <button
              onClick={onLogout}
              className="text-xs font-black text-gray-500 hover:text-red-400 uppercase tracking-widest transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};


const ImageUploader = ({
  onUpload,
  label,
  bucket = "images",
  folder = "contents",
}: {
  onUpload: (url: string) => void;
  label: string;
  bucket?: string;
  folder?: string;
}) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: any) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onUpload(data.publicUrl);
    } catch (err: any) {
      console.error("Upload Error:", err);
      alert(`이미지 업로드 실패: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 text-left">
      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          id={`file-${label.replace(/\s+/g, "-")}`}
          disabled={uploading}
        />
        <label
          htmlFor={`file-${label.replace(/\s+/g, "-")}`}
          className="flex items-center justify-center gap-3 w-full bg-black border border-white/10 p-4 rounded-2xl cursor-pointer hover:border-purple-500 transition-all text-xs font-black text-gray-500 group-hover:text-white"
        >
          {uploading ? (
            "UPLOADING..."
          ) : (
            <>
              <ImageIcon size={16} />
              {label} 업로드
            </>
          )}
        </label>
      </div>
    </div>
  );
};

const AdminInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: any) => (
  <div className="space-y-3 text-left w-full">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-purple-500 font-bold text-sm text-white transition-all"
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  </div>
);

const SectionPanel = ({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-[#0d111c]/80 border border-white/10 rounded-[2rem] p-6 md:p-8">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h3 className="text-2xl font-black tracking-tight">{title}</h3>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const MainContentViewer = ({ type }: { type: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (type === "클래스") {
          const { data, error } = await supabase
            .from("class_infos")
            .select("*")
            .order("sub_class");
          if (error) {
            console.error(error);
            setItems([]);
            return;
          }
          setItems(data || []);
        } else {
          const { data, error } = await supabase
            .from("contents")
            .select("*")
            .eq("category", type)
            .order("created_at", { ascending: false });

          if (error) {
            console.error(error);
            setItems([]);
            return;
          }

          setItems(data || []);
        }
      } catch (error) {
        console.error("fetchData error:", error);
        setItems([]);
      }
    };

    fetchData();
  }, [type]);

  return (
    <section className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 py-10">
      {items.length === 0 && (
        <div className="col-span-full text-center text-gray-600 font-black italic py-10 uppercase">
          No Contents Registered.
        </div>
      )}

      {items.map((item) => (
        <motion.div
          whileHover={{ y: -5 }}
          key={item.id ?? item.sub_class}
          onClick={() => setSelectedItem(item)}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black aspect-square cursor-pointer shadow-xl"
        >
          <img
            src={
              item.image_url ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e"
            }
            className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-left">
            <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest mb-1 block italic">
              {type}
            </span>
            <h3 className="text-sm font-black italic uppercase tracking-tighter leading-tight truncate">
              {item.name || item.sub_class}
            </h3>
          </div>
        </motion.div>
      ))}

      <AnimatePresence>
        {selectedItem && (
          <DetailPopup item={selectedItem} type={type} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </section>
  );
};

const DetailPopup = ({ item, type, onClose }: any) => {
  const [gate, setGate] = useState(1);
  const [diff, setDiff] = useState("노말");
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    if (type === "클래스") return;

    const fetchDetail = async () => {
      try {
        let query = supabase.from("content_details").select("*").eq("content_id", item.id);

        if (type === "레이드") {
          query = query.eq("difficulty", diff).eq("gate_num", gate);
        } else {
          query = query.eq("gate_num", 0);
        }

        const data = await safeSingle(query);
        setDetails(data);
      } catch (error) {
        console.error("fetchDetail error:", error);
        setDetails(null);
      }
    };

    fetchDetail();
  }, [gate, diff, item, type]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-left"
    >
      <div className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
        >
          <X size={32} />
        </button>

        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <img
            src={
              item.image_url ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e"
            }
            className="w-full md:w-48 h-48 object-cover rounded-3xl border border-white/10 shadow-2xl"
          />
          <div className="flex flex-col justify-end">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase text-purple-500 mb-2">
              {item.name || item.sub_class}
            </h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest italic">
              {type} Specification
            </p>
          </div>
        </div>

        {type === "레이드" && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5 flex-wrap">
              {[1, 2, 3, 4].map((g) => (
                <button
                  key={g}
                  onClick={() => setGate(g)}
                  className={`px-6 py-2 rounded-lg font-black transition-all ${
                    gate === g
                      ? "bg-purple-600 shadow-lg shadow-purple-600/20"
                      : "text-gray-500"
                  }`}
                >
                  {g}관문
                </button>
              ))}
            </div>

            <div className="flex gap-2 p-1 bg-black rounded-xl border border-white/5 flex-wrap">
              {difficultyOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => setDiff(d)}
                  className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${
                    diff === d ? "bg-white text-black" : "text-gray-500"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {type === "클래스" ? (
            <>
              <StatCard label="직업 각인" value={item.engraving_job || "-"} />
              <StatCard
                label="공용 각인"
                value={item.engraving_common?.join(", ") || "-"}
                wide
              />
              <StatCard
                label="아크 패시브"
                value={item.ark_passive?.join(" / ") || "-"}
                full
              />
            </>
          ) : details ? (
            <>
              <StatCard label="HP (체력)" value={details.hp || "-"} />
              <StatCard label="계열" value={details.element_type || "-"} />
              <StatCard label="속성" value={details.attribute || "-"} />
              <div className="p-6 bg-white/5 rounded-2xl border border-purple-500/20 md:col-span-3">
                <label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">
                  클리어 골드
                </label>
                <div className="text-2xl font-black text-yellow-400">
                  {details.clear_gold?.toLocaleString() || "0"} G
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-3 py-20 text-center text-gray-700 font-black italic uppercase tracking-widest">
              데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({
  label,
  value,
  wide = false,
  full = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
  full?: boolean;
}) => (
  <div
    className={`p-6 bg-white/5 rounded-2xl border border-white/5 ${
      full ? "md:col-span-3" : wide ? "md:col-span-2" : ""
    }`}
  >
    <label className="text-[10px] font-black text-purple-500/50 uppercase tracking-widest mb-2 block italic">
      {label}
    </label>
    <div className="text-lg font-black">{value}</div>
  </div>
);

const RaidCalendar = ({ user, profile }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [raids, setRaids] = useState<ScheduleLike[]>([]);
  const [participants, setParticipants] = useState<ParticipantLike[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRaid, setSelectedRaid] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDate = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = getWeekdayIndexMondayStart(firstDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    fetchCalendarData();
  }, [year, month]);

  const fetchCalendarData = async () => {
    setCalendarLoading(true);

    try {
      const monthStart = formatDate(year, month, 1);
      const monthEnd = formatDate(year, month, daysInMonth);

      const { data: rData, error: raidError } = await supabase
        .from("raid_schedules")
        .select("*")
        .gte("raid_date", monthStart)
        .lte("raid_date", monthEnd)
        .order("raid_date", { ascending: true })
        .order("raid_time", { ascending: true });

      if (raidError) {
        console.error("raid_schedules fetch error:", raidError);
        setRaids([]);
        setParticipants([]);
        return;
      }

      const scheduleIds = (rData || []).map((r: any) => r.id);

      let pData: any[] = [];
      if (scheduleIds.length > 0) {
        const { data, error: participantError } = await supabase
          .from("raid_participants")
          .select("*")
          .in("schedule_id", scheduleIds);

        if (participantError) {
          console.error("raid_participants fetch error:", participantError);
        } else {
          pData = data || [];
        }
      }

      setRaids(rData || []);
      setParticipants(pData || []);
    } catch (error) {
      console.error("fetchCalendarData error:", error);
      setRaids([]);
      setParticipants([]);
    } finally {
      setCalendarLoading(false);
    }
  };

  const monthStats = useMemo(() => {
    const totalRaids = raids.length;
    const totalParticipants = participants.length;
    const fullCount = raids.filter((raid) => {
      const raidParticipants = participants.filter((p) => p.schedule_id === raid.id);
      return raidParticipants.length >= getCapacity(raid).maxParticipants;
    }).length;

    return { totalRaids, totalParticipants, fullCount };
  }, [raids, participants]);

  const monthlyCharacterStats = useMemo(() => {
    const map = new Map<string, { nickname: string; count: number; raidCount: number }>();

    participants.forEach((participant: any) => {
      const nickname = (participant.character_name || "이름없음").trim();
      const existing = map.get(nickname) || {
        nickname,
        count: 0,
        raidCount: 0,
      };

      existing.count += 1;
      map.set(nickname, existing);
    });

    raids.forEach((raid) => {
      const raidParticipants = participants.filter((p: any) => p.schedule_id === raid.id);
      const uniqueNicknames = Array.from(
        new Set(raidParticipants.map((p: any) => (p.character_name || "이름없음").trim()))
      );

      uniqueNicknames.forEach((nickname) => {
        const existing = map.get(nickname) || { nickname, count: 0, raidCount: 0 };
        existing.raidCount += 1;
        map.set(nickname, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.raidCount !== a.raidCount) return b.raidCount - a.raidCount;
      if (b.count !== a.count) return b.count - a.count;
      return a.nickname.localeCompare(b.nickname, "ko");
    });
  }, [participants, raids]);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 border-t border-white/5">
      <div className="grid lg:grid-cols-[1.2fr,0.8fr] gap-6 mb-8">
        <SectionPanel
          title="Raid Calendar"
          description="월별 레이드 일정."
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-3 border border-white/10 rounded-xl hover:border-purple-400 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-3 border border-white/10 rounded-xl hover:border-purple-400 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          }
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="text-[11px] text-purple-300 uppercase tracking-[0.3em] font-black mb-2">
                Monthly View
              </div>
              <h2 className="text-4xl font-black italic">{formatMonthLabel(year, month)}</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <SummaryChip icon={<CalendarDays size={14} />} label="일정" value={monthStats.totalRaids} />
              <SummaryChip icon={<Users size={14} />} label="참여" value={monthStats.totalParticipants} />
              <SummaryChip icon={<Trophy size={14} />} label="마감" value={monthStats.fullCount} />
            </div>
          </div>
        </SectionPanel>

        <SectionPanel
          title="월별 참여 랭킹"
          description="이번 달 기준 캐릭터 닉네임별 참가 횟수와 참가 등록 수를 볼 수 있어."
        >
          <div className="space-y-3">
            {monthlyCharacterStats.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-gray-500">
                아직 이번 달 참여 데이터가 없어.
              </div>
            )}

            {monthlyCharacterStats.slice(0, 6).map((item, index) => (
              <div
                key={item.nickname}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-sm font-black text-purple-300 shrink-0">
                    #{index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black truncate">{item.nickname}</div>
                    <div className="text-xs text-gray-500">월간 레이드 참여 요약</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-white">{item.raidCount}회</div>
                  <div className="text-xs text-gray-500">등록 {item.count}건</div>
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      </div>

      <div className="grid xl:grid-cols-[1.35fr,0.65fr] gap-6">
        <div className="bg-slate-950/55 rounded-[2rem] md:rounded-[3rem] border border-white/10 backdrop-blur-xl overflow-hidden shadow-[0_0_50px_rgba(99,102,241,0.08)]">
          <div className="grid grid-cols-7 text-center text-[10px] md:text-xs text-gray-500 border-b border-white/5 uppercase tracking-[0.2em]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayLabel) => (
              <div key={dayLabel} className="p-4">
                {dayLabel}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-[1px] bg-white/5">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-[#0a0a0a] min-h-[150px] md:min-h-[180px]" />
            ))}

            {days.map((day) => {
              const dateStr = formatDate(year, month, day);
              const dayRaids = raids.filter((raid) => raid.raid_date === dateStr);
              const today = new Date();
              const isToday = isSameDay(new Date(year, month, day), today);

              return (
                <div
                  key={day}
                  className={`min-h-[150px] md:min-h-[180px] p-3 border transition-all ${
                    isToday
                      ? "bg-purple-900/30 border-purple-500 shadow-lg shadow-purple-500/10"
                      : "bg-[#0a0a0a] border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div
                        className={`text-sm font-black ${
                          isToday ? "text-purple-300" : "text-gray-400"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="text-[10px] text-gray-600 uppercase tracking-widest">
                        {DAY_LABELS[new Date(year, month, day).getDay()]}
                      </div>
                    </div>

                    {profile?.role === "admin" && (
                      <button
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setIsCreateOpen(true);
                        }}
                        className="text-purple-300 hover:text-white transition"
                        title="레이드 생성"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {dayRaids.length === 0 && (
                      <div className="text-[11px] text-gray-600 font-bold rounded-xl border border-dashed border-white/5 px-3 py-4 text-center">
                        일정 없음
                      </div>
                    )}

                    {dayRaids.map((raid) => (
                      <RaidCard
                        key={raid.id}
                        raid={raid}
                        parts={participants.filter((p) => p.schedule_id === raid.id)}
                        onOpen={() => setSelectedRaid(raid)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <SectionPanel
          title="월별 통계 보드"
          description="이번 달 참여 많이 한 캐릭터를 전체로 확인할 수 있어."
        >
          {calendarLoading ? (
            <div className="py-12 text-center text-gray-500 font-bold">불러오는 중...</div>
          ) : monthlyCharacterStats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-gray-500">
              집계할 참여 데이터가 없어.
            </div>
          ) : (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {monthlyCharacterStats.map((item, index) => (
                <div
                  key={item.nickname}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <BarChart3 size={16} className="text-purple-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black truncate">
                          #{index + 1} {item.nickname}
                        </div>
                        <div className="text-xs text-gray-500">
                          월간 레이드 참여 횟수 {item.raidCount}회
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-purple-300">{item.raidCount}</div>
                      <div className="text-[11px] text-gray-500">raid count</div>
                    </div>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{
                        width: `${
                          monthlyCharacterStats[0]?.raidCount
                            ? (item.raidCount / monthlyCharacterStats[0].raidCount) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 text-xs text-gray-400">
                    참가 등록 총 {item.count}건
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionPanel>
      </div>

      <AnimatePresence>
        {isCreateOpen && (
          <CreateRaidModal
            date={selectedDate}
            onRefresh={fetchCalendarData}
            onClose={() => setIsCreateOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRaid && (
          <RaidDetailModal
            raid={selectedRaid}
            parts={participants.filter((p) => p.schedule_id === selectedRaid.id)}
            user={user}
            profile={profile}
            onClose={() => setSelectedRaid(null)}
            onRefresh={async () => {
              await fetchCalendarData();
              setSelectedRaid(null);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

const SummaryChip = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
    <div className="flex items-center gap-2 text-purple-300 text-[11px] font-black uppercase tracking-widest mb-1">
      {icon}
      {label}
    </div>
    <div className="text-2xl font-black">{value}</div>
  </div>
);

const InfoMiniCard = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
      {title}
    </div>
    <div className="text-base font-black text-white">{value}</div>
  </div>
);

const RaidCard = ({
  raid,
  parts,
  onOpen,
}: {
  raid: any;
  parts: any[];
  onOpen: () => void;
}) => {
  const colors = classNameByMode(raid.type);
  const capacity = getCapacity(raid);
  const percent = Math.min(100, (parts.length / capacity.maxParticipants) * 100);
  const isFull = parts.length >= capacity.maxParticipants;

  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      onClick={onOpen}
      className={`w-full relative p-3 rounded-2xl cursor-pointer text-left border bg-gradient-to-br shadow-lg transition-all ${colors.card} ${
        isFull ? "border-red-500/50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`text-[10px] font-black uppercase tracking-widest ${colors.badge}`}>
          {raid.type === "anime" ? "📺 시청" : `${raid.raid_type} · ${raid.difficulty}`}
        </span>
        <span className={`text-[10px] font-black ${isFull ? "text-red-300" : "text-gray-400"}`}>
          {parts.length}/{capacity.maxParticipants}
          {isFull ? " FULL" : ""}
        </span>
      </div>

      <div className="text-sm font-black text-white leading-tight truncate">
        {raid.raid_name}
      </div>

      <div className="flex flex-wrap gap-2 mt-2 mb-3">
        {raid.experience && raid.type !== "anime" && (
          <span className={colors.chip}>🎯 {raid.experience}</span>
        )}
        <span className="bg-white/5 text-gray-300 border border-white/10 text-[10px] px-2 py-1 rounded-full">
          <Clock size={10} className="inline mr-1" />
          {raid.raid_time}
        </span>
      </div>

      <div className="mt-2 h-[5px] bg-black/40 rounded-full overflow-hidden">
        <div style={{ width: `${percent}%` }} className={`h-full ${isFull ? "bg-red-500" : colors.bar}`} />
      </div>
    </motion.button>
  );
};

const CreateRaidModal = ({
  date,
  onRefresh,
  onClose,
}: {
  date: string;
  onRefresh: () => void;
  onClose: () => void;
}) => {
  const [raidList, setRaidList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyRaidForm);

  useEffect(() => {
    const fetchRaidList = async () => {
      try {
        const { data, error } = await supabase
          .from("contents")
          .select("*")
          .eq("category", "레이드")
          .order("name", { ascending: true });

        if (error) {
          console.error(error);
          setRaidList([]);
          return;
        }

        setRaidList(data || []);
      } catch (error) {
        console.error("fetchRaidList error:", error);
        setRaidList([]);
      }
    };

    fetchRaidList();
  }, []);

  const save = async () => {
    if (!form.raid_name) {
      alert("레이드 이름을 선택하세요.");
      return;
    }

    setLoading(true);

    try {
      const maxParticipants = form.type === "anime" ? 8 : form.raid_type === "4인" ? 4 : 8;

      const { error } = await supabase.from("raid_schedules").insert({
        raid_name: form.raid_name,
        raid_date: date,
        raid_time: form.raid_time,
        difficulty: form.type === "anime" ? null : form.difficulty,
        raid_type: form.type === "anime" ? "시청" : form.raid_type,
        max_participants: maxParticipants,
        type: form.type,
        experience: form.type === "anime" ? null : form.experience,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("일정 생성 완료");
      onRefresh();
      onClose();
    } catch (error: any) {
      console.error("create raid error:", error);
      alert(error.message || "일정 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame onClose={onClose}>
      <div className="bg-[#10131f] border border-white/10 p-8 rounded-[2rem] w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-purple-300 font-black mb-2">
              Create Schedule
            </div>
            <h3 className="text-2xl font-black">{date}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <select
          value={form.raid_name}
          onChange={(e) => setForm({ ...form, raid_name: e.target.value })}
          className="w-full p-4 bg-black border border-white/10 rounded-2xl"
        >
          <option value="">레이드 선택</option>
          {raidList.map((raid) => (
            <option key={raid.id} value={raid.name}>
              {raid.name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as any })}
            className="w-full p-4 bg-black border border-white/10 rounded-2xl"
          >
            {CONTENT_MODE_OPTIONS.map((mode) => (
              <option key={mode} value={mode}>
                {mode === "raid" ? "레이드" : "영화 · 애니 시청"}
              </option>
            ))}
          </select>

          <input
            type="time"
            value={form.raid_time}
            onChange={(e) => setForm({ ...form, raid_time: e.target.value })}
            className="w-full p-4 bg-black border border-white/10 rounded-2xl"
          />
        </div>

        {form.type === "raid" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.raid_type}
                onChange={(e) => setForm({ ...form, raid_type: e.target.value })}
                className="w-full p-4 bg-black border border-white/10 rounded-2xl"
              >
                {RAID_TYPE_OPTIONS.map((raidType) => (
                  <option key={raidType} value={raidType}>
                    {raidType}
                  </option>
                ))}
              </select>

              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full p-4 bg-black border border-white/10 rounded-2xl"
              >
                {difficultyOptions.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              className="w-full p-4 bg-black border border-white/10 rounded-2xl"
            >
              {RAID_EXPERIENCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </>
        )}

        <button
          onClick={save}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 py-4 rounded-2xl font-black hover:opacity-90 transition"
        >
          {loading ? "생성 중..." : "일정 생성"}
        </button>
      </div>
    </ModalFrame>
  );
};

const RaidDetailModal = ({
  raid,
  parts,
  user,
  profile,
  onClose,
  onRefresh,
}: {
  raid: any;
  parts: any[];
  user: any;
  profile: any;
  onClose: () => void;
  onRefresh: () => void;
}) => {
  const [showJoin, setShowJoin] = useState(false);
  const capacity = getCapacity(raid);
  const dealers = parts.filter((p: any) => p.position === "딜러").length;
  const supports = parts.filter((p: any) => p.position === "서포터").length;
  const isAnime = raid.type === "anime";
  const isFull = parts.length >= capacity.maxParticipants;
  const colors = classNameByMode(raid.type);

  const handleDelete = async () => {
    if (profile?.role !== "admin") {
      alert("관리자만 삭제할 수 있어.");
      return;
    }

    const ok = confirm("일정을 삭제하시겠습니까?");
    if (!ok) return;

    try {
      await supabase.from("raid_participants").delete().eq("schedule_id", raid.id);
      await supabase.from("raid_schedules").delete().eq("id", raid.id);
      onRefresh();
    } catch (error) {
      console.error(error);
      alert("일정 삭제 실패");
    }
  };

  return (
    <ModalFrame onClose={onClose}>
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0c1020]/95 backdrop-blur-2xl overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.16)]">
        <div className={`p-6 md:p-8 border-b border-white/10 bg-gradient-to-r ${raid.type === "anime" ? "from-emerald-950/60 to-teal-950/40" : "from-purple-950/60 to-indigo-950/40"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${colors.badge}`}>
                {raid.type === "anime" ? "Watch Party" : "Raid Detail"}
              </div>
              <h3 className="text-3xl font-black">{raid.raid_name}</h3>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                  {formatShortDate(raid.raid_date)}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                  {raid.raid_time}
                </span>
                {!isAnime && (
                  <>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                      {raid.raid_type}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                      {raid.difficulty}
                    </span>
                    {raid.experience && (
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
                        {raid.experience}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <button onClick={onClose} className="text-gray-500 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <SummaryChip icon={<Users size={14} />} label="총 인원" value={`${parts.length}/${capacity.maxParticipants}`} />
            <SummaryChip icon={<Swords size={14} />} label="딜러" value={isAnime ? "-" : `${dealers}/${capacity.dealerLimit}`} />
            <SummaryChip icon={<Shield size={14} />} label="서포터" value={isAnime ? "-" : `${supports}/${capacity.supportLimit}`} />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:p-5">
            <div className="text-sm font-black mb-4">참가자 목록</div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {parts.length === 0 && (
                <div className="text-gray-500 text-sm py-6 text-center">
                  아직 참가자가 없습니다.
                </div>
              )}

              {parts.map((participant: any) => (
                <ParticipantItem
                  key={participant.id}
                  participant={participant}
                  canCancel={profile?.role === "admin"}
                  onRefresh={onRefresh}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-6">
            {user && !isFull && (
              <button
                onClick={() => setShowJoin(true)}
                className="flex-1 py-4 rounded-2xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition"
              >
                ⚔️ 참여하기
              </button>
            )}

            {profile?.role === "admin" && (
              <button
                onClick={handleDelete}
                className="flex-1 py-4 rounded-2xl font-black bg-red-600 hover:bg-red-700 transition"
              >
                🗑 일정 삭제
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-black bg-white/10 hover:bg-white/15 transition"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showJoin && (
          <JoinForm
            raid={raid}
            parts={parts}
            onClose={() => setShowJoin(false)}
            onSuccess={() => {
              setShowJoin(false);
              onRefresh();
            }}
          />
        )}
      </AnimatePresence>
    </ModalFrame>
  );
};

const ParticipantItem = ({
  participant,
  canCancel,
  onRefresh,
}: {
  participant: any;
  canCancel: boolean;
  onRefresh: () => void;
}) => {
  const handleLeave = async () => {
    const ok = confirm("참여를 취소하시겠습니까?");
    if (!ok) return;

    const { error } = await supabase
      .from("raid_participants")
      .delete()
      .eq("id", participant.id);

    if (!error) {
      onRefresh();
    } else {
      alert(error.message || "취소 실패");
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div>
        <div className="font-bold text-white">{participant.character_name}</div>
        <div className="text-sm text-gray-400 mt-1">
          {participant.class_name} · {participant.item_level}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-xs px-3 py-1 rounded-full ${
          participant.position === "서포터"
            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
            : "bg-purple-500/15 text-purple-300 border border-purple-500/20"
        }`}>
          {participant.position || "참가"}
        </span>

        {canCancel && (
          <button
            onClick={handleLeave}
            className="text-xs text-red-300 hover:text-red-200 font-bold"
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
};

const JoinForm = ({
  raid,
  parts,
  onClose,
  onSuccess,
}: {
  raid: any;
  parts: any[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [nickname, setNickname] = useState("");
  const [level, setLevel] = useState("");
  const [playerClass, setPlayerClass] = useState("");
  const [role, setRole] = useState("딜러");
  const [saving, setSaving] = useState(false);

  const capacity = getCapacity(raid);
  const dealers = parts.filter((p: any) => p.position === "딜러").length;
  const supports = parts.filter((p: any) => p.position === "서포터").length;

  const handleJoin = async () => {
    if (!nickname || !level || !playerClass) {
      alert("닉네임, 아이템 레벨, 클래스를 모두 입력하세요.");
      return;
    }

    const alreadyJoined = parts.some(
      (item: any) => (item.character_name || "").trim() === nickname.trim()
    );

    if (alreadyJoined) {
      alert("같은 닉네임이 이미 참가 중이야.");
      return;
    }

    if (raid.type !== "anime") {
      if (role === "딜러" && dealers >= capacity.dealerLimit) {
        alert("딜러 자리가 가득 찼습니다.");
        return;
      }
      if (role === "서포터" && supports >= capacity.supportLimit) {
        alert("서포터 자리가 가득 찼습니다.");
        return;
      }
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("raid_participants").insert({
        schedule_id: raid.id,
        character_name: nickname,
        item_level: level,
        class_name: playerClass,
        position: raid.type === "anime" ? "참가" : role,
      });

      if (!error) {
        onSuccess();
      } else {
        alert(error.message || "참여 실패");
      }
    } catch (error: any) {
      console.error("handleJoin error:", error);
      alert(error.message || "참여 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[220] p-4">
      <div className="bg-[#111827] p-6 rounded-[2rem] w-full max-w-md space-y-4 border border-white/10 backdrop-blur-2xl shadow-[0_0_40px_rgba(59,130,246,0.10)]">
        <div className="flex items-center justify-between">
          <div className="text-white font-black text-xl">레이드 참여</div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <AdminInput label="닉네임" value={nickname} onChange={setNickname} />
        <AdminInput label="아이템 레벨" value={level} onChange={setLevel} />
        <AdminInput label="클래스" value={playerClass} onChange={setPlayerClass} />

        {raid.type !== "anime" && (
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-4 bg-black border border-white/10 rounded-2xl"
          >
            <option value="딜러">딜러</option>
            <option value="서포터">서포터</option>
          </select>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleJoin}
            disabled={saving}
            className="w-full bg-green-600 py-3 rounded-2xl font-black"
          >
            {saving ? "참가 중..." : "참가"}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-700 py-3 rounded-2xl font-black"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalFrame = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full"
    >
      {children}
    </motion.div>
  </motion.div>
);


const AdminPanel = ({ settings, setSettings, user, profile }: any) => {
  const [adminTab, setAdminTab] = useState("레이드");

  const tabs = [
    "레이드",
    "가디언 토벌",
    "클래스",
    "길드 설정",
    "공지 관리",
    "캐릭터 관리",
    "레이드 관리",
    "회원 관리",
    "포인트샵 관리",
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto p-8 text-left">
      <div className="flex items-center gap-4 mb-10">
        <Settings className="text-purple-500" size={32} />
        <h2 className="text-4xl font-black italic uppercase tracking-tighter">
          Admin Console
        </h2>
      </div>

      <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setAdminTab(tab)}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase transition-all ${
              adminTab === tab
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-gray-500 hover:bg-white/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-10">
        {adminTab === "레이드" && <RaidContentEditor isRaid />}
        {adminTab === "가디언 토벌" && <RaidContentEditor isRaid={false} />}
        {adminTab === "클래스" && <ClassContentEditor />}
        {adminTab === "길드 설정" && (
          <GuildSettingsEditor settings={settings} setSettings={setSettings} />
        )}
        {adminTab === "공지 관리" && <AdminNoticeManager user={user} profile={profile} />}
        {adminTab === "캐릭터 관리" && <AdminCharacterManager />}
        {adminTab === "레이드 관리" && <AdminRaidManager />}
        {adminTab === "회원 관리" && <AdminUserManager />}
        {adminTab === "포인트샵 관리" && <AdminPointShopManager />}
      </div>
    </motion.div>
  );
};

const GuildSettingsEditor = ({ settings, setSettings }: any) => {
  const handleSave = async () => {
    const { error } = await supabase.from("settings").upsert(settings);
    if (error) alert(error.message);
    else alert("길드 설정 업데이트 완료!");
  };

  return (
    <div className="space-y-8">
      <AdminInput
        label="Guild Name"
        value={settings.guild_name}
        onChange={(v: any) => setSettings({ ...settings, guild_name: v })}
      />
      <AdminInput
        label="Guild Description"
        value={settings.guild_description}
        onChange={(v: any) => setSettings({ ...settings, guild_description: v })}
      />
      <button
        onClick={handleSave}
        className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-all"
      >
        Update Hero Section
      </button>
    </div>
  );
};

const RaidContentEditor = ({ isRaid }: { isRaid: boolean }) => {
  const [list, setList] = useState<any[]>([]);
  const [selectedGate, setSelectedGate] = useState(1);
  const [difficulty, setDifficulty] = useState("노말");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    image_url: "",
    hp: "",
    element: "",
    attribute: "",
    gold: 0,
  });

  const elementOptions = ["악마형", "야수형", "인간형", "정령형", "기계형", "고대", "불사", "신"];
  const attributeOptions = ["화속성 취약", "수속성 취약", "암속성 취약", "빛속성 취약", "토속성 취약", "뇌속성 취약"];

  useEffect(() => {
    fetchList();
  }, [isRaid]);

  const fetchList = async () => {
    const { data, error } = await supabase
      .from("contents")
      .select("*")
      .eq("category", isRaid ? "레이드" : "가디언 토벌")
      .order("name");

    if (error) {
      console.error(error);
      setList([]);
      return;
    }

    setList(data || []);
  };

  const loadItem = async (item: any) => {
    setEditingId(item.id);

    const baseForm = {
      name: item.name,
      image_url: item.image_url || "",
      hp: "",
      element: "",
      attribute: "",
      gold: 0,
    };

    let query = supabase.from("content_details").select("*").eq("content_id", item.id);

    if (isRaid) {
      query = query.eq("difficulty", difficulty).eq("gate_num", selectedGate);
    } else {
      query = query.eq("gate_num", 0);
    }

    const data = await safeSingle(query);

    setForm({
      ...baseForm,
      hp: data?.hp || "",
      element: data?.element_type || "",
      attribute: data?.attribute || "",
      gold: data?.clear_gold || 0,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      image_url: "",
      hp: "",
      element: "",
      attribute: "",
      gold: 0,
    });
  };

  const handleSave = async () => {
    if (!form.name) return alert("이름을 입력하세요.");

    const { data, error: cErr } = await supabase
      .from("contents")
      .upsert(
        {
          id: editingId || undefined,
          name: form.name,
          category: isRaid ? "레이드" : "가디언 토벌",
          image_url: form.image_url,
        },
        { onConflict: "id" },
      )
      .select()
      .single();

    if (cErr) return alert(cErr.message);

    const { error: dErr } = await supabase.from("content_details").upsert(
      {
        content_id: data.id,
        difficulty: isRaid ? difficulty : null,
        gate_num: isRaid ? Number(selectedGate) : 0,
        hp: form.hp,
        element_type: form.element,
        attribute: form.attribute,
        clear_gold: Number(form.gold) || 0,
      },
      { onConflict: "content_id,difficulty,gate_num" },
    );

    if (dErr) {
      alert(dErr.message);
      return;
    }

    alert(editingId ? "수정 완료!" : "등록 완료!");
    await fetchList();
    resetForm();
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm(`[${name}]을(를) 삭제하시겠습니까?`)) return;
    await supabase.from("content_details").delete().eq("content_id", id);
    const { error } = await supabase.from("contents").delete().eq("id", id);
    if (!error) {
      alert("삭제 완료");
      fetchList();
      resetForm();
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="space-y-6">
        <h4 className="text-xs font-black uppercase text-purple-500 tracking-widest">
          Current List
        </h4>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {list.map((item) => (
            <div
              key={item.id}
              onClick={() => loadItem(item)}
              className={`flex items-center justify-between bg-black/40 p-4 rounded-xl border cursor-pointer transition-all ${
                editingId === item.id
                  ? "border-purple-500"
                  : "border-white/5 hover:border-white/20"
              }`}
            >
              <span className="text-sm font-bold text-gray-300">{item.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem(item.id, item.name);
                }}
                className="text-gray-600 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {editingId && (
          <div className="text-xs font-black text-yellow-400 uppercase tracking-widest">
            🔧 수정 모드
          </div>
        )}

        <AdminInput
          label="Content Name"
          value={form.name}
          onChange={(v: any) => setForm({ ...form, name: v })}
        />

        <ImageUploader
          label="Image"
          onUpload={(url) => setForm({ ...form, image_url: url })}
        />

        {isRaid && (
          <>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4].map((gate) => (
                <button
                  key={gate}
                  type="button"
                  onClick={() => setSelectedGate(gate)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    selectedGate === gate
                      ? "bg-purple-600 text-white"
                      : "bg-black border border-white/10 text-gray-400"
                  }`}
                >
                  {gate}관문
                </button>
              ))}
            </div>

            <select
              className="bg-black border border-white/10 p-4 rounded-xl text-xs font-bold w-full"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {difficultyOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <AdminInput label="HP" value={form.hp} onChange={(v: any) => setForm({ ...form, hp: v })} />
          <AdminInput
            label="Gold"
            type="number"
            value={form.gold}
            onChange={(v: any) => setForm({ ...form, gold: v })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <select
            className="bg-black border border-white/10 p-4 rounded-xl text-xs font-bold"
            value={form.element}
            onChange={(e) => setForm({ ...form, element: e.target.value })}
          >
            <option value="">계열 선택</option>
            {elementOptions.map((element) => (
              <option key={element} value={element}>
                {element}
              </option>
            ))}
          </select>

          <select
            className="bg-black border border-white/10 p-4 rounded-xl text-xs font-bold"
            value={form.attribute}
            onChange={(e) => setForm({ ...form, attribute: e.target.value })}
          >
            <option value="">속성 선택</option>
            {attributeOptions.map((attribute) => (
              <option key={attribute} value={attribute}>
                {attribute}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="flex-1 bg-purple-600 p-4 rounded-xl font-black uppercase hover:bg-purple-500 transition-all"
          >
            {editingId ? "Update Content" : "Register Content"}
          </button>

          {editingId && (
            <button onClick={resetForm} className="bg-gray-700 px-4 rounded-xl font-black uppercase">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ClassContentEditor = () => {
  const [list, setList] = useState<any[]>([]);
  const [form, setForm] = useState({
    root: "",
    sub: "",
    eng_job: "",
    link: "",
    image_url: "",
  });

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    const { data, error } = await supabase.from("class_infos").select("*").order("sub_class");
    if (error) {
      console.error(error);
      setList([]);
      return;
    }
    setList(data || []);
  };

  const handleSave = async () => {
    if (!form.sub) return alert("직업명을 입력하세요.");
    const { error } = await supabase.from("class_infos").upsert(
      {
        root_class: form.root,
        sub_class: form.sub,
        engraving_job: form.eng_job,
        skill_code_link: form.link,
        image_url: form.image_url,
      },
      { onConflict: "sub_class" },
    );

    if (!error) {
      alert("저장 완료!");
      fetchList();
      setForm({ root: "", sub: "", eng_job: "", link: "", image_url: "" });
    } else {
      alert(error.message);
    }
  };

  const deleteItem = async (subClass: string) => {
    if (!confirm(`[${subClass}] 클래스를 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from("class_infos").delete().eq("sub_class", subClass);
    if (!error) {
      alert("삭제 완료");
      fetchList();
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="space-y-6">
        <h4 className="text-xs font-black uppercase text-purple-500 tracking-widest">
          Class List
        </h4>
        <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-2">
          {list.map((item) => (
            <div
              key={item.id || item.sub_class}
              className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5"
            >
              <span className="text-[10px] font-bold text-gray-400">{item.sub_class}</span>
              <button
                onClick={() => deleteItem(item.sub_class)}
                className="text-gray-600 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <AdminInput label="Root" value={form.root} onChange={(v: any) => setForm({ ...form, root: v })} />
          <AdminInput label="Sub" value={form.sub} onChange={(v: any) => setForm({ ...form, sub: v })} />
        </div>
        <AdminInput
          label="Job Engraving"
          value={form.eng_job}
          onChange={(v: any) => setForm({ ...form, eng_job: v })}
        />
        <AdminInput
          label="Guide Link"
          value={form.link}
          onChange={(v: any) => setForm({ ...form, link: v })}
        />
        <ImageUploader
          label="Class Image"
          onUpload={(url) => setForm({ ...form, image_url: url })}
        />
        <button
          onClick={handleSave}
          className="w-full bg-purple-600 p-4 rounded-xl font-black uppercase hover:bg-purple-500 transition-all"
        >
          Update Class
        </button>
      </div>
    </div>
  );
};



const PostBoard = ({ posts, user, profile, onRefresh }: any) => {
  const [tab, setTab] = useState("all");
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, any[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [openCommentPosts, setOpenCommentPosts] = useState<Record<string, boolean>>({});
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  const visiblePosts = useMemo(() => {
    const pinned = posts
      .filter((p: any) => p.is_pinned)
      .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at));
    const normal = posts
      .filter((p: any) => !p.is_pinned)
      .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at));
    const merged = [...pinned, ...normal];

    if (tab === "notice") return merged.filter((p: any) => p.is_notice);
    if (tab === "free") return merged.filter((p: any) => !p.is_notice);
    return merged;
  }, [posts, tab]);

  const fetchComments = useCallback(async () => {
    if (!posts || posts.length === 0) {
      setCommentsByPost({});
      return;
    }

    try {
      const client = getSupabaseOrThrow();
      const postIds = posts.map((post: any) => post.id).filter(Boolean);

      if (postIds.length === 0) {
        setCommentsByPost({});
        return;
      }

      const { data, error } = await client
        .from("post_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("post_comments fetch error:", error);
        setCommentsEnabled(false);
        setCommentsByPost({});
        return;
      }

      const grouped = (data || []).reduce((acc: Record<string, any[]>, item: any) => {
        const key = String(item.post_id);
        acc[key] = acc[key] || [];
        acc[key].push(item);
        return acc;
      }, {});

      setCommentsEnabled(true);
      setCommentsByPost(grouped);
    } catch (error) {
      console.error("fetchComments error:", error);
      setCommentsEnabled(false);
      setCommentsByPost({});
    }
  }, [posts]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  const handleDelete = async (postId: string) => {
    if (!confirm("정말 게시글을 삭제할까요? 연결된 댓글도 함께 사라질 수 있어요.")) return;

    try {
      const client = getSupabaseOrThrow();
      try {
        await client.from("post_comments").delete().eq("post_id", postId);
      } catch (commentDeleteError) {
        console.error("post_comments delete skipped:", commentDeleteError);
      }
      const { error } = await client.from("posts").delete().eq("id", postId);
      if (error) return alert(error.message);
      onRefresh();
      void fetchComments();
    } catch (error: any) {
      alert(error?.message || "게시글 삭제 중 오류가 발생했어요.");
    }
  };

  const togglePin = async (post: any) => {
    if (profile?.role !== "admin") return;
    if (!post.is_notice) return alert("공지글만 고정 가능합니다.");

    const client = getSupabaseOrThrow();

    if (!post.is_pinned) {
      await client.from("posts").update({ is_pinned: false }).eq("is_notice", true).eq("is_pinned", true);
    }

    const { error } = await client.from("posts").update({ is_pinned: !post.is_pinned }).eq("id", post.id);
    if (error) return alert(error.message);
    onRefresh();
  };

  const submitComment = async (postId: string) => {
    if (!user) return alert("로그인 후 댓글을 작성할 수 있어요.");
    if (!commentsEnabled) return alert("댓글 기능용 SQL이 아직 적용되지 않았어요.");
    const content = (commentDrafts[postId] || "").trim();
    if (!content) return alert("댓글 내용을 입력해줘.");

    try {
      const client = getSupabaseOrThrow();
      const payload = {
        post_id: postId,
        content,
        user_id: user.id,
        author: profile?.nickname || "Anonymous",
        author_name: profile?.nickname || "Anonymous",
      };

      const { error } = await client.from("post_comments").insert([payload]);
      if (error) {
        alert(error.message);
        return;
      }

      await client.rpc("add_points", {
        p_user_id: user.id,
        p_points: 5,
        p_type: "comment",
      });

      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      setOpenCommentPosts((prev) => ({ ...prev, [postId]: true }));
      await fetchComments();
      alert("댓글 작성 완료! +5 포인트 획득 🎉");
    } catch (error: any) {
      alert(error?.message || "댓글 등록 중 오류가 발생했어요.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제할까요?")) return;

    try {
      const client = getSupabaseOrThrow();
      const { error } = await client.from("post_comments").delete().eq("id", commentId);
      if (error) {
        alert(error.message);
        return;
      }
      await fetchComments();
    } catch (error: any) {
      alert(error?.message || "댓글 삭제 중 오류가 발생했어요.");
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-32 text-center space-y-6">
        <Shield size={64} className="mx-auto text-gray-800" />
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          Access Denied
        </h2>
        <p className="text-gray-500 font-bold">게시판은 로그인한 회원만 이용 가능합니다.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto p-6 md:p-12 text-left">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Bulletin Board</h2>
          <p className="text-gray-500 font-bold mt-2">게시글 작성 +5P, 댓글 작성 +5P, 이미지 첨부와 공지 고정까지 한 번에 관리합니다.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {[
            ["all", "전체"],
            ["notice", "공지"],
            ["free", "일반"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "whitespace-nowrap px-5 py-3 rounded-full text-[11px] font-black uppercase transition-all",
                tab === key ? "bg-purple-600 text-white" : "bg-white/5 text-gray-500 hover:bg-white/10"
              )}
            >
              {label}
            </button>
          ))}

          <button
            onClick={() => setShowWriteModal(true)}
            className="ml-1 h-12 w-12 rounded-2xl bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center"
            title="글 작성"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {!commentsEnabled && (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          댓글 테이블이 아직 없어서 댓글 기능이 비활성화돼 있어. 함께 전달한 SQL 파일을 먼저 적용해줘.
        </div>
      )}

      <div className="space-y-4">
        {visiblePosts.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-10 text-center text-gray-500">
            아직 게시글이 없습니다.
          </div>
        )}

        {visiblePosts.map((post: any) => {
          const postComments = commentsByPost[String(post.id)] || [];
          const commentsOpen = Boolean(openCommentPosts[post.id]) || postComments.length > 0;

          return (
            <div
              key={post.id}
              className={cn(
                "group p-6 md:p-8 rounded-[2rem] border transition-all relative overflow-hidden",
                post.is_pinned ? "border-amber-500/30 bg-amber-500/10" : post.is_notice ? "border-purple-500/30 bg-purple-500/10" : "border-white/10 bg-white/5"
              )}
            >
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {post.is_pinned && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/20">
                      PINNED
                    </span>
                  )}
                  {post.is_notice ? (
                    <span className="px-2 py-1 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-300 border border-purple-500/20">
                      공지
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-[10px] font-black bg-white/10 text-gray-300 border border-white/10">
                      {post.category || "자유"}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500 font-black uppercase">
                    {formatDateTime(post.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {profile?.role === "admin" && post.is_notice && (
                    <button onClick={() => togglePin(post)} className="text-[11px] text-amber-300 font-black">
                      {post.is_pinned ? "고정 해제" : "고정"}
                    </button>
                  )}
                  {(profile?.role === "admin" || user?.id === post.user_id) && (
                    <button onClick={() => handleDelete(post.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {post.image_url && (
                <img src={post.image_url} className="w-full h-56 md:h-72 object-cover rounded-2xl mb-5 border border-white/5" />
              )}

              <h3 className="text-2xl font-black text-white mb-3">{post.title}</h3>
              <p className="text-gray-300 text-sm mb-4 whitespace-pre-wrap">{post.content}</p>

              <div className="flex flex-wrap justify-between items-center gap-3 text-[10px] text-gray-500 font-black uppercase">
                <span>{post.author_name || post.author || "-"}</span>
                <button
                  onClick={() => setOpenCommentPosts((prev) => ({ ...prev, [post.id]: !Boolean(prev[post.id]) }))}
                  className="px-3 py-2 rounded-full border border-white/10 bg-black/20 text-gray-300 hover:border-purple-500/40"
                >
                  댓글 {postComments.length}개 {commentsOpen ? "닫기" : "열기"}
                </button>
              </div>

              {commentsOpen && (
                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 space-y-4">
                  <div className="space-y-3">
                    {postComments.length === 0 && (
                      <div className="text-sm text-gray-500">아직 댓글이 없습니다.</div>
                    )}

                    {postComments.map((comment: any) => (
                      <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-black text-white">{comment.author_name || comment.author || "-"}</div>
                            <div className="text-[10px] text-gray-500 uppercase mt-1">{formatDateTime(comment.created_at)}</div>
                          </div>

                          {(profile?.role === "admin" || user?.id === comment.user_id) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-gray-500 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <div className="mt-3 text-sm text-gray-300 whitespace-pre-wrap">{comment.content}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <textarea
                      value={commentDrafts[post.id] || ""}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="댓글을 입력하면 +5 포인트가 지급돼요."
                      className="flex-1 bg-black border border-white/10 rounded-2xl p-4 min-h-[96px]"
                    />
                    <button
                      onClick={() => submitComment(post.id)}
                      className="md:w-36 bg-purple-600 px-5 py-4 rounded-2xl font-black text-sm hover:bg-purple-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={16} />
                      댓글 작성
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showWriteModal && (
          <PostWriteModal
            user={user}
            profile={profile}
            onRefresh={async () => {
              await onRefresh();
              await fetchComments();
            }}
            onClose={() => setShowWriteModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};



const PostWriteModal = ({ user, profile, onRefresh, onClose }: any) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("자유");
  const [imgUrl, setImgUrl] = useState("");
  const [isNotice, setIsNotice] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    try {
      setSubmitting(true);
      const client = getSupabaseOrThrow();

      const { data, error } = await client
        .from("posts")
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            category: isNotice ? "공지" : category,
            image_url: imgUrl || null,
            author: profile?.nickname || "Anonymous",
            author_name: profile?.nickname || "Anonymous",
            user_id: user.id,
            author_id: user.id,
            is_notice: Boolean(isNotice),
            is_pinned: profile?.role === "admin" ? Boolean(isNotice && isPinned) : false,
          },
        ])
        .select()
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      if (profile?.role === "admin" && isNotice && isPinned) {
        await client
          .from("posts")
          .update({ is_pinned: false })
          .neq("id", data.id)
          .eq("is_notice", true)
          .eq("is_pinned", true);
      }

      if (!isNotice) {
        await client.rpc("add_points", {
          p_user_id: user.id,
          p_points: 5,
          p_type: "post",
        });
      }

      alert(isNotice ? "공지 작성 완료!" : "게시글 작성 완료! +5 포인트 획득 🎉");
      await onRefresh();
      onClose();
    } catch (err: any) {
      alert(err?.message || "게시글 작성 중 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-left">
      <div className="bg-[#111] border border-white/10 p-6 md:p-10 rounded-[3rem] w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/50 hover:text-white">
          <X />
        </button>
        <h3 className="text-3xl font-black italic uppercase text-purple-500 mb-3">
          Create New Post
        </h3>
        <p className="text-sm text-gray-500 mb-8">일반 글은 작성 시 +5포인트, 댓글도 +5포인트가 지급됩니다.</p>

        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isNotice}
            >
              {["자유", "공략", "수집형 포인트", "스크린샷", "MVP", "커스터마이징 및 의상"].map((tab) => (
                <option key={tab} value={tab}>
                  {tab}
                </option>
              ))}
            </select>

            {profile?.role === "admin" ? (
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 px-4 rounded-2xl border border-white/10 bg-black">
                  <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} />
                  공지글
                </label>
                <label className="flex items-center gap-2 px-4 rounded-2xl border border-white/10 bg-black">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    disabled={!isNotice}
                  />
                  상단 고정
                </label>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-gray-400">
                일반 게시글을 작성할 수 있어요.
              </div>
            )}
          </div>

          <input
            className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold h-40"
            placeholder="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <ImageUploader label="게시판 이미지 첨부" onUpload={(url) => setImgUrl(url)} />

          {imgUrl && (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs text-gray-400 mb-2">첨부 이미지 미리보기</div>
              <img src={imgUrl} className="w-full h-56 object-cover rounded-2xl" />
            </div>
          )}

          <button
            onClick={handlePost}
            disabled={submitting}
            className="w-full bg-purple-600 p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-purple-500 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Send size={18} />
            {submitting ? "등록 중..." : "Publish"}
          </button>
        </div>
      </div>
    </motion.div>
  );
};


const Auth = ({ mode, setMode }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nickname } },
        });

        if (error) throw error;

        await supabase.from("profiles").insert([
          {
            id: data.user?.id,
            nickname,
            grade: "신입",
          },
        ]);

        alert("회원가입 성공! 이메일을 확인하세요.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMode("home");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto py-32 px-4">
      <div className="p-12 rounded-[4rem] border border-white/10 bg-[#0f0f0f] shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent" />
        <h2 className="text-5xl font-black italic mb-2 tracking-tighter uppercase">
          {mode === "login" ? "Sign In" : "Join Us"}
        </h2>
        <p className="text-gray-600 text-[10px] font-black tracking-[0.4em] mb-12 uppercase italic">
          Authentication Required
        </p>

        <form onSubmit={handleAuth} className="space-y-5 text-left">
          <input
            type="email"
            placeholder="E-MAIL"
            className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-black text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="PASSWORD"
            className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-black text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {mode === "signup" && (
            <input
              type="text"
              placeholder="NICKNAME"
              className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-purple-500 text-sm tracking-widest font-black text-white"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 p-6 rounded-3xl font-black uppercase tracking-[0.3em] mt-6 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20 active:scale-95 text-white"
          >
            Proceed
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-8 text-[10px] font-black text-gray-600 hover:text-white uppercase transition-all"
        >
          Switch to {mode === "login" ? "signup" : "login"}
        </button>
      </div>
    </div>
  );
};


const MyRoom = ({ user, profile }: any) => {
  const [rankIcon, setRankIcon] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [className, setClassName] = useState("");
  const [itemLevel, setItemLevel] = useState("");
  const [characterLevel, setCharacterLevel] = useState("");
  const [combatPower, setCombatPower] = useState("");
  const [roleHint, setRoleHint] = useState("딜러");
  const [birthday, setBirthday] = useState("");
  const [mbti, setMbti] = useState("");
  const [characters, setCharacters] = useState<any[]>([]);
  const [ownedBadges, setOwnedBadges] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];

    if (profile.last_attendance === today) {
      alert("오늘은 이미 출석했습니다 ✅");
      return;
    }

    const { error } = await supabase.rpc("add_points", {
      p_user_id: user.id,
      p_points: 10,
      p_type: "attendance",
    });

    if (error) {
      alert("출석 실패");
      return;
    }

    await supabase.from("profiles").update({ last_attendance: today }).eq("id", user.id);

    alert("출석 완료! +10 포인트 🎉");
    window.location.reload();
  };

  const fetchCharacters = async () => {
    const client = getSupabaseOrThrow();
    const { data, error } = await client
      .from("guild_members")
      .select("*")
      .or(`user_id.eq.${user.id},owner_id.eq.${user.id}`)
      .order("is_main", { ascending: false })
      .order("item_level", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("fetchCharacters error:", error);
      setCharacters([]);
      return;
    }

    setCharacters(
      (data || []).map((item: any) => {
        const equippedBadges = getCharacterBadges(item);
        return {
          ...item,
          equipped_badges: equippedBadges,
          isEditing: false,
          draft: {
            character_name: item.character_name || "",
            class_name: item.class_name || "",
            item_level: item.item_level || "",
            character_level: item.character_level || "",
            combat_power: item.combat_power || "",
            role_hint: item.role_hint || "딜러",
            birthday: item.birthday || "",
            mbti: item.mbti || "",
            profile_theme: item.profile_theme || item.theme_color || "#8b5cf6",
            character_intro: item.character_intro || item.bio || "",
            equipped_badge_ids: equippedBadges.map((badge: any) => String(badge.badge_item_id)),
          },
        };
      })
    );
  };

  const fetchOwnedBadges = useCallback(async () => {
    const client = getSupabaseOrThrow();
    const { data, error } = await client
      .from("user_owned_badges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchOwnedBadges error:", error);
      setOwnedBadges([]);
      return;
    }

    const badgeItemIds = Array.from(
      new Set((data || []).map((item: any) => String(item.badge_item_id || "")).filter(Boolean))
    );

    let itemMap = new Map<string, any>();
    if (badgeItemIds.length > 0) {
      const { data: itemRows, error: itemError } = await client
        .from("point_shop_items")
        .select("id, badge_name, badge_color, badge_card_effect, badge_gradient_from, badge_gradient_to, badge_glow_color")
        .in("id", badgeItemIds);

      if (itemError) {
        console.error("point_shop_items badge meta fetch error:", itemError);
      } else {
        itemMap = new Map((itemRows || []).map((item: any) => [String(item.id), item]));
      }
    }

    setOwnedBadges(
      (data || []).map((badge: any) => {
        const itemMeta = itemMap.get(String(badge.badge_item_id || "")) || {};
        return {
          ...badge,
          badge_name: badge.badge_name || itemMeta.badge_name || "뱃지",
          badge_color: badge.badge_color || itemMeta.badge_color || "#8b5cf6",
          badge_card_effect: badge.badge_card_effect || itemMeta.badge_card_effect || "none",
          badge_gradient_from: badge.badge_gradient_from || itemMeta.badge_gradient_from || null,
          badge_gradient_to: badge.badge_gradient_to || itemMeta.badge_gradient_to || null,
          badge_glow_color: badge.badge_glow_color || itemMeta.badge_glow_color || null,
        };
      })
    );
  }, [user?.id]);

  useEffect(() => {
    const fetchRankIcon = async () => {
      if (!profile?.rank_name) return;

      const data = await safeSingle(
        supabase
          .from("ranks")
          .select("icon_url")
          .eq("name", profile.rank_name)
      );

      if (data?.icon_url) setRankIcon(data.icon_url);
    };

    if (profile && user) {
      fetchRankIcon();
      fetchCharacters();
      fetchOwnedBadges();
    }
  }, [profile, user, fetchOwnedBadges]);

  const usedBadgeIds = useMemo(() => {
    const used = new Set<string>();
    characters.forEach((character: any) => {
      getCharacterBadges(character).forEach((badge: any) => {
        if (badge?.badge_item_id) used.add(String(badge.badge_item_id));
      });
    });
    return used;
  }, [characters]);

  const deleteCharacter = async (id: string) => {
    if (!confirm("캐릭터 삭제할까요?")) return;
    const { error } = await supabase.from("guild_members").delete().eq("id", id);
    if (!error) fetchCharacters();
  };

  const deleteOwnedBadge = async (badge: any) => {
    const badgeItemId = String(badge.badge_item_id || badge.id || "");
    if (!badgeItemId) {
      alert("삭제할 뱃지 정보를 찾지 못했어.");
      return;
    }

    if (usedBadgeIds.has(badgeItemId)) {
      alert("이 뱃지는 현재 캐릭터가 착용 중이야. 먼저 장착 해제 후 삭제해줘.");
      return;
    }

    if (!confirm(`정말 "${badge.badge_name}" 뱃지를 삭제할까요? 삭제 후 복구되지 않을 수 있어요.`)) return;

    const client = getSupabaseOrThrow();

    try {
      const { data: rpcDeleted, error: rpcError } = await client.rpc("delete_user_badge", {
        p_user_id: user.id,
        p_badge_item_id: badgeItemId,
      });

      if (!rpcError && rpcDeleted) {
        alert("뱃지를 삭제했어.");
        await fetchOwnedBadges();
        return;
      }

      if (rpcError) {
        console.error("delete_user_badge rpc error:", rpcError);
      }
    } catch (rpcUnexpectedError) {
      console.error("delete_user_badge rpc unexpected error:", rpcUnexpectedError);
    }

    const tryDelete = async (table: string, matcher: (query: any) => any) => {
      try {
        const { error } = await matcher(client.from(table).delete());
        return !error;
      } catch (error) {
        return false;
      }
    };

    let deleted = false;

    if (badge.id) {
      deleted = await tryDelete("user_badges", (q) => q.eq("id", badge.id).eq("user_id", user.id));
      if (!deleted) deleted = await tryDelete("user_owned_badges", (q) => q.eq("id", badge.id).eq("user_id", user.id));
    }

    if (!deleted) {
      deleted = await tryDelete("user_badges", (q) => q.eq("user_id", user.id).eq("badge_item_id", badgeItemId));
    }
    if (!deleted) {
      deleted = await tryDelete("user_owned_badges", (q) => q.eq("user_id", user.id).eq("badge_item_id", badgeItemId));
    }
    if (!deleted && badge.badge_code) {
      deleted = await tryDelete("user_badges", (q) => q.eq("user_id", user.id).eq("badge_code", badge.badge_code));
    }

    if (!deleted) {
      alert("뱃지 삭제에 실패했어. 함께 보낸 SQL 파일 적용 후 다시 시도해줘.");
      return;
    }

    alert("뱃지를 삭제했어.");
    await fetchOwnedBadges();
  };

  const saveCharacter = async () => {
    if (!characterName.trim() || !className.trim()) {
      alert("캐릭터명과 직업을 입력해줘.");
      return;
    }

    let imageUrl = null;

    try {
      if (imageFile) {
        imageUrl = await uploadGuildImage(imageFile, user.id);
      }
    } catch (error: any) {
      console.error("image upload error:", error);
      alert(`이미지 업로드 실패: ${error?.message || "storage 정책을 확인해줘."}`);
      return;
    }

    const client = getSupabaseOrThrow();
    const { error } = await client.from("guild_members").insert({
      user_id: user.id,
      owner_id: user.id,
      owner_nickname: profile.nickname,
      character_name: characterName,
      class_name: className,
      item_level: toNumber(itemLevel),
      character_level: toNumber(characterLevel),
      combat_power: toNumber(combatPower),
      avatar_url: imageUrl,
      role_hint: roleHint,
      birthday: birthday || null,
      mbti: (mbti || "").toUpperCase() || null,
      profile_theme: "#8b5cf6",
      theme_color: "#8b5cf6",
      character_intro: "",
      bio: "",
    });

    if (!error) {
      alert("캐릭터 등록 완료");
      setCharacterName("");
      setClassName("");
      setItemLevel("");
      setCharacterLevel("");
      setCombatPower("");
      setRoleHint("딜러");
      setBirthday("");
      setMbti("");
      setImageFile(null);
      fetchCharacters();
      setShowRegister(false);
    } else {
      alert(error.message);
    }
  };

  const toggleEditing = (id: string, next: boolean) => {
    setCharacters((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isEditing: next,
              draft: next
                ? {
                    character_name: item.character_name || "",
                    class_name: item.class_name || "",
                    item_level: item.item_level || "",
                    character_level: item.character_level || "",
                    combat_power: item.combat_power || "",
                    role_hint: item.role_hint || "딜러",
                    birthday: item.birthday || "",
                    mbti: item.mbti || "",
                    profile_theme: item.profile_theme || "#8b5cf6",
                    character_intro: item.character_intro || "",
                    avatar_url: item.avatar_url || "",
                    new_image_file: null,
                    image_preview_url: item.avatar_url || "",
                    equipped_badge_ids: getCharacterBadges(item).map((badge: any) => String(badge.badge_item_id)),
                  }
                : item.draft,
            }
          : item
      )
    );
  };

  const updateDraft = (id: string, key: string, value: any) => {
    setCharacters((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, draft: { ...item.draft, [key]: value } }
          : item
      )
    );
  };

  const saveCharacterEdit = async (character: any) => {
    const selectedBadgeIds = Array.isArray(character.draft.equipped_badge_ids)
      ? character.draft.equipped_badge_ids
      : [];
    const selectedBadges = ownedBadges.filter((x) =>
      selectedBadgeIds.includes(String(x.badge_item_id))
    );

    let avatarUrl = character.draft.avatar_url || character.avatar_url || null;

    try {
      if (character.draft.new_image_file) {
        avatarUrl = await uploadGuildImage(character.draft.new_image_file, user.id);
      }
    } catch (error: any) {
      console.error("character edit image upload error:", error);
      alert(`수정 이미지 업로드 실패: ${error?.message || "storage 정책을 확인해줘."}`);
      return;
    }

    const payload = {
      character_name: character.draft.character_name,
      class_name: character.draft.class_name,
      item_level: toNumber(character.draft.item_level),
      character_level: toNumber(character.draft.character_level),
      combat_power: toNumber(character.draft.combat_power),
      role_hint: character.draft.role_hint || "딜러",
      birthday: character.draft.birthday || null,
      mbti: (character.draft.mbti || "").toUpperCase() || null,
      profile_theme: character.draft.profile_theme || "#8b5cf6",
      theme_color: character.draft.profile_theme || "#8b5cf6",
      character_intro: character.draft.character_intro || "",
      bio: character.draft.character_intro || "",
      avatar_url: avatarUrl,
      image_url: avatarUrl,
      badge_item_id: selectedBadges[0]?.badge_item_id || null,
      equipped_badge_id: selectedBadges[0]?.badge_item_id || null,
      badge_name: selectedBadges[0]?.badge_name || null,
      equipped_badge_label: selectedBadges[0]?.badge_name || null,
      badge_color: selectedBadges[0]?.badge_color || null,
      badge_card_effect: selectedBadges[0]?.badge_card_effect || "none",
      badge_gradient_from: selectedBadges[0]?.badge_gradient_from || null,
      badge_gradient_to: selectedBadges[0]?.badge_gradient_to || null,
      badge_glow_color: selectedBadges[0]?.badge_glow_color || null,
      equipped_badges: selectedBadges.map((badge: any) => ({
        badge_item_id: badge.badge_item_id,
        badge_name: badge.badge_name,
        badge_color: badge.badge_color || null,
        badge_card_effect: badge.badge_card_effect || "none",
        badge_gradient_from: badge.badge_gradient_from || null,
        badge_gradient_to: badge.badge_gradient_to || null,
        badge_glow_color: badge.badge_glow_color || null,
      })),
      owner_nickname: profile.nickname,
      owner_id: user.id,
      user_id: user.id,
    };

    const client = getSupabaseOrThrow();
    const { error } = await client.from("guild_members").update(payload).eq("id", character.id);
    if (error) return alert(error.message);

    alert("캐릭터 수정 완료");
    fetchCharacters();
  };

  if (!user || !profile) return null;

  return (
    <div className="max-w-6xl mx-auto py-24 px-6">
      <h2 className="text-4xl font-black mb-10">My Room</h2>

      <div className="bg-white/5 p-10 rounded-3xl space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <InfoMiniCard title="닉네임" value={profile.nickname || "-"} />
          <InfoMiniCard title="포인트" value={`${profile.points || 0}`} />
          <InfoMiniCard title="랭크" value={profile.rank_name || "Seed"} />
          <InfoMiniCard title="보유 뱃지" value={`${ownedBadges.length}개`} />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button onClick={handleAttendance} className="bg-green-600 px-5 py-3 rounded-xl font-black">
            출석 체크 (+10P)
          </button>
          <button
            onClick={() => setShowRegister(!showRegister)}
            className="bg-purple-600 px-5 py-3 rounded-xl font-black"
          >
            캐릭터 등록
          </button>
          {rankIcon && <img src={rankIcon} className="w-20 h-20 object-contain" />}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-xl font-black">보유 뱃지 관리</div>
              <div className="text-sm text-gray-400">착용 중이 아닌 뱃지는 여기서 삭제할 수 있어.</div>
            </div>
          </div>

          {ownedBadges.length === 0 ? (
            <div className="text-sm text-gray-500">보유한 뱃지가 없습니다.</div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {ownedBadges.map((badge: any) => {
                const theme = getBadgeVisualTheme(badge);
                const isUsed = usedBadgeIds.has(String(badge.badge_item_id));
                return (
                  <div
                    key={`${badge.badge_item_id}-${badge.id || badge.created_at || badge.badge_name}`}
                    className="rounded-2xl border p-4"
                    style={{
                      background: theme.cardBackground,
                      borderColor: theme.cardBorder,
                      boxShadow: theme.cardShadow,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black">{badge.badge_name}</div>
                        <div className="text-xs mt-1" style={{ color: theme.chipText }}>
                          {theme.label}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteOwnedBadge(badge)}
                        disabled={isUsed}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-black transition",
                          isUsed ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-red-500/85 hover:bg-red-500 text-white"
                        )}
                      >
                        삭제
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-gray-300">
                      {isUsed ? "현재 캐릭터가 착용 중인 뱃지" : "미착용 뱃지 · 삭제 가능"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showRegister && (
          <div className="space-y-3 border border-white/10 rounded-2xl p-5 bg-black/20">
            <div className="grid md:grid-cols-2 gap-3">
              <AdminInput label="캐릭터명" value={characterName} onChange={setCharacterName} />
              <AdminInput label="직업" value={className} onChange={setClassName} />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <AdminInput label="아이템레벨" value={itemLevel} onChange={setItemLevel} />
              <AdminInput label="캐릭터 레벨" value={characterLevel} onChange={setCharacterLevel} />
              <AdminInput label="전투력" value={combatPower} onChange={setCombatPower} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <AdminInput label="생일" type="date" value={birthday} onChange={setBirthday} />
              <AdminInput label="MBTI" value={mbti} onChange={(value: string) => setMbti(String(value || "").toUpperCase().slice(0, 4))} placeholder="예: INFP" />
            </div>
            <select
              value={roleHint}
              onChange={(e) => setRoleHint(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl p-4"
            >
              <option value="딜러">딜러</option>
              <option value="서포터">서포터</option>
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-400"
            />
            {imageFile && (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="text-xs text-gray-400 mb-2">미리보기</div>
                <img
                  src={URL.createObjectURL(imageFile)}
                  className="w-full max-w-xs h-44 object-cover rounded-xl"
                />
              </div>
            )}
            <button onClick={saveCharacter} className="bg-blue-500 px-4 py-3 rounded-xl font-black">
              저장
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {characters.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-gray-400">
              아직 보이는 캐릭터가 없어. 기존 캐릭터가 있는데도 안 보이면 아래 SQL 백필을 한 번 실행해줘.
            </div>
          )}
          {characters.map((character) => {
            const { theme } = getPrimaryBadgeTheme(character);
            return (
            <div
              key={character.id}
              className="p-4 rounded-2xl border relative overflow-hidden"
              style={{
                background: theme.cardBackground,
                borderColor: theme.cardBorder,
                boxShadow: theme.cardShadow,
              }}
            >
              <div className="absolute inset-0 pointer-events-none opacity-90" style={{ background: theme.aura }} />
              <div className="relative z-10">
              {character.avatar_url && (
                <img
                  src={character.avatar_url || character.image_url}
                  className="w-full h-40 object-cover rounded-xl mb-3"
                />
              )}

              {!character.isEditing ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-lg">{character.character_name}</div>
                      <div className="text-sm text-gray-400">{character.class_name}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {getCharacterBadges(character).length > 0 ? (
                        getCharacterBadges(character).map((badge: any, index: number) => {
                          const badgeTheme = getBadgeVisualTheme(badge);
                          return (
                          <span
                            key={`${badge.badge_item_id}-${index}`}
                            className="px-3 py-1 rounded-full text-xs font-black"
                            style={{
                              background: badgeTheme.chipBackground,
                              color: badgeTheme.chipText,
                              border: `1px solid ${badgeTheme.chipBorder}`,
                              boxShadow: `0 0 16px ${hexToRgba(badgeTheme.glow, 0.18)}`,
                            }}
                          >
                            {badge.badge_name}
                          </span>
                        );
                        })
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <InfoMiniCard title="아이템레벨" value={character.item_level || "-"} />
                    <InfoMiniCard title="캐릭터 레벨" value={character.character_level || "-"} />
                    <InfoMiniCard title="전투력" value={character.combat_power || "-"} />
                    <InfoMiniCard title="역할" value={character.role_hint || "딜러"} />
                    <InfoMiniCard title="생일" value={character.birthday ? formatShortDate(character.birthday) : "-"} />
                    <InfoMiniCard title="MBTI" value={character.mbti || "-"} />
                  </div>

                  <div className="mt-4 text-sm text-gray-300 whitespace-pre-wrap">
                    {character.character_intro || "소개 문구를 넣어 캐릭터를 꾸밀 수 있어."}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleEditing(character.id, true)}
                      className="bg-purple-600 px-4 py-2 rounded-xl text-sm font-black"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deleteCharacter(character.id)}
                      className="bg-red-500 px-4 py-2 rounded-xl text-sm font-black"
                    >
                      삭제
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <AdminInput label="캐릭터명" value={character.draft.character_name} onChange={(v: any) => updateDraft(character.id, "character_name", v)} />
                    <AdminInput label="직업" value={character.draft.class_name} onChange={(v: any) => updateDraft(character.id, "class_name", v)} />
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    <AdminInput label="아이템레벨" value={String(character.draft.item_level || "")} onChange={(v: any) => updateDraft(character.id, "item_level", v)} />
                    <AdminInput label="캐릭터 레벨" value={String(character.draft.character_level || "")} onChange={(v: any) => updateDraft(character.id, "character_level", v)} />
                    <AdminInput label="전투력" value={String(character.draft.combat_power || "")} onChange={(v: any) => updateDraft(character.id, "combat_power", v)} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <select
                      value={character.draft.role_hint}
                      onChange={(e) => updateDraft(character.id, "role_hint", e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-4"
                    >
                      <option value="딜러">딜러</option>
                      <option value="서포터">서포터</option>
                    </select>
                    <AdminInput label="생일" type="date" value={character.draft.birthday || ""} onChange={(v: any) => updateDraft(character.id, "birthday", v)} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <AdminInput label="MBTI" value={character.draft.mbti || ""} onChange={(v: any) => updateDraft(character.id, "mbti", String(v || "").toUpperCase().slice(0, 4))} placeholder="예: ENFJ" />
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs text-gray-400 mb-3">착용 뱃지 (복수 선택 가능)</div>
                      <div className="flex flex-wrap gap-2">
                        {ownedBadges.length === 0 && (
                          <div className="text-sm text-gray-500">보유한 뱃지가 없습니다.</div>
                        )}
                        {ownedBadges.map((badge) => {
                          const checked = (character.draft.equipped_badge_ids || []).includes(String(badge.badge_item_id));
                          return (
                            <label
                              key={badge.badge_item_id}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer"
                              style={{
                                borderColor: checked ? badge.badge_color || "#8b5cf6" : "rgba(255,255,255,0.08)",
                                backgroundColor: checked ? `${badge.badge_color || "#8b5cf6"}22` : "rgba(255,255,255,0.03)",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = new Set(character.draft.equipped_badge_ids || []);
                                  if (e.target.checked) next.add(String(badge.badge_item_id));
                                  else next.delete(String(badge.badge_item_id));
                                  updateDraft(character.id, "equipped_badge_ids", Array.from(next));
                                }}
                              />
                              <span
                                className="text-xs font-black"
                                style={{ color: badge.badge_color || "#c4b5fd" }}
                              >
                                {badge.badge_name}
                                {normalizeBadgeEffectKey(badge.badge_card_effect) !== "none" ? ` · ${getBadgeVisualTheme(badge).label}` : ""}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-gray-400 mb-3">캐릭터 이미지 수정</div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        updateDraft(character.id, "new_image_file", file);
                        updateDraft(
                          character.id,
                          "image_preview_url",
                          createPreviewUrl(file, character.draft.avatar_url || character.avatar_url || "")
                        );
                      }}
                      className="w-full text-sm text-gray-400"
                    />
                    {(character.draft.image_preview_url || character.draft.avatar_url || character.avatar_url) && (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                        <div className="text-xs text-gray-400 mb-2">현재/새 미리보기</div>
                        <img
                          src={character.draft.image_preview_url || character.draft.avatar_url || character.avatar_url}
                          className="w-full max-w-xs h-44 object-cover rounded-xl"
                        />
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateDraft(character.id, "new_image_file", null);
                          updateDraft(character.id, "avatar_url", "");
                          updateDraft(character.id, "image_preview_url", "");
                        }}
                        className="px-3 py-2 rounded-xl bg-zinc-800 text-xs font-black"
                      >
                        이미지 제거
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateDraft(character.id, "new_image_file", null);
                          updateDraft(character.id, "avatar_url", character.avatar_url || "");
                          updateDraft(character.id, "image_preview_url", character.avatar_url || "");
                        }}
                        className="px-3 py-2 rounded-xl bg-zinc-700 text-xs font-black"
                      >
                        원래 이미지로 복원
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400">캐릭터 테마색</label>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {BADGE_PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateDraft(character.id, "profile_theme", color)}
                            className="w-8 h-8 rounded-full border-2"
                            style={{ backgroundColor: color, borderColor: character.draft.profile_theme === color ? "#fff" : "transparent" }}
                          />
                        ))}
                      </div>
                    </div>
                    <AdminInput label="직접 색상 입력" value={character.draft.profile_theme || ""} onChange={(v: any) => updateDraft(character.id, "profile_theme", v)} />
                  </div>

                  <textarea
                    value={character.draft.character_intro || ""}
                    onChange={(e) => updateDraft(character.id, "character_intro", e.target.value)}
                    placeholder="캐릭터 소개 / 한줄 각오 / 컨셉 문구"
                    className="w-full bg-black border border-white/10 rounded-xl p-4 min-h-[100px]"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveCharacterEdit(character)}
                      className="bg-blue-500 px-4 py-3 rounded-xl font-black"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => toggleEditing(character.id, false)}
                      className="bg-zinc-700 px-4 py-3 rounded-xl font-black"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
};


const RankingPage = ({ user, profile }: any) => {
  const [tab, setTab] = useState("points");
  const [rows, setRows] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanking(tab);
  }, [tab, user]);

  const fetchRanking = async (kind: string) => {
    setLoading(true);

    if (kind === "points") {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nickname, points, rank_name")
        .order("points", { ascending: false });

      if (error) {
        console.error(error);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows(data || []);
      if (user) {
        const index = (data || []).findIndex((u: any) => u.id === user.id);
        setMyRank(index !== -1 ? index + 1 : null);
      }
      setLoading(false);
      return;
    }

    const source =
      kind === "weekly"
        ? "weekly_activity_ranking"
        : kind === "support"
        ? "support_contribution_ranking"
        : "participation_rate_ranking";

    const { data, error } = await supabase.from(source).select("*").limit(30);

    if (error) {
      console.error(error);
      setRows([]);
      setMyRank(null);
      setLoading(false);
      return;
    }

    setRows(data || []);
    if (user) {
      const index = (data || []).findIndex((u: any) => (u.profile_id || u.id) === user.id);
      setMyRank(index !== -1 ? index + 1 : null);
    }
    setLoading(false);
  };

  const renderValue = (row: any) => {
    if (tab === "points") return `${row.points || 0} P`;
    if (tab === "weekly") return `${row.weekly_count || 0} 회`;
    if (tab === "support") return `${row.support_score || 0} 점`;
    return `${row.participation_rate || 0}%`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center">
        <div className="text-gray-500 font-black">LOADING RANKING...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-24 px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tight">Guild Ranking</h2>
          <p className="text-gray-500 font-bold mt-2">포인트, 주간 활동, 서폿 기여도, 참여율 랭킹을 볼 수 있습니다.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["points", "포인트"],
            ["weekly", "주간"],
            ["support", "서폿"],
            ["participation", "참여율"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-black border",
                tab === key ? "bg-purple-600 border-purple-500" : "bg-white/5 border-white/10 text-gray-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {rows.slice(0, 30).map((member: any, index: number) => (
          <div
            key={member.id || member.profile_id || `${member.nickname}-${index}`}
            className={`flex justify-between items-center p-6 rounded-2xl border transition-all ${
              user?.id === (member.id || member.profile_id)
                ? "bg-purple-600/10 border-purple-500"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div className="flex items-center gap-6">
              <div className="text-2xl font-black w-12 text-center">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
              </div>
              <div>
                <div className="text-lg font-black">{member.nickname || member.owner_nickname}</div>
                <div className="text-xs text-gray-500 uppercase">
                  {tab === "points"
                    ? member.rank_name || "Seed"
                    : tab === "weekly"
                    ? "주간 활동 집계"
                    : tab === "support"
                    ? "서포트 기여도 집계"
                    : "참여율 집계"}
                </div>
              </div>
            </div>

            <div className="text-xl font-black text-purple-400">{renderValue(member)}</div>
          </div>
        ))}
      </div>

      {user && myRank && (
        <div className="mt-12 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
          <div className="text-sm text-gray-400 mb-2 uppercase">My Rank</div>
          <div className="text-3xl font-black text-yellow-400">#{myRank}</div>
        </div>
      )}
    </div>
  );
};


const GuildMembersPage = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);

    try {
      const client = getSupabaseOrThrow();
      const [liveRes, overviewRes] = await Promise.allSettled([
        client
          .from("guild_members")
          .select("*")
          .order("is_main", { ascending: false })
          .order("item_level", { ascending: false, nullsFirst: false })
          .order("character_name", { ascending: true }),
        client
          .from("guild_member_overview")
          .select("*")
          .order("item_level", { ascending: false })
          .order("is_main", { ascending: false })
          .order("character_name", { ascending: true }),
      ]);

      const liveRows =
        liveRes.status === "fulfilled" && !liveRes.value.error ? liveRes.value.data || [] : [];
      const overviewRows =
        overviewRes.status === "fulfilled" && !overviewRes.value.error ? overviewRes.value.data || [] : [];

      if (liveRes.status === "fulfilled" && liveRes.value.error) {
        console.error("guild_members fetch error:", liveRes.value.error);
      }
      if (overviewRes.status === "fulfilled" && overviewRes.value.error) {
        console.error("guild_member_overview fetch error:", overviewRes.value.error);
      }

      const overviewMap = new Map(overviewRows.map((row: any) => [row.id, row]));
      const merged = (liveRows.length > 0 ? liveRows : overviewRows).map((row: any) => {
        const overview = overviewMap.get(row.id) || {};
        const base = { ...overview, ...row };
        return {
          ...base,
          equipped_badges: getCharacterBadges(base),
        };
      });

      setMembers(
        merged.sort((a: any, b: any) => {
          if (Boolean(a.is_main) !== Boolean(b.is_main)) return a.is_main ? -1 : 1;
          return Number(b.item_level || 0) - Number(a.item_level || 0);
        })
      );
    } catch (error) {
      console.error(error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    if (filter === "main") return members.filter((m: any) => m.is_main);
    if (filter === "support") return members.filter((m: any) => m.role_hint === "서포터");
    return members;
  }, [members, filter]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black">길드 캐릭터</h1>
          <p className="text-gray-400 mt-2">메인/부캐, 템렙, 캐릭터 레벨, 전투력, 생일, MBTI, 최근 참여 레이드, 장착 뱃지까지 한 번에 볼 수 있습니다.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["all", "전체"],
            ["main", "메인캐"],
            ["support", "서폿"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-black border transition",
                filter === key ? "bg-purple-600 border-purple-500 text-white" : "bg-white/5 border-white/10 text-gray-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">길드원 불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredMembers.map((member: any) => {
            const { theme } = getPrimaryBadgeTheme(member);
            return (
            <div
              key={member.id}
              className="rounded-[2rem] border p-5 overflow-hidden relative"
              style={{
                background: theme.cardBackground,
                borderColor: theme.cardBorder,
                boxShadow: theme.cardShadow,
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: theme.aura }} />
              <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 min-w-0">
                  <img
                    src={member.avatar_url || member.image_url || "https://placehold.co/120x120?text=INXX"}
                    className="h-20 w-20 rounded-2xl object-cover border border-white/10"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {member.is_main ? (
                        <span className="px-2 py-1 rounded-full text-[10px] font-black bg-yellow-500/15 text-yellow-300 border border-yellow-500/20 inline-flex items-center gap-1">
                          <Crown size={11} />
                          MAIN
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-[10px] font-black bg-white/10 text-gray-300 border border-white/10">
                          부캐
                        </span>
                      )}
                      {member.role_hint === "서포터" && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                          서폿
                        </span>
                      )}
                      {getCharacterBadges(member).map((badge: any, index: number) => {
                        const badgeTheme = getBadgeVisualTheme(badge);
                        return (
                        <span
                          key={`${badge.badge_item_id}-${index}`}
                          className="px-2 py-1 rounded-full text-[10px] font-black border"
                          style={{
                            color: badgeTheme.chipText,
                            borderColor: badgeTheme.chipBorder,
                            background: badgeTheme.chipBackground,
                            boxShadow: `0 0 14px ${hexToRgba(badgeTheme.glow, 0.14)}`,
                          }}
                        >
                          {badge.badge_name}
                        </span>
                      );
                      })}
                    </div>
                    <div className="text-xl font-black truncate">{member.character_name}</div>
                    <div className="text-sm text-gray-400 truncate">{member.class_name}</div>
                    <div className="mt-1 text-purple-300 font-black">아이템 Lv. {member.item_level}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Owner</div>
                  <div className="text-sm font-bold">{member.owner_nickname || "-"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <InfoMiniCard title="캐릭터 레벨" value={member.character_level || "-"} />
                <InfoMiniCard title="전투력" value={member.combat_power || "-"} />
                <InfoMiniCard title="생일" value={member.birthday ? formatShortDate(member.birthday) : "-"} />
                <InfoMiniCard title="MBTI" value={member.mbti || "-"} />
                <InfoMiniCard title="최근 참여" value={member.last_raid_name || "기록 없음"} />
                <InfoMiniCard title="최근 날짜" value={member.last_raid_date ? formatShortDate(member.last_raid_date) : "-"} />
                <InfoMiniCard title="주간 참여" value={`${member.weekly_join_count || 0}회`} />
                <InfoMiniCard title="참여율" value={`${member.participation_rate || 0}%`} />
              </div>

              {member.character_intro && (
                <div className="mt-4 text-sm text-gray-300 whitespace-pre-wrap border-t border-white/5 pt-4">
                  {member.character_intro}
                </div>
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


const AdminCharacterManager = () => {
  const [chars, setChars] = useState<any[]>([]);

  useEffect(() => {
    fetchChars();
  }, []);

  const fetchChars = async () => {
    const { data, error } = await supabase
      .from("guild_members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setChars([]);
      return;
    }

    setChars(data || []);
  };

  const deleteChar = async (id: string) => {
    if (!confirm("캐릭터 삭제할까요?")) return;
    await supabase.from("guild_members").delete().eq("id", id);
    fetchChars();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">길드 캐릭터 관리</h3>

      {chars.map((char) => (
        <div key={char.id} className="flex justify-between bg-black/40 p-4 rounded border border-white/10">
          <div>
            <div>{char.character_name}</div>
            <div className="text-xs text-gray-400">{char.class_name}</div>
          </div>

          <button onClick={() => deleteChar(char.id)} className="text-red-500">
            삭제
          </button>
        </div>
      ))}
    </div>
  );
};

const AdminRaidManager = () => {
  const [raids, setRaids] = useState<any[]>([]);

  useEffect(() => {
    fetchRaids();
  }, []);

  const fetchRaids = async () => {
    const { data, error } = await supabase
      .from("raid_schedules")
      .select("*")
      .order("raid_date")
      .order("raid_time");

    if (error) {
      console.error(error);
      setRaids([]);
      return;
    }

    setRaids(data || []);
  };

  const deleteRaid = async (id: string) => {
    if (!confirm("레이드 삭제할까요?")) return;
    await supabase.from("raid_participants").delete().eq("schedule_id", id);
    await supabase.from("raid_schedules").delete().eq("id", id);
    fetchRaids();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">레이드 일정 관리</h3>

      {raids.map((raid) => (
        <div key={raid.id} className="flex justify-between bg-black/40 p-4 rounded border border-white/10">
          <div>
            <div>{raid.raid_name}</div>
            <div className="text-xs text-gray-400">
              {raid.raid_date} {raid.raid_time}
            </div>
          </div>

          <button onClick={() => deleteRaid(raid.id)} className="text-red-500">
            삭제
          </button>
        </div>
      ))}
    </div>
  );
};

const AdminUserManager = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      console.error(error);
      setUsers([]);
      return;
    }
    setUsers(data || []);
  };

  const deleteUser = async (id: string) => {
    if (!confirm("회원 삭제할까요?")) return;
    await supabase.from("profiles").delete().eq("id", id);
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">회원 관리</h3>

      {users.map((member) => (
        <div key={member.id} className="flex justify-between bg-black/40 p-4 rounded border border-white/10">
          <div>
            <div>{member.nickname}</div>
            <div className="text-xs text-gray-400">{member.rank_name}</div>
          </div>

          <button onClick={() => deleteUser(member.id)} className="text-red-500">
            삭제
          </button>
        </div>
      ))}
    </div>
  );
};

const PointShopPage = ({ user, profile }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [myPoint, setMyPoint] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShop();
  }, [user?.id]);

  const fetchShop = async () => {
    setLoading(true);
    const [itemsRes, profileRes] = await Promise.all([
      supabase.from("point_shop_items").select("*").order("price", { ascending: true }),
      user ? supabase.from("profiles").select("points").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    if ((itemsRes as any).error) {
      console.error((itemsRes as any).error);
      setItems([]);
    } else {
      setItems((itemsRes as any).data || []);
    }

    if ((profileRes as any)?.data) {
      setMyPoint((profileRes as any).data.points || 0);
    } else {
      setMyPoint(0);
    }

    setLoading(false);
  };

  const purchase = async (item: any) => {
    if (!user) return alert("로그인 후 사용 가능합니다.");
    if (!isShopItemAvailable(item)) return alert("지금은 구매 가능한 시간이 아니야.");
    if (myPoint < item.price) return alert("포인트가 부족합니다.");
    if (!confirm(`${item.title} 구매 시 ${item.price}P가 차감됩니다. 진행할까요?`)) return;

    const { error } = await supabase.rpc("purchase_shop_item", {
      p_user_id: user.id,
      p_item_id: item.id,
    });

    if (error) return alert(error.message);
    alert(item.reward_type === "badge" ? "뱃지를 구매했어. 이제 마이룸에서 캐릭터에게 착용할 수 있어!" : "구매 요청 완료");
    fetchShop();
  };

  return (
    <div className="max-w-6xl mx-auto py-24 px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tight">Point Shop</h2>
          <p className="text-gray-500 font-bold mt-2">출석 체크와 게시글 작성으로 모은 포인트로 뱃지 등을 구매하고, 마이룸에서 캐릭터에 장착할 수 있습니다.</p>
        </div>

        <div className="rounded-[2rem] border border-purple-500/20 bg-purple-500/10 px-5 py-4">
          <div className="text-[10px] uppercase tracking-widest text-purple-300 font-black">My Point</div>
          <div className="text-2xl font-black">{myPoint} P</div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">포인트샵 불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map((item) => {
            const available = isShopItemAvailable(item);
            return (
              <div key={item.id} className="rounded-[2rem] border border-white/10 bg-[#0d111c]/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-xl font-black">{item.title}</div>
                      {item.reward_type === "badge" && (
                        <span
                          className="px-2 py-1 rounded-full text-[10px] font-black border"
                          style={{ color: item.badge_color || "#c4b5fd", borderColor: item.badge_color || "#8b5cf6", backgroundColor: `${item.badge_color || "#8b5cf6"}22` }}
                        >
                          뱃지
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-400 whitespace-pre-wrap">{item.description}</div>
                    <div className="mt-3 text-xs text-gray-500">{getShopItemStatusText(item)}</div>
                  </div>
                  <ShoppingBag className="text-purple-300" />
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-black">Price</div>
                    <div className="text-2xl font-black text-yellow-300">{item.price} P</div>
                  </div>
                  <button
                    disabled={!available}
                    onClick={() => purchase(item)}
                    className="px-5 py-3 rounded-2xl bg-purple-600 font-black disabled:opacity-40"
                  >
                    {available ? "구매" : "구매 불가"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AdminNoticeManager = ({ user, profile }: any) => {
  const [notices, setNotices] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("is_notice", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setNotices([]);
      return;
    }

    setNotices(data || []);
  };

  const createNotice = async () => {
    if (!title.trim() || !content.trim()) return alert("공지 제목과 내용을 입력해줘.");

    const { error } = await supabase.from("posts").insert({
      title,
      content,
      category: "공지",
      is_notice: true,
      is_pinned: notices.length === 0,
      author_id: user?.id || null,
      author_name: profile?.nickname || "관리자",
    });

    if (error) return alert(error.message);

    setTitle("");
    setContent("");
    fetchNotices();
    alert("공지 작성 완료");
  };

  const togglePin = async (id: string, nextValue: boolean) => {
    if (nextValue) {
      await supabase.from("posts").update({ is_pinned: false }).eq("is_notice", true);
    }
    await supabase.from("posts").update({ is_pinned: nextValue }).eq("id", id);
    fetchNotices();
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("이 공지를 삭제할까요?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return alert(error.message);
    fetchNotices();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">공지 관리</h3>

      <div className="space-y-3 border border-white/10 rounded-2xl p-5 bg-black/20">
        <AdminInput label="공지 제목" value={title} onChange={setTitle} />
        <textarea
          className="w-full bg-black border border-white/10 rounded-2xl p-4 min-h-[140px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메인 상단에 보여줄 공지 내용을 입력해줘"
        />
        <button onClick={createNotice} className="px-5 py-3 rounded-xl bg-purple-600 font-black">
          공지 작성
        </button>
      </div>

      {notices.length === 0 && (
        <div className="text-gray-500">등록된 공지가 아직 없어.</div>
      )}

      {notices.map((notice) => (
        <div key={notice.id} className="bg-black/40 p-4 rounded border border-white/10 gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-bold">{notice.title}</div>
              <div className="text-xs text-gray-400 mt-1">{formatDateTime(notice.created_at)}</div>
              <div className="text-sm text-gray-300 mt-3 whitespace-pre-wrap">{notice.content}</div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => togglePin(notice.id, !notice.is_pinned)} className="px-4 py-2 rounded-xl border border-white/10">
                {notice.is_pinned ? "고정 해제" : "상단 고정"}
              </button>
              <button onClick={() => deleteNotice(notice.id)} className="px-4 py-2 rounded-xl bg-red-600 text-white">
                삭제
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminPointShopManager = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [rewardType, setRewardType] = useState("badge");
  const [badgeColor, setBadgeColor] = useState("#8b5cf6");
  const [badgeCardEffect, setBadgeCardEffect] = useState<BadgeEffectKey>("violet");
  const [badgeGradientFrom, setBadgeGradientFrom] = useState(BADGE_CARD_EFFECT_PRESETS.violet.from);
  const [badgeGradientTo, setBadgeGradientTo] = useState(BADGE_CARD_EFFECT_PRESETS.violet.to);
  const [badgeGlowColor, setBadgeGlowColor] = useState(BADGE_CARD_EFFECT_PRESETS.violet.glow);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const preset = BADGE_CARD_EFFECT_PRESETS[badgeCardEffect] || BADGE_CARD_EFFECT_PRESETS.violet;
    setBadgeGradientFrom(preset.from);
    setBadgeGradientTo(preset.to);
    setBadgeGlowColor(preset.glow);
  }, [badgeCardEffect]);

  const fetchItems = async () => {
    const { data, error } = await supabase.from("point_shop_items").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setItems([]);
      return;
    }
    setItems(data || []);
  };

  const resetForm = () => {
    setTitle("");
    setPrice("");
    setDescription("");
    setRewardType("badge");
    setBadgeColor("#8b5cf6");
    setBadgeCardEffect("violet");
    setBadgeGradientFrom(BADGE_CARD_EFFECT_PRESETS.violet.from);
    setBadgeGradientTo(BADGE_CARD_EFFECT_PRESETS.violet.to);
    setBadgeGlowColor(BADGE_CARD_EFFECT_PRESETS.violet.glow);
    setAvailableFrom("");
    setAvailableTo("");
  };

  const createItem = async () => {
    if (!title.trim() || !price) return alert("상품명과 가격을 입력하세요.");
    const { error } = await supabase.from("point_shop_items").insert({
      title,
      description,
      price: toNumber(price),
      is_active: true,
      reward_type: rewardType,
      badge_name: rewardType === "badge" ? title : null,
      badge_color: rewardType === "badge" ? badgeColor : null,
      badge_card_effect: rewardType === "badge" ? badgeCardEffect : "none",
      badge_gradient_from: rewardType === "badge" ? badgeGradientFrom : null,
      badge_gradient_to: rewardType === "badge" ? badgeGradientTo : null,
      badge_glow_color: rewardType === "badge" ? badgeGlowColor : null,
      available_from: availableFrom ? new Date(availableFrom).toISOString() : null,
      available_to: availableTo ? new Date(availableTo).toISOString() : null,
    });
    if (error) return alert(error.message);
    resetForm();
    fetchItems();
  };

  const toggleActive = async (item: any) => {
    const { error } = await supabase.from("point_shop_items").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) return alert(error.message);
    fetchItems();
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("상품을 완전히 삭제할까요?")) return;
    const { error } = await supabase.from("point_shop_items").delete().eq("id", itemId);
    if (error) return alert(error.message);
    fetchItems();
  };

  const previewTheme = getBadgeVisualTheme({
    badge_color: badgeColor,
    badge_card_effect: badgeCardEffect,
    badge_gradient_from: badgeGradientFrom,
    badge_gradient_to: badgeGradientTo,
    badge_glow_color: badgeGlowColor,
  });

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold">포인트샵 관리</h3>

      <div className="grid md:grid-cols-3 gap-4">
        <input className="bg-black border border-white/10 rounded-2xl p-4" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="상품명 / 뱃지명" />
        <input className="bg-black border border-white/10 rounded-2xl p-4" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="가격" />
        <select className="bg-black border border-white/10 rounded-2xl p-4" value={rewardType} onChange={(e) => setRewardType(e.target.value)}>
          <option value="badge">뱃지</option>
          <option value="general">일반 상품</option>
        </select>
      </div>

      <textarea className="w-full bg-black border border-white/10 rounded-2xl p-4 min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="상품 설명" />

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-gray-400 mb-2 block">판매 시작 시간</label>
          <input type="datetime-local" className="w-full bg-black border border-white/10 rounded-2xl p-4" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">판매 종료 시간</label>
          <input type="datetime-local" className="w-full bg-black border border-white/10 rounded-2xl p-4" value={availableTo} onChange={(e) => setAvailableTo(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-2 block">뱃지 대표 색상</label>
          <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={badgeColor} onChange={(e) => setBadgeColor(e.target.value)} />
        </div>
      </div>

      {rewardType === "badge" && (
        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-black/30 p-5 space-y-4">
            <div className="text-sm font-black">길드 캐릭터 카드 이펙트</div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">프리셋</label>
              <select
                className="w-full bg-black border border-white/10 rounded-2xl p-4"
                value={badgeCardEffect}
                onChange={(e) => setBadgeCardEffect(normalizeBadgeEffectKey(e.target.value))}
              >
                {Object.entries(BADGE_CARD_EFFECT_PRESETS)
                  .filter(([key]) => key !== "none")
                  .map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">그라데이션 시작색</label>
                <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={badgeGradientFrom} onChange={(e) => setBadgeGradientFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">그라데이션 끝색</label>
                <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={badgeGradientTo} onChange={(e) => setBadgeGradientTo(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">글로우 색상</label>
                <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={badgeGlowColor} onChange={(e) => setBadgeGlowColor(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border p-5 relative overflow-hidden" style={{ background: previewTheme.cardBackground, borderColor: previewTheme.cardBorder, boxShadow: previewTheme.cardShadow }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: previewTheme.aura }} />
            <div className="relative z-10">
              <div className="text-[10px] uppercase tracking-[0.28em] font-black" style={{ color: previewTheme.chipText }}>
                Live Preview
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-black/25 border border-white/10" />
                <div className="min-w-0">
                  <div className="text-lg font-black truncate">{title || "새 뱃지"}</div>
                  <div className="text-sm text-white/70">{previewTheme.label}</div>
                  <div className="mt-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black border" style={{ color: previewTheme.chipText, borderColor: previewTheme.chipBorder, background: previewTheme.chipBackground }}>
                      길드 카드 적용
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button onClick={createItem} className="rounded-2xl bg-purple-600 font-black px-6 py-4">상품 생성</button>

      <div className="space-y-4">
        {items.map((item) => {
          const badgeTheme = getBadgeVisualTheme(item);
          return (
          <div key={item.id} className="flex flex-col lg:flex-row justify-between bg-black/40 p-4 rounded border border-white/10 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-bold">{item.title}</div>
                {item.reward_type === "badge" && (
                  <span
                    className="px-2 py-1 rounded-full text-[10px] font-black border"
                    style={{ color: badgeTheme.chipText, borderColor: badgeTheme.chipBorder, background: badgeTheme.chipBackground }}
                  >
                    뱃지 · {badgeTheme.label}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">{item.description}</div>
              <div className="text-yellow-300 font-black mt-1">{item.price} P</div>
              <div className="text-xs text-gray-500 mt-1">{getShopItemStatusText(item)}</div>

              {item.reward_type === "badge" && (
                <div className="mt-4 rounded-[1.25rem] border p-4 relative overflow-hidden" style={{ background: badgeTheme.cardBackground, borderColor: badgeTheme.cardBorder, boxShadow: badgeTheme.cardShadow }}>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: badgeTheme.aura }} />
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-black">캐릭터 카드 미리보기</div>
                      <div className="text-xs text-white/70">길드탭 카드에 바로 적용될 효과</div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black border" style={{ color: badgeTheme.chipText, borderColor: badgeTheme.chipBorder, background: badgeTheme.chipBackground }}>
                      {item.badge_name || item.title}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-row lg:flex-col gap-2">
              <button onClick={() => toggleActive(item)} className={cn("px-4 py-2 rounded-xl font-black", item.is_active ? "bg-emerald-600" : "bg-zinc-700")}>
                {item.is_active ? "판매중" : "비활성"}
              </button>
              <button onClick={() => deleteItem(item.id)} className="px-4 py-2 rounded-xl bg-red-600 font-black">
                삭제
              </button>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
};
