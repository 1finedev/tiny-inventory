import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import type { InventoryItem, StoreMetrics } from "@tiny-inventory/shared";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { MetricsCard } from "@/components/ui/MetricsCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

type StoreProductsProps = {
  storeIdOverride?: string;
  embedInDashboard?: boolean;
};

export function StoreProducts({
  storeIdOverride,
  embedInDashboard,
}: StoreProductsProps = {}) {
  const { storeId: storeIdParam } = useParams<{ storeId: string }>();
  const storeId = storeIdOverride ?? storeIdParam ?? "";
  const navigate = useNavigate();
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [metrics, setMetrics] = useState<StoreMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedMinPrice = useDebounce(minPrice, 300);
  const debouncedMaxPrice = useDebounce(maxPrice, 300);

  useEffect(() => {
    if (!storeId?.trim()) return;

    setLoading(true);
    Promise.all([
      api.inventory.list({
        storeId,
        search: debouncedSearch || undefined,
        category: category || undefined,
        minPrice: debouncedMinPrice ? parseFloat(debouncedMinPrice) : undefined,
        maxPrice: debouncedMaxPrice ? parseFloat(debouncedMaxPrice) : undefined,
        lowStockOnly,
        page,
        limit: 20,
      }),
      api.inventory.getMetrics(storeId),
    ])
      .then(([productsData, metricsData]) => {
        setProducts(productsData.data);
        setPagination(productsData.pagination);
        setMetrics(metricsData);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  }, [
    storeId,
    debouncedSearch,
    category,
    debouncedMinPrice,
    debouncedMaxPrice,
    lowStockOnly,
    page,
  ]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, debouncedMinPrice, debouncedMaxPrice, lowStockOnly]);

  const categories = Array.from(
    new Set(
      products
        .map((p) => p?.product?.category)
        .filter((c): c is string => typeof c === "string")
    )
  );

  if (!storeId?.trim()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">Invalid store.</div>
        <Link
          to={embedInDashboard ? "/" : "/stores"}
          className="mt-4 inline-block text-primary hover:underline"
        >
          {embedInDashboard ? "Back to Dashboard" : "Back to Stores"}
        </Link>
      </div>
    );
  }

  if (loading && !products.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-muted-foreground">
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to={embedInDashboard ? "/" : "/stores"}
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
            {embedInDashboard ? "Back to Dashboard" : "Back to Stores"}
          </Link>
        </div>

        <PageHeader
          title="Store Products"
          subtitle="Manage inventory and track product availability"
        />

        {metrics && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricsCard
                label="Total Stock"
                value={metrics.totalStock}
                variant="primary"
              />
              <MetricsCard
                label="Total Value"
                value={`$${metrics.totalValue.toFixed(2)}`}
                variant="success"
              />
              <MetricsCard
                label="Low Stock Items"
                value={metrics.lowStockCount}
                variant="destructive"
              />
            </div>
          </div>
        )}

        <Card>
          <div className="p-6">
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <SearchBar
                  placeholder="Search by product name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={(e) => setLowStockOnly(e.target.checked)}
                    className="w-4 h-4 text-primary focus:ring-primary rounded"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Low Stock Only
                  </span>
                </label>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Price:
                  </span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-10 w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    min="0"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-10 w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-destructive"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-destructive font-medium">Error: {error}</p>
                </div>
              </div>
            )}

            {products.length === 0 ? (
              <EmptyState
                title="No products found"
                description="Try adjusting your search or filters to find what you're looking for"
                icon={
                  <svg
                    className="w-16 h-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                }
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((item) => {
                      const isLowStock =
                        item.quantity < item.lowStockThreshold;
                      return (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium">
                            {item?.product?.name ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              {item?.product?.category ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            $
                            {typeof item?.product?.price === "number"
                              ? item.product.price.toFixed(2)
                              : "0.00"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-bold text-lg",
                                  isLowStock
                                    ? "text-destructive"
                                    : "text-foreground"
                                )}
                              >
                                {item.quantity}
                              </span>
                              {isLowStock ? (
                                <StatusBadge status="warning" showDot={false}>
                                  Low Stock
                                </StatusBadge>
                              ) : (
                                <StatusBadge status="success" showDot={false}>
                                  In Stock
                                </StatusBadge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/stores/${storeId}/products/${item.productId}`,
                                  {
                                    state: embedInDashboard
                                      ? { fromDashboard: true }
                                      : undefined,
                                  }
                                )
                              }
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {pagination && pagination.pages > 1 && (
                  <div className="mt-4 flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-4 py-2 flex items-center text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(pagination.pages, p + 1))
                      }
                      disabled={page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
