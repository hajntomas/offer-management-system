// functions/api/proxy.js
// Vylepšená verze proxy funkce pro zajištění správného přeposílání požadavků

export async function onRequest(context) {
  // Backend API URL - přímé volání backend API
  const API_URL = 'https://broad-darkness-f0a6.hajn-tomas.workers.dev';
  
  // Získání informací z požadavku
  const { request } = context;
  const url = new URL(request.url);
  
  // Extrahování části cesty po /api/proxy
  let pathname = url.pathname;
  const apiPrefix = '/api/proxy';
  
  if (pathname.startsWith(apiPrefix)) {
    pathname = pathname.substring(apiPrefix.length) || '/';
  } else {
    pathname = '/';
  }
  
  // Sestavení cílové URL včetně původních query parametrů
  const targetURL = new URL(pathname, API_URL);
  targetURL.search = url.search;
  
  console.log(`[Proxy] Forwarding ${request.method} request to: ${targetURL.toString()}`);
  
  // Zpracování CORS preflight požadavků
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
    // Vytvoření nových headers pro API požadavek
    const headers = new Headers();
    
    // Zkopírování relevantních hlaviček z původního požadavku
    for (const [key, value] of request.headers.entries()) {
      // Vynecháme hlavičky, které by mohly způsobit problémy
      if (!['host', 'origin', 'referer', 'connection'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }
    
    // Explicitní nastavení důležitých hlaviček
    headers.set('Accept', 'application/json');
    
    // Kontrola, zda máme autorizační token
    if (request.headers.has('Authorization')) {
      console.log(`[Proxy] Authorization header is present`);
    } else {
      console.log(`[Proxy] Authorization header is missing`);
    }
    
    // Ujistíme se, že máme správný Content-Type pro metody s tělem
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Získání těla požadavku, pokud existuje
    let requestBody = null;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          const jsonText = await request.clone().text();
          console.log(`[Proxy] Request body: ${jsonText.substring(0, 100)}${jsonText.length > 100 ? '...' : ''}`);
          requestBody = jsonText;
        } catch (error) {
          console.error(`[Proxy] Error reading request body: ${error.message}`);
        }
      } else if (contentType.includes('multipart/form-data')) {
        // Pro multipart/form-data používáme původní tělo
        try {
          requestBody = await request.clone().arrayBuffer();
          console.log(`[Proxy] Form data detected, binary body length: ${requestBody.byteLength} bytes`);
        } catch (error) {
          console.error(`[Proxy] Error reading form data: ${error.message}`);
        }
      }
    }
    
    // Vytvoření nového požadavku pro backend API
    const apiRequest = new Request(targetURL.toString(), {
      method: request.method,
      headers: headers,
      body: requestBody,
      redirect: 'manual', // Důležité! Zabráníme automatickému přesměrování
    });
    
    // Odeslání požadavku na backend API
    const response = await fetch(apiRequest);
    
    // Kontrola typu odpovědi
    const contentType = response.headers.get('Content-Type') || '';
    console.log(`[Proxy] Response status: ${response.status}, Content-Type: ${contentType}`);
    
    // Pokud server vrátil přesměrování (3xx), logujeme to a vrátíme chybu
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location') || 'Unknown location';
      console.log(`[Proxy] Redirect detected to: ${location}`);
      
      return new Response(JSON.stringify({
        error: 'API Redirect Detected',
        status: response.status,
        location: location,
        message: 'Backend API tried to redirect the request, which may indicate a configuration issue.'
      }), {
        status: 502, // Bad Gateway
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Čtení těla odpovědi
    let responseBody;
    try {
      responseBody = await response.text();
      console.log(`[Proxy] Response body (first 100 chars): ${responseBody.substring(0, 100)}${responseBody.length > 100 ? '...' : ''}`);
    } catch (error) {
      console.error(`[Proxy] Error reading response body: ${error.message}`);
      return new Response(JSON.stringify({
        error: 'Error reading API response',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Příprava nových hlaviček odpovědi s CORS
    const responseHeaders = new Headers();
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    // Zkopírování důležitých hlaviček z původní odpovědi
    for (const [key, value] of response.headers.entries()) {
      if (!['access-control-allow-origin', 'access-control-allow-methods', 
           'access-control-allow-headers'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }
    
    // Nastavení Content-Type
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    } else {
      // Pokud chybí Content-Type, defaultně nastavíme application/json
      responseHeaders.set('Content-Type', 'application/json');
    }
    
    // Vrácení odpovědi klientovi
    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error(`[Proxy] Error: ${error.message || 'Unknown error'}`);
    console.error(error.stack);
    
    // Detailní chybová odpověď pro jednodušší debugging
    return new Response(JSON.stringify({
      error: 'Proxy Error',
      message: error.message || 'Failed to contact API server',
      url: targetURL.toString(),
      stack: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
