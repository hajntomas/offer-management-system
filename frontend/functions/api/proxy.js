// Soubor: functions/api/proxy.js
// Tento soubor bude servírovat všechny požadavky na /api/*

export async function onRequest(context) {
  // Vaše backend API URL
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
  
  console.log(`Proxying request to: ${targetURL.toString()}`);
  
  // Vytvoření nového požadavku
  const newRequest = new Request(targetURL, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow',
  });
  
  try {
    // Odeslání požadavku na backend API
    const response = await fetch(newRequest);
    
    // Vrácení odpovědi klientovi
    return new Response(response.body, response);
  } catch (error) {
    // Zpracování chyby
    return new Response(
      JSON.stringify({ 
        error: 'Proxy Error', 
        message: error.message || 'Nelze kontaktovat API server'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
