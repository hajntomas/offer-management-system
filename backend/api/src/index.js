// backend/api/src/index.js
export default {
  async fetch(request, env, ctx) {
    // Umožní CORS pro vývoj
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    // Zpracování OPTIONS požadavků pro CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Parsování URL pro směrování
    const url = new URL(request.url);
    const path = url.pathname;

    // Simulovaná data uživatelů (v reálné aplikaci by byla v KV Storage)
    const users = {
      'admin@example.com': {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        passwordHash: 'heslo123', // Pro ukázku - v reálné aplikaci použijte bcrypt!
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

    // Jednoduchý router
    try {
      // Testovací endpoint
      if (path === "/") {
        return new Response(JSON.stringify({ message: "API běží!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Přihlašovací endpoint
      if (path === "/auth/login" && request.method === "POST") {
        const body = await request.json();
        const { email, password } = body;
        
        // Kontrola, zda uživatel existuje
        const user = users[email];
        if (!user) {
          return new Response(JSON.stringify({ error: "Neplatné přihlašovací údaje" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        // Kontrola hesla (ve skutečné aplikaci byste použili bcrypt.compare)
        if (user.passwordHash !== password) {
          return new Response(JSON.stringify({ error: "Neplatné přihlašovací údaje" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        // V reálné aplikaci byste tady vytvořili JWT token pomocí knihovny
        // Pro účely ukázky použijeme simulovaný token
        const accessToken = `fake-jwt-token-${Date.now()}-${user.id}`;
        
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
