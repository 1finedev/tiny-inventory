import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import type { Product } from "@tiny-inventory/shared";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const formSchema = z.object({
  quantity: z.number().min(0, "Quantity cannot be negative"),
  lowStockThreshold: z.number().min(0, "Threshold cannot be negative"),
});

export function ProductDetail() {
  const { storeId, productId } = useParams<{
    storeId: string;
    productId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromDashboard = location.state?.fromDashboard;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [threshold, setThreshold] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      navigate(fromDashboard ? "/" : `/stores/${storeId}/products`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const backPath = fromDashboard ? "/" : `/stores/${storeId}/products`;
  const backLabel = fromDashboard ? "Back to Dashboard" : "Back to Products";

  if (!storeId?.trim() || !productId?.trim()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-destructive">Invalid store or product.</div>
        <Link
          to="/stores"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Back to Stores
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-destructive">
          Error: {error || "Product not found"}
        </div>
        <Link
          to={backPath}
          className="mt-4 inline-block text-primary hover:underline"
        >
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            to={backPath}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
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
            {backLabel}
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-inter">{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <Badge variant="default">{product.category}</Badge>
              <Badge variant="primary">${product.price.toFixed(2)}</Badge>
            </div>

            <div className="border-t border-border pt-6 space-y-4">
              <label className="block">
                <span className="block text-sm font-semibold text-foreground mb-2">
                  Quantity in Stock
                </span>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    setValidationError(null);
                  }}
                  error={validationError || undefined}
                  className="text-lg"
                  min="0"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-semibold text-foreground mb-2">
                  Low Stock Threshold
                </span>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => {
                    setThreshold(e.target.value);
                    setThresholdError(null);
                  }}
                  error={thresholdError || undefined}
                  className="text-lg"
                  min="0"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Items below this quantity will show as "Low Stock"
                </p>
              </label>

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  isLoading={saving}
                  variant="primary"
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button onClick={() => navigate(backPath)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
