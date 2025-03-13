// frontend/src/pages/OffersPage.tsx
import { useEffect, useState } from 'react';
import { api, Offer, Product } from '../services/api';

export function OffersPage() {
  // Stav
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Inicializace nové nabídky
  const emptyOffer: Omit<Offer, 'id' | 'cislo' | 'datum_vytvoreni'> = {
    nazev: '',
    zakaznik: '',
    platnost_do: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dní
    celkova_cena_bez_dph: 0,
    celkova_cena_s_dph: 0,
    polozky: [],
    stav: 'nová'
  };
  
  const [newOffer, setNewOffer] = useState<typeof emptyOffer>(emptyOffer);

  // Načtení dat
  useEffect(() => {
    Promise.all([
      fetchOffers(),
      fetchProducts()
    ]);
  }, []);

  const fetchOffers = async () => {
    try {
      const fetchedOffers = await api.getOffers();
      setOffers(fetchedOffers);
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání nabídek');
    }
  };

  const fetchProducts = async () => {
    try {
      const fetchedProducts = await api.getProducts();
      setProducts(fetchedProducts);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání produktů');
      setIsLoading(false);
    }
  };

  // Správa nabídek
  const handleCreateOffer = async () => {
    try {
      // Kontrola polí
      if (!newOffer.nazev || !newOffer.zakaznik) {
        alert('Vyplňte název nabídky a zákazníka');
        return;
      }

      // Odeslání nabídky
      const createdOffer = await api.createOffer(newOffer);
      
      // Aktualizace seznamu nabídek
      setOffers([...offers, createdOffer]);
      
      // Zavření modalu a reset formuláře
      setIsCreateModalOpen(false);
      setNewOffer(emptyOffer);
      
    } catch (err: any) {
      alert(`Chyba při vytváření nabídky: ${err.message}`);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tuto nabídku?')) return;
    
    try {
      await api.deleteOffer(id);
      setOffers(offers.filter(o => o.id !== id));
    } catch (err: any) {
      alert(`Chyba při mazání nabídky: ${err.message}`);
    }
  };

  // Správa položek nabídky
  const addProductToOffer = (product: Product) => {
    const existingItemIndex = newOffer.polozky.findIndex(
      item => item.produkt_id === product.id
    );

    let updatedItems;
    
    if (existingItemIndex >= 0) {
      // Aktualizace počtu existující položky
      updatedItems = [...newOffer.polozky];
      updatedItems[existingItemIndex].pocet += 1;
    } else {
      // Přidání nové položky
      updatedItems = [
        ...newOffer.polozky,
        {
          produkt_id: product.id,
          pocet: 1,
          cena_bez_dph: product.cena_bez_dph,
          cena_s_dph: product.cena_s_dph
        }
      ];
    }
    
    // Přepočet celkové ceny
    const { celkova_cena_bez_dph, celkova_cena_s_dph } = calculateTotals(updatedItems);
    
    setNewOffer({
      ...newOffer,
      polozky: updatedItems,
      celkova_cena_bez_dph,
      celkova_cena_s_dph
    });
  };

  const removeProductFromOffer = (productId: string) => {
    const updatedItems = newOffer.polozky.filter(item => item.produkt_id !== productId);
    
    // Přepočet celkové ceny
    const { celkova_cena_bez_dph, celkova_cena_s_dph } = calculateTotals(updatedItems);
    
    setNewOffer({
      ...newOffer,
      polozky: updatedItems,
      celkova_cena_bez_dph,
      celkova_cena_s_dph
    });
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    const updatedItems = newOffer.polozky.map(item => 
      item.produkt_id === productId 
        ? { ...item, pocet: quantity } 
        : item
    );
    
    // Přepočet celkové ceny
    const { celkova_cena_bez_dph, celkova_cena_s_dph } = calculateTotals(updatedItems);
    
    setNewOffer({
      ...newOffer,
      polozky: updatedItems,
      celkova_cena_bez_dph,
      celkova_cena_s_dph
    });
  };

  const calculateTotals = (items: typeof newOffer.polozky) => {
    return items.reduce((totals, item) => {
      return {
        celkova_cena_bez_dph: totals.celkova_cena_bez_dph + (item.cena_bez_dph * item.pocet),
        celkova_cena_s_dph: totals.celkova_cena_s_dph + (item.cena_s_dph * item.pocet)
      };
    }, { celkova_cena_bez_dph: 0, celkova_cena_s_dph: 0 });
  };

  // AI asistence
  const handleAiAssistance = async () => {
    if (!aiQuery.trim()) {
      alert('Zadejte dotaz pro AI asistenta');
      return;
    }
    
    setIsAiLoading(true);
    setAiResponse(null);
    
    try {
      // Příprava kontextu pro AI
      const context = {
        products: products,
        currentOffer: newOffer
      };
      
      // Volání AI API
      const response = await api.getAiSuggestion(aiQuery, context);
      setAiResponse(response.result);
      
      // Pokud AI doporučil produkty, umožníme je přidat do nabídky
      if (response.result.products) {
        console.log('AI doporučil produkty:', response.result.products);
      }
      
    } catch (err: any) {
      alert(`Chyba při komunikaci s AI: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Zpracování doporučení AI
  const handleAddRecommendedProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addProductToOffer(product);
    }
  };

  // Nalezení produktu podle ID
  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  // Vykreslení UI
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Správa nabídek
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none"
            >
              Dashboard
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Vytvořit nabídku
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

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="spinner"></div>
            <span className="ml-2">Načítání dat...</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Zatím nemáte žádné nabídky</h2>
            <p className="text-gray-600 mb-6">Začněte vytvořením nové nabídky pro vaše zákazníky.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
            >
              Vytvořit první nabídku
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b">
              <h2 className="text-lg font-medium text-gray-900">Seznam nabídek</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Číslo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Název
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zákazník
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum vytvoření
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platnost do
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cena s DPH
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stav
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akce
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offers.map((offer) => (
                    <tr key={offer.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {offer.cislo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {offer.nazev}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {offer.zakaznik}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(offer.datum_vytvoreni).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(offer.platnost_do).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {offer.celkova_cena_s_dph.toLocaleString()} Kč
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          offer.stav === 'aktivní' 
                            ? 'bg-green-100 text-green-800' 
                            : offer.stav === 'zamítnuto' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {offer.stav}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedOffer(offer)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Zobrazit
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Smazat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal pro vytvoření nové nabídky */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-start overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Vytvořit novou nabídku</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            
            <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Základní údaje nabídky */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Název nabídky
                  </label>
                  <input
                    type="text"
                    value={newOffer.nazev}
                    onChange={(e) => setNewOffer({...newOffer, nazev: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Zadejte název nabídky"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zákazník
                  </label>
                  <input
                    type="text"
                    value={newOffer.zakaznik}
                    onChange={(e) => setNewOffer({...newOffer, zakaznik: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Zadejte název zákazníka"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platnost do
                  </label>
                  <input
                    type="date"
                    value={newOffer.platnost_do}
                    onChange={(e) => setNewOffer({...newOffer, platnost_do: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stav
                  </label>
                  <select
                    value={newOffer.stav}
                    onChange={(e) => setNewOffer({...newOffer, stav: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="nová">Nová</option>
                    <option value="aktivní">Aktivní</option>
                    <option value="odesláno">Odesláno</option>
                    <option value="schváleno">Schváleno</option>
                    <option value="zamítnuto">Zamítnuto</option>
                  </select>
                </div>
              </div>
              
              {/* Asistent AI */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-md font-medium text-blue-800 mb-2">AI asistent pro tvorbu nabídek</h4>
                <div className="flex mb-2">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="Např.: Doporuč mi produkty pro malou kancelář nebo Vytvoř text nabídky..."
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleAiAssistance}
                    disabled={isAiLoading}
                    className="px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-blue-400"
                  >
                    {isAiLoading ? "Generuji..." : "Zeptat se"}
                  </button>
                </div>
                
                {/* Odpověď AI */}
                {aiResponse && (
                  <div className="mt-3 p-3 bg-white rounded-md border border-blue-100">
                    <p className="text-sm text-gray-700">{aiResponse.message}</p>
                    
                    {/* Pokud AI doporučil produkty */}
                    {aiResponse.products && aiResponse.products.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Doporučené produkty:</h5>
                        <ul className="text-sm text-gray-600">
                          {aiResponse.products.map((product: any) => (
                            <li key={product.id} className="py-1 flex justify-between items-center">
                              <span>
                                {product.nazev} 
                                {product.reason && <span className="text-xs ml-1 text-gray-500">({product.reason})</span>}
                              </span>
                              <button
                                onClick={() => handleAddRecommendedProduct(product.id)}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Přidat
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Pokud AI upravil text */}
                    {aiResponse.text && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Upravený text:</h5>
                        <div className="text-sm text-gray-600 whitespace-pre-line p-2 bg-gray-50 rounded-md border border-gray-200">
                          {aiResponse.text}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Přidání produktů */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-2">Položky nabídky</h4>
                
                {/* Výběr produktů */}
                <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Přidat produkt do nabídky
                    </label>
                    <select
                      onChange={(e) => {
                        const productId = e.target.value;
                        if (productId) {
                          const product = products.find(p => p.id === productId);
                          if (product) addProductToOffer(product);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value=""
                    >
                      <option value="" disabled>Vyberte produkt</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.nazev} - {product.cena_s_dph.toLocaleString()} Kč
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Seznam položek */}
                {newOffer.polozky.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Zatím nebyly přidány žádné položky do nabídky.
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produkt
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cena za kus
                          </th>
                          <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Počet
                          </th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Celkem
                          </th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Akce
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {newOffer.polozky.map((item) => {
                          const product = getProductById(item.produkt_id);
                          return (
                            <tr key={item.produkt_id}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {product?.nazev || 'Neznámý produkt'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                {item.cena_s_dph.toLocaleString()} Kč
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex justify-center items-center">
                                  <button
                                    onClick={() => updateItemQuantity(item.produkt_id, item.pocet - 1)}
                                    className="px-2 py-1 border border-gray-300 rounded-l-md"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.pocet}
                                    onChange={(e) => updateItemQuantity(item.produkt_id, parseInt(e.target.value))}
                                    className="w-12 text-center border-t border-b border-gray-300"
                                  />
                                  <button
                                    onClick={() => updateItemQuantity(item.produkt_id, item.pocet + 1)}
                                    className="px-2 py-1 border border-gray-300 rounded-r-md"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                                {(item.cena_s_dph * item.pocet).toLocaleString()} Kč
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => removeProductFromOffer(item.produkt_id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Odebrat
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* Řádek s celkovou cenou */}
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">
                            Celková cena:
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900 font-bold">
                            {newOffer.celkova_cena_s_dph.toLocaleString()} Kč
                          </td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                            Cena bez DPH:
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                            {newOffer.celkova_cena_bez_dph.toLocaleString()} Kč
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewOffer(emptyOffer);
                  setAiResponse(null);
                  setAiQuery('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Zrušit
              </button>
              <button
                onClick={handleCreateOffer}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Vytvořit nabídku
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pro detail nabídky */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-start overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Detail nabídky {selectedOffer.cislo}</h3>
              <button
                onClick={() => setSelectedOffer(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Název nabídky</h4>
                  <p>{selectedOffer.nazev}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Zákazník</h4>
                  <p>{selectedOffer.zakaznik}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Datum vytvoření</h4>
                  <p>{new Date(selectedOffer.datum_vytvoreni).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Platnost do</h4>
                  <p>{new Date(selectedOffer.platnost_do).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Stav</h4>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedOffer.stav === 'aktivní' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedOffer.stav === 'zamítnuto' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedOffer.stav}
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-800 mb-2">Položky nabídky</h4>
                
                {selectedOffer.polozky.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Nabídka neobsahuje žádné položky.
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produkt
                          </th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cena za kus
                          </th>
                          <th scope="col" className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Počet
                          </th>
                          <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Celkem
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedOffer.polozky.map((item) => {
                          const product = getProductById(item.produkt_id);
                          return (
                            <tr key={item.produkt_id}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {product?.nazev || 'Neznámý produkt'}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                {item.cena_s_dph.toLocaleString()} Kč
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-center text-gray-500">
                                {item.pocet} ks
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                                {(item.cena_s_dph * item.pocet).toLocaleString()} Kč
                              </td>
                            </tr>
                          );
                        })}
                        
                        {/* Řádek s celkovou cenou */}
                        <tr className="bg-gray-50">
                          <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm text-right font-medium">
                            Celková cena:
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-900 font-bold">
                            {selectedOffer.celkova_cena_s_dph.toLocaleString()} Kč
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                            Cena bez DPH:
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                            {selectedOffer.celkova_cena_bez_dph.toLocaleString()} Kč
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedOffer(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Zavřít
              </button>
              <button
                onClick={() => alert('Export do PDF bude implementován v další fázi')}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
