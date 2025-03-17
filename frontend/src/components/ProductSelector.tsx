// frontend/src/components/ProductSelector.tsx
import { useState, useEffect } from 'react';
import { api, Product } from '../services/api';

interface ProductSelectorProps {
  onProductSelect: (product: Product) => void;
}

export function ProductSelector({ onProductSelect }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Načtení dat při prvním renderu
  useEffect(() => {
    fetchCategories();
    fetchManufacturers();
  }, []);

  // Načtení kategorií
  const fetchCategories = async () => {
    try {
      const categories = await api.getProductCategories();
      setCategories(categories || []);
    } catch (error) {
      console.error('Chyba při načítání kategorií:', error);
    }
  };

  // Načtení výrobců
  const fetchManufacturers = async () => {
    try {
      const manufacturers = await api.getProductManufacturers();
      setManufacturers(manufacturers || []);
    } catch (error) {
      console.error('Chyba při načítání výrobců:', error);
    }
  };

  // Vyhledávání produktů
  const handleSearch = async () => {
    setIsLoading(true);
    setError('');

    try {
      const options = {
        search: searchTerm,
        kategorie: filterCategory,
        vyrobce: filterManufacturer,
        limit: 50
      };

      const result = await api.getProducts(options);
      
      if (Array.isArray(result)) {
        setProducts(result);
      } else if (result && typeof result === 'object' && Array.isArray(result.products)) {
        setProducts(result.products);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při vyhledávání produktů');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Výběr produktu
  const handleProductSelection = (product: Product) => {
    setSelectedProduct(product);
    onProductSelect(product);
  };

  // Formátování ceny
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '0 Kč';
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Formátování dostupnosti
  const formatAvailability = (availability: string | number): string => {
    if (typeof availability === 'number') {
      if (availability <= 0) return 'Není skladem';
      if (availability < 5) return `${availability} ks`;
      if (availability < 20) return 'Skladem';
      return 'Dostatek skladem';
    }
    return availability;
  };

  // CSS třídy pro dostupnost
  const getAvailabilityColorClass = (availability: string | number): string => {
    if (typeof availability === 'number') {
      if (availability <= 0) return 'text-red-600';
      if (availability < 5) return 'text-orange-600';
      return 'text-green-600';
    }

    const availabilityStr = String(availability).toLowerCase();
    if (availabilityStr.includes('skladem')) return 'text-green-600';
    if (availabilityStr.includes('objednávku')) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
      {/* Vyhledávání a filtry */}
      <div className="p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-6">
            <label htmlFor="product-search" className="block text-sm font-medium text-gray-700">
              Vyhledávání
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                id="product-search"
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Název, kód nebo popis produktu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                onClick={handleSearch}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <label htmlFor="product-category" className="block text-sm font-medium text-gray-700">
              Kategorie
            </label>
            <select
              id="product-category"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Všechny kategorie</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <label htmlFor="product-manufacturer" className="block text-sm font-medium text-gray-700">
              Výrobce
            </label>
            <select
              id="product-manufacturer"
              className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filterManufacturer}
              onChange={(e) => setFilterManufacturer(e.target.value)}
            >
              <option value="">Všichni výrobci</option>
              {manufacturers.map((manufacturer) => (
                <option key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleSearch}
          >
            Vyhledat produkty
          </button>
        </div>
      </div>

      {/* Výsledky vyhledávání */}
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Výsledky vyhledávání</h3>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Vyhledávání produktů...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded relative">
            Nebyly nalezeny žádné produkty. Upravte kritéria vyhledávání.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kód
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Název
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena bez DPH
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena s DPH
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dostupnost
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akce
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr 
                    key={product.kod} 
                    className={selectedProduct?.kod === product.kod ? 'bg-blue-50' : ''}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {product.kod}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 max-w-sm truncate" title={product.nazev}>
                      {product.nazev}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {product.kategorie || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(product.cena_bez_dph)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(product.cena_s_dph)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                      <span className={getAvailabilityColorClass(product.dostupnost)}>
                        {formatAvailability(product.dostupnost)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                      <button
                        type="button"
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        onClick={() => handleProductSelection(product)}
                      >
                        Vybrat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
