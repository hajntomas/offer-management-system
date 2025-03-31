// functions/api/intelek-proxy.js
// Speciální proxy pro komunikaci s Intelek.cz

export async function onRequest(context) {
  const { request } = context;
  
  // Povolit pouze POST požadavky
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metoda není povolena" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Allow": "POST",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  
  // Zpracování CORS preflight požadavků
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  
  try {
    // Získání URL z těla požadavku
    const requestData = await request.json();
    const targetUrl = requestData.url;
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "URL nebyla zadána" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Ověření, zda je URL platná (a pro bezpečnost omezit na intelek.cz)
    const validURL = /^https?:\/\/(www\.)?intelek\.cz\/.*\.(jsp|xml)/.test(targetUrl);
    if (!validURL) {
      return new Response(JSON.stringify({ error: "Neplatná URL. Musí být z domény intelek.cz a končit na .jsp nebo .xml" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    console.log(`[Intelek Proxy] Fetching from URL: ${targetUrl}`);
    
    // Nastavení specifických hlaviček pro požadavek na Intelek.cz
    const headers = new Headers({
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
      "Accept": "application/xml, text/xml, application/json, text/plain, */*",
      "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
      "Referer": "https://www.intelek.cz/"
    });
    
    // Vytvoření požadavku
    const targetRequest = new Request(targetUrl, {
      method: "GET",
      headers: headers,
      redirect: "follow"
    });
    
    // Zaslání požadavku na cílovou URL
    const response = await fetch(targetRequest);
    
    console.log(`[Intelek Proxy] Response status: ${response.status}, Content-Type: ${response.headers.get("Content-Type") || 'unspecified'}`);
    
    // Vytvoření nových hlaviček pro odpověď
    const responseHeaders = new Headers({
      "Content-Type": response.headers.get("Content-Type") || "text/xml",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "public, max-age=3600"
    });
    
    // Získání těla odpovědi
    const responseBody = await response.text();
    
    // Kontrola, zda odpověď obsahuje XML data
    if (!responseBody.includes("<product>") && !responseBody.includes("<?xml")) {
      console.log(`[Intelek Proxy] Warning: Response might not be valid XML. First 100 chars: ${responseBody.substring(0, 100)}`);
    }
    
    // Vrácení odpovědi klientovi
    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error(`[Intelek Proxy] Error: ${error.message || 'Unknown error'}`);
    
    return new Response(JSON.stringify({ 
      error: "Chyba při zpracování požadavku",
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
