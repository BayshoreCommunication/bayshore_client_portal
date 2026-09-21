"use client";

import { useCallback, useSyncExternalStore } from "react";

// Tiny localStorage-backed store so demo state (service cart, projects, call
// requests) survives page navigation and reloads until a real API exists.

const listeners = new Map<string, Set<() => void>>();
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

const read = <T,>(key: string, initial: T): T => {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return initial;
  }

  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value = initial;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = initial;
    }
  }
  snapshots.set(key, { raw, value });
  return value;
};

const notify = (key: string) => listeners.get(key)?.forEach((listener) => listener());

const subscribe = (key: string, listener: () => void) => {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === key) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    set.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

export const useLocalStore = <T,>(key: string, initial: T) => {
  const value = useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => read(key, initial),
    () => initial
  );

  const setValue = useCallback(
    (updater: T | ((previous: T) => T)) => {
      const previous = read(key, initial);
      const next = typeof updater === "function" ? (updater as (p: T) => T)(previous) : updater;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage unavailable (private mode / quota) — state simply won't persist.
      }
      notify(key);
    },
    [key, initial]
  );

  return [value, setValue] as const;
};

export const useHydrated = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
