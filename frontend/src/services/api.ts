// frontend/src/services/api.ts
// Optimalizovaná verze API klienta s použitím generických funkcí

// API URL konfigurace
const API_URL = 'https://broad-darkness-f0a6.hajn-tomas.workers.dev';

// Debug režim - v produkci nastavit na false
const DEBUG = process.env.NODE_ENV !== 'production';

// Typy
export type Product = {
  id?: string;
  kod: string;
  nazev: string;
  cena_bez_dph: number;
  cena_s_dph: number;
  dostupnost: string | number;
  kategorie?: string;
  vyrobce?: string;
  popis?: string;
  kratky_popis?: string;
  obrazek?: string;
  ean?: string;
  parametry?: string;
  dokumenty?: string;
  merged_sources?: string[];
};

export type ProductsResponse = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    totalProducts: number;
    totalPages: number;
  },
  lastUpdated?: string;
};

export type ImportResponse = {
  message: string;
  count: number;
  filename?: string;
};

export type ProductFilterOptions = {
  kategorie?: string;
  vyrobce?: string;
  search?: string;
  page?: number;
  limit?: number;
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

// Fallback data pro případ výpadku endpointů
const FALLBACK = {
  CATEGORIES: ["notebooky", "počítače", "monitory", "příslušenství"],
  MANUFACTURERS: ["Dell", "Apple", "HP", "Lenovo", "Custom"]
};

// Pomocné funkce pro logování
const logDebug = (message: string, data?: any) => {
  if (DEBUG) console.log(`🌐 ${message}`, data ? data : '');
};

const logError = (message: string, error?: any) => {
  if (DEBUG) console.error(`❌ ${message}`, error ? error : '');
};

// Získání autorizačního tokenu
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generická funkce pro zpracování HTTP odpovědi
const handleResponse = async <T>(response: Response): Promise<T> => {
  try {
    // Získání textu odpovědi
    const responseText = await response.text();
    logDebug(`Response status: ${response.status}`, responseText.substring(0, 100));
    
    // Parsování JSON
    let data: any = {};
    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        throw {
          message: 'Neplatná odpověď serveru - nebylo možné parsovat JSON',
          status: response.status,
          details: responseText,
          originalError: error
        };
      }
    }
    
    // Kontrola chyb
    if (!response.ok) {
      throw {
        message: data.error || data.message || `HTTP chyba: ${response.status} ${response.statusText}`,
        status: response.status,
        details: data.details || JSON.stringify(data)
      };
    }
    
    return data as T;
  } catch (error: any) {
    // Přeformátování chyby pro konzistentní zpracování
    const apiError: ApiError = {
      message: error.message || 'Neznámá chyba při komunikaci s API',
      status: error.status || 500,
      details: error.details,
      originalError: error
    };
    throw apiError;
  }
};

// Generická funkce pro API požadavky
const fetchApi = async <T>(
  endpoint: string, 
  method: string = 'GET', 
  body?: any, 
  customHeaders?: Record<string, string>,
  useFormData: boolean = false
): Promise<T> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  logDebug(`${method} ${url}`);
  
  try {
    // Základní hlavičky
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...getAuthHeader(),
      ...customHeaders
    };
    
    // Přidání Content-Type pouze pokud nepoužíváme FormData
    if (!useFormData && body && method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }
    
    // Konfigurace fetch požadavku
    const fetchOptions: RequestInit = {
      method,
      headers,
      body: useFormData ? body : body ? JSON.stringify(body) : undefined
    };
    
    // Odeslání požadavku
    const response = await fetch(url, fetchOptions);
    return handleResponse<T>(response);
  } catch (error: any) {
    logError(`Error calling ${method} ${endpoint}:`, error);
    
    // Pokud je to ApiError, předáme ho dál
    if (error.status) throw error;
    
    // Jinak vytvoříme novou ApiError
    throw {
      message: error.message || `Chyba při volání ${method} ${endpoint}`,
      originalError: error
    };
  }
};

