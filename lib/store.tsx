"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Schedule, Series } from "./types";

interface Store {
  data: Schedule | null;
  error: string | null;
  byId: Map<string, Series>;
  /** séries que a equipe pretende correr */
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  /** conteúdo que já foi comprado */
  owned: Set<string>;
  toggleOwned: (name: string) => void;
  setOwnedBulk: (names: string[], value: boolean) => void;
}

const Ctx = createContext<Store | null>(null);

function usePersistedSet(key: string) {
  const [set, setSet] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setSet(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* storage indisponível — segue sem persistir */
    }
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify([...set]));
    } catch {
      /* ignore */
    }
  }, [key, set, ready]);

  return [set, setSet] as const;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Schedule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = usePersistedSet("ip:favorites");
  const [owned, setOwned] = usePersistedSet("ip:owned");

  useEffect(() => {
    let alive = true;
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/schedule.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Schedule) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<Store>(() => {
    const byId = new Map<string, Series>();
    data?.series.forEach((s) => byId.set(s.id, s));
    return {
      data,
      error,
      byId,
      favorites,
      owned,
      toggleFavorite: (id) =>
        setFavorites((prev) => {
          const next = new Set(prev);
          next.has(id) ? next.delete(id) : next.add(id);
          return next;
        }),
      toggleOwned: (name) =>
        setOwned((prev) => {
          const next = new Set(prev);
          next.has(name) ? next.delete(name) : next.add(name);
          return next;
        }),
      setOwnedBulk: (names, on) =>
        setOwned((prev) => {
          const next = new Set(prev);
          names.forEach((n) => (on ? next.add(n) : next.delete(n)));
          return next;
        }),
    };
  }, [data, error, favorites, owned, setFavorites, setOwned]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}
