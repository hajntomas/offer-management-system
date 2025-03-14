// functions/api/proxy.js
// Vylepšená verze proxy s lepším debugováním a ošetřením chyb

export async function onRequest(context) {
  // Backend API URL
  const API_URL = 'https://broad-darkness-f0a6.hajn-tomas.workers.dev';
  
  // Získání cesty z požadavku
  const { request } = context;
  const url = new URL(request.url);
  
  // Extrahování relevantní části cesty
  // Odstraní /api/proxy z začátku cesty
  let pathname = url.pathname;
  const apiPrefix = '/api/proxy';
  
  if (pathname.startsWith(apiPrefix)) {
    pathname = pathname.substring(apiPrefix.length) || '/';
  } else {
    pathname = '/';
  }
  
  // Vytvoření cílové URL
  const targetURL = new URL(pathname, API_URL);
  
  // Zachování případných query parametrů
  targetURL.search = url.search;
  
  console.log(`[Proxy] Request: ${request.method} ${targetURL.toString()}`);
  
  // Pro OPTIONS požadavky (preflight CORS)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  try {
    // Klonování hlaviček pro úpravu
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      // Předání všech hlaviček kromě host a origin
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'origin') {
        headers.append(key, value);
      }
    }
    
    // Zajištění správného content-type
    if (!headers.has('Content-Type') && request.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }
    
    // Zajištění accept hlavičky
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    
    // Logování autorizační hlavičky (bezpečnostní riziko v produkci!)
    const authHeader = headers.get('Authorization');
    console.log(`[Proxy] Authorization header present: ${authHeader ? 'yes' : 'no'}`);
    
    // Vytvoření nového požadavku
    const newRequest = new Request(targetURL, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'follow',
    });
    
    console.log(`[Proxy] Sending request to backend with headers: ${Array.from(headers.keys()).join(', ')}`);
    
    // Odeslání požadavku na backend API
    const response = await fetch(newRequest);
    console.log(`[Proxy] Response status: ${response.status}`);
    
    // Klonování odpovědi s úpravou CORS hlaviček
    const contentType = response.headers.get('Content-Type');
    console.log(`[Proxy] Response content type: ${contentType}`);
    
    // Pokud odpověď není v pořádku, logujeme její obsah
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[Proxy] Error response body: ${responseText.substring(0, 200)}`);
      
      return new Response(responseText, {
        status: response.status,
        headers: {
          'Content-Type': contentType || 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
        }
      });
    }
    
    // Vytvoření nových hlaviček pro odpověď s CORS
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    // Vrácení upravené odpovědi
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
    
  } catch (error) {
    // Detailní logování chyby
    console.error(`[Proxy] Error: ${error.message}`);
    console.error(`[Proxy] Stack: ${error.stack}`);
    
    // Zpracování chyby
    return new Response(
      JSON.stringify({ 
        error: 'Proxy Error', 
        message: error.message || 'Nelze kontaktovat API server',
        url: targetURL.toString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      }
    );
  }
}
