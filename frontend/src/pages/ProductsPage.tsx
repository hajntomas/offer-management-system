// frontend/src/pages/ProductsPage.tsx
import { useEffect, useState, useRef } from 'react';
import { api, Product, ProductFilterOptions } from '../services/api';
import { ProductDetail } from '../components/ProductDetail';
import { OptimizedProductList } from '../components/OptimizedProductList';
import { VirtualizedProductList } from '../components/VirtualizedProductList';

export function ProductsPage() {
  // Stav
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Modaly pro import
  const [isXmlCenikModalOpen, setIsXmlCenikModalOpen] = useState(false);
  const [isXmlPopiskyModalOpen, setIsXmlPopiskyModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  // Data pro import
  const [importXmlCenik, setImportXmlCenik] = useState('');
  const [importXmlPopisky, setImportXmlPopisky] = useState('');
  const [importExcelFile, setImportExcelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Status importu
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  // Historie importů
  const [showImportHistory, setShowImportHistory] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  
  // Načtení produktů
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchManufacturers();
  }, [page, filterCategory, filterManufacturer]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    
    const options: ProductFilterOptions = {
      page,
      limit: 12,
      kategorie: filterCategory || undefined,
      vyrobce: filterManufacturer || undefined,
      search: searchTerm || undefined
    };
    
    try {
      const result = await api.getProducts(options);
      setProducts(result);
      // Předpokládáme, že api.getProducts vrací objekt s položkami products a pagination
      if (Array.isArray(result)) {
        setProducts(result);
        setTotalPages(1);
      } else if (result && typeof result === 'object') {
        if (Array.isArray(result.products)) {
          setProducts(result.products);
          if (result.pagination) {
            setTotalPages(result.pagination.totalPages || 1);
          }
        } else {
          setProducts([]);
          setTotalPages(1);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání produktů');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const categories = await api.getProductCategories();
      setCategories(categories || []);
    } catch (err) {
      console.error('Chyba při načítání kategorií:', err);
    }
  };
  
  const fetchManufacturers = async () => {
    try {
      const manufacturers = await api.getProductManufacturers();
      setManufacturers(manufacturers || []);
    } catch (err) {
      console.error('Chyba při načítání výrobců:', err);
    }
  };
  
  const fetchImportHistory = async () => {
    try {
      const history = await api.getProductImportHistory();
      
      if (history && history.import_history) {
        setImportHistory(history.import_history);
      } else {
        setImportHistory([]);
      }
    } catch (err) {
      console.error('Chyba při načítání historie importů:', err);
      setImportHistory([]);
    }
  };
  
  // Vyhledávání
  const handleSearch = () => {
    setPage(1); // Reset stránky
    fetchProducts();
  };
  
  // Import produktů z XML ceníku
  const handleImportXmlCenik = async () => {
    if (!importXmlCenik.trim()) {
      setImportStatus('Zadejte XML data');
      return;
    }
    
    setImportStatus('Importuji...');
    setIsImporting(true);
    
    try {
      const result = await api.importXmlCenik(importXmlCenik);
      setImportStatus(`Import dokončen: ${result.count} produktů`);
      setTimeout(() => {
        setIsXmlCenikModalOpen(false);
        setImportXmlCenik('');
        setImportStatus('');
        fetchProducts(); // Znovu načíst produkty
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Import produktů z XML popisků
  const handleImportXmlPopisky = async () => {
    if (!importXmlPopisky.trim()) {
      setImportStatus('Zadejte XML data');
      return;
    }
    
    setImportStatus('Importuji...');
    setIsImporting(true);
    
    try {
      const result = await api.importXmlPopisky(importXmlPopisky);
      setImportStatus(`Import dokončen: ${result.count} produktů`);
      setTimeout(() => {
        setIsXmlPopiskyModalOpen(false);
        setImportXmlPopisky('');
        setImportStatus('');
        fetchProducts(); // Znovu načíst produkty
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Import produktů z Excel souboru
  const handleImportExcel = async () => {
    if (!importExcelFile) {
      setImportStatus('Vyberte Excel soubor');
      return;
    }
    
    setImportStatus('Importuji...');
    setIsImporting(true);
    
    try {
      const result = await api.importExcel(importExcelFile);
      setImportStatus(`Import dokončen: ${result.count} produktů z ${result.filename}`);
      setTimeout(() => {
        setIsExcelModalOpen(false);
        setImportExcelFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setImportStatus('');
        fetchProducts(); // Znovu načíst produkty
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Ruční sloučení dat produktů
  const handleMergeProductData = async () => {
    setImportStatus('Slučuji data...');
    setIsImporting(true);
    
    try {
      const result = await api.mergeProductData();
      setImportStatus(`Sloučení dokončeno: ${result.count} produktů`);
      setTimeout(() => {
        setImportStatus('');
        fetchProducts(); // Znovu načíst produkty
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Pomocná funkce pro formátování data
  const formatDate = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleString();
    } catch (e) {
      return isoDate;
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
          <div className="flex space-x-2">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none"
            >
              Dashboard
            </button>
            <div className="relative">
              <button
                onClick={() => setImportModalOpen(!importModalOpen)}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
              >
                Import
              </button>
              
              {/* Dropdown menu pro import */}
              {importModalOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => {
                        setImportModalOpen(false);
                        setIsXmlCenikModalOpen(true);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Import XML ceníku
                    </button>
                    <button
                      onClick={() => {
                        setImportModalOpen(false);
                        setIsXmlPopiskyModalOpen(true);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Import XML popisků
                    </button>
                    <button
                      onClick={() => {
                        setImportModalOpen(false);
                        setIsExcelModalOpen(true);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Import Excel
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setImportModalOpen(false);
                        handleMergeProductData();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Sloučit data
                    </button>
                    <button
                      onClick={() => {
                        setImportModalOpen(false);
                        fetchImportHistory();
                        setShowImportHistory(true);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Historie importů
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {importStatus && (
          <div className={`mb-4 p-4 rounded-md ${
            importStatus.startsWith('Chyba') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {importStatus}
          </div>
        )}

        {/* Filtrování a vyhledávání */}
        <div className="mb-6 bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Vyhledávání</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="search"
                  placeholder="Hledat podle názvu, kódu nebo popisu..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 border border-gray-300"
                />
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
                >
                  Hledat
                </button>
              </div>
            </div>
            
            <div>
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
            
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">Výrobce</label>
              <select
                id="manufacturer"
                value={filterManufacturer}
                onChange={e => setFilterManufacturer(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Všichni výrobci</option>
                {manufacturers.map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Seznam produktů */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg">Načítání produktů...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white py-10 text-center text-gray-500 rounded-lg shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Žádné produkty</h3>
            <p className="mt-1 text-gray-500">Nebyly nalezeny žádné produkty odpovídající zadaným kritériím.</p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.kod} className="bg-white overflow-hidden shadow rounded-lg flex flex-col">
                  <div className="px-4 py-5 sm:p-6 flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900 truncate" title={product.nazev}>
                        {product.nazev}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        typeof product.dostupnost === 'number'
                          ? (product.dostupnost > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                          : String(product.dostupnost).toLowerCase().includes('skladem')
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                      }`}>
                        {typeof product.dostupnost === 'number'
                          ? (product.dostupnost > 0 ? `Skladem (${product.dostupnost})` : 'Není skladem')
                          : product.dostupnost
                        }
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">Kód: {product.kod}</p>
                    {product.vyrobce && <p className="mt-1 text-sm text-gray-600">Výrobce: {product.vyrobce}</p>}
                    {product.kategorie && <p className="mt-1 text-sm text-gray-600">Kategorie: {product.kategorie}</p>}
                    
                    {product.kratky_popis ? (
                      <p className="mt-3 text-sm text-gray-500 line-clamp-2" title={product.kratky_popis}>
                        {product.kratky_popis}
                      </p>
                    ) : product.popis ? (
                      <p className="mt-3 text-sm text-gray-500 line-clamp-2" title={product.popis}>
                        {product.popis}
                      </p>
                    ) : null}
                    
                    <div className="mt-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(product.cena_s_dph)} Kč
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(product.cena_bez_dph)} Kč bez DPH
                          </p>
                        </div>
                        <button
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                          onClick={() => setSelectedProductId(product.id || product.kod)}
                        >
                          Detaily
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Stránkování */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <nav className="flex space-x-2" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Předchozí
                  </button>
                  
                  <span className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300">
                    Stránka {page} z {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Další
                  </button>
                </nav>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Detail produktu */}
      {selectedProductId && (
        <ProductDetail
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      {/* Modal pro import XML ceníku */}
      {isXmlCenikModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Import produktů z XML ceníku</h3>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                XML data ceníku
              </label>
              <textarea
                rows={10}
                value={importXmlCenik}
                onChange={e => setImportXmlCenik(e.target.value)}
                placeholder="Vložte XML data produktového ceníku..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isImporting}
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
                  setIsXmlCenikModalOpen(false);
                  setImportXmlCenik('');
                  setImportStatus('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                disabled={isImporting}
              >
                Zrušit
              </button>
              <button
                onClick={handleImportXmlCenik}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                disabled={isImporting}
              >
                {isImporting ? 'Importuji...' : 'Importovat'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pro import XML popisků */}
      {isXmlPopiskyModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Import produktů z XML popisků</h3>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                XML data popisků
              </label>
              <textarea
                rows={10}
                value={importXmlPopisky}
                onChange={e => setImportXmlPopisky(e.target.value)}
                placeholder="Vložte XML data s popisky produktů..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isImporting}
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
                  setIsXmlPopiskyModalOpen(false);
                  setImportXmlPopisky('');
                  setImportStatus('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                disabled={isImporting}
              >
                Zrušit
              </button>
              <button
                onClick={handleImportXmlPopisky}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                disabled={isImporting}
              >
                {isImporting ? 'Importuji...' : 'Importovat'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pro import Excel souboru */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Import produktů z Excel souboru</h3>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excel soubor
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                onChange={e => setImportExcelFile(e.target.files ? e.target.files[0] : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isImporting}
              />
              {importExcelFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Vybraný soubor: {importExcelFile.name} ({formatFileSize(importExcelFile.size)})
                </p>
              )}
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
                  setIsExcelModalOpen(false);
                  setImportExcelFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  setImportStatus('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                disabled={isImporting}
              >
                Zrušit
              </button>
              <button
                onClick={handleImportExcel}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                disabled={isImporting || !importExcelFile}
              >
                {isImporting ? 'Importuji...' : 'Importovat'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pro historii importů */}
      {showImportHistory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Historie importů produktů</h3>
              <button
                onClick={() => setShowImportHistory(false)}
                className="text-gray-400 hover:text-gray-500 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {importHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Žádná historie importů nebyla nalezena.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum a čas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Počet produktů</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soubor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importHistory.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.type === 'xml_cenik' ? 'XML Ceník' :
                           item.type === 'xml_popisky' ? 'XML Popisky' :
                           item.type === 'excel' ? 'Excel' : item.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.products_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.filename || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowImportHistory(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Pomocná funkce pro formátování velikosti souboru
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
