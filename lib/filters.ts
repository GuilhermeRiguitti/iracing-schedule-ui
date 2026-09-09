import type { DurationType, Series, Week } from "./types";

export interface Filters {
  q: string;
  categories: string[];
  classes: string[];
  cars: string[];
  tracks: string[];
  durationTypes: DurationType[];
  minMinutes: number | null;
  maxMinutes: number | null;
  setup: "all" | "fixed" | "open";
  multiclass: boolean;
  weeklyCars: boolean;
  favoritesOnly: boolean;
  week: string | null; // data de início da semana
  sort: SortKey;
}

export type SortKey =
  | "name"
  | "category"
  | "class"
  | "duration-asc"
  | "duration-desc"
  | "weeks";

export const EMPTY_FILTERS: Filters = {
  q: "",
  categories: [],
  classes: [],
  cars: [],
  tracks: [],
  durationTypes: [],
  minMinutes: null,
  maxMinutes: null,
  setup: "all",
  multiclass: false,
  weeklyCars: false,
  favoritesOnly: false,
  week: null,
  sort: "category",
};

export const DURATION_PRESETS: {
  label: string;
  min: number | null;
  max: number | null;
}[] = [
  { label: "até 30 min", min: null, max: 30 },
  { label: "30–60 min", min: 30, max: 60 },
  { label: "1h–2h", min: 60, max: 120 },
  { label: "2h+", min: 120, max: null },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Minutos "efetivos" de uma semana. Provas por volta viram null. */
export function weekMinutes(w: Week): number | null {
  return w.duration.minutes;
}

function matchesText(s: Series, q: string) {
  const n = norm(q);
  if (!n) return true;
  const terms = n.split(/\s+/).filter(Boolean);
  const haystack = norm(
    [s.name, s.category, s.licenseClass, ...s.cars, ...s.tracks].join(" ")
  );
  return terms.every((t) => haystack.includes(t));
}

export function filterSeries(
  all: Series[],
  f: Filters,
  favorites: Set<string>
): Series[] {
  const out = all.filter((s) => {
    if (f.favoritesOnly && !favorites.has(s.id)) return false;
    if (f.categories.length && !f.categories.includes(s.category)) return false;
    if (f.classes.length && !f.classes.includes(s.licenseClass)) return false;
    if (f.setup === "fixed" && !s.fixedSetup) return false;
    if (f.setup === "open" && s.fixedSetup) return false;
    if (f.multiclass && !s.multiclass) return false;
    if (f.weeklyCars && !s.weeklyCars) return false;
    if (f.cars.length && !f.cars.some((c) => s.cars.includes(c))) return false;
    if (f.tracks.length && !f.tracks.some((t) => s.tracks.includes(t)))
      return false;
    if (
      f.durationTypes.length &&
      !f.durationTypes.some((t) => s.durationTypes.includes(t))
    )
      return false;
    if (f.week && !s.weeks.some((w) => w.start === f.week)) return false;

    if (f.minMinutes !== null || f.maxMinutes !== null) {
      const mins = s.weeks
        .map(weekMinutes)
        .filter((m): m is number => m !== null);
      if (!mins.length) return false;
      const lo = f.minMinutes ?? -Infinity;
      const hi = f.maxMinutes ?? Infinity;
      if (!mins.some((m) => m >= lo && m <= hi)) return false;
    }

    if (!matchesText(s, f.q)) return false;
    return true;
  });

  return sortSeries(out, f.sort);
}

const CLASS_ORDER = ["R", "D", "C", "B", "A", "-"];
const CAT_ORDER = [
  "OVAL",
  "SPORTS CAR",
  "FORMULA CAR",
  "DIRT OVAL",
  "DIRT ROAD",
  "UNRANKED",
];

function longest(s: Series) {
  return s.maxMinutes ?? (s.maxLaps ? s.maxLaps * 1.2 : 0);
}

export function sortSeries(list: Series[], sort: SortKey): Series[] {
  const arr = [...list];
  switch (sort) {
    case "name":
      return arr.sort((a, b) => a.shortName.localeCompare(b.shortName));
    case "class":
      return arr.sort(
        (a, b) =>
          CLASS_ORDER.indexOf(a.licenseClass) -
            CLASS_ORDER.indexOf(b.licenseClass) ||
          a.shortName.localeCompare(b.shortName)
      );
    case "duration-asc":
      return arr.sort((a, b) => longest(a) - longest(b));
    case "duration-desc":
      return arr.sort((a, b) => longest(b) - longest(a));
    case "weeks":
      return arr.sort((a, b) => b.weekCount - a.weekCount);
    default:
      return arr.sort(
        (a, b) =>
          CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category) ||
          CLASS_ORDER.indexOf(a.licenseClass) -
            CLASS_ORDER.indexOf(b.licenseClass) ||
          a.shortName.localeCompare(b.shortName)
      );
  }
}

export function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.q.trim()) n++;
  n += f.categories.length + f.classes.length + f.cars.length + f.tracks.length;
  n += f.durationTypes.length;
  if (f.minMinutes !== null || f.maxMinutes !== null) n++;
  if (f.setup !== "all") n++;
  if (f.multiclass) n++;
  if (f.weeklyCars) n++;
  if (f.favoritesOnly) n++;
  if (f.week) n++;
  return n;
}

// ---------- exibição ----------

export const CLASS_COLOR: Record<string, string> = {
  R: "#e2504a",
  D: "#e08a3c",
  C: "#e0c04a",
  B: "#5aa860",
  A: "#4a7fd6",
  "-": "#6c7480",
};

export const CATEGORY_LABEL: Record<string, string> = {
  OVAL: "Oval",
  "SPORTS CAR": "Sports Car",
  "FORMULA CAR": "Formula",
  "DIRT OVAL": "Dirt Oval",
  "DIRT ROAD": "Dirt Road",
  UNRANKED: "Sem rank",
};

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

export function fmtDateLong(iso: string): string {
  const dt = new Date(`${iso}T12:00:00`);
  return dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Semana da temporada que contém a data informada. */
export function currentWeekStart(weekStarts: string[], today = new Date()) {
  const iso = today.toISOString().slice(0, 10);
  let best: string | null = null;
  for (const w of weekStarts) if (w <= iso) best = w;
  return best ?? weekStarts[0] ?? null;
}

export function durationRangeLabel(s: Series): string {
  if (s.durationTypes.includes("heat")) return "Heat + feature";
  if (s.minMinutes !== null && s.maxMinutes !== null) {
    return s.minMinutes === s.maxMinutes
      ? fmtMinutes(s.minMinutes)
      : `${fmtMinutes(s.minMinutes)}–${fmtMinutes(s.maxMinutes)}`;
  }
  if (s.minLaps !== null && s.maxLaps !== null) {
    return s.minLaps === s.maxLaps
      ? `${s.minLaps} voltas`
      : `${s.minLaps}–${s.maxLaps} voltas`;
  }
  return "—";
}

export function fmtMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  if (m % 60 === 0) return `${m / 60}h`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}
