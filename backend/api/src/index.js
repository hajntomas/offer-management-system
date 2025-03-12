// backend/api/src/index.js s použitím CORS helperu
// Funkce pro správu CORS požadavků
function handleCors(request) {
  // Povolené domény
  const allowedOrigin = "https://offer-management-system.pages.dev";
  
  // Získání origin z požadavku
  const requestOrigin = request.headers.get("Origin");
  
  // Standardní CORS hlavičky
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Max-Age": "86400",
  };
  
  // Pro OPTIONS požadavky vrátíme pouze hlavičky
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  // Pro ostatní požadavky vrátíme hlavičky pro použití v odpovědi
  return corsHeaders;
}

export default {
  async fetch(request, env, ctx) {
    // Zpracování CORS
    if (request.method === "OPTIONS") {
      return handleCors(request);
    }
    
    // Získání CORS hlaviček pro přidání do odpovědi
    const corsHeaders = handleCors(request);
    
    // Parsování URL pro směrování
    const url = new URL(request.url);
    const path = url.pathname;

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

    // Router
    try {
      // Testovací endpoint
      if (path === "/") {
        return new Response(JSON.stringify({ message: "API běží!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Přihlašovací endpoint
      if (path === "/auth/login" && request.method === "POST") {
        // Parsování požadavku
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return new Response(JSON.stringify({ error: "Neplatný JSON formát" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        const { email, password } = body;
        
        // Kontrola, zda uživatel existuje
        const user = users[email];
        if (!user) {
          return new Response(JSON.stringify({ error: "Neplatné přihlašovací údaje" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        // Kontrola hesla
        if (user.passwordHash !== password) {
          return new Response(JSON.stringify({ error: "Neplatné přihlašovací údaje" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        // Vytvoření tokenu
        const accessToken = `fake-jwt-token-${Date.now()}-${user.id}`;
        
        // Vrácení odpovědi s CORS hlavičkami
        return new Response(JSON.stringify({
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Fallback pro neznámé endpointy
      return new Response(JSON.stringify({ error: "Endpoint nenalezen" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (error) {
      // Obecná chyba
      return new Response(JSON.stringify({ error: "Chyba serveru", details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
