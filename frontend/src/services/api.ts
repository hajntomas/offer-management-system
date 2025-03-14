// frontend/src/services/api.ts
// Vylepšená verze s lepším zpracováním chyb a podporou pro debug režim

// API URL konfigurace
const LOGIN_URL = '/api/auth/login';
const API_URL = '/api/proxy'; // Pro ostatní API volání

// Přidání podpory pro debug režim
const DEBUG = true; // V produkci nastavit na false

// Typy
export type Product = {
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

export type OfferItem = {
  produkt_id: string;
  pocet: number;
  cena_bez_dph: number;
  cena_s_dph: number;
};

export type Offer = {
  id: string;
  cislo: string;
  nazev: string;
  zakaznik: string;
  datum_vytvoreni: string;
  platnost_do: string;
  celkova_cena_bez_dph: number;
  celkova_cena_s_dph: number;
  polozky: OfferItem[];
  stav: string;
};

// Typová definice pro API chyby
export type ApiError = {
  message: string;
  status?: number;
  details?: string;
  url?: string;
  originalError?: any;
};

// Pomocné funkce pro logování
const logApiCall = (endpoint: string, method: string) => {
  if (DEBUG) console.log(`🌐 API Call: ${method} ${endpoint}`);
};

// Získání autorizačního tokenu
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    if (DEBUG) console.log('✅ Autorizační token nalezen');
    return { Authorization: `Bearer ${token}` };
  } else {
    if (DEBUG) console.warn('⚠️ Autorizační token chybí');
    return {};
  }
};

