import type { InventoryItem } from "@tiny-inventory/shared";

interface ProductCardProps {
  item: InventoryItem;
  onClick: () => void;
  onEdit?: (item: InventoryItem) => void;
  threshold?: number;
  /** Show store name on card (e.g. hide when already viewing a single store). Default true. */
  showStore?: boolean;
}

export function ProductCard({ item, onClick, onEdit, threshold = 10, showStore = true }: ProductCardProps) {
  const isLow = item.quantity < threshold;
  const isMed = item.quantity < threshold * 2.5 && !isLow;

  return (
    <article
      onClick={onClick}
      className="card cursor-pointer group hover:border-[var(--amber-core)] transition-colors"
    >
      <div className="h-32 bg-[var(--noir-deep)] relative overflow-hidden">
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="absolute top-3 left-3 z-10 p-1.5 rounded-md bg-[var(--noir-deep)]/80 text-[var(--noir-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--amber-core)] hover:bg-[var(--noir-surface)] transition-all"
            aria-label={`Edit ${item.product.name}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        <div
          className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--amber-core) 0%, transparent 50%)",
          }}
        />
        <span
          className="mono-label absolute bottom-4 left-4"
          style={{ fontSize: "0.6rem" }}
        >
          {item.product.category}
        </span>
        <span
          className={`badge absolute top-4 right-4 ${
            isLow
              ? "badge-danger"
              : isMed
              ? "badge-warning"
              : "badge-success"
          }`}
        >
          <span
            className={`status-dot ${
              isLow
                ? "status-dot-danger"
                : isMed
                ? "status-dot-warning"
                : "status-dot-success"
            }`}
          ></span>
          {isLow ? "Low" : isMed ? "Med" : "OK"}
        </span>
      </div>
      <div className="p-5">
        <div className="font-mono text-xs text-[var(--noir-muted)] mb-1">
          {item.product.sku}
        </div>
        <div className="mb-3">
          <h3 className="text-[var(--noir-bright)] font-semibold text-base lg:text-lg mb-1 group-hover:text-[var(--amber-core)] transition-colors leading-tight">
            {item.product.name}
          </h3>
          {showStore && item.storeName && (
            <div className="flex items-center gap-1.5 text-[var(--noir-muted)]">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-xs truncate" title={item.storeName}>{item.storeName}</span>
            </div>
          )}
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="mono-label mb-1">Price</div>
            <div className="mono-value">
              ${item.product.price.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div>
            <div className="mono-label mb-1">Stock</div>
            <div
              className={`mono-lg ${
                isLow
                  ? "text-[var(--status-danger)]"
                  : "text-[var(--noir-bright)]"
              }`}
            >
              {item.quantity}
            </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
