interface MetricsDisplayProps {
  totalValue: number;
  totalItems: number;
  totalStock: number;
  lowStock: number;
}

export function MetricsDisplay({ totalValue, totalItems, totalStock, lowStock }: MetricsDisplayProps) {
  return (
    <div className="metrics-grid mb-8 lg:mb-12">
      <div className="metrics-main card card-elevated p-6 lg:p-8 animate-fade-up stagger-1">
        <div className="mono-label mb-3 lg:mb-4">Total Inventory Value</div>
        <div className="display-lg text-[var(--amber-core)] mb-2">
          ${totalValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div className="text-[var(--noir-muted)] text-sm">
          Across {totalItems} products
        </div>
      </div>
      <div className="metrics-secondary">
        <div className="card p-4 lg:p-6 animate-fade-up stagger-2">
          <div className="mono-label mb-2">Products</div>
          <div className="mono-lg text-[var(--noir-bright)]">{totalItems}</div>
        </div>
        <div className="card p-4 lg:p-6 animate-fade-up stagger-3">
          <div className="mono-label mb-2">Total Units</div>
          <div className="mono-lg text-[var(--noir-bright)]">
            {totalStock.toLocaleString()}
          </div>
        </div>
        <div className="card p-4 lg:p-6 animate-fade-up stagger-4 relative">
          <div className="mono-label mb-2">Low Stock</div>
          <div
            className={`mono-lg ${
              lowStock > 0
                ? "text-[var(--status-danger)]"
                : "text-[var(--status-success)]"
            }`}
          >
            {lowStock}
          </div>
          {lowStock > 0 && (
            <span className="status-dot status-dot-danger absolute top-3 right-3"></span>
          )}
        </div>
      </div>
    </div>
  );
}
