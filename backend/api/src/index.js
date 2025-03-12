// backend/api/src/index.js - aktualizovaná verze s KV Storage
export default {
  async fetch(request, env, ctx) {
    // CORS hlavičky
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://offer-management-system.pages.dev",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true"
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
        
        // Načtení uživatele z KV Storage
        let user = null;
        
        // Kontrola, zda máme přístup ke KV Storage
        if (env.USERS) {
          // Pokus o načtení uživatele podle emailu
          const userJson = await env.USERS.get(`user:${email}`);
          if (userJson) {
            user = JSON.parse(userJson);
          }
        } else {
          // Fallback na testovací uživatele pokud KV ještě není nastaveno
          const testUsers = {
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
          
          user = testUsers[email];
        }
        
        // Kontrola, zda uživatel existuje
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
        
        // Aktualizace stavu relace uživatele na "ACTIVE"
        if (env.USERS) {
          user.sessionState = "ACTIVE";
          user.lastActivity = Date.now();
          await env.USERS.put(`user:${email}`, JSON.stringify(user));
        }
        
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
      
      // Endpoint pro zamknutí relace
      if (path === "/auth/lock" && request.method === "POST") {
        // Zde by byla implementace autentizace pomocí JWT
        // Pro účely ukázky předpokládáme, že požadavek obsahuje email uživatele
        const body = await request.json();
        const { email } = body;
        
        if (env.USERS) {
          const userJson = await env.USERS.get(`user:${email}`);
          if (userJson) {
            const user = JSON.parse(userJson);
            user.sessionState = "LOCKED";
            await env.USERS.put(`user:${email}`, JSON.stringify(user));
            
            return new Response(JSON.stringify({ message: "Relace uzamčena" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
        
        return new Response(JSON.stringify({ error: "Uživatel nenalezen" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Endpoint pro odemknutí relace
      if (path === "/auth/unlock" && request.method === "POST") {
        const body = await request.json();
        const { email, password } = body;
        
        if (env.USERS) {
          const userJson = await env.USERS.get(`user:${email}`);
          if (userJson) {
            const user = JSON.parse(userJson);
            
            // Kontrola hesla
            if (user.passwordHash !== password) {
              return new Response(JSON.stringify({ error: "Neplatné heslo" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              });
            }
            
            user.sessionState = "ACTIVE";
            user.lastActivity = Date.now();
            await env.USERS.put(`user:${email}`, JSON.stringify(user));
            
            return new Response(JSON.stringify({ message: "Relace odemčena" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
        
        return new Response(JSON.stringify({ error: "Uživatel nenalezen" }), {
          status: 404,
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
