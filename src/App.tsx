

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  guild_name: "쁘밍",
  guild_description: "로스트아크 길드 홈페이지에 오신 것을 환영합니다.",
  point_rate_settings: {
    enabled: true,
    cycle_minutes: 60,
    daily_cap: 500,
    enhancement_bonus_per_5: 2,
    rate_by_rarity: {
      common: 10,
      rare: 15,
      epic: 22,
      legendary: 30,
    },
    ui_images: {
      background_image_url: "",
      side_left_image_url: "",
      side_right_image_url: "",
      side_left_enabled: true,
      side_right_enabled: true,
      spline_scene_url: "",
      spline_enabled: false,
    },
  },
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
      card: "from-[#2a2116]/80 to-[#17110b]/90 border-amber-400/30 hover:border-amber-200",
      badge: "text-amber-200",
      bar: "bg-amber-400",
      chip: "bg-amber-400/15 text-amber-200 border border-amber-400/20",
    };
  }

  return {
    card: "from-[#2a2116]/80 to-[#17110b]/90 border-amber-400/30 hover:border-amber-200",
    badge: "text-amber-200",
    bar: "bg-amber-400",
    chip: "bg-amber-400/15 text-amber-200 border border-amber-400/20",
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


const getDisplayGuildName = (name?: string | null) => {
  const normalized = String(name || "").trim();
  if (!normalized) return "쁘밍";
  if (normalized === "아래향") return "쁘밍";
  return normalized;
};

const toNumber = (value: any) => {
  const num = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(num) ? num : 0;
};

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type ToastType = "info" | "success" | "error";

const showToast = (message: string, type: ToastType = "info") => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("app-toast", {
      detail: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message,
        type,
      },
    })
  );
};



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
    return equipped.map((badge: any, index: number) => {
      const badgeEffect = badge?.badge_card_effect || badge?.card_effect || "none";
      const shouldUseTopLevelEffect =
        index === 0 && normalizeBadgeEffectKey(badgeEffect) === "none";

      return {
        ...badge,
        badge_card_effect: shouldUseTopLevelEffect
          ? topLevelBadgeTheme.badge_card_effect
          : badgeEffect,
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
      };
    });
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


type WeaponRarityKey = "common" | "rare" | "epic" | "legendary";

const WEAPON_RARITY_THEMES: Record<
  WeaponRarityKey,
  {
    label: string;
    border: string;
    background: string;
    text: string;
    glow: string;
  }
> = {
  common: {
    label: "Common",
    border: "rgba(148, 163, 184, 0.34)",
    background: "linear-gradient(135deg, rgba(148,163,184,0.18), rgba(15,23,42,0.58))",
    text: "#e5e7eb",
    glow: "rgba(148,163,184,0.18)",
  },
  rare: {
    label: "Rare",
    border: "rgba(59, 130, 246, 0.42)",
    background: "linear-gradient(135deg, rgba(214,164,78,0.18), rgba(15,23,42,0.58))",
    text: "#bfdbfe",
    glow: "rgba(214,164,78,0.22)",
  },
  epic: {
    label: "Epic",
    border: "rgba(168, 85, 247, 0.44)",
    background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(15,23,42,0.6))",
    text: "#e9d5ff",
    glow: "rgba(168,85,247,0.24)",
  },
  legendary: {
    label: "Legendary",
    border: "rgba(245, 158, 11, 0.5)",
    background: "linear-gradient(135deg, rgba(245,158,11,0.24), rgba(120,53,15,0.4), rgba(15,23,42,0.72))",
    text: "#fde68a",
    glow: "rgba(245,158,11,0.26)",
  },
};

const normalizeWeaponRarity = (value: any): WeaponRarityKey => {
  const normalized = String(value || "common").trim().toLowerCase();
  if (["common", "rare", "epic", "legendary"].includes(normalized)) {
    return normalized as WeaponRarityKey;
  }
  return "common";
};

const getWeaponTheme = (weapon: any) => {
  const rarity = normalizeWeaponRarity(weapon?.rarity);
  return WEAPON_RARITY_THEMES[rarity] || WEAPON_RARITY_THEMES.common;
};

const ENHANCEMENT_MAX_LEVEL = 25;

const getTodayKey = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const normalizeEnhancementLevel = (value: any) => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(ENHANCEMENT_MAX_LEVEL, Math.max(0, Math.floor(parsed)));
};

const getEnhancementDisplay = (value: any) => `+${normalizeEnhancementLevel(value)}`;

const getEnhancedWeaponName = (name: string, level: any) => {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) return "";
  const normalizedLevel = normalizeEnhancementLevel(level);
  return normalizedLevel > 0 ? `${trimmedName} ${getEnhancementDisplay(normalizedLevel)}` : trimmedName;
};

const getEnhancementBaseRate = (level: number) => {
  if (level < 5) return 90;
  if (level < 10) return 75;
  if (level < 15) return 60;
  if (level < 20) return 45;
  if (level < 23) return 35;
  return 25;
};

const getEnhancementSuccessRate = (level: any, bonusRate = 0) => {
  const normalizedLevel = normalizeEnhancementLevel(level);
  const normalizedBonus = Number(bonusRate ?? 0);
  const rate = getEnhancementBaseRate(normalizedLevel) + (Number.isFinite(normalizedBonus) ? normalizedBonus : 0);
  return Math.min(100, Math.max(5, Math.round(rate * 100) / 100));
};

const getNakwonExpRequiredForLevel = (level: any) => {
  const normalizedLevel = Math.max(1, Math.floor(Number(level || 1)));
  return 300 + (normalizedLevel - 1) * 150;
};

const applyNakwonExpGain = (levelLike: any, expLike: any, gainedExpLike: any) => {
  let level = Math.max(1, Math.floor(Number(levelLike || 1)));
  let exp = Math.max(0, Math.floor(Number(expLike || 0)));
  let gainedExp = Math.max(0, Math.floor(Number(gainedExpLike || 0)));
  let leveledUp = false;

  exp += gainedExp;
  while (exp >= getNakwonExpRequiredForLevel(level)) {
    exp -= getNakwonExpRequiredForLevel(level);
    level += 1;
    leveledUp = true;
  }

  return {
    level,
    exp,
    leveledUp,
    nextRequiredExp: getNakwonExpRequiredForLevel(level),
  };
};

const getNakwonDailyEnhanceLimit = (nakwonLevelLike: any) => {
  const nakwonLevel = Math.max(1, Math.floor(Number(nakwonLevelLike || 1)));
  if (nakwonLevel >= 20) return 4;
  if (nakwonLevel >= 10) return 3;
  if (nakwonLevel >= 5) return 2;
  return 1;
};

const getEnhancementDestroyRate = (level: any) => {
  const normalizedLevel = normalizeEnhancementLevel(level);
  if (normalizedLevel < 15) return 0;
  if (normalizedLevel < 18) return 2;
  if (normalizedLevel < 21) return 5;
  if (normalizedLevel < 23) return 8;
  return 12;
};

const getEnhancementDestroyFallbackLevel = (level: any) => {
  const normalizedLevel = normalizeEnhancementLevel(level);
  if (normalizedLevel < 15) return normalizedLevel;
  if (normalizedLevel < 18) return 12;
  if (normalizedLevel < 21) return 14;
  return 15;
};

const getEnhancementItemEffectText = (item: any) => {
  const rate = Number(item?.enhance_bonus_rate ?? item?.bonus_rate ?? 0);
  if (!Number.isFinite(rate) || rate <= 0) return "강화 확률 보정 없음";
  return `강화 확률 +${rate}%`;
};

const getShopRewardTypeLabel = (item: any) => {
  if (item?.reward_type === "enhance_stone") return "Enhance Stone";
  if (item?.reward_type === "badge") return "Badge Item";
  if (item?.reward_type === "nickname_effect") return "Nickname FX";
  if (item?.reward_type === "enhance_protect_ticket") return "Protect Ticket";
  return "Point Item";
};

const getPointShopCardBackground = (item: any, badgeTheme: any) => {
  if (item?.reward_type === "badge") return badgeTheme.cardBackground;
  if (item?.reward_type === "enhance_stone") {
    return "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(168,85,247,0.18), rgba(15,23,42,0.96) 58%, rgba(2,6,23,0.98))";
  }
  if (item?.reward_type === "nickname_effect") {
    const theme = getNicknameEffectTheme(item);
    return `linear-gradient(135deg, ${hexToRgba(theme.from, 0.24)}, ${hexToRgba(theme.to, 0.2)}, rgba(15,23,42,0.96) 60%, rgba(2,6,23,0.98))`;
  }
  if (item?.reward_type === "enhance_protect_ticket") {
    return "linear-gradient(135deg, rgba(244,114,182,0.18), rgba(251,191,36,0.16), rgba(15,23,42,0.96) 60%, rgba(2,6,23,0.98))";
  }
  return "linear-gradient(135deg, rgba(139,92,246,0.14), rgba(15,23,42,0.92) 52%, rgba(2,6,23,0.96))";
};

const getPointShopAuraBackground = (item: any, badgeTheme: any) => {
  if (item?.reward_type === "badge") return badgeTheme.aura;
  if (item?.reward_type === "enhance_stone") {
    return "radial-gradient(circle at top right, rgba(251,191,36,0.22), transparent 40%), radial-gradient(circle at bottom left, rgba(168,85,247,0.16), transparent 44%)";
  }
  if (item?.reward_type === "nickname_effect") {
    const theme = getNicknameEffectTheme(item);
    return `radial-gradient(circle at top right, ${hexToRgba(theme.glow, 0.24)}, transparent 42%)`;
  }
  if (item?.reward_type === "enhance_protect_ticket") {
    return "radial-gradient(circle at top right, rgba(244,114,182,0.22), transparent 42%), radial-gradient(circle at bottom left, rgba(251,191,36,0.18), transparent 44%)";
  }
  return "radial-gradient(circle at top right, rgba(168,85,247,0.18), transparent 42%)";
};

const formatProbabilityText = (value: any) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num <= 0) return "0%";
  const normalized = Math.round(num * 100) / 100;
  return `${normalized % 1 === 0 ? normalized.toFixed(0) : normalized.toFixed(2)}%`;
};

const getProbabilityNumber = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const isRareOrBetterWeapon = (rarity: any) => {
  const normalized = normalizeWeaponRarity(rarity);
  return normalized === "rare" || normalized === "epic" || normalized === "legendary";
};

const buildEqualProbabilityMap = (ids: string[]) => {
  if (!Array.isArray(ids) || ids.length === 0) return {} as Record<string, string>;
  const base = Math.floor((100 / ids.length) * 100) / 100;
  let consumed = 0;
  const next: Record<string, string> = {};
  ids.forEach((id, index) => {
    const value = index === ids.length - 1 ? Math.max(0, Math.round((100 - consumed) * 100) / 100) : base;
    consumed += value;
    next[String(id)] = value.toFixed(2);
  });
  return next;
};

const getProbabilityTotal = (map: Record<string, string | number>, ids: string[]) =>
  ids.reduce((sum, id) => sum + getProbabilityNumber(map?.[String(id)]), 0);

const isWeaponGachaAvailable = (item: any) => {
  const now = Date.now();
  const from = item?.available_from ? new Date(item.available_from).getTime() : null;
  const to = item?.available_to ? new Date(item.available_to).getTime() : null;
  if (!item?.is_active) return false;
  if (from && now < from) return false;
  if (to && now > to) return false;
  return true;
};

