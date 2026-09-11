"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  CATEGORY_LABEL,
  currentWeekStart,
  durationRangeLabel,
  fmtDateLong,
  fmtDayShort,
  seasonWeekStarts,
  sortSeries,
  weekOf,
} from "@/lib/filters";
import { SeriesDetail } from "@/components/SeriesRow";
import { ClassBadge, ErrorState, Loading, StarButton } from "@/components/ui";
import type { Series, Week } from "@/lib/types";

type View = "semana" | "temporada";

export default function FavoritesPage() {
  const { data, error, favorites, toggleFavorite, owned, byId } = useStore();
  const [view, setView] = useState<View>("semana");
  const [week, setWeek] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const seasonWeeks = useMemo(
    () => (data ? seasonWeekStarts(data.series) : []),
    [data]
  );
  const today = currentWeekStart(seasonWeeks);

  useEffect(() => {
    if (week === null && today) setWeek(today);
  }, [week, today]);

  const favSeries = useMemo(
    () =>
      sortSeries(
        [...favorites]
          .map((id) => byId.get(id))
          .filter((s): s is Series => Boolean(s)),
        "category"
      ),
    [favorites, byId]
  );

  if (error) return <ErrorState message={error} />;
  if (!data) return <Loading />;

  const open = openId ? byId.get(openId) : null;

  const running = week
    ? favSeries.flatMap((s) => {
        const w = weekOf(s, week);
        return w ? [{ s, w }] : [];
      })
    : [];
  const idle = week ? favSeries.filter((s) => !weekOf(s, week)) : [];

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6">
      <header className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] font-semibold">
            Favoritas{" "}
            <span className="tnum font-mono text-[13px] font-normal text-ink-faint">
              {favSeries.length}
            </span>
          </h1>
          <p className="mt-1 max-w-[70ch] text-[13px] text-ink-dim">
            As séries que você marcou com ★ — onde cada uma corre na semana e o
            desenho da temporada inteira.
          </p>
        </div>

        {favSeries.length > 0 && (
          <div className="flex rounded border border-line p-0.5">
            {(
              [
                ["semana", "Semana"],
                ["temporada", "Temporada"],
              ] as [View, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                className={`rounded px-3 py-1.5 text-[12.5px] ${
                  view === k ? "bg-signal text-base" : "text-ink-dim hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {favSeries.length === 0 ? (
        <EmptyState />
      ) : view === "semana" ? (
        <>
          <WeekPicker
            weeks={seasonWeeks}
            selected={week}
            today={today}
            onSelect={setWeek}
          />

          {week && (
            <p className="mb-4 mt-2 text-[12px] text-ink-faint">
              Semana abre {fmtDateLong(week)}
              {week === today && " — é a semana em andamento"}
              {" · "}
              <span className="tnum font-mono">{running.length}</span> de{" "}
              <span className="tnum font-mono">{favSeries.length}</span>{" "}
              favoritas correndo
            </p>
          )}

          {running.length > 0 && (
            <ul className="border-t border-line-soft">
              {running.map(({ s, w }) => (
                <FavoriteWeekRow
                  key={s.id}
                  series={s}
                  week={w}
                  weekStart={week!}
                  owned={owned}
                  onOpen={() => setOpenId(s.id)}
                  onUnfavorite={() => toggleFavorite(s.id)}
                />
              ))}
            </ul>
          )}

          {idle.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-[12px] font-semibold text-ink-dim">
                Sem corrida nesta semana
              </h2>
              <ul className="border-t border-line-soft">
                {idle.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 border-b border-line-soft px-1 py-2 text-ink-faint"
                  >
                    <StarButton on onClick={() => toggleFavorite(s.id)} />
                    <ClassBadge cls={s.licenseClass} />
                    <button
                      onClick={() => setOpenId(s.id)}
                      className="min-w-0 flex-1 truncate text-left text-[13px] hover:text-ink hover:underline"
                    >
                      {s.shortName}
                    </button>
                    <span className="tnum hidden font-mono text-[11px] sm:inline">
                      {s.weekCount} semanas
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <SeasonGrid
          series={favSeries}
          weeks={seasonWeeks}
          today={today}
          owned={owned}
          onOpen={setOpenId}
        />
      )}

      {open && <SeriesDetail series={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded border border-dashed border-line px-6 py-16 text-center">
      <p className="text-[14px] text-ink">Nenhuma série favorita ainda.</p>
      <p className="mx-auto mt-2 max-w-[48ch] text-[13px] text-ink-dim">
        Marque com ☆ as séries que você pretende correr — em{" "}
        <Link href="/" className="text-ink underline-offset-2 hover:underline">
          Séries
        </Link>{" "}
        ou no{" "}
        <Link
          href="/calendario"
          className="text-ink underline-offset-2 hover:underline"
        >
          Calendário
        </Link>
        . Elas aparecem aqui com a pista de cada semana.
      </p>
    </div>
  );
}

function WeekPicker({
  weeks,
  selected,
  today,
  onSelect,
}: {
  weeks: string[];
  selected: string | null;
  today: string | null;
  onSelect: (w: string) => void;
}) {
  return (
    <div className="scroll-thin flex gap-1 overflow-x-auto pb-1">
      {weeks.map((w, i) => {
        const on = w === selected;
        return (
          <button
            key={w}
            onClick={() => onSelect(w)}
            className={`shrink-0 rounded px-2.5 py-1.5 text-left ${
              on
                ? "bg-signal text-base"
                : "border border-line text-ink-dim hover:border-ink-faint hover:text-ink"
            }`}
          >
            <span className="tnum block font-mono text-[12px] font-semibold">
              W{i + 1}
              {w === today && !on && <span className="text-flag"> •</span>}
            </span>
            <span className="tnum block font-mono text-[10.5px] opacity-70">
              {w.slice(8)}/{w.slice(5, 7)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** O que falta comprar para correr esta semana — só quando o piloto usa a aba Conteúdo. */
function missingFor(s: Series, w: Week, owned: Set<string>): string[] {
  if (owned.size === 0) return [];
  const out: string[] = [];
  if (!owned.has(w.track)) out.push("pista");
  const cars = w.cars ?? s.cars;
  if (cars.length && !cars.some((c) => owned.has(c)))
    out.push(cars.length > 1 ? "nenhum carro" : "carro");
  return out;
}

function FavoriteWeekRow({
  series: s,
  week: w,
  weekStart,
  owned,
  onOpen,
  onUnfavorite,
}: {
  series: Series;
  week: Week;
  weekStart: string;
  owned: Set<string>;
  onOpen: () => void;
  onUnfavorite: () => void;
}) {
  const missing = missingFor(s, w, owned);
  const cars = w.cars ?? (s.weeklyCars ? null : s.cars);

  return (
    <li className="flex items-start gap-3 border-b border-line-soft px-1 py-3 hover:bg-panel/60">
      <StarButton on onClick={onUnfavorite} />
      <ClassBadge cls={s.licenseClass} />

      <button
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
        aria-label={`Abrir detalhes de ${s.shortName}`}
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[13.5px] font-medium leading-snug">
            {s.shortName}
          </span>
          <span className="text-[11.5px] text-ink-faint">
            {CATEGORY_LABEL[s.category] ?? s.category}
            {s.fixedSetup && " · fixed"}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12.5px]">
          <span className={owned.has(w.track) ? "text-ink-dim" : "text-ink"}>
            {w.track}
          </span>
          {w.start !== weekStart && (
            <span className="tnum font-mono text-[11.5px] text-flag">
              {fmtDayShort(w.start)}
            </span>
          )}
        </div>

        {cars && (
          <div className="mt-0.5 truncate text-[11.5px] text-ink-faint">
            {cars.slice(0, 3).join(", ")}
            {cars.length > 3 && ` +${cars.length - 3}`}
          </div>
        )}

        {missing.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {missing.map((m) => (
              <span
                key={m}
                className="rounded border border-flag/40 px-1.5 py-px text-[10.5px] text-flag"
              >
                falta {m}
              </span>
            ))}
          </div>
        )}
      </button>

      <div className="w-[120px] shrink-0 text-right">
        <div className="tnum font-mono text-[12.5px] text-ink">
          {w.duration.label}
        </div>
        <div className="tnum mt-0.5 font-mono text-[11px] text-ink-faint">
          {[
            w.tempC !== null ? `${w.tempC}°C` : null,
            w.rain && w.rain !== "None" ? `chuva ${w.rain}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || `sem. ${w.week}`}
        </div>
      </div>
    </li>
  );
}

function SeasonGrid({
  series,
  weeks,
  today,
  owned,
  onOpen,
}: {
  series: Series[];
  weeks: string[];
  today: string | null;
  owned: Set<string>;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <div className="scroll-thin overflow-x-auto rounded border border-line">
        <table className="border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-line text-left text-ink-faint">
              <th className="sticky left-0 z-10 min-w-[220px] bg-base px-3 py-2 font-medium">
                Série
              </th>
              {weeks.map((w, i) => (
                <th
                  key={w}
                  className={`min-w-[132px] border-l border-line-soft px-2 py-2 font-medium ${
                    w === today ? "bg-panel-2 text-ink" : ""
                  }`}
                >
                  <span className="tnum block font-mono">
                    W{i + 1}
                    {w === today && <span className="text-flag"> •</span>}
                  </span>
                  <span className="tnum block font-mono text-[10.5px] font-normal opacity-70">
                    {w.slice(8)}/{w.slice(5, 7)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.id} className="border-b border-line-soft align-top">
                <td className="sticky left-0 z-10 bg-base px-3 py-2">
                  <div className="flex items-start gap-2">
                    <ClassBadge cls={s.licenseClass} />
                    <div className="min-w-0">
                      <button
                        onClick={() => onOpen(s.id)}
                        className="text-left text-[12.5px] leading-snug hover:underline"
                      >
                        {s.shortName}
                      </button>
                      <div className="tnum font-mono text-[10.5px] text-ink-faint">
                        {durationRangeLabel(s)}
                      </div>
                    </div>
                  </div>
                </td>
                {weeks.map((wk) => {
                  const w = weekOf(s, wk);
                  return (
                    <td
                      key={wk}
                      title={
                        w
                          ? `${w.track} — ${w.duration.label}${
                              w.start !== wk ? ` (${fmtDayShort(w.start)})` : ""
                            }`
                          : "Sem corrida"
                      }
                      className={`border-l border-line-soft px-2 py-2 ${
                        wk === today ? "bg-panel-2/60" : ""
                      }`}
                    >
                      {w ? (
                        <span
                          className={`line-clamp-2 leading-snug ${
                            owned.size === 0 || owned.has(w.track)
                              ? "text-ink-dim"
                              : "text-flag"
                          }`}
                        >
                          {w.track}
                        </span>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {owned.size > 0 && (
        <p className="mt-2 text-[11.5px] text-ink-faint">
          <span className="text-flag">Laranja</span> = pista que você ainda não
          marcou como comprada em Conteúdo.
        </p>
      )}
    </>
  );
}
