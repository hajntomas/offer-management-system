// functions/api/proxy.js
// Proxy, která transformuje HTML odpovědi na JSON chyby

export async function onRequest(context) {
  // Nastavení backend API URL
  const API_URL = 'https://broad-darkness-f0a6.hajn-tomas.workers.dev';
  
  // Získání cesty z požadavku
  const { request } = context;
  const url = new URL(request.url);
  
  // Extrahování relevantní části cesty
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
  
  console.log(`[Proxy] ${request.method} ${targetURL.toString()}`);
  
  // Pro OPTIONS požadavky vraťte CORS hlavičky (preflight)
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
    // Klon request headers a vytvoření nových headers pro náš požadavek
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // Neklonovat origin a host hlavičky
      if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'origin') {
        headers.append(key, value);
      }
    });
    
    // Zajistíme, že používáme application/json pro zpracování
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (request.method !== 'GET' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Pokud neexistuje Authorization hlavička ale máme token v localStorage, 
    // získáme ho z localStorage
    if (!headers.has('Authorization')) {
      // Toto by mělo být nahrazeno skutečným získáním tokenu z prohlížeče,
      // ale v Cloudflare Functions k němu nemáme přístup
      console.log('[Proxy] No Authorization header present');
    } else {
      console.log('[Proxy] Authorization header found');
    }
    
    // Vytvořte nový požadavek se stejným tělem a metodou, ale novými headers
    const newRequest = new Request(targetURL, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      redirect: 'follow',
    });
    
    // Odeslání požadavku na API
    const response = await fetch(newRequest);
    
    // Získání obsahu odpovědi
    const contentType = response.headers.get('Content-Type') || '';
    
    // Pokud odpověď není JSON, transformujeme ji na JSON chybovou zprávu
    if (!contentType.includes('application/json')) {
      console.log(`[Proxy] Non-JSON response received: ${contentType}`);
      
      try {
        // Načtení HTML odpovědi
        const htmlText = await response.text();
        console.log(`[Proxy] HTML response: ${htmlText.substring(0, 150)}...`);
        
        // Vytvoření JSON chybové odpovědi
        return new Response(JSON.stringify({
          error: 'API returned non-JSON response',
          status: response.status,
          content_type: contentType,
          details: 'The API server returned HTML instead of JSON. This usually means authentication failed or API server is not properly configured.',
          html_preview: htmlText.substring(0, 200) + (htmlText.length > 200 ? '...' : '')
        }), {
          status: 502, // Bad Gateway
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
          }
        });
      } catch (textError) {
        console.error('[Proxy] Error reading response text:', textError);
        // Pokud selže načítání textu, vraťte obecnou chybu
        return new Response(JSON.stringify({
          error: 'API returned invalid response',
          status: response.status,
          content_type: contentType
        }), {
          status: 502,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
          }
        });
      }
    }
    
    // Pro JSON odpovědi pouze přidáme CORS hlavičky a vrátíme původní odpověď
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    
    console.log(`[Proxy] Successfully returned JSON response, status: ${response.status}`);
    
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
    
  } catch (error) {
    // Logování chyby
    console.error(`[Proxy] Error:`, error);
    
    // Vrácení JSON chybové odpovědi
    return new Response(JSON.stringify({
      error: 'Proxy Error',
      message: error.message || 'Failed to contact API server',
      target_url: targetURL.toString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
      }
    });
  }
}
