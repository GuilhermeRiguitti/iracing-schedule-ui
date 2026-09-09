"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  EMPTY_FILTERS,
  filterSeries,
  type Filters,
  type SortKey,
} from "@/lib/filters";
import { FilterRail } from "@/components/FilterRail";
import { SeriesDetail, SeriesRow } from "@/components/SeriesRow";
import { ErrorState, Loading, Pagination } from "@/components/ui";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "category", label: "Categoria" },
  { key: "name", label: "Nome" },
  { key: "class", label: "Licença" },
  { key: "duration-desc", label: "Mais longa" },
  { key: "duration-asc", label: "Mais curta" },
  { key: "weeks", label: "Nº de semanas" },
];

export default function SeriesPage() {
  const { data, error, favorites } = useStore();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [openId, setOpenId] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);

  const results = useMemo(
    () => (data ? filterSeries(data.series, filters, favorites) : []),
    [data, filters, favorites]
  );

  useEffect(() => setPage(1), [filters]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <Loading />;

  const pageCount = Math.max(1, Math.ceil(results.length / perPage));
  const current = results.slice((page - 1) * perPage, page * perPage);
  const open = openId ? data.series.find((s) => s.id === openId) : null;

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col lg:flex-row">
      <div className={railOpen ? "block" : "hidden lg:block"}>
        <FilterRail data={data} filters={filters} setFilters={setFilters} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="sticky top-14 z-30 flex flex-wrap items-center gap-2 border-b border-line bg-base/95 px-3 py-3 backdrop-blur">
          <button
            onClick={() => setRailOpen((v) => !v)}
            className="rounded border border-line px-2.5 py-1.5 text-[12px] text-ink-dim lg:hidden"
          >
            {railOpen ? "Ocultar filtros" : "Filtros"}
          </button>

          <input
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="Buscar por série, carro ou pista…"
            className="min-w-[200px] flex-1 rounded border border-line bg-panel px-3 py-1.5 text-[13px] placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
          />

          <select
            value={filters.sort}
            onChange={(e) =>
              setFilters({ ...filters, sort: e.target.value as SortKey })
            }
            className="rounded border border-line bg-panel px-2 py-1.5 text-[12px] text-ink-dim focus:outline-none"
            aria-label="Ordenar por"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <span className="tnum font-mono text-[12px] text-ink-faint">
            {results.length}
          </span>
        </div>

        {current.length === 0 ? (
          <p className="px-4 py-20 text-center text-[13px] text-ink-dim">
            Nenhuma série bate com esses filtros. Tire alguma restrição para
            voltar a ver resultados.
          </p>
        ) : (
          <div>
            {current.map((s) => (
              <SeriesRow
                key={s.id}
                series={s}
                highlightWeek={filters.week}
                onOpen={() => setOpenId(s.id)}
              />
            ))}
          </div>
        )}

        <Pagination
          page={page}
          pageCount={pageCount}
          total={results.length}
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