// Pomocná funkce pro sestavení URL s parametry
const buildUrlWithParams = (endpoint: string, params: Record<string, any>): string => {
  // Filtrování undefined a prázdných hodnot
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  
  // Pokud nejsou žádné parametry, vrátíme původní endpoint
  if (Object.keys(filteredParams).length === 0) {
    return endpoint;
  }
  
  // Sestavení query stringu
  const queryString = new URLSearchParams(
    Object.entries(filteredParams).map(([key, value]) => [key, String(value)])
  ).toString();
  
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`;
};

// Implementace API rozhraní
export const api = {
  // Testování API endpointů
  testEndpoint: (path: string): Promise<any> => {
    return fetchApi(path);
  },
  
  // Autentizace
  login: (email: string, password: string): Promise<any> => {
    return fetchApi('/auth/login', 'POST', { email, password });
  },
  
  // Produkty
  getProducts: async (options: ProductFilterOptions = {}): Promise<Product[]> => {
    try {
      const url = buildUrlWithParams('/products', options);
      const data = await fetchApi<ProductsResponse>(url);
      return data.products || [];
    } catch (error) {
      logError('Error loading products:', error);
      throw error;
    }
  },
  
  getProduct: (id: string): Promise<Product> => {
    return fetchApi<Product>(`/products/${id}`);
  },
  
  // Kategorie s fallbackem
  getProductCategories: async (): Promise<string[]> => {
    try {
      const categories = await fetchApi<string[]>('/products/categories');
      if (Array.isArray(categories) && categories.length > 0) {
        return categories;
      }
      logDebug('Using fallback categories (empty response)');
      return FALLBACK.CATEGORIES;
    } catch (error) {
      logError('Error loading categories:', error);
      logDebug('Using fallback categories after error');
      return FALLBACK.CATEGORIES;
    }
  },
  
  // Výrobci s fallbackem
  getProductManufacturers: async (): Promise<string[]> => {
    try {
      const manufacturers = await fetchApi<string[]>('/products/manufacturers');
      if (Array.isArray(manufacturers) && manufacturers.length > 0) {
        return manufacturers;
      }
      logDebug('Using fallback manufacturers (empty response)');
      return FALLBACK.MANUFACTURERS;
    } catch (error) {
      logError('Error loading manufacturers:', error);
      logDebug('Using fallback manufacturers after error');
      return FALLBACK.MANUFACTURERS;
    }
  },
  
  // Import produktů
  importXmlCenik: (importData: string): Promise<ImportResponse> => {
    // Nejprve se pokusíme parsovat string jako JSON (protože IntelekImport.tsx je předává jako JSON.stringify)
    try {
      const parsedData = JSON.parse(importData);
      // Použijeme přímo parsovaná data
      return fetchApi<ImportResponse>('/products/import/cenik', 'POST', parsedData);
    } catch (e) {
      // Pokud to není validní JSON, pošleme původní způsob (zpětná kompatibilita)
      return fetchApi<ImportResponse>('/products/import/cenik', 'POST', { xml: importData });
    }
  },
  
  importXmlPopisky: (xmlData: string): Promise<ImportResponse> => {
    return fetchApi<ImportResponse>('/products/import/popisky', 'POST', { xml: xmlData });
  },
  
  importExcel: (file: File): Promise<ImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi<ImportResponse>('/products/import/excel', 'POST', formData, {}, true);
  },
  
  mergeProductData: (): Promise<{ message: string, count: number }> => {
    return fetchApi<{ message: string, count: number }>('/products/merge', 'POST');
  },
  
  getProductImportHistory: (): Promise<any> => {
    return fetchApi('/products/import-history');
  },
  
  // Diagnostika
  testKVStorage: (): Promise<any> => {
    return fetchApi('/products/kv-test');
  },
  
  // Produkty CRUD
  createProduct: (product: Omit<Product, 'id'>): Promise<Product> => {
    return fetchApi<Product>('/products', 'POST', product);
  },
  
  updateProduct: (id: string, product: Partial<Product>): Promise<Product> => {
    return fetchApi<Product>(`/products/${id}`, 'PUT', product);
  },
  
  deleteProduct: (id: string): Promise<void> => {
    return fetchApi<void>(`/products/${id}`, 'DELETE');
  },
  
  // Nabídky
  getOffers: (): Promise<Offer[]> => {
    return fetchApi<Offer[]>('/offers');
  },
  
  getOffer: (id: string): Promise<Offer> => {
    return fetchApi<Offer>(`/offers/${id}`);
  },
  
  createOffer: (offer: Omit<Offer, 'id' | 'cislo' | 'datum_vytvoreni'>): Promise<Offer> => {
    return fetchApi<Offer>('/offers', 'POST', offer);
  },
  
  updateOffer: (id: string, offer: Partial<Offer>): Promise<Offer> => {
    return fetchApi<Offer>(`/offers/${id}`, 'PUT', offer);
  },
  
  deleteOffer: (id: string): Promise<void> => {
    return fetchApi<void>(`/offers/${id}`, 'DELETE');
  },
  
  // AI asistence
  getAiSuggestion: (query: string, context: any): Promise<any> => {
    return fetchApi<any>('/ai/suggest', 'POST', { query, context });
  },
  
  // Zpětná kompatibilita
  importProducts: (xmlData: string): Promise<{ message: string, count: number }> => {
    return fetchApi<{ message: string, count: number }>('/products/import', 'POST', { xml: xmlData });
  }
};
