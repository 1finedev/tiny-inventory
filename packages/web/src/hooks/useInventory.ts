import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import type { InventoryItem, Store } from "@tiny-inventory/shared";
import type { SortOption } from "./useUrlState";

const ITEMS_PER_PAGE = 12;

const DEFAULT_CATEGORIES = [
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchInventory = useCallback(
    async (searchTerm: string, storeId?: string, pageNum: number = 1, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await api.inventory.list({
          search: searchTerm || undefined,
          storeId: storeId || undefined,
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
        setLoadingMore(false);
        setLoading(false);
        setInitialLoading(false);
      }
    },
    []
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchInventory(debouncedSearch, selectedStore?._id, currentPage + 1, true);
    }
  }, [loadingMore, hasMore, debouncedSearch, selectedStore, currentPage, fetchInventory]);

  const resetAndFetch = useCallback(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchInventory(debouncedSearch, selectedStore?._id, 1, false);
  }, [debouncedSearch, selectedStore, fetchInventory]);

  const sortedInventory = useMemo(() => {
    const sorted = [...inventory];
    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => a.product.name.localeCompare(b.product.name));
      case "price-asc":
        return sorted.sort((a, b) => a.product.price - b.product.price);
      case "price-desc":
        return sorted.sort((a, b) => b.product.price - a.product.price);
      case "stock-asc":
        return sorted.sort((a, b) => a.quantity - b.quantity);
      case "stock-desc":
        return sorted.sort((a, b) => b.quantity - a.quantity);
      case "category":
        return sorted.sort((a, b) => a.product.category.localeCompare(b.product.category));
      default:
        return sorted;
    }
  }, [inventory, sortBy]);

  const categories = useMemo(() => {
    const fromInventory = new Set(inventory.map((item) => item.product.category));
    const combined = new Set([...DEFAULT_CATEGORIES, ...fromInventory]);
    return Array.from(combined).sort();
  }, [inventory]);

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchInventory(debouncedSearch, selectedStore?._id, 1, false);
  }, [debouncedSearch, selectedStore, fetchInventory]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  return {
    inventory,
    sortedInventory,
    loading,
    initialLoading,
    loadingMore,
    totalItems,
    hasMore,
    categories,
    loadMoreRef,
    resetAndFetch,
    setInventory,
  };
}
