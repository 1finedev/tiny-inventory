import { useState, useCallback, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import type { Store } from "@tiny-inventory/shared";

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);

  const fetchStores = useCallback(async () => {
    const data = await api.stores.list();
    setStores(data);
    return data;
  }, []);

  const allProductsCount = useMemo(
    () => stores.reduce((sum, store) => sum + (store.productCount ?? 0), 0),
    [stores]
  );

  /** Local update after removing a product from a store. Avoids refetching all stores. */
  const decrementStoreProductCount = useCallback((storeId: string) => {
    setStores((prev) =>
      prev.map((s) =>
        s._id === storeId
          ? { ...s, productCount: Math.max(0, (s.productCount ?? 0) - 1) }
          : s
      )
    );
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return {
    stores,
    allProductsCount,
    fetchStores,
    decrementStoreProductCount,
  };
}
