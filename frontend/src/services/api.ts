// frontend/src/services/api.ts

// API URL konfigurace
const LOGIN_URL = '/api/auth/login';
const API_URL = '/api/proxy'; // Pro ostatní API volání

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

// Pomocné funkce pro logování
const logApiCall = (endpoint: string, method: string) => {
  console.log(`🌐 API Call: ${method} ${endpoint}`);
};

// Získání autorizačního tokenu s debugováním
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    console.log('✅ Autorizační token nalezen');
    return { Authorization: `Bearer ${token}` };
  } else {
    console.warn('⚠️ Autorizační token chybí');
    return {};
  }
};

// Vylepšená funkce pro zpracování odpovědi
const handleResponse = async (response: Response) => {
  // Kontrola typu odpovědi
  const contentType = response.headers.get('Content-Type') || '';
  console.log(`📄 Response Content-Type: ${contentType}`);
  
  if (!contentType.includes('application/json')) {
    console.error('❌ Odpověď není JSON:', response.status, contentType);
    
    // Získání a logování těla odpovědi
    const text = await response.text();
    console.error('❌ Tělo odpovědi:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    
    throw new Error(`Neočekávaný formát odpovědi: ${contentType}`);
  }
  
  // Kontrola, zda je odpověď v pořádku
  if (!response.ok) {
    console.error(`❌ Chyba API: ${response.status}`);
    // Pokus o získání detailů chyby
    try {
      const errorData = await response.json();
      console.error('❌ Chybová data:', errorData);
      throw new Error(errorData.error || `Chyba: ${response.status}`);
    } catch (e) {
      // Pokud nelze zpracovat JSON, použijeme obecnou chybu
      throw new Error(`Chyba: ${response.status}`);
    }
  }
  
  // Získání a vrácení dat
  try {
    const data = await response.json();
    console.log(`✅ Odpověď úspěšně zpracována`);
    return data;
  } catch (e) {
    console.error('❌ Chyba při parsování JSON odpovědi:', e);
    throw new Error('Neplatná JSON odpověď');
  }
};

// API služba
export const api = {
  // Autentizace
  login: async (email: string, password: string) => {
    logApiCall('login', 'POST');
    try {
      console.log('🔑 Pokus o přihlášení:', { email });
      
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await handleResponse(response);
      console.log('✅ Přihlášení úspěšné');
      return data;
    } catch (error: any) {
      console.error('❌ Chyba přihlášení:', error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('❌ Chyba načítání produktů:', error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error(`❌ Chyba načítání produktu ${id}:`, error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('❌ Chyba vytváření produktu:', error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error(`❌ Chyba aktualizace produktu ${id}:`, error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error(`❌ Chyba mazání produktu ${id}:`, error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('❌ Chyba importu produktů:', error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('❌ Chyba načítání nabídek:', error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error(`❌ Chyba načítání nabídky ${id}:`, error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('❌ Chyba vytváření nabídky:', error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error(`❌ Chyba aktualizace nabídky ${id}:`, error);
      throw error;
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
      
      return handleResponse(response);
    } catch (error: any) {
      console.error(`❌ Chyba mazání nabídky ${id}:`, error);
      throw error;
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
      console.error('❌ Chyba AI asistence:', error);
      throw error;
    }
  }
};
