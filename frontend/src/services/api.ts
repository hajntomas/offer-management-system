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

// Pomocné funkce
const getAuthHeader = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response: Response) => {
  // Kontrola, zda je odpověď v pořádku
  if (!response.ok) {
    // Pokus o získání detailů chyby
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `Chyba: ${response.status}`);
    } catch (e) {
      // Pokud nelze zpracovat JSON, použijeme obecnou chybu
      throw new Error(`Chyba: ${response.status}`);
    }
  }
  
  // Získání a vrácení dat
  return response.json();
};

// API služba
export const api = {
  // Autentizace
  login: async (email: string, password: string) => {
    try {
      console.log('Attempting to login with:', { email });
      
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Produkty
  getProducts: async (): Promise<Product[]> => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Get products error:', error);
      throw error;
    }
  },
  
  getProduct: async (id: string): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Get product error:', error);
      throw error;
    }
  },
  
  createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(product)
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Create product error:', error);
      throw error;
    }
  },
  
  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(product)
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Update product error:', error);
      throw error;
    }
  },
  
  deleteProduct: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Delete product error:', error);
      throw error;
    }
  },
  
  importProducts: async (xmlData: string): Promise<{ message: string, count: number }> => {
    try {
      const response = await fetch(`${API_URL}/products/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ xml: xmlData })
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Import products error:', error);
      throw error;
    }
  },
  
  // Nabídky
  getOffers: async (): Promise<Offer[]> => {
    try {
      const response = await fetch(`${API_URL}/offers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Get offers error:', error);
      throw error;
    }
  },
  
  getOffer: async (id: string): Promise<Offer> => {
    try {
      const response = await fetch(`${API_URL}/offers/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Get offer error:', error);
      throw error;
    }
  },
  
  createOffer: async (offer: Omit<Offer, 'id' | 'cislo' | 'datum_vytvoreni'>): Promise<Offer> => {
    try {
      const response = await fetch(`${API_URL}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(offer)
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Create offer error:', error);
      throw error;
    }
  },
  
  updateOffer: async (id: string, offer: Partial<Offer>): Promise<Offer> => {
    try {
      const response = await fetch(`${API_URL}/offers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(offer)
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Update offer error:', error);
      throw error;
    }
  },
  
  deleteOffer: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await fetch(`${API_URL}/offers/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('Delete offer error:', error);
      throw error;
    }
  },
  
  // AI asistence
  getAiSuggestion: async (query: string, context?: any): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/ai/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ query, context })
      });
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      throw error;
    }
  }
};
