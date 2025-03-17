// frontend/src/components/ProductDetail.tsx
import { useState, useEffect } from 'react';
import { api, Product } from '../services/api';

interface ProductDetailProps {
  productId: string;
  onClose: () => void;
}

export function ProductDetail({ productId, onClose }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Načtení detailu produktu
  useEffect(() => {
    const fetchProductDetail = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const productData = await api.getProduct(productId);
        setProduct(productData);
      } catch (err: any) {
        setError(err.message || 'Chyba při načítání detailu produktu');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProductDetail();
  }, [productId]);
  
  // Pomocná funkce pro bezpečné formátování čísel
  const formatCurrency = (value?: number) => {
    return value !== undefined && value !== null 
      ? new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
      : '0,00';
  };
  
  // Pomocná funkce pro konverzi dostupnosti na text
  const formatAvailability = (availability: string | number): string => {
    if (typeof availability === 'number') {
      if (availability <= 0) return 'Není skladem';
      if (availability < 5) return `Skladem (${availability} ks)`;
      if (availability < 20) return 'Skladem';
      return 'Dostatek skladem';
    }
    
    return availability;
  };
  
  // Pomocná funkce pro získání barevného označení dostupnosti
  const getAvailabilityColor = (availability: string | number): string => {
    if (typeof availability === 'number') {
      if (availability <= 0) return 'text-red-600 bg-red-100';
      if (availability < 5) return 'text-orange-600 bg-orange-100';
      return 'text-green-600 bg-green-100';
    }
    
    const availabilityLower = String(availability).toLowerCase();
    if (availabilityLower.includes('skladem')) return 'text-green-600 bg-green-100';
    if (availabilityLower.includes('objednávku')) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };
  
  // Parsování řádků parametrů
  const parseParameters = (parametersText?: string): { name: string, value: string }[] => {
    if (!parametersText) return [];
    
    return parametersText.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [name, value] = line.split(':', 2).map(part => part.trim());
        return { name, value: value || '-' };
      });
  };
  
  // Parsování řádků dokumentů
  const parseDocuments = (documentsText?: string): { type: string, url: string }[] => {
    if (!documentsText) return [];
    
    return documentsText.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split(':', 2);
        return { 
          type: parts[0] ? parts[0].trim() : 'Dokument', 
          url: parts[1] ? parts[1].trim() : ''
        };
      });
  };
  
  // Pokud načítáme data
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <span className="ml-3">Načítání detailu produktu...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Pokud nastala chyba
  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
          <div className="text-center">
            <h3 className="text-xl font-medium text-red-600 mb-2">Chyba</h3>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Zavřít
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Pokud nemáme produkt
  if (!product) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
          <div className="text-center">
            <h3 className="text-xl font-medium text-gray-800 mb-2">Produkt nenalezen</h3>
            <p className="text-gray-700 mb-6">Požadovaný produkt nebyl nalezen nebo není dostupný.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Zavřít
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Získání parametrů a dokumentů
  const parameters = parseParameters(product.parametry);
  const documents = parseDocuments(product.dokumenty);
  
  // Rendering detailu produktu
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-medium text-gray-900 truncate pr-4" title={product.nazev}>
            {product.nazev}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 text-xl"
          >
            &times;
          </button>
        </div>
        
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Levá strana - obrázek */}
            <div className="md:col-span-1">
              {product.obrazek ? (
                <img 
                  src={product.obrazek} 
                  alt={product.nazev} 
                  className="w-full rounded-lg shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Obrázek není k dispozici</span>
                </div>
              )}
              
              {/* Zdrojová data a kódy */}
              <div className="mt-4 text-sm text-gray-500 border-t pt-3">
                <p><span className="font-medium">Kód produktu:</span> {product.kod}</p>
                {product.ean && <p><span className="font-medium">EAN:</span> {product.ean}</p>}
                {product.merged_sources && (
                  <p><span className="font-medium">Zdroje dat:</span> {product.merged_sources.join(', ')}</p>
                )}
              </div>
            </div>
            
            {/* Pravá strana - informace */}
            <div className="md:col-span-2">
              {/* Základní informace */}
              <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-2xl font-semibold">{formatCurrency(product.cena_s_dph)} Kč</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(product.dostupnost)}`}>
                    {formatAvailability(product.dostupnost)}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{formatCurrency(product.cena_bez_dph)} Kč bez DPH</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {product.vyrobce && (
                    <div>
                      <span className="text-sm text-gray-600">Výrobce:</span>
                      <p className="text-gray-800 font-medium">{product.vyrobce}</p>
                    </div>
                  )}
                  
                  {product.kategorie && (
                    <div>
                      <span className="text-sm text-gray-600">Kategorie:</span>
                      <p className="text-gray-800 font-medium">{product.kategorie}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Popis */}
              {(product.kratky_popis || product.popis) && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Popis</h4>
                  
                  {product.kratky_popis && (
                    <p className="text-gray-700 font-medium mb-2">{product.kratky_popis}</p>
                  )}
                  
                  {product.popis && (
                    <div className="text-gray-700 whitespace-pre-line">{product.popis}</div>
                  )}
                </div>
              )}
              
              {/* Parametry */}
              {parameters.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Technické parametry</h4>
                  
                  <div className="bg-gray-50 rounded-lg border p-4">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                      {parameters.map((param, index) => (
                        <div key={index} className="flex flex-col">
                          <dt className="text-sm text-gray-600">{param.name}</dt>
                          <dd className="font-medium text-gray-900">{param.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              )}
              
              {/* Dokumenty */}
              {documents.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Dokumenty ke stažení</h4>
                  
                  <div className="space-y-2">
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-blue-600 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </span>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {doc.type}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Zavřít
          </button>
          <button
            onClick={() => alert('Přidat do nabídky - funkcionalita bude implementována později')}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Přidat do nabídky
          </button>
        </div>
      </div>
    </div>
  );
}
