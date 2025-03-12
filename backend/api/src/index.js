// backend/api/src/index.js s Hono.js frameworkem
// Nejprve je potřeba nainstalovat Hono:
// npm install hono

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Vytvoření nové Hono aplikace
const app = new Hono();

// Nastavení CORS middleware
app.use('/*', cors({
  origin: 'https://offer-management-system.pages.dev',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  maxAge: 86400,
  credentials: true,
}));

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

// Testovací endpoint
app.get('/', (c) => {
  return c.json({ message: "API běží!" });
});

// Přihlašovací endpoint
app.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    
    // Kontrola, zda uživatel existuje
    const user = users[email];
    if (!user) {
      return c.json({ error: "Neplatné přihlašovací údaje" }, 401);
    }
    
    // Kontrola hesla
    if (user.passwordHash !== password) {
      return c.json({ error: "Neplatné přihlašovací údaje" }, 401);
    }
    
    // Vytvoření tokenu
    const accessToken = `fake-jwt-token-${Date.now()}-${user.id}`;
    
    // Vrácení odpovědi
    return c.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return c.json({ error: "Chyba serveru", details: error.message }, 500);
  }
});

// Obecný fallback pro neznámé endpointy
app.all('*', (c) => {
  return c.json({ error: "Endpoint nenalezen" }, 404);
});

// Export pro Cloudflare Worker
export default {
  fetch: app.fetch
};
