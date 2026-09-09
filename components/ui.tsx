"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CATEGORY_LABEL, CLASS_COLOR } from "@/lib/filters";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 text-[12px] font-semibold text-ink-dim">{children}</h3>
  );
}

export function ClassBadge({ cls }: { cls: string }) {
  return (
    <span
      title={`Licença classe ${cls}`}
      className="tnum inline-flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[11px] font-semibold text-base"
      style={{ background: CLASS_COLOR[cls] ?? CLASS_COLOR["-"] }}
    >
      {cls}
    </span>
  );
}

export function CategoryTag({ category }: { category: string }) {
  return (
    <span className="rounded border border-line px-1.5 py-0.5 text-[11px] text-ink-dim">
      {CATEGORY_LABEL[category] ?? category}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-[3px] text-[13px] text-ink-dim hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 shrink-0 accent-flag"
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="tnum font-mono text-[11px] text-ink-faint">
          {count}
        </span>
      )}
    </label>
  );
}

export function ChipGroup<T extends string>({
  options,
  selected,
  onToggle,
  labelOf,
  colorOf,
}: {
  options: T[];
  selected: T[];
  onToggle: (v: T) => void;
  labelOf?: (v: T) => string;
  colorOf?: (v: T) => string | undefined;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        const color = colorOf?.(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded border px-2 py-1 text-[12px] transition-colors ${
              on
                ? "border-transparent bg-signal text-base"
                : "border-line text-ink-dim hover:border-ink-faint hover:text-ink"
            }`}
            style={on && color ? { background: color, color: "#16181c" } : undefined}
          >
            {labelOf ? labelOf(o) : o}
          </button>
        );
      })}
    </div>
  );
}

/** Combo com busca para listas longas (carros, pistas). */
export function SearchSelect({
  options,
  selected,
  onToggle,
  placeholder,
  emptyLabel = "Nada encontrado",
}: {
  options: { name: string; count?: number }[];
  selected: string[];
  onToggle: (v: string) => void;
  placeholder: string;
  emptyLabel?: string;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    const base = n
      ? options.filter((o) => o.name.toLowerCase().includes(n))
      : options;
    return base.slice(0, 120);
  }, [options, q]);

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selected.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onToggle(s)}
              title="Remover"
              className="flex items-center gap-1 rounded bg-panel-2 px-1.5 py-0.5 text-[11px] text-ink hover:bg-line"
            >
              <span className="max-w-[190px] truncate">{s}</span>
              <span aria-hidden className="text-ink-faint">
                ×
              </span>
            </button>
          ))}
        </div>
      )}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-line bg-panel px-2 py-1.5 text-[13px] placeholder:text-ink-faint focus:border-ink-faint focus:outline-none"
      />
      {q.trim() && (
        <ul className="scroll-thin mt-1 max-h-56 overflow-y-auto rounded border border-line bg-panel">
          {filtered.length === 0 && (
            <li className="px-2 py-2 text-[12px] text-ink-faint">
              {emptyLabel}
            </li>
          )}
          {filtered.map((o) => (
            <li key={o.name}>
              <button
                type="button"
                onClick={() => onToggle(o.name)}
                className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-[12px] hover:bg-panel-2 ${
                  selected.includes(o.name) ? "text-flag" : "text-ink-dim"
                }`}
              >
                <span className="flex-1 truncate">{o.name}</span>
                {o.count !== undefined && (
                  <span className="tnum font-mono text-[11px] text-ink-faint">
                    {o.count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  perPage,
  onPage,
  onPerPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
  onPerPage: (n: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line px-3 py-3">
      <span className="tnum font-mono text-[12px] text-ink-faint">
        {from}–{to} de {total}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="rounded border border-line px-2 py-1 text-[12px] text-ink-dim disabled:opacity-30 enabled:hover:border-ink-faint enabled:hover:text-ink"
        >
          Anterior
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1 text-[12px] text-ink-faint">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`tnum min-w-[28px] rounded px-2 py-1 font-mono text-[12px] ${
                p === page
                  ? "bg-signal text-base"
                  : "text-ink-dim hover:bg-panel-2 hover:text-ink"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          className="rounded border border-line px-2 py-1 text-[12px] text-ink-dim disabled:opacity-30 enabled:hover:border-ink-faint enabled:hover:text-ink"
        >
          Próxima
        </button>
      </div>

      <select
        value={perPage}
        onChange={(e) => onPerPage(Number(e.target.value))}
        className="rounded border border-line bg-panel px-2 py-1 text-[12px] text-ink-dim focus:outline-none"
        aria-label="Itens por página"
      >
        {[20, 50, 100, 250].map((n) => (
          <option key={n} value={n}>
            {n} por página
          </option>
        ))}
      </select>
    </div>
  );
}

export function StarButton({
  on,
  onClick,
  title,
}: {
  on: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? (on ? "Tirar da lista da equipe" : "Adicionar à lista da equipe")}
      aria-pressed={on}
      className={`shrink-0 rounded p-1 text-[14px] leading-none transition-colors ${
        on ? "text-flag" : "text-ink-faint hover:text-ink-dim"
      }`}
    >
      {on ? "★" : "☆"}
    </button>
  );
}

export function Loading() {
  return (
    <div className="px-4 py-20 text-center text-[13px] text-ink-faint">
      Carregando o schedule…
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-[14px] text-ink">
        Não foi possível carregar o schedule.
      </p>
      <p className="mt-2 font-mono text-[12px] text-ink-faint">{message}</p>
      <p className="mt-4 text-[13px] text-ink-dim">
        Confirme que <code>public/data/schedule.json</code> existe. Se não,
        rode o script de extração de novo.
      </p>
    </div>
  );
}
