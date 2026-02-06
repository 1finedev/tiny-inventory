import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Store } from "@tiny-inventory/shared";

type StoreSortOption = "name-asc" | "name-desc" | "products-desc" | "products-asc" | "created-desc" | "created-asc";

type Props = {
  onBack: () => void;
  onStoreCreated?: () => void;
};

export function DashboardStores({ onBack, onStoreCreated }: Props) {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<StoreSortOption>("created-desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [formErrors, setFormErrors] = useState<Partial<{ name: string; slug: string }>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.stores.list();
      setStores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const filteredAndSortedStores = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? stores.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.slug ?? "").toLowerCase().includes(q)
        )
      : stores;
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "products-desc":
          return (b.productCount ?? 0) - (a.productCount ?? 0);
        case "products-asc":
          return (a.productCount ?? 0) - (b.productCount ?? 0);
        case "created-desc":
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
        case "created-asc":
          return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
        default:
          return 0;
      }
    });
    return sorted;
  }, [stores, search, sortBy]);

  const validate = useCallback((): boolean => {
    const errs: Partial<{ name: string; slug: string }> = {};
    if (!form.name.trim()) errs.name = "Required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form.name]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      if (modalMode === "create") {
        const created = await api.stores.create({
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
        });
        setStores((prev) => [{ ...created, productCount: created.productCount ?? 0 }, ...prev]);
      } else if (editingStore) {
        await api.stores.update(editingStore._id, {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
        });
      }
      if (modalMode !== "create") await fetchStores();
      else {
        fetchStores();
        onStoreCreated?.();
      }
      setModalOpen(false);
      setForm({ name: "", slug: "" });
      setEditingStore(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to save store");
    } finally {
      setSaving(false);
    }
  }, [editingStore, fetchStores, form, modalMode, onStoreCreated, validate]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setApiError(null);
    try {
      await api.stores.delete(deleteTarget._id);
      await fetchStores();
      setDeleteTarget(null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to delete store");
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, fetchStores]);

  const openCreate = useCallback(() => {
    setModalMode("create");
    setForm({ name: "", slug: "" });
    setFormErrors({});
    setApiError(null);
    setEditingStore(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((store: Store) => {
    setModalMode("edit");
    setForm({ name: store.name, slug: store.slug || "" });
    setFormErrors({});
    setApiError(null);
    setEditingStore(store);
    setModalOpen(true);
  }, []);

  if (loading && stores.length === 0) {
    return (
      <main className="main-content p-8 flex items-center justify-center">
        <div className="text-[var(--noir-muted)]">Loading stores...</div>
      </main>
    );
  }

  if (error && stores.length === 0) {
    return (
      <main className="main-content p-8">
        <p className="text-[var(--status-danger)]">{error}</p>
        <button onClick={fetchStores} className="btn mt-4">
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="main-content">
      <header className="p-8 pb-0 max-md:p-4 max-md:pb-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[var(--noir-text)] hover:text-[var(--amber-core)] transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="display-xl mb-2">View all stores</h1>
            <p className="text-[var(--noir-muted)]">
              {stores.length} store{stores.length !== 1 ? "s" : ""}
              {search.trim() && ` · ${filteredAndSortedStores.length} matching`}
            </p>
          </div>
          <button onClick={openCreate} className="btn btn-primary whitespace-nowrap">
            + Add Store
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-6">
          <div className="relative flex-1" style={{ maxWidth: "360px" }}>
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full"
              style={{ paddingLeft: "40px" }}
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--noir-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as StoreSortOption)}
            className="input py-2 px-3 text-sm bg-[var(--noir-surface)]"
            style={{ width: "auto", minWidth: "160px" }}
          >
            <option value="created-desc">Newest first</option>
            <option value="created-asc">Oldest first</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="products-desc">Most products</option>
            <option value="products-asc">Fewest products</option>
          </select>
        </div>
      </header>

      <section className="px-4 lg:px-8 py-8">
        <div className="card overflow-hidden">
          {stores.length === 0 ? (
            <div className="p-12 text-center text-[var(--noir-muted)]">
              <p className="mb-4">No stores yet.</p>
              <button onClick={openCreate} className="btn btn-primary">
                Add your first store
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--noir-border)]">
              {filteredAndSortedStores.map((store) => (
                <li
                  key={store._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/dashboard?store=${store._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/dashboard?store=${store._id}`);
                    }
                  }}
                  className="flex items-center justify-between gap-4 px-6 py-4 border-l-4 border-l-transparent hover:bg-[var(--noir-elevated)] hover:border-l-[var(--amber-core)] transition-colors transition-[border-color] duration-150 group cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--noir-bright)] group-hover:text-[var(--amber-core)] truncate transition-colors duration-150">{store.name}</p>
                    <p className="text-sm text-[var(--noir-muted)] group-hover:text-[var(--noir-text)] transition-colors duration-150">
                      {store.productCount ?? 0} products
                      {store.slug ? ` · ${store.slug}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEdit(store)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-[var(--noir-elevated)] rounded"
                      title="Edit store"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(store)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-[var(--status-danger)] hover:text-white rounded"
                      title="Delete store"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {modalOpen && (
        <>
          <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="p-6 border-b border-[var(--noir-border)] flex items-center justify-between">
              <h2 className="display-md">{modalMode === "create" ? "Add Store" : "Edit Store"}</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--noir-elevated)] rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {apiError && (
                <div className="mb-4 p-3 bg-[var(--status-danger)]/10 border border-[var(--status-danger)] rounded text-[var(--status-danger)] text-sm flex items-start justify-between">
                  <span>{apiError}</span>
                  <button onClick={() => setApiError(null)} className="ml-2 flex-shrink-0">×</button>
                </div>
              )}
              <div className="mb-5">
                <label className="mono-label block mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input"
                  style={formErrors.name ? { borderColor: "var(--status-danger)" } : undefined}
                  placeholder="Store name"
                />
                {formErrors.name && (
                  <p className="text-[var(--status-danger)] text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
              <div className="mb-6">
                <label className="mono-label block mb-2">Slug (optional)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().trim() }))}
                  className="input"
                  style={formErrors.slug ? { borderColor: "var(--status-danger)" } : undefined}
                  placeholder="store-slug"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1 disabled:opacity-50">
                  {saving ? "Saving..." : modalMode === "create" ? "Add Store" : "Save"}
                </button>
                <button onClick={() => setModalOpen(false)} className="btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteTarget && (
        <>
          <div className="modal-backdrop" onClick={() => setDeleteTarget(null)} />
          <div className="modal-content" style={{ maxWidth: "380px" }}>
            <div className="p-6">
              <h2 className="display-md mb-2">Delete store?</h2>
              <p className="text-[var(--noir-muted)] mb-6">
                “{deleteTarget.name}” will be soft-deleted. You can’t undo this.
              </p>
              <div className="flex gap-3">
                <button onClick={handleDelete} disabled={saving} className="btn bg-[var(--status-danger)] text-white flex-1 disabled:opacity-50">
                  {saving ? "Deleting..." : "Delete"}
                </button>
                <button onClick={() => setDeleteTarget(null)} className="btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
