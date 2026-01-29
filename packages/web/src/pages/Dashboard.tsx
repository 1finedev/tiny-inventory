import { useCallback, useMemo } from "react";
import { CategoryCombobox, ProductCard, MetricsDisplay } from "@/components/dashboard";
import { useStores, useUrlState, useInventory, useSidebar, useDashboardForms, type SortOption } from "@/hooks";
import type { InventoryItem } from "@tiny-inventory/shared";

const DEFAULT_THRESHOLD = 10;

export function Dashboard() {
  const { stores, allProductsCount, fetchStores } = useStores();
  const { search, setSearch, debouncedSearch, selectedStore, setSelectedStore, sortBy, setSortBy } = useUrlState({ stores });
  const {
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
  } = useInventory({ debouncedSearch, selectedStore, sortBy });
  const sidebar = useSidebar();
  const {
    editingItem,
    editForm,
    editErrors,
    addModalOpen,
    addForm,
    addErrors,
    storeModalOpen,
    storeModalMode,
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
  } = useDashboardForms({
    selectedStore,
    setSelectedStore,
    fetchStores,
    resetAndFetch,
    setInventory,
  });

  const getThreshold = useCallback(
    (item: InventoryItem) => item.lowStockThreshold ?? DEFAULT_THRESHOLD,
    []
  );

  const metrics = useMemo(() => ({
    totalItems: inventory.length,
    totalStock: inventory.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: inventory.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    lowStock: inventory.filter((item) => item.quantity < getThreshold(item)).length,
  }), [inventory, getThreshold]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[var(--noir-void)] flex items-center justify-center">
        <div className="text-center">
          <div className="display-md text-[var(--amber-core)] mb-4">
            Loading
          </div>
          <div className="mono-label">Fetching inventory data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${sidebar.collapsed ? "sidebar-collapsed" : ""}`}>
      <div
        className={`sidebar-overlay ${sidebar.mobileOpen ? "visible" : ""}`}
        onClick={() => sidebar.closeMobile()}
      />

      <aside className={`sidebar ${sidebar.mobileOpen ? "mobile-open" : ""}`}>
        <button
          onClick={() => sidebar.toggle()}
          className="sidebar-toggle"
          title={sidebar.collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className={`p-8 border-b border-[var(--noir-border)] ${sidebar.collapsed ? "flex justify-center" : ""}`}>
          <div className={`flex items-center ${sidebar.collapsed ? "justify-center" : "gap-4"}`}>
            <div className="w-10 h-10 bg-[var(--amber-core)] flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-[var(--noir-void)]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
            {!sidebar.collapsed && (
              <div>
                <div className="display-md tracking-tight" style={{ fontSize: "1.25rem" }}>
                  Tiny Inventory
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <button
            onClick={openCreateStoreModal}
            className={`w-full mb-2 py-2.5 border border-dashed border-[var(--noir-border)] hover:border-[var(--amber-core)] hover:bg-[var(--amber-glow)] text-[var(--noir-muted)] hover:text-[var(--amber-core)] transition-all rounded-sm flex items-center justify-center gap-2 ${
              sidebar.collapsed ? "px-2" : "px-4"
            }`}
            title="Add Store"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {!sidebar.collapsed && <span className="text-sm font-medium">Add Store</span>}
          </button>
          <button
            onClick={() => {
              setSelectedStore(null);
              sidebar.closeMobile();
            }}
            className={`w-full text-left px-4 py-3 mb-1 transition-all duration-300 ${
              !selectedStore
                ? "bg-[var(--amber-glow)] border-l-2 border-[var(--amber-core)] text-[var(--noir-bright)]"
                : "hover:bg-[var(--noir-surface)] text-[var(--noir-text)]"
            } ${sidebar.collapsed ? "px-2 flex justify-center" : ""}`}
            title={sidebar.collapsed ? "All Stores" : undefined}
          >
            {sidebar.collapsed ? (
              <span className="mono-value text-sm">{allProductsCount}</span>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-medium sidebar-text">All Stores</span>
                <span className="mono-value text-sm">{allProductsCount}</span>
              </div>
            )}
          </button>
          {stores.map((store) => (
            <div
              key={store._id}
              className={`group relative mb-1 ${
                sidebar.collapsed ? "" : "pr-16"
              }`}
            >
              <button
                onClick={() => {
                  setSelectedStore(store);
                  sidebar.closeMobile();
                }}
                className={`w-full text-left px-4 py-3 transition-all duration-300 ${
                  selectedStore?._id === store._id
                    ? "bg-[var(--amber-glow)] border-l-2 border-[var(--amber-core)] text-[var(--noir-bright)]"
                    : "hover:bg-[var(--noir-surface)] text-[var(--noir-text)]"
                } ${sidebar.collapsed ? "px-2 flex justify-center" : ""}`}
                title={sidebar.collapsed ? store.name : undefined}
              >
                {sidebar.collapsed ? (
                  <span className="mono-value text-sm" title={store.name}>
                    {store.productCount ?? 0}
                  </span>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium sidebar-text truncate">
                      {store.name}
                    </span>
                    <span className="mono-value text-sm text-[var(--noir-muted)]">
                      {store.productCount ?? 0}
                    </span>
                  </div>
                )}
              </button>
              {!sidebar.collapsed && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditStoreModal(store);
                    }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-[var(--noir-elevated)] rounded"
                    title="Edit Store"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteStore(store);
                    }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-[var(--status-danger)] hover:text-white rounded"
                    title="Delete Store"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-[var(--noir-border)]">
          <div
            className={`flex items-center gap-3 ${
              sidebar.collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-9 h-9 bg-[var(--noir-elevated)] flex items-center justify-center text-[var(--amber-core)] font-mono font-bold text-sm flex-shrink-0">
              A
            </div>
            {!sidebar.collapsed && (
              <div className="sidebar-text">
                <div className="text-sm text-[var(--noir-bright)]">Admin</div>
                <div className="mono-label" style={{ fontSize: "0.6rem" }}>
                  Warehouse Manager
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="p-8 pb-0 max-md:p-4 max-md:pb-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8 mb-8 lg:mb-12 animate-fade-up">
            <div className="flex items-center gap-4">
              <button
                onClick={() => sidebar.openMobile()}
                className="mobile-menu-toggle"
                aria-label="Open menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div>
                <h1 className="display-xl mb-1 lg:mb-3">
                  {selectedStore ? selectedStore.name : "Inventory"}
                </h1>
                <p className="text-[var(--noir-muted)] text-base lg:text-lg max-w-xl">
                  {selectedStore
                    ? `Managing stock for ${selectedStore.name} warehouse.`
                    : "Overview of all warehouse inventory."}
                </p>
              </div>
            </div>
            <div
              className="search-wrapper"
              style={{ position: "relative", width: "100%", maxWidth: "360px" }}
            >
              <input
                type="text"
                placeholder="Search by SKU, name, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-lg"
                style={{ paddingLeft: "48px" }}
              />
              <svg
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "20px",
                  height: "20px",
                  color: "var(--noir-muted)",
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                  className="mono-label"
                >
                  ...
                </div>
              )}
            </div>
          </div>

          <MetricsDisplay
            totalValue={metrics.totalValue}
            totalItems={metrics.totalItems}
            totalStock={metrics.totalStock}
            lowStock={metrics.lowStock}
          />
        </header>

        <section className="px-4 lg:px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="display-md mb-1">Products</h2>
              <p className="text-[var(--noir-muted)]">
                {totalItems} total{search && ` matching "${search}"`}
                {inventory.length < totalItems && ` • Showing ${inventory.length}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="input py-2 px-3 text-sm bg-[var(--noir-surface)]"
                style={{ width: "auto", minWidth: "140px" }}
              >
                <option value="name">Name A-Z</option>
                <option value="category">Category</option>
                <option value="price-asc">Price: Low-High</option>
                <option value="price-desc">Price: High-Low</option>
                <option value="stock-asc">Stock: Low-High</option>
                <option value="stock-desc">Stock: High-Low</option>
              </select>
              <button
                onClick={openAddModal}
                className="btn btn-primary animate-glow whitespace-nowrap"
              >
                + Add Product
              </button>
            </div>
          </div>

          {sortedInventory.length === 0 ? (
            <div className="card p-8 lg:p-16 text-center animate-fade-up">
              <div className="display-md text-[var(--noir-muted)] mb-4">
                No products found
              </div>
              <p className="text-[var(--noir-muted)]">
                {search
                  ? "Try adjusting your search."
                  : "Add products to get started."}
              </p>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {sortedInventory.map((item) => (
                  <ProductCard
                    key={item._id}
                    item={item}
                    threshold={getThreshold(item)}
                    onClick={() => openEditModal(item)}
                  />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={loadMoreRef} className="py-8 flex justify-center">
                {loadingMore && (
                  <div className="flex items-center gap-3 text-[var(--noir-muted)]">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
                {!hasMore && inventory.length > 0 && (
                  <p className="text-sm text-[var(--noir-muted)]">
                    All {totalItems} items loaded
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {editingItem && (
        <>
          <div
            className="modal-backdrop"
            onClick={closeEditModal}
          />
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <div className="p-6 border-b border-[var(--noir-border)] flex items-center justify-between">
              <h2 className="display-md">Edit Product</h2>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--noir-elevated)]"
              >
                <svg
                  className="w-5 h-5 text-[var(--noir-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {apiError && (
                <div className="mb-4 p-3 bg-[var(--status-danger)] bg-opacity-10 border border-[var(--status-danger)] rounded text-[var(--status-danger)] text-sm flex items-start justify-between">
                  <span>{apiError}</span>
                  <button
                    onClick={() => setApiError(null)}
                    className="ml-2 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="mb-5">
                <label className="mono-label block mb-2">Product Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="input"
                  style={
                    editErrors.name
                      ? { borderColor: "var(--status-danger)" }
                      : {}
                  }
                  autoFocus
                />
              </div>
              <div className="mb-5">
                <label className="mono-label block mb-2">Category</label>
                <CategoryCombobox
                  value={editForm.category}
                  onChange={(val) =>
                    setEditForm((f) => ({ ...f, category: val }))
                  }
                  categories={categories}
                  error={editErrors.category}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <label className="mono-label block mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, price: e.target.value }))
                    }
                    className="input"
                    min="0"
                    step="0.01"
                    style={
                      editErrors.price
                        ? { borderColor: "var(--status-danger)" }
                        : {}
                    }
                  />
                </div>
                <div>
                  <label className="mono-label block mb-2">Quantity</label>
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                    className="input"
                    min="0"
                    style={
                      editErrors.quantity
                        ? { borderColor: "var(--status-danger)" }
                        : {}
                    }
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="mono-label block mb-2">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={editForm.lowStockThreshold}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      lowStockThreshold: e.target.value,
                    }))
                  }
                  className="input"
                  min="0"
                  style={
                    editErrors.lowStockThreshold
                      ? { borderColor: "var(--status-danger)" }
                      : {}
                  }
                />
                <p className="text-[var(--noir-muted)] text-xs mt-1">
                  Items below this quantity will show as "Low"
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={closeEditModal}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--noir-border)]">
                <button
                  onClick={confirmDeleteProduct}
                  className="w-full btn text-[var(--status-danger)] hover:bg-[var(--status-danger)] hover:text-white transition-colors"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {addModalOpen && (
        <>
          <div
            className="modal-backdrop"
            onClick={closeAddModal}
          />
          <div className="modal-content" style={{ maxWidth: "520px" }}>
            <div className="p-6 border-b border-[var(--noir-border)] flex items-center justify-between">
              <h2 className="display-md">Add Product</h2>
              <button
                onClick={closeAddModal}
                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--noir-elevated)]"
              >
                <svg
                  className="w-5 h-5 text-[var(--noir-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {apiError && (
                <div className="mb-4 p-3 bg-[var(--status-danger)] bg-opacity-10 border border-[var(--status-danger)] rounded text-[var(--status-danger)] text-sm flex items-start justify-between">
                  <span>{apiError}</span>
                  <button
                    onClick={() => setApiError(null)}
                    className="ml-2 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="mb-5">
                <label className="mono-label block mb-2">SKU</label>
                <input
                  type="text"
                  value={addForm.sku}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))
                  }
                  className="input font-mono"
                  placeholder="e.g. ELC-001"
                  style={
                    addErrors.sku
                      ? { borderColor: "var(--status-danger)" }
                      : {}
                  }
                  autoFocus
                />
              </div>
              <div className="mb-5">
                <label className="mono-label block mb-2">Product Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="input"
                  style={
                    addErrors.name
                      ? { borderColor: "var(--status-danger)" }
                      : {}
                  }
                />
              </div>
              <div className="mb-5">
                <label className="mono-label block mb-2">Category</label>
                <CategoryCombobox
                  value={addForm.category}
                  onChange={(val) =>
                    setAddForm((f) => ({ ...f, category: val }))
                  }
                  categories={categories}
                  error={addErrors.category}
                />
              </div>
              <div className="mb-5">
                <label className="mono-label block mb-2">Store</label>
                <select
                  value={addForm.storeId}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, storeId: e.target.value }))
                  }
                  className="input"
                  style={
                    addErrors.storeId
                      ? { borderColor: "var(--status-danger)" }
                      : {}
                  }
                >
                  <option value="">Select store...</option>
                  {stores.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <label className="mono-label block mb-2">Price ($)</label>
                  <input
                    type="number"
                    value={addForm.price}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, price: e.target.value }))
                    }
                    className="input"
                    min="0"
                    step="0.01"
                    style={
                      addErrors.price
                        ? { borderColor: "var(--status-danger)" }
                        : {}
                    }
                  />
                </div>
                <div>
                  <label className="mono-label block mb-2">Quantity</label>
                  <input
                    type="number"
                    value={addForm.quantity}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                    className="input"
                    min="0"
                    style={
                      addErrors.quantity
                        ? { borderColor: "var(--status-danger)" }
                        : {}
                    }
                  />
                </div>
                <div>
                  <label className="mono-label block mb-2">Low Threshold</label>
                  <input
                    type="number"
                    value={addForm.lowStockThreshold}
                    onChange={(e) =>
                      setAddForm((f) => ({
                        ...f,
                        lowStockThreshold: e.target.value,
                      }))
                    }
                    className="input"
                    min="0"
                    style={
                      addErrors.lowStockThreshold
                        ? { borderColor: "var(--status-danger)" }
                        : {}
                    }
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddProduct}
                  disabled={saving}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Product"}
                </button>
                <button
                  onClick={closeAddModal}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {storeModalOpen && (
        <>
          <div
            className="modal-backdrop"
            onClick={closeStoreModal}
          />
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="p-6 border-b border-[var(--noir-border)] flex items-center justify-between">
              <h2 className="display-md">
                {storeModalMode === "create" ? "Add Store" : "Edit Store"}
              </h2>
              <button
                onClick={closeStoreModal}
                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--noir-elevated)]"
              >
                <svg
                  className="w-5 h-5 text-[var(--noir-muted)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {apiError && (
                <div className="mb-4 p-3 bg-[var(--status-danger)] bg-opacity-10 border border-[var(--status-danger)] rounded text-[var(--status-danger)] text-sm flex items-start justify-between">
                  <span>{apiError}</span>
                  <button
                    onClick={() => setApiError(null)}
                    className="ml-2 flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="mb-5">
                <label className="mono-label block mb-2">Store Name</label>
                <input
                  type="text"
                  value={storeForm.name}
                  onChange={(e) =>
                    setStoreForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="input"
                  style={
                    storeErrors.name
                      ? { borderColor: "var(--status-danger)" }
                      : {}
                  }
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="mono-label block mb-2">
                  Slug (optional)
                </label>
                <input
                  type="text"
                  value={storeForm.slug}
                  onChange={(e) =>
                    setStoreForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g., main-warehouse"
                />
                <p className="text-[var(--noir-muted)] text-xs mt-1">
                  URL-friendly identifier
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveStore}
                  disabled={saving}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : storeModalMode === "create"
                    ? "Create Store"
                    : "Save Changes"}
                </button>
                <button
                  onClick={closeStoreModal}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteConfirmOpen && deleteTarget && (
        <>
          <div
            className="modal-backdrop"
            onClick={closeDeleteConfirm}
          />
          <div className="modal-content" style={{ maxWidth: "400px" }}>
            <div className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-[var(--status-danger)] bg-opacity-20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[var(--status-danger)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="display-md text-center mb-2">
                Delete {deleteTarget.type === "store" ? "Store" : "Product"}?
              </h3>
              <p className="text-[var(--noir-muted)] text-center mb-6">
                Are you sure you want to delete "{deleteTarget.name}"?
                {deleteTarget.type === "store" &&
                  " All inventory in this store will also be deleted."}
                {deleteTarget.type === "product" &&
                  " This product will be removed from all stores."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="btn flex-1 bg-[var(--status-danger)] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Deleting..." : "Delete"}
                </button>
                <button
                onClick={closeDeleteConfirm}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
