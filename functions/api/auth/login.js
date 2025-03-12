// functions/api/auth/login.js

export async function onRequest(context) {
  // Backend API URL
  const API_URL = 'https://broad-darkness-f0a6.hajn-tomas.workers.dev';
  const { request } = context;
  
  console.log(`Login handler received ${request.method} request`);
  
  // Pro POST požadavek na login
  if (request.method === 'POST') {
    try {
      // Získání a logování údajů pro debugging
      const requestData = await request.clone().json();
      console.log(`Login attempt for: ${requestData.email}`);
      
      // Vytvoření cílové URL pro login endpoint
      const loginUrl = new URL('/auth/login', API_URL);
      
      // Vytvoření nového požadavku s explicitním nastavením všech parametrů
      const loginRequest = new Request(loginUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      // Odeslání požadavku na backend
      console.log(`Sending request to: ${loginUrl.toString()}`);
      const response = await fetch(loginRequest);
      console.log(`Received response with status: ${response.status}`);
      
      // Zkontrolujeme typ odpovědi
      const contentType = response.headers.get('Content-Type') || '';
      
      // Bezpečné získání textové odpovědi
      const responseText = await response.text();
      console.log(`Response body: ${responseText.substring(0, 100)}...`);
      
      let responseData;
      
      // Pokus o parsování JSON pouze pokud odpověď je ve formátu JSON
      if (contentType.includes('application/json') && responseText.trim()) {
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`Failed to parse JSON: ${parseError.message}`);
          return new Response(
            JSON.stringify({
              error: 'Chyba při parsování odpovědi z API',
              details: `Odpověď není validní JSON: ${parseError.message}`,
              rawResponse: responseText
            }),
            { 
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }
      } else {
        // Pokud odpověď není JSON, vrátíme jako chybu
        return new Response(
          JSON.stringify({
            error: 'Neočekávaný formát odpovědi z API',
            contentType,
            responseText,
            status: response.status
          }),
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
      
      // Pokud je vše v pořádku a máme JSON data
      if (response.ok && responseData) {
        return new Response(
          JSON.stringify(responseData),
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
            }
          }
        );
      } else {
        // Pokud server vrátil chybu, předáme ji klientovi
        return new Response(
          JSON.stringify({
            error: responseData?.error || 'Chyba na straně serveru',
            status: response.status,
            details: responseData || responseText
          }),
          { 
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }
    } catch (error) {
      console.error(`Login error: ${error.message || 'Unknown error'}`);
      return new Response(
        JSON.stringify({ 
          error: 'Chyba při zpracování přihlášení',
          details: error.message || 'Unknown error',
          location: 'Login handler'
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Proxy-Error': error.message || 'Unknown error',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  }
  
  // Pro OPTIONS požadavky (preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  // Pro jiné HTTP metody
  return new Response(
    JSON.stringify({ 
      error: 'Nepodporovaná metoda',
      method: request.method,
      supportedMethods: ['POST', 'OPTIONS']
    }),
    { 
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Allow': 'POST, OPTIONS',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}
