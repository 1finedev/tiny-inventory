import { useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { CategoryCombobox, StoreCombobox } from "@/components/dashboard";
import { useStores } from "@/hooks";
import { DEFAULT_CATEGORIES } from "@/hooks/useInventory";

interface AddForm {
  sku: string;
  name: string;
  category: string;
  price: string;
  storeId: string;
  quantity: string;
  lowStockThreshold: string;
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

type Props = {
  onBack: () => void;
  onSuccess?: () => void;
};

export function DashboardAddProduct({ onBack, onSuccess }: Props) {
  const location = useLocation();
  const { stores } = useStores();

  const initialStoreId =
    (location.state as { storeId?: string } | null)?.storeId ?? "";
  const [form, setForm] = useState<AddForm>({
    ...DEFAULT_ADD_FORM,
    storeId: initialStoreId,
  });
  const [errors, setErrors] = useState<Partial<AddForm>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validate = useCallback((): boolean => {
    const errs: Partial<AddForm> = {};
    if (!form.sku.trim()) errs.sku = "Required";
    if (!form.name.trim()) errs.name = "Required";
    if (!form.category.trim()) errs.category = "Required";
    if (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)
      errs.price = "Invalid";
    if (!form.storeId) errs.storeId = "Required";
    if (isNaN(parseInt(form.quantity, 10)) || parseInt(form.quantity, 10) < 0)
      errs.quantity = "Invalid";
    if (
      isNaN(parseInt(form.lowStockThreshold, 10)) ||
      parseInt(form.lowStockThreshold, 10) < 0
    )
      errs.lowStockThreshold = "Invalid";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      const product = await api.products.create({
        sku: form.sku.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category.trim(),
        price: parseFloat(form.price),
      });
      await api.inventory.update(form.storeId, product._id, {
        quantity: parseInt(form.quantity, 10),
        lowStockThreshold: parseInt(form.lowStockThreshold, 10),
      });
      onSuccess?.();
      onBack();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add product";
      setApiError(message);
    } finally {
      setSaving(false);
    }
  }, [form, validate, onSuccess, onBack]);

  return (
    <main className="main-content">
      <header className="p-8 pb-0 max-md:p-4 max-md:pb-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[var(--noir-text)] hover:text-[var(--amber-core)] transition-colors mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to inventory
        </button>
        <h1 className="display-xl mb-2">Add Product</h1>
        <p className="text-[var(--noir-muted)]">
          Create a new product and set initial stock for a store.
        </p>
      </header>

      <section className="px-4 lg:px-8 py-8">
        <div className="card p-6 max-w-xl border border-[var(--noir-border)]">
          {apiError && (
            <div className="mb-6 p-3 bg-[var(--status-danger)] bg-opacity-10 border border-[var(--status-danger)] rounded text-[var(--status-danger)] text-sm flex items-start justify-between">
              <span>{apiError}</span>
              <button
                onClick={() => setApiError(null)}
                className="ml-2 flex-shrink-0"
              >
                <svg
                  className="w-4 h-4"
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
          )}

          <div className="space-y-5">
            <div>
              <label className="mono-label block mb-2 text-[var(--noir-text)]">
                SKU
              </label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))
                }
                className="input w-full font-mono"
                placeholder="e.g. ELC-001"
                style={
                  errors.sku
                    ? { borderColor: "var(--status-danger)" }
                    : undefined
                }
              />
              {errors.sku && (
                <p className="text-[var(--status-danger)] text-sm mt-1">
                  {errors.sku}
                </p>
              )}
            </div>

            <div>
              <label className="mono-label block mb-2 text-[var(--noir-text)]">
                Product Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="input w-full"
                style={
                  errors.name
                    ? { borderColor: "var(--status-danger)" }
                    : undefined
                }
              />
              {errors.name && (
                <p className="text-[var(--status-danger)] text-sm mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="mono-label block mb-2 text-[var(--noir-text)]">
                Category
              </label>
              <CategoryCombobox
                value={form.category}
                onChange={(val) =>
                  setForm((f) => ({ ...f, category: val }))
                }
                categories={DEFAULT_CATEGORIES}
                error={errors.category}
              />
              {errors.category && (
                <p className="text-[var(--status-danger)] text-sm mt-1">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label className="mono-label block mb-2 text-[var(--noir-text)]">
                Store
              </label>
              <StoreCombobox
                value={form.storeId}
                onChange={(storeId) =>
                  setForm((f) => ({ ...f, storeId }))
                }
                stores={stores}
                error={errors.storeId}
              />
              {errors.storeId && (
                <p className="text-[var(--status-danger)] text-sm mt-1">
                  {errors.storeId}
                </p>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label className="mono-label block mb-2 text-[var(--noir-text)]">
                  Price ($)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  className="input w-full"
                  min={0}
                  step="0.01"
                  style={
                    errors.price
                      ? { borderColor: "var(--status-danger)" }
                      : undefined
                  }
                />
                {errors.price && (
                  <p className="text-[var(--status-danger)] text-sm mt-1">
                    {errors.price}
                  </p>
                )}
              </div>
              <div>
                <label className="mono-label block mb-2 text-[var(--noir-text)]">
                  Quantity
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  className="input w-full"
                  min={0}
                  style={
                    errors.quantity
                      ? { borderColor: "var(--status-danger)" }
                      : undefined
                  }
                />
                {errors.quantity && (
                  <p className="text-[var(--status-danger)] text-sm mt-1">
                    {errors.quantity}
                  </p>
                )}
              </div>
              <div>
                <label className="mono-label block mb-2 text-[var(--noir-text)]">
                  Low Threshold
                </label>
                <input
                  type="number"
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      lowStockThreshold: e.target.value,
                    }))
                  }
                  className="input w-full"
                  min={0}
                  style={
                    errors.lowStockThreshold
                      ? { borderColor: "var(--status-danger)" }
                      : undefined
                  }
                />
                <p className="text-[var(--noir-muted)] text-xs mt-1">
                  Items below this show as low stock
                </p>
                {errors.lowStockThreshold && (
                  <p className="text-[var(--status-danger)] text-sm mt-1">
                    {errors.lowStockThreshold}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Product"}
              </button>
              <button onClick={onBack} className="btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
