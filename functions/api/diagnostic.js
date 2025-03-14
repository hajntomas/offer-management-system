// functions/api/diagnostic.js
// Diagnostický nástroj pro zjištění stavu API

export async function onRequest(context) {
  // Backend API URL
  const API_URL = 'https://broad-darkness-f0a6.hajn-tomas.workers.dev';
  const { request } = context;
  
  // Seznam endpointů, které budeme testovat
  const endpoints = [
    { path: '/', method: 'GET', description: 'Root endpoint' },
    { path: '/products', method: 'GET', description: 'Products list' }
  ];
  
  const results = [];
  
  // Projít všechny endpointy a provést test
  for (const endpoint of endpoints) {
    try {
      const targetUrl = new URL(endpoint.path, API_URL);
      console.log(`Testing ${endpoint.method} ${targetUrl}`);
      
      // Vytvoření testovacího požadavku
      const testRequest = new Request(targetUrl, {
        method: endpoint.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Odeslání požadavku
      const startTime = Date.now();
      const response = await fetch(testRequest);
      const endTime = Date.now();
      
      // Pokusíme se zpracovat odpověď
      let responseBody;
      let responseData;
      const contentType = response.headers.get('Content-Type') || '';
      
      try {
        responseBody = await response.text();
        
        // Pokusíme se parsovat jako JSON
        if (contentType.includes('application/json')) {
          try {
            responseData = JSON.parse(responseBody);
          } catch (parseError) {
            responseData = { error: 'Failed to parse JSON', message: parseError.message };
          }
        }
      } catch (bodyError) {
        responseBody = `Error reading response body: ${bodyError.message}`;
      }
      
      // Vytvoření výsledku testu
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        status: response.status,
        statusText: response.statusText,
        time: `${endTime - startTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
        contentType,
        isJson: contentType.includes('application/json'),
        bodyPreview: responseBody ? responseBody.substring(0, 500) : null,
        parsedData: responseData,
        success: response.ok && contentType.includes('application/json')
      });
      
    } catch (error) {
      results.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        error: error.message,
        stack: error.stack,
        success: false
      });
    }
  }
  
  // Vrácení diagnostických výsledků
  return new Response(JSON.stringify({
    timestamp: new Date().toISOString(),
    apiUrl: API_URL,
    userAgent: request.headers.get('User-Agent'),
    results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
