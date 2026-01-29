import type { InventoryItem } from "@tiny-inventory/shared";

interface ProductCardProps {
  item: InventoryItem;
  onClick: () => void;
  threshold?: number;
}

export function ProductCard({ item, onClick, threshold = 10 }: ProductCardProps) {
  const isLow = item.quantity < threshold;
  const isMed = item.quantity < threshold * 2.5 && !isLow;

  return (
    <article
      onClick={onClick}
      className="card cursor-pointer group hover:border-[var(--amber-core)] transition-colors"
    >
      <div className="h-32 bg-[var(--noir-deep)] relative overflow-hidden">
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
        <h3 className="text-[var(--noir-bright)] font-semibold text-base lg:text-lg mb-3 group-hover:text-[var(--amber-core)] transition-colors leading-tight">
          {item.product.name}
        </h3>
        <div className="flex items-end justify-between">
          <div>
            <div className="mono-label mb-1">Price</div>
            <div className="mono-value">
              ${item.product.price.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
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
    </article>
  );
}
