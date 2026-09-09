"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/filters";
import { ErrorState, Loading, Pagination } from "@/components/ui";
import type { ContentItem, Series } from "@/lib/types";

type Tab = "cars" | "tracks";
type Owning = "all" | "missing" | "owned";

interface Item extends ContentItem {
  /** semanas em que a lista da equipe usa isso */
  usedByList: { series: Series; weeks: number[] }[];
}

export default function ContentPage() {
  const { data, error, favorites, owned, toggleOwned, setOwnedBulk, byId } =
    useStore();
  const [tab, setTab] = useState<Tab>("cars");
  const [q, setQ] = useState("");
  const [owning, setOwning] = useState<Owning>("all");
  const [listOnly, setListOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const favSeries = useMemo(
    () =>
      [...favorites]
        .map((id) => byId.get(id))
        .filter((s): s is Series => Boolean(s)),
    [favorites, byId]
  );

  const items: Item[] = useMemo(() => {
    if (!data) return [];
    const base = tab === "cars" ? data.cars : data.tracks;
    return base.map((it) => {
      const usedByList: Item["usedByList"] = [];
      for (const s of favSeries) {
        if (tab === "cars") {
          if (s.cars.includes(it.name)) {
            const weeks = s.weeklyCars
              ? s.weeks.filter((w) => w.cars?.includes(it.name)).map((w) => w.week)
              : [];
            usedByList.push({ series: s, weeks });
          }
        } else if (s.tracks.includes(it.name)) {
          usedByList.push({
            series: s,
            weeks: s.weeks.filter((w) => w.track === it.name).map((w) => w.week),
          });
        }
      }
      return { ...it, usedByList };
    });
  }, [data, tab, favSeries]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return items
      .filter((it) => {
        if (n && !it.name.toLowerCase().includes(n)) return false;
        if (listOnly && it.usedByList.length === 0) return false;
        if (owning === "missing" && owned.has(it.name)) return false;
        if (owning === "owned" && !owned.has(it.name)) return false;
        return true;
      })
      .sort(
        (a, b) =>
          b.usedByList.length - a.usedByList.length ||
          b.count - a.count ||
          a.name.localeCompare(b.name)
      );
  }, [items, q, listOnly, owning, owned]);

  useEffect(() => setPage(1), [tab, q, owning, listOnly]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <Loading />;

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  const needed = items.filter((i) => i.usedByList.length > 0);
  const missing = needed.filter((i) => !owned.has(i.name));

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6">
      <header className="mb-6">
        <h1 className="text-[18px] font-semibold">Conteúdo</h1>
        <p className="mt-1 max-w-[70ch] text-[13px] text-ink-dim">
          Marque o que você já comprou. O que sobrar sem marcação é a sua lista
          de compras — e, com séries na lista da equipe, dá pra ver exatamente
          o que falta para rodar a temporada inteira nelas.
        </p>
      </header>

      {favSeries.length > 0 && (
        <div className="mb-5 rounded border border-line bg-panel px-4 py-3">
          <p className="text-[13px]">
            <span className="tnum font-mono">{favSeries.length}</span> séries na
            lista da equipe usam{" "}
            <span className="tnum font-mono">{needed.length}</span>{" "}
            {tab === "cars" ? "carros" : "pistas"} —{" "}
            <span className="tnum font-mono text-flag">{missing.length}</span>{" "}
            ainda sem marcação.
          </p>
          {missing.length > 0 && (
            <button
              onClick={() =>
                setOwnedBulk(
                  missing.map((m) => m.name),
                  true
                )
              }
              className="mt-2 rounded border border-line px-2 py-1 text-[12px] text-ink-dim hover:border-ink-faint hover:text-ink"
            >
              Marcar os {missing.length} como já comprados
            </button>
          )}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded border border-line p-0.5">
          {(
            [
              ["cars", `Carros (${data.cars.length})`],
              ["tracks", `Pistas (${data.tracks.length})`],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded px-3 py-1.5 text-[12.5px] ${
                tab === k ? "bg-signal text-base" : "text-ink-dim hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tab === "cars" ? "Buscar carro…" : "Buscar pista…"}
          className="min-w-[180px] flex-1 rounded border border-line bg-panel px-3 py-1.5 text-[13px] placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
        />

        <select
          value={owning}
          onChange={(e) => setOwning(e.target.value as Owning)}
          className="rounded border border-line bg-panel px-2 py-1.5 text-[12px] text-ink-dim focus:outline-none"
        >
          <option value="all">Tudo</option>
          <option value="missing">Só o que falta</option>
          <option value="owned">Só o que já tenho</option>
        </select>

        <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-ink-dim">
          <input
            type="checkbox"
            checked={listOnly}
            onChange={(e) => setListOnly(e.target.checked)}
            className="h-3.5 w-3.5 accent-flag"
          />
          Só o que a lista da equipe pede
        </label>
      </div>

      {current.length === 0 ? (
        <p className="py-20 text-center text-[13px] text-ink-dim">
          {listOnly && favSeries.length === 0
            ? "Marque séries com ★ na aba Séries para montar a lista da equipe."
            : "Nada aqui com esses filtros."}
        </p>
      ) : (
        <ul className="border-t border-line-soft">
          {current.map((it) => {
            const have = owned.has(it.name);
            return (
              <li
                key={it.name}
                className="flex items-start gap-3 border-b border-line-soft py-2.5"
              >
                <input
                  type="checkbox"
                  checked={have}
                  onChange={() => toggleOwned(it.name)}
                  className="mt-1 h-4 w-4 shrink-0 accent-flag"
                  aria-label={`Marcar ${it.name} como comprado`}
                />
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-[13.5px] ${
                      have ? "text-ink-faint line-through" : "text-ink"
                    }`}
                  >
                    {it.name}
                  </span>
                  {it.usedByList.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {it.usedByList.map(({ series, weeks }) => (
                        <li key={series.id} className="text-[11.5px] text-ink-faint">
                          {series.shortName}
                          {weeks.length > 0 && (
                            <span className="tnum font-mono">
                              {" "}
                              · semanas {weeks.join(", ")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <span
                  className="tnum shrink-0 font-mono text-[11.5px] text-ink-faint"
                  title="Séries que usam este conteúdo nesta temporada"
                >
                  {it.count} séries
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        total={filtered.length}
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

      <p className="mt-6 text-[11.5px] text-ink-faint">
        Dados extraídos do PDF oficial do schedule ({data.generatedFrom}). Uma
        pista pode aparecer com várias configurações — o iRacing normalmente
        vende o traçado inteiro num pacote só, então confira antes de comprar.
        Última semana registrada: {fmtDate(data.weekStarts.at(-1) ?? "")}.
      </p>
    </div>
  );
}
