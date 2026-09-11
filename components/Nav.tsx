"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const LINKS = [
  { href: "/", label: "Séries" },
  { href: "/calendario", label: "Calendário" },
  { href: "/favoritas", label: "Favoritas" },
  { href: "/conteudo", label: "Conteúdo" },
];

export function Nav() {
  const path = usePathname();
  const { data, favorites } = useStore();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-baseline gap-2.5">
          <span className="text-[15px] font-semibold tracking-tight">
            Planner iRacing
          </span>
          <span className="tnum hidden font-mono text-[11px] text-ink-faint sm:inline">
            {data?.season ?? "…"}
          </span>
        </Link>

        <nav className="scroll-thin flex min-w-0 items-center gap-1 overflow-x-auto">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 whitespace-nowrap rounded px-2.5 py-1.5 text-[13px] transition-colors ${
                  active
                    ? "bg-panel-2 text-ink"
                    : "text-ink-dim hover:bg-panel hover:text-ink"
                }`}
              >
                {l.label}
                {l.href === "/favoritas" && favorites.size > 0 && (
                  <span className="tnum ml-1.5 font-mono text-[11px] text-flag">
                    {favorites.size}
                  </span>
                )}
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
        </div>
      </div>
    </header>
  );
}
