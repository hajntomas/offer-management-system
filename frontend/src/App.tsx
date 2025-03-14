// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ProductsPage } from './pages/ProductsPage';
import { OffersPage } from './pages/OffersPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { useEffect, useState } from 'react';

// Komponenta pro ochranu cest (require authentication)
type ProtectedRouteProps = {
  children: React.ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Kontrola, zda je uživatel přihlášen
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
  }, []);

  // Během načítání zobrazit spinner nebo prázdnou stránku
  if (isLoggedIn === null) {
    return <div className="flex justify-center items-center h-screen">Načítání...</div>;
  }

  // Pokud není přihlášen, přesměrovat na přihlašovací stránku
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Jinak zobrazit požadovaný obsah
  return <>{children}</>;
}

// Hlavní aplikační komponenta
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Veřejné stránky */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Pro vývoj - diagnostika je přístupná bez přihlášení */}
        <Route path="/dev/diagnostics" element={<DiagnosticsPage />} />
        
        {/* Chráněné stránky */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute>
            <ProductsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/offers" element={
          <ProtectedRoute>
            <OffersPage />
          </ProtectedRoute>
        } />
        
        {/* Výchozí přesměrování */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 - stránka nenalezena */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">Stránka nenalezena</p>
            <a
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Zpět na Dashboard
            </a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
