import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "tiny-inventory-recent-store-ids";
const MAX_RECENT = 10;

function readRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? (parsed as string[]).slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

export function useRecentStores() {
  const [recentIds, setRecentIds] = useState<string[]>(readRecentIds);

  useEffect(() => {
    setRecentIds(readRecentIds());
  }, []);

  const addRecent = useCallback((storeId: string) => {
    setRecentIds((current) => {
      const next = [storeId, ...current.filter((id) => id !== storeId)].slice(
        0,
        MAX_RECENT
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recentIds, addRecent };
}
