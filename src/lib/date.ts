import { CYCLE } from "./constants";
import type { CheckCycle } from "../types/db";

export const sod = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parse = (s: string) => { const [y, m, dd] = s.split("-").map(Number); return new Date(y, m - 1, dd); };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const addMonths = (d: Date, n: number) => {
  const x = new Date(d); const day = x.getDate();
  x.setDate(1); x.setMonth(x.getMonth() + n);
  x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
  return x;
};
export const dayDiff = (a: Date, b: Date) => Math.round((+sod(a) - +sod(b)) / 86400000);
export const cmp = (a: Date, b: Date) => +sod(a) - +sod(b);

interface CycleAnchor { start_date: string; cycle: CheckCycle; }

/** from 이후(포함) 가장 가까운 정기 점검일 */
export function nextRoutine(site: CycleAnchor, from: Date): Date {
  const start = parse(site.start_date); const c = CYCLE[site.cycle];
  if (cmp(from, start) <= 0) return new Date(start);
  if (c.unit === "day") {
    const k = Math.ceil(dayDiff(from, start) / c.n);
    return addDays(start, k * c.n);
  }
  const mdiff = (from.getFullYear() - start.getFullYear()) * 12 + (from.getMonth() - start.getMonth());
  let k = Math.max(0, Math.floor(mdiff / c.n));
  let d = addMonths(start, k * c.n);
  while (cmp(d, from) < 0) { k++; d = addMonths(start, k * c.n); }
  return d;
}

/** from 이전(포함) 가장 최근 정기 점검일 (없으면 null) */
export function prevRoutine(site: CycleAnchor, from: Date): Date | null {
  const start = parse(site.start_date); const c = CYCLE[site.cycle];
  if (cmp(start, from) > 0) return null;
  if (c.unit === "day") {
    const k = Math.floor(dayDiff(from, start) / c.n);
    return addDays(start, k * c.n);
  }
  const mdiff = (from.getFullYear() - start.getFullYear()) * 12 + (from.getMonth() - start.getMonth());
  let k = Math.floor(mdiff / c.n); let d = addMonths(start, k * c.n);
  while (cmp(d, from) > 0) { k--; d = addMonths(start, k * c.n); }
  return k < 0 ? null : d;
}

/** 특정 연/월에 떨어지는 정기 점검일 목록 */
export function routineDatesInMonth(site: CycleAnchor, year: number, month: number): Date[] {
  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
  const out: Date[] = []; let d: Date | null = nextRoutine(site, first); let guard = 0;
  while (d && cmp(d, last) <= 0 && guard++ < 400) { out.push(new Date(d)); d = nextRoutine(site, addDays(d, 1)); }
  return out;
}
