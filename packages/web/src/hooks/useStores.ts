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

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  return {
    stores,
    allProductsCount,
    fetchStores,
  };
}
