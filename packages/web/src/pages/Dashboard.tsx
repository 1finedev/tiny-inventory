import { useCallback, useMemo, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { ProductCard, MetricsDisplay } from "@/components/dashboard";
import { Spinner } from "@/components/ui";
import { DashboardProductDetail } from "@/pages/DashboardProductDetail";
import { DashboardAddProduct } from "@/pages/DashboardAddProduct";
import { DashboardStores } from "@/pages/DashboardStores";
import { useStores, useUrlState, useInventory, useSidebar, type SortOption } from "@/hooks";
import type { InventoryItem } from "@tiny-inventory/shared";

const DEFAULT_THRESHOLD = 10;

export function Dashboard() {
  const { stores, allProductsCount, fetchStores, decrementStoreProductCount } = useStores();
  const { search, setSearch, debouncedSearch, selectedStore, setSelectedStore, sortBy, setSortBy } = useUrlState({ stores });
  const {
    inventory,
    loading,
    initialLoading,
    loadingMore,
    totalItems,
    hasMore,
    loadMoreRef,
    resetAndFetch,
    removeItemFromList,
  } = useInventory({
    debouncedSearch,
    selectedStore,
    sortBy: !selectedStore ? sortBy : sortBy === "store" ? "name" : sortBy,
  });
  const sidebar = useSidebar();

  const params = useParams<{ storeId?: string; productId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isProductDetail =
    Boolean(params.storeId) && Boolean(params.productId);
  const isAddProductPage = location.pathname === "/dashboard/add-product";
  const isStoresPage = location.pathname === "/dashboard/stores";

  // Top 15 stores by product count; if we're viewing a store not in that list, show it at the top
  const sidebarStores = useMemo(() => {
    const byProductCount = [...stores].sort(
      (a, b) => (b.productCount ?? 0) - (a.productCount ?? 0)
    );
    const top15 = byProductCount.slice(0, 15);
    if (!selectedStore) return top15;
    const inTop15 = top15.some((s) => s._id === selectedStore._id);
    if (inTop15) return top15;
    return [selectedStore, ...top15];
  }, [stores, selectedStore]);

  // Sync selection with route: select store when on store/product page, deselect elsewhere
  useEffect(() => {
    if (isStoresPage || isAddProductPage) {
      if (selectedStore) setSelectedStore(null);
      return;
    }
    if (isProductDetail && params.storeId && selectedStore?._id !== params.storeId) {
      const store = stores.find((s) => s._id === params.storeId);
      if (store) setSelectedStore(store);
      return;
    }
  }, [isStoresPage, isAddProductPage, isProductDetail, params.storeId, stores, selectedStore?._id, setSelectedStore]);

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
          <Link
            to="/dashboard"
            replace
            onClick={() => {
              sidebar.closeMobile();
              setSelectedStore(null);
              resetAndFetch();
            }}
            className={`flex items-center ${sidebar.collapsed ? "justify-center" : "gap-4"} text-[var(--noir-text)] hover:text-[var(--noir-bright)] no-underline cursor-pointer transition-colors`}
            aria-label="Go to dashboard"
          >
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
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <button
            onClick={() => {
              navigate("/dashboard/stores");
              sidebar.closeMobile();
            }}
            className={`w-full mb-2 py-2.5 border rounded-sm flex items-center justify-center gap-2 transition-all ${
              isStoresPage
                ? "border-[var(--amber-core)] bg-[var(--amber-glow)] text-[var(--amber-core)]"
                : "border-[var(--noir-border)] hover:border-[var(--amber-core)] hover:bg-[var(--amber-glow)] text-[var(--noir-text)] hover:text-[var(--amber-core)]"
            } ${sidebar.collapsed ? "px-2" : "px-4"}`}
            title="View All stores"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {!sidebar.collapsed && <span className="text-sm font-medium">View all stores</span>}
          </button>
      
          <button
            onClick={() => {
              navigate({ pathname: "/dashboard", search: "" });
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
          {sidebarStores.map((store) => (
            <button
              key={store._id}
              onClick={() => {
                navigate({ pathname: "/dashboard", search: `?store=${encodeURIComponent(store._id)}` });
                sidebar.closeMobile();
              }}
              className={`w-full text-left px-4 py-3 mb-1 transition-all duration-300 ${
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

      {isStoresPage ? (
        <DashboardStores
          onBack={() => navigate("/dashboard")}
          onStoreCreated={fetchStores}
        />
      ) : isAddProductPage ? (
        <DashboardAddProduct
          onBack={() => navigate("/dashboard")}
          onSuccess={() => {
            resetAndFetch();
            fetchStores();
          }}
        />
      ) : isProductDetail && params.storeId && params.productId ? (
        <DashboardProductDetail
          storeId={params.storeId}
          productId={params.productId}
          onBack={() =>
            navigate({
              pathname: "/dashboard",
              search: params.storeId ? `?store=${encodeURIComponent(params.storeId)}` : "",
            })
          }
          onSaveSuccess={resetAndFetch}
          onRemoveSuccess={() => {
            decrementStoreProductCount(params.storeId!);
            removeItemFromList(params.storeId!, params.productId!);
          }}
        />
      ) : (
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
                value={!selectedStore ? sortBy : sortBy === "store" ? "name" : sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="input py-2 px-3 text-sm bg-[var(--noir-surface)]"
                style={{ width: "auto", minWidth: "140px" }}
              >
                <option value="name">Name A-Z</option>
                {!selectedStore && <option value="store">Store A-Z</option>}
                <option value="category">Category</option>
                <option value="price-asc">Price: Low-High</option>
                <option value="price-desc">Price: High-Low</option>
                <option value="stock-asc">Stock: Low-High</option>
                <option value="stock-desc">Stock: High-Low</option>
              </select>
              <button
                onClick={() =>
                  navigate("/dashboard/add-product", {
                    state: selectedStore ? { storeId: selectedStore._id } : undefined,
                  })
                }
                className="btn btn-primary animate-glow whitespace-nowrap"
              >
                + Add Product
              </button>
            </div>
          </div>

          {loading && inventory.length === 0 ? (
            <div className="card p-8 lg:p-16 text-center animate-fade-up">
              <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" aria-label="Loading products" />
                <div className="display-md text-[var(--noir-muted)]">
                  Loading products…
                </div>
              </div>
            </div>
          ) : inventory.length === 0 ? (
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
                {inventory.map((item) => (
                  <ProductCard
                    key={item._id}
                    item={item}
                    threshold={getThreshold(item)}
                    showStore={!selectedStore}
                    onEdit={(i) =>
                      navigate(
                        `/dashboard/product/${i.storeId}/${i.productId}`
                      )
                    }
                    onClick={() =>
                      navigate(
                        `/dashboard/product/${item.storeId}/${item.productId}`
                      )
                    }
                  />
                ))}
              </div>

              <div
                ref={loadMoreRef}
                className="flex justify-center items-center min-h-[72px] py-6"
                style={{ contain: "layout" }}
              >
                {loadingMore && (
                  <div className="flex items-center gap-3 text-[var(--noir-muted)]">
                    <Spinner size="md" aria-label="Loading more" />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}
                {!hasMore && inventory.length > 0 && !loadingMore && (
                  <p className="text-sm text-[var(--noir-muted)]">
                    All {totalItems} items loaded
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </main>
      )}
    </div>
  );
}
