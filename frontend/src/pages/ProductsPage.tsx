// frontend/src/pages/ProductsPage.tsx
import { useEffect, useState } from 'react';
import { api } from '../services/api';

// Typy
type Product = {
  id: string;
  kod: string;
  nazev: string;
  cena_bez_dph: number;
  cena_s_dph: number;
  dostupnost: string;
  kategorie: string;
  vyrobce: string;
  popis: string;
};

export function ProductsPage() {
  // Stav
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importXml, setImportXml] = useState('');
  const [importStatus, setImportStatus] = useState('');

  // Načtení produktů
  useEffect(() => {
    fetchProducts();
  }, []);

  // Extrakce kategorií
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = Array.from(new Set(products.map(p => p.kategorie)));
      setCategories(uniqueCategories);
    }
  }, [products]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const fetchedProducts = await api.getProducts();
      setProducts(fetchedProducts);
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání produktů');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrované produkty
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.nazev.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.kod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.popis.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = filterCategory === '' || product.kategorie === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Import produktů z XML
  const handleImport = async () => {
    if (!importXml.trim()) {
      setImportStatus('Zadejte XML data');
      return;
    }
    
    setImportStatus('Importuji...');
    
    try {
      const result = await api.importProducts(importXml);
      setImportStatus(`Import dokončen: ${result.count} produktů`);
      fetchProducts(); // Znovu načíst produkty
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportXml('');
        setImportStatus('');
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    }
  };

  // Vykreslení UI
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Katalog produktů
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none"
            >
              Dashboard
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
            >
              Import z XML
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Filtrování a vyhledávání */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Vyhledávání</label>
            <input
              type="text"
              id="search"
              placeholder="Hledat podle názvu, kódu nebo popisu..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-full md:w-1/3">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategorie</label>
            <select
              id="category"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Všechny kategorie</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Seznam produktů */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="spinner"></div>
            <span className="ml-2">Načítání produktů...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            Nebyly nalezeny žádné produkty odpovídající zadaným kritériím.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900 truncate" title={product.nazev}>
                      {product.nazev}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.dostupnost === 'skladem' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {product.dostupnost}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Kód: {product.kod}</p>
                  <p className="mt-1 text-sm text-gray-600">Výrobce: {product.vyrobce}</p>
                  <p className="mt-1 text-sm text-gray-600">Kategorie: {product.kategorie}</p>
                  <p className="mt-3 text-sm text-gray-500 line-clamp-3" title={product.popis}>
                    {product.popis}
                  </p>
                  <div className="mt-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{product.cena_s_dph.toLocaleString()} Kč</p>
                        <p className="text-sm text-gray-600">{product.cena_bez_dph.toLocaleString()} Kč bez DPH</p>
                      </div>
                      <button
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md"
                        // Implementace detailu produktu
                        onClick={() => alert(`Detail produktu ${product.nazev} (ID: ${product.id})`)}
                      >
                        Detaily
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal pro import produktů */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Import produktů z XML</h3>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                XML data
              </label>
              <textarea
                rows={10}
                value={importXml}
                onChange={e => setImportXml(e.target.value)}
                placeholder="Vložte XML data pro import produktů..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
              {importStatus && (
                <div className={`mt-2 text-sm ${
                  importStatus.startsWith('Chyba') 
                    ? 'text-red-600' 
                    : importStatus.startsWith('Import dokončen') 
                      ? 'text-green-600' 
                      : 'text-gray-600'
                }`}>
                  {importStatus}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportXml('');
                  setImportStatus('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Zrušit
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Importovat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
