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
      
      // Vrácení odpovědi s dodatečnými debugovacími hlavičkami
      const responseData = await response.json();
      return new Response(
        JSON.stringify(responseData),
        { 
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'X-Proxy-Status': 'Success',
            'X-Original-Status': response.status.toString(),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
          }
        }
      );
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
