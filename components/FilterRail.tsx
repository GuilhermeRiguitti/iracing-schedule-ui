"use client";

import { useMemo } from "react";
import {
  CATEGORY_LABEL,
  CLASS_COLOR,
  DURATION_PRESETS,
  EMPTY_FILTERS,
  countActiveFilters,
  fmtDate,
  type Filters,
} from "@/lib/filters";
import type { DurationType, Schedule } from "@/lib/types";
import {
  ChipGroup,
  SearchSelect,
  SectionLabel,
  Toggle,
} from "@/components/ui";

const DURATION_TYPE_LABEL: Record<DurationType, string> = {
  laps: "Por voltas",
  time: "Por tempo",
  heat: "Heat + feature",
  other: "Outro",
};

export function FilterRail({
  data,
  filters,
  setFilters,
  showWeekFilter = true,
}: {
  data: Schedule;
  filters: Filters;
  setFilters: (f: Filters) => void;
  showWeekFilter?: boolean;
}) {
  const patch = (p: Partial<Filters>) => setFilters({ ...filters, ...p });

  const toggleIn = <K extends keyof Filters>(key: K, value: string) => {
    const arr = filters[key] as unknown as string[];
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    patch({ [key]: next } as unknown as Partial<Filters>);
  };

  const active = countActiveFilters(filters);

  const weeks = useMemo(
    () => data.weekStarts.filter((w) => w >= "2026-01-01"),
    [data.weekStarts]
  );

  return (
    <aside className="scroll-thin w-full shrink-0 space-y-5 border-line px-4 py-4 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-[268px] lg:overflow-y-auto lg:border-r">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold">Filtros</span>
        {active > 0 && (
          <button
            onClick={() => setFilters({ ...EMPTY_FILTERS, sort: filters.sort })}
            className="text-[12px] text-flag hover:underline"
          >
            Limpar ({active})
          </button>
        )}
      </div>

      <div>
        <SectionLabel>Categoria</SectionLabel>
        <ChipGroup
          options={data.categories}
          selected={filters.categories}
          onToggle={(v) => toggleIn("categories", v)}
          labelOf={(v) => CATEGORY_LABEL[v] ?? v}
        />
      </div>

      <div>
        <SectionLabel>Classe de licença</SectionLabel>
        <ChipGroup
          options={data.licenseClasses}
          selected={filters.classes}
          onToggle={(v) => toggleIn("classes", v)}
          colorOf={(v) => CLASS_COLOR[v]}
        />
      </div>

      <div>
        <SectionLabel>Duração da corrida</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {DURATION_PRESETS.map((p) => {
            const on =
              filters.minMinutes === p.min && filters.maxMinutes === p.max;
            return (
              <button
                key={p.label}
                onClick={() =>
                  patch(
                    on
                      ? { minMinutes: null, maxMinutes: null }
                      : { minMinutes: p.min, maxMinutes: p.max }
                  )
                }
                className={`rounded border px-2 py-1 text-[12px] ${
                  on
                    ? "border-transparent bg-signal text-base"
                    : "border-line text-ink-dim hover:border-ink-faint hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-faint">
          Vale para provas cronometradas. Séries por volta ficam de fora quando
          esse filtro está ativo.
        </p>
      </div>

      <div>
        <SectionLabel>Formato</SectionLabel>
        <ChipGroup
          options={["laps", "time", "heat"] as DurationType[]}
          selected={filters.durationTypes}
          onToggle={(v) => toggleIn("durationTypes", v)}
          labelOf={(v) => DURATION_TYPE_LABEL[v]}
        />
      </div>

      <div>
        <SectionLabel>Carro</SectionLabel>
        <SearchSelect
          options={data.cars}
          selected={filters.cars}
          onToggle={(v) => toggleIn("cars", v)}
          placeholder="Buscar carro…"
        />
      </div>

      <div>
        <SectionLabel>Pista</SectionLabel>
        <SearchSelect
          options={data.tracks}
          selected={filters.tracks}
          onToggle={(v) => toggleIn("tracks", v)}
          placeholder="Buscar pista…"
        />
      </div>

      {showWeekFilter && (
        <div>
          <SectionLabel>Semana</SectionLabel>
          <select
            value={filters.week ?? ""}
            onChange={(e) => patch({ week: e.target.value || null })}
            className="w-full rounded border border-line bg-panel px-2 py-1.5 text-[13px] focus:outline-none"
          >
            <option value="">Qualquer semana</option>
            {weeks.map((w) => (
              <option key={w} value={w}>
                {fmtDate(w)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <SectionLabel>Setup</SectionLabel>
        <ChipGroup
          options={["all", "fixed", "open"]}
          selected={[filters.setup]}
          onToggle={(v) =>
            patch({ setup: v as Filters["setup"] })
          }
          labelOf={(v) =>
            v === "all" ? "Todos" : v === "fixed" ? "Fixed" : "Open"
          }
        />
      </div>

      <div>
        <SectionLabel>Outros</SectionLabel>
        <Toggle
          checked={filters.favoritesOnly}
          onChange={(v) => patch({ favoritesOnly: v })}
          label="Só favoritas"
        />
        <Toggle
          checked={filters.multiclass}
          onChange={(v) => patch({ multiclass: v })}
          label="Multiclasse (grid por classe)"
        />
        <Toggle
          checked={filters.weeklyCars}
          onChange={(v) => patch({ weeklyCars: v })}
          label="Carro muda toda semana"
        />
      </div>
    </aside>
  );
}
