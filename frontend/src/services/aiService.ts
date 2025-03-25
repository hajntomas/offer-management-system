// frontend/src/services/aiService.ts
// Služba pro komunikaci s AI API a zpracování odpovědí

import { Product } from './api';

// Typy AI odpovědí
export type AiProductSuggestion = {
  id: string;
  nazev: string;
  reason: string;
};

export type AiResponse = {
  message: string;
  products?: AiProductSuggestion[];
  text?: string;
};

// Typy pro požadavky na AI
export type AiContext = {
  products: Product[];
  customerInfo?: {
    name: string;
    industry?: string;
    size?: string;
    previousOrders?: string[];
  };
  currentOffer?: any;
  userPreferences?: {
    budget?: number;
    preferredBrands?: string[];
    requirements?: string[];
  };
};

// Interface služby
interface AiService {
  // Základní metoda pro získání doporučení z AI
  getSuggestions(query: string, context: AiContext): Promise<AiResponse>;
  
  // Specializované metody pro konkrétní úkoly
  suggestProducts(requirements: string, context: AiContext): Promise<AiProductSuggestion[]>;
  generateOfferText(offerDetails: any): Promise<string>;
  optimizeOfferForCustomer(offer: any, customerInfo: any): Promise<any>;
}

// Implementace AI služby s použitím Cloudflare proxy pro API
export class OpenAiService implements AiService {
  private API_URL = '/ai/suggest'; // Endpoint na našem API proxy
  
  /**
   * Získá doporučení od AI na základě dotazu a kontextu
   */
  async getSuggestions(query: string, context: AiContext): Promise<AiResponse> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ query, context }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API chyba (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      // Zpracování odpovědi
      if (!data || !data.success || !data.result) {
        throw new Error('Neplatná odpověď z AI API');
      }
      
      return data.result as AiResponse;
    } catch (error: any) {
      console.error('Chyba při komunikaci s AI API:', error);
      throw new Error(`Chyba při získávání doporučení od AI: ${error.message}`);
    }
  }
  
  /**
   * Doporučí produkty na základě zadaných požadavků
   */
  async suggestProducts(requirements: string, context: AiContext): Promise<AiProductSuggestion[]> {
    // Vytvoření optimalizovaného dotazu pro AI
    const query = `Doporuč mi produkty na základě těchto požadavků: ${requirements}`;
    
    const response = await this.getSuggestions(query, context);
    
    if (!response.products || response.products.length === 0) {
      throw new Error('AI nenašla žádné vhodné produkty pro vaše požadavky');
    }
    
    return response.products;
  }
  
  /**
   * Generuje text nabídky na základě detailů
   */
  async generateOfferText(offerDetails: any): Promise<string> {
    // Vytvoření podrobného dotazu pro AI
    const { nazev, zakaznik, produkty, poznamky } = offerDetails;
    
    let query = `Vytvoř profesionální text nabídky s názvem "${nazev}" pro zákazníka "${zakaznik}" `;
    query += `obsahující tyto produkty: ${produkty.map((p: any) => p.nazev).join(', ')}. `;
    
    if (poznamky) {
      query += `Poznámky: ${poznamky}`;
    }
    
    const response = await this.getSuggestions(query, { products: [] });
    
    if (!response.text) {
      throw new Error('AI nevygenerovala žádný text nabídky');
    }
    
    return response.text;
  }
  
  /**
   * Optimalizuje nabídku pro konkrétního zákazníka
   */
  async optimizeOfferForCustomer(offer: any, customerInfo: any): Promise<any> {
    // Optimalizace nabídky na základě informací o zákazníkovi
    const query = `Optimalizuj tuto nabídku pro zákazníka ${customerInfo.name} 
                  z oblasti ${customerInfo.industry || 'nespecifikováno'} 
                  s velikostí ${customerInfo.size || 'nespecifikováno'}`;
    
    const context = {
      products: [],
      customerInfo,
      currentOffer: offer
    };
    
    const response = await this.getSuggestions(query, context);
    
    // Zpracování doporučení z AI
    return {
      optimizedOffer: offer, // Základní nabídka s úpravami
      recommendations: response.message,
      suggestedText: response.text || null,
      suggestedProducts: response.products || []
    };
  }
}

// Pokročilá implementace s více funkcemi
export class AdvancedAiService extends OpenAiService {
  /**
   * Analyzuje zákazníka a poskytne personalizované doporučení
   */
  async analyzeCustomer(customerInfo: any, purchaseHistory: any[]): Promise<any> {
    const query = `Analyzuj tohoto zákazníka a jeho nákupní historii. Jméno: ${customerInfo.name}, 
                  Oblast: ${customerInfo.industry || 'nespecifikováno'}, 
                  Velikost: ${customerInfo.size || 'nespecifikováno'}`;
    
    const context = {
      products: [],
      customerInfo: {
        ...customerInfo,
        previousOrders: purchaseHistory.map(order => order.id)
      }
    };
    
    const response = await this.getSuggestions(query, context);
    
    return {
      customerAnalysis: response.message,
      productRecommendations: response.products || []
    };
  }
  
  /**
   * Upraví text nabídky do určitého stylu
   */
  async stylizeOfferText(text: string, style: 'formal' | 'casual' | 'technical' | 'marketing'): Promise<string> {
    const query = `Uprav tento text nabídky do ${style} stylu: ${text}`;
    
    const response = await this.getSuggestions(query, { products: [] });
    
    if (!response.text) {
      throw new Error('AI nevygenerovala upravený text');
    }
    
    return response.text;
  }
  
  /**
   * Porovná dvě nabídky a poskytne analýzu
   */
  async compareOffers(offer1: any, offer2: any): Promise<any> {
    const query = `Porovnej tyto dvě nabídky a poskytni analýzu výhod a nevýhod každé z nich`;
    
    const context = {
      products: [],
      currentOffer: {
        offer1,
        offer2
      }
    };
    
    const response = await this.getSuggestions(query, context);
    
    return {
      comparison: response.message,
      recommendation: response.text || null
    };
  }
  
  /**
   * Vygeneruje přesvědčivý obchodní e-mail na základě nabídky
   */
  async generateEmailFromOffer(offer: any, emailType: 'introduction' | 'followup' | 'closing'): Promise<string> {
    const typeLabels = {
      'introduction': 'úvodní',
      'followup': 'navazující', 
      'closing': 'závěrečný'
    };
    
    const query = `Vytvoř ${typeLabels[emailType]} obchodní e-mail na základě této nabídky: 
                  Název nabídky: ${offer.nazev}, 
                  Zákazník: ${offer.zakaznik}, 
                  Celková cena: ${offer.celkova_cena_s_dph} Kč`;
    
    const response = await this.getSuggestions(query, { 
      products: [],
      currentOffer: offer
    });
    
    if (!response.text) {
      throw new Error('AI nevygenerovala žádný e-mail');
    }
    
    return response.text;
  }
}

// Export výchozí instance služby
export const aiService = new AdvancedAiService();
export default aiService;
