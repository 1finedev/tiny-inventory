import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import type { InventoryItem, Store } from "@tiny-inventory/shared";
import type { SortOption } from "./useUrlState";

const ITEMS_PER_PAGE = 12;
/** Start loading next page when sentinel is within this distance of viewport (px). */
const LOAD_MORE_ROOT_MARGIN = "400px";

export const DEFAULT_CATEGORIES = [
  "Accessories",
  "Appliances",
  "Audio/Video",
  "Electronics",
  "Furniture",
  "Gaming",
  "Office Supplies",
  "Storage",
];

interface UseInventoryOptions {
  debouncedSearch: string;
  selectedStore: Store | null;
  sortBy: SortOption;
}

export function useInventory({ debouncedSearch, selectedStore, sortBy }: UseInventoryOptions) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const fetchInFlightRef = useRef(false);

  const fetchInventory = useCallback(
    async (searchTerm: string, storeId?: string, pageNum: number = 1, append = false) => {
      if (append) {
        fetchInFlightRef.current = true;
        setLoadingMore(true);
      } else {
        setInventory([]);
        setTotalItems(0);
        setLoading(true);
      }

      try {
        const result = await api.inventory.list({
          search: searchTerm || undefined,
          storeId: storeId || undefined,
          sort: sortBy,
          page: pageNum,
          limit: ITEMS_PER_PAGE,
        });

        if (append) {
          setInventory((prev) => [...prev, ...result.data]);
        } else {
          setInventory(result.data);
        }

        setTotalItems(result.pagination.total);
        setCurrentPage(pageNum);
        setHasMore(pageNum < result.pagination.pages);
      } finally {
        if (append) fetchInFlightRef.current = false;
        setLoadingMore(false);
        setLoading(false);
      }
    },
    [sortBy]
  );

  const loadMore = useCallback(() => {
    if (fetchInFlightRef.current || !hasMore) return;
    fetchInventory(debouncedSearch, selectedStore?._id, currentPage + 1, true);
  }, [hasMore, debouncedSearch, selectedStore, currentPage, fetchInventory]);

  const resetAndFetch = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchInventory(debouncedSearch, selectedStore?._id, 1, false);
  }, [debouncedSearch, selectedStore, fetchInventory]);

  /** Remove one item from local state after delete. Avoids full refetch. */
  const removeItemFromList = useCallback((storeId: string, productId: string) => {
    setInventory((prev) =>
      prev.filter((i) => i.storeId !== storeId || i.productId !== productId)
    );
    setTotalItems((prev) => Math.max(0, prev - 1));
  }, []);

  const initialLoading = loading && inventory.length === 0;

  const categories = useMemo(() => {
    const fromInventory = new Set(inventory.map((item) => item.product.category));
    const combined = new Set([...DEFAULT_CATEGORIES, ...fromInventory]);
    return Array.from(combined).sort();
  }, [inventory]);

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setInventory([]);
    setTotalItems(0);
    setLoading(true);
    fetchInventory(debouncedSearch, selectedStore?._id, 1, false);
  }, [debouncedSearch, selectedStore, fetchInventory]);

  useEffect(() => {
    if (initialLoading || inventory.length === 0) return;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || !hasMore || fetchInFlightRef.current) return;
        loadMore();
      },
      { rootMargin: LOAD_MORE_ROOT_MARGIN, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [initialLoading, inventory.length, hasMore, loadMore]);

  return {
    inventory,
    loading,
    initialLoading,
    loadingMore,
    totalItems,
    hasMore,
    categories,
    loadMoreRef,
    resetAndFetch,
    removeItemFromList,
    setInventory,
  };
}
