"use client";

import { useEffect } from "react";
import type { Series, Week } from "@/lib/types";
import {
  CATEGORY_LABEL,
  durationRangeLabel,
  fmtDate,
  fmtDateLong,
} from "@/lib/filters";
import { ClassBadge, StarButton } from "@/components/ui";
import { useStore } from "@/lib/store";

export function SeriesRow({
  series,
  onOpen,
  highlightWeek,
}: {
  series: Series;
  onOpen: () => void;
  highlightWeek: string | null;
}) {
  const { favorites, toggleFavorite } = useStore();
  const week = highlightWeek
    ? series.weeks.find((w) => w.start === highlightWeek)
    : null;

  return (
    <div className="flex items-start gap-3 border-b border-line-soft px-3 py-2.5 hover:bg-panel/60">
      <StarButton
        on={favorites.has(series.id)}
        onClick={() => toggleFavorite(series.id)}
      />
      <ClassBadge cls={series.licenseClass} />

      <button
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
        aria-label={`Abrir detalhes de ${series.shortName}`}
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[13.5px] font-medium leading-snug">
            {series.shortName}
          </span>
          {series.fixedSetup && (
            <span className="rounded bg-panel-2 px-1.5 py-px text-[10.5px] text-ink-dim">
              fixed
            </span>
          )}
          {series.multiclass && (
            <span className="rounded bg-panel-2 px-1.5 py-px text-[10.5px] text-ink-dim">
              multiclasse
            </span>
          )}
        </div>

        <div className="mt-1 truncate text-[12px] text-ink-faint">
          {CATEGORY_LABEL[series.category] ?? series.category}
          {" · "}
          {series.weeklyCars
            ? "carro muda por semana"
            : series.cars.slice(0, 3).join(", ") +
              (series.cars.length > 3 ? ` +${series.cars.length - 3}` : "")}
        </div>

        {week && (
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-[12px]">
            <span className="text-flag">{week.track}</span>
            <span className="tnum font-mono text-ink-dim">
              {week.duration.label}
            </span>
            {week.rain && week.rain !== "None" && (
              <span className="text-ink-faint">chuva {week.rain}</span>
            )}
          </div>
        )}
      </button>

      <div className="hidden w-[130px] shrink-0 text-right sm:block">
        <div className="tnum font-mono text-[12px] text-ink-dim">
          {durationRangeLabel(series)}
        </div>
        <div className="tnum font-mono text-[11px] text-ink-faint">
          {series.weekCount} semanas
        </div>
      </div>
    </div>
  );
}

export function SeriesDetail({
  series,
  onClose,
}: {
  series: Series;
  onClose: () => void;
}) {
  const { favorites, toggleFavorite, owned } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={series.name}
        className="scroll-thin relative flex h-full w-full max-w-[720px] flex-col overflow-y-auto border-l border-line bg-base"
      >
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-line bg-base px-5 py-4">
          <ClassBadge cls={series.licenseClass} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-snug">
              {series.name}
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-faint">
              {CATEGORY_LABEL[series.category] ?? series.category}
              {series.licenseFrom &&
                ` · ${series.licenseFrom} (${series.licenseFromSR}) até ${series.licenseTo}`}
            </p>
          </div>
          <StarButton
            on={favorites.has(series.id)}
            onClick={() => toggleFavorite(series.id)}
          />
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-[13px] text-ink-dim hover:bg-panel-2 hover:text-ink"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          <Stat label="Horários" value={series.raceFrequency ?? "—"} wide />
          <Stat label="Mín. p/ oficial" value={series.minEntries ?? "—"} />
          <Stat label="Split em" value={series.splitAt ?? "—"} />
          <Stat label="Drops" value={series.drops ?? "—"} />
          <Stat
            label="Incidentes"
            value={
              series.incidentPenalty
                ? `penalidade a cada ${series.incidentPenalty}`
                : "sem DT"
            }
          />
          <Stat label="DQ em" value={series.incidentDQ ?? "—"} />
          <Stat label="Duração" value={durationRangeLabel(series)} />
          <Stat label="Setup" value={series.fixedSetup ? "Fixed" : "Open"} />
        </div>

        <section className="px-5 py-4">
          <h3 className="mb-2 text-[13px] font-semibold">
            Carros{" "}
            <span className="tnum font-mono text-[11px] font-normal text-ink-faint">
              {series.cars.length}
            </span>
          </h3>
          {series.weeklyCars && (
            <p className="mb-2 text-[12px] text-ink-dim">
              Esta série troca o carro a cada semana — veja a tabela abaixo.
            </p>
          )}
          <ul className="flex flex-wrap gap-1.5">
            {series.cars.map((c) => (
              <li
                key={c}
                className={`rounded border px-2 py-1 text-[12px] ${
                  owned.has(c)
                    ? "border-line-soft text-ink-faint"
                    : "border-flag/40 text-ink"
                }`}
                title={owned.has(c) ? "Você marcou como já tenho" : "Ainda não marcado como seu"}
              >
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section className="px-5 pb-8">
          <h3 className="mb-2 text-[13px] font-semibold">Calendário</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-line text-left text-ink-faint">
                  <th className="py-1.5 pr-2 font-medium">Sem.</th>
                  <th className="py-1.5 pr-2 font-medium">Abre</th>
                  <th className="py-1.5 pr-2 font-medium">Pista</th>
                  <th className="py-1.5 pr-2 font-medium">Duração</th>
                  <th className="py-1.5 pr-2 font-medium">Condições</th>
                </tr>
              </thead>
              <tbody>
                {series.weeks.map((w) => (
                  <WeekRow key={`${w.week}-${w.start}`} w={w} owned={owned} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function WeekRow({ w, owned }: { w: Week; owned: Set<string> }) {
  return (
    <tr className="border-b border-line-soft align-top">
      <td className="tnum py-2 pr-2 font-mono text-ink-faint">{w.week}</td>
      <td className="tnum whitespace-nowrap py-2 pr-2 font-mono text-ink-dim">
        {fmtDate(w.start)}
      </td>
      <td className="py-2 pr-2">
        <span className={owned.has(w.track) ? "text-ink-dim" : "text-ink"}>
          {w.track}
        </span>
        {w.cars && (
          <div className="mt-0.5 text-[11px] text-ink-faint">
            {w.cars.join(", ")}
          </div>
        )}
      </td>
      <td className="tnum whitespace-nowrap py-2 pr-2 font-mono">
        {w.duration.label}
      </td>
      <td className="py-2 pr-2 text-ink-faint">
        {w.tempC !== null && `${w.tempC}°C`}
        {w.rain && w.rain !== "None" && (
          <span className="text-ink-dim"> · chuva {w.rain}</span>
        )}
        {w.simTime && (
          <span className="tnum font-mono"> · {w.simTime}</span>
        )}
        {w.timeScale && w.timeScale !== "1x" && (
          <span className="tnum font-mono"> · {w.timeScale}</span>
        )}
        <div className="mt-0.5 leading-snug">{w.settings}</div>
        {w.carRules && (
          <div className="mt-0.5 leading-snug">{w.carRules.join(" · ")}</div>
        )}
      </td>
    </tr>
  );
}

function Stat({
  label,
  value,
  wide,
}: {
  label: string;
  value: string | number;
  wide?: boolean;
}) {
  return (
    <div className={`bg-base px-5 py-3 ${wide ? "col-span-2" : ""}`}>
      <div className="text-[11px] text-ink-faint">{label}</div>
      <div className="tnum mt-0.5 font-mono text-[12.5px] text-ink">
        {value}
      </div>
    </div>
  );
}

export { fmtDateLong };
