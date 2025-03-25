import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Columns, Settings, RefreshCw, Download, List, Grid } from '../components/Icons';

const OptimizedProductList = () => {
  // Stavy
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'grid', 'compact'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState({ field: 'nazev', direction: 'asc' });
  
  // Filtry
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    manufacturer: '',
    priceMin: '',
    priceMax: '',
    inStock: false,
  });

  // Pokročilé filtry
  const [advancedFiltersVisible, setAdvancedFiltersVisible] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([
    'kod', 'nazev', 'cena_bez_dph', 'cena_s_dph', 'dostupnost', 'kategorie', 'vyrobce'
  ]);
  
  // Simulovaná data pro ukázku (ve skutečné implementaci by zde byl API call)
  useEffect(() => {
    // Simulace načítání dat
    setTimeout(() => {
      // Vzorová data - v reálné implementaci by se načítala z API
      const dummyProducts = Array.from({ length: 1300 }, (_, i) => ({
        id: `prod-${i+1}`,
        kod: `PROD-${1000+i}`,
        nazev: `Produkt ${i+1}`,
        cena_bez_dph: Math.floor(Math.random() * 50000) + 1000,
        cena_s_dph: Math.floor(Math.random() * 60000) + 1200,
        dostupnost: Math.floor(Math.random() * 30),
        kategorie: ['notebooky', 'počítače', 'monitory', 'příslušenství'][Math.floor(Math.random() * 4)],
        vyrobce: ['Dell', 'Apple', 'HP', 'Lenovo', 'Samsung', 'LG', 'Logitech'][Math.floor(Math.random() * 7)],
      }));
      
      setProducts(dummyProducts.slice((page-1) * pageSize, page * pageSize));
      setTotalProducts(dummyProducts.length);
      setTotalPages(Math.ceil(dummyProducts.length / pageSize));
      setLoading(false);
    }, 500);
  }, [page, pageSize]);
  
  // Formátování ceny
  const formatPrice = (price) => {
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(price);
  };
  
  // Formátování dostupnosti
  const getAvailabilityDisplay = (availability) => {
    if (availability <= 0) return { text: 'Není skladem', color: 'text-red-600 bg-red-50' };
    if (availability < 5) return { text: `Poslední kusy (${availability})`, color: 'text-orange-600 bg-orange-50' };
    if (availability < 20) return { text: `Skladem (${availability})`, color: 'text-green-600 bg-green-50' };
    return { text: 'Dostatek skladem', color: 'text-green-600 bg-green-50' };
  };
  
  // Zpracování změny stránky
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };
  
  // Zpracování změny filtru
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset na první stránku při změně filtrů
  };

  // Zpracování změny řazení
  const handleSortChange = (field) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  // Zobrazeit viditelné sloupce pro tabulkový pohled
  const toggleColumnVisibility = (column) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };
  
  // Vygenerování možností pro stránkování
  const pageOptions = useMemo(() => {
    const options = [];
    
    // Vždy zobrazit první stránku
    options.push(1);
    
    // Přidat elipsu, pokud není 2. stránka v blízkosti aktuální stránky
    if (page > 4) options.push('...');
    
    // Přidat stránky kolem aktuální stránky
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      options.push(i);
    }
    
    // Přidat elipsu, pokud není předposlední stránka v blízkosti aktuální stránky
    if (page < totalPages - 3) options.push('...');
    
    // Přidat poslední stránku, pokud existuje
    if (totalPages > 1) options.push(totalPages);
    
    return options;
  }, [page, totalPages]);
  
  // Zobrazení nahrávání
  if (loading) {
    return (
      <div className="flex flex-col h-96 items-center justify-center bg-white rounded-lg shadow">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Načítání produktů...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow">
      {/* Horní panel s filtry a akcemi */}
      <div className="mb-4 bg-white rounded-lg shadow p-4">
        {/* Základní filtry */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Vyhledávání */}
          <div className="flex-1 min-w-48">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Vyhledat..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          {/* Kategorie */}
          <div className="w-48">
            <select 
              className="w-full px-3 py-2 border rounded-lg"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Všechny kategorie</option>
              <option value="notebooky">Notebooky</option>
              <option value="počítače">Počítače</option>
              <option value="monitory">Monitory</option>
              <option value="příslušenství">Příslušenství</option>
            </select>
          </div>
          
          {/* Výrobce */}
          <div className="w-48">
            <select 
              className="w-full px-3 py-2 border rounded-lg"
              value={filters.manufacturer}
              onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
            >
              <option value="">Všichni výrobci</option>
              <option value="Dell">Dell</option>
              <option value="Apple">Apple</option>
              <option value="HP">HP</option>
              <option value="Lenovo">Lenovo</option>
              <option value="Samsung">Samsung</option>
              <option value="LG">LG</option>
              <option value="Logitech">Logitech</option>
            </select>
          </div>
          
          {/* Dostupnost */}
          <div className="w-36">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="inStock" 
                className="rounded border-gray-300 text-blue-600 mr-2"
                checked={filters.inStock}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
              />
              <label htmlFor="inStock" className="text-sm text-gray-700">Pouze skladem</label>
            </div>
          </div>
          
          {/* Pokročilé filtry */}
          <button 
            className="px-3 py-2 border rounded-lg flex items-center gap-1 text-gray-700 hover:bg-gray-50"
            onClick={() => setAdvancedFiltersVisible(!advancedFiltersVisible)}
          >
            <Filter className="h-4 w-4" />
            <span>Filtry</span>
            {advancedFiltersVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {/* Přepínač zobrazení */}
          <div className="border rounded-lg flex overflow-hidden">
            <button 
              className={`px-3 py-2 flex items-center gap-1 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </button>
            <button 
              className={`px-3 py-2 flex items-center gap-1 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Pokročilé filtry */}
        {advancedFiltersVisible && (
          <div className="pt-3 border-t">
            <div className="flex flex-wrap gap-3">
              {/* Cenové rozpětí */}
              <div className="flex-1 min-w-48 max-w-96">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cena (Kč)</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Od" 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={filters.priceMin}
                    onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                  />
                  <span className="self-center">-</span>
                  <input 
                    type="number" 
                    placeholder="Do" 
                    className="w-full px-3 py-2 border rounded-lg"
                    value={filters.priceMax}
                    onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                  />
                </div>
              </div>
              
              {/* Výběr sloupců */}
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">Zobrazované sloupce</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'kod', label: 'Kód' },
                    { id: 'nazev', label: 'Název' },
                    { id: 'cena_bez_dph', label: 'Cena bez DPH' },
                    { id: 'cena_s_dph', label: 'Cena s DPH' },
                    { id: 'dostupnost', label: 'Dostupnost' },
                    { id: 'kategorie', label: 'Kategorie' },
                    { id: 'vyrobce', label: 'Výrobce' }
                  ].map(column => (
                    <label key={column.id} className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-blue-600 mr-1"
                        checked={selectedColumns.includes(column.id)}
                        onChange={() => toggleColumnVisibility(column.id)}
                      />
                      <span className="text-sm text-gray-700">{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Informace o počtu produktů a stránkování */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="text-sm text-gray-600">
          Zobrazuji <span className="font-medium">{(page - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(page * pageSize, totalProducts)}</span> z <span className="font-medium">{totalProducts}</span> produktů
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Položek na stránku:</span>
          <select 
            className="px-2 py-1 border rounded-md text-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
          </select>
        </div>
      </div>
      
      {/* Výpis produktů - Tabulkový pohled */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {selectedColumns.includes('kod') && (
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('kod')}
                    >
                      <div className="flex items-center">
                        <span>Kód</span>
                        {sort.field === 'kod' && (
                          sort.direction === 'asc' 
                            ? <ChevronUp className="ml-1 h-4 w-4" />
                            : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                  )}
                  
                  {selectedColumns.includes('nazev') && (
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('nazev')}
                    >
                      <div className="flex items-center">
                        <span>Název</span>
                        {sort.field === 'nazev' && (
                          sort.direction === 'asc' 
                            ? <ChevronUp className="ml-1 h-4 w-4" />
                            : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                  )}
                  
                  {selectedColumns.includes('cena_bez_dph') && (
                    <th 
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('cena_bez_dph')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Cena bez DPH</span>
                        {sort.field === 'cena_bez_dph' && (
                          sort.direction === 'asc' 
                            ? <ChevronUp className="ml-1 h-4 w-4" />
                            : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                  )}
                  
                  {selectedColumns.includes('cena_s_dph') && (
                    <th 
                      className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('cena_s_dph')}
                    >
                      <div className="flex items-center justify-end">
                        <span>Cena s DPH</span>
                        {sort.field === 'cena_s_dph' && (
                          sort.direction === 'asc' 
                            ? <ChevronUp className="ml-1 h-4 w-4" />
                            : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                  )}
                  
                  {selectedColumns.includes('dostupnost') && (
                    <th 
                      className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('dostupnost')}
                    >
                      <div className="flex items-center justify-center">
                        <span>Dostupnost</span>
                        {sort.field === 'dostupnost' && (
                          sort.direction === 'asc' 
                            ? <ChevronUp className="ml-1 h-4 w-4" />
                            : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                  )}
                  
                  {selectedColumns.includes('kategorie') && (
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('kategorie')}
                    >
                      <div className="flex items-center">
                        <span>Kategorie</span>
                        {sort.field === 'kategorie' && (
                          sort.direction === 'asc' 
                            ? <ChevronUp className="ml-1 h-4 w-4" />
                            : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                  )}
                  
                  {selectedColumns.includes('vyrobce') && (
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSortChange('vyrobce')}
                    >
                      <div className="flex items-center">
                        <span>Výrobce</span>
                        {sort.field === 'vyrobce' && (
                          sort.direction === 'asc' 
                            ? <ChevronUp className="ml-1 h-4 w-4" />
                            : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                  )}
                  
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const availability = getAvailabilityDisplay(product.dostupnost);
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {selectedColumns.includes('kod') && (
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {product.kod}
                        </td>
                      )}
                      
                      {selectedColumns.includes('nazev') && (
                        <td className="px-3 py-2 text-sm text-gray-900">
                          <div className="max-w-xs truncate" title={product.nazev}>
                            {product.nazev}
                          </div>
                        </td>
                      )}
                      
                      {selectedColumns.includes('cena_bez_dph') && (
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatPrice(product.cena_bez_dph)}
                        </td>
                      )}
                      
                      {selectedColumns.includes('cena_s_dph') && (
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {formatPrice(product.cena_s_dph)}
                        </td>
                      )}
                      
                      {selectedColumns.includes('dostupnost') && (
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${availability.color}`}>
                            {availability.text}
                          </span>
                        </td>
                      )}
                      
                      {selectedColumns.includes('kategorie') && (
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                          {product.kategorie}
                        </td>
                      )}
                      
                      {selectedColumns.includes('vyrobce') && (
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                          {product.vyrobce}
                        </td>
                      )}
                      
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right space-x-1">
                        <button
                          className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                          title="Zobrazit detail"
                        >
                          Detail
                        </button>
                        <button
                          className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded"
                          title="Přidat do nabídky"
                        >
                          Přidat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Výpis produktů - Dlaždicový pohled */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => {
            const availability = getAvailabilityDisplay(product.dostupnost);
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="p-4 flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate" title={product.nazev}>
                      {product.nazev}
                    </h3>
                    <span className={`ml-2 px-2 py-1 text-xs leading-none font-medium rounded-full flex-shrink-0 ${availability.color}`}>
                      {availability.text}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-2">Kód: {product.kod}</p>
                  
                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Bez DPH:</p>
                      <p className="text-sm font-medium text-gray-900">{formatPrice(product.cena_bez_dph)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">S DPH:</p>
                      <p className="text-base font-bold text-gray-900">{formatPrice(product.cena_s_dph)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center text-xs text-gray-500 space-x-2">
                    {product.kategorie && (
                      <span className="px-2 py-1 bg-gray-100 rounded-md">{product.kategorie}</span>
                    )}
                    {product.vyrobce && (
                      <span className="px-2 py-1 bg-gray-100 rounded-md">{product.vyrobce}</span>
                    )}
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 border-t flex justify-between">
                  <button
                    className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Detail
                  </button>
                  <button
                    className="px-2 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded"
                  >
                    Přidat do nabídky
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Stránkování */}
      <div className="mt-4 flex justify-center">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button
            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <span className="sr-only">Předchozí</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          {pageOptions.map((pageOption, index) => (
            pageOption === '...' ? (
              <span
                key={`ellipsis-${index}`}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
              >
                ...
              </span>
            ) : (
              <button
                key={pageOption}
                onClick={() => handlePageChange(pageOption)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === pageOption
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {pageOption}
              </button>
            )
          ))}
          
          <button
            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            <span className="sr-only">Další</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default OptimizedProductList;