const getWeaponGachaStatusText = (item: any) => {
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

const WeaponImage = ({
  weapon,
  className = "h-12 w-12 rounded-xl",
}: {
  weapon: any;
  className?: string;
}) => {
  const theme = getWeaponTheme(weapon);
  return weapon?.image_url ? (
    <img
      src={weapon.image_url}
      className={`${className} object-cover border`}
      style={{ borderColor: theme.border, boxShadow: `0 0 18px ${theme.glow}` }}
    />
  ) : (
    <div
      className={`${className} flex items-center justify-center border`}
      style={{ background: theme.background, borderColor: theme.border, boxShadow: `0 0 18px ${theme.glow}` }}
    >
      <Swords size={18} style={{ color: theme.text }} />
          </div>
  );
};




const HomeFeaturePortal = ({
  contentView,
  setContentView,
}: {
  contentView: string;
  setContentView: (value: string) => void;
}) => {
  const cards = [
    {
      key: "레이드",
      title: "레이드",
      subtitle: "주간 레이드 공략과 콘텐츠 정보를 한눈에 확인",
      badge: "Core Content",
      icon: <Swords size={22} />,
      stats: "주요 레이드 콘텐츠",
      glow: "from-amber-300/16 via-amber-200/8 to-transparent",
      activeClass: "border-amber-200/24 bg-amber-300/[0.08] shadow-[0_18px_40px_rgba(245,188,93,0.14)]",
    },
    {
      key: "가디언 토벌",
      title: "가디언 토벌",
      subtitle: "토벌 루트와 보상 흐름을 빠르게 확인",
      badge: "Field Hunt",
      icon: <Shield size={22} />,
      stats: "토벌 정보 바로가기",
      glow: "from-yellow-200/14 via-amber-200/8 to-transparent",
      activeClass: "border-yellow-200/22 bg-yellow-200/[0.06] shadow-[0_18px_40px_rgba(250,218,122,0.12)]",
    },
    {
      key: "클래스",
      title: "클래스",
      subtitle: "직업별 특징과 세팅 정보를 정돈된 구조로 탐색",
      badge: "Class Index",
      icon: <Sparkles size={22} />,
      stats: "캐릭터 빌드 탐색",
      glow: "from-orange-200/14 via-amber-200/8 to-transparent",
      activeClass: "border-orange-200/22 bg-orange-200/[0.06] shadow-[0_18px_40px_rgba(251,191,36,0.12)]",
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 pb-3 md:pb-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-amber-300/90">Feature Gateway</div>
          <h2 className="mt-2 text-xl font-semibold tracking-[0.02em] text-white md:text-2xl">
            핵심 콘텐츠 바로가기
          </h2>
          <p className="mt-2 text-sm text-stone-400">
            자주 보는 콘텐츠를 더 빠르고 선명하게 모아둔 구간이야.
          </p>
        </div>
        <div className="hidden rounded-[1.35rem] border border-amber-100/10 bg-white/[0.03] px-4 py-3 text-right shadow-[0_12px_30px_rgba(0,0,0,0.18)] md:block">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">현재 선택</div>
          <div className="mt-1 text-base font-semibold text-amber-100">{contentView}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => {
          const active = contentView === card.key;
          return (
            <motion.button
              key={card.key}
              whileHover={{ y: -3, scale: 1.006 }}
              onClick={() => setContentView(card.key)}
              className={cn(
                "group relative overflow-hidden rounded-[1.55rem] border border-amber-100/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.034),rgba(255,255,255,0.02))] p-4 text-left backdrop-blur-xl transition-all shadow-[0_18px_38px_rgba(0,0,0,0.24)]",
                active ? card.activeClass : "hover:border-amber-200/18 hover:bg-white/[0.045] hover:shadow-[0_18px_42px_rgba(0,0,0,0.28)]"
              )}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.glow} opacity-90`} />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-100/20 to-transparent" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-amber-100/12 bg-white/[0.05] text-amber-100 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                    {card.icon}
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.035] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-300">
                    {card.badge}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-lg font-semibold text-white">{card.title}</div>
                  <div className="mt-1.5 text-sm leading-6 text-stone-300">
                    {card.subtitle}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                  <div className="text-xs font-medium text-stone-400">{card.stats}</div>
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-[11px] font-medium transition-all",
                      active
                        ? "border-amber-100/12 bg-white/[0.08] text-amber-50"
                        : "border-white/10 bg-white/[0.04] text-stone-300 group-hover:text-amber-50"
                    )}
                  >
                    {active ? "현재 선택됨" : "열기"}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};

const HomeNoticeSection = ({ user, profile }: { user: UserLike; profile: ProfileLike }) => {
  const [notices, setNotices] = useState<PostLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState<PostLike | null>(null);

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
    <section className="mx-auto max-w-7xl px-6 pb-4 pt-2 md:pt-3">
      <div className="overflow-hidden rounded-[1.85rem] border border-amber-100/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.018))] shadow-[0_28px_70px_rgba(0,0,0,0.26)]">
        <div className="border-b border-white/8 px-5 py-4 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/16 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                <Bell size={13} />
                Guild Notice
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-[0.02em] text-white">
                공지사항
              </h2>
              <p className="mt-1 text-sm text-stone-400">
                길드 운영에 필요한 핵심 공지를 정리해서 보여줘.
              </p>
            </div>

            <div className="rounded-[1.35rem] border border-amber-100/10 bg-white/[0.03] px-4 py-3 text-right shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                Total
              </div>
              <div className="mt-1 text-lg font-semibold text-amber-100">{notices.length}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 p-3 md:p-4">
          {loading && (
            <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-stone-500">
              공지 불러오는 중...
            </div>
          )}

          {!loading && notices.length === 0 && (
            <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-stone-500">
              아직 등록된 공지가 없어.
            </div>
          )}

          {!loading &&
            notices.map((notice) => (
              <button
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className={cn(
                  "w-full rounded-[1.35rem] border px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-amber-200/22 hover:bg-white/[0.05] hover:shadow-[0_14px_28px_rgba(0,0,0,0.16)] cursor-pointer",
                  notice.is_pinned
                    ? "border-amber-200/18 bg-[linear-gradient(180deg,rgba(245,194,105,0.09),rgba(245,194,105,0.04))]"
                    : "border-white/10 bg-white/[0.03]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      {notice.is_pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/18 bg-amber-300/12 px-2 py-1 text-[10px] font-semibold text-amber-100">
                          <Pin size={11} />
                          PIN
                        </span>
                      )}
                      <span className="inline-flex rounded-full border border-amber-200/18 bg-amber-300/12 px-2 py-1 text-[10px] font-semibold text-amber-200">
                        공지
                      </span>
                      <span className="text-[11px] text-stone-500">{formatDateTime(notice.created_at)}</span>
                    </div>

                    <div className="truncate text-base font-semibold text-white">
                      {notice.title}
                    </div>
                    <div className="mt-1.5 line-clamp-1 text-sm text-stone-400">
                      {notice.content}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[11px] font-medium text-stone-300">
                    보기
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* 공지 상세 모달 */}
      <AnimatePresence>
        {selectedNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(2,6,23,0.82)] p-4 backdrop-blur-xl md:p-6"
            onClick={() => setSelectedNotice(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-amber-100/12 bg-[#0d0a06]/95 shadow-[0_28px_80px_rgba(0,0,0,0.56)] backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="border-b border-white/8 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {selectedNotice.is_pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/18 bg-amber-300/12 px-2 py-1 text-[10px] font-semibold text-amber-100">
                          <Pin size={11} />
                          PIN
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/16 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                        <Bell size={11} />
                        공지
                      </span>
                      <span className="text-[11px] text-stone-500">{formatDateTime(selectedNotice.created_at)}</span>
                    </div>
                    <h3 className="text-xl font-semibold leading-snug text-white md:text-2xl">
                      {selectedNotice.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedNotice(null)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.08] hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* 모달 본문 */}
              <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
                <div className="text-sm leading-7 text-stone-300 whitespace-pre-wrap">
                  {selectedNotice.content || "내용이 없습니다."}
                </div>
                {selectedNotice.image_url && (
                  <img
                    src={selectedNotice.image_url}
                    alt="공지 이미지"
                    className="mt-6 w-full rounded-2xl border border-white/10 object-cover"
                  />
                )}
              </div>

              {/* 모달 푸터 */}
              <div className="border-t border-white/8 px-6 py-4">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const MiniStat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">{label}</div>
    <div className="mt-1 text-lg font-semibold">{value}</div>
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

const getShopItemHighlights = (item: any) => {
  const lines = String(item?.description || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);

  const highlights: string[] = [];

  if (item?.reward_type === "badge") {
    const theme = getBadgeVisualTheme(item);
    highlights.push(`장착 시 길드 카드에 ${theme.label} 그라데이션 적용`);
  }

  if (item?.reward_type === "nickname_effect") {
    const theme = getNicknameEffectTheme(item);
    highlights.push(`마이룸 닉네임에 ${theme.label} 효과 적용`);
    highlights.push("구매 후 마이룸에서 바로 적용 가능");
  }

  if (item?.reward_type === "enhance_stone") {
    highlights.push(`강화 보조 효과 · ${getEnhancementItemEffectText(item)}`);
    highlights.push("마이룸 강화 시 최고 등급 강화석 자동 사용");
  }

  if (item?.reward_type === "enhance_protect_ticket") {
    highlights.push("고강 파손 판정 시 자동으로 1개 사용");
    highlights.push("파손만 막고 실패 자체는 그대로 처리");
  }

  if (item?.reward_type === "badge" && (item?.badge_name || item?.title)) {
    highlights.push(`획득 뱃지명 · ${item?.badge_name || item?.title}`);
  }

  if (item?.price) {
    highlights.push(`구매 비용 · ${item.price}P`);
  }

  for (const line of lines) {
    if (!highlights.includes(line)) highlights.push(line);
  }

  return highlights.slice(0, 4);
};

const getShopMoodLine = (item: any) => {
  if (item?.reward_type === "badge") {
    const theme = getBadgeVisualTheme(item);
    return `${theme.label}로 길드 카드 분위기를 바로 바꿔주는 커스텀 뱃지`;
  }

  if (item?.reward_type === "nickname_effect") {
    const theme = getNicknameEffectTheme(item);
    return `${theme.label} 효과로 마이룸 닉네임을 꾸밀 수 있는 커스텀 상품`;
  }

  if (item?.reward_type === "enhance_stone") {
    return `${getEnhancementItemEffectText(item)} 효과를 가진 무기 강화 보조 아이템`;
  }

  if (item?.reward_type === "enhance_protect_ticket") {
    return "고강 실패 시 파손 판정을 막아주는 강화 보호권";
  }

  return item?.description?.trim()
    ? String(item.description).trim().split(/\n+/)[0]
    : "길드 활동에 재미를 더해주는 포인트샵 상품";
};

const BADGE_PRESET_COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#22c55e",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
];

type PointRateSettings = {
  enabled: boolean;
  cycle_minutes: number;
  daily_cap: number;
  enhancement_bonus_per_5: number;
  rate_by_rarity: Record<WeaponRarityKey, number>;
  ui_images?: {
    background_image_url?: string;
    side_left_image_url?: string;
    side_right_image_url?: string;
    side_left_enabled?: boolean;
    side_right_enabled?: boolean;
    spline_scene_url?: string;
    spline_enabled?: boolean;
  };
};

const normalizePointRateSettings = (value: any): PointRateSettings => {
  const raw = value && typeof value === "object" ? value : {};
  return {
    enabled: raw.enabled !== false,
    cycle_minutes: Math.max(5, Math.min(240, Math.round(Number(raw.cycle_minutes) || 60))),
    daily_cap: Math.max(0, Math.min(100000, Math.round(Number(raw.daily_cap) || 500))),
    enhancement_bonus_per_5: Math.max(0, Math.min(1000, Math.round(Number(raw.enhancement_bonus_per_5) || 2))),
    rate_by_rarity: {
      common: Math.max(0, Math.round(Number(raw?.rate_by_rarity?.common) || 10)),
      rare: Math.max(0, Math.round(Number(raw?.rate_by_rarity?.rare) || 15)),
      epic: Math.max(0, Math.round(Number(raw?.rate_by_rarity?.epic) || 22)),
      legendary: Math.max(0, Math.round(Number(raw?.rate_by_rarity?.legendary) || 30)),
    },
    ui_images: {
      background_image_url: String(raw?.ui_images?.background_image_url || ""),
      side_left_image_url: String(raw?.ui_images?.side_left_image_url || ""),
      side_right_image_url: String(raw?.ui_images?.side_right_image_url || ""),
      side_left_enabled: raw?.ui_images?.side_left_enabled !== false,
      side_right_enabled: raw?.ui_images?.side_right_enabled !== false,
      spline_scene_url: String(raw?.ui_images?.spline_scene_url || ""),
      spline_enabled: raw?.ui_images?.spline_enabled === true,
    },
  };
};

const normalizeAppSettings = (value: any) => {
  const raw = value && typeof value === "object" ? value : {};
  return {
    ...defaultSettings,
    ...raw,
    point_rate_settings: normalizePointRateSettings(raw?.point_rate_settings),
  };
};

const fetchSingletonSettingsRow = async () => {
  const client = getSupabaseOrThrow();

  const attempts = [
    () => client.from("settings").select("*").order("id", { ascending: true }).limit(1).maybeSingle(),
    () => client.from("settings").select("*").limit(1).maybeSingle(),
  ];

  for (const run of attempts) {
    const result = await run();
    if (!result.error) return result;
    const message = String(result.error.message || "");
    if (!message.includes("column settings.created_at does not exist")) {
      return result;
    }
  }

  return client.from("settings").select("*").limit(1).maybeSingle();
};

const saveSingletonSettings = async (settingsLike: any) => {
  const client = getSupabaseOrThrow();
  const payload = normalizeAppSettings(settingsLike);
  const settingsId = payload?.id || null;

  if (settingsId) {
    const { error } = await client.from("settings").update(payload).eq("id", settingsId);
    return { error, payload };
  }

  const { data: existing, error: fetchError } = await fetchSingletonSettingsRow();

  if (fetchError) {
    return { error: fetchError, payload };
  }

  if (existing?.id) {
    const { error } = await client.from("settings").update(payload).eq("id", existing.id);
    return { error, payload: { ...payload, id: existing.id } };
  }

  const { data: inserted, error } = await client
    .from("settings")
    .insert(payload)
    .select("*")
    .maybeSingle();

  return {
    error,
    payload: inserted ? normalizeAppSettings(inserted) : payload,
  };
};

const getPointRateForCharacter = (character: any, settingsLike: any) => {
  const settings = normalizePointRateSettings(settingsLike);
  const rarity = normalizeWeaponRarity(character?.equipped_weapon_rarity);
  const enhancementLevel = normalizeEnhancementLevel(character?.equipped_weapon_level);
  const base = Number(settings.rate_by_rarity?.[rarity] || 0);
  const bonus = Math.floor(enhancementLevel / 5) * Number(settings.enhancement_bonus_per_5 || 0);
  return Math.max(0, base + bonus);
};

const getBestPointCharacter = (characters: any[], settingsLike: any) => {
  const rows = Array.isArray(characters) ? characters : [];
  const cycleMinutes = Math.max(5, Number(settingsLike?.cycle_minutes || 60));
  return rows
    .filter((character: any) => character?.equipped_weapon_name)
    .map((character: any) => {
      const pointRatePerTick = getPointRateForCharacter(character, settingsLike);
      const estimatedHourlyPointRate = Math.max(0, Math.round(pointRatePerTick * (60 / cycleMinutes)));
      return {
        ...character,
        point_rate_per_tick: pointRatePerTick,
        hourly_point_rate: estimatedHourlyPointRate,
      };
    })
    .sort((a: any, b: any) => {
      if (b.point_rate_per_tick !== a.point_rate_per_tick) return b.point_rate_per_tick - a.point_rate_per_tick;
      return normalizeEnhancementLevel(b?.equipped_weapon_level) - normalizeEnhancementLevel(a?.equipped_weapon_level);
    })[0] || null;
};

const getNextPointTickInfo = (lastTickAt: string | null | undefined, cycleMinutes: number) => {
  const cycleMs = Math.max(5, Number(cycleMinutes || 60)) * 60 * 1000;
  const parsedLast = lastTickAt ? new Date(lastTickAt).getTime() : NaN;
  const last = Number.isFinite(parsedLast) ? parsedLast : Date.now();
  const nextAt = new Date(last + cycleMs);
  const remainingMs = Math.max(0, nextAt.getTime() - Date.now());
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return {
    nextAt,
    remainingMs,
    formatted: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  };
};

type NicknameEffectKey = "none" | "violet" | "sunset" | "ocean" | "emerald" | "rose" | "gold" | "rainbow";

const NICKNAME_EFFECT_PRESETS: Record<NicknameEffectKey, { label: string; from: string; to: string; glow: string }> = {
  none: { label: "기본", from: "#ffffff", to: "#ffffff", glow: "#a78bfa" },
  violet: { label: "바이올렛", from: "#c4b5fd", to: "#7c3aed", glow: "#8b5cf6" },
  sunset: { label: "선셋", from: "#fb7185", to: "#f59e0b", glow: "#fb7185" },
  ocean: { label: "오션", from: "#67e8f9", to: "#2563eb", glow: "#38bdf8" },
  emerald: { label: "에메랄드", from: "#6ee7b7", to: "#059669", glow: "#10b981" },
  rose: { label: "로즈", from: "#f9a8d4", to: "#db2777", glow: "#ec4899" },
  gold: { label: "골드", from: "#fde68a", to: "#f59e0b", glow: "#fbbf24" },
  rainbow: { label: "레인보우", from: "#f472b6", to: "#22d3ee", glow: "#a78bfa" },
};

const normalizeNicknameEffectKey = (value: any): NicknameEffectKey => {
  const normalized = String(value || "none").trim().toLowerCase();
  if (["violet", "sunset", "ocean", "emerald", "rose", "gold", "rainbow"].includes(normalized)) {
    return normalized as NicknameEffectKey;
  }
  return "none";
};

const getNicknameEffectTheme = (item: any) => {
  const effectKey = normalizeNicknameEffectKey(item?.nickname_effect_key || item?.active_nickname_effect);
  const preset = NICKNAME_EFFECT_PRESETS[effectKey] || NICKNAME_EFFECT_PRESETS.none;
  return {
    effectKey,
    label: preset.label,
    from: item?.nickname_gradient_from || preset.from,
    to: item?.nickname_gradient_to || preset.to,
    glow: item?.nickname_glow_color || preset.glow,
  };
};

const hasNicknameEffect = (item: any) => {
  const effectKey = normalizeNicknameEffectKey(item?.nickname_effect_key || item?.active_nickname_effect);
  return effectKey !== "none";
};

const getNicknameEffectStyle = (item: any): React.CSSProperties => {
  if (!hasNicknameEffect(item)) return {};
  const theme = getNicknameEffectTheme(item);
  return {
    backgroundImage: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    display: "inline-block",
    textShadow: `0 0 18px ${hexToRgba(theme.glow, 0.32)}`,
  };
};

const PassivePointBackgroundSync = ({
  userId,
  onProfileRefresh,
}: {
  userId: string | null | undefined;
  onProfileRefresh: () => Promise<void> | void;
}) => {
  const syncLockRef = useRef(false);

  const runRefresh = useCallback(async () => {
    if (!userId || syncLockRef.current) return;
    syncLockRef.current = true;
    try {
      await onProfileRefresh();
    } catch (error) {
      console.error("PassivePointBackgroundSync refresh error:", error);
    } finally {
      syncLockRef.current = false;
    }
  }, [userId, onProfileRefresh]);

  useEffect(() => {
    if (!userId) return;

    const minuteTimer = window.setInterval(() => {
      void runRefresh();
    }, 60 * 1000);

    const handleFocus = () => {
      void runRefresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void runRefresh();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(minuteTimer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId, runRefresh]);

  return null;
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState<UserLike>(null);
  const [profile, setProfile] = useState<ProfileLike>(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(supabaseConfigError);
  const [contentView, setContentView] = useState("레이드");
  const [posts, setPosts] = useState<PostLike[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [isRaidCalendarModalOpen, setIsRaidCalendarModalOpen] = useState(false);
  const [postInitialTab, setPostInitialTab] = useState("all");


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
    setSettings(normalizeAppSettings(cachedSettings));
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
      fetchSingletonSettingsRow(),
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
        const nextSettings = normalizeAppSettings(data);
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
        <div className="min-h-screen flex items-center justify-center text-amber-200 font-semibold">
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
            <div className="text-[11px] font-semibold tracking-[0.3em] uppercase text-red-300">
              Boot Error
            </div>
            <h1 className="mt-3 text-3xl font-semibold">홈페이지 초기화 실패</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {bootError}
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-400">
              Vercel 프로젝트 환경변수와 Supabase 연결값을 다시 확인한 뒤 재배포하세요.
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell settings={settings}>
      <ToastViewport />
      <div className="relative z-10">
        {profile?.role === "admin" && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-[#2a2116] via-[#1a140f] to-[#23190f] text-[10px] font-semibold py-1 text-center tracking-[0.24em] uppercase">
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

        <PassivePointBackgroundSync
          userId={user?.id}
          onProfileRefresh={async () => {
            if (user?.id) {
              await fetchProfile(user.id);
            }
          }}
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
                <Hero
                  settings={settings}
                  posts={posts}
                  onOpenRaidCalendar={() => setIsRaidCalendarModalOpen(true)}
                  onNavigateToNotices={() => { setPostInitialTab("notice"); setActiveTab("posts"); }}
                />
                <HomeFeaturePortal contentView={contentView} setContentView={setContentView} />
                <MainContentViewer type={contentView} />
                <HomeNoticeSection user={user} profile={profile} />
                <MonthlyRaidCalendarModal
                  open={isRaidCalendarModalOpen}
                  onClose={() => setIsRaidCalendarModalOpen(false)}
                  user={user}
                  profile={profile}
                />
              </motion.div>
            )}

            {activeTab === "posts" && (
              <motion.div
                key="posts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PostBoard posts={posts} user={user} profile={profile} onRefresh={fetchInitialData} initialTab={postInitialTab} />
              </motion.div>
            )}

            {activeTab === "myroom" && (
              <motion.div
                key="myroom"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MyRoom user={user} profile={profile} setProfile={setProfile} fetchProfile={fetchProfile} />
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


const ToastViewport = () => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string; message: string; type: ToastType }>;
      const detail = customEvent.detail;
      if (!detail?.message) return;

      setToasts((prev) => [...prev, detail]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== detail.id));
      }, 2800);
    };

    window.addEventListener("app-toast", handleToast as EventListener);
    return () => window.removeEventListener("app-toast", handleToast as EventListener);
  }, []);

  const toneClass = (type: ToastType) => {
    if (type === "success") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
    if (type === "error") return "border-rose-400/20 bg-rose-400/10 text-rose-100";
    return "border-amber-300/20 bg-amber-300/10 text-amber-50";
  };

  const labelText = (type: ToastType) => {
    if (type === "success") return "Success";
    if (type === "error") return "Error";
    return "Notice";
  };

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[250] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={`pointer-events-auto overflow-hidden rounded-[1.35rem] border px-4 py-3 shadow-[0_18px_50px_rgba(2,6,23,0.38)] backdrop-blur-xl ${toneClass(toast.type)}`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.24em] opacity-80">
              {labelText(toast.type)}
            </div>
            <div className="mt-1 text-sm font-medium leading-6">{toast.message}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};



// ─────────────────────────────────────────────
// Spline 배경 컴포넌트 (Web Component 동적 로드)
// ─────────────────────────────────────────────
const SPLINE_VIEWER_SRC = "https://unpkg.com/@splinetool/viewer@1.12.90/build/spline-viewer.js";

const SplineBackground = ({ sceneUrl }: { sceneUrl: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!sceneUrl) return;

    const existingScript = document.querySelector(`script[src="${SPLINE_VIEWER_SRC}"]`);
    if (existingScript) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = SPLINE_VIEWER_SRC;
    script.onload = () => setLoaded(true);
    script.onerror = () => console.warn("Spline viewer 스크립트 로드 실패");
    document.head.appendChild(script);

    return () => {
      // 스크립트는 전역 등록이므로 제거하지 않음
    };
  }, [sceneUrl]);

  useEffect(() => {
    if (!loaded || !containerRef.current || !sceneUrl) return;
    containerRef.current.innerHTML = "";
    const viewer = document.createElement("spline-viewer") as HTMLElement;
    viewer.setAttribute("url", sceneUrl);
    viewer.setAttribute("loading-anim-type", "none");
    viewer.style.cssText = "width:100%;height:100%;position:absolute;inset:0;";
    containerRef.current.appendChild(viewer);
  }, [loaded, sceneUrl]);

  if (!sceneUrl) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  );
};

const PageShell = ({ children, settings: settingsProp }: { children: React.ReactNode; settings?: any }) => {
  const shellSettings = normalizeAppSettings(settingsProp || readCache(CACHE_KEYS.settings, defaultSettings));
  const uiImages = shellSettings?.point_rate_settings?.ui_images || {};

  const backgroundImageUrl = String(uiImages?.background_image_url || "").trim();
  const sideLeftImageUrl = String(uiImages?.side_left_image_url || "").trim();
  const sideRightImageUrl = String(uiImages?.side_right_image_url || "").trim();
  const sideLeftEnabled = uiImages?.side_left_enabled !== false;
  const sideRightEnabled = uiImages?.side_right_enabled !== false;
  const splineSceneUrl = String(uiImages?.spline_scene_url || "").trim();
  const splineEnabled = uiImages?.spline_enabled === true && !!splineSceneUrl;

  const showLeft = sideLeftEnabled && !!sideLeftImageUrl;
  const showRight = sideRightEnabled && !!sideRightImageUrl;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090705] text-white selection:bg-amber-300/25">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        
        {/* Spline 배경 (활성화 시 최우선 표시) */}
        {splineEnabled ? (
          <>
            <SplineBackground sceneUrl={splineSceneUrl} />
            {/* Spline 위에 어두운 오버레이로 가독성 확보 */}
            <div className="absolute inset-0 bg-[#090705]/40" style={{ zIndex: 1 }} />
          </>
        ) : (
          /* 기존 이미지 배경 */
          backgroundImageUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `linear-gradient(180deg,rgba(9,7,5,0.38),rgba(9,7,5,0.78)), url(${backgroundImageUrl})`,
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-black" />
          )
        )}

        {/* 좌측 사이드 이미지 */}
        {showLeft && (
          <div className="absolute left-[-40px] top-0 hidden h-full w-[420px] 2xl:block">
            <div
              className="absolute inset-y-[9%] left-0 w-full rounded-r-[3rem] bg-contain bg-left bg-no-repeat opacity-70"
              style={{
                backgroundImage: `linear-gradient(90deg,rgba(9,7,5,0.28),transparent 52%,rgba(9,7,5,0.66)), url(${sideLeftImageUrl})`,
              }}
            />
          </div>
        )}

        {/* 우측 사이드 이미지 */}
        {showRight && (
          <div className="absolute right-[-40px] top-0 hidden h-full w-[420px] 2xl:block">
            <div
              className="absolute inset-y-[9%] right-0 w-full rounded-l-[3rem] bg-contain bg-right bg-no-repeat opacity-70"
              style={{
                backgroundImage: `linear-gradient(270deg,rgba(9,7,5,0.28),transparent 52%,rgba(9,7,5,0.66)), url(${sideRightImageUrl})`,
              }}
            />
          </div>
        )}

        {/* 기존 ambient glow 유지 */}
        <motion.div
          className="absolute left-1/2 top-[-220px] h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-amber-200/12 blur-[148px]"
          animate={{ opacity: [0.28, 0.46, 0.28], scale: [0.98, 1.04, 0.98] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {children}
    </div>
  );
};


const Hero = ({ settings, posts, onOpenRaidCalendar, onNavigateToNotices }: any) => {
  const [heroStats, setHeroStats] = useState({
    memberCount: 0,
    upcomingRaids: 0,
    nextRaidLabel: "예정된 일정 없음",
    nextRaidDate: "",
  });
  const [weeklySchedules, setWeeklySchedules] = useState<Record<string, any[]>>({});
  const [selectedWeekDate, setSelectedWeekDate] = useState("");
  const noticeCount = Array.isArray(posts) ? posts.filter((post: any) => post?.is_notice).length : 0;
  const pinnedCount = Array.isArray(posts) ? posts.filter((post: any) => post?.is_pinned).length : 0;

  const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];

  const parseLocalDate = useCallback((dateKey: string) => {
    const [year, month, day] = String(dateKey || "")
      .split("-")
      .map((value) => Number(value));
    if (!year || !month || !day) return new Date();
    return new Date(year, month - 1, day);
  }, []);

  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(today.getDate() + mondayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(monday);
      value.setDate(monday.getDate() + index);
      return {
        key: formatDate(value.getFullYear(), value.getMonth(), value.getDate()),
        label: dayLabels[index],
        date: value,
        day: value.getDate(),
        isToday: isSameDay(value, new Date()),
      };
    });
  }, []);

  const currentWeekRange = useMemo(() => {
    const start = currentWeekDays[0]?.key || getTodayKey();
    const end = currentWeekDays[currentWeekDays.length - 1]?.key || getTodayKey();
    return { start, end };
  }, [currentWeekDays]);

  useEffect(() => {
    let mounted = true;

    const fetchHeroStats = async () => {
      if (!supabase) return;

      try {
        const today = getTodayKey();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekKey = formatDate(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate());

        const [membersRes, schedulesRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("raid_schedules")
            .select("*")
            .gte("raid_date", currentWeekRange.start)
            .lte("raid_date", currentWeekRange.end)
            .order("raid_date", { ascending: true })
            .order("raid_time", { ascending: true }),
        ]);

        const upcomingRes = await supabase
          .from("raid_schedules")
          .select("*")
          .gte("raid_date", today)
          .lte("raid_date", nextWeekKey)
          .order("raid_date", { ascending: true })
          .order("raid_time", { ascending: true });

        if (!mounted) return;

        const scheduleMap = (schedulesRes.data || []).reduce((acc: Record<string, any[]>, raid: any) => {
          const key = raid.raid_date || today;
          if (!acc[key]) acc[key] = [];
          acc[key].push(raid);
          return acc;
        }, {});

        const upcomingSchedules = upcomingRes.data || [];
        const nextRaid = upcomingSchedules[0];

        setWeeklySchedules(scheduleMap);
        setSelectedWeekDate((prev) => {
          if (prev && currentWeekDays.some((day) => day.key === prev)) return prev;
          const todayMatch = currentWeekDays.find((day) => day.key === today);
          return todayMatch?.key || currentWeekDays[0]?.key || "";
        });
        setHeroStats({
          memberCount: membersRes.count || 0,
          upcomingRaids: upcomingSchedules.length,
          nextRaidLabel: nextRaid?.raid_name || "예정된 일정 없음",
          nextRaidDate: nextRaid
            ? `${nextRaid.raid_date || ""} ${nextRaid.raid_time || ""}`.trim()
            : "",
        });
      } catch (error) {
        console.error("Hero stats fetch error:", error);
      }
    };

    void fetchHeroStats();

    return () => {
      mounted = false;
    };
  }, [posts, currentWeekRange.start, currentWeekRange.end, currentWeekDays]);

  const selectedDay = currentWeekDays.find((day) => day.key === selectedWeekDate) || currentWeekDays[0];
  const selectedSchedules = selectedDay ? weeklySchedules[selectedDay.key] || [] : [];
  const primarySchedule = selectedSchedules[0];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,194,105,0.12),transparent_26%),linear-gradient(180deg,rgba(24,18,13,0.02),rgba(24,18,13,0.08)_54%,transparent)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-start gap-4 px-6 pb-4 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)] xl:grid-cols-[minmax(0,1fr)_340px_260px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72 }}
          className="pt-1 text-center md:text-left"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/14 bg-white/[0.035] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-amber-200">
            <Sparkles size={10} />
            Guild Residence
          </span>

          <h1 className="mt-4 bg-gradient-to-b from-[#fff9ef] via-[#f3e1b8] to-[#b88d44] bg-clip-text text-4xl font-semibold leading-none tracking-[0.01em] text-transparent md:text-5xl">
            {getDisplayGuildName(settings?.guild_name)}
          </h1>

          <p className="mt-3 max-w-xl text-sm font-normal leading-7 text-stone-300">
            {settings?.guild_description}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
            <button
              type="button"
              onClick={onNavigateToNotices}
              className="rounded-[1.2rem] border border-amber-100/10 bg-white/[0.035] px-3.5 py-2.5 backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.16)] hover:border-amber-200/30 hover:bg-amber-300/[0.06] transition-all cursor-pointer text-left"
              title="게시판 공지 탭으로 이동"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                공지
              </div>
              <div className="mt-1 text-lg font-semibold text-amber-50">{noticeCount}</div>
            </button>
            <div className="rounded-[1.2rem] border border-amber-100/10 bg-white/[0.035] px-3.5 py-2.5 backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                7일 일정
              </div>
              <div className="mt-1 text-lg font-semibold text-amber-50">{heroStats.upcomingRaids}</div>
            </div>
            <div className="rounded-[1.2rem] border border-amber-100/10 bg-white/[0.035] px-3.5 py-2.5 backdrop-blur-md shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                길드원
              </div>
              <div className="mt-1 text-lg font-semibold text-amber-50">{heroStats.memberCount}</div>
            </div>
          </div>

          <div className="mt-5 flex justify-center md:justify-start">
            <button
              type="button"
              onClick={onOpenRaidCalendar}
              className="group inline-flex items-center gap-2 rounded-[1.3rem] border border-amber-200/16 bg-[linear-gradient(180deg,rgba(245,194,105,0.12),rgba(245,194,105,0.06))] px-4 py-2.5 text-sm font-medium text-amber-50 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-amber-100/26 hover:text-white hover:shadow-[0_16px_30px_rgba(214,164,78,0.14)]"
            >
              <CalendarDays size={16} className="transition-transform group-hover:scale-105" />
              월별 레이드 일정
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.76, delay: 0.05 }}
          className="relative hidden h-full lg:block"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-amber-300/8 blur-3xl" />
          <div className="relative flex h-full min-h-[148px] flex-col overflow-hidden rounded-[1.85rem] border border-amber-100/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-3 backdrop-blur-2xl shadow-[0_22px_52px_rgba(0,0,0,0.24)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(246,205,127,0.14),transparent_46%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
                  Weekly Raid Schedule
                </div>
                <div className="mt-1 text-lg font-semibold text-white">이번주 레이드</div>
              </div>
              <button
                type="button"
                onClick={onOpenRaidCalendar}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200/12 bg-amber-300/[0.08] text-amber-50 transition-all hover:border-amber-100/24 hover:bg-amber-300/[0.12] hover:text-white"
                aria-label="월별 레이드 일정 보기"
              >
                <CalendarDays size={16} />
              </button>
            </div>

            <div className="relative mt-3 grid grid-cols-7 gap-1.5">
              {currentWeekDays.map((day) => {
                const hasSchedule = (weeklySchedules[day.key]?.length || 0) > 0;
                const isSelected = selectedDay?.key === day.key;
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedWeekDate(day.key)}
                    className={[
                      "relative flex h-11 flex-col items-center justify-center rounded-xl border text-center transition-all",
                      isSelected
                        ? "border-amber-200/35 bg-amber-300/[0.16] text-white shadow-[0_0_0_1px_rgba(245,197,92,0.12)_inset]"
                        : hasSchedule
                        ? "border-amber-200/18 bg-amber-300/[0.08] text-amber-50 hover:border-amber-100/26 hover:bg-amber-300/[0.11]"
                        : "border-white/7 bg-white/[0.03] text-stone-300 hover:border-white/10 hover:bg-white/[0.05]",
                    ].join(" ")}
                  >
                    {hasSchedule && (
                      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.55)]" />
                    )}
                    <span className="text-[9px] font-semibold">{day.label}</span>
                    <span className="mt-0.5 text-sm font-medium leading-none">{day.day}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative mt-3 flex flex-1 flex-col rounded-[1.1rem] border border-white/7 bg-black/18 p-2.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-white">
                  {selectedDay ? `${selectedDay.label}요일 일정` : "이번주 일정"}
                </span>
                <span className="text-stone-400">
                  {selectedDay ? parseLocalDate(selectedDay.key).toLocaleDateString("ko-KR") : ""}
                </span>
              </div>

              {primarySchedule ? (
                <div className="mt-2 flex flex-1 flex-col justify-between rounded-[1rem] border border-amber-200/14 bg-[linear-gradient(135deg,rgba(59,41,18,0.86),rgba(29,22,15,0.96))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-white">
                        {primarySchedule.raid_name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-300">
                        <span>{primarySchedule.difficulty || "노말"}</span>
                        <span className="text-stone-600">·</span>
                        <span>{primarySchedule.type || "raid"}</span>
                        {selectedSchedules.length > 1 && (
                          <>
                            <span className="text-stone-600">·</span>
                            <span>+{selectedSchedules.length - 1}건 더 있음</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-base font-semibold text-amber-50">
                      {primarySchedule.raid_time || "--:--"}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-stone-400">
                    {selectedSchedules.length > 1
                      ? `이 날 등록된 레이드가 ${selectedSchedules.length}건 있습니다.`
                      : "등록된 레이드 정보를 확인하세요."}
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-1 items-center justify-center rounded-[1rem] border border-dashed border-white/10 bg-white/[0.03] px-4 text-center text-sm text-stone-400">
                  등록된 레이드 일정이 없습니다.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.76, delay: 0.1 }}
          className="relative hidden h-full xl:block"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-amber-300/8 blur-3xl" />
          <div className="relative flex h-full min-h-[148px] flex-col overflow-hidden rounded-[1.85rem] border border-amber-100/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-3 backdrop-blur-2xl shadow-[0_22px_52px_rgba(0,0,0,0.24)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(246,205,127,0.12),transparent_46%)]" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/80">
                  Overview
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {getDisplayGuildName(settings?.guild_name)}
                </div>
              </div>
              <div className="rounded-xl border border-amber-200/12 bg-amber-300/[0.08] px-2.5 py-1.5 text-[11px] font-medium text-amber-100">
                Live
              </div>
            </div>

            <div className="relative mt-3 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={onNavigateToNotices}
                className="rounded-[1rem] border border-white/7 bg-white/[0.035] p-2.5 hover:border-amber-200/30 hover:bg-amber-300/[0.06] transition-all cursor-pointer text-left"
                title="게시판 공지 탭으로 이동"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  공지
                </div>
                <div className="mt-1 text-lg font-semibold text-amber-50">{noticeCount}</div>
              </button>
              <div className="rounded-[1rem] border border-white/7 bg-white/[0.035] p-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  고정
                </div>
                <div className="mt-1 text-lg font-semibold text-amber-50">{pinnedCount}</div>
              </div>
              <div className="rounded-[1rem] border border-white/7 bg-white/[0.035] p-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  다음 일정
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-white">{heroStats.nextRaidLabel}</div>
              </div>
            </div>

            <div className="relative mt-2.5 rounded-[1.2rem] border border-white/8 bg-black/18 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                Next Raid
              </div>
              <div className="mt-1.5 truncate text-sm font-semibold text-white">{heroStats.nextRaidLabel}</div>
              <div className="mt-1 text-xs text-stone-400">
                {heroStats.nextRaidDate || "예정된 일정이 없습니다."}
              </div>
            </div>

            <div className="relative mt-2.5 flex-1 rounded-[1.2rem] border border-white/8 bg-black/18 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                    다음 7일 일정
                  </div>
                  <div className="mt-1.5 text-sm font-semibold text-white">{heroStats.upcomingRaids}건</div>
                </div>
                <button
                  type="button"
                  onClick={onOpenRaidCalendar}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200/12 bg-amber-300/[0.08] px-2.5 py-1.5 text-[11px] font-medium text-amber-50 transition hover:border-amber-100/22 hover:bg-amber-300/[0.12]"
                >
                  <CalendarDays size={14} />
                  월별 일정
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const MonthlyRaidCalendarModal = ({ open, onClose, user, profile }: any) => {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 py-5 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="relative flex max-h-[88vh] w-full max-w-[1380px] flex-col overflow-hidden rounded-[2rem] border border-white/8 bg-[#120d08]/95 shadow-[0_22px_72px_rgba(2,6,23,0.52)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[#120d08]/92 px-5 py-4 md:px-6 backdrop-blur-xl">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-amber-200">
                  Monthly Raid Calendar
                </div>
                <h3 className="mt-1 text-lg font-medium text-white md:text-xl">월별 레이드 일정</h3>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.035] text-slate-300 transition-all hover:border-white/14 hover:bg-white/[0.06] hover:text-white"
                aria-label="월별 레이드 일정 닫기"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-1">
              <RaidCalendar user={user} profile={profile} embedded hideRanking />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Navbar = ({ activeTab, setActiveTab, user, profile, onLogout }: any) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const navItems = [
    { id: "home", label: "홈" },
    { id: "posts", label: "게시판" },
    { id: "ranking", label: "랭킹" },
    { id: "guild", label: "길드" },
    ...(user ? [{ id: "shop", label: "포인트샵" }, { id: "myroom", label: "마이룸" }] : []),
    ...(profile?.role === "admin" ? [{ id: "admin", label: "관리자" }] : []),
    ...(user ? [] : [{ id: "login", label: "로그인" }, { id: "signup", label: "회원가입" }]),
  ];

  const displayName =
    profile?.nickname ||
    profile?.display_name ||
    profile?.character_name ||
    profile?.email ||
    (user?.email ? String(user.email).split("@")[0] : "Guest");

  const roleLabel = profile?.role === "admin" ? "Administrator" : user ? "Guild Member" : "Guest";
  const avatarSeed = String(displayName || "G").trim();
  const avatarText = avatarSeed.slice(0, 1).toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMove = (tab: string) => {
    setActiveTab(tab);
    setIsProfileMenuOpen(false);
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-amber-100/10 bg-[linear-gradient(180deg,rgba(16,12,9,0.9),rgba(10,8,6,0.78))] backdrop-blur-2xl shadow-[0_18px_50px_rgba(0,0,0,0.34)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleMove("home")}
            className="group flex items-center gap-3 rounded-[1.1rem] border border-amber-100/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-3 py-2 transition-all hover:border-amber-200/22 hover:bg-amber-300/[0.08] hover:shadow-[0_12px_30px_rgba(212,175,55,0.12)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200/18 bg-[linear-gradient(180deg,rgba(251,191,36,0.16),rgba(120,53,15,0.08))] text-amber-100 shadow-[0_10px_24px_rgba(214,164,78,0.16)]">
              <Shield size={16} />
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/80">
                Guild Service
              </div>
              <div className="text-sm font-semibold tracking-[0.02em] text-white">
                {profile?.role === "admin" ? "Control Center" : "Guild Workspace"}
              </div>
            </div>
          </button>
        </div>

        <div className="hidden items-center gap-1.5 rounded-[1.2rem] border border-amber-100/10 bg-white/[0.03] p-1.5 backdrop-blur-md md:flex">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMove(item.id)}
                className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  active
                    ? "bg-[linear-gradient(180deg,rgba(245,194,105,0.16),rgba(245,194,105,0.08))] text-amber-50 shadow-[inset_0_0_0_1px_rgba(246,205,127,0.16),0_10px_24px_rgba(212,175,55,0.1)]"
                    : "text-stone-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span className="relative z-10">{item.label}</span>
                {active && (
                  <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                className="hidden h-11 w-11 items-center justify-center rounded-[1.1rem] border border-amber-100/10 bg-white/[0.03] text-stone-300 transition-all hover:-translate-y-0.5 hover:border-amber-200/20 hover:bg-amber-300/[0.08] hover:text-white md:flex"
                title="알림"
              >
                <Bell size={16} />
              </button>

              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 rounded-[1.1rem] border border-amber-100/10 bg-white/[0.03] px-3 py-2 transition-all hover:border-amber-200/22 hover:bg-amber-300/[0.08] hover:shadow-[0_12px_30px_rgba(212,175,55,0.12)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] border border-amber-200/18 bg-[linear-gradient(180deg,rgba(251,191,36,0.16),rgba(120,53,15,0.08))] text-sm font-semibold text-amber-50 shadow-[0_8px_24px_rgba(214,164,78,0.16)]">
                    {avatarText}
                  </div>
                  <div className="hidden text-left sm:block">
                    <div className="max-w-[140px] truncate text-sm font-semibold text-white">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-stone-400">
                      {roleLabel}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-stone-500 transition-transform ${
                      isProfileMenuOpen ? "rotate-90 text-amber-200" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 top-[calc(100%+12px)] z-[80] w-64 overflow-hidden rounded-[1.5rem] border border-amber-100/10 bg-[linear-gradient(180deg,rgba(20,15,11,0.96),rgba(10,8,6,0.94))] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
                    >
                      <div className="rounded-[1.2rem] border border-amber-100/10 bg-white/[0.035] p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                          Signed In
                        </div>
                        <div className="mt-2 text-base font-semibold text-white">{displayName}</div>
                        <div className="mt-1 text-xs text-stone-400">{roleLabel}</div>
                      </div>

                      <div className="mt-2 space-y-1">
                        <button
                          onClick={() => handleMove("myroom")}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-stone-300 transition-all hover:bg-white/[0.05] hover:text-white"
                        >
                          <span>마이룸 이동</span>
                          <ChevronRight size={15} />
                        </button>

                        <button
                          onClick={() => handleMove("home")}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-stone-300 transition-all hover:bg-white/[0.05] hover:text-white"
                        >
                          <span>홈으로 이동</span>
                          <ChevronRight size={15} />
                        </button>

                        {profile?.role === "admin" && (
                          <button
                            onClick={() => handleMove("admin")}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-stone-300 transition-all hover:bg-white/[0.05] hover:text-white"
                          >
                            <span>관리자 패널</span>
                            <ChevronRight size={15} />
                          </button>
                        )}

                        <div className="my-1 h-px bg-white/8" />

                        <button
                          onClick={onLogout}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-rose-300 transition-all hover:bg-rose-400/10 hover:text-rose-200"
                        >
                          <span>로그아웃</span>
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMove("login")}
                className="rounded-[1.1rem] border border-amber-100/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-stone-300 transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.08] hover:text-white"
              >
                로그인
              </button>
              <button
                onClick={() => handleMove("signup")}
                className="rounded-[1.1rem] border border-amber-200/14 bg-[linear-gradient(180deg,rgba(245,194,105,0.18),rgba(245,194,105,0.1))] px-4 py-2.5 text-sm font-semibold text-amber-100 transition-all hover:bg-[linear-gradient(180deg,rgba(245,194,105,0.24),rgba(245,194,105,0.12))]"
              >
                회원가입
              </button>
            </div>
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
      showToast(`이미지 업로드 실패: ${err.message}`, "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 text-left">
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest ml-1">
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
          className="flex items-center justify-center gap-3 w-full bg-black border border-white/10 p-4 rounded-2xl cursor-pointer hover:border-amber-400 transition-all text-xs font-semibold text-slate-500 group-hover:text-white"
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
    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest ml-1">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-amber-400 font-bold text-sm text-white transition-all"
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
  <div className="bg-[#0f172a]/80 border border-white/10 rounded-[2rem] p-6 md:p-8">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const MainContentViewer = ({ type }: { type: string }) => {
  const [items, setItems] = useState<any[]>([]);
  const [managerTab, setManagerTab] = useState<"guild" | "nickname" | "weapon" | "enhance_stone">("guild");
  const [nicknameEffectKey, setNicknameEffectKey] = useState<NicknameEffectKey>("violet");
  const [nicknameGradientFrom, setNicknameGradientFrom] = useState(NICKNAME_EFFECT_PRESETS.violet.from);
  const [nicknameGradientTo, setNicknameGradientTo] = useState(NICKNAME_EFFECT_PRESETS.violet.to);
  const [nicknameGlowColor, setNicknameGlowColor] = useState(NICKNAME_EFFECT_PRESETS.violet.glow);
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
    <section className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-1 pb-8">
      {items.length === 0 && (
        <div className="col-span-full text-center text-slate-600 font-semibold py-10 uppercase">
          No Contents Registered.
        </div>
      )}

      {items.map((item) => (
        <motion.div
          whileHover={{ y: -5 }}
          key={item.id ?? item.sub_class}
          onClick={() => setSelectedItem(item)}
          className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/70 aspect-[0.95/1] cursor-pointer shadow-[0_18px_40px_rgba(2,6,23,0.3)] backdrop-blur-md"
        >
          <img
            src={
              item.image_url ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e"
            }
            className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-[#07111f]/35 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-left">
            <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200">
              {type}
            </span>
            <h3 className="text-base font-semibold tracking-tight leading-tight truncate text-white">
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


const getDifficultyTone = (difficulty: string) => {
  const value = String(difficulty || "").trim();
  if (value === "하드") {
    return {
      chip: "border-violet-300/20 bg-violet-400/10 text-violet-100",
      chipSoft: "border-violet-300/18 bg-violet-400/12 text-violet-100",
      active: "border-violet-300/28 bg-violet-400/14 text-white shadow-[0_14px_34px_rgba(139,92,246,0.18)]",
      ring: "from-violet-400 to-fuchsia-300",
      accentText: "text-violet-200",
      badge: "HARD",
    };
  }
  if (value === "나이트메어") {
    return {
      chip: "border-rose-300/20 bg-rose-400/10 text-rose-100",
      chipSoft: "border-rose-300/18 bg-rose-400/12 text-rose-100",
      active: "border-rose-300/28 bg-rose-400/14 text-white shadow-[0_14px_34px_rgba(244,63,94,0.18)]",
      ring: "from-rose-400 to-orange-300",
      accentText: "text-rose-200",
      badge: "NIGHTMARE",
    };
  }
  return {
    chip: "border-amber-200/20 bg-amber-300/10 text-amber-50",
    chipSoft: "border-amber-200/18 bg-amber-300/12 text-amber-50",
    active: "border-amber-200/28 bg-amber-300/14 text-white shadow-[0_14px_34px_rgba(214,164,78,0.18)]",
    ring: "from-amber-400 to-amber-200",
    accentText: "text-amber-100",
    badge: "NORMAL",
  };
};

const getDetailNarratives = (details: any) => {
  if (!details) return [];
  const candidates = [
    {
      label: "공략 메모",
      value:
        details.guide ||
        details.description ||
        details.desc ||
        details.memo ||
        details.note ||
        details.notes ||
        details.summary ||
        "",
    },
    {
      label: "주요 기믹",
      value:
        details.mechanics ||
        details.pattern ||
        details.patterns ||
        details.mechanic ||
        details.mechanic_summary ||
        "",
    },
    {
      label: "추천 포인트",
      value:
        details.tip ||
        details.tips ||
        details.recommendation ||
        details.recommend ||
        details.comment ||
        "",
    },
  ];

  return candidates.filter((item) => String(item.value || "").trim());
};

const formatLargeNumber = (value: any) => {
  const num = Number(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(num) || num <= 0) return "-";
  return num.toLocaleString();
};

const parseRewardList = (value: any): Array<{ name: string; quantity?: string; type?: string }> => {
  if (!value) return [];

  const normalizeItem = (item: any) => {
    if (!item) return null;
    if (typeof item === "string") {
      const raw = item.trim();
      if (!raw) return null;
      const quantityMatch = raw.match(/(.+?)[xX×]\s*(\d+)$/);
      if (quantityMatch) {
        return {
          name: quantityMatch[1].trim(),
          quantity: quantityMatch[2].trim(),
          type: "item",
        };
      }
      return { name: raw, type: "item" };
    }

    if (typeof item === "object") {
      const name = String(item.name || item.item || item.title || item.material || "").trim();
      if (!name) return null;
      return {
        name,
        quantity: item.quantity != null ? String(item.quantity) : item.count != null ? String(item.count) : "",
        type: String(item.type || item.kind || "item"),
      };
    }

    return null;
  };

  if (Array.isArray(value)) {
    return value.map(normalizeItem).filter(Boolean) as Array<{ name: string; quantity?: string; type?: string }>;
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return [];

    if ((raw.startsWith("[") && raw.endsWith("]")) || (raw.startsWith("{") && raw.endsWith("}"))) {
      try {
        const parsed = JSON.parse(raw);
        return parseRewardList(parsed);
      } catch (error) {
        console.error("parseRewardList json parse failed:", error);
      }
    }

    return raw
      .split(/\n|,|\//)
      .map((part) => normalizeItem(part))
      .filter(Boolean) as Array<{ name: string; quantity?: string; type?: string }>;
  }

  return [];
};

const buildRewardCards = (details: any) => {
  if (!details) return [];

  const rewardItems = [
    ...parseRewardList(details.reward_items),
    ...parseRewardList(details.reward_materials),
    ...parseRewardList(details.material_rewards),
    ...parseRewardList(details.rewards),
    ...parseRewardList(details.drop_items),
    ...parseRewardList(details.drop_materials),
    ...parseRewardList(details.reward_summary),
    ...parseRewardList(details.drops),
  ];

  const uniqueMap = new Map<string, { name: string; quantity?: string; type?: string }>();
  rewardItems.forEach((item) => {
    const key = `${item.name}-${item.quantity || ""}-${item.type || ""}`;
    if (!uniqueMap.has(key)) uniqueMap.set(key, item);
  });

  return Array.from(uniqueMap.values());
};

const DetailPopup = ({ item, type, onClose }: any) => {
  const [gate, setGate] = useState(1);
  const [diff, setDiff] = useState("노말");
  const [allDetails, setAllDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(type !== "클래스");

  useEffect(() => {
    let mounted = true;

    const fetchDetailBundle = async () => {
      if (type === "클래스") return;

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("content_details")
          .select("*")
          .eq("content_id", item.id)
          .order("difficulty", { ascending: true })
          .order("gate_num", { ascending: true });

        if (error) {
          console.error("fetchDetailBundle error:", error);
          if (mounted) setAllDetails([]);
          return;
        }

        if (!mounted) return;
        setAllDetails(data || []);
      } catch (error) {
        console.error("fetchDetailBundle unexpected error:", error);
        if (mounted) setAllDetails([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetailBundle();

    return () => {
      mounted = false;
    };
  }, [item, type]);

  const availableDifficulties = useMemo(() => {
    if (type !== "레이드") return [];
    const fromData = Array.from(
      new Set(
        allDetails
          .map((detail: any) => String(detail?.difficulty || "").trim())
          .filter(Boolean)
      )
    );
    return fromData.length > 0 ? fromData : difficultyOptions;
  }, [allDetails, type]);

  useEffect(() => {
    if (type !== "레이드") return;
    if (availableDifficulties.length === 0) return;
    if (!availableDifficulties.includes(diff)) {
      setDiff(availableDifficulties[0]);
    }
  }, [availableDifficulties, diff, type]);

  const gateOptions = useMemo(() => {
    if (type !== "레이드") return [0];
    const matching = allDetails.filter((detail: any) => String(detail?.difficulty || "").trim() === diff);
    const gates = Array.from(
      new Set(
        matching
          .map((detail: any) => Number(detail?.gate_num))
          .filter((value: number) => Number.isFinite(value) && value > 0)
      )
    ).sort((a, b) => a - b);

    return gates.length > 0 ? gates : [1, 2, 3, 4];
  }, [allDetails, diff, type]);

  useEffect(() => {
    if (type !== "레이드") return;
    if (!gateOptions.includes(gate)) {
      setGate(gateOptions[0] || 1);
    }
  }, [gateOptions, gate, type]);

  const details = useMemo(() => {
    if (type === "클래스") return null;
    if (type === "레이드") {
      return (
        allDetails.find(
          (detail: any) =>
            String(detail?.difficulty || "").trim() === diff && Number(detail?.gate_num) === gate
        ) || null
      );
    }
    return allDetails.find((detail: any) => Number(detail?.gate_num || 0) === 0) || allDetails[0] || null;
  }, [allDetails, diff, gate, type]);

  const narratives = useMemo(() => getDetailNarratives(details), [details]);
  const tone = getDifficultyTone(diff);

  const rewardCards = useMemo(() => {
    if (!details) return [];
    return [
      {
        label: "클리어 골드",
        value: `${formatLargeNumber(details.clear_gold)} G`,
        hint: "관문 클리어 기준",
        accent: "text-yellow-300",
      },
      {
        label: "계열",
        value: details.element_type || "-",
        hint: "보스 계열 정보",
        accent: tone.accentText,
      },
      {
        label: "속성",
        value: details.attribute || "-",
        hint: "취약 속성 기준",
        accent: "text-white",
      },
      {
        label: "HP",
        value: formatLargeNumber(details.hp),
        hint: "관문 체력 정보",
        accent: "text-white",
      },
    ];
  }, [details, tone.accentText]);

  const dropItemCards = useMemo(() => buildRewardCards(details), [details]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(2,6,23,0.86)] p-4 text-left backdrop-blur-xl md:p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2.3rem] border border-white/10 bg-slate-950/96 shadow-[0_30px_100px_rgba(2,6,23,0.6)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,197,92,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_46%)]" />
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.08] hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="relative border-b border-white/10 px-6 py-6 md:px-8 md:py-7">
          <div className="grid gap-6 md:grid-cols-[220px,minmax(0,1fr)]">
            <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-white/[0.03]">
              <img
                src={item.image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e"}
                className="h-full min-h-[180px] w-full object-cover"
              />
              {type === "레이드" && (
                <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                  {availableDifficulties.map((difficulty) => {
                    const difficultyTone = getDifficultyTone(difficulty);
                    const active = diff === difficulty;
                    return (
                      <button
                        key={difficulty}
                        onClick={() => setDiff(difficulty)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-xl transition-all",
                          active
                            ? difficultyTone.active
                            : "border-black/20 bg-black/45 text-white/85 hover:bg-black/60"
                        )}
                      >
                        {difficulty}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
              {type === "레이드" && (
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
                      Selected
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">{gate}관문</div>
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-md ${tone.chipSoft}`}>
                    {tone.badge}
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 self-end">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                  {type}
                </span>
                {type === "레이드" && (
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${tone.chip}`}>
                    {diff}
                  </span>
                )}
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                {item.name || item.sub_class}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400 md:text-base">
                {type === "레이드"
                  ? "난이도와 관문을 선택해서 관문별 보상과 핵심 정보를 한 번에 확인할 수 있어."
                  : type === "가디언 토벌"
                  ? "토벌 콘텐츠 핵심 정보와 보상을 확인해."
                  : "클래스 핵심 세팅과 각인을 정리했어."}
              </p>

              {type === "레이드" && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <CompactDetailMetric label="현재 난이도" value={diff} accent={tone.accentText} />
                  <CompactDetailMetric label="선택 관문" value={`${gate}관문`} />
                  <CompactDetailMetric label="총 관문 수" value={`${gateOptions.length}개`} />
                  <CompactDetailMetric
                    label="대표 보상"
                    value={`${formatLargeNumber(details?.clear_gold)} G`}
                    accent="text-yellow-300"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative space-y-6 px-6 py-6 md:px-8 md:py-7">
          {type === "레이드" && (
            <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
              <div className="rounded-[1.85rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  난이도 선택
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {availableDifficulties.map((difficulty) => {
                    const difficultyTone = getDifficultyTone(difficulty);
                    const active = diff === difficulty;
                    return (
                      <button
                        key={difficulty}
                        onClick={() => setDiff(difficulty)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                          active
                            ? difficultyTone.active
                            : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white"
                        )}
                      >
                        {difficulty}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[1.85rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  관문 선택
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {gateOptions.map((gateNumber) => {
                    const active = gate === gateNumber;
                    return (
                      <button
                        key={gateNumber}
                        onClick={() => setGate(gateNumber)}
                        className={cn(
                          "relative overflow-hidden rounded-[1.35rem] border p-4 text-left transition-all",
                          active
                            ? `border-white/10 bg-white/[0.08] shadow-[0_18px_40px_rgba(2,6,23,0.34)]`
                            : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                        )}
                      >
                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone.ring} ${active ? "opacity-100" : "opacity-0"}`} />
                        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                          Gate
                        </div>
                        <div className="mt-2 text-lg font-semibold text-white">{gateNumber}관문</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {active ? "현재 선택됨" : "상세 보기"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="rounded-[1.85rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-16 text-center text-sm text-slate-500">
              상세 데이터를 불러오는 중...
            </div>
          ) : type === "클래스" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <DetailInfoCard label="직업 각인" value={item.engraving_job || "-"} />
              <DetailInfoCard label="공용 각인" value={item.engraving_common?.join(", ") || "-"} wide />
              <DetailInfoCard label="아크 패시브" value={item.ark_passive?.join(" / ") || "-"} full />
            </div>
          ) : details ? (
            <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
              <div className="space-y-4">
                <div className="rounded-[1.85rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        관문별 보상
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {diff} · {gate}관문 Reward Board
                      </div>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${tone.chip}`}>
                      {gate} Gate
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {rewardCards.map((reward) => (
                      <div
                        key={reward.label}
                        className="rounded-[1.35rem] border border-white/10 bg-slate-950/35 p-4"
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {reward.label}
                        </div>
                        <div className={cn("mt-2 text-xl font-semibold", reward.accent)}>
                          {reward.value}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{reward.hint}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      드랍 아이템 / 재료
                    </div>

                    {dropItemCards.length > 0 ? (
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {dropItemCards.map((reward, index) => (
                          <div
                            key={`${reward.name}-${index}`}
                            className="flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-slate-950/35 p-4"
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-300/10 text-amber-100">
                              <Gift size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-white">
                                {reward.name}
                              </div>
                              <div className="mt-1 text-xs text-slate-400">
                                {reward.type === "material" ? "재료 아이템" : "드랍 아이템"}
                              </div>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200">
                              {reward.quantity ? `x${reward.quantity}` : "획득"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[1.35rem] border border-dashed border-white/10 bg-slate-950/20 px-4 py-6 text-center text-sm text-slate-500">
                        등록된 드랍 아이템/재료 데이터가 아직 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.85rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    관문 요약
                  </div>
                  <div className="mt-3 text-base font-semibold text-white">
                    {type === "레이드" ? `${diff} · ${gate}관문` : item.name || type}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">
                    선택한 관문 기준의 핵심 보상과 공략 메모를 오른쪽에서 바로 읽을 수 있게 정리했어.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {narratives.length > 0 ? (
                  narratives.map((entry) => (
                    <div key={entry.label} className="rounded-[1.85rem] border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        {entry.label}
                      </div>
                      <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                        {entry.value}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.85rem] border border-dashed border-white/10 bg-white/[0.03] px-5 py-10 text-center text-sm text-slate-500">
                    이 관문에 등록된 추가 공략 메모가 아직 없습니다.
                  </div>
                )}

                <div className="rounded-[1.85rem] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                    난이도 가시성 개선
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-300">
                    난이도는 이미지 좌상단 오버레이와 본문 탭을 같이 두는 방식이 가장 잘 보여. 처음 들어왔을 때도 한눈에 보이고, 스크롤 중에도 본문 탭으로 다시 바꾸기 쉽기 때문이야.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.85rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-16 text-center text-sm text-slate-500">
              선택한 난이도와 관문에 대한 데이터가 아직 없습니다.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const CompactDetailMetric = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: string;
}) => (
  <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3.5">
    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
    <div className={cn("mt-2 text-base font-semibold text-white", accent)}>{value}</div>
  </div>
);

const DetailInfoCard = ({
  label,
  value,
  wide = false,
  full = false,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
  full?: boolean;
  accent?: string;
}) => (
  <div
    className={cn(
      "rounded-[1.65rem] border border-white/10 bg-white/[0.03] p-5",
      full && "md:col-span-3",
      wide && "md:col-span-2"
    )}
  >
    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
      {label}
    </div>
    <div className={cn("mt-3 break-words text-lg font-semibold text-white", accent)}>{value}</div>
  </div>
);

const RaidCalendar = ({ user, profile, embedded = false, hideRanking = false }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [raids, setRaids] = useState<ScheduleLike[]>([]);
  const [participants, setParticipants] = useState<ParticipantLike[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRaid, setSelectedRaid] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [scheduleView, setScheduleView] = useState<"all" | "mine">("all");
  const [myCharacterNames, setMyCharacterNames] = useState<string[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDate = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = getWeekdayIndexMondayStart(firstDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    fetchCalendarData();
  }, [year, month]);

  useEffect(() => {
    let mounted = true;

    const fetchMyCharacters = async () => {
      if (!user?.id || !supabase) {
        if (mounted) {
          setMyCharacterNames([]);
          setScheduleView("all");
        }
        return;
      }

      try {
        const client = getSupabaseOrThrow();
        const { data, error } = await client
          .from("guild_members")
          .select("character_name")
          .or(`user_id.eq.${user.id},owner_id.eq.${user.id}`);

        if (error) {
          console.error("fetchMyCharacters in RaidCalendar error:", error);
          if (mounted) setMyCharacterNames([]);
          return;
        }

        if (!mounted) return;

        setMyCharacterNames(
          (data || [])
            .map((item: any) => String(item?.character_name || "").trim())
            .filter(Boolean)
        );
      } catch (error) {
        console.error("fetchMyCharacters in RaidCalendar unexpected error:", error);
        if (mounted) setMyCharacterNames([]);
      }
    };

    fetchMyCharacters();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

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

  const normalizedMyCharacterNames = useMemo(
    () =>
      myCharacterNames
        .map((name) => String(name || "").trim())
        .filter(Boolean),
    [myCharacterNames]
  );

  const myRaidIds = useMemo(() => {
    if (normalizedMyCharacterNames.length === 0) return new Set<string>();

    const myNameSet = new Set(normalizedMyCharacterNames);
    return new Set(
      participants
        .filter((participant: any) => myNameSet.has(String(participant?.character_name || "").trim()))
        .map((participant: any) => String(participant.schedule_id))
    );
  }, [participants, normalizedMyCharacterNames]);

  const visibleRaids = useMemo(() => {
    if (scheduleView !== "mine") return raids;
    return raids.filter((raid: any) => myRaidIds.has(String(raid.id)));
  }, [raids, scheduleView, myRaidIds]);

  const visibleRaidIdSet = useMemo(
    () => new Set(visibleRaids.map((raid: any) => String(raid.id))),
    [visibleRaids]
  );

  const visibleParticipants = useMemo(
    () => participants.filter((participant: any) => visibleRaidIdSet.has(String(participant.schedule_id))),
    [participants, visibleRaidIdSet]
  );

  const mineStats = useMemo(() => {
    const upcomingMineCount = visibleRaids.length;
    const joinedCharacters = new Set(
      visibleParticipants
        .map((participant: any) => String(participant?.character_name || "").trim())
        .filter((name) => normalizedMyCharacterNames.includes(name))
    ).size;

    return {
      upcomingMineCount,
      joinedCharacters,
    };
  }, [visibleRaids, visibleParticipants, normalizedMyCharacterNames]);

  const monthStats = useMemo(() => {
    const totalRaids = visibleRaids.length;
    const totalParticipants = visibleParticipants.length;
    const fullCount = visibleRaids.filter((raid) => {
      const raidParticipants = visibleParticipants.filter((p) => p.schedule_id === raid.id);
      return raidParticipants.length >= getCapacity(raid).maxParticipants;
    }).length;

    return { totalRaids, totalParticipants, fullCount };
  }, [visibleRaids, visibleParticipants]);

  const monthlyCharacterStats = useMemo(() => {
    const map = new Map<string, { nickname: string; count: number; raidCount: number }>();

    visibleParticipants.forEach((participant: any) => {
      const nickname = (participant.character_name || "이름없음").trim();
      const existing = map.get(nickname) || {
        nickname,
        count: 0,
        raidCount: 0,
      };

      existing.count += 1;
      map.set(nickname, existing);
    });

    visibleRaids.forEach((raid) => {
      const raidParticipants = visibleParticipants.filter((p: any) => p.schedule_id === raid.id);
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
  }, [visibleParticipants, visibleRaids]);

  return (
    <section className={cn("max-w-7xl mx-auto px-6", embedded ? "py-6 md:py-7 border-t-0" : "py-16 md:py-24 border-t border-white/5")}>

      <div className={cn("grid gap-6 mb-8", hideRanking ? "lg:grid-cols-1" : "lg:grid-cols-[1.2fr,0.8fr]")}>
        <SectionPanel
          title="Raid Calendar"
          description={scheduleView === "mine" ? "내 캐릭터가 참여한 일정만 확인." : "월별 레이드 일정."}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-md">
                <button
                  onClick={() => setScheduleView("all")}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    scheduleView === "all"
                      ? "bg-amber-400/12 text-amber-100 shadow-[inset_0_0_0_1px_rgba(246,205,127,0.12)]"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  전체 일정
                </button>
                <button
                  onClick={() => {
                    if (!user) return;
                    setScheduleView("mine");
                  }}
                  disabled={!user}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    scheduleView === "mine"
                      ? "bg-amber-400/12 text-amber-100 shadow-[inset_0_0_0_1px_rgba(246,205,127,0.12)]"
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  내 일정
                </button>
              </div>

              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:-translate-y-0.5 hover:border-amber-200/30 hover:bg-amber-300/10 hover:text-white hover:shadow-[0_12px_30px_rgba(214,164,78,0.14)]"
              >
                <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="group flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:-translate-y-0.5 hover:border-amber-200/30 hover:bg-amber-300/10 hover:text-white hover:shadow-[0_12px_30px_rgba(214,164,78,0.14)]"
              >
                <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200">
                {scheduleView === "mine" ? "My Schedule View" : "Monthly View"}
              </div>
              <h2 className="text-4xl font-semibold tracking-tight">{formatMonthLabel(year, month)}</h2>
              {!user && (
                <div className="mt-2 text-sm text-slate-500">
                  로그인하면 내 캐릭터가 참가한 일정만 따로 볼 수 있어.
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <SummaryChip icon={<CalendarDays size={14} />} label={scheduleView === "mine" ? "내 일정" : "일정"} value={monthStats.totalRaids} />
              <SummaryChip icon={<Users size={14} />} label={scheduleView === "mine" ? "내 참가" : "참여"} value={scheduleView === "mine" ? mineStats.joinedCharacters : monthStats.totalParticipants} />
              <SummaryChip icon={<Trophy size={14} />} label="마감" value={monthStats.fullCount} />
            </div>
          </div>
        </SectionPanel>

        {!hideRanking && (
          <SectionPanel
            title={scheduleView === "mine" ? "내 일정 참여 현황" : "월별 참여 랭킹"}
            description={scheduleView === "mine" ? "내 캐릭터가 참가한 일정 기준으로 확인." : "이번 달 기준 캐릭터 참가횟수 확인."}
          >
            {scheduleView === "mine" ? (
            <div className="space-y-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">내 일정 수</div>
                <div className="mt-2 text-2xl font-semibold text-white">{mineStats.upcomingMineCount}</div>
                <div className="mt-1 text-xs text-slate-500">이번 달 내가 참가한 일정 개수</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">참가 캐릭터</div>
                <div className="mt-2 text-2xl font-semibold text-white">{mineStats.joinedCharacters}</div>
                <div className="mt-1 text-xs text-slate-500">참가 기록이 있는 내 캐릭터 수</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">보기 상태</div>
                <div className="mt-2 text-base font-semibold text-amber-100">{user ? "로그인 사용자 기준 필터 적용" : "로그인 필요"}</div>
                <div className="mt-1 text-xs text-slate-500">참가자 이름과 내 캐릭터 이름을 기준으로 필터링</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {monthlyCharacterStats.length === 0 && (
                <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-7 text-center text-sm text-slate-500">
                  아직 이번 달 참여 데이터가 없습니다.
                </div>
              )}

              {monthlyCharacterStats.slice(0, 6).map((item, index) => (
                <div
                  key={item.nickname}
                  className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4 transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.04]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-300/10 text-sm font-semibold text-amber-100">
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{item.nickname}</div>
                      <div className="text-xs text-slate-500">월간 레이드 참여 요약</div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-lg font-semibold text-white">{item.raidCount}회</div>
                    <div className="text-xs text-slate-500">등록 {item.count}건</div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </SectionPanel>
        )}
      </div>

      <div className="grid xl:grid-cols-[1.35fr,0.65fr] gap-6">
        <div className="overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/10 bg-slate-950/50 backdrop-blur-xl shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
          <div className="grid grid-cols-7 border-b border-white/5 bg-white/[0.03] text-center text-[10px] md:text-xs uppercase tracking-[0.22em] text-slate-400">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayLabel) => (
              <div key={dayLabel} className="px-2 py-4">
                {dayLabel}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-white/5">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[132px] md:min-h-[156px] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]"
              />
            ))}

            {days.map((day) => {
              const dateStr = formatDate(year, month, day);
              const dayRaids = visibleRaids.filter((raid) => raid.raid_date === dateStr);
              const today = new Date();
              const isToday = isSameDay(new Date(year, month, day), today);
              const dayParticipantCount = dayRaids.reduce((sum, raid) => {
                return sum + visibleParticipants.filter((p) => p.schedule_id === raid.id).length;
              }, 0);

              return (
                <div
                  key={day}
                  className={cn(
                    "group relative min-h-[132px] md:min-h-[156px] overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.012))] p-3 transition-all duration-200 hover:z-[1] hover:bg-amber-300/[0.04] hover:shadow-[inset_0_0_0_1px_rgba(233,196,106,0.16)]",
                    isToday && "bg-amber-400/[0.08] shadow-[inset_0_0_0_1px_rgba(245,197,92,0.28),0_0_0_1px_rgba(245,197,92,0.1)]"
                  )}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  {isToday && <div className="pointer-events-none absolute right-3 top-3 h-10 w-10 rounded-full bg-amber-300/10 blur-xl" />}

                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div
                        className={cn(
                          "inline-flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-sm font-semibold transition-all",
                          isToday
                            ? "border border-amber-200/25 bg-amber-300/10 text-amber-100 shadow-[0_8px_24px_rgba(214,164,78,0.18)]"
                            : "border border-transparent bg-white/[0.03] text-slate-300 group-hover:border-white/10"
                        )}
                      >
                        {day}
                      </div>
                      <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-slate-500">
                        {DAY_LABELS[new Date(year, month, day).getDay()]}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {dayRaids.length > 0 && (
                        <div className="inline-flex items-center gap-1 rounded-full border border-amber-200/15 bg-amber-300/10 px-2 py-1 text-[10px] font-semibold text-amber-50">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-200" />
                          {dayRaids.length}
                        </div>
                      )}

                      {user && scheduleView === "all" && (
                        <button
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setIsCreateOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-amber-200 transition-all hover:-translate-y-0.5 hover:border-amber-200/25 hover:bg-amber-300/10 hover:text-white"
                          title="레이드 생성"
                        >
                          <Plus size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{dayRaids.length}개 일정</span>
                    {dayParticipantCount > 0 && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span>{dayParticipantCount}명 참여</span>
                      </>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {dayRaids.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-white/8 bg-white/[0.02] px-3 py-3 text-center text-[11px] font-medium text-slate-500">
                        {scheduleView === "mine" ? "내 일정 없음" : "일정 없음"}
                      </div>
                    )}

                    {dayRaids.slice(0, 2).map((raid) => (
                      <RaidCard
                        key={raid.id}
                        raid={raid}
                        parts={visibleParticipants.filter((p) => p.schedule_id === raid.id)}
                        onOpen={() => setSelectedRaid(raid)}
                        compact
                      />
                    ))}

                    {dayRaids.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setSelectedRaid(dayRaids[0])}
                        className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-[11px] font-medium text-slate-400 transition-colors hover:border-amber-200/20 hover:bg-amber-300/[0.04] hover:text-slate-200"
                      >
                        +{dayRaids.length - 2}개 일정 더 보기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <SectionPanel
          title={scheduleView === "mine" ? "내 일정 목록" : "월별 통계 보드"}
          description={scheduleView === "mine" ? "내가 실제로 참가한 일정만 모아서 보여줘." : "이번 달 참여 많이 한 캐릭터를 전체로 확인할 수 있어."}
        >
          {calendarLoading ? (
            <div className="py-12 text-center font-medium text-slate-500">불러오는 중...</div>
          ) : monthlyCharacterStats.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-500">
              {scheduleView === "mine" ? "표시할 내 일정이 없어." : "집계할 참여 데이터가 없어."}
            </div>
          ) : scheduleView === "mine" ? (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {visibleRaids.map((raid: any) => {
                const raidParts = visibleParticipants.filter((p: any) => p.schedule_id === raid.id);
                return (
                  <button
                    key={raid.id}
                    onClick={() => setSelectedRaid(raid)}
                    className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold text-white">{raid.raid_name}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {formatShortDate(raid.raid_date)} · {raid.raid_time}
                        </div>
                      </div>
                      <div className="rounded-full border border-amber-200/15 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                        {raidParts.length}/{getCapacity(raid).maxParticipants}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {monthlyCharacterStats.map((item, index) => (
                <div
                  key={item.nickname}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.04]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                        <BarChart3 size={16} className="text-amber-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">
                          #{index + 1} {item.nickname}
                        </div>
                        <div className="text-xs text-slate-500">
                          월간 레이드 참여 횟수 {item.raidCount}회
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-xl font-semibold text-amber-200">{item.raidCount}</div>
                      <div className="text-[11px] text-slate-500">raid count</div>
                    </div>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200"
                      style={{
                        width: `${
                          monthlyCharacterStats[0]?.raidCount
                            ? (item.raidCount / monthlyCharacterStats[0].raidCount) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 text-xs text-slate-400">
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
  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-md transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.05]">
    <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
      {icon}
      {label}
    </div>
    <div className="text-2xl font-semibold text-white">{value}</div>
  </div>
);

const InfoMiniCard = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
      {title}
    </div>
    <div className="text-base font-semibold text-white">{value}</div>
  </div>
);

const RaidCard = ({
  raid,
  parts,
  onOpen,
  compact = false,
}: {
  raid: any;
  parts: any[];
  onOpen: () => void;
  compact?: boolean;
}) => {
  const colors = classNameByMode(raid.type);
  const capacity = getCapacity(raid);
  const percent = Math.min(100, (parts.length / capacity.maxParticipants) * 100);
  const isFull = parts.length >= capacity.maxParticipants;

  return (
    <motion.button
      whileHover={{ y: -1 }}
      onClick={onOpen}
      className={cn(
        "relative w-full overflow-hidden rounded-[1.1rem] border text-left transition-all",
        compact ? "p-2.5" : "p-3",
        isFull
          ? "border-rose-400/25 bg-[linear-gradient(135deg,rgba(214,164,78,0.12),rgba(15,23,42,0.88))]"
          : "border-white/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] hover:border-amber-200/18 hover:bg-[linear-gradient(135deg,rgba(214,164,78,0.12),rgba(255,255,255,0.03))]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            {raid.experience && raid.type !== "anime" && (
              <span className={cn(colors.chip, "shrink-0 whitespace-nowrap px-2 py-0.5 text-[9px] leading-none")}>
                {raid.experience}
              </span>
            )}
            <span className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
              {raid.type === "anime" ? "시청" : compact ? raid.difficulty : `${raid.raid_type} · ${raid.difficulty}`}
            </span>
          </div>

          <div className="mt-2 truncate text-[13px] font-semibold leading-tight text-white">
            {raid.raid_name}
          </div>

          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2 py-1">
              <Clock size={10} />
              {raid.raid_time}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className={cn("text-[11px] font-semibold", isFull ? "text-rose-300" : "text-slate-300")}>
            {parts.length}/{capacity.maxParticipants}
          </div>
          {parts.length > 0 && <div className="mt-1 h-2 w-2 rounded-full bg-amber-200" />}
        </div>
      </div>

      {!compact && (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/30">
          <div style={{ width: `${percent}%` }} className={cn("h-full rounded-full", isFull ? "bg-rose-400" : colors.bar)} />
        </div>
      )}
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
      showToast("레이드 이름을 선택하세요.");
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
        showToast(error.message, "error");
        return;
      }

      try {
        const raidDifficultyLabel =
          form.type === "anime"
            ? "시청"
            : form.difficulty || (form.experience ? `${form.experience}` : "미정");

        const raidTypeLabel = form.type === "anime" ? "시청" : form.raid_type || "레이드";

        await fetch("/api/discord", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [
              {
                title: "레이드 일정",
                description: form.raid_name,
                color: 5814783,
                fields: [
                  { name: "날짜", value: date, inline: true },
                  { name: "시간", value: form.raid_time, inline: true },
                  { name: "난이도", value: raidDifficultyLabel, inline: true },
                  { name: "구분", value: raidTypeLabel, inline: true },
                  { name: "참여", value: "사이트에서 참여 체크", inline: false },
                ],
              },
            ],
          }),
        });
      } catch (discordError) {
        console.error("discord webhook send error:", discordError);
      }

      showToast("일정 생성 완료", "success");
      onRefresh();
      onClose();
    } catch (error: any) {
      console.error("create raid error:", error);
      showToast(error.message || "일정 생성 실패", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame onClose={onClose}>
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/92 shadow-[0_28px_90px_rgba(2,6,23,0.56)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,197,92,0.18),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_46%)]" />
        <div className="relative border-b border-white/10 px-6 py-5 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200">
                Create Schedule
              </div>
              <h3 className="text-2xl font-semibold text-white">{date}</h3>
              <p className="mt-2 text-sm text-slate-400">
                일정 유형과 시간을 설정하고 바로 캘린더에 추가할 수 있어.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.08] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative space-y-5 px-6 py-6 md:px-7 md:py-7">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                일정 날짜
              </div>
              <div className="mt-2 text-sm font-semibold text-white">{date}</div>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                일정 상태
              </div>
              <div className="mt-2 text-sm font-semibold text-amber-100">Draft Ready</div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
              레이드 선택
            </label>
            <select
              value={form.raid_name}
              onChange={(e) => setForm({ ...form, raid_name: e.target.value })}
              className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none transition-all focus:border-amber-200/25 focus:bg-amber-300/[0.04]"
            >
              <option value="">레이드 선택</option>
              {raidList.map((raid) => (
                <option key={raid.id} value={raid.name}>
                  {raid.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                컨텐츠 유형
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none transition-all focus:border-amber-200/25 focus:bg-amber-300/[0.04]"
              >
                {CONTENT_MODE_OPTIONS.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode === "raid" ? "레이드" : "영화 · 애니 시청"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                시작 시간
              </label>
              <input
                type="time"
                value={form.raid_time}
                onChange={(e) => setForm({ ...form, raid_time: e.target.value })}
                className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none transition-all focus:border-amber-200/25 focus:bg-amber-300/[0.04]"
              />
            </div>
          </div>

          {form.type === "raid" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                    레이드 인원
                  </label>
                  <select
                    value={form.raid_type}
                    onChange={(e) => setForm({ ...form, raid_type: e.target.value })}
                    className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none transition-all focus:border-amber-200/25 focus:bg-amber-300/[0.04]"
                  >
                    {RAID_TYPE_OPTIONS.map((raidType) => (
                      <option key={raidType} value={raidType}>
                        {raidType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                    난이도
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none transition-all focus:border-amber-200/25 focus:bg-amber-300/[0.04]"
                  >
                    {difficultyOptions.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                  숙련도
                </label>
                <select
                  value={form.experience}
                  onChange={(e) => setForm({ ...form, experience: e.target.value })}
                  className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none transition-all focus:border-amber-200/25 focus:bg-amber-300/[0.04]"
                >
                  {RAID_EXPERIENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Preview
            </div>
            <div className="mt-2 text-sm text-slate-300">
              {form.raid_name || "레이드 미선택"} · {form.raid_time} · {form.type === "raid" ? `${form.raid_type} / ${form.difficulty} / ${form.experience}` : "시청형 일정"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onClose}
              className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              취소
            </button>
            <button
              onClick={save}
              disabled={loading}
              className="rounded-[1.35rem] bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition-all hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "생성 중..." : "일정 생성"}
            </button>
          </div>
        </div>
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
  const [myCharacterNames, setMyCharacterNames] = useState<string[]>([]);

  // 로그인한 경우 내 캐릭터 이름 목록 불러오기
  useEffect(() => {
    if (!user?.id) {
      setMyCharacterNames([]);
      return;
    }
    const fetchMyNames = async () => {
      try {
        const client = getSupabaseOrThrow();
        const { data, error } = await client
          .from("guild_members")
          .select("character_name")
          .or(`user_id.eq.${user.id},owner_id.eq.${user.id}`);
        if (error) {
          console.error("myCharacterNames fetch error:", error);
          setMyCharacterNames([]);
          return;
        }
        setMyCharacterNames(
          (data || []).map((row: any) => String(row.character_name || "").trim()).filter(Boolean)
        );
      } catch (e) {
        console.error("myCharacterNames unexpected error:", e);
        setMyCharacterNames([]);
      }
    };
    void fetchMyNames();
  }, [user]);

  const capacity = getCapacity(raid);
  const dealers = parts.filter((p: any) => p.position === "딜러").length;
  const supports = parts.filter((p: any) => p.position === "서포터").length;
  const isAnime = raid.type === "anime";
  const isFull = parts.length >= capacity.maxParticipants;
  const colors = classNameByMode(raid.type);

  const handleDelete = async () => {
    if (profile?.role !== "admin") {
      showToast("관리자만 삭제할 수 있어.", "error");
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
      showToast("일정 삭제 실패", "error");
    }
  };

  return (
    <ModalFrame onClose={onClose}>
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/94 shadow-[0_30px_100px_rgba(2,6,23,0.58)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,197,92,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_48%)]" />

        <div className="relative border-b border-white/10 px-6 py-6 md:px-8 md:py-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] ${colors.badge}`}>
                {raid.type === "anime" ? "Watch Party" : "Raid Detail"}
              </div>
              <h3 className="truncate text-3xl font-semibold text-white">{raid.raid_name}</h3>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200">
                  {formatShortDate(raid.raid_date)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200">
                  {raid.raid_time}
                </span>
                {!isAnime && (
                  <>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200">
                      {raid.raid_type}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-slate-200">
                      {raid.difficulty}
                    </span>
                    {raid.experience && (
                      <span className="rounded-full border border-amber-200/15 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-100">
                        {raid.experience}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.08] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative space-y-6 px-6 py-6 md:px-8 md:py-7">
          <div className="grid gap-3 md:grid-cols-4">
            <SummaryChip icon={<Users size={14} />} label="총 인원" value={`${parts.length}/${capacity.maxParticipants}`} />
            <SummaryChip icon={<Swords size={14} />} label="딜러" value={isAnime ? "-" : `${dealers}/${capacity.dealerLimit}`} />
            <SummaryChip icon={<Shield size={14} />} label="서포터" value={isAnime ? "-" : `${supports}/${capacity.supportLimit}`} />
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-md transition-all">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
                <Clock size={14} />
                상태
              </div>
              <div className="text-2xl font-semibold text-white">{isFull ? "Full" : "Open"}</div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">참가 현황</div>
                <div className="mt-1 text-xs text-slate-400">
                  {isAnime ? "참가형 일정" : `딜러 ${dealers}/${capacity.dealerLimit} · 서포터 ${supports}/${capacity.supportLimit}`}
                </div>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isFull ? "bg-rose-400/12 text-rose-200" : "bg-emerald-400/12 text-emerald-200"}`}>
                {isFull ? "모집 완료" : "참여 가능"}
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-200"
                style={{ width: `${Math.min(100, (parts.length / capacity.maxParticipants) * 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white">참가자 목록</div>
                <div className="mt-1 text-xs text-slate-400">현재 등록된 참가자 정보를 확인할 수 있어.</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                {parts.length} entries
              </div>
            </div>

            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {parts.length === 0 && (
                <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-500">
                  아직 참가자가 없습니다.
                </div>
              )}

              {parts.map((participant: any) => (
                <ParticipantItem
                  key={participant.id}
                  participant={participant}
                  canCancel={profile?.role === "admin"}
                  onRefresh={onRefresh}
                  user={user}
                  myCharacterNames={myCharacterNames}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {user && !isFull && (
              <button
                onClick={() => setShowJoin(true)}
                className="rounded-[1.35rem] bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition-all hover:brightness-110"
              >
                참여하기
              </button>
            )}

            {profile?.role === "admin" && (
              <button
                onClick={handleDelete}
                className="rounded-[1.35rem] border border-rose-400/20 bg-rose-400/10 px-4 py-3.5 text-sm font-semibold text-rose-200 transition-all hover:bg-rose-400/16"
              >
                일정 삭제
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
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
            user={user}
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
  user,
  myCharacterNames,
}: {
  participant: any;
  canCancel: boolean;
  onRefresh: () => void;
  user?: any;
  myCharacterNames?: string[];
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
      showToast(error.message || "취소 실패", "error");
    }
  };

  // 본인 캐릭터 여부 확인
  const isMine =
    user &&
    Array.isArray(myCharacterNames) &&
    myCharacterNames.some(
      (name) => name.trim() === (participant.character_name || "").trim()
    );

  const showCancel = canCancel || isMine;

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div>
        <div className="font-bold text-white">{participant.character_name}</div>
        <div className="text-sm text-slate-400 mt-1">
          {participant.class_name} · {participant.item_level}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-xs px-3 py-1 rounded-full ${
          participant.position === "서포터"
            ? "bg-amber-400/15 text-amber-200 border border-amber-400/20"
            : "bg-amber-400/15 text-amber-200 border border-amber-400/20"
        }`}>
          {participant.position || "참가"}
        </span>

        {showCancel && (
          <button
            onClick={handleLeave}
            className="text-xs text-red-300 hover:text-red-200 font-bold"
          >
            취소{isMine && !canCancel ? " (내 캐릭터)" : ""}
          </button>
        )}
      </div>
    </div>
  );
};

const JoinForm = ({
  raid,
  parts,
  user,
  onClose,
  onSuccess,
}: {
  raid: any;
  parts: any[];
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [characterLoading, setCharacterLoading] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");
  const [nickname, setNickname] = useState("");
  const [level, setLevel] = useState("");
  const [playerClass, setPlayerClass] = useState("");
  const [role, setRole] = useState("딜러");
  const [saving, setSaving] = useState(false);

  const capacity = getCapacity(raid);
  const dealers = parts.filter((p: any) => p.position === "딜러").length;
  const supports = parts.filter((p: any) => p.position === "서포터").length;

  const applyCharacterToForm = useCallback((character: any) => {
    if (!character) return;

    setSelectedCharacterId(String(character.id || ""));
    setNickname(character.character_name || "");
    setLevel(String(character.item_level || ""));
    setPlayerClass(character.class_name || "");
    setRole(character.role_hint === "서포터" ? "서포터" : "딜러");
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchMyCharacters = async () => {
      if (!user?.id) {
        if (mounted) {
          setMyCharacters([]);
          setSelectedCharacterId("");
        }
        return;
      }

      setCharacterLoading(true);

      try {
        const client = getSupabaseOrThrow();
        const { data, error } = await client
          .from("guild_members")
          .select("*")
          .or(`user_id.eq.${user.id},owner_id.eq.${user.id}`)
          .order("is_main", { ascending: false })
          .order("item_level", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: true });

        if (error) {
          console.error("JoinForm fetchMyCharacters error:", error);
          if (mounted) {
            setMyCharacters([]);
            setSelectedCharacterId("");
          }
          return;
        }

        const nextCharacters = data || [];

        if (!mounted) return;

        setMyCharacters(nextCharacters);

        if (nextCharacters.length > 0) {
          const preferred =
            nextCharacters.find((item: any) => Boolean(item.is_main)) ||
            nextCharacters[0];

          applyCharacterToForm(preferred);
        } else {
          setSelectedCharacterId("");
          setNickname("");
          setLevel("");
          setPlayerClass("");
          setRole("딜러");
        }
      } catch (error) {
        console.error("JoinForm fetchMyCharacters unexpected error:", error);
        if (mounted) {
          setMyCharacters([]);
          setSelectedCharacterId("");
        }
      } finally {
        if (mounted) setCharacterLoading(false);
      }
    };

    fetchMyCharacters();

    return () => {
      mounted = false;
    };
  }, [user, applyCharacterToForm]);

  const handleCharacterChange = (id: string) => {
    setSelectedCharacterId(id);
    const selected = myCharacters.find((item: any) => String(item.id) === id);
    if (selected) {
      applyCharacterToForm(selected);
    }
  };

  const handleJoin = async () => {
    if (!user?.id) {
      showToast("로그인 후 참여할 수 있어.", "error");
      return;
    }

    if (myCharacters.length === 0) {
      showToast("마이룸에 등록된 캐릭터가 없어. 먼저 캐릭터를 등록해줘.", "error");
      return;
    }

    if (!nickname || !level || !playerClass) {
      showToast("캐릭터 정보가 비어 있어. 마이룸 캐릭터를 다시 선택해줘.", "error");
      return;
    }

    const alreadyJoined = parts.some(
      (item: any) => (item.character_name || "").trim() === nickname.trim()
    );

    if (alreadyJoined) {
      showToast("같은 캐릭터가 이미 참가 중이야.");
      return;
    }

    if (raid.type !== "anime") {
      if (role === "딜러" && dealers >= capacity.dealerLimit) {
        showToast("딜러 자리가 가득 찼습니다.", "error");
        return;
      }
      if (role === "서포터" && supports >= capacity.supportLimit) {
        showToast("서포터 자리가 가득 찼습니다.", "error");
        return;
      }
    }

    setSaving(true);

    try {
      const { error } = await supabase.from("raid_participants").insert({
        schedule_id: raid.id,
        character_name: nickname.trim(),
        item_level: level,
        class_name: playerClass.trim(),
        position: raid.type === "anime" ? "참가" : role,
      });

      if (!error) {
        onSuccess();
      } else {
        showToast(error.message || "참여 실패", "error");
      }
    } catch (error: any) {
      console.error("handleJoin error:", error);
      showToast(error.message || "참여 실패", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/94 shadow-[0_30px_100px_rgba(2,6,23,0.58)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,197,92,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_46%)]" />

        <div className="relative border-b border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200">
                Join Schedule
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">레이드 참여</div>
              <div className="mt-2 text-sm text-slate-400">
                마이룸 캐릭터를 선택하면 정보가 자동으로 입력돼.
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.08] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="relative space-y-5 px-6 py-6">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              대상 일정
            </div>
            <div className="mt-2 text-sm font-semibold text-white">{raid.raid_name}</div>
            <div className="mt-1 text-xs text-slate-400">
              {formatShortDate(raid.raid_date)} · {raid.raid_time}
            </div>
          </div>

          <div className="space-y-3 text-left">
            <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
              내 캐릭터 선택
            </label>
            <select
              value={selectedCharacterId}
              onChange={(e) => handleCharacterChange(e.target.value)}
              disabled={characterLoading || myCharacters.length === 0}
              className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none transition-all focus:border-amber-200/25 focus:bg-amber-300/[0.04] disabled:opacity-60"
            >
              {characterLoading && <option value="">마이룸 캐릭터 불러오는 중...</option>}
              {!characterLoading && myCharacters.length === 0 && (
                <option value="">등록된 캐릭터 없음</option>
              )}
              {!characterLoading &&
                myCharacters.map((character: any) => (
                  <option key={character.id} value={String(character.id)}>
                    {character.character_name} · {character.class_name} · {character.item_level || 0}
                  </option>
                ))}
            </select>
          </div>

          {myCharacters.length > 0 && selectedCharacterId && (
            <div className="rounded-[1.5rem] border border-amber-200/15 bg-amber-300/10 px-4 py-4 text-sm">
              <div className="font-semibold text-amber-50">
                {nickname} · {playerClass}
              </div>
              <div className="mt-1 text-xs text-amber-100/80">
                아이템 레벨 {level || "-"} · 역할 {raid.type === "anime" ? "참가" : role}
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <AdminInput label="닉네임" value={nickname} onChange={setNickname} />
            <AdminInput label="아이템 레벨" value={level} onChange={setLevel} />
          </div>

          <AdminInput label="클래스" value={playerClass} onChange={setPlayerClass} />

          {raid.type !== "anime" && (
            <div className="space-y-3">
              <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                역할 선택
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none transition-all focus:border-amber-200/25 focus:bg-amber-300/[0.04]"
              >
                <option value="딜러">딜러</option>
                <option value="서포터">서포터</option>
              </select>
            </div>
          )}

          {myCharacters.length === 0 && !characterLoading && (
            <div className="rounded-[1.5rem] border border-dashed border-rose-400/30 bg-rose-400/10 px-4 py-4 text-sm text-rose-200">
              마이룸에 등록된 캐릭터가 없어. 마이룸에서 캐릭터를 먼저 만들어줘.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onClose}
              className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
            >
              취소
            </button>
            <button
              onClick={handleJoin}
              disabled={saving || characterLoading || myCharacters.length === 0}
              className="rounded-[1.35rem] bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition-all hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "참가 중..." : "참가"}
            </button>
          </div>
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
    className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-[rgba(2,6,23,0.76)] p-4 backdrop-blur-xl"
    onClick={onClose}
  >
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,197,92,0.12),transparent_28%),radial-gradient(circle_at_bottom,rgba(214,164,78,0.08),transparent_24%)]" />
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => e.stopPropagation()}
      className="relative flex w-full items-center justify-center py-6"
    >
      {children}
    </motion.div>
  </motion.div>
);

const PointEconomyManager = ({ settings, setSettings }: any) => {
  const pointSettings = normalizePointRateSettings(settings?.point_rate_settings);

  const setValue = (patch: any) => {
    setSettings((prev: any) => ({
      ...prev,
      point_rate_settings: normalizePointRateSettings({
        ...normalizePointRateSettings(prev?.point_rate_settings),
        ...patch,
      }),
    }));
  };

  const setRate = (rarity: WeaponRarityKey, value: string) => {
    const current = normalizePointRateSettings(settings?.point_rate_settings);
    setValue({
      rate_by_rarity: {
        ...current.rate_by_rarity,
        [rarity]: Number(value || 0),
      },
    });
  };

  const handleSave = async () => {
    const payload = normalizeAppSettings({
      ...settings,
      point_rate_settings: normalizePointRateSettings(settings?.point_rate_settings),
    });
    const { error, payload: savedPayload } = await saveSingletonSettings(payload);
    if (error) showToast(error.message, "error");
    else {
      const nextSettings = normalizeAppSettings(savedPayload);
      setSettings(nextSettings);
      writeCache(CACHE_KEYS.settings, nextSettings);
      showToast("포인트 경제 설정 저장 완료!", "success");
    }
  };

  return (
    <div className="space-y-8">
      <SectionPanel title="시간당 포인트 설정" description="무기 등급별 기본 포인트와 5강 단위 추가 포인트를 전부 관리자 페이지에서 설정해.">
        <div className="grid xl:grid-cols-[1.05fr,0.95fr] gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-[#0b1020] p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <label className="text-xs text-slate-400 mb-2 block">시스템 사용 여부</label>
                <button
                  onClick={() => setValue({ enabled: !pointSettings.enabled })}
                  className={cn("w-full h-[58px] rounded-2xl border font-semibold", pointSettings.enabled ? "bg-amber-500 border-amber-400 text-white" : "bg-black border-white/10 text-slate-400")}
                >
                  {pointSettings.enabled ? "활성화" : "비활성화"}
                </button>
              </div>
              <AdminInput label="획득 주기(분)" value={String(pointSettings.cycle_minutes)} onChange={(v: any) => setValue({ cycle_minutes: Number(v || 60) })} />
              <AdminInput label="하루 최대 포인트" value={String(pointSettings.daily_cap)} onChange={(v: any) => setValue({ daily_cap: Number(v || 500) })} />
              <AdminInput label="5강마다 추가 포인트" value={String(pointSettings.enhancement_bonus_per_5)} onChange={(v: any) => setValue({ enhancement_bonus_per_5: Number(v || 2) })} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {(["common","rare","epic","legendary"] as WeaponRarityKey[]).map((rarity) => (
                <AdminInput
                  key={rarity}
                  label={`${WEAPON_RARITY_THEMES[rarity].label} 시간당 포인트`}
                  value={String(pointSettings.rate_by_rarity[rarity] || 0)}
                  onChange={(v: any) => setRate(rarity, v)}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} className="px-6 py-3 rounded-2xl bg-amber-500 font-semibold">포인트 경제 저장</button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
            <div className="text-[10px] uppercase tracking-[0.24em] text-amber-200 font-semibold">Preview</div>
            <div className="mt-2 text-2xl font-semibold">강화 단계별 예시</div>
            <div className="mt-4 space-y-3">
              {[0, 5, 10, 15, 20, 25].map((level) => (
                <div key={level} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="font-semibold">+{level}강 기준</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {(["common","rare","epic","legendary"] as WeaponRarityKey[]).map((rarity) => (
                      <div key={`${rarity}-${level}`} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 flex items-center justify-between">
                        <span>{WEAPON_RARITY_THEMES[rarity].label}</span>
                        <span className="font-semibold text-amber-200">{Number(pointSettings.rate_by_rarity[rarity] || 0) + Math.floor(level / 5) * Number(pointSettings.enhancement_bonus_per_5 || 0)}P</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionPanel>
    </div>
  );
};


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
    "포인트 경제 관리",
    "포인트샵 관리",
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto p-8 text-left">
      <div className="flex items-center gap-4 mb-10">
        <Settings className="text-amber-400" size={32} />
        <h2 className="text-4xl font-semibold uppercase tracking-tight">
          Admin Console
        </h2>
      </div>

      <div className="flex gap-4 mb-10 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setAdminTab(tab)}
            className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-semibold tracking-widest uppercase transition-all ${
              adminTab === tab ? "bg-amber-500 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10"
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
        {adminTab === "길드 설정" && <GuildSettingsEditor settings={settings} setSettings={setSettings} />}
        {adminTab === "공지 관리" && <AdminNoticeManager user={user} profile={profile} />}
        {adminTab === "캐릭터 관리" && <AdminCharacterManager />}
        {adminTab === "레이드 관리" && <AdminRaidManager />}
        {adminTab === "회원 관리" && <AdminUserManager />}
        {adminTab === "포인트 경제 관리" && <PointEconomyManager settings={settings} setSettings={setSettings} />}
        {adminTab === "포인트샵 관리" && <AdminPointShopManager />}
      </div>
    </motion.div>
  );
};

const GuildSettingsEditor = ({ settings, setSettings }: any) => {
  const uiImages = settings?.point_rate_settings?.ui_images || {};

  const updateUiImage = (key: "background_image_url" | "side_left_image_url" | "side_right_image_url" | "side_left_enabled" | "side_right_enabled" | "spline_scene_url" | "spline_enabled", value: string | boolean) => {
    setSettings({
      ...settings,
      point_rate_settings: {
        ...normalizePointRateSettings(settings?.point_rate_settings),
        ui_images: {
          ...uiImages,
          [key]: value,
        },
      },
    });
  };

  const handleUiImageUpload = async (
    key: "background_image_url" | "side_left_image_url" | "side_right_image_url",
    file: File | null
  ) => {
    if (!file) return;
    try {
      const publicUrl = await uploadGuildImage(file, "ui-backgrounds");
      updateUiImage(key, publicUrl);
      showToast("이미지 업로드 완료", "success");
    } catch (error: any) {
      showToast(error?.message || "이미지 업로드 실패", "error");
    }
  };

  const handleSave = async () => {
    const { error, payload } = await saveSingletonSettings(settings);
    if (error) showToast(error.message, "error");
    else {
      const nextSettings = normalizeAppSettings(payload);
      setSettings(nextSettings);
      writeCache(CACHE_KEYS.settings, nextSettings);
      showToast("길드 설정 업데이트 완료!", "success");
    }
  };

  const sideLeftEnabled = uiImages?.side_left_enabled !== false;
  const sideRightEnabled = uiImages?.side_right_enabled !== false;
  const splineSceneUrl = String(uiImages?.spline_scene_url || "");
  const splineEnabled = uiImages?.spline_enabled === true;

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

      {/* ── Spline 배경 설정 ── */}
      <div className="rounded-[2rem] border border-amber-400/20 bg-amber-400/[0.04] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-amber-200">Spline 3D 배경</div>
            <p className="mt-1 text-xs text-slate-500">
              Spline 씬 URL을 입력하면 홈페이지 전체 배경으로 3D 애니메이션이 재생됩니다.
              활성화 시 기존 이미지 배경보다 우선 표시됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateUiImage("spline_enabled", !splineEnabled)}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition",
              splineEnabled
                ? "bg-amber-500/20 border-amber-400/40 text-amber-200"
                : "bg-white/5 border-white/10 text-slate-500"
            )}
          >
            {splineEnabled ? "ON" : "OFF"}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 ml-1">
            Spline Scene URL
          </label>
          <input
            value={splineSceneUrl}
            onChange={(e) => updateUiImage("spline_scene_url", e.target.value)}
            placeholder="https://prod.spline.design/XBHnJdtppEynMSPI/scene.splinecode"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-white outline-none focus:border-amber-200/30"
          />
          <p className="text-[10px] text-slate-600 ml-1">
            Spline → Share → Embed → scene.splinecode URL을 복사하여 붙여넣으세요.
          </p>
        </div>

        {splineSceneUrl && (
          <div className={cn(
            "rounded-xl border px-4 py-3 text-xs font-semibold",
            splineEnabled
              ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
              : "border-white/10 bg-white/5 text-slate-400"
          )}>
            {splineEnabled
              ? "✓ Spline 배경 활성화됨 — 저장 후 홈페이지에 3D 배경이 표시됩니다."
              : "Spline URL 입력됨, 하지만 현재 OFF 상태입니다."}
          </div>
        )}
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6 space-y-6">
        <div>
          <div className="text-sm font-semibold text-white">이미지 배경 설정</div>
          <p className="mt-1 text-xs text-slate-500">
            Spline이 OFF 상태일 때 사용됩니다. URL 입력 또는 이미지 첨부 둘 다 가능합니다.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* 배경 이미지 */}
          {(() => {
            const key = "background_image_url";
            const label = "전체 배경 이미지";
            const value = String(uiImages?.[key] || "");
            return (
              <div key={key} className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</label>
                <input
                  value={value}
                  onChange={(e) => updateUiImage(key, e.target.value)}
                  placeholder="이미지 URL 입력"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-white outline-none focus:border-amber-200/30"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleUiImageUpload(key, e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black"
                />
                {value ? (
                  <div className="space-y-2">
                    <div className="h-28 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      <img src={value} alt={label} className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => updateUiImage(key, "")}
                      className="w-full rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-400/16 transition"
                    >
                      이미지 제거
                    </button>
                  </div>
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 text-xs text-slate-600">
                    기존 배경 유지
                  </div>
                )}
              </div>
            );
          })()}

          {/* 좌측 사이드 이미지 */}
          {(() => {
            const key = "side_left_image_url";
            const label = "좌측 사이드 이미지";
            const value = String(uiImages?.[key] || "");
            return (
              <div key={key} className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</label>
                  <button
                    type="button"
                    onClick={() => updateUiImage("side_left_enabled", !sideLeftEnabled)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-semibold border transition",
                      sideLeftEnabled
                        ? "bg-amber-500/20 border-amber-400/40 text-amber-200"
                        : "bg-white/5 border-white/10 text-slate-500"
                    )}
                  >
                    {sideLeftEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <input
                  value={value}
                  onChange={(e) => updateUiImage(key, e.target.value)}
                  placeholder="이미지 URL 입력"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-white outline-none focus:border-amber-200/30"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleUiImageUpload(key, e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black"
                />
                {value ? (
                  <div className="space-y-2">
                    <div className={cn("h-28 overflow-hidden rounded-xl border border-white/10 bg-black/30", !sideLeftEnabled && "opacity-40")}>
                      <img src={value} alt={label} className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => updateUiImage(key, "")}
                      className="w-full rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-400/16 transition"
                    >
                      이미지 제거
                    </button>
                  </div>
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 text-xs text-slate-600">
                    이미지 없음
                  </div>
                )}
                {!sideLeftEnabled && (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                    현재 OFF 상태 — 저장 후 좌측 이미지가 숨겨집니다.
                  </div>
                )}
              </div>
            );
          })()}

          {/* 우측 사이드 이미지 */}
          {(() => {
            const key = "side_right_image_url";
            const label = "우측 사이드 이미지";
            const value = String(uiImages?.[key] || "");
            return (
              <div key={key} className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</label>
                  <button
                    type="button"
                    onClick={() => updateUiImage("side_right_enabled", !sideRightEnabled)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-semibold border transition",
                      sideRightEnabled
                        ? "bg-amber-500/20 border-amber-400/40 text-amber-200"
                        : "bg-white/5 border-white/10 text-slate-500"
                    )}
                  >
                    {sideRightEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <input
                  value={value}
                  onChange={(e) => updateUiImage(key, e.target.value)}
                  placeholder="이미지 URL 입력"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs text-white outline-none focus:border-amber-200/30"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleUiImageUpload(key, e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:rounded-full file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-black"
                />
                {value ? (
                  <div className="space-y-2">
                    <div className={cn("h-28 overflow-hidden rounded-xl border border-white/10 bg-black/30", !sideRightEnabled && "opacity-40")}>
                      <img src={value} alt={label} className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => updateUiImage(key, "")}
                      className="w-full rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-400/16 transition"
                    >
                      이미지 제거
                    </button>
                  </div>
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/20 text-xs text-slate-600">
                    이미지 없음
                  </div>
                )}
                {!sideRightEnabled && (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                    현재 OFF 상태 — 저장 후 우측 이미지가 숨겨집니다.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-amber-500 p-6 rounded-2xl font-semibold uppercase tracking-widest hover:bg-amber-400 transition-all"
      >
        Update Hero Section
      </button>
    </div>
  );
};

const AdminSectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-[1.85rem] border border-white/10 bg-white/[0.03] p-5 md:p-6">
    <div className="mb-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">{title}</div>
      {description && <div className="mt-2 text-sm leading-6 text-slate-400">{description}</div>}
    </div>
    {children}
  </div>
);

const AdminSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) => (
  <div className="space-y-3">
    <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-[1.25rem] border border-white/10 bg-black/30 px-4 py-4 text-sm font-medium text-white outline-none transition-all focus:border-amber-200/20 focus:bg-amber-300/[0.04]"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const AdminTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) => (
  <div className="space-y-3">
    <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</label>
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-[1.35rem] border border-white/10 bg-black/30 px-4 py-4 text-sm leading-7 text-white outline-none transition-all focus:border-amber-200/20 focus:bg-amber-300/[0.04]"
    />
  </div>
);

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
    guide: "",
    mechanics: "",
    tip: "",
    reward_items: "",
    reward_materials: "",
  });

  const elementOptions = ["악마형", "야수형", "인간형", "정령형", "기계형", "고대", "불사", "신"];
  const attributeOptions = ["화속성 취약", "수속성 취약", "암속성 취약", "빛속성 취약", "토속성 취약", "뇌속성 취약"];

  useEffect(() => {
    fetchList();
  }, [isRaid]);

  useEffect(() => {
    if (!editingId) return;
    const currentItem = list.find((item: any) => item.id === editingId);
    if (currentItem) {
      void loadItem(currentItem, false);
    }
  }, [editingId, difficulty, selectedGate, list]);

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

  const createBaseForm = (item?: any) => ({
    name: item?.name || "",
    image_url: item?.image_url || "",
    hp: "",
    element: "",
    attribute: "",
    gold: 0,
    guide: "",
    mechanics: "",
    tip: "",
    reward_items: "",
    reward_materials: "",
  });

  const normalizeRewardText = (value: any) => {
    if (!value) return "";
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "string") return item;
          const name = String(item?.name || item?.item || item?.title || item?.material || "").trim();
          const quantity = String(item?.quantity || item?.count || "").trim();
          return quantity ? `${name} x${quantity}` : name;
        })
        .filter(Boolean)
        .join("\n");
    }
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  };

  const loadItem = async (item: any, activateEdit = true) => {
    if (activateEdit) setEditingId(item.id);

    const baseForm = createBaseForm(item);

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
      guide: data?.guide || data?.description || data?.desc || data?.memo || data?.note || "",
      mechanics: data?.mechanics || data?.pattern || data?.patterns || data?.mechanic || "",
      tip: data?.tip || data?.tips || data?.recommendation || data?.recommend || data?.comment || "",
      reward_items: normalizeRewardText(data?.reward_items || data?.rewards || data?.drop_items || data?.drops),
      reward_materials: normalizeRewardText(data?.reward_materials || data?.material_rewards || data?.drop_materials || data?.reward_summary),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedGate(1);
    setDifficulty("노말");
    setForm(createBaseForm());
  };

  const handleSave = async () => {
    if (!form.name) return showToast("이름을 입력하세요.");

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

    if (cErr) return showToast(cErr.message, "error");

    const detailPayload = {
      content_id: data.id,
      difficulty: isRaid ? difficulty : null,
      gate_num: isRaid ? Number(selectedGate) : 0,
      hp: form.hp,
      element_type: form.element,
      attribute: form.attribute,
      clear_gold: Number(form.gold) || 0,
      guide: form.guide || null,
      mechanics: form.mechanics || null,
      tip: form.tip || null,
      reward_items: form.reward_items || null,
      reward_materials: form.reward_materials || null,
    };

    let dErr: any = null;

    const firstTry = await supabase
      .from("content_details")
      .upsert(detailPayload, { onConflict: "content_id,difficulty,gate_num" });

    dErr = firstTry.error;

    if (dErr && String(dErr.message || "").includes("column")) {
      const fallback = await supabase.from("content_details").upsert(
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

      dErr = fallback.error;

      if (!dErr) {
        showToast("기본 데이터는 저장됐지만, 상세 메모/보상 컬럼이 아직 DB에 없어. SQL 마이그레이션이 필요해.", "info");
      }
    }

    if (dErr) {
      showToast(dErr.message, "error");
      return;
    }

    showToast(editingId ? "수정 완료!" : "등록 완료!", "success");
    await fetchList();
    resetForm();
  };

  const deleteItem = async (id: string, name: string) => {
    if (!confirm(`[${name}]을(를) 삭제하시겠습니까?`)) return;
    await supabase.from("content_details").delete().eq("content_id", id);
    const { error } = await supabase.from("contents").delete().eq("id", id);
    if (!error) {
      showToast("삭제 완료", "success");
      fetchList();
      resetForm();
    }
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[0.78fr,1.22fr]">
      <div className="space-y-5">
        <AdminSectionCard
          title="Content Library"
          description={`${isRaid ? "레이드" : "가디언 토벌"} 콘텐츠를 선택하면 우측에서 상세 데이터를 편집할 수 있어.`}
        >
          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {list.map((item) => (
              <button
                key={item.id}
                onClick={() => loadItem(item)}
                className={cn(
                  "flex w-full items-center justify-between rounded-[1.35rem] border px-4 py-4 text-left transition-all",
                  editingId === item.id
                    ? "border-amber-200/22 bg-amber-300/[0.08] shadow-[0_16px_36px_rgba(180,138,61,0.12)]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {editingId === item.id ? "현재 편집 중" : "클릭하여 상세 편집"}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(item.id, item.name);
                  }}
                  className="ml-4 shrink-0 text-slate-600 transition-colors hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </button>
            ))}
          </div>
        </AdminSectionCard>
      </div>

      <div className="space-y-5">
        {editingId && (
          <div className="rounded-[1.35rem] border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-yellow-200">
            수정 모드 활성화
          </div>
        )}

        <AdminSectionCard
          title="기본 정보"
          description="콘텐츠 이름과 대표 이미지를 관리해. 공통 메타 영역이야."
        >
          <div className="grid gap-4 md:grid-cols-[1fr,0.9fr]">
            <AdminInput
              label="Content Name"
              value={form.name}
              onChange={(v: any) => setForm({ ...form, name: v })}
            />
            <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
              <ImageUploader
                label="Image"
                onUpload={(url) => setForm({ ...form, image_url: url })}
              />
              {form.image_url && (
                <img
                  src={form.image_url}
                  className="mt-4 h-36 w-full rounded-2xl object-cover"
                />
              )}
            </div>
          </div>
        </AdminSectionCard>

        {isRaid && (
          <AdminSectionCard
            title="관문 / 난이도 편집 위치"
            description="현재 편집할 관문과 난이도를 먼저 선택해. 선택 변경 시 해당 위치의 저장 데이터가 즉시 로드돼."
          >
            <div className="grid gap-4 lg:grid-cols-[1fr,1fr,0.9fr]">
              <div>
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Gate</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[1, 2, 3, 4].map((gate) => (
                    <button
                      key={gate}
                      type="button"
                      onClick={() => setSelectedGate(gate)}
                      className={cn(
                        "rounded-[1.15rem] border px-4 py-3 text-sm font-semibold transition-all",
                        selectedGate === gate
                          ? "border-amber-200/22 bg-amber-300/[0.10] text-white shadow-[0_12px_28px_rgba(180,138,61,0.14)]"
                          : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {gate}관문
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Difficulty</div>
                <div className="flex flex-wrap gap-2">
                  {difficultyOptions.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={cn(
                        "rounded-full border px-4 py-3 text-sm font-semibold transition-all",
                        difficulty === d
                          ? "border-white/10 bg-white text-black"
                          : "border-white/10 bg-black/20 text-slate-400 hover:border-white/20 hover:text-white"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Current Slot</div>
                <div className="mt-3 text-lg font-semibold text-white">{difficulty}</div>
                <div className="mt-1 text-sm text-amber-200">{selectedGate}관문</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">이 위치에 저장되는 메모/보상/수치가 모달에 그대로 연결돼.</div>
              </div>
            </div>
          </AdminSectionCard>
        )}

        <div className="grid gap-5 xl:grid-cols-[0.95fr,1.05fr]">
          <AdminSectionCard
            title="전투 수치"
            description="관문별 핵심 스펙과 숫자형 보상을 입력해."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminInput label="HP" value={form.hp} onChange={(v: any) => setForm({ ...form, hp: v })} />
              <AdminInput
                label="Gold"
                type="number"
                value={form.gold}
                onChange={(v: any) => setForm({ ...form, gold: v })}
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AdminSelect
                label="계열"
                value={form.element}
                onChange={(value) => setForm({ ...form, element: value })}
                options={elementOptions}
                placeholder="계열 선택"
              />
              <AdminSelect
                label="속성"
                value={form.attribute}
                onChange={(value) => setForm({ ...form, attribute: value })}
                options={attributeOptions}
                placeholder="속성 선택"
              />
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title="보상 데이터"
            description="한 줄에 하나씩 입력해. 예: 찬란한 명예의 돌파석 x8"
          >
            <div className="space-y-4">
              <AdminTextarea
                label="드랍 아이템"
                value={form.reward_items}
                onChange={(value) => setForm({ ...form, reward_items: value })}
                placeholder={"예시\n비밀의 보물 상자 x1\n빛나는 명예의 돌파석 x12"}
                rows={5}
              />
              <AdminTextarea
                label="드랍 재료"
                value={form.reward_materials}
                onChange={(value) => setForm({ ...form, reward_materials: value })}
                placeholder={"예시\n정제된 파괴강석 x24\n정제된 수호강석 x36"}
                rows={5}
              />
            </div>
          </AdminSectionCard>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <AdminSectionCard
            title="공략 메모"
            description="전체 진행 흐름이나 주의사항을 적어."
          >
            <AdminTextarea
              label="Guide"
              value={form.guide}
              onChange={(value) => setForm({ ...form, guide: value })}
              placeholder="공략 메모를 입력"
              rows={6}
            />
          </AdminSectionCard>

          <AdminSectionCard
            title="주요 기믹"
            description="패턴, 카운터, 협동 포인트를 적어."
          >
            <AdminTextarea
              label="Mechanics"
              value={form.mechanics}
              onChange={(value) => setForm({ ...form, mechanics: value })}
              placeholder="기믹/패턴을 입력"
              rows={6}
            />
          </AdminSectionCard>

          <AdminSectionCard
            title="추천 포인트"
            description="실전 팁, 아이템 추천, 파티 조합 팁을 적어."
          >
            <AdminTextarea
              label="Tip"
              value={form.tip}
              onChange={(value) => setForm({ ...form, tip: value })}
              placeholder="추천 포인트를 입력"
              rows={6}
            />
          </AdminSectionCard>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            className="rounded-[1.35rem] bg-gradient-to-r from-amber-400 to-amber-300 px-6 py-4 text-sm font-semibold text-slate-950 transition-all hover:brightness-110"
          >
            {editingId ? "Update Content" : "Register Content"}
          </button>

          {editingId && (
            <button
              onClick={resetForm}
              className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-6 py-4 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
            >
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
    if (!form.sub) return showToast("직업명을 입력하세요.");
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
      showToast("저장 완료!", "success");
      fetchList();
      setForm({ root: "", sub: "", eng_job: "", link: "", image_url: "" });
    } else {
      showToast(error.message, "error");
    }
  };

  const deleteItem = async (subClass: string) => {
    if (!confirm(`[${subClass}] 클래스를 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from("class_infos").delete().eq("sub_class", subClass);
    if (!error) {
      showToast("삭제 완료", "success");
      fetchList();
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <div className="space-y-6">
        <h4 className="text-xs font-semibold uppercase text-amber-400 tracking-widest">
          Class List
        </h4>
        <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-2">
          {list.map((item) => (
            <div
              key={item.id || item.sub_class}
              className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5"
            >
              <span className="text-[10px] font-bold text-slate-400">{item.sub_class}</span>
              <button
                onClick={() => deleteItem(item.sub_class)}
                className="text-slate-600 hover:text-red-500 transition-colors"
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
          className="w-full bg-amber-500 p-4 rounded-xl font-semibold uppercase hover:bg-amber-400 transition-all"
        >
          Update Class
        </button>
      </div>
    </div>
  );
};



const PostBoard = ({ posts, user, profile, onRefresh, initialTab }: any) => {
  const [tab, setTab] = useState(initialTab || "all");
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
      if (error) return showToast(error.message, "error");
      onRefresh();
      void fetchComments();
    } catch (error: any) {
      showToast(error?.message || "게시글 삭제 중 오류가 발생했어요.", "error");
    }
  };

  const togglePin = async (post: any) => {
    if (profile?.role !== "admin") return;
    if (!post.is_notice) return showToast("공지글만 고정 가능합니다.");

    const client = getSupabaseOrThrow();

    if (!post.is_pinned) {
      await client.from("posts").update({ is_pinned: false }).eq("is_notice", true).eq("is_pinned", true);
    }

    const { error } = await client.from("posts").update({ is_pinned: !post.is_pinned }).eq("id", post.id);
    if (error) return showToast(error.message, "error");
    onRefresh();
  };

  const submitComment = async (postId: string) => {
    if (!user) return showToast("로그인 후 댓글을 작성할 수 있어요.", "error");
    if (!commentsEnabled) return showToast("댓글 기능용 SQL이 아직 적용되지 않았어요.", "success");
    const content = (commentDrafts[postId] || "").trim();
    if (!content) return showToast("댓글 내용을 입력해줘.");

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
        showToast(error.message, "error");
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
      showToast("댓글 작성 완료! +5 포인트 획득 🎉", "success");
    } catch (error: any) {
      showToast(error?.message || "댓글 등록 중 오류가 발생했어요.", "error");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제할까요?")) return;

    try {
      const client = getSupabaseOrThrow();
      const { error } = await client.from("post_comments").delete().eq("id", commentId);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      await fetchComments();
    } catch (error: any) {
      showToast(error?.message || "댓글 삭제 중 오류가 발생했어요.", "error");
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-32 text-center space-y-6">
        <Shield size={64} className="mx-auto text-slate-800" />
        <h2 className="text-3xl font-semibold uppercase tracking-tight">
          Access Denied
        </h2>
        <p className="text-slate-500 font-bold">게시판은 로그인한 회원만 이용 가능합니다.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto p-6 md:p-12 text-left">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-semibold uppercase tracking-tight">Bulletin Board</h2>
          <p className="text-slate-500 font-bold mt-2">게시글 작성 +5P, 댓글 작성 +5P, 이미지 첨부와 공지 고정까지 한 번에 관리합니다.</p>
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
                "whitespace-nowrap px-5 py-3 rounded-full text-[11px] font-semibold uppercase transition-all",
                tab === key ? "bg-amber-500 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10"
              )}
            >
              {label}
            </button>
          ))}

          <button
            onClick={() => setShowWriteModal(true)}
            className="ml-1 h-12 w-12 rounded-2xl bg-amber-500 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center"
            title="글 작성"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {!commentsEnabled && (
        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          댓글 테이블이 아직 없어서 댓글 기능이 비활성화돼 있어. 함께 전달한 SQL 파일을 먼저 적용해줘.
        </div>
      )}

      <div className="space-y-4">
        {visiblePosts.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-10 text-center text-slate-500">
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
                post.is_pinned ? "border-amber-400/30 bg-amber-400/10" : post.is_notice ? "border-amber-400/30 bg-amber-400/10" : "border-white/10 bg-white/5"
              )}
            >
              <div className="flex justify-between items-start mb-4 gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {post.is_pinned && (
                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/20">
                      PINNED
                    </span>
                  )}
                  {post.is_notice ? (
                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-400/15 text-amber-200 border border-amber-400/20">
                      공지
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300 border border-white/10">
                      {post.category || "자유"}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                    {formatDateTime(post.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {profile?.role === "admin" && post.is_notice && (
                    <button onClick={() => togglePin(post)} className="text-[11px] text-amber-200 font-semibold">
                      {post.is_pinned ? "고정 해제" : "고정"}
                    </button>
                  )}
                  {(profile?.role === "admin" || user?.id === post.user_id) && (
                    <button onClick={() => handleDelete(post.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {post.image_url && (
                <img src={post.image_url} className="w-full h-56 md:h-72 object-cover rounded-2xl mb-5 border border-white/5" />
              )}

              <h3 className="text-2xl font-semibold text-white mb-3">{post.title}</h3>
              <p className="text-slate-300 text-sm mb-4 whitespace-pre-wrap">{post.content}</p>

              <div className="flex flex-wrap justify-between items-center gap-3 text-[10px] text-slate-500 font-semibold uppercase">
                <span>{post.author_name || post.author || "-"}</span>
                <button
                  onClick={() => setOpenCommentPosts((prev) => ({ ...prev, [post.id]: !Boolean(prev[post.id]) }))}
                  className="px-3 py-2 rounded-full border border-white/10 bg-black/20 text-slate-300 hover:border-amber-400/40"
                >
                  댓글 {postComments.length}개 {commentsOpen ? "닫기" : "열기"}
                </button>
              </div>

              {commentsOpen && (
                <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 space-y-4">
                  <div className="space-y-3">
                    {postComments.length === 0 && (
                      <div className="text-sm text-slate-500">아직 댓글이 없습니다.</div>
                    )}

                    {postComments.map((comment: any) => (
                      <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">{comment.author_name || comment.author || "-"}</div>
                            <div className="text-[10px] text-slate-500 uppercase mt-1">{formatDateTime(comment.created_at)}</div>
                          </div>

                          {(profile?.role === "admin" || user?.id === comment.user_id) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-slate-500 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <div className="mt-3 text-sm text-slate-300 whitespace-pre-wrap">{comment.content}</div>
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
                      className="md:w-36 bg-amber-500 px-5 py-4 rounded-2xl font-semibold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
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
      showToast("제목과 내용을 입력하세요.");
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
        showToast(error.message, "error");
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

      showToast(isNotice ? "공지 작성 완료!" : "게시글 작성 완료! +5 포인트 획득 🎉");
      await onRefresh();
      onClose();
    } catch (err: any) {
      showToast(err?.message || "게시글 작성 중 오류가 발생했어요.", "error");
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
        <h3 className="text-3xl font-semibold uppercase text-amber-400 mb-3">
          Create New Post
        </h3>
        <p className="text-sm text-slate-500 mb-8">일반 글은 작성 시 +5포인트, 댓글도 +5포인트가 지급됩니다.</p>

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
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-400">
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
              <div className="text-xs text-slate-400 mb-2">첨부 이미지 미리보기</div>
              <img src={imgUrl} className="w-full h-56 object-cover rounded-2xl" />
            </div>
          )}

          <button
            onClick={handlePost}
            disabled={submitting}
            className="w-full bg-amber-500 p-6 rounded-2xl font-semibold uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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

        showToast("회원가입 성공! 이메일을 확인하세요.", "success");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMode("home");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="max-w-md mx-auto py-32 px-4">
      <div className="p-12 rounded-[4rem] border border-white/10 bg-[#0f0f0f] shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        <h2 className="text-5xl font-semibold mb-2 tracking-tight uppercase">
          {mode === "login" ? "Sign In" : "Join Us"}
        </h2>
        <p className="text-slate-600 text-[10px] font-semibold tracking-[0.4em] mb-12 uppercase">
          Authentication Required
        </p>

        <form onSubmit={handleAuth} className="space-y-5 text-left">
          <input
            type="email"
            placeholder="E-MAIL"
            className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-amber-400 text-sm tracking-widest font-semibold text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="PASSWORD"
            className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-amber-400 text-sm tracking-widest font-semibold text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {mode === "signup" && (
            <input
              type="text"
              placeholder="NICKNAME"
              className="w-full bg-black border border-white/10 p-5 rounded-3xl focus:outline-none focus:border-amber-400 text-sm tracking-widest font-semibold text-white"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          )}

          <button
            type="submit"
            className="w-full bg-amber-500 p-6 rounded-3xl font-semibold uppercase tracking-[0.3em] mt-6 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 active:scale-95 text-white"
          >
            Proceed
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-8 text-[10px] font-semibold text-slate-600 hover:text-white uppercase transition-all"
        >
          Switch to {mode === "login" ? "signup" : "login"}
        </button>
      </div>
    </div>
  );
};


const MyRoom = ({ user, profile, setProfile, fetchProfile }: any) => {
  const [rankIcon, setRankIcon] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
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
  const [ownedWeapons, setOwnedWeapons] = useState<any[]>([]);
  const [ownedEnhanceItems, setOwnedEnhanceItems] = useState<any[]>([]);
  const [myPoint, setMyPoint] = useState(0);
  const [ownedNicknameEffects, setOwnedNicknameEffects] = useState<any[]>([]);
  const [myRoomTab, setMyRoomTab] = useState<"growth" | "characters">("growth");
  const [nakwonSpendAmount, setNakwonSpendAmount] = useState("100");
  const [nakwonSubmitting, setNakwonSubmitting] = useState(false);
  const [enhancementAttemptState, setEnhancementAttemptState] = useState(() => ({
    usedToday: Number(profile?.enhance_attempts_used_today || 0),
    usedDate: String(profile?.enhance_attempts_used_date || ""),
  }));
  const [pointRateSettings, setPointRateSettings] = useState<PointRateSettings>(normalizePointRateSettings(readCache<any>(CACHE_KEYS.settings, defaultSettings)?.point_rate_settings));
  const [pointTickNow, setPointTickNow] = useState(Date.now());
  const passiveTickAnchorRef = useRef<string>(profile?.last_point_tick_at || new Date().toISOString());
  const passiveCatchupLockRef = useRef(false);
  const getResolvedLastTickAt = useCallback((value: any) => {
    if (value) {
      passiveTickAnchorRef.current = String(value);
      return String(value);
    }
    return passiveTickAnchorRef.current;
  }, []);
  const [passivePointState, setPassivePointState] = useState(() => ({
    lastTickAt: profile?.last_point_tick_at || passiveTickAnchorRef.current,
    passivePointsToday: Number(profile?.passive_points_today || 0),
    passivePointsDate: String(profile?.passive_points_date || ""),
  }));
  const [pointEarnLogs, setPointEarnLogs] = useState<any[]>([]);
  const [enhancingCharacterId, setEnhancingCharacterId] = useState<string | null>(null);
  const [expandedWeaponPanels, setExpandedWeaponPanels] = useState<Record<string, boolean>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);

  const toggleWeaponPanel = (characterId: string) => {
    setExpandedWeaponPanels((prev) => ({
      ...prev,
      [characterId]: !prev[characterId],
    }));
  };

  const handleAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];

    if (profile.last_attendance === today) {
      showToast("오늘은 이미 출석했습니다 ✅");
      return;
    }

    const { error } = await supabase.rpc("add_points", {
      p_user_id: user.id,
      p_points: 10,
      p_type: "attendance",
    });

    if (error) {
      showToast("출석 실패", "error");
      return;
    }

    await supabase.from("profiles").update({ last_attendance: today }).eq("id", user.id);

    showToast("출석 완료! +10 포인트 🎉", "success");
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
          owner_profile_nickname: profile?.nickname || item.owner_nickname || item.nickname || "",
          owner_active_nickname_effect: profile?.active_nickname_effect || "none",
          owner_nickname_gradient_from: profile?.nickname_gradient_from || null,
          owner_nickname_gradient_to: profile?.nickname_gradient_to || null,
          owner_nickname_glow_color: profile?.nickname_glow_color || null,
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
    if (!user?.id) return;

    const client = getSupabaseOrThrow();

    const normalizeOwnedBadgeRow = (badge: any, sourceTable: string) => ({
      ...badge,
      source_table: sourceTable,
      badge_item_id: String(
        badge?.badge_item_id ||
        badge?.shop_item_id ||
        badge?.item_id ||
        badge?.badge_id ||
        badge?.id ||
        ""
      ),
    });

    const readBadgeTable = async (tableName: string) => {
      try {
        const { data, error } = await client
          .from(tableName)
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(`${tableName} fetchOwnedBadges error:`, error);
          return [];
        }

        return (data || []).map((badge: any) => normalizeOwnedBadgeRow(badge, tableName));
      } catch (error) {
        console.error(`${tableName} fetchOwnedBadges unexpected error:`, error);
        return [];
      }
    };

    const ownedBadgeRows = await readBadgeTable("user_badges");

    const mergedRows = [...ownedBadgeRows].filter((badge: any) => badge.badge_item_id);
    const uniqueRows = Array.from(
      new Map(
        mergedRows.map((badge: any) => [
          `${badge.source_table}-${badge.id || badge.badge_item_id}`,
          badge,
        ])
      ).values()
    );

    const badgeItemIds = Array.from(
      new Set(uniqueRows.map((item: any) => String(item.badge_item_id || "")).filter(Boolean))
    );

    let itemMap = new Map<string, any>();
    if (badgeItemIds.length > 0) {
      const { data: itemRows, error: itemError } = await client
        .from("point_shop_items")
        .select("id, title, badge_name, badge_color, badge_card_effect, badge_gradient_from, badge_gradient_to, badge_glow_color")
        .in("id", badgeItemIds);

      if (itemError) {
        console.error("point_shop_items badge meta fetch error:", itemError);
      } else {
        itemMap = new Map((itemRows || []).map((item: any) => [String(item.id), item]));
      }
    }

    setOwnedBadges(
      uniqueRows.map((badge: any) => {
        const itemMeta = itemMap.get(String(badge.badge_item_id || "")) || {};
        return {
          ...badge,
          badge_name: badge.badge_name || badge.name || badge.title || itemMeta.badge_name || itemMeta.title || "뱃지",
          badge_color: badge.badge_color || badge.color || itemMeta.badge_color || "#8b5cf6",
          badge_card_effect: badge.badge_card_effect || badge.card_effect || itemMeta.badge_card_effect || "none",
          badge_gradient_from: badge.badge_gradient_from || badge.gradient_from || itemMeta.badge_gradient_from || null,
          badge_gradient_to: badge.badge_gradient_to || badge.gradient_to || itemMeta.badge_gradient_to || null,
          badge_glow_color: badge.badge_glow_color || badge.glow_color || itemMeta.badge_glow_color || null,
        };
      })
    );
  }, [user?.id]);


  const fetchOwnedWeapons = useCallback(async () => {
    if (!user?.id) return;
    const client = getSupabaseOrThrow();
    const { data, error } = await client
      .from("user_owned_weapons")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchOwnedWeapons error:", error);
      setOwnedWeapons([]);
      return;
    }

    const weaponIds = Array.from(new Set((data || []).map((item: any) => String(item.weapon_id || "")).filter(Boolean)));
    let weaponMap = new Map<string, any>();

    if (weaponIds.length > 0) {
      const { data: weaponRows, error: weaponError } = await client
        .from("weapon_parts")
        .select("id, name, description, image_url, rarity, is_active")
        .in("id", weaponIds);

      if (weaponError) {
        console.error("weapon_parts fetch error:", weaponError);
      } else {
        weaponMap = new Map((weaponRows || []).map((item: any) => [String(item.id), item]));
      }
    }

    setOwnedWeapons(
      (data || []).map((item: any) => {
        const meta = weaponMap.get(String(item.weapon_id || "")) || {};
        return {
          ...item,
          inventory_id: item.id,
          name: item.weapon_name || meta.name || "무기 파츠",
          description: item.description || meta.description || "",
          image_url: item.weapon_image_url || meta.image_url || item.image_url || "",
          rarity: item.rarity || meta.rarity || "common",
          enhancement_level: normalizeEnhancementLevel(item.enhancement_level),
          last_enhanced_on: item.last_enhanced_on || null,
        };
      })
    );
  }, [user?.id]);

  const fetchOwnedNicknameEffects = useCallback(async () => {
    if (!user?.id) return;
    const client = getSupabaseOrThrow();
    const { data, error } = await client
      .from("user_owned_nickname_effects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchOwnedNicknameEffects error:", error);
      setOwnedNicknameEffects([]);
      return;
    }

    setOwnedNicknameEffects(data || []);
  }, [user?.id]);

  const fetchOwnedEnhanceItems = useCallback(async () => {
    if (!user?.id) return;
    const client = getSupabaseOrThrow();
    try {
      const { data, error } = await client
        .from("user_owned_enhance_items")
        .select("*")
        .eq("user_id", user.id)
        .order("bonus_rate", { ascending: false });

      if (error) {
        const message = String(error?.message || "");
        if (!message.includes("schema cache") && !message.includes("404") && !message.includes("relation") && !message.includes("does not exist")) {
          console.error("fetchOwnedEnhanceItems error:", error);
        }
        setOwnedEnhanceItems([]);
        return;
      }

      setOwnedEnhanceItems(
        (data || []).map((item: any) => ({
          ...item,
          quantity: Math.max(0, Number(item.quantity || 0)),
          bonus_rate: Number(item.bonus_rate || item.enhance_bonus_rate || 0),
          item_type: item.item_type || "enhance_stone",
          protection_scope: item.protection_scope || null,
        }))
      );
    } catch (error) {
      console.error("fetchOwnedEnhanceItems unexpected error:", error);
      setOwnedEnhanceItems([]);
    }
  }, [user?.id]);

  const fetchMyPoint = useCallback(async () => {
    if (!user?.id) return;
    const client = getSupabaseOrThrow();
    const { data, error } = await client
      .from("profiles")
      .select("points, last_point_tick_at, passive_points_today, passive_points_date, enhance_attempts_used_today, enhance_attempts_used_date, nakwon_level, nakwon_exp, nakwon_total_spent")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("fetchMyPoint error:", error);
      return;
    }

    setMyPoint(Number(data?.points || 0));
    setPassivePointState({
      lastTickAt: getResolvedLastTickAt(data?.last_point_tick_at),
      passivePointsToday: Number(data?.passive_points_today || 0),
      passivePointsDate: String(data?.passive_points_date || ""),
    });
    setEnhancementAttemptState({
      usedToday: Number(data?.enhance_attempts_used_today || 0),
      usedDate: String(data?.enhance_attempts_used_date || ""),
    });
  }, [user?.id]);

  useEffect(() => {
    setEnhancementAttemptState({
      usedToday: Number(profile?.enhance_attempts_used_today || 0),
      usedDate: String(profile?.enhance_attempts_used_date || ""),
    });
  }, [profile?.enhance_attempts_used_today, profile?.enhance_attempts_used_date]);

  const nakwonLevel = Math.max(1, Number(profile?.nakwon_level || 1));
  const nakwonExp = Math.max(0, Number(profile?.nakwon_exp || 0));
  const nakwonTotalSpent = Math.max(0, Number(profile?.nakwon_total_spent || 0));
  const nakwonRequiredExp = getNakwonExpRequiredForLevel(nakwonLevel);
  const nakwonProgressPercent = Math.max(0, Math.min(100, (nakwonExp / Math.max(1, nakwonRequiredExp)) * 100));
  const dailyEnhanceLimit = getNakwonDailyEnhanceLimit(nakwonLevel);
  const enhanceAttemptsUsedToday =
    enhancementAttemptState.usedDate === getTodayKey() ? Number(enhancementAttemptState.usedToday || 0) : 0;
  const remainingEnhanceAttempts = Math.max(0, dailyEnhanceLimit - enhanceAttemptsUsedToday);
  const protectionTicketCount = ownedEnhanceItems
    .filter((item: any) => item.item_type === "enhance_protect_ticket")
    .reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);

  const handleNakwonInfuse = async (amountLike?: number) => {
    if (!user?.id) return showToast("로그인 후 사용 가능합니다.", "error");
    const amount = Math.max(0, Math.floor(Number(amountLike ?? nakwonSpendAmount)));
    if (!Number.isFinite(amount) || amount <= 0) return showToast("주입할 포인트를 입력해줘.");
    if (myPoint < amount) return showToast("포인트가 부족해.");
    if (!confirm(`${amount}P를 낙원 경험치로 주입할까요?`)) return;

    const result = applyNakwonExpGain(profile?.nakwon_level, profile?.nakwon_exp, amount);
    const nextPoint = Math.max(0, myPoint - amount);
    const client = getSupabaseOrThrow();
    setNakwonSubmitting(true);

    const { error } = await client
      .from("profiles")
      .update({
        points: nextPoint,
        nakwon_level: result.level,
        nakwon_exp: result.exp,
        nakwon_total_spent: Math.max(0, Number(profile?.nakwon_total_spent || 0)) + amount,
      })
      .eq("id", user.id);

    setNakwonSubmitting(false);

    if (error) {
      showToast(`${error.message}\n\n낙원력 컬럼 SQL을 먼저 적용해줘.`, "error");
      return;
    }

    setMyPoint(nextPoint);
    await fetchProfile(user.id);
    await fetchMyPoint();

    showToast(
      result.leveledUp
        ? `낙원력이 상승했어! Lv.${nakwonLevel} → Lv.${result.level}`
        : `낙원 경험치 +${amount} 완료!`
    );
  };

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
      fetchOwnedWeapons();
      fetchOwnedEnhanceItems();
      fetchOwnedNicknameEffects();
      fetchMyPoint();
    }
  }, [profile, user, fetchOwnedBadges, fetchOwnedWeapons, fetchOwnedEnhanceItems, fetchOwnedNicknameEffects, fetchMyPoint]);

  useEffect(() => {
    const cachedSettings = readCache<any>(CACHE_KEYS.settings, defaultSettings);
    setPointRateSettings(normalizePointRateSettings(cachedSettings?.point_rate_settings));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setPointTickNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setPassivePointState((prev) => ({
      lastTickAt: getResolvedLastTickAt(profile?.last_point_tick_at || prev?.lastTickAt),
      passivePointsToday: Number(profile?.passive_points_today || 0),
      passivePointsDate: String(profile?.passive_points_date || ""),
    }));
  }, [profile?.id, profile?.last_point_tick_at, profile?.passive_points_today, profile?.passive_points_date, getResolvedLastTickAt]);

  const fetchPointEarnLogs = useCallback(async () => {
    if (!user?.id) return;
    const client = getSupabaseOrThrow();
    const { data, error } = await client
      .from("point_earn_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("point_earn_logs fetch error:", error);
      return;
    }

    setPointEarnLogs(data || []);
  }, [user?.id]);

  useEffect(() => {
    void fetchPointEarnLogs();
  }, [fetchPointEarnLogs]);


  const bestPointCharacter = useMemo(() => getBestPointCharacter(characters, pointRateSettings), [characters, pointRateSettings]);
  const pointPerTick = useMemo(() => {
    return Math.max(0, Number(bestPointCharacter?.point_rate_per_tick || 0));
  }, [bestPointCharacter]);

  const reconcilePassivePoints = useCallback(async (reason: "boot" | "myroom" | "interval" | "focus" = "interval") => {
    if (!user?.id || passiveCatchupLockRef.current) return;
    if (!pointRateSettings.enabled || !bestPointCharacter || pointPerTick <= 0) return;

    passiveCatchupLockRef.current = true;
    const client = getSupabaseOrThrow();

    try {
      const cycleMs = Math.max(5, Number(pointRateSettings.cycle_minutes || 60)) * 60 * 1000;
      const now = Date.now();
      const resolvedLastTickAt = getResolvedLastTickAt(passivePointState.lastTickAt);
      const lastTickMs = new Date(resolvedLastTickAt).getTime();
      const safeLastTickMs = Number.isFinite(lastTickMs) ? lastTickMs : now;
      const elapsedMs = Math.max(0, now - safeLastTickMs);
      const ticksPassed = Math.floor(elapsedMs / cycleMs);

      if (ticksPassed <= 0) return;

      const todayKey = getTodayKey();
      const todayAccumulated = passivePointState.passivePointsDate === todayKey
        ? Number(passivePointState.passivePointsToday || 0)
        : 0;
      const rawAward = ticksPassed * pointPerTick;
      const remainingCap = Math.max(0, Number(pointRateSettings.daily_cap || 0) - todayAccumulated);
      const awardedPoints = Math.max(0, Math.min(rawAward, remainingCap));
      const nextLastTickAt = new Date(safeLastTickMs + ticksPassed * cycleMs).toISOString();

      const nextProfilePatch = {
        points: Number(myPoint || profile?.points || 0) + awardedPoints,
        last_point_tick_at: nextLastTickAt,
        passive_points_today: todayAccumulated + awardedPoints,
        passive_points_date: todayKey,
      };

      const { error: updateError } = await client
        .from("profiles")
        .update(nextProfilePatch)
        .eq("id", user.id);

      if (updateError) {
        console.error(`reconcilePassivePoints (${reason}) update error:`, updateError);
        return;
      }

      if (awardedPoints > 0) {
        const description = ticksPassed > 1
          ? `${ticksPassed}회 누적 정산 · ${pointPerTick}P씩 지급`
          : `${Math.max(5, Number(pointRateSettings.cycle_minutes || 60))}분 주기 적립`;
        const logPayload = {
          user_id: user.id,
          title: reason === "boot" ? "오프라인 재접속 정산" : "시간당 자동 적립",
          description,
          points: awardedPoints,
          created_at: new Date().toISOString(),
        };

        let insertedLog = {
          ...logPayload,
          id: `local-${Date.now()}`,
        } as any;

        const { data: insertedRows, error: logError } = await client
          .from("point_earn_logs")
          .insert(logPayload)
          .select("*")
          .limit(1);

        if (logError) {
          const message = String(logError?.message || "");
          if (!message.includes("schema cache") && !message.includes("404") && !message.includes("relation")) {
            console.error("point_earn_logs insert error:", logError);
          }
        } else if (Array.isArray(insertedRows) && insertedRows[0]) {
          insertedLog = insertedRows[0];
        }

        setPointEarnLogs((prev) => [insertedLog, ...prev.filter((item: any) => item?.id !== insertedLog.id)].slice(0, 20));
      }

      setMyPoint(nextProfilePatch.points);
      setPassivePointState({
        lastTickAt: getResolvedLastTickAt(nextLastTickAt),
        passivePointsToday: nextProfilePatch.passive_points_today,
        passivePointsDate: todayKey,
      });

      if (typeof setProfile === "function") {
        setProfile((prev: any) => ({
          ...(prev || {}),
          ...nextProfilePatch,
        }));
      }

      if (typeof fetchProfile === "function") {
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error(`reconcilePassivePoints (${reason}) unexpected error:`, error);
    } finally {
      passiveCatchupLockRef.current = false;
    }
  }, [
    user?.id,
    pointRateSettings,
    bestPointCharacter,
    pointPerTick,
    passivePointState.lastTickAt,
    passivePointState.passivePointsDate,
    passivePointState.passivePointsToday,
    myPoint,
    profile?.points,
    getResolvedLastTickAt,
    setProfile,
    fetchProfile,
  ]);

  useEffect(() => {
    if (!user?.id) return;
    void reconcilePassivePoints("boot");
  }, [user?.id, reconcilePassivePoints]);

  useEffect(() => {
    if (!user?.id) return;
    const timer = window.setInterval(() => {
      void reconcilePassivePoints("interval");
    }, 30 * 1000);

    const handleFocus = () => {
      void reconcilePassivePoints("focus");
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void reconcilePassivePoints("focus");
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.id, reconcilePassivePoints]);

  const equipNicknameEffect = async (effect: any) => {
    const client = getSupabaseOrThrow();
    const { error } = await client.from("profiles").update({
      active_nickname_effect: effect?.nickname_effect_key || "violet",
      nickname_gradient_from: effect?.nickname_gradient_from || null,
      nickname_gradient_to: effect?.nickname_gradient_to || null,
      nickname_glow_color: effect?.nickname_glow_color || null,
    }).eq("id", user.id);

    if (error) return showToast(error.message, "error");
    setProfile((prev: any) =>
      prev
        ? {
            ...prev,
            active_nickname_effect: effect?.nickname_effect_key || "violet",
            nickname_gradient_from: effect?.nickname_gradient_from || null,
            nickname_gradient_to: effect?.nickname_gradient_to || null,
            nickname_glow_color: effect?.nickname_glow_color || null,
          }
        : prev
    );
    showToast("닉네임 효과 적용 완료!", "success");
    await fetchProfile(user.id);
    await fetchCharacters();
  };

  const clearNicknameEffect = async () => {
    const client = getSupabaseOrThrow();
    const { error } = await client.from("profiles").update({
      active_nickname_effect: "none",
      nickname_gradient_from: null,
      nickname_gradient_to: null,
      nickname_glow_color: null,
    }).eq("id", user.id);

    if (error) return showToast(error.message, "error");
    setProfile((prev: any) =>
      prev
        ? {
            ...prev,
            active_nickname_effect: "none",
            nickname_gradient_from: null,
            nickname_gradient_to: null,
            nickname_glow_color: null,
          }
        : prev
    );
    showToast("닉네임 효과 해제 완료!", "success");
    await fetchProfile(user.id);
    await fetchCharacters();
  };

  useEffect(() => {
    const maybeGrantPassivePoint = async () => {
      if (!user?.id || !pointRateSettings.enabled || !bestPointCharacter) return;
      const info = getNextPointTickInfo(passivePointState.lastTickAt, pointRateSettings.cycle_minutes);
      if (info.remainingMs > 0) return;
      await reconcilePassivePoints("myroom");
    };

    void maybeGrantPassivePoint();
  }, [user?.id, bestPointCharacter, pointRateSettings, pointTickNow, passivePointState.lastTickAt, reconcilePassivePoints]);

  const usedBadgeIds = useMemo(() => {
    const used = new Set<string>();
    characters.forEach((character: any) => {
      getCharacterBadges(character).forEach((badge: any) => {
        if (badge?.badge_item_id) used.add(String(badge.badge_item_id));
      });
    });
    return used;
  }, [characters]);


  const equipWeaponToCharacter = async (character: any, weapon: any) => {
    const client = getSupabaseOrThrow();
    const payload = {
      equipped_weapon_id: weapon?.weapon_id || weapon?.id || null,
      equipped_weapon_inventory_id: weapon?.inventory_id || weapon?.id || null,
      equipped_weapon_name: weapon?.name || weapon?.weapon_name || null,
      equipped_weapon_image_url: weapon?.image_url || weapon?.weapon_image_url || null,
      equipped_weapon_rarity: weapon?.rarity || "common",
      equipped_weapon_level: normalizeEnhancementLevel(weapon?.enhancement_level),
      equipped_weapon_last_enhanced_on: weapon?.last_enhanced_on || null,
    };

    const { error } = await client.from("guild_members").update(payload).eq("id", character.id);
    if (error) {
      showToast(error.message, "error");
      return;
    }

    await fetchCharacters();
    showToast(`${character.character_name}에게 ${payload.equipped_weapon_name || "무기"}를 장착했어.`);
  };

  const clearWeaponFromCharacter = async (character: any) => {
    if (!confirm(`${character.character_name}의 장착 무기를 해제할까요?`)) return;
    const client = getSupabaseOrThrow();
    const { error } = await client
      .from("guild_members")
      .update({
        equipped_weapon_id: null,
        equipped_weapon_inventory_id: null,
        equipped_weapon_name: null,
        equipped_weapon_image_url: null,
        equipped_weapon_rarity: null,
        equipped_weapon_level: 0,
        equipped_weapon_last_enhanced_on: null,
      })
      .eq("id", character.id);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    await fetchCharacters();
  };

  const enhanceEquippedWeapon = async (character: any) => {
    if (!user?.id) return showToast("로그인 후 사용 가능합니다.", "error");
    if (!character?.equipped_weapon_name) return showToast("먼저 장착한 무기가 있어야 해.");
    const currentLevel = normalizeEnhancementLevel(character?.equipped_weapon_level);
    if (currentLevel >= ENHANCEMENT_MAX_LEVEL) {
      showToast("이미 최대 강화 단계야.");
      return;
    }

    const inventoryWeapon =
      ownedWeapons.find((item: any) => String(item.inventory_id || item.id || "") === String(character.equipped_weapon_inventory_id || "")) ||
      ownedWeapons.find((item: any) => String(item.weapon_id || item.id || "") === String(character.equipped_weapon_id || ""));

    if (!inventoryWeapon) {
      showToast("장착 무기 인벤토리 정보를 찾지 못했어. 무기를 다시 장착한 뒤 시도해줘.");
      return;
    }

    const today = getTodayKey();
    const attemptsUsed = enhancementAttemptState.usedDate === today ? Number(enhancementAttemptState.usedToday || 0) : 0;
    const dailyLimit = getNakwonDailyEnhanceLimit(profile?.nakwon_level);

    if (attemptsUsed >= dailyLimit) {
      showToast(`오늘 사용 가능한 계정 전체 강화 시도권을 모두 썼어. (${attemptsUsed}/${dailyLimit})`);
      return;
    }

    if (myPoint < 1) {
      showToast("강화에는 1포인트가 필요해.");
      return;
    }

    const availableStone = ownedEnhanceItems
      .filter((item: any) => item.item_type !== "enhance_protect_ticket" && Number(item.quantity || 0) > 0)
      .sort((a: any, b: any) => Number(b.bonus_rate || 0) - Number(a.bonus_rate || 0))[0] || null;

    const availableProtection = ownedEnhanceItems
      .filter((item: any) => item.item_type === "enhance_protect_ticket" && Number(item.quantity || 0) > 0)
      .sort((a: any, b: any) => Number(b.quantity || 0) - Number(a.quantity || 0))[0] || null;

    const bonusRate = Number(availableStone?.bonus_rate || 0);
    const successRate = getEnhancementSuccessRate(currentLevel, bonusRate);
    const destroyRate = getEnhancementDestroyRate(currentLevel);
    const fallbackLevel = getEnhancementDestroyFallbackLevel(currentLevel);
    const confirmLines = [
      `${character.character_name}의 ${character.equipped_weapon_name}을(를) 강화할까요?`,
      `현재 단계: ${getEnhancementDisplay(currentLevel)} / 최대 ${ENHANCEMENT_MAX_LEVEL}강`,
      `기본 비용: 1P`,
      `오늘 시도권: ${attemptsUsed}/${dailyLimit} 사용`,
      availableStone
        ? `사용 강화석: ${availableStone.item_name || availableStone.title || "강화석"} (${getEnhancementItemEffectText(availableStone)})`
        : "사용 강화석: 없음",
      destroyRate > 0
        ? `파손 확률: ${destroyRate}% (파손 시 ${getEnhancementDisplay(fallbackLevel)}로 하락)`
        : "파손 확률: 없음",
      availableProtection
        ? `파괴방지권: ${availableProtection.item_name || availableProtection.title || "파괴방지권"} x${availableProtection.quantity} (자동 사용)`
        : "파괴방지권: 없음",
      `최종 성공 확률: ${successRate}%`,
    ];

    if (!confirm(confirmLines.join("\n"))) return;

    const client = getSupabaseOrThrow();
    setEnhancingCharacterId(String(character.id));

    const nextPoint = Math.max(0, myPoint - 1);
    const { error: pointError } = await client.from("profiles").update({ points: nextPoint }).eq("id", user.id);
    if (pointError) {
      setEnhancingCharacterId(null);
      showToast(pointError.message, "error");
      return;
    }

    if (availableStone) {
      const nextQuantity = Math.max(0, Number(availableStone.quantity || 0) - 1);
      const { error: stoneError } = await client
        .from("user_owned_enhance_items")
        .update({ quantity: nextQuantity })
        .eq("id", availableStone.id)
        .eq("user_id", user.id);

      if (stoneError) {
        setEnhancingCharacterId(null);
        showToast(stoneError.message, "error");
        return;
      }
    }

    const isSuccess = Math.random() * 100 < successRate;
    const isDestroyed = !isSuccess && destroyRate > 0 && Math.random() * 100 < destroyRate;
    const protectionUsed = Boolean(isDestroyed && availableProtection);
    const nextLevel = isSuccess
      ? Math.min(ENHANCEMENT_MAX_LEVEL, currentLevel + 1)
      : isDestroyed && !protectionUsed
      ? fallbackLevel
      : currentLevel;

    if (protectionUsed && availableProtection) {
      const nextProtectionQuantity = Math.max(0, Number(availableProtection.quantity || 0) - 1);
      const { error: protectionError } = await client
        .from("user_owned_enhance_items")
        .update({ quantity: nextProtectionQuantity })
        .eq("id", availableProtection.id)
        .eq("user_id", user.id);

      if (protectionError) {
        setEnhancingCharacterId(null);
        showToast(protectionError.message, "error");
        return;
      }
    }

    const { error: weaponError } = await client
      .from("user_owned_weapons")
      .update({
        enhancement_level: nextLevel,
        last_enhanced_on: today,
      })
      .eq("id", inventoryWeapon.inventory_id || inventoryWeapon.id)
      .eq("user_id", user.id);

    if (weaponError) {
      setEnhancingCharacterId(null);
      showToast(`${weaponError.message}\n\n강화 컬럼 SQL을 먼저 적용해줘.`, "error");
      return;
    }

    const { error: characterError } = await client
      .from("guild_members")
      .update({
        equipped_weapon_inventory_id: inventoryWeapon.inventory_id || inventoryWeapon.id,
        equipped_weapon_level: nextLevel,
        equipped_weapon_last_enhanced_on: today,
      })
      .eq("id", character.id);

    if (characterError) {
      setEnhancingCharacterId(null);
      showToast(`${characterError.message}\n\n길드 캐릭터 무기 강화 컬럼 SQL을 먼저 적용해줘.`, "error");
      return;
    }

    const nextAttemptsUsed = attemptsUsed + 1;
    const { error: attemptsError } = await client
      .from("profiles")
      .update({
        enhance_attempts_used_today: nextAttemptsUsed,
        enhance_attempts_used_date: today,
      })
      .eq("id", user.id);

    setEnhancingCharacterId(null);

    if (attemptsError) {
      showToast(`${attemptsError.message}\n\n낙원력/계정 시도권 SQL을 먼저 적용해줘.`, "error");
      return;
    }

    setMyPoint(nextPoint);
    setEnhancementAttemptState({
      usedToday: nextAttemptsUsed,
      usedDate: today,
    });

    await Promise.all([fetchCharacters(), fetchOwnedWeapons(), fetchOwnedEnhanceItems(), fetchMyPoint(), fetchProfile(user.id)]);

    if (isSuccess) {
      showToast(`강화 성공! ${character.equipped_weapon_name} ${getEnhancementDisplay(currentLevel)} → ${getEnhancementDisplay(nextLevel)}`);
      return;
    }

    if (isDestroyed && protectionUsed) {
      showToast(`강화 실패! 파손 판정이 있었지만 파괴방지권이 자동으로 사용되어 ${getEnhancementDisplay(currentLevel)} 상태를 지켰어.`, "error");
      return;
    }

    if (isDestroyed) {
      showToast(`강화 실패! 무기가 파손되어 ${getEnhancementDisplay(currentLevel)} → ${getEnhancementDisplay(nextLevel)} 로 하락했어.`, "error");
      return;
    }

    showToast(`강화 실패. 하지만 ${character.equipped_weapon_name}의 강화 수치는 ${getEnhancementDisplay(currentLevel)}로 유지됐어.`, "error");
  };

  const deleteCharacter = async (id: string) => {
    if (!confirm("캐릭터 삭제할까요?")) return;
    const { error } = await supabase.from("guild_members").delete().eq("id", id);
    if (!error) fetchCharacters();
  };

  const deleteOwnedBadge = async (badge: any) => {
    const badgeRowId = badge.id ? String(badge.id) : "";
    const badgeItemId = String(badge.badge_item_id || badge.shop_item_id || badge.item_id || badge.badge_id || "");
    const badgeCode = String(badge.badge_code || "");
    const badgeLabel = String(badge.badge_label || badge.badge_name || badge.name || badge.title || "");

    if (!badgeRowId && !badgeItemId && !badgeCode && !badgeLabel) {
      showToast("삭제할 뱃지 정보를 찾지 못했어.", "error");
      return;
    }

    if (badgeItemId && usedBadgeIds.has(badgeItemId)) {
      showToast("이 뱃지는 현재 캐릭터가 착용 중이야. 먼저 장착 해제 후 삭제해줘.", "error");
      return;
    }

    if (!confirm(`정말 "${badge.badge_name || badge.badge_label || "뱃지"}" 뱃지를 삭제할까요? 삭제 후 복구되지 않을 수 있어요.`)) return;

    const client = getSupabaseOrThrow();

    const deleteAttempts: Array<{ label: string; run: () => Promise<{ data: any[] | null; error: any }> }> = [];

    if (badgeRowId) {
      deleteAttempts.push({
        label: "id",
        run: async () => {
          const { data, error } = await client
            .from("user_badges")
            .delete()
            .eq("user_id", user.id)
            .eq("id", badgeRowId)
            .select("id");
          return { data, error };
        },
      });
    }

    if (badgeItemId) {
      deleteAttempts.push({
        label: "badge_item_id",
        run: async () => {
          const { data, error } = await client
            .from("user_badges")
            .delete()
            .eq("user_id", user.id)
            .eq("badge_item_id", badgeItemId)
            .select("id");
          return { data, error };
        },
      });
    }

    if (badgeCode) {
      deleteAttempts.push({
        label: "badge_code",
        run: async () => {
          const { data, error } = await client
            .from("user_badges")
            .delete()
            .eq("user_id", user.id)
            .eq("badge_code", badgeCode)
            .select("id");
          return { data, error };
        },
      });
    }

    if (badgeLabel) {
      deleteAttempts.push({
        label: "badge_label",
        run: async () => {
          const { data, error } = await client
            .from("user_badges")
            .delete()
            .eq("user_id", user.id)
            .eq("badge_label", badgeLabel)
            .select("id");
          return { data, error };
        },
      });
    }

    const errors: string[] = [];
    let deletedCount = 0;

    for (const attempt of deleteAttempts) {
      const { data, error } = await attempt.run();

      if (error) {
        errors.push(`${attempt.label}: ${error.message}`);
        continue;
      }

      deletedCount += Array.isArray(data) ? data.length : 0;
    }

    const hardDeletedIds = new Set<string>();
    const hardDeletedItemIds = new Set<string>();
    const hardDeletedCodes = new Set<string>();
    const hardDeletedLabels = new Set<string>();

    if (badgeRowId) hardDeletedIds.add(badgeRowId);
    if (badgeItemId) hardDeletedItemIds.add(badgeItemId);
    if (badgeCode) hardDeletedCodes.add(badgeCode);
    if (badgeLabel) hardDeletedLabels.add(badgeLabel);

    const filterDeletedBadges = (items: any[]) =>
      items.filter((item: any) => {
        const itemRowId = String(item.id || "");
        const itemBadgeItemId = String(item.badge_item_id || item.shop_item_id || item.item_id || item.badge_id || "");
        const itemBadgeCode = String(item.badge_code || "");
        const itemBadgeLabel = String(item.badge_label || item.badge_name || item.name || item.title || "");

        return !(
          (itemRowId && hardDeletedIds.has(itemRowId)) ||
          (itemBadgeItemId && hardDeletedItemIds.has(itemBadgeItemId)) ||
          (itemBadgeCode && hardDeletedCodes.has(itemBadgeCode)) ||
          (itemBadgeLabel && hardDeletedLabels.has(itemBadgeLabel))
        );
      });

    if (errors.length > 0 && deletedCount === 0 && errors.every((message) => !message.includes("does not exist") && !message.includes("schema cache"))) {
      setOwnedBadges((prev) => filterDeletedBadges(prev));
      showToast(`뱃지 삭제 실패: ${errors.join(" / ")}`, "error");
      return;
    }

    setOwnedBadges((prev) => filterDeletedBadges(prev));
    await fetchOwnedBadges();

    showToast(deletedCount > 0 ? "뱃지를 삭제했어." : "이미 DB에서 삭제된 뱃지라 화면 목록만 정리했어.", "success");
  };

  const saveCharacter = async () => {
    if (!characterName.trim() || !className.trim()) {
      showToast("캐릭터명과 직업을 입력해줘.");
      return;
    }

    let imageUrl = null;

    try {
      if (imageFile) {
        imageUrl = await uploadGuildImage(imageFile, user.id);
      }
    } catch (error: any) {
      console.error("image upload error:", error);
      showToast(`이미지 업로드 실패: ${error?.message || "storage 정책을 확인해줘."}`, "error");
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
      showToast("캐릭터 추가 완료", "success");
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
      showToast(error.message, "error");
    }
  };


  const buildCharacterDraft = (item: any) => ({
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
  });

  const openCharacterEditModal = (id: string) => {
    setCharacters((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, draft: buildCharacterDraft(item), isEditing: false }
          : item
      )
    );
    setEditingCharacterId(id);
  };

  const toggleEditing = (id: string, next: boolean) => {
    setCharacters((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isEditing: next,
              draft: next ? buildCharacterDraft(item) : item.draft,
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
      showToast(`수정 이미지 업로드 실패: ${error?.message || "storage 정책을 확인해줘."}`, "error");
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
    if (error) return showToast(error.message, "error");

    showToast("캐릭터 수정 완료", "success");
    fetchCharacters();
  };


  const editingCharacter = characters.find((item: any) => item.id === editingCharacterId) || null;

  if (!user || !profile) return null;

  return (
    <div className="max-w-6xl mx-auto py-24 px-6">
      <h2 className="text-4xl font-semibold mb-10">My Room</h2>

      <div className="bg-white/5 p-10 rounded-3xl space-y-6">
        <div className="grid md:grid-cols-5 gap-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400 font-semibold">닉네임</div>
            <div className="mt-3 text-2xl font-semibold" style={getNicknameEffectStyle(profile)}>
              {profile.nickname || "-"}
            </div>
          </div>
          <InfoMiniCard title="포인트" value={`${myPoint || profile.points || 0}`} />
          <InfoMiniCard title="낙원력" value={`Lv.${nakwonLevel}`} />
          <InfoMiniCard title="오늘 강화권" value={`${remainingEnhanceAttempts}/${dailyEnhanceLimit}`} />
          <InfoMiniCard title="보유 뱃지" value={`${ownedBadges.length}개`} />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["growth", "낙원력/성장"],
            ["characters", "캐릭터/장비"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMyRoomTab(key as "growth" | "characters")}
              className={cn(
                "px-4 py-2 rounded-full border text-sm font-semibold transition",
                myRoomTab === key ? "bg-amber-500 border-amber-400 text-white" : "bg-white/5 border-white/10 text-slate-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {myRoomTab === "growth" && (
          <div className="grid xl:grid-cols-[1.05fr,0.95fr] gap-4">
            <div className="rounded-[2rem] border border-amber-300/20 bg-gradient-to-br from-amber-400/10 via-black/30 to-transparent p-5">
              <div className="text-[10px] uppercase tracking-[0.24em] font-semibold text-amber-200">Nakwon Level</div>
              <div className="mt-2 text-2xl font-semibold">낙원력 제단</div>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-4xl font-semibold text-white">Lv.{nakwonLevel}</div>
                  <div className="mt-1 text-sm text-slate-400">누적 주입 {nakwonTotalSpent}P · 오늘 강화권 {dailyEnhanceLimit}회</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-right">
                  <div className="text-xs text-slate-500">다음 레벨까지</div>
                  <div className="text-lg font-semibold text-amber-200">{nakwonExp} / {nakwonRequiredExp} EXP</div>
                </div>
              </div>
              <div className="mt-4 h-3 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-amber-300" style={{ width: `${nakwonProgressPercent}%` }} />
              </div>
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                <MiniStat label="일일 강화 시도권" value={`${dailyEnhanceLimit}회`} />
                <MiniStat label="남은 시도권" value={`${remainingEnhanceAttempts}회`} />
                <MiniStat label="파괴방지권" value={`${protectionTicketCount}개`} />
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold">포인트를 낙원 경험치로 주입</div>
                <div className="mt-2 text-xs text-slate-400">1P = 1EXP · 낙원력이 오를수록 계정 전체 일일 강화 시도권이 증가해.</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[50, 100, 300, 500].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => void handleNakwonInfuse(amount)}
                      disabled={nakwonSubmitting}
                      className="px-4 py-2 rounded-xl border border-amber-200/30 bg-amber-400/10 text-amber-100 text-sm font-semibold"
                    >
                      {amount}P 주입
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    value={nakwonSpendAmount}
                    onChange={(e) => setNakwonSpendAmount(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="직접 입력"
                    className="flex-1 min-w-[160px] bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => void handleNakwonInfuse()}
                    disabled={nakwonSubmitting}
                    className="px-5 py-3 rounded-xl bg-amber-400 text-white font-semibold"
                  >
                    {nakwonSubmitting ? "주입 중..." : "직접 주입"}
                  </button>
                </div>
              </div>
            </div>

          <div className="rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-black/30 to-transparent p-5">
            <div className="text-[10px] uppercase tracking-[0.24em] font-semibold text-amber-200">Hourly Point Engine</div>
            <div className="mt-2 text-2xl font-semibold">자동 포인트 현황</div>
            {bestPointCharacter ? (
              <>
                <div className="mt-3 text-sm text-slate-300">
                  기준 캐릭터 <span className="font-semibold text-white">{bestPointCharacter.character_name}</span> · {bestPointCharacter.equipped_weapon_name} {getEnhancementDisplay(bestPointCharacter.equipped_weapon_level)}
                </div>
                <div className="mt-4 grid md:grid-cols-3 gap-3">
                  <MiniStat label={`${pointRateSettings.cycle_minutes}분마다`} value={`${pointPerTick}P`} />
                  <MiniStat label="다음 지급까지" value={getNextPointTickInfo(passivePointState.lastTickAt, pointRateSettings.cycle_minutes).formatted} />
                  <MiniStat label="5강 보너스" value={`+${Math.floor(normalizeEnhancementLevel(bestPointCharacter.equipped_weapon_level) / 5) * Number(pointRateSettings.enhancement_bonus_per_5 || 0)}P`} />
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  {WEAPON_RARITY_THEMES[normalizeWeaponRarity(bestPointCharacter.equipped_weapon_rarity)].label} 기본 {pointRateSettings.rate_by_rarity[normalizeWeaponRarity(bestPointCharacter.equipped_weapon_rarity)]}P + 강화 보너스 적용 · 시간당 예상 {bestPointCharacter.hourly_point_rate}P
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  오늘 누적 {passivePointState.passivePointsDate === getTodayKey() ? passivePointState.passivePointsToday : 0}P / 일일 최대 {pointRateSettings.daily_cap}P
                </div>
              </>
            ) : (
              <div className="mt-3 text-sm text-slate-500">장착 무기가 있는 캐릭터가 있어야 시간당 포인트가 계산돼.</div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
            <div className="text-[10px] uppercase tracking-[0.24em] font-semibold text-amber-200">Nickname FX</div>
            <div className="mt-2 text-2xl font-semibold">닉네임 꾸미기</div>
            <div className="mt-3 text-3xl font-semibold" style={getNicknameEffectStyle(profile)}>
              {profile.nickname || "Guild Member"}
            </div>
            <div className="mt-4 space-y-3 max-h-[220px] overflow-y-auto pr-1">
              <button onClick={clearNicknameEffect} className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-sm font-semibold">
                기본 닉네임으로 되돌리기
              </button>
              {ownedNicknameEffects.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-500">
                  아직 보유한 닉네임 효과가 없어. 포인트샵 닉네임 탭에서 구매해줘.
                </div>
              )}
              {ownedNicknameEffects.map((effect: any) => (
                <button key={effect.id} onClick={() => equipNicknameEffect(effect)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-left">
                  <div className="text-lg font-semibold" style={getNicknameEffectStyle(effect)}>{effect.title || "닉네임 이펙트"}</div>
                  <div className="mt-1 text-xs text-slate-400">보유 수량 {Number(effect.quantity || 1)}개 · 클릭하면 즉시 적용</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        )}

        {myRoomTab === "growth" && (
        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] font-semibold text-amber-200">Point Earn Logs</div>
              <div className="mt-2 text-2xl font-semibold">포인트 획득 로그</div>
            </div>
            <button onClick={() => void fetchPointEarnLogs()} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold">
              새로고침
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {pointEarnLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-500">
                아직 기록된 포인트 획득 로그가 없어. 1시간 주기가 지나면 여기 바로 쌓여.
              </div>
            ) : (
              pointEarnLogs.map((log: any) => (
                <div key={log.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-white">{log.title || "포인트 획득"}</div>
                      <div className="mt-1 text-sm text-slate-400">{log.description || "포인트가 지급됐어."}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-amber-200">+{Number(log.points || 0)}P</div>
                      <div className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString("ko-KR")}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        )}

        {myRoomTab === "characters" && (
          <>
        <div className="flex flex-wrap gap-3 items-center">
          <button onClick={handleAttendance} className="bg-green-600 px-5 py-3 rounded-xl font-semibold">
            출석 체크 (+10P)
          </button>
          <button
            onClick={() => setShowRegister(true)}
            className="bg-amber-500 px-5 py-3 rounded-xl font-semibold"
          >
            캐릭터 등록
          </button>
          {rankIcon && <img src={rankIcon} className="w-20 h-20 object-contain" />}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-xl font-semibold">보유 뱃지 관리</div>
              <div className="text-sm text-slate-400">착용 중이 아닌 뱃지는 여기서 삭제할 수 있어.</div>
            </div>
          </div>

          {ownedBadges.length === 0 ? (
            <div className="text-sm text-slate-500">보유한 뱃지가 없습니다.</div>
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
                        <div className="font-semibold">{badge.badge_name}</div>
                        <div className="text-xs mt-1" style={{ color: theme.chipText }}>
                          {theme.label}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteOwnedBadge(badge)}
                        disabled={isUsed}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-semibold transition",
                          isUsed ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-red-500/85 hover:bg-red-500 text-white"
                        )}
                      >
                        삭제
                      </button>
                    </div>
                    <div className="mt-3 text-xs text-slate-300">
                      {isUsed ? "현재 캐릭터가 착용 중인 뱃지" : "미착용 뱃지 · 삭제 가능"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5 mt-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-xl font-semibold">보유 무기 파츠</div>
              <div className="text-sm text-slate-400">뽑기로 획득한 무기는 아래에서 확인하고 각 캐릭터에 장착할 수 있어.</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/5 text-sm font-semibold text-slate-300">
              {ownedWeapons.length}개 보유
            </div>
          </div>

          {ownedWeapons.length === 0 ? (
            <div className="text-sm text-slate-500">아직 보유한 무기 파츠가 없습니다. 포인트샵 무기 뽑기에서 획득해봐.</div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {ownedWeapons.map((weapon: any) => {
                const theme = getWeaponTheme(weapon);
                return (
                  <div
                    key={`${weapon.weapon_id || weapon.id}-${weapon.created_at || weapon.name}`}
                    className="rounded-2xl border p-4 bg-black/25"
                    style={{ borderColor: theme.border, boxShadow: `0 0 18px ${theme.glow}` }}
                  >
                    <div className="flex items-start gap-3">
                      <WeaponImage weapon={weapon} className="h-14 w-14 rounded-2xl" />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{weapon.name}</div>
                        <div className="mt-1 inline-flex px-2 py-1 rounded-full text-[10px] font-semibold border" style={{ color: theme.text, borderColor: theme.border, background: theme.background }}>
                          {theme.label}
                        </div>
                        <div className="mt-2 text-xs text-slate-400 line-clamp-2">
                          {weapon.description || "길드탭 캐릭터 카드에 표시되는 장비 파츠"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {characters.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-slate-400">
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
                      <div className="text-sm text-slate-400">{character.class_name}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {getCharacterBadges(character).length > 0 ? (
                        getCharacterBadges(character).map((badge: any, index: number) => {
                          const badgeTheme = getBadgeVisualTheme(badge);
                          return (
                          <span
                            key={`${badge.badge_item_id}-${index}`}
                            className="px-3 py-1 rounded-full text-xs font-semibold"
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


                  <div className="mt-4 text-sm text-slate-300 whitespace-pre-wrap">
                    {character.character_intro || "소개 문구를 넣어 캐릭터를 꾸밀 수 있어."}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <button
                      type="button"
                      onClick={() => toggleWeaponPanel(character.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-slate-400 uppercase tracking-widest">장비 파츠 [무기]</div>
                            <span className="inline-flex px-2 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-slate-300">
                              {ownedWeapons.length}개 보유
                            </span>
                          </div>

                          {character.equipped_weapon_name ? (
                            <div className="mt-2 flex items-center gap-3 min-w-0">
                              <WeaponImage weapon={{ image_url: character.equipped_weapon_image_url, rarity: character.equipped_weapon_rarity }} className="h-12 w-12 rounded-2xl shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="font-semibold truncate">{character.equipped_weapon_name}</div>
                                  <span className="inline-flex px-2 py-1 rounded-full border border-amber-200/30 bg-amber-400/10 text-[10px] font-semibold text-amber-100 shrink-0">
                                    {getEnhancementDisplay(character.equipped_weapon_level)}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400">
                                  현재 장착 중 · {getWeaponTheme({ rarity: character.equipped_weapon_rarity }).label}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-sm text-slate-500">아직 장착한 무기가 없습니다.</div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {character.equipped_weapon_name && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearWeaponFromCharacter(character);
                              }}
                              className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white"
                            >
                              무기 해제
                            </button>
                          )}
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-transform",
                              expandedWeaponPanels[character.id] ? "rotate-90" : "rotate-0"
                            )}
                          >
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>
                    </button>

                    {!expandedWeaponPanels[character.id] && ownedWeapons.length > 0 && (
                      <div className="mt-3 text-xs text-slate-500">
                        눌러서 보유 무기 목록을 펼치고 장착하거나, 현재 무기를 하루 1회 강화할 수 있어. 현재 보유 포인트 {myPoint}P · 강화석 {ownedEnhanceItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)}개
                      </div>
                    )}

                    <AnimatePresence initial={false}>
                      {expandedWeaponPanels[character.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {character.equipped_weapon_name && (
                            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-[10px] uppercase tracking-[0.24em] text-amber-100/80 font-semibold">Weapon Enhance</div>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className="text-lg font-semibold">{character.equipped_weapon_name}</span>
                                    <span className="inline-flex px-2.5 py-1 rounded-full border border-amber-200/30 bg-black/20 text-xs font-semibold text-amber-50">
                                      {getEnhancementDisplay(character.equipped_weapon_level)}
                                    </span>
                                  </div>
                                  <div className="mt-2 text-sm text-amber-100/80">
                                    성공 확률 {getEnhancementSuccessRate(character.equipped_weapon_level, (ownedEnhanceItems.filter((item: any) => Number(item.quantity || 0) > 0).sort((a: any, b: any) => Number(b.bonus_rate || 0) - Number(a.bonus_rate || 0))[0]?.bonus_rate) || 0)}%
                                    {ownedEnhanceItems.some((item: any) => Number(item.quantity || 0) > 0) && ` · 최고 강화석 자동 사용 (${getEnhancementItemEffectText(ownedEnhanceItems.filter((item: any) => Number(item.quantity || 0) > 0).sort((a: any, b: any) => Number(b.bonus_rate || 0) - Number(a.bonus_rate || 0))[0])})`}
                                  </div>
                                  <div className="mt-1 text-xs text-amber-50/60">
                                    계정 전체 일일 강화 시도권 {remainingEnhanceAttempts}/{dailyEnhanceLimit} · 1회 시도당 1P 소모 · 최대 {ENHANCEMENT_MAX_LEVEL}강
                                  </div>
                                  {getEnhancementDestroyRate(character.equipped_weapon_level) > 0 && (
                                    <div className="mt-2 text-xs text-rose-200">
                                      현재 단계 파손 확률 {getEnhancementDestroyRate(character.equipped_weapon_level)}% · 방지권 보유 {protectionTicketCount}개
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => enhanceEquippedWeapon(character)}
                                  disabled={
                                    enhancingCharacterId === String(character.id) ||
                                    normalizeEnhancementLevel(character.equipped_weapon_level) >= ENHANCEMENT_MAX_LEVEL ||
                                    remainingEnhanceAttempts <= 0
                                  }
                                  className={cn(
                                    "px-4 py-3 rounded-xl text-sm font-semibold transition whitespace-nowrap",
                                    enhancingCharacterId === String(character.id) ||
                                      normalizeEnhancementLevel(character.equipped_weapon_level) >= ENHANCEMENT_MAX_LEVEL ||
                                      remainingEnhanceAttempts <= 0
                                      ? "bg-slate-700 text-slate-300"
                                      : "bg-amber-400 text-white hover:bg-amber-300"
                                  )}
                                >
                                  {enhancingCharacterId === String(character.id) ? "강화 중..." : "강화 시도"}
                                </button>
                              </div>

                              {ownedEnhanceItems.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {ownedEnhanceItems
                                    .filter((item: any) => Number(item.quantity || 0) > 0)
                                    .sort((a: any, b: any) => Number(b.bonus_rate || 0) - Number(a.bonus_rate || 0))
                                    .map((item: any) => (
                                      <div key={item.id} className="px-3 py-2 rounded-xl border border-white/10 bg-black/20 text-xs">
                                        <span className="font-semibold text-white">{item.item_name || item.title || (item.item_type === "enhance_protect_ticket" ? "파괴방지권" : "강화석")}</span>
                                        <span className="text-amber-100 ml-2">
                                          {item.item_type === "enhance_protect_ticket" ? "파손 자동 방지" : getEnhancementItemEffectText(item)}
                                        </span>
                                        <span className="text-slate-400 ml-2">x{item.quantity}</span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {ownedWeapons.length === 0 ? (
                              <div className="text-sm text-slate-500 md:col-span-2 xl:col-span-3">보유한 무기 파츠가 없습니다.</div>
                            ) : (
                              ownedWeapons.map((weapon: any) => {
                                const theme = getWeaponTheme(weapon);
                                const isEquipped =
                                  String(character.equipped_weapon_inventory_id || "") === String(weapon.inventory_id || weapon.id || "") ||
                                  String(character.equipped_weapon_id || "") === String(weapon.weapon_id || weapon.id || "");
                                return (
                                  <div
                                    key={`${character.id}-${weapon.inventory_id || weapon.weapon_id || weapon.id}-${weapon.created_at || weapon.name}`}
                                    className="rounded-2xl border p-3 bg-black/20"
                                    style={{ borderColor: isEquipped ? theme.border : "rgba(255,255,255,0.08)", boxShadow: isEquipped ? `0 0 20px ${theme.glow}` : "none" }}
                                  >
                                    <div className="flex items-start gap-3">
                                      <WeaponImage weapon={weapon} className="h-12 w-12 rounded-2xl shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className="font-semibold truncate">{weapon.name}</div>
                                          <span className="inline-flex px-2 py-1 rounded-full border border-amber-200/30 bg-amber-400/10 text-[10px] font-semibold text-amber-100 shrink-0">
                                            {getEnhancementDisplay(weapon.enhancement_level)}
                                          </span>
                                        </div>
                                        <div className="text-[11px] mt-1 inline-flex px-2 py-1 rounded-full border" style={{ color: theme.text, borderColor: theme.border, background: theme.background }}>
                                          {theme.label}
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400 line-clamp-2">
                                          {weapon.description || "길드탭 캐릭터 카드 장착 파츠"}
                                        </div>
                                        <button
                                          onClick={() => equipWeaponToCharacter(character, weapon)}
                                          className={cn(
                                            "mt-3 w-full px-3 py-2 rounded-xl text-xs font-semibold transition",
                                            isEquipped ? "bg-amber-500 text-white" : "bg-amber-500 hover:bg-amber-400 text-white"
                                          )}
                                        >
                                          {isEquipped ? "장착 중" : "이 무기 장착"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openCharacterEditModal(character.id)}
                      className="bg-amber-500 px-4 py-2 rounded-xl text-sm font-semibold"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deleteCharacter(character.id)}
                      className="bg-red-500 px-4 py-2 rounded-xl text-sm font-semibold"
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
                      <div className="text-xs text-slate-400 mb-3">착용 뱃지 (복수 선택 가능)</div>
                      <div className="flex flex-wrap gap-2">
                        {ownedBadges.length === 0 && (
                          <div className="text-sm text-slate-500">보유한 뱃지가 없습니다.</div>
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
                                className="text-xs font-semibold"
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
                    <div className="text-xs text-slate-400 mb-3">캐릭터 이미지 수정</div>
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
                      className="w-full text-sm text-slate-400"
                    />
                    {(character.draft.image_preview_url || character.draft.avatar_url || character.avatar_url) && (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                        <div className="text-xs text-slate-400 mb-2">현재/새 미리보기</div>
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
                        className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-semibold"
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
                        className="px-3 py-2 rounded-xl bg-slate-700 text-xs font-semibold"
                      >
                        원래 이미지로 복원
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400">캐릭터 테마색</label>
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
                      className="bg-amber-400 px-4 py-3 rounded-xl font-semibold"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => toggleEditing(character.id, false)}
                      className="bg-slate-700 px-4 py-3 rounded-xl font-semibold"
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
          </>
        )}
      </div>
      <AnimatePresence>
        {showRegister && (
          <ModalFrame
            onClose={() => {
              setShowRegister(false);
              setImageFile(null);
            }}
          >
            <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/94 shadow-[0_30px_100px_rgba(2,6,23,0.58)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,197,92,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_46%)]" />
              <div className="relative border-b border-white/10 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200">Character Create</div>
                    <div className="mt-2 text-2xl font-semibold text-white">캐릭터 등록</div>
                    <div className="mt-2 text-sm text-slate-400">새 캐릭터 정보를 입력하고 마이룸에 추가해.</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowRegister(false);
                      setImageFile(null);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.08] hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="relative space-y-5 px-6 py-6">
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
                <div className="space-y-3">
                  <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">역할</label>
                  <select
                    value={roleHint}
                    onChange={(e) => setRoleHint(e.target.value)}
                    className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none transition-all focus:border-amber-200/25 focus:bg-amber-300/[0.04]"
                  >
                    <option value="딜러">딜러</option>
                    <option value="서포터">서포터</option>
                  </select>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">캐릭터 이미지</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="mt-3 w-full text-sm text-slate-400"
                  />
                  {imageFile && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="mb-2 text-xs text-slate-400">미리보기</div>
                      <img src={URL.createObjectURL(imageFile)} className="h-44 w-full max-w-xs rounded-xl object-cover" />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => {
                      setShowRegister(false);
                      setImageFile(null);
                    }}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                  >
                    취소
                  </button>
                  <button
                    onClick={saveCharacter}
                    className="rounded-[1.35rem] bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition-all hover:brightness-110"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </ModalFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingCharacter && editingCharacter.draft && (
          <ModalFrame
            onClose={() => {
              setEditingCharacterId(null);
              fetchCharacters();
            }}
          >
            <div className="relative w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/94 shadow-[0_30px_100px_rgba(2,6,23,0.58)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,197,92,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_46%)]" />
              <div className="relative border-b border-white/10 px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200">Character Edit</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{editingCharacter.character_name}</div>
                    <div className="mt-2 text-sm text-slate-400">캐릭터 정보, 이미지, 뱃지 장착을 이 창에서 수정할 수 있어.</div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingCharacterId(null);
                      fetchCharacters();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:border-amber-200/20 hover:bg-amber-300/[0.08] hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="relative space-y-5 px-6 py-6">
                <div className="grid md:grid-cols-2 gap-3">
                  <AdminInput label="캐릭터명" value={editingCharacter.draft.character_name} onChange={(v: any) => updateDraft(editingCharacter.id, "character_name", v)} />
                  <AdminInput label="직업" value={editingCharacter.draft.class_name} onChange={(v: any) => updateDraft(editingCharacter.id, "class_name", v)} />
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <AdminInput label="아이템레벨" value={String(editingCharacter.draft.item_level || "")} onChange={(v: any) => updateDraft(editingCharacter.id, "item_level", v)} />
                  <AdminInput label="캐릭터 레벨" value={String(editingCharacter.draft.character_level || "")} onChange={(v: any) => updateDraft(editingCharacter.id, "character_level", v)} />
                  <AdminInput label="전투력" value={String(editingCharacter.draft.combat_power || "")} onChange={(v: any) => updateDraft(editingCharacter.id, "combat_power", v)} />
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-3">
                    <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-500">역할</label>
                    <select
                      value={editingCharacter.draft.role_hint}
                      onChange={(e) => updateDraft(editingCharacter.id, "role_hint", e.target.value)}
                      className="w-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-white outline-none transition-all focus:border-amber-200/25 focus:bg-amber-300/[0.04]"
                    >
                      <option value="딜러">딜러</option>
                      <option value="서포터">서포터</option>
                    </select>
                  </div>
                  <AdminInput label="생일" type="date" value={editingCharacter.draft.birthday || ""} onChange={(v: any) => updateDraft(editingCharacter.id, "birthday", v)} />
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <AdminInput label="MBTI" value={editingCharacter.draft.mbti || ""} onChange={(v: any) => updateDraft(editingCharacter.id, "mbti", String(v || "").toUpperCase().slice(0, 4))} placeholder="예: ENFJ" />
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">착용 뱃지</div>
                    <div className="flex flex-wrap gap-2">
                      {ownedBadges.length === 0 && (
                        <div className="text-sm text-slate-500">보유한 뱃지가 없습니다.</div>
                      )}
                      {ownedBadges.map((badge) => {
                        const checked = (editingCharacter.draft.equipped_badge_ids || []).includes(String(badge.badge_item_id));
                        return (
                          <label
                            key={badge.badge_item_id}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2"
                            style={{
                              borderColor: checked ? badge.badge_color || "#8b5cf6" : "rgba(255,255,255,0.08)",
                              backgroundColor: checked ? `${badge.badge_color || "#8b5cf6"}22` : "rgba(255,255,255,0.03)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = new Set(editingCharacter.draft.equipped_badge_ids || []);
                                if (e.target.checked) next.add(String(badge.badge_item_id));
                                else next.delete(String(badge.badge_item_id));
                                updateDraft(editingCharacter.id, "equipped_badge_ids", Array.from(next));
                              }}
                            />
                            <span className="text-xs font-semibold" style={{ color: badge.badge_color || "#c4b5fd" }}>
                              {badge.badge_name}
                              {normalizeBadgeEffectKey(badge.badge_card_effect) !== "none" ? ` · ${getBadgeVisualTheme(badge).label}` : ""}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">캐릭터 이미지 수정</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      updateDraft(editingCharacter.id, "new_image_file", file);
                      updateDraft(
                        editingCharacter.id,
                        "image_preview_url",
                        createPreviewUrl(file, editingCharacter.draft.avatar_url || editingCharacter.avatar_url || "")
                      );
                    }}
                    className="w-full text-sm text-slate-400"
                  />
                  {(editingCharacter.draft.image_preview_url || editingCharacter.draft.avatar_url || editingCharacter.avatar_url) && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="mb-2 text-xs text-slate-400">미리보기</div>
                      <img
                        src={editingCharacter.draft.image_preview_url || editingCharacter.draft.avatar_url || editingCharacter.avatar_url}
                        className="h-48 w-full rounded-xl object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => {
                      setEditingCharacterId(null);
                      fetchCharacters();
                    }}
                    className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                  >
                    취소
                  </button>
                  <button
                    onClick={async () => {
                      await saveCharacterEdit(editingCharacter);
                      setEditingCharacterId(null);
                    }}
                    className="rounded-[1.35rem] bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition-all hover:brightness-110"
                  >
                    수정 저장
                  </button>
                </div>
              </div>
            </div>
          </ModalFrame>
        )}
      </AnimatePresence>

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
        <div className="text-slate-500 font-semibold">LOADING RANKING...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-24 px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-semibold uppercase tracking-tight">Guild Ranking</h2>
          <p className="text-slate-500 font-bold mt-2">포인트, 주간 활동, 서폿 기여도, 참여율 랭킹을 볼 수 있습니다.</p>
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
                "px-4 py-2 rounded-full text-sm font-semibold border",
                tab === key ? "bg-amber-500 border-amber-400" : "bg-white/5 border-white/10 text-slate-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 내 순위 고정 표시 (리스트 상단에 항상 표시) */}
      {user && myRank && (() => {
        const myRow = rows.find((m: any) => (m.id || m.profile_id) === user.id);
        // 상위 30위 안에 내 항목이 없을 때만 상단에 고정 표시
        const isInList = myRank <= 30;
        if (isInList) return null;
        return (
          <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 flex justify-between items-center">
            <div className="flex items-center gap-5">
              <div className="text-xl font-semibold w-12 text-center text-amber-300">#{myRank}</div>
              <div>
                <div className="text-base font-semibold text-amber-100">
                  {myRow?.nickname || myRow?.owner_nickname || "나"}{" "}
                  <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/70 border border-amber-400/30 rounded-full px-2 py-0.5">MY RANK</span>
                </div>
                <div className="text-xs text-slate-500 uppercase mt-0.5">
                  {tab === "points" ? myRow?.rank_name || "Seed" : tab === "weekly" ? "주간 활동 집계" : tab === "support" ? "서포트 기여도 집계" : "참여율 집계"}
                </div>
              </div>
            </div>
            <div className="text-lg font-semibold text-amber-300">{myRow ? renderValue(myRow) : "-"}</div>
          </div>
        );
      })()}

      <div className="space-y-4">
        {rows.slice(0, 30).map((member: any, index: number) => (
          <div
            key={member.id || member.profile_id || `${member.nickname}-${index}`}
            className={`flex justify-between items-center p-6 rounded-2xl border transition-all ${
              user?.id === (member.id || member.profile_id)
                ? "bg-amber-500/10 border-amber-400"
                : "bg-white/5 border-white/10"
            }`}
          >
            <div className="flex items-center gap-6">
              <div className="text-2xl font-semibold w-12 text-center">
                {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{member.nickname || member.owner_nickname}</span>
                  {user?.id === (member.id || member.profile_id) && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300 border border-amber-400/30 rounded-full px-2 py-0.5">나</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 uppercase">
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

            <div className="text-xl font-semibold text-amber-300">{renderValue(member)}</div>
          </div>
        ))}
      </div>

      {/* 내 순위 하단 고정 표시 (30위 안에 있어도 항상 하단에 표시) */}
      {user && myRank && (() => {
        const myRow = rows.find((m: any) => (m.id || m.profile_id) === user.id);
        return (
          <div className="mt-8 sticky bottom-4 z-10">
            <div className="rounded-2xl border border-amber-400/40 bg-[#0d0a06]/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl p-5 flex justify-between items-center">
              <div className="flex items-center gap-5">
                <div className="text-xl font-semibold w-12 text-center text-amber-300">#{myRank}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-white">{myRow?.nickname || myRow?.owner_nickname || "나"}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300 border border-amber-400/30 rounded-full px-2 py-0.5">내 순위</span>
                  </div>
                  <div className="text-xs text-slate-500 uppercase mt-0.5">
                    {tab === "points" ? myRow?.rank_name || "Seed" : tab === "weekly" ? "주간 활동 집계" : tab === "support" ? "서포트 기여도 집계" : "참여율 집계"}
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold text-amber-300">{myRow ? renderValue(myRow) : "-"}</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};



const GuildMembersPage = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");

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

      const overviewMap = new Map<string, any>();
      overviewRows.forEach((row: any) => {
        [row.id, row.character_id, row.guild_member_id]
          .map((key: any) => String(key || "").trim())
          .filter(Boolean)
          .forEach((key: string) => overviewMap.set(key, row));
      });

      const baseMembers = (liveRows.length > 0 ? liveRows : overviewRows).map((row: any) => {
        const overview =
          overviewMap.get(String(row.id || "").trim()) ||
          overviewMap.get(String(row.character_id || "").trim()) ||
          overviewMap.get(String(row.guild_member_id || "").trim()) ||
          {};
        const baseRow = { ...overview, ...row };

        return {
          ...baseRow,
          badge_card_effect: baseRow.badge_card_effect || overview.badge_card_effect || "none",
          badge_gradient_from: baseRow.badge_gradient_from || overview.badge_gradient_from || null,
          badge_gradient_to: baseRow.badge_gradient_to || overview.badge_gradient_to || null,
          badge_glow_color: baseRow.badge_glow_color || overview.badge_glow_color || null,
          equipped_badges: getCharacterBadges(baseRow),
        };
      });

      const ownerIds = Array.from(
        new Set(
          baseMembers
            .map((row: any) => String(row.owner_id || row.user_id || "").trim())
            .filter(Boolean)
        )
      );

      let profileMap = new Map<string, any>();
      if (ownerIds.length > 0) {
        const { data: profileRows, error: profileError } = await client
          .from("profiles")
          .select("id, nickname, active_nickname_effect, nickname_gradient_from, nickname_gradient_to, nickname_glow_color, nakwon_level")
          .in("id", ownerIds);

        if (profileError) {
          console.error("profiles nickname effect fetch error:", profileError);
        } else {
          profileMap = new Map((profileRows || []).map((row: any) => [String(row.id), row]));
        }
      }

      const merged = baseMembers.map((row: any) => {
        const ownerProfile = profileMap.get(String(row.owner_id || row.user_id || "")) || null;
        return {
          ...row,
          owner_profile_nickname: ownerProfile?.nickname || row.owner_nickname || row.nickname || "",
          owner_active_nickname_effect: ownerProfile?.active_nickname_effect || "none",
          owner_nickname_gradient_from: ownerProfile?.nickname_gradient_from || null,
          owner_nickname_gradient_to: ownerProfile?.nickname_gradient_to || null,
          owner_nickname_glow_color: ownerProfile?.nickname_glow_color || null,
          owner_nakwon_level: Number(ownerProfile?.nakwon_level || 1),
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

  const availableClasses = useMemo(() => {
    const classes = Array.from(
      new Set(members.map((m: any) => String(m.class_name || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "ko"));
    return classes;
  }, [members]);

  const filteredMembers = useMemo(() => {
    let result = members;
    if (filter === "main") result = result.filter((m: any) => m.is_main);
    if (filter === "support") result = result.filter((m: any) => m.role_hint === "서포터");
    if (classFilter !== "all") {
      result = result.filter((m: any) => String(m.class_name || "").trim() === classFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (m: any) =>
          String(m.character_name || "").toLowerCase().includes(query) ||
          String(m.class_name || "").toLowerCase().includes(query)
      );
    }
    return result;
  }, [members, filter, classFilter, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">길드 캐릭터</h1>
          <p className="text-slate-400 mt-2">메인캐, 템렙, 캐릭터 레벨, 전투력, 생일, MBTI, 장착 뱃지와 장비 파츠 [무기]까지 한 번에 볼 수 있습니다.</p>
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
                "px-4 py-2 rounded-full text-sm font-semibold border transition",
                filter === key ? "bg-amber-500 border-amber-400 text-white" : "bg-white/5 border-white/10 text-slate-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 & 직업 필터 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="캐릭터명 또는 직업으로 검색..."
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 pl-10 text-sm text-white placeholder-stone-500 outline-none focus:border-amber-200/30 focus:bg-white/[0.06] transition-all"
          />
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {availableClasses.length > 0 && (
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-amber-200/30 transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all" className="bg-[#0d0a06]">직업 전체</option>
            {availableClasses.map((cls) => (
              <option key={cls} value={cls} className="bg-[#0d0a06]">{cls}</option>
            ))}
          </select>
        )}
      </div>

      {/* 결과 카운트 */}
      <div className="mb-4 text-xs text-stone-500 font-medium">
        {filteredMembers.length}명 표시 중 (전체 {members.length}명)
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10">길드원 불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredMembers.map((member: any) => {
            const { theme } = getPrimaryBadgeTheme(member);
            const weaponTheme = getWeaponTheme({ rarity: member.equipped_weapon_rarity });
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
                      {member.avatar_url || member.image_url ? (
                        <img
                          src={member.avatar_url || member.image_url}
                          className="h-20 w-20 rounded-2xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="h-20 w-20 shrink-0 rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-400/20 via-slate-950 to-purple-500/10 flex items-center justify-center text-sm font-semibold text-amber-100">
                          쁘밍
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {member.is_main && (
                            <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-300 border border-yellow-500/20 inline-flex items-center gap-1">
                              <Crown size={11} />
                              MAIN
                            </span>
                          )}
                          {member.role_hint === "서포터" && (
                            <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-400/15 text-amber-200 border border-amber-400/20">
                              서폿
                            </span>
                          )}
                          {getCharacterBadges(member).map((badge: any, index: number) => {
                            const badgeTheme = getBadgeVisualTheme(badge);
                            return (
                              <span
                                key={`${badge.badge_item_id}-${index}`}
                                className="px-2 py-1 rounded-full text-[10px] font-semibold border"
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
                        <div className="text-xl font-semibold truncate">{member.character_name}</div>
                        <div className="text-sm text-slate-300/80 truncate">{member.class_name}</div>
                        <div className="mt-1 text-amber-100 font-semibold">아이템 Lv. {member.item_level}</div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-white/50 uppercase tracking-widest">Owner</div>
                      <div
                        className="text-sm font-bold"
                        style={getNicknameEffectStyle({
                          active_nickname_effect: member.owner_active_nickname_effect,
                          nickname_gradient_from: member.owner_nickname_gradient_from,
                          nickname_gradient_to: member.owner_nickname_gradient_to,
                          nickname_glow_color: member.owner_nickname_glow_color,
                        })}
                      >
                        {member.owner_profile_nickname || member.owner_nickname || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/50 font-semibold">장비 파츠 [무기]</div>
                    {member.equipped_weapon_name ? (
                      <div className="mt-3 flex items-center gap-3">
                        <WeaponImage weapon={{ image_url: member.equipped_weapon_image_url, rarity: member.equipped_weapon_rarity }} className="h-14 w-14 rounded-2xl" />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{getEnhancedWeaponName(member.equipped_weapon_name, member.equipped_weapon_level)}</div>
                          <div className="mt-1 inline-flex px-2 py-1 rounded-full text-[10px] font-semibold border" style={{ color: weaponTheme.text, borderColor: weaponTheme.border, background: weaponTheme.background }}>
                            {weaponTheme.label}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-slate-500">장착한 무기가 없습니다.</div>
                    )}
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
                    <div className="mt-4 text-sm text-slate-300 whitespace-pre-wrap border-t border-white/5 pt-4">
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
            <div className="text-xs text-slate-400">{char.class_name}</div>
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
            <div className="text-xs text-slate-400">
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
            <div className="text-xs text-slate-400">{member.rank_name}</div>
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
  const [gachaProducts, setGachaProducts] = useState<any[]>([]);
  const [gachaRewards, setGachaRewards] = useState<Record<string, any[]>>({});
  const [myPoint, setMyPoint] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shopTab, setShopTab] = useState<"guild" | "nickname" | "enhance" | "gacha">("guild");
  const [drawSession, setDrawSession] = useState<any>(null);
  const [drawingProductId, setDrawingProductId] = useState<string | null>(null);
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchShop();
  }, [user?.id]);

  const fetchShop = async () => {
    setLoading(true);
    const client = getSupabaseOrThrow();

    const [itemsRes, profileRes, gachaRes] = await Promise.allSettled([
      client.from("point_shop_items").select("*").order("price", { ascending: true }),
      user ? client.from("profiles").select("points").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null } as any),
      client.from("weapon_gacha_products").select("*").order("created_at", { ascending: false }),
    ]);

    if (itemsRes.status === "fulfilled" && !(itemsRes.value as any).error) {
      setItems((itemsRes.value as any).data || []);
    } else {
      console.error("point shop items fetch failed:", itemsRes.status === "fulfilled" ? (itemsRes.value as any).error : itemsRes.reason);
      setItems([]);
    }

    if (profileRes.status === "fulfilled" && (profileRes.value as any)?.data) {
      setMyPoint((profileRes.value as any).data.points || 0);
    } else {
      setMyPoint(0);
    }

    let nextGachas: any[] = [];
    if (gachaRes.status === "fulfilled" && !(gachaRes.value as any).error) {
      nextGachas = (gachaRes.value as any).data || [];
      setGachaProducts(nextGachas);
    } else {
      console.error("weapon_gacha_products fetch failed:", gachaRes.status === "fulfilled" ? (gachaRes.value as any).error : gachaRes.reason);
      setGachaProducts([]);
    }

    const productIds = nextGachas.map((item: any) => item.id).filter(Boolean);
    if (productIds.length > 0) {
      const { data: rewardRows, error: rewardError } = await client
        .from("weapon_gacha_reward_items")
        .select("id, product_id, weight, probability, weapon_id, is_featured, weapon_parts(id, name, description, image_url, rarity, is_active)")
        .in("product_id", productIds);

      if (rewardError) {
        console.error("weapon_gacha_reward_items fetch error:", rewardError);
        setGachaRewards({});
      } else {
        const grouped: Record<string, any[]> = {};
        (rewardRows || []).forEach((row: any) => {
          const productId = String(row.product_id);
          if (!grouped[productId]) grouped[productId] = [];
          grouped[productId].push({
            ...row.weapon_parts,
            weight: row.weight,
            probability: getProbabilityNumber(row.probability),
            is_featured: row.is_featured,
          });
        });

        Object.keys(grouped).forEach((key) => {
          grouped[key] = grouped[key].sort((a: any, b: any) => {
            const probabilityDiff = getProbabilityNumber(b.probability) - getProbabilityNumber(a.probability);
            if (probabilityDiff !== 0) return probabilityDiff;
            return String(a.name || "").localeCompare(String(b.name || ""), "ko");
          });
        });

        setGachaRewards(grouped);
      }
    } else {
      setGachaRewards({});
    }

    setLoading(false);
  };

  const purchase = async (item: any) => {
    if (!user) return showToast("로그인 후 사용 가능합니다.", "error");
    if (!isShopItemAvailable(item)) return showToast("지금은 구매 가능한 시간이 아니야.", "success");
    if (purchasingItemId) return showToast("구매 처리 중입니다. 잠시만 기다려줘.", "info");
    if (myPoint < item.price) return showToast("포인트가 부족합니다.");
    if (!confirm(`${item.title} 구매 시 ${item.price}P가 차감됩니다. 진행할까요?`)) return;

    const client = getSupabaseOrThrow();
    setPurchasingItemId(String(item.id));

    try {

    if (item.reward_type === "enhance_stone") {
      const nextPoint = Math.max(0, myPoint - Number(item.price || 0));
      const { error: pointError } = await client.from("profiles").update({ points: nextPoint }).eq("id", user.id);
      if (pointError) return showToast(pointError.message, "error");

      const { data: existingRow, error: inventoryReadError } = await client
        .from("user_owned_enhance_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("shop_item_id", item.id)
        .maybeSingle();

      if (inventoryReadError) {
        return showToast(`${inventoryReadError.message}\n\n강화석 인벤토리 SQL을 먼저 적용해줘.`, "error");
      }

      if (existingRow?.id) {
        const { error: inventoryUpdateError } = await client
          .from("user_owned_enhance_items")
          .update({
            quantity: Number(existingRow.quantity || 0) + 1,
            item_name: item.title,
            bonus_rate: Number(item.enhance_bonus_rate || 0),
          })
          .eq("id", existingRow.id)
          .eq("user_id", user.id);

        if (inventoryUpdateError) return showToast(inventoryUpdateError.message, "error");
      } else {
        const { error: inventoryInsertError } = await client.from("user_owned_enhance_items").insert({
          user_id: user.id,
          shop_item_id: item.id,
          item_name: item.title,
          bonus_rate: Number(item.enhance_bonus_rate || 0),
          quantity: 1,
        });

        if (inventoryInsertError) return showToast(`${inventoryInsertError.message}\n\n강화석 인벤토리 SQL을 먼저 적용해줘.`, "error");
      }

      showToast(`${item.title} 구매 완료! 마이룸에서 강화 시 자동으로 사용돼.`, "success");
      fetchShop();
      return;
    }

    if (item.reward_type === "nickname_effect") {
      const nextPoint = Math.max(0, myPoint - Number(item.price || 0));
      const { error: pointError } = await client.from("profiles").update({ points: nextPoint }).eq("id", user.id);
      if (pointError) return showToast(pointError.message, "error");

      const { data: existingRow, error: inventoryReadError } = await client
        .from("user_owned_nickname_effects")
        .select("*")
        .eq("user_id", user.id)
        .eq("shop_item_id", item.id)
        .maybeSingle();

      if (inventoryReadError) return showToast(`${inventoryReadError.message}\n\n닉네임 이펙트 SQL을 먼저 적용해줘.`, "error");

      if (existingRow?.id) {
        const { error: inventoryUpdateError } = await client
          .from("user_owned_nickname_effects")
          .update({ quantity: Number(existingRow.quantity || 0) + 1, title: item.title })
          .eq("id", existingRow.id)
          .eq("user_id", user.id);

        if (inventoryUpdateError) return showToast(inventoryUpdateError.message, "error");
      } else {
        const { error: inventoryInsertError } = await client.from("user_owned_nickname_effects").insert({
          user_id: user.id,
          shop_item_id: item.id,
          title: item.title,
          quantity: 1,
          nickname_effect_key: item.nickname_effect_key || "violet",
          nickname_gradient_from: item.nickname_gradient_from || null,
          nickname_gradient_to: item.nickname_gradient_to || null,
          nickname_glow_color: item.nickname_glow_color || null,
        });

        if (inventoryInsertError) return showToast(`${inventoryInsertError.message}\n\n닉네임 이펙트 SQL을 먼저 적용해줘.`, "error");
      }

      showToast(`${item.title} 구매 완료! 마이룸에서 바로 적용할 수 있어.`, "success");
      fetchShop();
      return;
    }

    if (item.reward_type === "badge") {
      const { data: badgePurchaseResult, error: badgePurchaseError } = await client.rpc("purchase_badge_item_and_inventory_v2", {
        p_user_id: user.id,
        p_item_id: item.id,
      });

      if (badgePurchaseError) {
        showToast(badgePurchaseError.message || "뱃지 구매에 실패했어.", "error");
        await fetchShop();
        return;
      }

      const remainingPoints = Number(
        (badgePurchaseResult as any)?.remaining_points ??
          Math.max(0, Number(myPoint || 0) - Number(item.price || 0))
      );
      setMyPoint(remainingPoints);
      showToast(`${item.title} 구매 완료! ${Number(item.price || 0)}P 차감됐어.`, "success");
      window.setTimeout(() => showToast(`${item.title} 구매 완료!`, "success"), 120);
      await Promise.all([fetchOwnedBadges(), fetchShop(), fetchMyPoint()]);
      return;
    }

    const { error } = await supabase.rpc("purchase_shop_item", {
      p_user_id: user.id,
      p_item_id: item.id,
    });

    if (error) return showToast(error.message, "error");

    showToast("구매 요청 완료", "success");
    await Promise.all([fetchShop(), fetchMyPoint()]);
    } finally {
      setPurchasingItemId(null);
    }
  };

  const drawWeaponGacha = async (product: any, drawCount = 1) => {
    if (!user) return showToast("로그인 후 사용 가능합니다.", "error");
    if (!isWeaponGachaAvailable(product)) return showToast("지금은 판매 시간이 아니야.");

    const totalCost = Number(product.price || 0) * drawCount;
    if (myPoint < totalCost) return showToast("포인트가 부족합니다.");

    const confirmText =
      drawCount === 10
        ? `${product.title} 10회 뽑기를 진행할까요? 총 ${totalCost}P가 차감되고, 10회 내 Rare 이상 1개 보장이 적용됩니다.`
        : `${product.title} 뽑기를 진행할까요? ${totalCost}P가 차감됩니다.`;

    if (!confirm(confirmText)) return;

    const client = getSupabaseOrThrow();
    setDrawingProductId(String(product.id));

    const { data, error } = await client.rpc("draw_weapon_gacha_pack", {
      p_user_id: user.id,
      p_product_id: product.id,
      p_draw_count: drawCount,
    });

    setDrawingProductId(null);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    const results = Array.isArray(data?.results)
      ? data.results
      : data
      ? [data]
      : [];

    setDrawSession({
      ...data,
      results,
      draw_count: Number(data?.draw_count || drawCount),
      total_cost: Number(data?.total_cost || totalCost),
      duplicate_refund_total: Number(data?.duplicate_refund_total || 0),
      pity_applied_count: Number(data?.pity_applied_count || 0),
      rare_or_better_count: results.filter((item: any) => isRareOrBetterWeapon(item?.rarity)).length,
    });
    await fetchShop();
  };

  const guildItems = items.filter((item) => item.reward_type === "badge" && String(item.shop_category || "guild") !== "nickname");
  const nicknameItems = items.filter((item) => item.reward_type === "nickname_effect" || String(item.shop_category || "") === "nickname");
  const enhanceItems = items.filter((item) => item.reward_type === "enhance_stone");

  const renderShopCards = (shopItems: any[], emptyText: string) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {shopItems.length === 0 && (
        <div className="lg:col-span-2 xl:col-span-3 rounded-[2rem] border border-dashed border-white/10 bg-black/20 px-6 py-14 text-center text-slate-500">
          {emptyText}
        </div>
      )}

      {shopItems.map((item) => {
        const available = isShopItemAvailable(item);
        const badgeTheme = getBadgeVisualTheme(item);
        const highlights = getShopItemHighlights(item);
        const moodLine = getShopMoodLine(item);
        const cardBackground = getPointShopCardBackground(item, badgeTheme);
        const auraBackground = getPointShopAuraBackground(item, badgeTheme);

        return (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1020] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
          >
            <div className="absolute inset-0 opacity-90 pointer-events-none" style={{ background: cardBackground }} />
            <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: auraBackground }} />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border border-white/10 bg-white/5 text-white/70">
                      {getShopRewardTypeLabel(item)}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border"
                      style={{
                        color: item.reward_type === "badge" ? badgeTheme.chipText : item.reward_type === "enhance_stone" ? "#fde68a" : "#c4b5fd",
                        borderColor: item.reward_type === "badge" ? badgeTheme.chipBorder : item.reward_type === "enhance_stone" ? "rgba(250,204,21,0.35)" : "rgba(196,181,253,0.45)",
                        background: item.reward_type === "badge" ? badgeTheme.chipBackground : item.reward_type === "enhance_stone" ? "rgba(245,158,11,0.16)" : "rgba(139,92,246,0.16)",
                      }}
                    >
                      {getShopItemStatusText(item)}
                    </span>
                  </div>
                  <div className="mt-4 text-2xl font-semibold leading-tight break-words">{item.title}</div>
                  <div className="mt-2 text-sm text-white/70">{moodLine}</div>
                </div>
                <div className="h-14 w-14 rounded-[1.2rem] border border-white/10 bg-black/25 flex items-center justify-center backdrop-blur-md">
                  <ShoppingBag className="text-white/80" />
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-white/50 font-semibold">Live Card Mood</div>
                    <div className="mt-1 text-sm font-bold text-white/85">
                      {item.reward_type === "badge"
                        ? `${badgeTheme.label} 길드 카드`
                        : item.reward_type === "enhance_stone"
                        ? "무기 강화 보조 아이템"
                        : "포인트샵 대표 상품 카드"}
                    </div>
                  </div>
                  {item.reward_type === "enhance_stone" && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold border border-amber-200/30 bg-amber-400/10 text-amber-100">
                      {getEnhancementItemEffectText(item)}
                    </span>
                  )}
                  {item.reward_type !== "enhance_stone" && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold border"
                      style={{
                        color: item.reward_type === "badge" ? badgeTheme.chipText : "#ddd6fe",
                        borderColor: item.reward_type === "badge" ? badgeTheme.chipBorder : "rgba(221,214,254,0.35)",
                        background: item.reward_type === "badge" ? badgeTheme.chipBackground : "rgba(139,92,246,0.16)",
                      }}
                    >
                      {item.reward_type === "badge" ? "카드 이펙트 적용" : "포인트샵 아이템"}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {highlights.map((line, index) => (
                    <div key={`${item.id}-highlight-${index}`} className="text-sm text-white/75">
                      • {line}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div className="text-3xl font-semibold">{item.price}P</div>
                  <button
                    onClick={() => purchase(item)}
                    disabled={!available || !user || purchasingItemId === String(item.id)}
                    className={cn(
                      "px-4 py-3 rounded-xl font-semibold text-sm transition",
                      available && user && purchasingItemId !== String(item.id) ? "bg-amber-500 hover:bg-amber-400 text-white" : "bg-slate-800 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {purchasingItemId === String(item.id) ? "구매 처리중" : available ? (user ? "구매하기" : "로그인 필요") : "구매 불가"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-24 px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-semibold uppercase tracking-tight">Point Shop</h2>
          <p className="text-slate-500 font-bold mt-2">뱃지, 닉네임 효과, 강화석, 무기 가챠 상품.</p>
        </div>

        <div className="rounded-[2rem] border border-amber-400/20 bg-amber-400/10 px-5 py-4">
          <div className="text-[10px] uppercase tracking-widest text-amber-200 font-semibold">My Point</div>
          <div className="text-2xl font-semibold">{myPoint} P</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          ["guild", "뱃지 상점"],
          ["nickname", "닉네임 상점"],
          ["enhance", "강화석 상점"],
          ["gacha", "무기 가챠"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setShopTab(key as "guild" | "nickname" | "enhance" | "gacha")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold border transition",
              shopTab === key ? "bg-amber-500 border-amber-400 text-white" : "bg-white/5 border-white/10 text-slate-400"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500">포인트샵 불러오는 중...</div>
      ) : shopTab === "guild" ? (
        renderShopCards(guildItems, "아직 등록된 뱃지 상품이 없습니다.")
      ) : shopTab === "nickname" ? (
        renderShopCards(nicknameItems, "아직 등록된 닉네임 상품이 없습니다.")
      ) : shopTab === "enhance" ? (
        renderShopCards(enhanceItems, "아직 등록된 강화석 상품이 없습니다.")
      ) : (
        <div className="space-y-8">
          {gachaProducts.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-black/20 px-6 py-14 text-center text-slate-500">
              아직 등록된 무기 가챠 상품이 없습니다.
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {gachaProducts.map((product: any) => {
              const available = isWeaponGachaAvailable(product);
              const rewards = gachaRewards[String(product.id)] || [];
              const featured = rewards.find((item: any) => item.is_featured) || rewards[0];
              const probabilityTotal = rewards.reduce((sum: number, item: any) => sum + getProbabilityNumber(item?.probability), 0);
              const rarePool = rewards.filter((item: any) => isRareOrBetterWeapon(item?.rarity));
              const drawBusy = drawingProductId === String(product.id);

              return (
                <div
                  key={product.id}
                  className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1020] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
                >
                  <div className="absolute inset-0 opacity-90 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(214,164,78,0.12), rgba(76,29,149,0.3) 52%, rgba(2,6,23,0.96))" }} />
                  <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: "radial-gradient(circle at top right, rgba(250,204,21,0.18), transparent 42%)" }} />
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border border-white/10 bg-white/5 text-white/70">
                            Weapon Gacha
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border border-amber-400/30 bg-amber-400/15 text-amber-200">
                            {getWeaponGachaStatusText(product)}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border border-amber-300/30 bg-amber-300/12 text-amber-100">
                            10회 내 Rare+ 보장
                          </span>
                        </div>
                        <div className="mt-4 text-2xl font-semibold leading-tight break-words">{product.title}</div>
                        <div className="mt-2 text-sm text-white/75">{product.promo_text || product.description || "무기 파츠를 랜덤으로 획득할 수 있는 가챠 상품"}</div>
                      </div>
                      <div className="h-16 w-16 rounded-[1.4rem] border border-white/10 bg-black/25 flex items-center justify-center overflow-hidden">
                        {featured ? <WeaponImage weapon={featured} className="h-16 w-16 rounded-[1.4rem]" /> : <ShoppingBag className="text-white/80" />}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.24em] text-white/50 font-semibold">Reward Pool</div>
                          <div className="mt-1 text-sm font-bold text-white/85">
                            총 {rewards.length}종 · Rare 이상 {rarePool.length}종 · 합계 {formatProbabilityText(probabilityTotal)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold">{product.price}P</div>
                          <div className="text-xs text-slate-500">1회 기준</div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-1">
                        {rewards.length === 0 && (
                          <div className="text-sm text-slate-500">등록된 보상 무기가 없습니다.</div>
                        )}
                        {rewards.map((item: any, index: number) => {
                          const theme = getWeaponTheme(item);
                          return (
                            <div
                              key={`${product.id}-${item.id || item.name}-${index}`}
                              className="rounded-2xl border border-white/10 bg-black/25 px-3 py-3 flex items-center gap-3"
                            >
                              <WeaponImage weapon={item} className="h-12 w-12 rounded-2xl shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="font-semibold truncate">{item.name || "무기 파츠"}</div>
                                  {item.is_featured && (
                                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold border border-amber-300/30 bg-amber-300/12 text-amber-100">
                                      Featured
                                    </span>
                                  )}
                                  <span
                                    className="px-2 py-1 rounded-full text-[10px] font-semibold border"
                                    style={{ color: theme.text, borderColor: theme.border, background: theme.background }}
                                  >
                                    {theme.label}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-slate-400">{item.description || "길드 캐릭터 카드 장착용 무기 파츠"}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-sm font-semibold">{formatProbabilityText(item.probability)}</div>
                                <div className="text-[11px] text-slate-500">가챠 확률</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => drawWeaponGacha(product, 1)}
                          disabled={!available || drawBusy || !user}
                          className={cn(
                            "px-4 py-3 rounded-xl font-semibold text-sm transition",
                            available && !drawBusy && user ? "bg-amber-500 hover:bg-amber-400 text-white" : "bg-slate-800 text-slate-400 cursor-not-allowed"
                          )}
                        >
                          {drawBusy ? "처리 중..." : "1회 뽑기"}
                        </button>
                        <button
                          onClick={() => drawWeaponGacha(product, 10)}
                          disabled={!available || drawBusy || !user}
                          className={cn(
                            "px-4 py-3 rounded-xl font-semibold text-sm transition",
                            available && !drawBusy && user ? "bg-amber-500 hover:bg-amber-400 text-white" : "bg-slate-800 text-slate-400 cursor-not-allowed"
                          )}
                        >
                          {drawBusy ? "처리 중..." : "10회 뽑기"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {drawSession && (
            <div className="rounded-[2rem] border border-white/10 bg-[#0b1020] p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.24em] text-amber-200 font-semibold">Latest Draw Result</div>
                  <div className="mt-2 text-2xl font-semibold">{drawSession.product_title || "무기 가챠 결과"}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    총 {drawSession.draw_count}회 · 사용 {drawSession.total_cost}P · Rare 이상 {drawSession.rare_or_better_count}개
                  </div>
                </div>
                <button
                  onClick={() => setDrawSession(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-sm font-semibold"
                >
                  결과 닫기
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(drawSession.results || []).map((item: any, index: number) => {
                  const theme = getWeaponTheme(item);
                  return (
                    <div
                      key={`draw-result-${index}`}
                      className="rounded-[1.5rem] border p-4 bg-black/30"
                      style={{ borderColor: theme.border, boxShadow: `0 0 24px ${theme.glow}` }}
                    >
                      <div className="flex items-start gap-3">
                        <WeaponImage weapon={item} className="h-14 w-14 rounded-2xl shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{item.name || item.weapon_name || "무기 파츠"}</div>
                          <div
                            className="mt-1 inline-flex px-2 py-1 rounded-full text-[10px] font-semibold border"
                            style={{ color: theme.text, borderColor: theme.border, background: theme.background }}
                          >
                            {theme.label}
                          </div>
                          <div className="mt-2 text-xs text-slate-400 line-clamp-2">
                            {item.description || "새로운 무기 파츠를 획득했습니다."}
                          </div>
                          {item.is_duplicate && (
                            <div className="mt-2 text-xs text-amber-200">
                              중복 보상 · 환급 {drawSession.duplicate_refund_points || 0}P
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminPointShopManager = () => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [rewardType, setRewardType] = useState<"badge" | "enhance_stone" | "nickname_effect">("badge");
  const [badgeColor, setBadgeColor] = useState("#8b5cf6");
  const [badgeCardEffect, setBadgeCardEffect] = useState<BadgeEffectKey>("violet");
  const [badgeGradientFrom, setBadgeGradientFrom] = useState(BADGE_CARD_EFFECT_PRESETS.violet.from);
  const [badgeGradientTo, setBadgeGradientTo] = useState(BADGE_CARD_EFFECT_PRESETS.violet.to);
  const [badgeGlowColor, setBadgeGlowColor] = useState(BADGE_CARD_EFFECT_PRESETS.violet.glow);
  const [enhanceBonusRate, setEnhanceBonusRate] = useState("5");
  const [nicknameEffectKey, setNicknameEffectKey] = useState<NicknameEffectKey>("violet");
  const [nicknameGradientFrom, setNicknameGradientFrom] = useState(NICKNAME_EFFECT_PRESETS.violet.from);
  const [nicknameGradientTo, setNicknameGradientTo] = useState(NICKNAME_EFFECT_PRESETS.violet.to);
  const [nicknameGlowColor, setNicknameGlowColor] = useState(NICKNAME_EFFECT_PRESETS.violet.glow);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [managerTab, setManagerTab] = useState<"guild" | "nickname" | "weapon" | "enhance_stone">("guild");
  const [productAdminTab, setProductAdminTab] = useState<"badge" | "weapon_parts" | "gacha">("badge");

  const [weaponName, setWeaponName] = useState("");
  const [weaponDescription, setWeaponDescription] = useState("");
  const [weaponImageUrl, setWeaponImageUrl] = useState("");
  const [weaponRarity, setWeaponRarity] = useState<WeaponRarityKey>("rare");
  const [weaponParts, setWeaponParts] = useState<any[]>([]);

  const [gachaTitle, setGachaTitle] = useState("");
  const [gachaDescription, setGachaDescription] = useState("");
  const [gachaPrice, setGachaPrice] = useState("");
  const [gachaImageUrl, setGachaImageUrl] = useState("");
  const [gachaPromoText, setGachaPromoText] = useState("");
  const [gachaAvailableFrom, setGachaAvailableFrom] = useState("");
  const [gachaAvailableTo, setGachaAvailableTo] = useState("");
  const [selectedWeaponIds, setSelectedWeaponIds] = useState<string[]>([]);
  const [featuredWeaponId, setFeaturedWeaponId] = useState("");
  const [gachaProbabilityMap, setGachaProbabilityMap] = useState<Record<string, string>>(buildEqualProbabilityMap([]));
  const [gachaProducts, setGachaProducts] = useState<any[]>([]);
  const [gachaRewardMap, setGachaRewardMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetchItems();
    fetchWeaponParts();
    fetchGachaProducts();
  }, []);

  useEffect(() => {
    const preset = BADGE_CARD_EFFECT_PRESETS[badgeCardEffect] || BADGE_CARD_EFFECT_PRESETS.violet;
    setBadgeGradientFrom(preset.from);
    setBadgeGradientTo(preset.to);
    setBadgeGlowColor(preset.glow);
  }, [badgeCardEffect]);

  useEffect(() => {
    if (managerTab === "nickname") {
      setRewardType("nickname_effect");
    } else if (managerTab === "enhance_stone") {
      setRewardType("enhance_stone");
    } else {
      setRewardType("badge");
    }
  }, [managerTab]);

  const fetchItems = async () => {
    const { data, error } = await supabase.from("point_shop_items").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setItems([]);
      return;
    }
    setItems(data || []);
  };

  const fetchWeaponParts = async () => {
    const { data, error } = await supabase.from("weapon_parts").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setWeaponParts([]);
      return;
    }
    setWeaponParts(data || []);
  };

  const fetchGachaProducts = async () => {
    const client = getSupabaseOrThrow();
    const { data, error } = await client.from("weapon_gacha_products").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setGachaProducts([]);
      setGachaRewardMap({});
      return;
    }

    const products = data || [];
    setGachaProducts(products);

    const productIds = products.map((item: any) => item.id).filter(Boolean);
    if (productIds.length === 0) {
      setGachaRewardMap({});
      return;
    }

    const { data: rewardRows, error: rewardError } = await client
      .from("weapon_gacha_reward_items")
      .select("id, product_id, weight, probability, is_featured, weapon_id, weapon_parts(id, name, description, image_url, rarity)")
      .in("product_id", productIds);

    if (rewardError) {
      console.error(rewardError);
      setGachaRewardMap({});
      return;
    }

    const grouped: Record<string, any[]> = {};
    (rewardRows || []).forEach((row: any) => {
      const key = String(row.product_id);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        ...row.weapon_parts,
        is_featured: row.is_featured,
        probability: getProbabilityNumber(row.probability),
        weight: row.weight,
      });
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key] = grouped[key].sort((a: any, b: any) => {
        const probabilityDiff = getProbabilityNumber(b.probability) - getProbabilityNumber(a.probability);
        if (probabilityDiff !== 0) return probabilityDiff;
        return String(a.name || "").localeCompare(String(b.name || ""), "ko");
      });
    });

    setGachaRewardMap(grouped);
  };

  const resetItemForm = () => {
    setTitle("");
    setPrice("");
    setDescription("");
    setRewardType("badge");
    setManagerTab("guild");
    setNicknameEffectKey("violet");
    setNicknameGradientFrom(NICKNAME_EFFECT_PRESETS.violet.from);
    setNicknameGradientTo(NICKNAME_EFFECT_PRESETS.violet.to);
    setNicknameGlowColor(NICKNAME_EFFECT_PRESETS.violet.glow);
    setBadgeColor("#8b5cf6");
    setBadgeCardEffect("violet");
    setBadgeGradientFrom(BADGE_CARD_EFFECT_PRESETS.violet.from);
    setBadgeGradientTo(BADGE_CARD_EFFECT_PRESETS.violet.to);
    setBadgeGlowColor(BADGE_CARD_EFFECT_PRESETS.violet.glow);
    setEnhanceBonusRate("5");
    setAvailableFrom("");
    setAvailableTo("");
  };

  const createItem = async () => {
    if (!title.trim() || !price) return showToast("상품명과 가격을 입력하세요.");

    const basePayload: Record<string, any> = {
      title,
      description,
      price: toNumber(price),
      is_active: true,
      reward_type: rewardType,
      shop_category: managerTab,
      badge_name: rewardType === "badge" ? title : null,
      badge_color: rewardType === "badge" ? badgeColor : null,
      badge_card_effect: rewardType === "badge" ? badgeCardEffect : "none",
      badge_gradient_from: rewardType === "badge" ? badgeGradientFrom : null,
      badge_gradient_to: rewardType === "badge" ? badgeGradientTo : null,
      badge_glow_color: rewardType === "badge" ? badgeGlowColor : null,
      nickname_effect_key: rewardType === "nickname_effect" ? nicknameEffectKey : null,
      nickname_gradient_from: rewardType === "nickname_effect" ? nicknameGradientFrom : null,
      nickname_gradient_to: rewardType === "nickname_effect" ? nicknameGradientTo : null,
      nickname_glow_color: rewardType === "nickname_effect" ? nicknameGlowColor : null,
      available_from: availableFrom ? new Date(availableFrom).toISOString() : null,
      available_to: availableTo ? new Date(availableTo).toISOString() : null,
    };

    let insertPayload: Record<string, any> = { ...basePayload };
    if (rewardType === "enhance_stone") {
      insertPayload.enhance_bonus_rate = Number(enhanceBonusRate || 0);
    }

    let { error } = await supabase.from("point_shop_items").insert(insertPayload);

    if (error && /enhance_bonus_rate/i.test(String(error.message || "")) && rewardType === "enhance_stone") {
      const fallbackPayload = {
        ...basePayload,
        bonus_rate: Number(enhanceBonusRate || 0),
      };
      const retry = await supabase.from("point_shop_items").insert(fallbackPayload);
      error = retry.error;
    }

    if (error) return showToast(`상품 생성 실패: ${error.message}`, "error");
    resetItemForm();
    fetchItems();
  };

  const createWeaponPart = async () => {
    if (!weaponName.trim()) return showToast("무기 이름을 입력하세요.");
    const { error } = await supabase.from("weapon_parts").insert({
      name: weaponName,
      description: weaponDescription,
      image_url: weaponImageUrl || null,
      rarity: weaponRarity,
      is_active: true,
    });

    if (error) return showToast(error.message, "error");

    setWeaponName("");
    setWeaponDescription("");
    setWeaponImageUrl("");
    setWeaponRarity("rare");
    fetchWeaponParts();
  };

  const totalProbability = getProbabilityTotal(gachaProbabilityMap, selectedWeaponIds);
  const isProbabilityValid = selectedWeaponIds.length > 0 && Math.abs(totalProbability - 100) < 0.02;

  const handleWeaponSelectionChange = (weaponId: string, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...selectedWeaponIds, String(weaponId)]))
      : selectedWeaponIds.filter((id) => String(id) !== String(weaponId));

    setSelectedWeaponIds(next);
    setGachaProbabilityMap(buildEqualProbabilityMap(next));

    if (!checked && featuredWeaponId === String(weaponId)) {
      setFeaturedWeaponId(next[0] || "");
    } else if (checked && !featuredWeaponId) {
      setFeaturedWeaponId(String(weaponId));
    }
  };

  const updateProbability = (weaponId: string, value: string) => {
    setGachaProbabilityMap((prev) => ({
      ...prev,
      [String(weaponId)]: value,
    }));
  };

  const createGachaProduct = async () => {
    if (!gachaTitle.trim() || !gachaPrice) return showToast("뽑기 이름과 가격을 입력하세요.");
    if (selectedWeaponIds.length === 0) return showToast("뽑기 보상으로 들어갈 무기를 하나 이상 선택하세요.");

    const invalidWeapon = selectedWeaponIds.find((weaponId) => getProbabilityNumber(gachaProbabilityMap[weaponId]) <= 0);
    if (invalidWeapon) {
      const invalidMeta = weaponParts.find((item: any) => String(item.id) === String(invalidWeapon));
      return showToast(`${invalidMeta?.name || "선택한 무기"}의 확률을 0보다 크게 입력해줘.`);
    }

    if (!isProbabilityValid) {
      return showToast(`확률 총합이 100%가 되어야 해. 현재 총합은 ${formatProbabilityText(totalProbability)}야.`);
    }

    const client = getSupabaseOrThrow();
    const { data: inserted, error } = await client
      .from("weapon_gacha_products")
      .insert({
        title: gachaTitle,
        description: gachaDescription,
        price: toNumber(gachaPrice),
        image_url: gachaImageUrl || null,
        promo_text: gachaPromoText || null,
        is_active: true,
        available_from: gachaAvailableFrom ? new Date(gachaAvailableFrom).toISOString() : null,
        available_to: gachaAvailableTo ? new Date(gachaAvailableTo).toISOString() : null,
        guaranteed_rare_within: 10,
        duplicate_refund_points: 1,
      })
      .select("*")
      .single();

    if (error) return showToast(error.message, "error");

    const rewardRows = selectedWeaponIds.map((weaponId) => {
      const probability = getProbabilityNumber(gachaProbabilityMap[weaponId]);
      return {
        product_id: inserted.id,
        weapon_id: weaponId,
        weight: Math.max(1, Math.round(probability * 100)),
        probability,
        is_featured: featuredWeaponId ? featuredWeaponId === weaponId : selectedWeaponIds[0] === weaponId,
      };
    });

    const { error: rewardError } = await client.from("weapon_gacha_reward_items").insert(rewardRows);
    if (rewardError) return showToast(rewardError.message, "error");

    setGachaTitle("");
    setGachaDescription("");
    setGachaPrice("");
    setGachaImageUrl("");
    setGachaPromoText("");
    setGachaAvailableFrom("");
    setGachaAvailableTo("");
    setSelectedWeaponIds([]);
    setFeaturedWeaponId("");
    setGachaProbabilityMap(buildEqualProbabilityMap([]));
    fetchGachaProducts();
  };

  const toggleActive = async (item: any) => {
    const { error } = await supabase.from("point_shop_items").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) return showToast(error.message, "error");
    fetchItems();
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm("상품을 완전히 삭제할까요?")) return;
    const { error } = await supabase.from("point_shop_items").delete().eq("id", itemId);
    if (error) return showToast(error.message, "error");
    fetchItems();
  };

  const toggleGachaActive = async (item: any) => {
    const { error } = await supabase.from("weapon_gacha_products").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) return showToast(error.message, "error");
    fetchGachaProducts();
  };

  const deleteGachaProduct = async (itemId: string) => {
    if (!confirm("이 뽑기 상품을 삭제할까요?")) return;
    const client = getSupabaseOrThrow();
    await client.from("weapon_gacha_reward_items").delete().eq("product_id", itemId);
    const { error } = await client.from("weapon_gacha_products").delete().eq("id", itemId);
    if (error) return showToast(error.message, "error");
    fetchGachaProducts();
  };

  const deleteWeaponPart = async (weaponId: string) => {
    if (!confirm("이 무기 파츠를 삭제할까요?")) return;
    const { error } = await supabase.from("weapon_parts").delete().eq("id", weaponId);
    if (error) return showToast(error.message, "error");
    fetchWeaponParts();
    fetchGachaProducts();
  };

  const previewItem = {
    title: title || (rewardType === "badge" ? "신규 뱃지 상품" : "초급 강화석"),
    badge_name: title || "신규 뱃지 상품",
    description:
      description ||
      (rewardType === "badge"
        ? "길드 카드에 특별한 분위기를 더하는 뱃지 상품입니다.\n구매 직후 마이룸에서 착용할 수 있습니다."
        : "마이룸에서 무기 강화 시 자동으로 사용되는 강화 보조 아이템입니다."),
    price: toNumber(price) || 500,
    reward_type: rewardType,
    badge_color: badgeColor,
    badge_card_effect: rewardType === "badge" ? badgeCardEffect : "none",
    badge_gradient_from: badgeGradientFrom,
    badge_gradient_to: badgeGradientTo,
    badge_glow_color: badgeGlowColor,
    enhance_bonus_rate: rewardType === "enhance_stone" ? Number(enhanceBonusRate || 0) : 0,
    is_active: true,
    available_from: availableFrom ? new Date(availableFrom).toISOString() : null,
    available_to: availableTo ? new Date(availableTo).toISOString() : null,
  };

  const previewTheme = getBadgeVisualTheme(previewItem);
  const previewHighlights = getShopItemHighlights(previewItem);
  const previewCardBackground = getPointShopCardBackground(previewItem, previewTheme);
  const previewAuraBackground = getPointShopAuraBackground(previewItem, previewTheme);

  const gachaPreviewWeapons = weaponParts
    .filter((item: any) => selectedWeaponIds.includes(String(item.id)))
    .map((item: any) => ({
      ...item,
      probability: getProbabilityNumber(gachaProbabilityMap[String(item.id)]),
    }))
    .sort((a: any, b: any) => getProbabilityNumber(b.probability) - getProbabilityNumber(a.probability));

  return (
    <div className="space-y-10">
      <div className="rounded-[2rem] border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "badge", label: "뱃지" },
            { key: "weapon_parts", label: "무기파츠" },
            { key: "gacha", label: "가챠" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setProductAdminTab(tab.key as "badge" | "weapon_parts" | "gacha");
                if (tab.key === "badge") {
                  setRewardType("badge");
                  setManagerTab("guild");
                }
              }}
              className={cn(
                "px-5 py-3 rounded-2xl text-sm font-semibold transition-all border",
                productAdminTab === tab.key
                  ? "bg-amber-500 border-amber-400 text-white shadow-[0_0_30px_rgba(245,158,11,0.22)]"
                  : "bg-white/[0.04] border-white/10 text-slate-400 hover:bg-white/[0.08] hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {productAdminTab === "badge" ? (
      <>
      <div className="grid xl:grid-cols-[1.05fr,0.95fr] gap-6">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b1020] p-6 space-y-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] font-semibold text-amber-200">Point Shop Item Builder</div>
            <div className="mt-2 text-2xl font-semibold">포인트샵 상품 생성</div>
            <div className="text-sm text-slate-400 mt-1">길드/닉네임/무기/강화석 탭으로 분리해서 관리할 수 있어.</div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <AdminInput label="상품명" value={title} onChange={setTitle} placeholder={rewardType === "badge" ? "예: 여왕의 빛 뱃지" : rewardType === "nickname_effect" ? "예: 황혼 그라데이션 닉네임" : "예: 고급 강화석"} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-2 block">상품 타입</label>
              <select
                className="w-full h-[58px] bg-black border border-white/10 rounded-2xl px-4"
                value={rewardType}
                onChange={(e) => {
                  const nextType = e.target.value as "badge" | "enhance_stone" | "nickname_effect";
                  setRewardType(nextType);
                  if (nextType === "nickname_effect") setManagerTab("nickname");
                  else if (nextType === "enhance_stone") setManagerTab("enhance_stone");
                  else setManagerTab("guild");
                }}
              >
                <option value="badge">뱃지 상품</option>
                <option value="enhance_stone">강화석 상품</option>
                <option value="nickname_effect">닉네임 효과 상품</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <AdminInput label="가격(포인트)" value={price} onChange={setPrice} placeholder="예: 800" />
            {rewardType === "enhance_stone" ? (
              <AdminInput label="강화확률 증가 효과(%)" value={enhanceBonusRate} onChange={setEnhanceBonusRate} placeholder="예: 7" />
            ) : (
              <div>
                <label className="text-xs text-slate-400 mb-2 block">대표 색상</label>
                <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={badgeColor} onChange={(e) => setBadgeColor(e.target.value)} />
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest ml-1">설명</label>
            <textarea
              className="mt-3 w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-amber-400 font-bold text-sm text-white min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={rewardType === "badge" ? "상품 설명 / 구매 욕구 자극 문구" : rewardType === "nickname_effect" ? "예: 마이룸 닉네임에 그라데이션과 글로우를 적용" : "예: 무기 강화 시 성공 확률을 높여주는 보조 아이템"}
            />
          </div>

          {rewardType === "nickname_effect" && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">닉네임 이펙트 프리셋</label>
                  <select className="w-full h-[58px] bg-black border border-white/10 rounded-2xl px-4" value={nicknameEffectKey} onChange={(e) => setNicknameEffectKey(e.target.value as NicknameEffectKey)}>
                    {Object.entries(NICKNAME_EFFECT_PRESETS).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="text-xs text-slate-400">미리보기</div>
                  <div className="mt-3 text-2xl font-semibold" style={getNicknameEffectStyle({ nickname_effect_key: nicknameEffectKey, nickname_gradient_from: nicknameGradientFrom, nickname_gradient_to: nicknameGradientTo, nickname_glow_color: nicknameGlowColor })}>
                    {title || "닉네임 EFFECT"}
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">시작 색상</label>
                  <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={nicknameGradientFrom} onChange={(e) => setNicknameGradientFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">끝 색상</label>
                  <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={nicknameGradientTo} onChange={(e) => setNicknameGradientTo(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">글로우 색상</label>
                  <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={nicknameGlowColor} onChange={(e) => setNicknameGlowColor(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {rewardType === "badge" && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">카드 이펙트 프리셋</label>
                  <select
                    className="w-full h-[58px] bg-black border border-white/10 rounded-2xl px-4"
                    value={badgeCardEffect}
                    onChange={(e) => setBadgeCardEffect(e.target.value as BadgeEffectKey)}
                  >
                    {Object.entries(BADGE_CARD_EFFECT_PRESETS).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">시작</label>
                    <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={badgeGradientFrom} onChange={(e) => setBadgeGradientFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">끝</label>
                    <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={badgeGradientTo} onChange={(e) => setBadgeGradientTo(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-2 block">글로우</label>
                    <input type="color" className="w-full h-[58px] bg-black border border-white/10 rounded-2xl p-2" value={badgeGlowColor} onChange={(e) => setBadgeGlowColor(e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <AdminInput label="판매 시작" type="datetime-local" value={availableFrom} onChange={setAvailableFrom} />
            <AdminInput label="판매 종료" type="datetime-local" value={availableTo} onChange={setAvailableTo} />
          </div>

          <button
            onClick={createItem}
            className="w-full bg-amber-500 p-4 rounded-2xl font-semibold uppercase hover:bg-amber-400 transition-all"
          >
            {rewardType === "badge" ? "뱃지 상품 생성" : rewardType === "nickname_effect" ? "닉네임 상품 생성" : "강화석 상품 생성"}
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border p-5 relative overflow-hidden" style={{ background: rewardType === "badge" ? previewTheme.cardBackground : "linear-gradient(135deg, rgba(251,191,36,0.16), rgba(139,92,246,0.16), rgba(15,23,42,0.94))", borderColor: rewardType === "badge" ? previewTheme.cardBorder : "rgba(250,204,21,0.28)", boxShadow: rewardType === "badge" ? previewTheme.cardShadow : "0 0 0 1px rgba(250,204,21,0.12) inset, 0 24px 48px rgba(250,204,21,0.12)" }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: rewardType === "badge" ? previewTheme.aura : "radial-gradient(circle at top right, rgba(250,204,21,0.22), transparent 40%)" }} />
            <div className="relative z-10">
              <div className="text-[10px] uppercase tracking-[0.28em] font-semibold" style={{ color: rewardType === "badge" ? previewTheme.chipText : "#fde68a" }}>
                {rewardType === "badge" ? "Guild Card Live Preview" : rewardType === "nickname_effect" ? "Nickname Effect Preview" : "Enhance Item Preview"}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-black/25 border border-white/10 flex items-center justify-center">
                  <ShoppingBag className="text-white/80" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold truncate">{previewItem.title}</div>
                  <div className="text-sm text-white/70">
                    {rewardType === "badge" ? previewTheme.label : rewardType === "nickname_effect" ? getNicknameEffectTheme(previewItem).label : getEnhancementItemEffectText(previewItem)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0b1020] p-5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-90 pointer-events-none" style={{ background: previewCardBackground }} />
            <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: previewAuraBackground }} />
            <div className="relative z-10">
              <div className="text-[10px] uppercase tracking-[0.28em] font-semibold text-white/70">Point Shop Live Preview</div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border border-white/10 bg-white/5 text-white/70">
                      {getShopRewardTypeLabel(previewItem)}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border" style={{ color: rewardType === "badge" ? previewTheme.chipText : "#fde68a", borderColor: rewardType === "badge" ? previewTheme.chipBorder : "rgba(250,204,21,0.35)", background: rewardType === "badge" ? previewTheme.chipBackground : "rgba(245,158,11,0.16)" }}>
                      {getShopItemStatusText(previewItem)}
                    </span>
                  </div>
                  <div className="mt-4 text-2xl font-semibold leading-tight break-words">{previewItem.title}</div>
                  <div className="mt-2 text-sm text-white/70">{getShopMoodLine(previewItem)}</div>
                </div>
                <div className="h-14 w-14 rounded-[1.2rem] border border-white/10 bg-black/25 flex items-center justify-center backdrop-blur-md">
                  <ShoppingBag className="text-white/80" />
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-bold text-white/85">상품 포인트 미리보기</div>
                <div className="mt-3 space-y-2">
                  {previewHighlights.map((line, index) => (
                    <div key={`preview-highlight-${index}`} className="text-sm text-white/75">
                      • {line}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-3xl font-semibold">{previewItem.price}P</div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-4xl">
        <SectionPanel title="등록된 포인트샵 상품" description="뱃지와 강화석 상품을 함께 관리할 수 있어.">
            <div className="space-y-4">
              {items.filter((item) => item.reward_type === "badge").map((item) => {
                const badgeTheme = getBadgeVisualTheme(item);
                return (
                  <div key={item.id} className="rounded-[1.75rem] border border-white/10 bg-[#0b1020] p-5 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-90 pointer-events-none" style={{ background: getPointShopCardBackground(item, badgeTheme) }} />
                    <div className="absolute inset-0 pointer-events-none opacity-60" style={{ background: getPointShopAuraBackground(item, badgeTheme) }} />
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border border-white/10 bg-white/5 text-white/70">
                            {getShopRewardTypeLabel(item)}
                          </span>
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border"
                            style={{
                              color: item.reward_type === "badge" ? badgeTheme.chipText : "#fde68a",
                              borderColor: item.reward_type === "badge" ? badgeTheme.chipBorder : "rgba(250,204,21,0.35)",
                              background: item.reward_type === "badge" ? badgeTheme.chipBackground : "rgba(245,158,11,0.16)",
                            }}
                          >
                            {item.reward_type === "enhance_stone" ? getEnhancementItemEffectText(item) : getShopItemStatusText(item)}
                          </span>
                        </div>
                        <div className="mt-3 text-xl font-semibold break-words">{item.title}</div>
                        <div className="mt-2 text-sm text-white/70">{getShopMoodLine(item)}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-semibold text-amber-200">{item.price}P</div>
                        <div className="text-xs text-slate-500">{item.reward_type === "badge" ? "뱃지 상품" : "강화석 상품"}</div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => toggleActive(item)} className="px-4 py-2 rounded-xl bg-white/10 font-semibold text-sm">
                        {item.is_active ? "비활성화" : "활성화"}
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="px-4 py-2 rounded-xl bg-red-500/85 font-semibold text-sm">
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionPanel>
      </div>
      </>
      ) : (
      <div className="grid xl:grid-cols-[0.95fr,1.05fr] gap-6">
        <div className={cn("rounded-[2rem] border border-white/10 bg-[#0b1020] p-6 space-y-6", productAdminTab !== "weapon_parts" && "hidden")}>
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] font-semibold text-amber-200">Weapon Part Builder</div>
            <div className="mt-2 text-2xl font-semibold">장비 파츠 [무기] 등록</div>
            <div className="text-sm text-slate-400 mt-1">뽑기 보상으로 들어갈 실제 무기 파츠를 먼저 만들어.</div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <AdminInput label="무기 이름" value={weaponName} onChange={setWeaponName} placeholder="예: 별빛 대검" />
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest ml-1">희귀도</label>
              <select className="mt-3 w-full bg-black border border-white/10 p-5 rounded-2xl" value={weaponRarity} onChange={(e) => setWeaponRarity(e.target.value as WeaponRarityKey)}>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest ml-1">무기 설명</label>
            <textarea
              className="mt-3 w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-amber-400 font-bold text-sm text-white min-h-[120px]"
              value={weaponDescription}
              onChange={(e) => setWeaponDescription(e.target.value)}
              placeholder="길드 캐릭터 카드에 표시될 무기 설명"
            />
          </div>

          <div className="space-y-3">
            <ImageUploader
              label="무기 이미지 첨부"
              folder="weapon-parts"
              onUpload={(url) => {
                setWeaponImageUrl(url);
                showToast("무기 이미지 첨부 완료!", "success");
              }}
            />
            {weaponImageUrl && (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="mb-2 text-xs text-slate-400">첨부 이미지 미리보기</div>
                <img src={weaponImageUrl} className="h-40 w-full rounded-2xl object-cover" />
              </div>
            )}
          </div>

          <button onClick={createWeaponPart} className="w-full bg-amber-500 p-4 rounded-2xl font-semibold uppercase hover:bg-amber-400 transition-all">
            무기 파츠 등록
          </button>

          <SectionPanel title="등록된 무기 파츠" description="가챠 보상과 마이룸 장착에 쓰이는 무기 목록">
            <div className="space-y-3">
              {weaponParts.map((weapon: any) => {
                const theme = getWeaponTheme(weapon);
                return (
                  <div key={weapon.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center gap-4">
                    <WeaponImage weapon={weapon} className="h-14 w-14 rounded-2xl shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-semibold truncate">{weapon.name}</div>
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold border" style={{ color: theme.text, borderColor: theme.border, background: theme.background }}>
                          {theme.label}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-slate-400">{weapon.description || "설명 없음"}</div>
                    </div>
                    <button onClick={() => deleteWeaponPart(weapon.id)} className="px-4 py-2 rounded-xl bg-red-500/85 font-semibold text-sm">
                      삭제
                    </button>
                  </div>
                );
              })}
            </div>
          </SectionPanel>
        </div>

        <div className="space-y-6">
          <div className={cn("rounded-[2rem] border border-white/10 bg-[#0b1020] p-6 space-y-6", productAdminTab !== "gacha" && "hidden")}>
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] font-semibold text-amber-200">Weapon Gacha Builder</div>
              <div className="mt-2 text-2xl font-semibold">무기 가챠 상품 생성</div>
              <div className="text-sm text-slate-400 mt-1">원하는 무기 파츠를 선택하고 확률을 지정해 가챠 상품을 만든다.</div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <AdminInput label="뽑기명" value={gachaTitle} onChange={setGachaTitle} placeholder="예: 월광 무기 가챠" />
              <AdminInput label="가격(포인트)" value={gachaPrice} onChange={setGachaPrice} placeholder="예: 120" />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest ml-1">설명</label>
              <textarea
                className="mt-3 w-full bg-black border border-white/10 p-5 rounded-2xl outline-none focus:border-amber-400 font-bold text-sm text-white min-h-[110px]"
                value={gachaDescription}
                onChange={(e) => setGachaDescription(e.target.value)}
                placeholder="가챠 상세 설명"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <AdminInput label="대표 이미지 URL" value={gachaImageUrl} onChange={setGachaImageUrl} placeholder="https://..." />
              <AdminInput label="프로모션 문구" value={gachaPromoText} onChange={setGachaPromoText} placeholder="예: 10회 내 Rare 이상 1개 보장" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <AdminInput label="판매 시작" type="datetime-local" value={gachaAvailableFrom} onChange={setGachaAvailableFrom} />
              <AdminInput label="판매 종료" type="datetime-local" value={gachaAvailableTo} onChange={setGachaAvailableTo} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold mb-3">보상 무기 선택</div>
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {weaponParts.map((weapon: any) => {
                  const selected = selectedWeaponIds.includes(String(weapon.id));
                  return (
                    <label key={weapon.id} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => handleWeaponSelectionChange(String(weapon.id), e.target.checked)}
                        className="mt-1"
                      />
                      <WeaponImage weapon={weapon} className="h-12 w-12 rounded-2xl shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{weapon.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{weapon.description || "설명 없음"}</div>
                        {selected && (
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <AdminInput
                              label="확률(%)"
                              value={gachaProbabilityMap[String(weapon.id)] || ""}
                              onChange={(value: string) => updateProbability(String(weapon.id), value)}
                              placeholder="예: 12.5"
                            />
                            <div>
                              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest ml-1">대표 무기 여부</label>
                              <button
                                type="button"
                                onClick={() => setFeaturedWeaponId(String(weapon.id))}
                                className={cn(
                                  "mt-3 w-full h-[58px] rounded-2xl border font-semibold text-sm",
                                  featuredWeaponId === String(weapon.id) ? "bg-amber-500 border-amber-400 text-white" : "bg-black border-white/10 text-slate-400"
                                )}
                              >
                                {featuredWeaponId === String(weapon.id) ? "대표 무기" : "대표로 설정"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              <div className={cn("mt-4 text-sm font-semibold", isProbabilityValid ? "text-amber-200" : "text-amber-200")}>
                확률 총합: {formatProbabilityText(totalProbability)}
              </div>
            </div>

            <button onClick={createGachaProduct} className="w-full bg-amber-500 p-4 rounded-2xl font-semibold uppercase hover:bg-amber-400 transition-all">
              무기 가챠 생성
            </button>

            {gachaPreviewWeapons.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-semibold mb-3">가챠 보상 미리보기</div>
                <div className="space-y-3">
                  {gachaPreviewWeapons.map((weapon: any) => (
                    <div key={`preview-${weapon.id}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-3">
                      <WeaponImage weapon={weapon} className="h-12 w-12 rounded-2xl shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{weapon.name}</div>
                        <div className="text-xs text-slate-400">{formatProbabilityText(weapon.probability)}</div>
                      </div>
                      {featuredWeaponId === String(weapon.id) && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold border border-amber-300/30 bg-amber-300/12 text-amber-100">
                          Featured
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

                    {productAdminTab === "gacha" && (
          <SectionPanel title="등록된 무기 가챠 상품" description="가챠 상품과 연결된 무기 확률을 함께 확인.">
            <div className="space-y-4">
              {gachaProducts.map((item: any) => {
                const rewards = gachaRewardMap[String(item.id)] || [];
                return (
                  <div key={item.id} className="rounded-[1.75rem] border border-white/10 bg-[#0b1020] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border border-white/10 bg-white/5 text-white/70">
                            Weapon Gacha
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.24em] font-semibold border border-amber-400/30 bg-amber-400/15 text-amber-200">
                            {getWeaponGachaStatusText(item)}
                          </span>
                        </div>
                        <div className="mt-3 text-xl font-semibold break-words">{item.title}</div>
                        <div className="mt-2 text-sm text-white/70">{item.promo_text || item.description || "설명 없음"}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-semibold text-amber-200">{item.price}P</div>
                        <div className="text-xs text-slate-500">보상 {rewards.length}종</div>
                      </div>
                    </div>

                    {rewards.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {rewards.map((reward: any, index: number) => (
                          <div key={`${item.id}-reward-${index}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                            <WeaponImage weapon={reward} className="h-10 w-10 rounded-xl shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold truncate">{reward.name}</div>
                              <div className="text-xs text-slate-400">{formatProbabilityText(reward.probability)}</div>
                            </div>
                            {reward.is_featured && (
                              <span className="px-2 py-1 rounded-full text-[10px] font-semibold border border-amber-300/30 bg-amber-300/12 text-amber-100">
                                Featured
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <button onClick={() => toggleGachaActive(item)} className="px-4 py-2 rounded-xl bg-white/10 font-semibold text-sm">
                        {item.is_active ? "비활성화" : "활성화"}
                      </button>
                      <button onClick={() => deleteGachaProduct(item.id)} className="px-4 py-2 rounded-xl bg-red-500/85 font-semibold text-sm">
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionPanel>
          )}
        </div>
      </div>
      )}
    </div>

  );
};
