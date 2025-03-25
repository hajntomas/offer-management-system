import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Tag, Package } from '../components/Icons';

const ProductSearch = ({ onSelectProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Simulace načtení populárních kategorií
  useEffect(() => {
    setPopularCategories([
      { id: 'notebooky', name: 'Notebooky' },
      { id: 'pocitace', name: 'Počítače' },
      { id: 'monitory', name: 'Monitory' },
      { id: 'prislusenstvi', name: 'Příslušenství' },
      { id: 'software', name: 'Software' }
    ]);
    
    // Načtení předchozích vyhledávání z localStorage
    const saved = localStorage.getItem('recentProductSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Debounce funkce pro zpoždění vyhledávání
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Obsluha klávesnice pro navigaci v našeptávači
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showSuggestions) return;
      
      // Šipka dolů - posun v seznamu dolů
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
      }
      // Šipka nahoru - posun v seznamu nahoru
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : 0
        );
      }
      // Enter - výběr položky
      else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelectItem(results[selectedIndex]);
      }
      // Escape - zavření našeptávače
      else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, selectedIndex, results]);

  // Click mimo našeptávač ho zavře
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target) && 
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Posun k vybrané položce ve viditelné oblasti
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Vyhledání produktů
  const searchProducts = async (term) => {
    if (!term.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Simulace API volání s daty
      // V produkci by zde bylo skutečné API volání
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simulovaná data produktů pro ukázku
      const mockResults = [
        { id: '1', kod: 'NB-DELL-XPS13', nazev: 'Dell XPS 13', kategorie: 'notebooky', cena: 32900 },
        { id: '2', kod: 'NB-LENOVO-T14', nazev: 'Lenovo ThinkPad T14', kategorie: 'notebooky', cena: 28499 },
        { id: '3', kod: 'PC-HP-DESKTOP', nazev: 'HP Desktop PC', kategorie: 'počítače', cena: 15990 },
        { id: '4', kod: 'MON-LG-32UN880', nazev: 'LG 32UN880 UltraFine', kategorie: 'monitory', cena: 12990 },
        { id: '5', kod: 'NB-APPLE-MB-AIR', nazev: 'Apple MacBook Air M2', kategorie: 'notebooky', cena: 29990 },
      ].filter(product => 
        product.nazev.toLowerCase().includes(term.toLowerCase()) || 
        product.kod.toLowerCase().includes(term.toLowerCase())
      );
      
      setResults(mockResults);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Zpracování výběru položky
  const handleSelectItem = (item) => {
    // Uložit do historie vyhledávání
    const newRecentSearches = [
      item.nazev,
      ...recentSearches.filter(s => s !== item.nazev)
    ].slice(0, 5);
    
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentProductSearches', JSON.stringify(newRecentSearches));
    
    // Vyčistit vyhledávací pole a zavřít našeptávač
    setSearchTerm('');
    setShowSuggestions(false);
    
    // Zavolat callback pro výběr produktu
    if (onSelectProduct) {
      onSelectProduct(item);
    }
  };

  // Zpracování vyhledávání kategorie
  const handleCategorySearch = (category) => {
    // Zde by se obvykle provedlo přesměrování na výpis kategorie
    console.log(`Searching for category: ${category.name}`);
    setShowSuggestions(false);
    
    // Pro účely ukázky přidáme kategorii do historie vyhledávání
    const newRecentSearches = [
      `Kategorie: ${category.name}`,
      ...recentSearches.filter(s => s !== `Kategorie: ${category.name}`)
    ].slice(0, 5);
    
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentProductSearches', JSON.stringify(newRecentSearches));
  };

  // Zpracování opakovaného vyhledávání
  const handleRecentSearch = (search) => {
    // Odstranění prefixu kategorie
    const term = search.startsWith('Kategorie: ') ? search.substring(10) : search;
    
    setSearchTerm(term);
    searchProducts(term);
  };

  // Vymazat poslední vyhledávání
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentProductSearches');
  };

  // Formátování ceny
  const formatPrice = (price) => {
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(price);
  };

  return (
    <div className="relative w-full max-w-2xl">
      {/* Vyhledávací pole */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 p-2.5"
          placeholder="Hledat produkt podle názvu nebo kódu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            // Pokud je zadán termín, zobrazit výsledky
            if (searchTerm.trim()) {
              setShowSuggestions(true);
            } 
            // Jinak zobrazit historii a kategorie
            else if (recentSearches.length > 0 || popularCategories.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        
        {/* Reset tlačítko */}
        {searchTerm && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            onClick={() => {
              setSearchTerm('');
              inputRef.current?.focus();
            }}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Našeptávač s výsledky */}
      {showSuggestions && (
        <div 
          ref={resultsRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
        >
          {/* Stav načítání */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Vyhledávání...
            </div>
          )}
          
          {/* Výsledky vyhledávání */}
          {!isLoading && results.length > 0 && (
            <div className="max-h-80 overflow-y-auto">
              <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b">
                Výsledky vyhledávání
              </div>
              {results.map((result, index) => (
                <div
                  key={result.id}
                  data-index={index}
                  className={`px-4 py-2 cursor-pointer flex items-center ${
                    selectedIndex === index ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelectItem(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md mr-3">
                    <Package className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-sm font-medium truncate">{result.nazev}</div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <span className="font-mono">{result.kod}</span>
                      <span className="mx-2">•</span>
                      <span className="capitalize">{result.kategorie}</span>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-gray-900 ml-2">
                    {formatPrice(result.cena)}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Žádné výsledky */}
          {!isLoading && searchTerm.trim() && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              Nebyly nalezeny žádné produkty odpovídající "{searchTerm}"
            </div>
          )}
          
          {/* Prázdný input - zobrazit poslední vyhledávání a populární kategorie */}
          {!isLoading && !searchTerm.trim() && (
            <div className="max-h-80 overflow-y-auto">
              {/* Poslední vyhledávání */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 flex justify-between border-b">
                    <span>Poslední vyhledávání</span>
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={clearRecentSearches}
                    >
                      Vymazat
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center"
                      onClick={() => handleRecentSearch(search)}
                    >
                      <div className="p-1 rounded-full bg-gray-100 mr-3">
                        <Search className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="text-sm text-gray-700">{search}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />
                    </div>
                  ))}
                </div>
              )}
              
              {/* Populární kategorie */}
              {popularCategories.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b">
                    Populární kategorie
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {popularCategories.map((category) => (
                      <button
                        key={category.id}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700"
                        onClick={() => handleCategorySearch(category)}
                      >
                        <Tag className="h-3 w-3 mr-1 text-gray-500" />
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
