import type { Store } from "@tiny-inventory/shared";

interface SidebarProps {
  stores: Store[];
  selectedStore: Store | null;
  allProductsCount: number;
  collapsed: boolean;
  mobileOpen: boolean;
  onSelectStore: (store: Store | null) => void;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onCreateStore: () => void;
  onEditStore: (store: Store) => void;
  onDeleteStore: (store: Store) => void;
}

export function Sidebar({
  stores,
  selectedStore,
  allProductsCount,
  collapsed,
  mobileOpen,
  onSelectStore,
  onToggleCollapse,
  onCloseMobile,
  onCreateStore,
  onEditStore,
  onDeleteStore,
}: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="p-6 border-b border-[var(--noir-border)]">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <button
              onClick={onToggleCollapse}
              className="sidebar-toggle-btn"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className="w-5 h-5 text-[var(--amber-core)]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z" fill="none" />
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" fill="none" />
              </svg>
            </button>
            {!collapsed && (
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
            onClick={onCreateStore}
            className={`w-full mb-2 py-2.5 border border-dashed border-[var(--noir-border)] hover:border-[var(--amber-core)] hover:bg-[var(--amber-glow)] text-[var(--noir-muted)] hover:text-[var(--amber-core)] transition-all rounded-sm flex items-center justify-center gap-2 ${
              collapsed ? "px-2" : "px-4"
            }`}
            title="Add Store"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {!collapsed && <span className="text-sm font-medium">Add Store</span>}
          </button>

          <button
            onClick={() => {
              onSelectStore(null);
              onCloseMobile();
            }}
            className={`w-full text-left px-4 py-3 mb-1 transition-all duration-300 ${
              !selectedStore
                ? "bg-[var(--amber-glow)] border-l-2 border-[var(--amber-core)] text-[var(--noir-bright)]"
                : "hover:bg-[var(--noir-surface)] text-[var(--noir-text)]"
            } ${collapsed ? "px-2 flex justify-center" : ""}`}
            title={collapsed ? "All Stores" : undefined}
          >
            {collapsed ? (
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
              className={`group relative mb-1 ${collapsed ? "" : "pr-16"}`}
            >
              <button
                onClick={() => {
                  onSelectStore(store);
                  onCloseMobile();
                }}
                className={`w-full text-left px-4 py-3 transition-all duration-300 ${
                  selectedStore?._id === store._id
                    ? "bg-[var(--amber-glow)] border-l-2 border-[var(--amber-core)] text-[var(--noir-bright)]"
                    : "hover:bg-[var(--noir-surface)] text-[var(--noir-text)]"
                } ${collapsed ? "px-2 flex justify-center" : ""}`}
                title={collapsed ? store.name : undefined}
              >
                {collapsed ? (
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
              {!collapsed && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditStore(store);
                    }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-[var(--noir-elevated)] rounded"
                    title="Edit Store"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteStore(store);
                    }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-[var(--status-danger)] hover:text-white rounded"
                    title="Delete Store"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-[var(--noir-border)]">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-9 h-9 bg-[var(--noir-elevated)] flex items-center justify-center text-[var(--amber-core)] font-mono font-bold text-sm flex-shrink-0">
              A
            </div>
            {!collapsed && (
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
    </>
  );
}
