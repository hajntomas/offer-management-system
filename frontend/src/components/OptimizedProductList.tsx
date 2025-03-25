import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from '../components/Icons';

type Product = {
  id: string;
  kod: string;
  nazev: string;
  cena_bez_dph: number;
  cena_s_dph: number;
  dostupnost: number;
  kategorie?: string;
  vyrobce?: string;
};

type FilterState = {
  search: string;
  category: string;
  manufacturer: string;
  inStock: boolean;
};

const VirtualizedProductList: React.FC = () => {
  // Konstanty pro optimalizaci
  const ITEM_HEIGHT = 60; // Výška položky v pixelech
  const OVERSCAN_COUNT = 5; // Počet položek pro načtení mimo viditelnou oblast
  
  // Stav seznamu a položek
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Stav filtrování - použití useMemo pro zpracování změn
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    manufacturer: '',
    inStock: false,
  });
  
  // Dočasná hodnota pro vyhledávací pole (debounce implementace)
  const [searchInput, setSearchInput] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reference na DOM elementy
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  
  // Simulace načtení velkého množství dat - optimalizace pomocí useMemo
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      
      try {
        // Simulace API volání
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Simulace velkého množství dat (efektivnější generování)
        const categories = ['notebooky', 'počítače', 'monitory', 'příslušenství'];
        const manufacturers = ['Dell', 'Apple', 'HP', 'Lenovo', 'Samsung', 'LG', 'Logitech'];
        
        const mockProducts = Array.from({ length: 1300 }, (_, i) => ({
          id: `prod-${i + 1}`,
          kod: `KOD-${1000 + i}`,
          nazev: `Produkt ${i + 1} - ${categories[i % categories.length]} ${manufacturers[i % manufacturers.length]}`,
          kategorie: categories[i % categories.length],
          vyrobce: manufacturers[i % manufacturers.length],
          cena_bez_dph: Math.floor(Math.random() * 40000) + 5000,
          cena_s_dph: Math.floor(Math.random() * 50000) + 6000,
          dostupnost: Math.floor(Math.random() * 30),
        }));
        
        setProducts(mockProducts);
        setTotalProducts(mockProducts.length);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  // Efekt pro inicializaci a aktualizaci výšky kontejneru s ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    
    // Inicializace výšky
    updateHeight();
    
    // Použití ResizeObserver pro aktualizaci při změně velikosti
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // Optimalizovaná implementace vyhledávání s debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    
    // Zrušení předchozího časovače
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Nastavení nového časovače pro debounce
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
      
      // Reset scrollování na začátek při změně vyhledávání
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      setScrollTop(0);
    }, 300);
  }, []);
  
  // Optimalizované zpracování změny filtru
  const handleFilterChange = useCallback((name: keyof FilterState, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Reset scrollování při změně filtrů
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    setScrollTop(0);
  }, []);
  
  // Zpracování scroll události - s throttlingem pro optimalizaci výkonu
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop);
    });
  }, []);
  
  // Filtrování produktů - memoizované pro optimalizaci výkonu
  const filteredProducts = useMemo(() => {
    // Pokud nejsou data nebo se načítají, vrátíme prázdné pole
    if (products.length === 0 || loading) return [];
    
    let result = [...products];
    
    // Aplikace filtrů
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p => 
        p.kod.toLowerCase().includes(searchLower) || 
        p.nazev.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.category) {
      result = result.filter(p => p.kategorie === filters.category);
    }
    
    if (filters.manufacturer) {
      result = result.filter(p => p.vyrobce === filters.manufacturer);
    }
    
    if (filters.inStock) {
      result = result.filter(p => p.dostupnost > 0);
    }
    
    return result;
  }, [products, filters, loading]);
  
  // Výpočet viditelných položek - memoizované
  const visibleItems = useMemo(() => {
    // Počet filtrovaných produktů
    const filteredCount = filteredProducts.length;
    
    // Výpočet rozsahu viditelných položek
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN_COUNT);
    const endIndex = Math.min(
      filteredCount - 1,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN_COUNT
    );
    
    // Vytvoření pole viditelných položek s pozicí
    return filteredProducts.slice(startIndex, endIndex + 1).map((product, index) => ({
      ...product,
      index: startIndex + index
    }));
  }, [filteredProducts, scrollTop, containerHeight]);
  
  // Memoizované pomocné funkce pro formátování
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }, []);
  
  const getAvailabilityDisplay = useCallback((availability: number) => {
    if (availability <= 0) return { text: 'Není skladem', color: 'text-red-600 bg-red-50' };
    if (availability < 5) return { text: `Poslední kusy (${availability})`, color: 'text-orange-600 bg-orange-50' };
    if (availability < 20) return { text: `Skladem (${availability})`, color: 'text-green-600 bg-green-50' };
    return { text: 'Dostatek skladem', color: 'text-green-600 bg-green-50' };
  }, []);
  
  // Rychlé posuny na začátek a konec seznamu
  const handleScrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);
  
  const handleScrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = filteredProducts.length * ITEM_HEIGHT;
    }
  }, [filteredProducts.length]);
  
  // Memoizovaný počet výsledků
  const resultCount = useMemo(() => filteredProducts.length, [filteredProducts]);
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Panel filtrů */}
      <div className="border-b p-4">
        <div className="flex flex-wrap gap-3">
          {/* Vyhledávací pole */}
          <div className="flex-1 min-w-48">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Vyhledat produkt..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filtr kategorie */}
          <div className="w-40">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
          
          {/* Filtr výrobce */}
          <div className="w-40">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.manufacturer}
              onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
            >
              <option value="">Všichni výrobci</option>
              <option value="Dell">Dell</option>
              <option value="HP">HP</option>
              <option value="Lenovo">Lenovo</option>
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
            </select>
          </div>
          
          {/* Filtr skladem */}
          <div className="flex items-center">
            <input
              id="in-stock"
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={filters.inStock}
              onChange={(e) => handleFilterChange('inStock', e.target.checked)}
            />
            <label htmlFor="in-stock" className="ml-2 text-sm text-gray-700">
              Pouze skladem
            </label>
          </div>
        </div>
      </div>
      
      {/* Informace o výsledcích */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
        <div className="text-sm text-gray-600">
          {loading ? 'Načítání produktů...' : `Zobrazuji ${resultCount} produktů`}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleScrollToTop}
            className="p-1 rounded-md hover:bg-gray-200"
            title="Přejít na začátek"
          >
            <ArrowUp className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={handleScrollToBottom}
            className="p-1 rounded-md hover:bg-gray-200"
            title="Přejít na konec"
          >
            <ArrowDown className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Hlavička tabulky */}
      <div className="px-4 py-2 border-b bg-gray-50 grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase">
        <div className="col-span-1">Kód</div>
        <div className="col-span-5">Název</div>
        <div className="col-span-1 text-center">Kategorie</div>
        <div className="col-span-1">Výrobce</div>
        <div className="col-span-1 text-right">Cena bez DPH</div>
        <div className="col-span-1 text-right">Cena s DPH</div>
        <div className="col-span-1 text-center">Dostupnost</div>
        <div className="col-span-1 text-right">Akce</div>
      </div>
      
      {/* Virtualizovaný seznam produktů */}
      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2">Načítání produktů...</span>
        </div>
      ) : (
        <div 
          ref={containerRef} 
          className="flex-grow overflow-auto relative overscroll-contain"
          onScroll={handleScroll}
        >
          {/* Virtuální scroll container s přesnou výškou */}
          <div style={{ height: `${filteredProducts.length * ITEM_HEIGHT}px`, position: 'relative' }}>
            {/* Viditelné položky */}
            {visibleItems.map((product) => (
              <div
                key={product.id}
                className="absolute w-full px-4 py-2 hover:bg-gray-50 border-b grid grid-cols-12 gap-2 items-center"
                style={{ 
                  height: `${ITEM_HEIGHT}px`, 
                  top: `${product.index * ITEM_HEIGHT}px`,
                  willChange: 'transform' // Optimalizace pro GPU akceleraci
                }}
              >
                <div className="col-span-1 text-sm font-medium text-gray-900 truncate" title={product.kod}>
                  {product.kod}
                </div>
                <div className="col-span-5 text-sm text-gray-900 truncate" title={product.nazev}>
                  {product.nazev}
                </div>
                <div className="col-span-1 text-sm text-gray-500 text-center truncate">
                  {product.kategorie}
                </div>
                <div className="col-span-1 text-sm text-gray-500 truncate">
                  {product.vyrobce}
                </div>
                <div className="col-span-1 text-sm text-gray-700 text-right whitespace-nowrap">
                  {formatPrice(product.cena_bez_dph)}
                </div>
                <div className="col-span-1 text-sm font-medium text-gray-900 text-right whitespace-nowrap">
                  {formatPrice(product.cena_s_dph)}
                </div>
                <div className="col-span-1 text-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${getAvailabilityDisplay(product.dostupnost).color}`}>
                    {getAvailabilityDisplay(product.dostupnost).text}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1">Detail</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Stavový řádek pro informace o scrollu */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
        <div>
          Posun: {Math.floor(scrollTop / ITEM_HEIGHT)} / {resultCount}
        </div>
        <div>
          <button 
            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-200"
            onClick={handleScrollToTop}
            aria-label="Nahoru"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VirtualizedProductList);
