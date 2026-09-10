"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  CATEGORY_LABEL,
  EMPTY_FILTERS,
  currentWeekStart,
  filterSeries,
  fmtDateLong,
  fmtDayShort,
  seasonWeekStarts,
  weekOf,
  type Filters,
} from "@/lib/filters";
import { FilterRail } from "@/components/FilterRail";
import { SeriesDetail } from "@/components/SeriesRow";
import {
  ClassBadge,
  ErrorState,
  Loading,
  Pagination,
  StarButton,
} from "@/components/ui";

interface Row {
  seriesId: string;
  name: string;
  category: string;
  licenseClass: string;
  fixedSetup: boolean;
  track: string;
  duration: string;
  minutes: number | null;
  rain: string | null;
  tempC: number | null;
  cars: string[];
  weekNumber: number;
  start: string;
}

export default function CalendarPage() {
  const { data, error, favorites, toggleFavorite, owned } = useStore();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [week, setWeek] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [openId, setOpenId] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);

  const seasonWeeks = useMemo(
    () => (data ? seasonWeekStarts(data.series) : []),
    [data]
  );

  useEffect(() => {
    if (data && week === null && seasonWeeks.length) {
      setWeek(currentWeekStart(seasonWeeks));
    }
  }, [data, week, seasonWeeks]);

  const rows: Row[] = useMemo(() => {
    if (!data || !week) return [];
    const matched = filterSeries(data.series, filters, favorites);
    const out: Row[] = [];
    for (const s of matched) {
      const w = weekOf(s, week);
      if (!w) continue;
      out.push({
        seriesId: s.id,
        name: s.shortName,
        category: s.category,
        licenseClass: s.licenseClass,
        fixedSetup: s.fixedSetup,
        track: w.track,
        duration: w.duration.label,
        minutes: w.duration.minutes,
        rain: w.rain,
        tempC: w.tempC,
        cars: w.cars ?? s.cars,
        weekNumber: w.week,
        start: w.start,
      });
    }
    return out;
  }, [data, week, filters, favorites]);

  useEffect(() => setPage(1), [filters, week]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <Loading />;

  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  const current = rows.slice((page - 1) * perPage, page * perPage);
  const open = openId ? data.series.find((s) => s.id === openId) : null;
  const today = currentWeekStart(seasonWeeks);

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
      <div className={railOpen ? "block" : "hidden lg:block"}>
        <FilterRail
          data={data}
          filters={filters}
          setFilters={setFilters}
          showWeekFilter={false}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="border-b border-line px-3 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setRailOpen((v) => !v)}
              className="rounded border border-line px-2.5 py-1.5 text-[12px] text-ink-dim lg:hidden"
            >
              {railOpen ? "Ocultar filtros" : "Filtros"}
            </button>
            <input
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Buscar na semana…"
              className="min-w-[180px] flex-1 rounded border border-line bg-panel px-3 py-1.5 text-[13px] placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
            />
            <span className="tnum font-mono text-[12px] text-ink-faint">
              {rows.length} séries correndo
            </span>
          </div>

          <div className="scroll-thin flex gap-1 overflow-x-auto pb-1">
            {seasonWeeks.map((w, i) => {
              const on = w === week;
              const isNow = w === today;
              return (
                <button
                  key={w}
                  onClick={() => setWeek(w)}
                  className={`shrink-0 rounded px-2.5 py-1.5 text-left ${
                    on
                      ? "bg-signal text-base"
                      : "border border-line text-ink-dim hover:border-ink-faint hover:text-ink"
                  }`}
                >
                  <span className="tnum block font-mono text-[12px] font-semibold">
                    W{i + 1}
                    {isNow && !on && <span className="text-flag"> •</span>}
                  </span>
                  <span className="tnum block font-mono text-[10.5px] opacity-70">
                    {w.slice(8)}/{w.slice(5, 7)}
                  </span>
                </button>
              );
            })}
          </div>
          {week && (
            <p className="mt-2 text-[12px] text-ink-faint">
              Semana abre {fmtDateLong(week)}
              {week === today && " — é a semana em andamento"}
            </p>
          )}
        </div>

        {current.length === 0 ? (
          <p className="px-4 py-20 text-center text-[13px] text-ink-dim">
            Nenhuma série nessa semana com os filtros atuais.
          </p>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-[11px] text-ink-faint">
                <th className="w-8 py-2 pl-3" />
                <th className="w-8 py-2" />
                <th className="py-2 pr-3 font-medium">Série</th>
                <th className="py-2 pr-3 font-medium">Pista</th>
                <th className="w-[110px] py-2 pr-3 font-medium">Duração</th>
                <th className="hidden w-[120px] py-2 pr-3 font-medium md:table-cell">
                  Condições
                </th>
              </tr>
            </thead>
            <tbody>
              {current.map((r) => (
                <tr
                  key={r.seriesId}
                  className="border-b border-line-soft align-top hover:bg-panel/60"
                >
                  <td className="py-2 pl-3">
                    <StarButton
                      on={favorites.has(r.seriesId)}
                      onClick={() => toggleFavorite(r.seriesId)}
                    />
                  </td>
                  <td className="py-2.5">
                    <ClassBadge cls={r.licenseClass} />
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => setOpenId(r.seriesId)}
                      className="text-left hover:underline"
                    >
                      {r.name}
                    </button>
                    <div className="text-[11px] text-ink-faint">
                      {CATEGORY_LABEL[r.category] ?? r.category}
                      {r.fixedSetup && " · fixed"}
                      {r.start !== week && (
                        <span className="text-flag">
                          {" · "}
                          {fmtDayShort(r.start)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={
                        owned.has(r.track) ? "text-ink-dim" : "text-ink"
                      }
                    >
                      {r.track}
                    </span>
                  </td>
                  <td className="tnum py-2 pr-3 font-mono text-ink-dim">
                    {r.duration}
                  </td>
                  <td className="hidden py-2 pr-3 text-[11px] text-ink-faint md:table-cell">
                    {r.tempC !== null && `${r.tempC}°C`}
                    {r.rain && r.rain !== "None" && ` · chuva ${r.rain}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination
          page={page}
          pageCount={pageCount}
          total={rows.length}
          perPage={perPage}
          onPage={(p) => {
            setPage(Math.min(Math.max(1, p), pageCount));
            window.scrollTo({ top: 0 });
          }}
          onPerPage={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      </div>

      {open && <SeriesDetail series={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
