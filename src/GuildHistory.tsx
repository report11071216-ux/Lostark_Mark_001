/**
 * GuildHistory.tsx
 * ─────────────────────────────────────────────────────────────
 * 길드 박물관 / 타임캡슐 / 시즌 다큐멘터리
 *
 * Supabase 테이블: guild_history_items
 * 컬럼: id, created_at, season_label, title, description,
 *        image_urls (text[]), tags (text[]), author_name,
 *        highlight (bool), category ('moment'|'achievement'|'season'|'memory')
 *
 * App.tsx에 추가:
 *  1) import { GuildHistory } from "./GuildHistory";
 *  2) {activeTab === "guild_history" && <GuildHistory user={user} profile={profile} />}
 *  3) sidebar 메뉴: { id: "guild_history", icon: "🏛️", label: "길드 히스토리" }
 * ─────────────────────────────────────────────────────────────
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Camera,
  Crown,
  Flame,
  Globe,
  Heart,
  Image as ImageIcon,
  Plus,
  Search,
  Sparkles,
  Star,
  Trophy,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Loader2,
  Filter,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase 클라이언트 (기존 app.tsx 와 동일 env) ─────────────
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// ── Types ───────────────────────────────────────────────────
type Category = "moment" | "achievement" | "season" | "memory";

type HistoryItem = {
  id: string;
  created_at: string;
  season_label: string | null;
  title: string;
  description: string | null;
  image_urls: string[];
  tags: string[];
  author_name: string | null;
  highlight: boolean;
  category: Category;
};

type FormState = {
  season_label: string;
  title: string;
  description: string;
  image_urls: string[];
  tags: string;
  author_name: string;
  highlight: boolean;
  category: Category;
};

// ── Utils ───────────────────────────────────────────────────
const cn = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(" ");

const formatKR = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ── Constants ────────────────────────────────────────────────
const CATEGORY_META: Record<
  Category,
  { label: string; icon: React.ReactNode; color: string; glow: string }
> = {
  moment: {
    label: "명장면",
    icon: <Camera size={13} />,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
  },
  achievement: {
    label: "업적",
    icon: <Trophy size={13} />,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.25)",
  },
  season: {
    label: "시즌",
    icon: <Globe size={13} />,
    color: "#34d399",
    glow: "rgba(52,211,153,0.25)",
  },
  memory: {
    label: "추억",
    icon: <Heart size={13} />,
    color: "#fb7185",
    glow: "rgba(251,113,133,0.25)",
  },
};

const EMPTY_FORM: FormState = {
  season_label: "",
  title: "",
  description: "",
  image_urls: [],
  tags: "",
  author_name: "",
  highlight: false,
  category: "moment",
};

// ── Lightbox ─────────────────────────────────────────────────
const Lightbox = ({
  images,
  index,
  onClose,
}: {
  images: string[];
  index: number;
  onClose: () => void;
}) => {
  const [cur, setCur] = useState(index);
  const prev = () => setCur((i) => (i - 1 + images.length) % images.length);
  const next = () => setCur((i) => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="absolute right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
      <motion.img
        key={cur}
        src={images[cur]}
        alt=""
        className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-6 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCur(i); }}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === cur ? "w-6 bg-white" : "w-1.5 bg-white/30"
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ── HistoryCard ──────────────────────────────────────────────
const HistoryCard = ({
  item,
  isAdmin,
  onDelete,
  onEdit,
}: {
  item: HistoryItem;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onEdit: (item: HistoryItem) => void;
}) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.moment;
  const hasImages = item.image_urls && item.image_urls.length > 0;

  return (
    <>
      <AnimatePresence>
        {lightboxIdx !== null && (
          <Lightbox
            images={item.image_urls}
            index={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
          />
        )}
      </AnimatePresence>

      <motion.article
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative rounded-3xl border overflow-hidden transition-all duration-300 group",
          "bg-gradient-to-b from-[#0d1117]/95 to-[#080b10]/95",
          item.highlight
            ? "border-amber-400/30 shadow-[0_0_30px_-8px_rgba(245,158,11,0.2)]"
            : "border-white/[0.07] hover:border-white/[0.13]"
        )}
        style={
          item.highlight
            ? { boxShadow: `0 0 40px -12px ${meta.glow}` }
            : undefined
        }
      >
        {/* Highlight ribbon */}
        {item.highlight && (
          <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/25 text-amber-300 text-[10px] font-bold tracking-wider uppercase">
            <Star size={10} fill="currentColor" />
            명예의 전당
          </div>
        )}

        {/* Image strip */}
        {hasImages && (
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-black/40">
            <img
              src={item.image_urls[imgIdx]}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03] cursor-pointer"
              onClick={() => setLightboxIdx(imgIdx)}
            />
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080b10] via-transparent to-transparent pointer-events-none" />

            {/* Multi-image nav */}
            {item.image_urls.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgIdx((i) => (i - 1 + item.image_urls.length) % item.image_urls.length);
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgIdx((i) => (i + 1) % item.image_urls.length);
                  }}
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {item.image_urls.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-1 rounded-full transition-all",
                        i === imgIdx ? "w-4 bg-white" : "w-1 bg-white/40"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category badge */}
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
              style={{
                color: meta.color,
                backgroundColor: meta.glow,
                borderColor: `${meta.color}40`,
              }}
            >
              {meta.icon}
              {meta.label}
            </span>

            {/* Season label */}
            {item.season_label && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.06] border border-white/[0.09] text-slate-300">
                <Sparkles size={10} />
                {item.season_label}
              </span>
            )}

            {/* Date */}
            <span className="ml-auto text-[11px] text-slate-500">
              {formatKR(item.created_at)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-white leading-snug tracking-tight">
            {item.title}
          </h3>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap line-clamp-4">
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[11px] bg-white/[0.05] text-slate-400 border border-white/[0.07]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            {item.author_name ? (
              <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <Crown size={11} className="text-amber-400/60" />
                {item.author_name}
              </span>
            ) : (
              <span />
            )}

            {isAdmin && (
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(item)}
                  className="h-7 w-7 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-blue-300 hover:border-blue-400/30 transition-all"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-300 hover:border-rose-400/30 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.article>
    </>
  );
};

