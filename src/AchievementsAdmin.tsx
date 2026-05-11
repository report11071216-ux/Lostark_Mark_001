/* ────────────────────────────────────────────────────────────────────
 *  AchievementsAdmin.tsx
 *  ─ 업적 시스템 관리자 패널 (5개 섹션)
 *  ─ profile.role === 'admin' 인 사용자만 접근 (호출부에서 가드)
 *  ─ DB: achievement_page_config / tiers / rarities / achievements / titles
 * ──────────────────────────────────────────────────────────────────── */

import React, { useCallback, useEffect, useState } from "react";
import {
  Settings,
  Type,
  Palette,
  Layers,
  Award,
  Crown,
  Plus,
  Trash2,
  Save,
  X,
  Edit3,
  AlertTriangle,
  Check,
} from "lucide-react";

/* ════════════ Helpers ════════════ */
const cn = (...a: any[]) => a.filter(Boolean).join(" ");

/* ════════════ Types ════════════ */
type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";
type Category = "raid" | "social" | "dedication" | "support" | "hidden";

type PageConfig = Record<string, any>;
type TierRow = any;
type RarityRow = any;
type Achievement = any;
type Title = any;

type Props = {
  supabase: any;
  user: any;
  profile: any;
};

/* ════════════ 메인 패널 ════════════ */
export const AchievementsAdmin: React.FC<Props> = ({ supabase, user, profile }) => {
  const isAdmin = profile?.role === "admin";

  const [section, setSection] = useState<"text" | "design" | "tiers" | "achievements" | "titles" | "grant">("text");
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const showToast = (msg: string, kind: "ok" | "err" = "ok") => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2500);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">접근 권한이 없습니다</h2>
        <p className="text-sm text-slate-400 mt-2">관리자만 이 페이지에 접근할 수 있어요.</p>
      </div>
    );
  }

  const sections = [
    { key: "text",         label: "페이지 문구",       icon: Type },
    { key: "design",       label: "디자인 톤",         icon: Palette },
    { key: "tiers",        label: "티어 관리",         icon: Layers },
    { key: "achievements", label: "업적 관리",         icon: Award },
    { key: "titles",       label: "칭호 & 레어도",     icon: Crown },
    { key: "grant",        label: "수여 (수동 부여)",   icon: Plus },
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-8 sm:py-12">
      {/* 헤더 */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-amber-300/70 font-semibold">Achievements Admin</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">업적 시스템 관리</h1>
        <p className="text-sm text-slate-400 mt-1">페이지 문구·디자인·티어·업적·칭호를 자유롭게 편집하세요.</p>
      </header>

      {/* 섹션 탭 */}
      <div className="mb-8 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
          {sections.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSection(s.key as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all",
                  active
                    ? "bg-amber-500/20 border border-amber-400/40 text-amber-100"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 본문 */}
      {section === "text" && <TextSection supabase={supabase} user={user} showToast={showToast} />}
      {section === "design" && <DesignSection supabase={supabase} user={user} showToast={showToast} />}
      {section === "tiers" && <TiersSection supabase={supabase} showToast={showToast} />}
      {section === "achievements" && <AchievementsSection supabase={supabase} showToast={showToast} />}
      {section === "titles" && <TitlesSection supabase={supabase} showToast={showToast} />}
      {section === "grant" && <GrantSection supabase={supabase} showToast={showToast} />}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className={cn(
            "px-5 py-3 rounded-xl border shadow-2xl text-sm font-semibold",
            toast.kind === "ok" ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-100" : "bg-rose-500/20 border-rose-400/40 text-rose-100"
          )}>
            {toast.kind === "ok" ? "✓ " : "✗ "}{toast.msg}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
 *  1. 페이지 문구
 * ═══════════════════════════════════════════════════════ */

const TEXT_FIELDS: { key: string; label: string; type: "text" | "textarea"; group: string }[] = [
  { key: "header_eyebrow",  label: "헤더 캐치프레이즈 (영문 소제목)", type: "text",     group: "헤더" },
  { key: "header_title",    label: "헤더 메인 제목",                 type: "text",     group: "헤더" },
  { key: "header_subtitle", label: "헤더 부제 (2줄 가능)",           type: "textarea", group: "헤더" },
  { key: "tab_overview",     label: "탭: 개요",       type: "text", group: "탭 라벨" },
  { key: "tab_achievements", label: "탭: 업적",       type: "text", group: "탭 라벨" },
  { key: "tab_titles",       label: "탭: 칭호",       type: "text", group: "탭 라벨" },
  { key: "tab_hall",         label: "탭: 명예의 전당", type: "text", group: "탭 라벨" },
  { key: "tab_mvp",          label: "탭: 시즌 MVP",    type: "text", group: "탭 라벨" },
  { key: "hero_card_label",        label: "영웅카드 티어 라벨",        type: "text", group: "섹션 헤더" },
  { key: "tier_roadmap_title",     label: "티어 로드맵 제목",         type: "text", group: "섹션 헤더" },
  { key: "tier_roadmap_subtitle",  label: "티어 로드맵 부제",         type: "text", group: "섹션 헤더" },
  { key: "recent_title",           label: "최근 업적 제목",           type: "text", group: "섹션 헤더" },
  { key: "recent_subtitle",        label: "최근 업적 부제",           type: "text", group: "섹션 헤더" },
  { key: "hall_title",             label: "명예의 전당 제목",         type: "text", group: "섹션 헤더" },
  { key: "hall_subtitle",          label: "명예의 전당 부제",         type: "text", group: "섹션 헤더" },
  { key: "mvp_title",              label: "시즌 MVP 제목",            type: "text", group: "섹션 헤더" },
  { key: "mvp_subtitle",           label: "시즌 MVP 부제",            type: "text", group: "섹션 헤더" },
  { key: "empty_achievements",  label: "업적 미달성 시 문구",    type: "text", group: "빈 상태 문구" },
  { key: "empty_hall",          label: "명전 미기록 시 문구",    type: "text", group: "빈 상태 문구" },
  { key: "empty_titles_owned",  label: "칭호 미보유 시 문구",    type: "text", group: "빈 상태 문구" },
  { key: "empty_titles_all",    label: "칭호 풀콜렉트 시 문구",  type: "text", group: "빈 상태 문구" },
  { key: "loading_text",        label: "로딩 중 문구",          type: "text", group: "빈 상태 문구" },
];

const TextSection: React.FC<{ supabase: any; user: any; showToast: (m: string, k?: "ok" | "err") => void }> = ({ supabase, user, showToast }) => {
  const [config, setConfig] = useState<PageConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("achievement_page_config").select("*").eq("id", 1).maybeSingle();
      if (error) console.error(error);
      if (data) setConfig(data);
      setLoading(false);
    })();
  }, [supabase]);

  const update = (key: string, val: any) => {
    setConfig((p: any) => ({ ...p, [key]: val }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    const payload: any = { ...config, updated_at: new Date().toISOString(), updated_by: user?.id || null };
    const { error } = await supabase.from("achievement_page_config").update(payload).eq("id", 1);
    setSaving(false);
    if (error) showToast("저장 실패: " + error.message, "err");
    else {
      showToast("저장되었습니다");
      setDirty(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">불러오는 중...</div>;

  const groups: Record<string, typeof TEXT_FIELDS> = {};
  for (const f of TEXT_FIELDS) {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([groupName, fields]) => (
        <AdminCard key={groupName} title={groupName}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    rows={2}
                    value={config[f.key] ?? ""}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40 resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={config[f.key] ?? ""}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40"
                  />
                )}
              </div>
            ))}
          </div>
        </AdminCard>
      ))}

      <StickySaveBar dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
 *  2. 디자인 톤
 * ═══════════════════════════════════════════════════════ */

