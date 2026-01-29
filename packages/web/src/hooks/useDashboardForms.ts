import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import type { InventoryItem, Store } from "@tiny-inventory/shared";

interface EditForm {
  name: string;
  category: string;
  price: string;
  quantity: string;
  lowStockThreshold: string;
}

interface AddForm {
  sku: string;
  name: string;
  category: string;
  price: string;
  storeId: string;
  quantity: string;
  lowStockThreshold: string;
}

interface StoreForm {
  name: string;
  slug: string;
}

const DEFAULT_ADD_FORM: AddForm = {
  sku: "",
  name: "",
  category: "",
  price: "",
  storeId: "",
  quantity: "0",
  lowStockThreshold: "10",
};

interface UseDashboardFormsOptions {
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  fetchStores: () => Promise<Store[]>;
  resetAndFetch: () => void;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export function useDashboardForms({
  selectedStore,
  setSelectedStore,
  fetchStores,
  resetAndFetch,
  setInventory,
}: UseDashboardFormsOptions) {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    category: "",
    price: "",
    quantity: "",
    lowStockThreshold: "",
  });
  const [editErrors, setEditErrors] = useState<Partial<EditForm>>({});

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(DEFAULT_ADD_FORM);
  const [addErrors, setAddErrors] = useState<Partial<AddForm>>({});

  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [storeModalMode, setStoreModalMode] = useState<"create" | "edit">("create");
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeForm, setStoreForm] = useState<StoreForm>({ name: "", slug: "" });
  const [storeErrors, setStoreErrors] = useState<Partial<StoreForm>>({});

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "store" | "product";
    id: string;
    name: string;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validateEditForm = useCallback((): boolean => {
    const errs: Partial<EditForm> = {};
    if (!editForm.name.trim()) errs.name = "Required";
    if (!editForm.category.trim()) errs.category = "Required";
    if (isNaN(parseFloat(editForm.price)) || parseFloat(editForm.price) < 0)
      errs.price = "Invalid";
    if (isNaN(parseInt(editForm.quantity, 10)) || parseInt(editForm.quantity, 10) < 0)
      errs.quantity = "Invalid";
    if (
      isNaN(parseInt(editForm.lowStockThreshold, 10)) ||
      parseInt(editForm.lowStockThreshold, 10) < 0
    )
      errs.lowStockThreshold = "Invalid";
    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  }, [editForm]);

  const validateAddForm = useCallback((): boolean => {
    const errs: Partial<AddForm> = {};
    if (!addForm.sku.trim()) errs.sku = "Required";
    if (!addForm.name.trim()) errs.name = "Required";
    if (!addForm.category.trim()) errs.category = "Required";
    if (isNaN(parseFloat(addForm.price)) || parseFloat(addForm.price) < 0)
      errs.price = "Invalid";
    if (!addForm.storeId) errs.storeId = "Required";
    if (isNaN(parseInt(addForm.quantity, 10)) || parseInt(addForm.quantity, 10) < 0)
      errs.quantity = "Invalid";
    if (
      isNaN(parseInt(addForm.lowStockThreshold, 10)) ||
      parseInt(addForm.lowStockThreshold, 10) < 0
    )
      errs.lowStockThreshold = "Invalid";
    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  }, [addForm]);

  const validateStoreForm = useCallback((): boolean => {
    const errs: Partial<StoreForm> = {};
    if (!storeForm.name.trim()) errs.name = "Required";
    setStoreErrors(errs);
    return Object.keys(errs).length === 0;
  }, [storeForm]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingItem || !validateEditForm()) return;
    setSaving(true);
    setApiError(null);
    try {
      const price = parseFloat(editForm.price);
      const qty = parseInt(editForm.quantity, 10);
      const threshold = parseInt(editForm.lowStockThreshold, 10);

      await Promise.all([
        api.products.update(editingItem.productId, {
          name: editForm.name.trim(),
          category: editForm.category.trim(),
          price,
        }),
        api.inventory.update(editingItem.storeId, editingItem.productId, {
          quantity: qty,
          lowStockThreshold: threshold,
        }),
      ]);

      setInventory((prev) =>
        prev.map((item) =>
          item._id === editingItem._id
            ? ({
                ...item,
                quantity: qty,
                lowStockThreshold: threshold,
                product: {
                  ...item.product,
                  name: editForm.name.trim(),
                  category: editForm.category.trim(),
                  price,
                },
              } as InventoryItem)
            : item
        )
      );
      setEditingItem(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save product";
      setApiError(message);
    } finally {
      setSaving(false);
    }
  }, [editingItem, editForm, validateEditForm, setInventory]);

  const handleAddProduct = useCallback(async () => {
    if (!validateAddForm()) return;
    setSaving(true);
    setApiError(null);
    try {
      const product = await api.products.create({
        sku: addForm.sku.trim().toUpperCase(),
        name: addForm.name.trim(),
        category: addForm.category.trim(),
        price: parseFloat(addForm.price),
      });
      await api.inventory.update(addForm.storeId, product._id, {
        quantity: parseInt(addForm.quantity, 10),
        lowStockThreshold: parseInt(addForm.lowStockThreshold, 10),
      });
      resetAndFetch();
      await fetchStores();
      setAddModalOpen(false);
      setAddForm(DEFAULT_ADD_FORM);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add product";
      setApiError(message);
    } finally {
      setSaving(false);
    }
  }, [addForm, fetchStores, resetAndFetch, validateAddForm]);

  const handleSaveStore = useCallback(async () => {
    if (!validateStoreForm()) return;
    setSaving(true);
    setApiError(null);
    try {
      if (storeModalMode === "create") {
        await api.stores.create({
          name: storeForm.name.trim(),
          slug: storeForm.slug.trim() || undefined,
        });
      } else if (editingStore) {
        await api.stores.update(editingStore._id, {
          name: storeForm.name.trim(),
          slug: storeForm.slug.trim() || undefined,
        });
      }
      await fetchStores();
      setStoreModalOpen(false);
      setStoreForm({ name: "", slug: "" });
      setEditingStore(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save store";
      setApiError(message);
    } finally {
      setSaving(false);
    }
  }, [editingStore, fetchStores, storeForm, storeModalMode, validateStoreForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setApiError(null);
    try {
      if (deleteTarget.type === "store") {
        await api.stores.delete(deleteTarget.id);
        await fetchStores();
        if (selectedStore?._id === deleteTarget.id) {
          setSelectedStore(null);
        }
        resetAndFetch();
      } else {
        await api.products.delete(deleteTarget.id);
        setInventory((prev) => prev.filter((item) => item.productId !== deleteTarget.id));
        setEditingItem(null);
      }
      await fetchStores();
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      setApiError(message);
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, fetchStores, resetAndFetch, selectedStore, setInventory, setSelectedStore]);

  const openEditModal = useCallback((item: InventoryItem) => {
    setEditingItem(item);
    setEditForm({
      name: item.product.name,
      category: item.product.category,
      price: item.product.price.toString(),
      quantity: item.quantity.toString(),
      lowStockThreshold: (item.lowStockThreshold ?? 10).toString(),
    });
    setEditErrors({});
    setApiError(null);
  }, []);

  const openAddModal = useCallback(() => {
    setAddForm({
      ...DEFAULT_ADD_FORM,
      storeId: selectedStore?._id || "",
    });
    setAddErrors({});
    setApiError(null);
    setAddModalOpen(true);
  }, [selectedStore]);

  const openCreateStoreModal = useCallback(() => {
    setStoreModalMode("create");
    setStoreForm({ name: "", slug: "" });
    setStoreErrors({});
    setApiError(null);
    setEditingStore(null);
    setStoreModalOpen(true);
  }, []);

  const openEditStoreModal = useCallback((store: Store) => {
    setStoreModalMode("edit");
    setStoreForm({ name: store.name, slug: store.slug || "" });
    setStoreErrors({});
    setApiError(null);
    setEditingStore(store);
    setStoreModalOpen(true);
  }, []);

  const confirmDeleteStore = useCallback((store: Store) => {
    setDeleteTarget({ type: "store", id: store._id, name: store.name });
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteProduct = useCallback(() => {
    if (!editingItem) return;
    setDeleteTarget({
      type: "product",
      id: editingItem.productId,
      name: editingItem.product.name,
    });
    setDeleteConfirmOpen(true);
  }, [editingItem]);

  const closeEditModal = useCallback(() => setEditingItem(null), []);
  const closeAddModal = useCallback(() => setAddModalOpen(false), []);
  const closeStoreModal = useCallback(() => setStoreModalOpen(false), []);
  const closeDeleteConfirm = useCallback(() => setDeleteConfirmOpen(false), []);

  return {
    editingItem,
    editForm,
    editErrors,
    addModalOpen,
    addForm,
    addErrors,
    storeModalOpen,
    storeModalMode,
    editingStore,
    storeForm,
    storeErrors,
    deleteConfirmOpen,
    deleteTarget,
    saving,
    apiError,
    setEditForm,
    setAddForm,
    setStoreForm,
    setApiError,
    handleSaveEdit,
    handleAddProduct,
    handleSaveStore,
    handleDelete,
    openEditModal,
    openAddModal,
    openCreateStoreModal,
    openEditStoreModal,
    confirmDeleteStore,
    confirmDeleteProduct,
    closeEditModal,
    closeAddModal,
    closeStoreModal,
    closeDeleteConfirm,
  };
}
