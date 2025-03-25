// frontend/src/components/ProductDetail.tsx
import { useState, useEffect } from 'react';
import { api, Product } from '../services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Share, Heart, ShoppingCart, Info, Package, BarChart4, FileText, ExternalLink, Edit } from 'lucide-react';

interface ProductDetailProps {
  productId: string;
  onClose: () => void;
  onAddToOffer?: (product: Product, quantity: number) => void;
}

export function ProductDetail({ productId, onClose, onAddToOffer }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
  // Načtení detailu produktu
  useEffect(() => {
    const fetchProductDetail = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const productData = await api.getProduct(productId);
        setProduct(productData);
        
        // Načtení souvisejících produktů (například stejná kategorie)
        if (productData.kategorie) {
          const related = await api.getProducts({ 
            kategorie: productData.kategorie, 
            limit: 4 
          });
          
          // Filtrovat aktuální produkt
          setRelatedProducts(
            Array.isArray(related) 
              ? related.filter(p => p.id !== productId && p.kod !== productId).slice(0, 4)
              : related.products?.filter(p => p.id !== productId && p.kod !== productId).slice(0, 4) || []
          );
        }
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
  
  // Zpracování přidání do nabídky
  const handleAddToOffer = () => {
    if (product && onAddToOffer) {
      onAddToOffer(product, quantity);
      onClose();
    }
  };
  
  // Pokud načítáme data
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 overflow-auto">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl">
          <div className="flex justify-between items-center border-b px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Detail produktu</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              &times;
            </button>
          </div>
          <div className="flex justify-center items-center h-64">
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
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 overflow-auto">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl">
          <div className="flex justify-between items-center border-b px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Chyba</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              &times;
            </button>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Pokud nemáme produkt
  if (!product) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 overflow-auto">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl">
          <div className="flex justify-between items-center border-b px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Produkt nenalezen</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              &times;
            </button>
          </div>
          <div className="p-6 text-center">
            <p className="mb-4">Požadovaný produkt nebyl nalezen nebo není dostupný.</p>
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
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 truncate pr-4" title={product.nazev}>
            {product.nazev}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 text-xl"
          >
            &times;
          </button>
        </div>
        
        {/* Obsah modálního okna */}
        <div className="overflow-y-auto p-6 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-8">
            {/* Levá strana - obrázek */}
            <div className="md:col-span-3">
              {product.obrazek ? (
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="aspect-square flex items-center justify-center overflow-hidden rounded-md">
                    <img 
                      src={product.obrazek} 
                      alt={product.nazev} 
                      className="object-contain w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=No+Image';
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Obrázek není k dispozici</span>
                </div>
              )}
              
              {/* Akce pro obrázek */}
              <div className="mt-4 flex justify-around">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                        <Share className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sdílet produkt</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full">
                        <Heart className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Přidat do oblíbených</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full">
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Přidat do košíku</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full">
                        <Info className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Více informací</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Zdrojová data a kódy */}
              <div className="mt-4 text-sm text-gray-500 border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Kód produktu:</span>
                  <span className="font-mono">{product.kod}</span>
                </div>
                
                {product.ean && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-medium">EAN:</span>
                    <span className="font-mono">{product.ean}</span>
                  </div>
                )}
                
                {product.merged_sources && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-medium">Zdroje dat:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {product.merged_sources.map((source, index) => (
                        <span key={index} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pravá strana - informace */}
            <div className="md:col-span-4">
              {/* Základní informace - cena, dostupnost */}
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {formatCurrency(product.cena_s_dph)} Kč s DPH
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(product.cena_bez_dph)} Kč bez DPH
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor(product.dostupnost)}`}>
                    {formatAvailability(product.dostupnost)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
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
                
                {/* Akce - přidat do nabídky */}
                <div className="mt-6 p-4 rounded-lg border bg-gray-50">
                  <div className="flex items-center mb-3">
                    <span className="text-sm text-gray-700 mr-4">Množství:</span>
                    <div className="flex">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 border border-r-0 border-gray-300 rounded-l-md bg-white"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        min="1" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-16 px-2 py-1 text-center border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1 border border-l-0 border-gray-300 rounded-r-md bg-white"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="flex-grow text-right">
                      <div className="text-sm text-gray-600">Celkem:</div>
                      <div className="font-bold text-lg">
                        {formatCurrency((product.cena_s_dph || 0) * quantity)} Kč
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAddToOffer}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center justify-center"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Přidat do nabídky
                  </button>
                </div>
              </div>
              
              {/* Záložky s obsahem */}
              <Tabs defaultValue="description" value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="description" className="text-sm">Popis</TabsTrigger>
                  <TabsTrigger value="parameters" className="text-sm">Parametry</TabsTrigger>
                  <TabsTrigger value="documents" className="text-sm">Dokumenty</TabsTrigger>
                  <TabsTrigger value="related" className="text-sm">Související</TabsTrigger>
                </TabsList>
                
                {/* Obsah záložky Popis */}
                <TabsContent value="description" className="text-sm text-gray-700">
                  {(product.kratky_popis || product.popis) ? (
                    <>
                      {product.kratky_popis && (
                        <p className="font-medium mb-2">{product.kratky_popis}</p>
                      )}
                      
                      {product.popis && (
                        <div className="whitespace-pre-line">{product.popis}</div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500 italic">Popis produktu není k dispozici.</p>
                  )}
                </TabsContent>
                
                {/* Obsah záložky Parametry */}
                <TabsContent value="parameters">
                  {parameters.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {parameters.map((param, index) => (
                        <div key={index} className="flex flex-col border-b border-gray-100 py-1">
                          <dt className="text-xs text-gray-600">{param.name}</dt>
                          <dd className="font-medium text-gray-900">{param.value}</dd>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Parametry produktu nejsou k dispozici.</p>
                  )}
                </TabsContent>
                
                {/* Obsah záložky Dokumenty */}
                <TabsContent value="documents">
                  {documents.length > 0 ? (
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <a 
                          key={index} 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-2 hover:bg-gray-50 rounded-md group"
                        >
                          <FileText className="h-5 w-5 text-gray-500 mr-2" />
                          <span className="flex-grow text-sm text-gray-700 group-hover:text-blue-600">
                            {doc.type}
                          </span>
                          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Dokumenty k produktu nejsou k dispozici.</p>
                  )}
                </TabsContent>
                
                {/* Obsah záložky Související */}
                <TabsContent value="related">
                  {relatedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {relatedProducts.map(related => (
                        <div 
                          key={related.id || related.kod} 
                          className="flex border rounded-md overflow-hidden hover:border-blue-300 hover:bg-blue-50 group"
                        >
                          <div className="w-20 h-20 bg-gray-100 flex items-center justify-center">
                            {related.obrazek ? (
                              <img 
                                src={related.obrazek} 
                                alt={related.nazev} 
                                className="object-contain max-w-full max-h-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=No+Image';
                                }}
                              />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div className="p-2 flex-grow">
                            <h4 className="text-sm font-medium truncate" title={related.nazev}>
                              {related.nazev}
                            </h4>
                            <div className="flex justify-between items-end mt-1">
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(related.cena_s_dph)} Kč
                              </span>
                              <button className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                Zobrazit &rarr;
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Nebyly nalezeny žádné související produkty.</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        
        {/* Patička modálního okna */}
        <div className="flex justify-end items-center gap-2 border-t bg-gray-50 p-4">
          <Button variant="outline" onClick={onClose}>
            Zavřít
          </Button>
          <Button onClick={handleAddToOffer}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Přidat do nabídky
          </Button>
        </div>
      </div>
    </div>
  );
}

// Soubor components/ui/tabs.tsx je součástí shadcn/ui knihovny
// Soubor components/ui/tooltip.tsx je součástí shadcn/ui knihovny
// Soubor components/ui/button.tsx je součástí shadcn/ui knihovny  
// Soubor components/ui/badge.tsx je součástí shadcn/ui knihovny
