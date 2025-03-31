// backend/api/src/handlers/enhancedIntelekHandler.js
// Vylepšený handler pro import produktů z Intelek.cz XML feedu

import { 
  fetchAndParseIntelekXml, 
  prepareIntelekXmlUrl,
  parseIntelekXmlProducts 
} from '../parsers/optimizedIntelekXmlParser.js';

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
 * 
 * Vylepšeno o:
 * - Detailnější reporting
 * - Zachování struktury kategorií
 * - Podporu pro omezení počtu importovaných produktů
 * - Optimalizace pro velké XML soubory
 */
export async function handleIntelekXmlImport(request, env) {
  try {
    const contentType = request.headers.get('Content-Type') || '';
    let importMode;
    let xml;
    let level;
    let token;
    let options = {};
    
    // Rozhodování o režimu importu a zpracování parametrů
    if (contentType.includes('application/json')) {
      const requestData = await request.json();
      
      // Nastavení režimu importu
      if (requestData.mode) {
        importMode = requestData.mode;
      } else {
        importMode = requestData.xml ? 'xml_data' : 'url';
      }
      
      // Základní parametry
      xml = requestData.xml;
      level = requestData.level;
      token = requestData.token;
      
      // Pokročilé možnosti
      if (requestData.options) {
        options = requestData.options;
      }
      
      // Extrakce jednotlivých možností přímo z root
      if (requestData.preserveCategories !== undefined) {
        options.preserveCategories = !!requestData.preserveCategories;
      }
      
      if (requestData.extractSpecs !== undefined) {
        options.extractSpecs = !!requestData.extractSpecs;
      }
      
      if (requestData.maxProducts !== undefined && !isNaN(parseInt(requestData.maxProducts))) {
        options.maxProducts = parseInt(requestData.maxProducts);
      }
      
      if (requestData.defaultCategory) {
        options.defaultCategory = requestData.defaultCategory;
      }
    } else {
      // Výchozí režim je URL import
      importMode = 'url';
    }
    
    console.log(`Starting Intelek XML import in ${importMode} mode with options:`, options);
    
    // Inicializace proměnných pro výsledek
    let importResult;
    
    // Zpracování podle režimu importu
    if (importMode === 'xml_data' && xml) {
      // Import z předaných XML dat
      console.log('Parsing provided XML data...');
      importResult = await parseIntelekXmlProducts(xml, options);
    } else {
      // Import přímo z URL (výchozí režim)
      const intelekUrl = prepareIntelekXmlUrl(level, token);
      console.log(`Fetching XML from URL: ${intelekUrl}`);
      importResult = await fetchAndParseIntelekXml(intelekUrl, options);
    }
    
    // Kontrola výsledku parsování
    if (!importResult || !importResult.products || importResult.products.length === 0) {
      return new Response(JSON.stringify({ 
        warning: 'Nebyly nalezeny žádné produkty v Intelek XML', 
        count: 0,
        metadata: importResult?.metadata || {}
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Uložení produktů jako "intelek_xml" zdroj
    const storeResult = await storeProductsFromSource(env, importResult.products, "intelek_xml");
    
    // Automatické sloučení dat - pokud není explicitně zakázáno
    if (options.skipMerge !== true) {
      await mergeProductData(env);
    }
    
    // Sestavení odpovědi s metadaty
    const response = { 
      message: 'Import Intelek XML proběhl úspěšně', 
      count: importResult.products.length,
      source: "intelek_xml",
      metadata: {
        ...importResult.metadata,
        storeResult
      }
    };
    
    // Přidání struktury kategorií, pokud byla zachována
    if (options.preserveCategories && importResult.metadata.categories) {
      response.categories = importResult.metadata.categories;
    }
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error importing Intelek XML:', error);
    
    // Strukturovaná chybová odpověď
    const errorResponse = { 
      error: 'Chyba při importu Intelek XML', 
      details: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handler pro získání aktuálního URL pro Intelek XML feed
 * s předvyplněnými výchozími hodnotami a informacemi o možnostech
 */
export async function handleGetIntelekXmlUrl(request, env) {
  try {
    const url = new URL(request.url);
    const level = url.searchParams.get('level') || '54003830';
    const token = url.searchParams.get('token') || 'PGC%2FbX15XeK%2FkGaBq7VN4A%3D%3D';
    
    const intelekUrl = prepareIntelekXmlUrl(level, token);
    
    // Rozšířená odpověď s informacemi o dostupných možnostech
    return new Response(JSON.stringify({ 
      url: intelekUrl,
      level,
      token,
      availableOptions: {
        preserveCategories: "Boolean - Zachová strukturu kategorií",
        extractSpecs: "Boolean - Extrahuje technické specifikace produktů",
        maxProducts: "Number - Omezí počet importovaných produktů (0 = bez limitu)",
        defaultCategory: "String - Výchozí kategorie pro produkty bez kategorie",
        skipMerge: "Boolean - Přeskočí automatické sloučení dat po importu"
      },
      example: {
        mode: "url",
        level: "54003830",
        token: "PGC%2FbX15XeK%2FkGaBq7VN4A%3D%3D",
        options: {
          preserveCategories: true,
          extractSpecs: true,
          maxProducts: 1000,
          defaultCategory: "Konektory a síťové prvky"
        }
      }
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
    const isXml = textPreview.trim().startsWith('<?xml') || 
                  textPreview.includes('<xml') || 
                  textPreview.includes('<product');
    
    // Rozšířené informace o XML struktuře
    let productCount = 0;
    let categories = [];
    
    if (isXml) {
      try {
        // Zkusíme zjistit počet produktů v XML
        const productMatches = textPreview.match(/<product>/g);
        if (productMatches) {
          productCount = productMatches.length;
        }
        
        // Zkusíme najít kategorie
        const categoryRegex = /<kategorie>[\s\S]*?<!\[CDATA\[(.*?)\]\]>[\s\S]*?<\/kategorie>/g;
        const categoryPlainRegex = /<kategorie>(.*?)<\/kategorie>/g;
        
        let categoryMatch;
        const uniqueCategories = new Set();
        
        // Zkusíme CDATA formát
        while ((categoryMatch = categoryRegex.exec(textPreview)) !== null) {
          uniqueCategories.add(categoryMatch[1].trim());
        }
        
        // Zkusíme plain text formát
        while ((categoryMatch = categoryPlainRegex.exec(textPreview)) !== null) {
          uniqueCategories.add(categoryMatch[1].trim());
        }
        
        categories = Array.from(uniqueCategories).filter(cat => cat);
      } catch (e) {
        console.warn("Error analyzing XML preview", e);
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      url: intelekUrl,
      isXml,
      contentLength: textPreview.length,
      preview: textPreview.substring(0, 500), // Prvních 500 znaků jako náhled
      estimatedProductCount: productCount,
      categories: categories.length > 0 ? categories.slice(0, 10) : [], // Max 10 kategorií jako ukázka
      timestamp: new Date().toISOString()
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

/**
 * Handler pro získání struktury kategorií produktů v Intelek feed
 */
export async function handleGetIntelekCategories(request, env) {
  try {
    const url = new URL(request.url);
    const level = url.searchParams.get('level') || '54003830';
    const token = url.searchParams.get('token') || 'PGC%2FbX15XeK%2FkGaBq7VN4A%3D%3D';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    const intelekUrl = prepareIntelekXmlUrl(level, token);
    
    // Rychlá analýza XML pro získání kategorií s limitem na počet produktů
    const options = {
      preserveCategories: true,
      maxProducts: limit
    };
    
    console.log(`Fetching categories from Intelek with limit: ${limit}`);
    const result = await fetchAndParseIntelekXml(intelekUrl, options);
    
    // Extrahování kategorií z výsledku
    const categories = result.metadata.categories || {};
    
    // Sestavení odpovědi s agregovanými daty
    const response = {
      success: true,
      categories: Object.keys(categories).map(category => ({
        name: category,
        productCount: categories[category].length,
        productSample: categories[category].slice(0, 3) // Ukázkové produkty
      })),
      metadata: {
        totalCategories: Object.keys(categories).length,
        totalProductsAnalyzed: result.products.length,
        processingTime: result.metadata.processingTime
      }
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error fetching Intelek categories:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Chyba při získávání kategorií z Intelek', 
      details: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
