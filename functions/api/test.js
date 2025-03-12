// functions/api/test.js
// Tento soubor můžete použít pro testování dostupnosti a funkčnosti backend API

export async function onRequest(context) {
  // Backend API URL
  const API_URL = 'https://broad-darkness-f0a6.hajn-tomas.workers.dev';
  
  try {
    // Test GET endpointu pro ověření dostupnosti serveru
    const response = await fetch(API_URL);
    
    // Získání odpovědi
    const responseText = await response.text();
    
    // Vytvoření odpovědi s detailními informacemi
    return new Response(
      JSON.stringify({
        message: 'Test výsledek pro backend API',
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        contentType: response.headers.get('Content-Type'),
        body: responseText,
        endpoint: API_URL
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    // Zpracování chyby
    return new Response(
      JSON.stringify({
        error: 'Chyba při kontaktování backend API',
        details: error.message,
        endpoint: API_URL
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
}
