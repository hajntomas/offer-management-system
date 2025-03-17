// backend/api/src/index.js
// Upravená verze pro integraci nových produktových handlerů

// Import nových produktových handlerů
import {
  handleImportXmlCenik,
  handleImportXmlPopisky,
  handleImportExcel,
  handleMergeProductData,
  handleGetProducts,
  handleGetProductDetail,
  handleGetProductCategories,
  handleGetProductManufacturers,
  handleGetProductImportHistory
} from './handlers/productHandlers.js';

// CORS hlavičky pro cross-origin požadavky
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Změněno z https://offer-management-system.pages.dev na * pro vývoj
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

// Simulovaná data uživatelů
const users = {
  'admin@example.com': {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin',
    passwordHash: 'heslo123',
    role: 'admin',
  },
  'user@example.com': {
    id: '2',
    email: 'user@example.com',
    name: 'Uživatel',
    passwordHash: 'heslo123',
    role: 'merchant',
  }
};

// Simulovaná data produktů pro zpětnou kompatibilitu
const products = [
  {
    id: '1',
    kod: 'NB-DELL-XPS15',
    nazev: 'Dell XPS 15',
    cena_bez_dph: 29900,
    cena_s_dph: 36179,
    dostupnost: 'skladem',
    kategorie: 'notebooky',
    vyrobce: 'Dell',
    popis: 'Vysoce výkonný notebook s 15" displejem, procesorem Intel Core i7, 16GB RAM a 512GB SSD.'
  },
  {
    id: '2',
    kod: 'NB-MAC-PRO16',
    nazev: 'MacBook Pro 16',
    cena_bez_dph: 59900,
    cena_s_dph: 72479,
    dostupnost: 'na objednávku',
    kategorie: 'notebooky',
    vyrobce: 'Apple',
    popis: 'Profesionální notebook s 16" Retina displejem, procesorem M1 Pro, 16GB RAM a 1TB SSD.'
  },
  {
    id: '3',
    kod: 'PC-GAME-RTX4070',
    nazev: 'Herní PC RTX 4070',
    cena_bez_dph: 35900,
    cena_s_dph: 43439,
    dostupnost: 'skladem',
    kategorie: 'počítače',
    vyrobce: 'Custom',
    popis: 'Herní počítač s procesorem AMD Ryzen 7, 32GB RAM, 2TB SSD a grafickou kartou NVIDIA RTX 4070.'
  }
];

// Simulovaná data nabídek
const offers = [
  {
    id: '1',
    cislo: 'N2023001',
    nazev: 'Nabídka IT vybavení pro firmu ABC',
    zakaznik: 'ABC, s.r.o.',
    datum_vytvoreni: '2023-08-15',
    platnost_do: '2023-09-15',
    celkova_cena_bez_dph: 125700,
    celkova_cena_s_dph: 152097,
    polozky: [
      { produkt_id: '1', pocet: 3, cena_bez_dph: 29900, cena_s_dph: 36179 },
      { produkt_id: '3', pocet: 1, cena_bez_dph: 35900, cena_s_dph: 43439 }
    ],
    stav: 'aktivní'
  }
];

// Pomocné funkce
function parseJwt(token) {
  if (!token) return null;
  try {
    // Toto je zjednodušené parsování JWT bez ověření podpisu
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("JWT parse error:", e);
    return null;
  }
}

