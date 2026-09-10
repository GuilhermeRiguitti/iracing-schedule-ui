"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const LINKS = [
  { href: "/", label: "Séries" },
  { href: "/calendario", label: "Calendário" },
  { href: "/conteudo", label: "Conteúdo" },
];

export function Nav() {
  const path = usePathname();
  const { data, favorites } = useStore();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="text-[15px] font-semibold tracking-tight">
            Planner iRacing
          </span>
          <span className="tnum font-mono text-[11px] text-ink-faint">
            {data?.season ?? "…"}
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded px-2.5 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "bg-panel-2 text-ink"
                    : "text-ink-dim hover:bg-panel hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4 text-[12px] text-ink-faint">
          {data && (
            <span className="tnum hidden font-mono sm:inline">
              {data.series.length} séries · {data.tracks.length} pistas ·{" "}
              {data.cars.length} carros
            </span>
          )}
          {favorites.size > 0 && (
            <span className="tnum rounded-full border border-flag/40 px-2 py-0.5 font-mono text-[11px] text-flag">
              {favorites.size} favoritas
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