// Vylepšená funkce pro zpracování odpovědi
const handleResponse = async <T>(response: Response): Promise<T> => {
  // Kontrola typu odpovědi
  const contentType = response.headers.get('Content-Type') || '';
  if (DEBUG) console.log(`📄 Response Content-Type: ${contentType}, Status: ${response.status}`);
  
  // Nejprve získáme text odpovědi pro diagnostiku
  let responseText: string;
  try {
    responseText = await response.text();
    if (DEBUG) console.log(`📄 Response body (first 100 chars): ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
  } catch (error) {
    if (DEBUG) console.error('❌ Chyba při čtení odpovědi:', error);
    throw new Error('Nelze přečíst odpověď serveru');
  }
  
  // Pokus o parsování jako JSON
  let data: any;
  try {
    // Pokud je text prázdný, vrátíme prázdný objekt
    if (!responseText.trim()) {
      data = {};
    } else {
      data = JSON.parse(responseText);
    }
  } catch (error) {
    if (DEBUG) {
      console.error('❌ Chyba při parsování JSON odpovědi:');
      console.error('Text odpovědi:', responseText);
      console.error('Chyba:', error);
    }
    
    // Vytvoříme vlastní chybu s detaily
    const apiError: ApiError = {
      message: 'Neplatná odpověď serveru - nebylo možné parsovat JSON',
      status: response.status,
      details: responseText,
      originalError: error
    };
    
    throw apiError;
  }
  
  // Kontrola, zda je odpověď v pořádku
  if (!response.ok) {
    if (DEBUG) console.error(`❌ Chyba API: ${response.status}`, data);
    
    // Vytvoření detailní chybové zprávy
    const apiError: ApiError = {
      message: data.error || data.message || `HTTP chyba: ${response.status} ${response.statusText}`,
      status: response.status,
      details: data.details || JSON.stringify(data)
    };
    
    throw apiError;
  }
  
  if (DEBUG) console.log(`✅ Odpověď úspěšně zpracována`);
  return data as T;
};

// Vylepšená API služba s lepším zpracováním chyb
export const api = {
  // Pomocná funkce pro přímé testování API endpointů
  testEndpoint: async (path: string): Promise<any> => {
    const url = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
    if (DEBUG) console.log(`🔍 Testing endpoint: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse(response);
    } catch (error) {
      if (DEBUG) console.error(`❌ Test endpoint error:`, error);
      throw error;
    }
  },
  
  // Autentizace
  login: async (email: string, password: string) => {
    logApiCall('login', 'POST');
    try {
      if (DEBUG) console.log('🔑 Pokus o přihlášení:', { email });
      
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await handleResponse(response);
      if (DEBUG) console.log('✅ Přihlášení úspěšné');
      return data;
    } catch (error: any) {
      if (DEBUG) console.error('❌ Chyba přihlášení:', error);
      
      // Vytvoření user-friendly zprávy
      if (error.status === 401) {
        throw new Error('Neplatné přihlašovací údaje');
      } else {
        throw new Error(error.message || 'Chyba při přihlášení');
      }
    }
  },
  
  // Produkty
  getProducts: async (): Promise<Product[]> => {
    logApiCall('products', 'GET');
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse<Product[]>(response);
    } catch (error: any) {
      if (DEBUG) console.error('❌ Chyba načítání produktů:', error);
      throw new Error(error.message || 'Chyba při načítání produktů');
    }
  },
  
  getProduct: async (id: string): Promise<Product> => {
    logApiCall(`products/${id}`, 'GET');
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse<Product>(response);
    } catch (error: any) {
      if (DEBUG) console.error(`❌ Chyba načítání produktu ${id}:`, error);
      throw new Error(error.message || `Chyba při načítání produktu`);
    }
  },
  
  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    logApiCall('products', 'POST');
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(product)
      });
      
      return handleResponse<Product>(response);
    } catch (error: any) {
      if (DEBUG) console.error('❌ Chyba vytváření produktu:', error);
      throw new Error(error.message || 'Chyba při vytváření produktu');
    }
  },
  
  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    logApiCall(`products/${id}`, 'PUT');
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(product)
      });
      
      return handleResponse<Product>(response);
    } catch (error: any) {
      if (DEBUG) console.error(`❌ Chyba aktualizace produktu ${id}:`, error);
      throw new Error(error.message || 'Chyba při aktualizaci produktu');
    }
  },
  
  deleteProduct: async (id: string): Promise<{ message: string }> => {
    logApiCall(`products/${id}`, 'DELETE');
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse<{ message: string }>(response);
    } catch (error: any) {
      if (DEBUG) console.error(`❌ Chyba mazání produktu ${id}:`, error);
      throw new Error(error.message || 'Chyba při mazání produktu');
    }
  },
  
  importProducts: async (xmlData: string): Promise<{ message: string, count: number }> => {
    logApiCall('products/import', 'POST');
    try {
      const response = await fetch(`${API_URL}/products/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ xml: xmlData })
      });
      
      return handleResponse<{ message: string, count: number }>(response);
    } catch (error: any) {
      if (DEBUG) console.error('❌ Chyba importu produktů:', error);
      throw new Error(error.message || 'Chyba při importu produktů');
    }
  },
  
  // Nabídky
  getOffers: async (): Promise<Offer[]> => {
    logApiCall('offers', 'GET');
    try {
      const response = await fetch(`${API_URL}/offers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse<Offer[]>(response);
    } catch (error: any) {
      if (DEBUG) console.error('❌ Chyba načítání nabídek:', error);
      throw new Error(error.message || 'Chyba při načítání nabídek');
    }
  },
  
  getOffer: async (id: string): Promise<Offer> => {
    logApiCall(`offers/${id}`, 'GET');
    try {
      const response = await fetch(`${API_URL}/offers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse<Offer>(response);
    } catch (error: any) {
      if (DEBUG) console.error(`❌ Chyba načítání nabídky ${id}:`, error);
      throw new Error(error.message || 'Chyba při načítání nabídky');
    }
  },
  
  createOffer: async (offer: Omit<Offer, 'id' | 'cislo' | 'datum_vytvoreni'>): Promise<Offer> => {
    logApiCall('offers', 'POST');
    try {
      const response = await fetch(`${API_URL}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(offer)
      });
      
      return handleResponse<Offer>(response);
    } catch (error: any) {
      if (DEBUG) console.error('❌ Chyba vytváření nabídky:', error);
      throw new Error(error.message || 'Chyba při vytváření nabídky');
    }
  },
  
  updateOffer: async (id: string, offer: Partial<Offer>): Promise<Offer> => {
    logApiCall(`offers/${id}`, 'PUT');
    try {
      const response = await fetch(`${API_URL}/offers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(offer)
      });
      
      return handleResponse<Offer>(response);
    } catch (error: any) {
      if (DEBUG) console.error(`❌ Chyba aktualizace nabídky ${id}:`, error);
      throw new Error(error.message || 'Chyba při aktualizaci nabídky');
    }
  },
  
  deleteOffer: async (id: string): Promise<{ message: string }> => {
    logApiCall(`offers/${id}`, 'DELETE');
    try {
      const response = await fetch(`${API_URL}/offers/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse<{ message: string }>(response);
    } catch (error: any) {
      if (DEBUG) console.error(`❌ Chyba mazání nabídky ${id}:`, error);
      throw new Error(error.message || 'Chyba při mazání nabídky');
    }
  },
  
  // AI asistence
  getAiSuggestion: async (query: string, context?: any): Promise<any> => {
    logApiCall('ai/suggest', 'POST');
    try {
      const response = await fetch(`${API_URL}/ai/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ query, context })
      });
      
      return handleResponse(response);
    } catch (error: any) {
      if (DEBUG) console.error('❌ Chyba AI asistence:', error);
      throw new Error(error.message || 'Chyba při komunikaci s AI');
    }
  }
};
