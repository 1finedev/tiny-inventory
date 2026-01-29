import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Dashboard } from "@/pages/Dashboard";
import { StoreList } from "@/pages/StoreList";
import { StoreProducts } from "@/pages/StoreProducts";
import { ProductDetail } from "@/pages/ProductDetail";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            }
          />
          <Route
            path="/stores"
            element={
              <ErrorBoundary>
                <StoreList />
              </ErrorBoundary>
            }
          />
          <Route
            path="/stores/:storeId/products"
            element={
              <ErrorBoundary>
                <StoreProducts />
              </ErrorBoundary>
            }
          />
          <Route
            path="/stores/:storeId/products/:productId"
            element={
              <ErrorBoundary>
                <ProductDetail />
              </ErrorBoundary>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
