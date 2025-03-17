// backend/api/src/handlers/productHandlers.js
// API endpointy pro správu produktů

import { 
  parseXmlCenikProducts, 
  parseXmlPopiskyProducts 
} from '../parsers/xmlParser.js';
import { 
  parseExcelProducts 
} from '../parsers/excelParser.js';
import {
  storeProductsFromSource,
  mergeProductData,
  getProducts,
  getProductDetail,
  getProductCategories,
  getProductManufacturers,
  getProductImportHistory
} from '../services/productService.js';

// CORS hlavičky
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': 'true'
};

/**
 * Handler pro importování XML ceníku produktů
 */
export async function handleImportXmlCenik(request, env) {
  try {
    const { xml } = await request.json();
    
    if (!xml || typeof xml !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Neplatný XML vstup', 
        details: 'Očekáváno XML jako string'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Parsování XML a získání produktů
    const products = parseXmlCenikProducts(xml);
    
    if (products.length === 0) {
      return new Response(JSON.stringify({ 
        warning: 'Nebyly nalezeny žádné produkty v XML', 
        count: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Uložení produktů jako "xml_cenik" zdroj
    await storeProductsFromSource(env, products, "xml_cenik");
    
    return new Response(JSON.stringify({ 
      message: 'Import ceníku proběhl úspěšně', 
      count: products.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error importing XML ceník:', error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při importu XML ceníku', 
      details: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handler pro importování XML popisků produktů
 */
export async function handleImportXmlPopisky(request, env) {
  try {
    const { xml } = await request.json();
    
    if (!xml || typeof xml !== 'string') {
      return new Response(JSON.stringify({ 
        error: 'Neplatný XML vstup', 
        details: 'Očekáváno XML jako string'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Parsování XML a získání produktů
    const products = parseXmlPopiskyProducts(xml);
    
    if (products.length === 0) {
      return new Response(JSON.stringify({ 
        warning: 'Nebyly nalezeny žádné produkty v XML', 
        count: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Uložení produktů jako "xml_popisky" zdroj
    await storeProductsFromSource(env, products, "xml_popisky");
    
    return new Response(JSON.stringify({ 
      message: 'Import popisků proběhl úspěšně', 
      count: products.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error importing XML popisky:', error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při importu XML popisků', 
      details: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handler pro importování Excel souboru s produkty
 */
export async function handleImportExcel(request, env) {
  try {
    // Získání nahraného souboru z formdata
    const formData = await request.formData();
    const excelFile = formData.get('file');
    
    if (!excelFile) {
      return new Response(JSON.stringify({ 
        error: 'Soubor nenalezen', 
        details: 'Excel soubor nebyl nahrán'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Kontrola typu souboru
    if (!excelFile.name.endsWith('.xlsx') && !excelFile.name.endsWith('.xls')) {
      return new Response(JSON.stringify({ 
        error: 'Neplatný formát souboru', 
        details: 'Je vyžadován Excel soubor (XLSX nebo XLS)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Načtení a zpracování Excel souboru
    const arrayBuffer = await excelFile.arrayBuffer();
    const products = await parseExcelProducts(arrayBuffer);
    
    if (products.length === 0) {
      return new Response(JSON.stringify({ 
        warning: 'Nebyly nalezeny žádné platné produkty v Excel souboru', 
        count: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Uložení produktů jako "excel" zdroj
    await storeProductsFromSource(env, products, "excel", excelFile.name);
    
    return new Response(JSON.stringify({ 
      message: 'Import Excelu proběhl úspěšně', 
      count: products.length,
      filename: excelFile.name
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error importing Excel:', error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při importu Excel souboru', 
      details: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handler pro ruční sloučení dat z různých zdrojů
 */
export async function handleMergeProductData(request, env) {
  try {
    const count = await mergeProductData(env);
    
    return new Response(JSON.stringify({ 
      message: 'Sloučení dat proběhlo úspěšně', 
      count: count 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error merging product data:', error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při slučování dat produktů', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handler pro získání seznamu produktů
 */
export async function handleGetProducts(request, env) {
  try {
    const url = new URL(request.url);
    
    // Extrakce parametrů z URL
    const options = {
      kategorie: url.searchParams.get('kategorie'),
      vyrobce: url.searchParams.get('vyrobce'),
      search: url.searchParams.get('search'),
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '50')
    };
    
    // Získání produktů s filtrováním a stránkováním
    const result = await getProducts(env, options);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při získávání produktů', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handler pro získání detailu produktu
 */
export async function handleGetProductDetail(request, env, productKod) {
  try {
    const product = await getProductDetail(env, productKod);
    
    return new Response(JSON.stringify(product), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error(`Error getting product detail for ${productKod}:`, error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při získávání detailu produktu', 
      details: error.message 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handler pro získání seznamu kategorií produktů
 */
export async function handleGetProductCategories(request, env) {
  try {
    const categories = await getProductCategories(env);
    
    return new Response(JSON.stringify(categories), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error getting product categories:', error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při získávání kategorií produktů', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handler pro získání seznamu výrobců produktů
 */
export async function handleGetProductManufacturers(request, env) {
  try {
    const manufacturers = await getProductManufacturers(env);
    
    return new Response(JSON.stringify(manufacturers), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error getting product manufacturers:', error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při získávání výrobců produktů', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

/**
 * Handler pro získání historie importů produktů
 */
export async function handleGetProductImportHistory(request, env) {
  try {
    const history = await getProductImportHistory(env);
    
    return new Response(JSON.stringify(history), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error getting product import history:', error);
    return new Response(JSON.stringify({ 
      error: 'Chyba při získávání historie importů produktů', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
