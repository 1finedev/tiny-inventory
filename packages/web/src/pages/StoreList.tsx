import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { Store } from "@tiny-inventory/shared";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function StoreList() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.stores
      .list()
      .then(setStores)
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading stores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-8 h-8 text-destructive"
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
              <h2 className="text-xl font-bold text-foreground">Error</h2>
            </div>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 font-inter">Stores</h1>
            <p className="text-muted-foreground">Select a store to manage inventory</p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">
              Dashboard (Admin / Merchant)
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card
              key={store._id}
              hover
              onClick={() => navigate(`/stores/${store.slug || store._id}/products`)}
              className="group cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {store.name}
                  </h2>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                {store.slug && (
                  <p className="text-sm text-muted-foreground font-mono font-sometype bg-d-7 px-2 py-1 rounded inline-block">
                    /{store.slug}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