const DesignSection: React.FC<{ supabase: any; user: any; showToast: (m: string, k?: "ok" | "err") => void }> = ({ supabase, user, showToast }) => {
  const [config, setConfig] = useState<PageConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("achievement_page_config").select("*").eq("id", 1).maybeSingle();
      if (data) setConfig(data);
      setLoading(false);
    })();
  }, [supabase]);

  const update = (key: string, val: any) => {
    setConfig((p: any) => ({ ...p, [key]: val }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("achievement_page_config")
      .update({
        primary_accent: config.primary_accent,
        secondary_accent: config.secondary_accent,
        background_glow_1: config.background_glow_1,
        background_glow_2: config.background_glow_2,
        noise_enabled: config.noise_enabled,
        ornament_enabled: config.ornament_enabled,
        medallion_animation: config.medallion_animation,
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) showToast("저장 실패: " + error.message, "err");
    else { showToast("저장되었습니다"); setDirty(false); }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <AdminCard title="컬러 톤">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ColorField label="메인 액센트 (골드 계열 추천)"  value={config.primary_accent}    onChange={(v) => update("primary_accent", v)} />
          <ColorField label="보조 액센트 (보라 계열 추천)"   value={config.secondary_accent}  onChange={(v) => update("secondary_accent", v)} />
          <ColorField label="배경 글로우 1 (상단)"           value={config.background_glow_1} onChange={(v) => update("background_glow_1", v)} />
          <ColorField label="배경 글로우 2 (하단)"           value={config.background_glow_2} onChange={(v) => update("background_glow_2", v)} />
        </div>
      </AdminCard>

      <AdminCard title="시각 효과 토글">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ToggleField
            label="노이즈 텍스처"
            sub="필름같은 거친 입자감"
            checked={!!config.noise_enabled}
            onChange={(v) => update("noise_enabled", v)}
          />
          <ToggleField
            label="모서리 장식"
            sub="카드 네 모서리의 SVG 라인"
            checked={!!config.ornament_enabled}
            onChange={(v) => update("ornament_enabled", v)}
          />
          <ToggleField
            label="메달 회전 광"
            sub="티어 메달 주변 회전 글로우"
            checked={!!config.medallion_animation}
            onChange={(v) => update("medallion_animation", v)}
          />
        </div>
      </AdminCard>

      <AdminCard title="실시간 미리보기">
        <div className="relative h-32 rounded-xl overflow-hidden border border-white/10 bg-[#070912]">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-40 h-40 rounded-full opacity-30 blur-3xl" style={{ background: config.background_glow_1 }} />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-40 h-40 rounded-full opacity-30 blur-3xl" style={{ background: config.background_glow_2 }} />
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <span className="text-xs uppercase tracking-[0.4em] font-semibold" style={{ color: config.primary_accent }}>Halls of Renown</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs uppercase tracking-[0.4em] font-semibold" style={{ color: config.secondary_accent }}>Secondary</span>
          </div>
        </div>
      </AdminCard>

      <StickySaveBar dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
 *  3. 티어 관리
 * ═══════════════════════════════════════════════════════ */

const TiersSection: React.FC<{ supabase: any; showToast: (m: string, k?: "ok" | "err") => void }> = ({ supabase, showToast }) => {
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TierRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("tiers").select("*").order("sort_order");
    setTiers(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("정말 이 티어를 삭제하시겠어요?")) return;
    const { error } = await supabase.from("tiers").delete().eq("id", id);
    if (error) showToast("삭제 실패: " + error.message, "err");
    else { showToast("삭제됨"); load(); }
  };

  return (
    <div className="space-y-6">
      <AdminCard
        title="티어 목록"
        action={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-100 text-xs font-semibold hover:bg-amber-500/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> 티어 추가
          </button>
        }
      >
        {loading ? (
          <div className="py-8 text-center text-slate-500">불러오는 중...</div>
        ) : tiers.length === 0 ? (
          <div className="py-8 text-center text-slate-500">티어가 없어요. 추가해보세요.</div>
        ) : (
          <div className="space-y-2">
            {tiers.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="relative h-12 w-12 rounded-full p-[1.5px] flex-shrink-0" style={{ background: `linear-gradient(135deg, ${t.gradient_from}, ${t.gradient_to})` }}>
                  <div className="h-full w-full rounded-full bg-[#0a0d1a] flex items-center justify-center text-lg">{t.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{t.name}</span>
                    <span className="text-xs text-slate-500 font-mono">{t.min_points}P~</span>
                    {!t.enabled && <span className="text-[10px] uppercase tracking-wider text-rose-400 border border-rose-400/40 rounded px-1.5 py-0.5">비활성</span>}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{t.key} · order {t.sort_order}</div>
                </div>
                <button onClick={() => setEditing(t)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => remove(t.id)} className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {(editing || creating) && (
        <TierEditorModal
          supabase={supabase}
          tier={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { load(); setEditing(null); setCreating(false); showToast("저장되었습니다"); }}
          onError={(m) => showToast(m, "err")}
        />
      )}
    </div>
  );
};

const TierEditorModal: React.FC<{
  supabase: any;
  tier: TierRow | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}> = ({ supabase, tier, onClose, onSaved, onError }) => {
  const [form, setForm] = useState<TierRow>(tier || {
    key: "", name: "", min_points: 0,
    gradient_from: "#94A3B8", gradient_to: "#E2E8F0",
    glow_color: "rgba(148,163,184,0.4)",
    accent_color: "#94A3B8",
    icon: "🏅", flavor: "",
    sort_order: 99, enabled: true,
  });
  const [saving, setSaving] = useState(false);

  const update = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!form.key || !form.name) { onError("key와 name은 필수입니다"); return; }
    setSaving(true);
    if (tier) {
      const { id, created_at, ...rest } = form;
      const { error } = await supabase.from("tiers").update(rest).eq("id", id);
      setSaving(false);
      if (error) onError(error.message); else onSaved();
    } else {
      const { id, created_at, ...rest } = form;
      const { error } = await supabase.from("tiers").insert(rest);
      setSaving(false);
      if (error) onError(error.message); else onSaved();
    }
  };

  return (
    <Modal onClose={onClose} title={tier ? "티어 편집" : "새 티어"}>
      <div className="space-y-4">
        <div className="flex items-center justify-center py-6 rounded-xl bg-black/40 border border-white/10">
          <div className="relative h-20 w-20 rounded-full p-[2px]" style={{ background: `linear-gradient(135deg, ${form.gradient_from}, ${form.gradient_to})` }}>
            <div className="h-full w-full rounded-full bg-[#0a0d1a] flex items-center justify-center text-3xl">{form.icon}</div>
            <div className="absolute -inset-2 rounded-full opacity-60 blur-xl -z-10" style={{ background: form.glow_color }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="key (영문 식별자)"><Input value={form.key} onChange={(v) => update("key", v)} placeholder="예: silver" /></Field>
          <Field label="name (표시명)"><Input value={form.name} onChange={(v) => update("name", v)} placeholder="예: 은" /></Field>
          <Field label="min_points (최소 포인트)"><Input type="number" value={form.min_points} onChange={(v) => update("min_points", Number(v))} /></Field>
          <Field label="sort_order (정렬 순서)"><Input type="number" value={form.sort_order} onChange={(v) => update("sort_order", Number(v))} /></Field>
          <Field label="icon (이모지)"><Input value={form.icon} onChange={(v) => update("icon", v)} placeholder="🏅" /></Field>
          <Field label="flavor (영문 캐치)"><Input value={form.flavor} onChange={(v) => update("flavor", v)} placeholder="Steel and Will" /></Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ColorField label="그라데이션 시작색" value={form.gradient_from} onChange={(v) => update("gradient_from", v)} compact />
          <ColorField label="그라데이션 끝색"   value={form.gradient_to}   onChange={(v) => update("gradient_to", v)}   compact />
          <ColorField label="액센트 컬러"       value={form.accent_color}  onChange={(v) => update("accent_color", v)}  compact />
          <Field label="글로우 (rgba 권장)">
            <Input value={form.glow_color} onChange={(v) => update("glow_color", v)} placeholder="rgba(252,211,77,0.5)" />
          </Field>
        </div>

        <ToggleField label="활성화" sub="비활성 시 페이지에 노출되지 않음" checked={form.enabled} onChange={(v) => update("enabled", v)} />

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5">취소</button>
          <button onClick={save} disabled={saving} className="flex-[2] py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-400 disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════
 *  4. 업적 관리
 * ═══════════════════════════════════════════════════════ */

const CATEGORIES: { key: Category; label: string }[] = [
  { key: "raid",       label: "레이드" },
  { key: "social",     label: "소셜" },
  { key: "dedication", label: "헌신" },
  { key: "support",    label: "서포트" },
  { key: "hidden",     label: "숨겨짐" },
];

const RARITIES: { key: Rarity; label: string }[] = [
  { key: "common",    label: "Common" },
  { key: "rare",      label: "Rare" },
  { key: "epic",      label: "Epic" },
  { key: "legendary", label: "Legendary" },
  { key: "mythic",    label: "Mythic" },
];

/* ════════════ 조건 타입 정의 ════════════ */
type ConditionType =
  | "manual"
  | "points_total"
  | "raid_count"
  | "raid_difficulty"
  | "raid_night"
  | "raid_dawn"
  | "raid_weekend"
  | "support_count"
  | "post_count"
  | "note_count"
  | "social_count"
  | "streak";

const CONDITION_TYPES: { key: ConditionType; label: string; hint: string; needsDifficulty?: boolean }[] = [
  { key: "manual",          label: "수동 부여 전용",          hint: "관리자가 직접 부여할 때만 사용" },
  { key: "points_total",    label: "누적 포인트",            hint: "현재 보유 포인트 ≥ 임계값" },
  { key: "raid_count",      label: "레이드 참여 횟수",        hint: "총 참여 ≥ 임계값" },
  { key: "raid_difficulty", label: "특정 난이도 레이드",      hint: "예: 하드/나이트메어 N회 클리어", needsDifficulty: true },
  { key: "raid_night",      label: "심야 레이드 (00–05시)",  hint: "자정~새벽 5시 누적 참여" },
  { key: "raid_dawn",       label: "새벽 레이드 (06–10시)",  hint: "오전 6~10시 누적 참여" },
  { key: "raid_weekend",    label: "주말 레이드 (토/일)",     hint: "주말 누적 참여" },
  { key: "support_count",   label: "서포터 참여 횟수",        hint: "서포터로 참여 ≥ 임계값" },
  { key: "post_count",      label: "게시글 작성 수",          hint: "공지 제외 게시글 ≥ 임계값" },
  { key: "note_count",      label: "공략 노트 작성 수",       hint: "카테고리=공략 게시글 ≥ 임계값" },
  { key: "social_count",    label: "게시글+댓글 합산",        hint: "총 활동 ≥ 임계값" },
  { key: "streak",          label: "연속 출석 일수",          hint: "현재 streak ≥ 임계값" },
];

const AchievementsSection: React.FC<{ supabase: any; showToast: (m: string, k?: "ok" | "err") => void }> = ({ supabase, showToast }) => {
  const [items, setItems] = useState<Achievement[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<Category | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [aRes, tRes] = await Promise.all([
      supabase.from("achievements").select("*").order("category").order("sort_order").order("title"),
      supabase.from("titles").select("id, code, name, rarity").order("name"),
    ]);
    setItems(aRes.data || []);
    setTitles(tRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("정말 이 업적을 삭제하시겠어요? 이미 달성한 유저의 기록은 함께 삭제됩니다.")) return;
    const { error } = await supabase.from("achievements").delete().eq("id", id);
    if (error) showToast("삭제 실패: " + error.message, "err");
    else { showToast("삭제됨"); load(); }
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="space-y-6">
      <AdminCard
        title={`업적 (${items.length}개)`}
        action={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-100 text-xs font-semibold hover:bg-amber-500/30"
          >
            <Plus className="w-3.5 h-3.5" /> 업적 추가
          </button>
        }
      >
        <div className="flex flex-wrap gap-1.5 mb-4">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>전체</FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)}>{c.label}</FilterChip>
          ))}
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-500">해당 카테고리 업적이 없어요.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-black/40 flex items-center justify-center text-xl">{a.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{a.hidden ? "🔒 " : ""}{a.title}</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border" style={rarityChipStyle(a.rarity)}>{a.rarity}</span>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">{a.category}</span>
                    {a.condition_type && a.condition_type !== "manual" ? (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                        ⚡ {CONDITION_TYPES.find((c) => c.key === a.condition_type)?.label || a.condition_type} {a.condition_value ? `≥${a.condition_value}` : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-500/30 bg-slate-500/10 text-slate-400">
                        ✋ 수동
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">{a.description}</div>
                </div>
                <button onClick={() => setEditing(a)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => remove(a.id)} className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {(editing || creating) && (
        <AchievementEditorModal
          supabase={supabase}
          achievement={editing}
          titles={titles}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { load(); setEditing(null); setCreating(false); showToast("저장되었습니다"); }}
          onError={(m) => showToast(m, "err")}
        />
      )}
    </div>
  );
};

const AchievementEditorModal: React.FC<{
  supabase: any;
  achievement: Achievement | null;
  titles: Title[];
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}> = ({ supabase, achievement, titles, onClose, onSaved, onError }) => {
  const [form, setForm] = useState<Achievement>(achievement || {
    code: "", title: "", description: "",
    category: "raid", rarity: "common",
    icon: "🏆", hidden: false,
    threshold: null, point_reward: 10,
    reward_title_id: null, sort_order: 0,
    condition_type: "manual",
    condition_value: 0,
    condition_extra: {},
  });
  const [saving, setSaving] = useState(false);

  const update = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  // 현재 선택된 조건 타입의 메타 정보
  const condMeta = CONDITION_TYPES.find((c) => c.key === (form.condition_type || "manual"));

  const save = async () => {
    if (!form.code || !form.title) { onError("code와 title은 필수입니다"); return; }
    setSaving(true);
    if (achievement) {
      const { id, created_at, ...rest } = form;
      const { error } = await supabase.from("achievements").update(rest).eq("id", id);
      setSaving(false);
      if (error) onError(error.message); else onSaved();
    } else {
      const { id, created_at, ...rest } = form;
      const { error } = await supabase.from("achievements").insert(rest);
      setSaving(false);
      if (error) onError(error.message); else onSaved();
    }
  };

  return (
    <Modal onClose={onClose} title={achievement ? "업적 편집" : "새 업적"} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="code (영문 식별자, 트리거에서 사용)">
            <Input value={form.code} onChange={(v) => update("code", v)} placeholder="ach_raid_10" />
          </Field>
          <Field label="icon (이모지)">
            <Input value={form.icon} onChange={(v) => update("icon", v)} placeholder="⚔️" />
          </Field>
        </div>

        <Field label="title (제목)">
          <Input value={form.title} onChange={(v) => update("title", v)} placeholder="레이더" />
        </Field>

        <Field label="description (설명)">
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40 resize-none"
            placeholder="레이드 10회 클리어"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="category (카테고리)">
            <select value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40">
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="rarity (레어도)">
            <select value={form.rarity} onChange={(e) => update("rarity", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40">
              {RARITIES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="threshold (조건 카운트, 선택)">
            <Input type="number" value={form.threshold ?? ""} onChange={(v) => update("threshold", v === "" ? null : Number(v))} placeholder="10" />
          </Field>
          <Field label="point_reward (지급 P, 기본 10)">
            <Input type="number" value={form.point_reward ?? 10} onChange={(v) => update("point_reward", Number(v))} />
          </Field>
        </div>

        <Field label="reward_title_id (달성시 부여할 칭호, 선택)">
          <select
            value={form.reward_title_id ?? ""}
            onChange={(e) => update("reward_title_id", e.target.value || null)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40"
          >
            <option value="">― 칭호 없음 ―</option>
            {titles.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.rarity})</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <ToggleField label="hidden (숨겨진 업적)" sub="미달성시 '???' 표시" checked={form.hidden} onChange={(v) => update("hidden", v)} />
          <Field label="sort_order (정렬 순서)">
            <Input type="number" value={form.sort_order ?? 0} onChange={(v) => update("sort_order", Number(v))} />
          </Field>
        </div>

        {/* ───────────── 자동 부여 조건 ───────────── */}
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.03] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">⚡ 자동 부여 조건</span>
          </div>

          <Field label="조건 타입">
            <select
              value={form.condition_type || "manual"}
              onChange={(e) => update("condition_type", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40"
            >
              {CONDITION_TYPES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            {condMeta && (
              <p className="mt-1.5 text-[11px] text-slate-500">💡 {condMeta.hint}</p>
            )}
          </Field>

          {form.condition_type && form.condition_type !== "manual" && (
            <Field label="임계값 (이 숫자 이상이면 부여)">
              <Input
                type="number"
                value={form.condition_value ?? 0}
                onChange={(v) => update("condition_value", Number(v))}
                placeholder="예: 10"
              />
            </Field>
          )}

          {form.condition_type === "raid_difficulty" && (
            <Field label="난이도 (정확히 일치해야 카운트됨)">
              <select
                value={(form.condition_extra as any)?.difficulty ?? "하드"}
                onChange={(e) => update("condition_extra", { ...(form.condition_extra || {}), difficulty: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40"
              >
                <option value="노말">노말</option>
                <option value="하드">하드</option>
                <option value="나이트메어">나이트메어</option>
              </select>
            </Field>
          )}

          {form.condition_type === "manual" && (
            <div className="text-[11px] text-slate-500 leading-relaxed">
              수동 부여 전용 업적이에요. 활동에 따라 자동으로 부여되지 않습니다.<br/>
              아래 [<strong className="text-amber-300">칭호 & 업적 수여</strong>] 섹션에서 길드원에게 직접 수여하세요.
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5">취소</button>
          <button onClick={save} disabled={saving} className="flex-[2] py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-400 disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════
 *  5. 칭호 & 레어도
 * ═══════════════════════════════════════════════════════ */

const TitlesSection: React.FC<{ supabase: any; showToast: (m: string, k?: "ok" | "err") => void }> = ({ supabase, showToast }) => {
  const [titles, setTitles] = useState<Title[]>([]);
  const [rarities, setRarities] = useState<RarityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  const [creatingTitle, setCreatingTitle] = useState(false);
  const [editingRarity, setEditingRarity] = useState<RarityRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [tRes, rRes] = await Promise.all([
      supabase.from("titles").select("*").order("rarity").order("sort_order").order("name"),
      supabase.from("rarities").select("*").order("sort_order"),
    ]);
    setTitles(tRes.data || []);
    setRarities(rRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const removeTitle = async (id: string) => {
    if (!confirm("정말 이 칭호를 삭제하시겠어요? 보유 중인 유저의 기록도 함께 삭제됩니다.")) return;
    const { error } = await supabase.from("titles").delete().eq("id", id);
    if (error) showToast("삭제 실패: " + error.message, "err");
    else { showToast("삭제됨"); load(); }
  };

  return (
    <div className="space-y-6">
      <AdminCard title="레어도 컬러 (5단계)">
        {loading ? (
          <div className="py-6 text-center text-slate-500">불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {rarities.map((r) => (
              <button
                key={r.id}
                onClick={() => setEditingRarity(r)}
                className="rounded-xl border p-4 text-left transition-all hover:scale-[1.02]"
                style={{
                  borderColor: r.border_color,
                  background: `linear-gradient(135deg, ${r.bg_from}, ${r.bg_to})`,
                  boxShadow: `0 0 16px ${r.glow_color}`,
                }}
              >
                <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: r.text_color }}>{r.label}</div>
                <div className="text-sm font-semibold text-white">{r.label_ko || "—"}</div>
                <div className="text-[10px] text-slate-400 mt-2">클릭해서 편집</div>
              </button>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard
        title={`칭호 (${titles.length}개)`}
        action={
          <button
            onClick={() => setCreatingTitle(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-100 text-xs font-semibold hover:bg-amber-500/30"
          >
            <Plus className="w-3.5 h-3.5" /> 칭호 추가
          </button>
        }
      >
        {loading ? (
          <div className="py-8 text-center text-slate-500">불러오는 중...</div>
        ) : titles.length === 0 ? (
          <div className="py-8 text-center text-slate-500">칭호가 없어요.</div>
        ) : (
          <div className="space-y-2">
            {titles.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold" style={{ color: t.color || "#FFFFFF" }}>{t.name}</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border" style={rarityChipStyle(t.rarity)}>{t.rarity}</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">{t.description}</div>
                </div>
                <button onClick={() => setEditingTitle(t)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => removeTitle(t.id)} className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {(editingTitle || creatingTitle) && (
        <TitleEditorModal
          supabase={supabase}
          title={editingTitle}
          onClose={() => { setEditingTitle(null); setCreatingTitle(false); }}
          onSaved={() => { load(); setEditingTitle(null); setCreatingTitle(false); showToast("저장되었습니다"); }}
          onError={(m) => showToast(m, "err")}
        />
      )}

      {editingRarity && (
        <RarityEditorModal
          supabase={supabase}
          rarity={editingRarity}
          onClose={() => setEditingRarity(null)}
          onSaved={() => { load(); setEditingRarity(null); showToast("저장되었습니다"); }}
          onError={(m) => showToast(m, "err")}
        />
      )}
    </div>
  );
};

const TitleEditorModal: React.FC<{
  supabase: any;
  title: Title | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}> = ({ supabase, title, onClose, onSaved, onError }) => {
  const [form, setForm] = useState<Title>(title || {
    code: "", name: "", description: "",
    rarity: "common", color: "", sort_order: 0,
    icon_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const update = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  // ── 칭호 이미지 업로드 (Supabase Storage)
  const uploadIcon = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      onError("이미지 크기는 2MB 이하여야 합니다");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `title_icons/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("images").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
      update("icon_url", publicUrl);
    } catch (e: any) {
      onError("이미지 업로드 실패: " + (e?.message || ""));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.code || !form.name) { onError("code와 name은 필수입니다"); return; }
    setSaving(true);
    if (title) {
      const { id, created_at, ...rest } = form;
      const { error } = await supabase.from("titles").update(rest).eq("id", id);
      setSaving(false);
      if (error) onError(error.message); else onSaved();
    } else {
      const { id, created_at, ...rest } = form;
      const { error } = await supabase.from("titles").insert(rest);
      setSaving(false);
      if (error) onError(error.message); else onSaved();
    }
  };

  return (
    <Modal onClose={onClose} title={title ? "칭호 편집" : "새 칭호"}>
      <div className="space-y-4">
        {/* ── 칭호 아이콘 업로드 ── */}
        <Field label="칭호 아이콘 (사이드바 아바타로 사용)">
          <div className="flex items-center gap-3">
            {/* 미리보기 */}
            <div
              className="w-16 h-16 rounded-full border-2 flex items-center justify-center flex-shrink-0 overflow-hidden bg-black/40"
              style={{ borderColor: "rgba(255,255,255,0.15)" }}
            >
              {form.icon_url ? (
                <img src={form.icon_url} alt="icon" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-slate-600">없음</span>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 px-3 py-2 rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-100 text-xs font-semibold hover:bg-amber-500/25 disabled:opacity-50 transition-all"
                >
                  {uploading ? "업로드 중..." : (form.icon_url ? "이미지 변경" : "이미지 업로드")}
                </button>
                {form.icon_url && (
                  <button
                    type="button"
                    onClick={() => update("icon_url", "")}
                    className="px-3 py-2 rounded-xl border border-rose-400/30 bg-rose-500/10 text-rose-200 text-xs font-semibold hover:bg-rose-500/20 transition-all"
                  >
                    제거
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadIcon(f);
                  e.target.value = "";
                }}
              />
              <div className="text-[10px] text-slate-500 leading-relaxed">
                PNG/JPG, 2MB 이하 권장 · 정사각형 이미지<br/>
                업로드 안 하면 닉네임 첫 글자가 표시됩니다
              </div>
            </div>
          </div>
        </Field>

        <Field label="code (영문 식별자)">
          <Input value={form.code} onChange={(v) => update("code", v)} placeholder="title_veteran" />
        </Field>
        <Field label="name (표시명)">
          <Input value={form.name} onChange={(v) => update("name", v)} placeholder="베테랑" />
        </Field>
        <Field label="description">
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40 resize-none"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="rarity">
            <select value={form.rarity} onChange={(e) => update("rarity", e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40">
              {RARITIES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="sort_order">
            <Input type="number" value={form.sort_order ?? 0} onChange={(v) => update("sort_order", Number(v))} />
          </Field>
        </div>
        <ColorField label="이름 컬러 (비워두면 레어도 기본색 사용)" value={form.color || "#FFFFFF"} onChange={(v) => update("color", v)} compact />

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5">취소</button>
          <button onClick={save} disabled={saving} className="flex-[2] py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-400 disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const RarityEditorModal: React.FC<{
  supabase: any;
  rarity: RarityRow;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}> = ({ supabase, rarity, onClose, onSaved, onError }) => {
  const [form, setForm] = useState<RarityRow>(rarity);
  const [saving, setSaving] = useState(false);
  const update = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const { id, created_at, key, ...rest } = form;
    const { error } = await supabase.from("rarities").update(rest).eq("id", id);
    setSaving(false);
    if (error) onError(error.message); else onSaved();
  };

  return (
    <Modal onClose={onClose} title={`레어도 편집 — ${rarity.key.toUpperCase()}`}>
      <div className="space-y-4">
        <div className="rounded-xl border p-4" style={{
          borderColor: form.border_color,
          background: `linear-gradient(135deg, ${form.bg_from}, ${form.bg_to})`,
          boxShadow: `0 0 24px ${form.glow_color}`,
        }}>
          <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: form.text_color }}>{form.label}</div>
          <div className="text-lg font-semibold text-white">{form.label_ko || "한글 라벨"}</div>
          <div className="text-xs text-slate-400 mt-1">미리보기 — 실제 레어도 카드 모양과 동일</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="label (영문)">
            <Input value={form.label} onChange={(v) => update("label", v)} placeholder="LEGENDARY" />
          </Field>
          <Field label="label_ko (한글)">
            <Input value={form.label_ko} onChange={(v) => update("label_ko", v)} placeholder="전설" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ColorField label="텍스트 컬러"    value={form.text_color}   onChange={(v) => update("text_color", v)}   compact />
          <Field label="보더 컬러 (rgba)">
            <Input value={form.border_color} onChange={(v) => update("border_color", v)} placeholder="rgba(252,211,77,0.6)" />
          </Field>
          <Field label="배경 시작 (rgba)">
            <Input value={form.bg_from} onChange={(v) => update("bg_from", v)} placeholder="rgba(120,53,15,0.4)" />
          </Field>
          <Field label="배경 끝 (rgba)">
            <Input value={form.bg_to} onChange={(v) => update("bg_to", v)} placeholder="rgba(15,23,42,0.7)" />
          </Field>
          <Field label="글로우 (rgba)">
            <Input value={form.glow_color} onChange={(v) => update("glow_color", v)} placeholder="rgba(252,211,77,0.5)" />
          </Field>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 font-semibold hover:bg-white/5">취소</button>
          <button onClick={save} disabled={saving} className="flex-[2] py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-400 disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════
 *  공통 UI 컴포넌트
 * ═══════════════════════════════════════════════════════ */

const AdminCard: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({ title, children, action }) => (
  <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0d1a]/80 to-[#070912]/80 p-5 sm:p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-bold text-white">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">{label}</label>
    {children}
  </div>
);

const Input: React.FC<{ value: any; onChange: (v: string) => void; placeholder?: string; type?: string }> = ({ value, onChange, placeholder, type = "text" }) => (
  <input
    type={type}
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40 placeholder:text-slate-600"
  />
);

const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void; compact?: boolean }> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={(value || "#000000").startsWith("#") ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 rounded-lg border border-white/10 bg-transparent cursor-pointer flex-shrink-0"
      />
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400/40"
        placeholder="#F0B429"
      />
    </div>
  </div>
);

const ToggleField: React.FC<{ label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, sub, checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn(
      "w-full rounded-xl border p-3 text-left transition-all",
      checked ? "bg-amber-500/10 border-amber-400/40" : "bg-white/[0.02] border-white/10 hover:border-white/20"
    )}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        {sub && <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
      <div className={cn(
        "ml-3 w-10 h-6 rounded-full relative transition-all flex-shrink-0",
        checked ? "bg-amber-500" : "bg-white/10"
      )}>
        <div className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
          checked ? "left-[18px]" : "left-0.5"
        )} />
      </div>
    </div>
  </button>
);

const FilterChip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1 rounded-full text-xs font-semibold border transition-all",
      active ? "bg-amber-500/20 border-amber-400/40 text-amber-100" : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200"
    )}
  >{children}</button>
);

const StickySaveBar: React.FC<{ dirty: boolean; saving: boolean; onSave: () => void }> = ({ dirty, saving, onSave }) => (
  <div className="sticky bottom-4 z-30">
    <div className={cn(
      "rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 px-4 py-3 transition-all",
      dirty ? "bg-amber-500/10 border-amber-400/40" : "bg-black/60 border-white/10"
    )}>
      <div className="flex items-center gap-2 text-sm">
        {dirty ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-100 font-semibold">변경사항 있음</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">저장됨</span>
          </>
        )}
      </div>
      <button
        onClick={onSave}
        disabled={!dirty || saving}
        className={cn(
          "px-5 py-2 rounded-xl font-semibold text-sm transition-all flex items-center gap-2",
          dirty && !saving
            ? "bg-amber-500 text-white hover:bg-amber-400 shadow-lg shadow-amber-500/20"
            : "bg-white/5 text-slate-500 cursor-not-allowed"
        )}
      >
        <Save className="w-4 h-4" />
        {saving ? "저장 중..." : "저장하기"}
      </button>
    </div>
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "relative w-full rounded-2xl border border-white/10 bg-[#0a0d1a] shadow-2xl max-h-[90vh] overflow-y-auto",
        wide ? "max-w-2xl" : "max-w-lg"
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#0a0d1a]/95 backdrop-blur border-b border-white/10">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════
 *  6. 수여 (수동 부여) UI
 * ═══════════════════════════════════════════════════════ */

const GrantSection: React.FC<{ supabase: any; showToast: (m: string, k?: "ok" | "err") => void }> = ({ supabase, showToast }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [tab, setTab] = useState<"achievement" | "title">("achievement");
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState<string | null>(null);
  const [ownedAchIds, setOwnedAchIds] = useState<Set<string>>(new Set());
  const [ownedTitleIds, setOwnedTitleIds] = useState<Set<string>>(new Set());

  // 초기 로드
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [mRes, aRes, tRes] = await Promise.all([
        supabase.from("profiles").select("id, nickname, points, role").order("nickname"),
        supabase.from("achievements").select("*").order("category").order("title"),
        supabase.from("titles").select("*").order("name"),
      ]);
      setMembers(mRes.data || []);
      setAchievements(aRes.data || []);
      setTitles(tRes.data || []);
      setLoading(false);
    })();
  }, [supabase]);

  // 선택된 멤버의 보유 업적/칭호 로드
  useEffect(() => {
    if (!selectedMember) {
      setOwnedAchIds(new Set());
      setOwnedTitleIds(new Set());
      return;
    }
    (async () => {
      const [uaRes, utRes] = await Promise.all([
        supabase.from("user_achievements").select("achievement_id").eq("user_id", selectedMember.id),
        supabase.from("user_titles").select("title_id").eq("user_id", selectedMember.id),
      ]);
      setOwnedAchIds(new Set((uaRes.data || []).map((r: any) => r.achievement_id)));
      setOwnedTitleIds(new Set((utRes.data || []).map((r: any) => r.title_id)));
    })();
  }, [selectedMember, supabase, granting]);

  const grantAchievement = async (code: string) => {
    if (!selectedMember) return;
    setGranting(code);
    const { data, error } = await supabase.rpc("admin_grant_to_user", {
      p_target_user_id: selectedMember.id,
      p_code: code,
    });
    setGranting(null);
    if (error) showToast("부여 실패: " + error.message, "err");
    else if (data?.ok === false && data?.reason === "already_achieved") showToast("이미 보유한 업적입니다", "err");
    else if (data?.ok === false && data?.reason === "permission_denied") showToast("관리자 권한이 필요합니다", "err");
    else if (data?.ok) showToast(`✨ ${selectedMember.nickname}에게 "${data.title}" 부여 완료`);
    else showToast("부여 실패", "err");
  };

  const grantTitle = async (titleId: string, titleName: string) => {
    if (!selectedMember) return;
    setGranting(titleId);
    const { error } = await supabase.from("user_titles").insert({
      user_id: selectedMember.id,
      title_id: titleId,
    });
    setGranting(null);
    if (error) {
      if (error.code === "23505") showToast("이미 보유한 칭호입니다", "err");
      else showToast("부여 실패: " + error.message, "err");
    } else {
      showToast(`✨ ${selectedMember.nickname}에게 "${titleName}" 칭호 부여 완료`);
    }
  };

  const revokeAchievement = async (achId: string, title: string) => {
    if (!selectedMember) return;
    if (!confirm(`정말 "${title}" 업적을 회수하시겠어요?`)) return;
    setGranting(achId);
    const { error } = await supabase
      .from("user_achievements")
      .delete()
      .eq("user_id", selectedMember.id)
      .eq("achievement_id", achId);
    setGranting(null);
    if (error) showToast("회수 실패: " + error.message, "err");
    else showToast(`회수 완료`);
  };

  const revokeTitle = async (titleId: string, titleName: string) => {
    if (!selectedMember) return;
    if (!confirm(`정말 "${titleName}" 칭호를 회수하시겠어요?`)) return;
    setGranting(titleId);
    const { error } = await supabase
      .from("user_titles")
      .delete()
      .eq("user_id", selectedMember.id)
      .eq("title_id", titleId);
    setGranting(null);
    if (error) showToast("회수 실패: " + error.message, "err");
    else showToast(`회수 완료`);
  };

  const filteredMembers = memberSearch
    ? members.filter((m) => (m.nickname || "").toLowerCase().includes(memberSearch.toLowerCase()))
    : members;

  if (loading) return <div className="py-12 text-center text-slate-500">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <AdminCard title="1단계: 길드원 선택">
        <input
          type="text"
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          placeholder="닉네임으로 검색..."
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/40 placeholder:text-slate-600 mb-3"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
          {filteredMembers.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMember(m)}
              className={cn(
                "p-2.5 rounded-xl border text-left transition-all",
                selectedMember?.id === m.id
                  ? "bg-amber-500/20 border-amber-400/50"
                  : "bg-white/[0.02] border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white truncate">{m.nickname || "Unknown"}</span>
                {m.role === "admin" && <span className="text-[9px] text-amber-300">👑</span>}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{m.points || 0} P</div>
            </button>
          ))}
        </div>
        {filteredMembers.length === 0 && (
          <div className="py-6 text-center text-slate-500 text-sm">검색 결과가 없어요.</div>
        )}
      </AdminCard>

      {selectedMember && (
        <AdminCard title={`2단계: ${selectedMember.nickname}에게 부여`}>
          {/* 탭 */}
          <div className="flex gap-1 mb-4">
            <button
              onClick={() => setTab("achievement")}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                tab === "achievement" ? "bg-amber-500/20 border border-amber-400/40 text-amber-100" : "bg-white/[0.02] border border-white/10 text-slate-400"
              )}
            >
              <Award className="w-3.5 h-3.5 inline mr-1" /> 업적 ({achievements.length})
            </button>
            <button
              onClick={() => setTab("title")}
              className={cn(
                "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                tab === "title" ? "bg-amber-500/20 border border-amber-400/40 text-amber-100" : "bg-white/[0.02] border border-white/10 text-slate-400"
              )}
            >
              <Crown className="w-3.5 h-3.5 inline mr-1" /> 칭호 ({titles.length})
            </button>
          </div>

          {tab === "achievement" && (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {achievements.map((a) => {
                const owned = ownedAchIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border transition-all",
                      owned ? "bg-emerald-500/5 border-emerald-400/20" : "bg-white/[0.02] border-white/10"
                    )}
                  >
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-black/40 flex items-center justify-center text-base">{a.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">{a.title}</span>
                        <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded border" style={rarityChipStyle(a.rarity)}>{a.rarity}</span>
                        {a.condition_type === "manual" && (
                          <span className="text-[9px] uppercase tracking-wider text-slate-500">수동</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{a.description}</div>
                    </div>
                    {owned ? (
                      <button
                        onClick={() => revokeAchievement(a.id, a.title)}
                        disabled={granting === a.id}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-400/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        회수
                      </button>
                    ) : (
                      <button
                        onClick={() => grantAchievement(a.code)}
                        disabled={granting === a.code}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-100 text-xs font-semibold hover:bg-amber-500/30 disabled:opacity-50"
                      >
                        {granting === a.code ? "..." : "부여"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "title" && (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {titles.map((t) => {
                const owned = ownedTitleIds.has(t.id);
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-lg border transition-all",
                      owned ? "bg-emerald-500/5 border-emerald-400/20" : "bg-white/[0.02] border-white/10"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold truncate" style={{ color: t.color || "#FFFFFF" }}>{t.name}</span>
                        <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded border" style={rarityChipStyle(t.rarity)}>{t.rarity}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{t.description}</div>
                    </div>
                    {owned ? (
                      <button
                        onClick={() => revokeTitle(t.id, t.name)}
                        disabled={granting === t.id}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-400/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        회수
                      </button>
                    ) : (
                      <button
                        onClick={() => grantTitle(t.id, t.name)}
                        disabled={granting === t.id}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-100 text-xs font-semibold hover:bg-amber-500/30 disabled:opacity-50"
                      >
                        {granting === t.id ? "..." : "부여"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </AdminCard>
      )}
    </div>
  );
};

/* ═══════════════ Helpers ═══════════════ */
function rarityChipStyle(r: Rarity) {
  const map: Record<Rarity, { color: string; border: string; bg: string }> = {
    common:    { color: "#CBD5E1", border: "rgba(148,163,184,0.4)", bg: "rgba(148,163,184,0.1)" },
    rare:      { color: "#7DD3FC", border: "rgba(56,189,248,0.4)",  bg: "rgba(56,189,248,0.1)" },
    epic:      { color: "#C4B5FD", border: "rgba(167,139,250,0.4)", bg: "rgba(167,139,250,0.1)" },
    legendary: { color: "#FCD34D", border: "rgba(252,211,77,0.4)",  bg: "rgba(252,211,77,0.1)" },
    mythic:    { color: "#F9A8D4", border: "rgba(244,114,182,0.4)", bg: "rgba(244,114,182,0.1)" },
  };
  const s = map[r] || map.common;
  return { color: s.color, borderColor: s.border, background: s.bg };
}

export default AchievementsAdmin;