// ── HighlightHero (명예의 전당 상단 배너) ────────────────────
const HighlightHero = ({
  items,
}: {
  items: HistoryItem[];
}) => {
  const [idx, setIdx] = useState(0);
  const heroItems = items.filter((i) => i.highlight).slice(0, 5);
  if (heroItems.length === 0) return null;
  const cur = heroItems[idx];
  const meta = CATEGORY_META[cur.category] ?? CATEGORY_META.moment;

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % heroItems.length), 5000);
    return () => clearInterval(t);
  }, [heroItems.length]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden mb-8 border border-amber-400/20"
      style={{ boxShadow: "0 0 60px -20px rgba(245,158,11,0.15)" }}>
      {/* BG image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: cur.image_urls?.[0]
              ? `url(${cur.image_urls[0]})`
              : "none",
            backgroundColor: cur.image_urls?.[0] ? undefined : "#0d1117",
          }}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-[#080b10] via-[#080b10]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#080b10]/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-8 min-h-[220px] flex flex-col justify-end gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 border border-amber-400/30 text-amber-300">
            <Star size={10} fill="currentColor" />
            명예의 전당
          </span>
          <span
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
            style={{ color: meta.color, backgroundColor: meta.glow, borderColor: `${meta.color}40` }}
          >
            {meta.icon}{meta.label}
          </span>
          {cur.season_label && (
            <span className="px-2.5 py-1 rounded-full text-[11px] bg-white/10 text-white/70 border border-white/10">
              {cur.season_label}
            </span>
          )}
        </div>
        <AnimatePresence mode="wait">
          <motion.h2
            key={`title-${idx}`}
            className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
          >
            {cur.title}
          </motion.h2>
        </AnimatePresence>
        {cur.description && (
          <p className="text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed">
            {cur.description}
          </p>
        )}

        {/* Dot nav */}
        {heroItems.length > 1 && (
          <div className="flex gap-1.5 mt-1">
            {heroItems.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === idx ? "w-6 bg-amber-400" : "w-1.5 bg-white/25"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Post Form Modal ──────────────────────────────────────────
const PostModal = ({
  initial,
  isAdmin,
  onClose,
  onSave,
}: {
  initial: FormState & { id?: string };
  isAdmin: boolean;
  onClose: () => void;
  onSave: (data: FormState & { id?: string }) => Promise<void>;
}) => {
  const [form, setForm] = useState<FormState & { id?: string }>(initial);
  const [saving, setSaving] = useState(false);
  const [imgInput, setImgInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormState, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addImg = () => {
    const url = imgInput.trim();
    if (!url) return;
    set("image_urls", [...(form.image_urls || []), url]);
    setImgInput("");
  };

  const removeImg = (idx: number) =>
    set("image_urls", form.image_urls.filter((_, i) => i !== idx));

  // File → base64 → Supabase Storage (선택적)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    const ext = file.name.split(".").pop();
    const path = `guild-history/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("guild-images")
      .upload(path, file, { upsert: true });
    if (error) { alert("업로드 실패: " + error.message); return; }
    const { data: pub } = supabase.storage.from("guild-images").getPublicUrl(path);
    if (pub?.publicUrl) set("image_urls", [...form.image_urls, pub.publicUrl]);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert("제목을 입력하세요."); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e: any) {
      alert("저장 실패: " + (e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full sm:max-w-lg max-h-[95dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#0d1117] border border-white/10 shadow-2xl"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.07] sticky top-0 bg-[#0d1117]/95 backdrop-blur-md z-10">
          <h3 className="text-base font-bold text-white">
            {form.id ? "히스토리 수정" : "새 히스토리 기록"}
          </h3>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">카테고리</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
                const m = CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set("category", cat)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 rounded-2xl border text-xs font-semibold transition-all",
                      form.category === cat
                        ? "border-[var(--c)] bg-[var(--bg)] text-[var(--c)]"
                        : "border-white/[0.07] bg-white/[0.03] text-slate-500 hover:text-slate-300"
                    )}
                    style={
                      {
                        "--c": m.color,
                        "--bg": m.glow,
                      } as React.CSSProperties
                    }
                  >
                    <span style={form.category === cat ? { color: m.color } : undefined}>
                      {m.icon}
                    </span>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Season label */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">시즌 (선택)</label>
            <input
              value={form.season_label}
              onChange={(e) => set("season_label", e.target.value)}
              placeholder="예: 시즌 1, 2024 봄 시즌..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 placeholder:text-slate-600"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">제목 *</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="이 순간을 한 줄로 표현하면?"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 placeholder:text-slate-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">이야기</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="그 날의 분위기, 느낌, 에피소드를 적어주세요..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 placeholder:text-slate-600 resize-none leading-relaxed"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">기록자</label>
            <input
              value={form.author_name}
              onChange={(e) => set("author_name", e.target.value)}
              placeholder="캐릭터명 또는 닉네임"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 placeholder:text-slate-600"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">태그 (쉼표 구분)</label>
            <input
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="예: 카제로스, 첫클리어, 파티원..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 placeholder:text-slate-600"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">스크린샷 / 이미지</label>
            <div className="flex gap-2">
              <input
                value={imgInput}
                onChange={(e) => setImgInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImg(); } }}
                placeholder="이미지 URL..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/50 placeholder:text-slate-600"
              />
              <button type="button" onClick={addImg}
                className="px-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-all">
                추가
              </button>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="px-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-all flex items-center gap-1.5">
                <ImageIcon size={13} /> 파일
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
            {form.image_urls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.image_urls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="h-16 w-16 rounded-xl object-cover border border-white/10" />
                    <button
                      type="button"
                      onClick={() => removeImg(i)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Highlight toggle */}
          <label className="flex items-center gap-3 cursor-pointer py-2">
            <div
              className={cn(
                "relative h-6 w-11 rounded-full border transition-colors",
                form.highlight ? "bg-amber-400/30 border-amber-400/50" : "bg-white/[0.05] border-white/10"
              )}
              onClick={() => set("highlight", !form.highlight)}
            >
              <div
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full transition-all",
                  form.highlight ? "left-5 bg-amber-400" : "left-0.5 bg-slate-500"
                )}
              />
            </div>
            <span className="text-sm text-slate-300">명예의 전당 등록</span>
            <Star size={13} className={form.highlight ? "text-amber-400" : "text-slate-600"} fill={form.highlight ? "currentColor" : "none"} />
          </label>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300 hover:bg-white/8 transition-all">
              취소
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-[2] py-3.5 rounded-2xl bg-amber-500 text-sm font-bold text-white hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "저장 중..." : form.id ? "수정 완료" : "기록 남기기"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main GuildHistory Component ──────────────────────────────
export const GuildHistory = ({
  user,
  profile,
}: {
  user: any;
  profile: any;
}) => {
  const isAdmin = profile?.role === "admin";

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<Category | "all">("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");

  // Modal
  const [modalForm, setModalForm] = useState<(FormState & { id?: string }) | null>(null);

  // Fetch
  const fetchItems = useCallback(async () => {
    if (!supabase) {
      setError("Supabase 환경변수가 설정되지 않았습니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("guild_history_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setItems((data as HistoryItem[]) || []);
    } catch (e: any) {
      setError(e?.message ?? "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Unique seasons for filter
  const seasons = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => { if (i.season_label) s.add(i.season_label); });
    return Array.from(s);
  }, [items]);

  // Filtered list
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (catFilter !== "all" && item.category !== catFilter) return false;
      if (seasonFilter !== "all" && item.season_label !== seasonFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [items, catFilter, seasonFilter, search]);

  // Save
  const handleSave = async (form: FormState & { id?: string }) => {
    if (!supabase) throw new Error("Supabase 미연결");
    const payload = {
      season_label: form.season_label || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      image_urls: form.image_urls,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      author_name: form.author_name.trim() || null,
      highlight: form.highlight,
      category: form.category,
    };

    if (form.id) {
      const { error } = await supabase
        .from("guild_history_items")
        .update(payload)
        .eq("id", form.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("guild_history_items")
        .insert(payload);
      if (error) throw error;
    }
    await fetchItems();
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("이 기록을 삭제할까요?")) return;
    if (!supabase) return;
    await supabase.from("guild_history_items").delete().eq("id", id);
    await fetchItems();
  };

  const openCreate = () =>
    setModalForm({ ...EMPTY_FORM, author_name: profile?.character_name ?? "" });

  const openEdit = (item: HistoryItem) =>
    setModalForm({
      id: item.id,
      season_label: item.season_label ?? "",
      title: item.title,
      description: item.description ?? "",
      image_urls: item.image_urls ?? [],
      tags: (item.tags ?? []).join(", "),
      author_name: item.author_name ?? "",
      highlight: item.highlight ?? false,
      category: item.category,
    });

  return (
    <div className="min-h-screen pb-24">
      {/* ── Header ── */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen size={16} className="text-amber-400/80" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400/70">
                Guild Archive
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              길드 히스토리
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              우리가 함께 만들어온 순간들
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 text-sm font-bold text-white hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 shrink-0"
            >
              <Plus size={15} />
              기록 추가
            </button>
          )}
        </div>
      </div>

      <div className="px-4 space-y-6 mt-4">
        {/* Hero banner */}
        {!loading && <HighlightHero items={items} />}

        {/* Search & Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목, 내용, 태그 검색..."
              className="w-full bg-black/40 border border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40 placeholder:text-slate-600"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCatFilter("all")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                catFilter === "all"
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-white/[0.07] text-slate-500 hover:text-slate-300"
              )}
            >
              <Filter size={11} /> 전체
            </button>
            {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
              const m = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCatFilter(catFilter === cat ? "all" : cat)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0"
                  )}
                  style={
                    catFilter === cat
                      ? { color: m.color, backgroundColor: m.glow, borderColor: `${m.color}40` }
                      : { color: "rgba(100,116,139,1)", borderColor: "rgba(255,255,255,0.07)" }
                  }
                >
                  {m.icon} {m.label}
                </button>
              );
            })}
          </div>

          {/* Season filter */}
          {seasons.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSeasonFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0",
                  seasonFilter === "all"
                    ? "bg-white/10 border-white/20 text-white"
                    : "border-white/[0.07] text-slate-500 hover:text-slate-300"
                )}
              >
                전체 시즌
              </button>
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeasonFilter(seasonFilter === s ? "all" : s)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border shrink-0",
                    seasonFilter === s
                      ? "bg-emerald-400/15 border-emerald-400/30 text-emerald-300"
                      : "border-white/[0.07] text-slate-500 hover:text-slate-300"
                  )}
                >
                  <Sparkles size={10} /> {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
            <Loader2 size={28} className="animate-spin text-amber-400/50" />
            <p className="text-sm">기록을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
            <Flame size={28} className="text-rose-400/60" />
            <p className="text-sm text-rose-300">{error}</p>
            <button onClick={fetchItems} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-all">
              다시 시도
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
            <BookOpen size={28} className="text-slate-600" />
            <p className="text-sm">아직 기록된 히스토리가 없습니다.</p>
            {isAdmin && (
              <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-400/25 text-sm text-amber-300 hover:bg-amber-500/25 transition-all">
                첫 번째 기록 남기기
              </button>
            )}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            layout
          >
            <AnimatePresence>
              {filtered.map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                  onEdit={openEdit}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalForm && (
          <PostModal
            initial={modalForm}
            isAdmin={isAdmin}
            onClose={() => setModalForm(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GuildHistory;
