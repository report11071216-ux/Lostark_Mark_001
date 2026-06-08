import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

export const envMissing = !url || !key;

// env 없으면 null (미리보기 등). 사용처에서 envMissing 분기 후 접근.
export const supabase = envMissing
  ? (null as unknown as ReturnType<typeof createClient>)
  : createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