function handleCors(request) {
  // Odpověď na OPTIONS preflight požadavky
  if (request.method === 'OPTIONS') {
    console.log("CORS preflight request received");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  return null;
}

function authenticateRequest(request) {
  // Získání JWT tokenu z Authorization headeru
  const authHeader = request.headers.get('Authorization') || '';
  console.log("Auth header:", authHeader);
  
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  // Kontrola, že token existuje
  if (!token) {
    console.log("No token found");
    return { authenticated: false, error: 'Chybí autorizační token' };
  }
  
  // V produkci by zde mělo být ověření podpisu, ale pro účely příkladu je to zjednodušeno
  // Pokud token obsahuje userId, považujeme ho za platný
  const payload = parseJwt(token);
  if (!payload || !payload.userId) {
    console.log("Invalid token, no userId in payload");
    return { authenticated: false, error: 'Neplatný token' };
  }
  
  console.log("Authentication successful for userId:", payload.userId);
  return { authenticated: true, userId: payload.userId };
}

// Endpointy API pro produkty - UPRAVENO pro použití nových handleru
async function handleProductsRequest(request, url, env) {
  // Rozlišení podle cesty
  const path = url.pathname;
  console.log("Products path:", path);
  
  // UPRAVENO - Zpracování speciálních produktových endpointů
  
  // Import z XML ceníku
  if (path === '/products/import/cenik' && request.method === 'POST') {
    return handleImportXmlCenik(request, env);
  }
  
  // Import z XML popisků
  if (path === '/products/import/popisky' && request.method === 'POST') {
    return handleImportXmlPopisky(request, env);
  }
  
  // Import z Excel souboru
  if (path === '/products/import/excel' && request.method === 'POST') {
    return handleImportExcel(request, env);
  }
  
  // Ruční sloučení dat produktů
  if (path === '/products/merge' && request.method === 'POST') {
    return handleMergeProductData(request, env);
  }
  
  // Získání kategorií produktů
  if (path === '/products/categories' && request.method === 'GET') {
    return handleGetProductCategories(request, env);
  }
  
  // Získání výrobců produktů
  if (path === '/products/manufacturers' && request.method === 'GET') {
    return handleGetProductManufacturers(request, env);
  }
  
  // Získání historie importů produktů
  if (path === '/products/import-history' && request.method === 'GET') {
    return handleGetProductImportHistory(request, env);
  }
  
  // Extrakce ID produktu z URL
  const productId = path.match(/^\/products\/([^\/]+)$/)?.[1];
  
  // GET /products - Seznam všech produktů
  if (path === '/products' && request.method === 'GET') {
    // UPRAVENO - Použití nového handleru pro získání produktů
    return handleGetProducts(request, env);
  }
  
  // GET /products/:id - Detail produktu
  if (productId && request.method === 'GET') {
    // UPRAVENO - Použití nového handleru pro detail produktu
    return handleGetProductDetail(request, env, productId);
  }
  
  // Zachování původního kódu pro ostatní operace
  
  // POST /products - Vytvoření nového produktu
  if (path === '/products' && request.method === 'POST') {
    try {
      const productData = await request.json();
      
      // Vytvoření nového produktu
      const newProduct = {
        id: String(Date.now()), // Generování ID
        ...productData
      };
      
      // Přidání do kolekce (v reálné aplikaci by se ukládalo do KV)
      products.push(newProduct);
      
      return new Response(JSON.stringify(newProduct), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error("Error creating product:", error);
      return new Response(JSON.stringify({ error: 'Neplatná data produktu' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  // PUT /products/:id - Aktualizace produktu
  if (productId && request.method === 'PUT') {
    try {
      const productData = await request.json();
      const productIndex = products.findIndex(p => p.id === productId);
      
      if (productIndex === -1) {
        return new Response(JSON.stringify({ error: 'Produkt nenalezen' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Aktualizace produktu
      products[productIndex] = {
        ...products[productIndex],
        ...productData,
        id: productId // Zachováváme původní ID
      };
      
      return new Response(JSON.stringify(products[productIndex]), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error("Error updating product:", error);
      return new Response(JSON.stringify({ error: 'Neplatná data produktu' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  // DELETE /products/:id - Smazání produktu
  if (productId && request.method === 'DELETE') {
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      return new Response(JSON.stringify({ error: 'Produkt nenalezen' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Smazání produktu
    products.splice(productIndex, 1);
    
    return new Response(JSON.stringify({ message: 'Produkt byl smazán' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // Obecný endpoint pro import produktů z XML pro zpětnou kompatibilitu
  if (path === '/products/import' && request.method === 'POST') {
    try {
      const contentType = request.headers.get('Content-Type') || '';
      let xmlText;
      
      if (contentType.includes('application/json')) {
        // Pokud je odesláno jako JSON s XML uvnitř
        const { xml } = await request.json();
        xmlText = xml;
      } else {
        // Pokud je odesláno přímo jako text/xml
        xmlText = await request.text();
      }
      
      if (!xmlText) {
        return new Response(JSON.stringify({ error: 'Chybí XML data' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Přesměrování na nový handler pro XML ceník
      return handleImportXmlCenik(new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ xml: xmlText })
      }), env);
    } catch (error) {
      console.error("Error importing products:", error);
      return new Response(JSON.stringify({ 
        error: 'Chyba při importu', 
        details: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  // Pokud neodpovídá žádný endpoint
  return new Response(JSON.stringify({ error: 'Endpoint nenalezen' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Endpointy API pro nabídky - původní implementace
async function handleOffersRequest(request, url) {
  // Rozlišení podle cesty
  const path = url.pathname;
  const offerId = path.match(/^\/offers\/([^\/]+)$/)?.[1];
  
  // GET /offers - Seznam všech nabídek
  if (path === '/offers' && request.method === 'GET') {
    return new Response(JSON.stringify(offers), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // GET /offers/:id - Detail nabídky
  if (offerId && request.method === 'GET') {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) {
      return new Response(JSON.stringify({ error: 'Nabídka nenalezena' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    return new Response(JSON.stringify(offer), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // POST /offers - Vytvoření nové nabídky
  if (path === '/offers' && request.method === 'POST') {
    try {
      const offerData = await request.json();
      
      // Vytvoření nové nabídky
      const newOffer = {
        id: String(Date.now()), // Generování ID
        cislo: `N${new Date().getFullYear()}${String(offers.length + 1).padStart(3, '0')}`,
        datum_vytvoreni: new Date().toISOString().split('T')[0],
        ...offerData
      };
      
      // Přidání do kolekce (v reálné aplikaci by se ukládalo do KV)
      offers.push(newOffer);
      
      return new Response(JSON.stringify(newOffer), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error("Error creating offer:", error);
      return new Response(JSON.stringify({ error: 'Neplatná data nabídky' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  // PUT /offers/:id - Aktualizace nabídky
  if (offerId && request.method === 'PUT') {
    try {
      const offerData = await request.json();
      const offerIndex = offers.findIndex(o => o.id === offerId);
      
      if (offerIndex === -1) {
        return new Response(JSON.stringify({ error: 'Nabídka nenalezena' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Aktualizace nabídky
      offers[offerIndex] = {
        ...offers[offerIndex],
        ...offerData,
        id: offerId // Zachováváme původní ID
      };
      
      return new Response(JSON.stringify(offers[offerIndex]), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error("Error updating offer:", error);
      return new Response(JSON.stringify({ error: 'Neplatná data nabídky' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  // DELETE /offers/:id - Smazání nabídky
  if (offerId && request.method === 'DELETE') {
    const offerIndex = offers.findIndex(o => o.id === offerId);
    
    if (offerIndex === -1) {
      return new Response(JSON.stringify({ error: 'Nabídka nenalezena' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Smazání nabídky
    offers.splice(offerIndex, 1);
    
    return new Response(JSON.stringify({ message: 'Nabídka byla smazána' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // Pokud neodpovídá žádný endpoint
  return new Response(JSON.stringify({ error: 'Endpoint nenalezen' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Endpoint pro AI asistenci - původní implementace
async function handleAiRequest(request, url) {
  // Implementace mockované AI asistence
  if (url.pathname === '/ai/suggest' && request.method === 'POST') {
    try {
      const { query, context } = await request.json();
      
      // Toto je pouze mockovaná odpověď, v reálné aplikaci by se volal OpenAI/Anthropic API
      const mockAiResponses = {
        'doporučení produktů': {
          message: 'Doporučuji následující produkty na základě vašeho požadavku:',
          products: [
            { id: '1', nazev: 'Dell XPS 15', reason: 'Výkonný notebook vhodný pro podnikání' },
            { id: '3', nazev: 'Herní PC RTX 4070', reason: 'Vysoký výkon pro náročné aplikace' }
          ]
        },
        'úprava textu': {
          message: 'Upravený text nabídky:',
          text: 'Vážený zákazníku,\n\nna základě Vašeho požadavku Vám předkládáme nabídku IT vybavení, které splňuje Vámi uvedené parametry. Nabídka zahrnuje vysoce výkonné notebooky Dell XPS 15 a pracovní stanici s RTX 4070. Tyto produkty poskytují optimální poměr výkonu a ceny pro Vaše potřeby.\n\nS pozdravem,\nVáš dodavatel IT'
        },
        'default': {
          message: 'Nemohu poskytnout konkrétní doporučení bez více informací. Prosím, upřesněte svůj požadavek.'
        }
      };
      
      // Zjednodušené určení typu požadavku
      let responseType = 'default';
      if (query.toLowerCase().includes('produkt') || query.toLowerCase().includes('doporuč')) {
        responseType = 'doporučení produktů';
      } else if (query.toLowerCase().includes('text') || query.toLowerCase().includes('nabídka')) {
        responseType = 'úprava textu';
      }
      
      // Simulace zpoždění reálného API volání
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return new Response(JSON.stringify({
        success: true,
        result: mockAiResponses[responseType]
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error("Error processing AI request:", error);
      return new Response(JSON.stringify({ 
        error: 'Chyba při zpracování AI požadavku', 
        details: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  // Pokud neodpovídá žádný endpoint
  return new Response(JSON.stringify({ error: 'Endpoint nenalezen' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Přihlašovací endpoint - původní implementace
async function handleAuthRequest(request, url) {
  if (url.pathname === '/auth/login' && request.method === 'POST') {
    try {
      const { email, password } = await request.json();
      console.log("Login attempt for:", email);
      
      // Kontrola, zda uživatel existuje
      const user = users[email];
      if (!user) {
        console.log("User not found");
        return new Response(JSON.stringify({ error: 'Neplatné přihlašovací údaje' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Kontrola hesla
      if (user.passwordHash !== password) {
        console.log("Invalid password");
        return new Response(JSON.stringify({ error: 'Neplatné přihlašovací údaje' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      // Vytvoření tokenu (zjednodušené)
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hodina
      };
      
      // Normálně by se token podepisoval s JWT_SECRET, toto je pouze simulace
      const base64Payload = btoa(JSON.stringify(payload));
      const accessToken = `header.${base64Payload}.signature`;
      
      console.log("Login successful, token generated");
      
      // Vrácení odpovědi
      return new Response(JSON.stringify({
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      console.error("Login error:", error);
      return new Response(JSON.stringify({ 
        error: 'Chyba při přihlašování', 
        details: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  // Pokud neodpovídá žádný endpoint
  return new Response(JSON.stringify({ error: 'Endpoint nenalezen' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Hlavní funkce pro zpracování požadavků - UPRAVENO pro předání env parametru
async function handleRequest(request, env) {
  const url = new URL(request.url);
  console.log(`Request: ${request.method} ${url.pathname}`);
  
  // Zpracování CORS preflight požadavků
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  // Testovací endpoint
  if (url.pathname === '/' && request.method === 'GET') {
    return new Response(JSON.stringify({ message: 'API běží!' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // Přesměrování podle cesty
  if (url.pathname.startsWith('/auth/')) {
    return handleAuthRequest(request, url);
  }
  
  if (url.pathname.startsWith('/products')) {
    // UPRAVENO - předáváme env parametr pro přístup ke KV Storage
    return handleProductsRequest(request, url, env);
  }
  
  if (url.pathname.startsWith('/offers')) {
    // Ověření autentizace pro všechny požadavky na nabídky
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    return handleOffersRequest(request, url);
  }
  
  if (url.pathname.startsWith('/ai/')) {
    // Ověření autentizace pro všechny AI požadavky
    const auth = authenticateRequest(request);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    return handleAiRequest(request, url);
  }
  
  // Pokud neodpovídá žádný endpoint
  return new Response(JSON.stringify({ error: 'Endpoint nenalezen' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

// Export pro Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    try {
      // UPRAVENO - předáváme env parametr pro přístup ke KV Storage
      return await handleRequest(request, env);
    } catch (error) {
      console.error("Unhandled error:", error);
      return new Response(JSON.stringify({ 
        error: 'Neočekávaná chyba serveru', 
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};
