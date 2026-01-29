import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type { Store } from "@tiny-inventory/shared";

export type SortOption =
  | "name"
  | "price-asc"
  | "price-desc"
  | "stock-asc"
  | "stock-desc"
  | "category";

interface UseUrlStateOptions {
  stores: Store[];
}

export function useUrlState({ stores }: UseUrlStateOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  const storeIdFromUrl = searchParams.get("store") || "";
  const searchFromUrl = searchParams.get("search") || "";
  const sortFromUrl = (searchParams.get("sort") as SortOption) || "name";

  const [search, setSearch] = useState(searchFromUrl);
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedStore = useMemo(
    () => stores.find((s) => s._id === storeIdFromUrl) || null,
    [stores, storeIdFromUrl]
  );

  const sortBy = sortFromUrl;

  // URL update helper with replace to avoid focus loss
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === null || value === "") {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        });
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const setSelectedStore = useCallback(
    (store: Store | null) => {
      updateUrlParams({ store: store?._id || null });
    },
    [updateUrlParams]
  );

  const setSortBy = useCallback(
    (s: SortOption) => {
      updateUrlParams({ sort: s === "name" ? null : s });
    },
    [updateUrlParams]
  );

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
      updateUrlParams({ search: search || null });
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, updateUrlParams]);

  return {
    search,
    setSearch,
    debouncedSearch,
    selectedStore,
    setSelectedStore,
    sortBy,
    setSortBy,
  };
}
