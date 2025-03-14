// functions/api/proxy.js
// Vylepšená verze proxy funkce pro odstranění problému s HTML odpověďmi

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
      if (key.toLowerCase() !== 'host' && 
          key.toLowerCase() !== 'origin' && 
          key.toLowerCase() !== 'connection') {
        headers.set(key, value);
      }
    }
    
    // Explicitní nastavení důležitých hlaviček
    headers.set('Accept', 'application/json');
    
    // Pokud je to POST, PUT nebo DELETE a nemá Content-Type, nastavíme ho
    if (request.method !== 'GET' && request.method !== 'HEAD' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Logování pro debugging - kontrola hlaviček
    console.log(`[Proxy] Authorization header: ${headers.has('Authorization') ? 'Present' : 'Missing'}`);
    
    // Vytvoření nového požadavku pro backend API
    const apiRequest = new Request(targetURL.toString(), {
      method: request.method,
      headers: headers,
      // Kopírování těla požadavku, pokud je to potřeba
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.clone().arrayBuffer() : undefined,
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
    
    // Kontrola zda je odpověď JSON nebo ne
    if (!contentType.includes('application/json')) {
      console.log(`[Proxy] Non-JSON response detected`);
      
      try {
        // Čtení těla odpovědi pro debugging
        const responseText = await response.text();
        const preview = responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '');
        console.log(`[Proxy] Response body preview: ${preview}`);
        
        // Vrácení chybové zprávy v JSON formátu s užitečnými informacemi pro debugging
        return new Response(JSON.stringify({
          error: 'API returned non-JSON response',
          status: response.status,
          content_type: contentType,
          details: 'The API server returned a non-JSON response. This could indicate an authentication issue or server misconfiguration.',
          url: targetURL.toString(),
          body_preview: preview
        }), {
          status: 502, // Bad Gateway
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Debug-Original-Status': String(response.status)
          }
        });
      } catch (textError) {
        console.error(`[Proxy] Error reading response: ${textError}`);
        
        return new Response(JSON.stringify({
          error: 'Error reading API response',
          status: response.status,
          message: textError.message
        }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // Pro úspěšné JSON odpovědi přidáme CORS hlavičky a vrátíme
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    // Klonování a čtení těla odpovědi
    const responseData = await response.json();
    
    console.log(`[Proxy] Successfully processed JSON response: ${JSON.stringify(responseData).substring(0, 100)}...`);
    
    // Vrácení odpovědi klientovi
    return new Response(JSON.stringify(responseData), {
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
