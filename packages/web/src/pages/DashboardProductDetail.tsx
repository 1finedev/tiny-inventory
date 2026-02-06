import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Product } from "@tiny-inventory/shared";
import { z } from "zod";

const formSchema = z.object({
  quantity: z.number().min(0, "Quantity cannot be negative"),
  lowStockThreshold: z.number().min(0, "Threshold cannot be negative"),
});

type Props = {
  storeId: string;
  productId: string;
  onBack: () => void;
  onSaveSuccess?: () => void;
  onRemoveSuccess?: () => void;
};

export function DashboardProductDetail({ storeId, productId, onBack, onSaveSuccess, onRemoveSuccess }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [threshold, setThreshold] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!productId || !storeId) return;

    setLoading(true);
    setError(null);

    Promise.all([
      api.products.get(productId),
      api.inventory.list({ storeId, limit: 25 }),
    ])
      .then(([productData, inventoryData]) => {
        setProduct(productData);
        const item = inventoryData.data.find((i) => i.productId === productId);
        if (item) {
          setQuantity(item.quantity.toString());
          setThreshold(item.lowStockThreshold.toString());
        } else {
          setQuantity("0");
          setThreshold("10");
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  }, [productId, storeId]);

  const handleSave = async () => {
    if (!storeId || !productId) return;

    const parsed = formSchema.safeParse({
      quantity: quantity === "" ? NaN : parseFloat(quantity),
      lowStockThreshold: threshold === "" ? NaN : parseFloat(threshold),
    });

    if (!parsed.success) {
      const qtyError = parsed.error.issues.find((i) =>
        i.path.includes("quantity")
      );
      const threshError = parsed.error.issues.find((i) =>
        i.path.includes("lowStockThreshold")
      );
      setValidationError(qtyError?.message || null);
      setThresholdError(threshError?.message || null);
      return;
    }

    setValidationError(null);
    setThresholdError(null);
    setSaving(true);

    try {
      await api.inventory.update(storeId, productId, {
        quantity: parsed.data.quantity,
        lowStockThreshold: parsed.data.lowStockThreshold,
      });
      onSaveSuccess?.();
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromStore = async () => {
    if (!storeId || !productId || !product) return;
    setDeleting(true);
    setError(null);
    try {
      await api.inventory.removeFromStore(storeId, productId);
      onRemoveSuccess?.();
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  };

  if (!storeId?.trim() || !productId?.trim()) {
    return (
      <div className="main-content p-8">
        <p className="text-[var(--status-danger)]">Invalid store or product.</p>
        <button onClick={onBack} className="btn mt-4">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="main-content p-8 flex items-center justify-center">
        <div className="text-[var(--noir-muted)]">Loading...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="main-content p-8">
        <p className="text-[var(--status-danger)]">
          Error: {error || "Product not found"}
        </p>
        <button onClick={onBack} className="btn mt-4">
          Back to Dashboard
        </button>
      </div>
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
          Back to inventory
        </button>
        <h1 className="display-xl mb-2">{product.name}</h1>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded text-sm bg-[var(--noir-surface)] text-[var(--noir-muted)]">
            {product.category}
          </span>
          <span className="px-2.5 py-1 rounded text-sm bg-[var(--amber-glow)] text-[var(--amber-core)]">
            ${product.price.toFixed(2)}
          </span>
        </div>
      </header>

      <section className="px-4 lg:px-8 py-8">
        <div className="card p-6 max-w-xl border border-[var(--noir-border)]">
          <h2 className="text-lg font-semibold text-[var(--noir-bright)] mb-1">
            Edit inventory
          </h2>
          <p className="text-[var(--noir-muted)] text-sm mb-6">
            Update quantity and low stock threshold for this product at this store.
          </p>
          <div className="space-y-5">
            <div>
              <label className="mono-label block mb-2 text-[var(--noir-text)]">
                Quantity in stock
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setValidationError(null);
                }}
                className="input w-full cursor-text bg-[var(--noir-deep)] border border-[var(--noir-border)] hover:border-[var(--noir-muted)] focus:border-[var(--amber-dim)] focus:ring-2 focus:ring-[var(--amber-glow)]"
                min={0}
                placeholder="0"
                style={
                  validationError
                    ? { borderColor: "var(--status-danger)" }
                    : undefined
                }
              />
              {validationError && (
                <p className="text-[var(--status-danger)] text-sm mt-1">
                  {validationError}
                </p>
              )}
            </div>

            <div>
              <label className="mono-label block mb-2 text-[var(--noir-text)]">
                Low stock threshold
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => {
                  setThreshold(e.target.value);
                  setThresholdError(null);
                }}
                className="input w-full cursor-text bg-[var(--noir-deep)] border border-[var(--noir-border)] hover:border-[var(--noir-muted)] focus:border-[var(--amber-dim)] focus:ring-2 focus:ring-[var(--amber-glow)]"
                min={0}
                placeholder="10"
                style={
                  thresholdError
                    ? { borderColor: "var(--status-danger)" }
                    : undefined
                }
              />
              <p className="text-[var(--noir-muted)] text-xs mt-1">
                Items below this quantity will show as low stock
              </p>
              {thresholdError && (
                <p className="text-[var(--status-danger)] text-sm mt-1">
                  {thresholdError}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button onClick={onBack} className="btn">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="card p-6 max-w-xl mt-6 border border-[var(--status-danger)]">
          <h2 className="text-lg font-semibold text-[var(--noir-bright)] mb-6">
            Remove product from store?
          </h2>
          <div className="flex gap-3">
            <button
              onClick={handleRemoveFromStore}
              disabled={deleting}
              className="btn flex-1 bg-[var(--status-danger)] text-white hover:opacity-90 disabled:opacity-50"
            >
              {deleting ? "Removing..." : "Remove from store"}
            </button>
            <button
              onClick={onBack}
              disabled={deleting}
              className="btn flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
