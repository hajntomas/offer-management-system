// backend/api/src/handlers/intelekImportHandler.js
// Specializovaný handler pro import produktů z Intelek.cz XML feedu

import { fetchAndParseIntelekXml, prepareIntelekXmlUrl } from '../parsers/intelekXmlParser.js';
import { storeProductsFromSource, mergeProductData } from '../services/productService.js';

// CORS hlavičky
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

/**
 * Handler pro importování XML produktů z Intelek.cz
 * Podporuje dva režimy:
 * 1. Import z URL (stáhne data přímo z URL)
 * 2. Import z poskytnutých XML dat
 */
export async function handleIntelekXmlImport(request, env) {
  try {
    const contentType = request.headers.get('Content-Type') || '';
    let importMode;
    let xml;
    let level;
    let token;
    
    // Rozhodování o režimu importu
    if (contentType.includes('application/json')) {
      const requestData = await request.json();
      
      if (requestData.mode) {
        importMode = requestData.mode;
      } else {
        // Pokud je poskytnuto XML, použijeme režim xml_data
        importMode = requestData.xml ? 'xml_data' : 'url';
      }
      
      xml = requestData.xml;
      level = requestData.level;
      token = requestData.token;
    } else {
      // Výchozí režim je URL import
      importMode = 'url';
    }
    
    let products = [];
    
    // Zpracování podle režimu importu
    if (importMode === 'xml_data' && xml) {
      // Import z předaných XML dat
      const intelekProducts = await parseIntelekXml(xml);
      products = intelekProducts;
    } else {
      // Import přímo z URL (výchozí režim)
      const intelekUrl = prepareIntelekXmlUrl(level, token);
      const intelekProducts = await fetchAndParseIntelekXml(intelekUrl);
      products = intelekProducts;
    }
    
    // Kontrola výsledku parsování
    if (products.length === 0) {
      return new Response(JSON.stringify({ 
        warning: 'Nebyly nalezeny žádné produkty v Intelek XML', 
        count: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Uložení produktů jako "intelek_xml" zdroj
    await storeProductsFromSource(env, products, "intelek_xml");
    
    // Automatické sloučení dat
    await mergeProductData(env);
    
    return new Response(JSON.stringify({ 
      message: 'Import Intelek XML proběhl úspěšně', 
      count: products.length,
      source: "intelek_xml"
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error importing Intelek XML:', error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při importu Intelek XML', 
      details: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Pomocná funkce pro parsování XML dat přímo z uploadovaného řetězce
 */
async function parseIntelekXml(xmlData) {
  // Parsování XML dat pomocí existujícího parseru
  const parser = await import('../parsers/intelekXmlParser.js');
  return parser.parseIntelekXmlProducts(xmlData);
}

/**
 * Handler pro získání aktuálního URL pro Intelek XML feed
 * s předvyplněnými výchozími hodnotami
 */
export async function handleGetIntelekXmlUrl(request, env) {
  try {
    const url = new URL(request.url);
    const level = url.searchParams.get('level') || '54003830';
    const token = url.searchParams.get('token') || 'PGC%2FbX15XeK%2FkGaBq7VN4A%3D%3D';
    
    const intelekUrl = prepareIntelekXmlUrl(level, token);
    
    return new Response(JSON.stringify({ 
      url: intelekUrl,
      level,
      token
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error generating Intelek URL:', error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při generování URL pro Intelek XML', 
      details: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handler pro testování připojení k Intelek.cz
 * a ověření, že URL funguje správně
 */
export async function handleTestIntelekConnection(request, env) {
  try {
    const url = new URL(request.url);
    const level = url.searchParams.get('level') || '54003830';
    const token = url.searchParams.get('token') || 'PGC%2FbX15XeK%2FkGaBq7VN4A%3D%3D';
    
    const intelekUrl = prepareIntelekXmlUrl(level, token);
    
    // Testovací požadavek na Intelek URL
    const response = await fetch(intelekUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*'
      }
    });
    
    if (!response.ok) {
      return new Response(JSON.stringify({ 
        success: false,
        error: `HTTP chyba ${response.status}: ${response.statusText}`,
        url: intelekUrl
      }), {
        status: 200, // Vracíme 200 i v případě chyby, ale s příznakem success: false
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Přečtení prvních několika bytů odpovědi pro ověření, že jde o XML
    const textPreview = await response.text();
    const isXml = textPreview.trim().startsWith('<?xml') || textPreview.includes('<xml') || textPreview.includes('<product');
    
    return new Response(JSON.stringify({ 
      success: true,
      url: intelekUrl,
      isXml,
      contentLength: textPreview.length,
      preview: textPreview.substring(0, 200) // Prvních 200 znaků jako náhled
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error testing Intelek connection:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Chyba při testování připojení k Intelek', 
      details: error.message 
    }), {
      status: 200, // Vracíme 200 i v případě chyby, ale s příznakem success: false
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
