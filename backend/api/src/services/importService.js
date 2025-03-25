// backend/api/src/services/importService.js
// Služba pro dávkové zpracování importů produktů

/**
 * Služba zajišťující dávkové zpracování importů pro velký počet produktů
 * - Průběžné reportování stavu
 * - Zpracování na pozadí
 * - Efektivnější využití paměti
 */

import { storeProductsFromSource, mergeProductData } from './productService.js';

// Struktura pro sledování průběhu importu
const activeImports = new Map();

/**
 * Spustí import XML ceníku s dávkovým zpracováním
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} xml - XML data k importu
 * @param {string} importId - Unikátní ID importu
 * @returns {Promise<Object>} Informace o zahájení importu
 */
export async function startBatchXmlCenikImport(env, xml, importId) {
  try {
    // Kontrola validních XML dat
    if (!xml || typeof xml !== 'string') {
      throw new Error('Neplatný XML vstup');
    }
    
    // Inicializace stavu importu
    const importStatus = {
      id: importId,
      type: 'xml_cenik',
      status: 'processing',
      startTime: Date.now(),
      progress: 0,
      totalProducts: 0,
      processedProducts: 0,
      errorCount: 0,
      errors: []
    };
    
    // Uložení stavu importu
    activeImports.set(importId, importStatus);
    await env.PRODUKTY.put(`import_status:${importId}`, JSON.stringify(importStatus));
    
    // Spuštění importu na pozadí
    setTimeout(() => {
      processBatchXmlCenikImport(env, xml, importId).catch(error => {
        console.error(`Error in batch import ${importId}:`, error);
        
        // Aktualizace stavu v případě chyby
        updateImportStatus(env, importId, {
          status: 'failed',
          endTime: Date.now(),
          errorCount: 1,
          errors: [error.message]
        });
      });
    }, 0);
    
    // Vrácení informací o importu
    return {
      message: 'Import ceníku byl zahájen',
      importId,
      status: 'processing'
    };
  } catch (error) {
    console.error('Error starting batch XML ceník import:', error);
    throw new Error(`Chyba při zahájení importu XML ceníku: ${error.message}`);
  }
}

/**
 * Zpracování XML ceníku v dávkách
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} xml - XML data k importu
 * @param {string} importId - Unikátní ID importu
 * @returns {Promise<void>}
 */
async function processBatchXmlCenikImport(env, xml, importId) {
  // Velikost dávky - kolik produktů zpracovat v jedné iteraci
  const BATCH_SIZE = 100;
  
  try {
    // Fáze 1: Parsování XML a identifikace produktů
    // Extrahujeme všechny produkty z XML pomocí regulárního výrazu
    console.log(`[Import ${importId}] Extracting products from XML`);
    
    const productRegex = /<product>([\s\S]*?)<\/product>/g;
    const productMatches = [];
    let match;
    
    // Najdeme všechny produkty v XML
    while ((match = productRegex.exec(xml)) !== null) {
      productMatches.push(match[0]);
    }
    
    const totalProducts = productMatches.length;
    console.log(`[Import ${importId}] Found ${totalProducts} products in XML`);
    
    // Aktualizace stavu importu
    updateImportStatus(env, importId, {
      totalProducts,
      status: totalProducts > 0 ? 'processing' : 'failed',
      errors: totalProducts > 0 ? [] : ['Nebyly nalezeny žádné produkty v XML']
    });
    
    if (totalProducts === 0) {
      return;
    }
    
    // Fáze 2: Dávkové zpracování produktů
    const allProducts = [];
    const errors = [];
    
    // Zpracování po dávkách
    for (let i = 0; i < productMatches.length; i += BATCH_SIZE) {
      console.log(`[Import ${importId}] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(productMatches.length / BATCH_SIZE)}`);
      
      const batchProducts = [];
      const batchEnd = Math.min(i + BATCH_SIZE, productMatches.length);
      
      // Zpracování jednotlivých produktů v dávce
      for (let j = i; j < batchEnd; j++) {
        try {
          const productXml = productMatches[j];
          const product = parseProductXml(productXml);
          
          if (product && product.kod) {
            batchProducts.push(product);
          } else {
            errors.push(`Produkt na pozici ${j + 1} nemá kód`);
          }
        } catch (error) {
          console.error(`Error parsing product at position ${j + 1}:`, error);
          errors.push(`Chyba při zpracování produktu na pozici ${j + 1}: ${error.message}`);
        }
      }
      
      // Přidání zpracovaných produktů do celkového seznamu
      allProducts.push(...batchProducts);
      
      // Aktualizace stavu importu
      const processedProducts = allProducts.length;
      const progress = (processedProducts / totalProducts) * 100;
      
      updateImportStatus(env, importId, {
        progress,
        processedProducts,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Omezení počtu chyb kvůli velikosti
      });
      
      // Pauza mezi dávkami, aby se uvolnil event loop (v případě velkého XML)
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Fáze 3: Uložení produktů do KV Storage
    console.log(`[Import ${importId}] Storing ${allProducts.length} products in KV Storage`);
    
    updateImportStatus(env, importId, {
      status: 'storing',
      progress: 95
    });
    
    await storeProductsFromSource(env, allProducts, "xml_cenik");
    
    // Fáze 4: Dokončení importu
    console.log(`[Import ${importId}] Import completed successfully`);
    
    updateImportStatus(env, importId, {
      status: 'completed',
      progress: 100,
      endTime: Date.now(),
      errorCount: errors.length,
      errors: errors.slice(0, 10)
    });
    
  } catch (error) {
    console.error(`[Import ${importId}] Error processing batch import:`, error);
    
    // Aktualizace stavu v případě kritické chyby
    updateImportStatus(env, importId, {
      status: 'failed',
      endTime: Date.now(),
      errorCount: 1,
      errors: [error.message]
    });
  }
}

/**
 * Parsuje XML produktu na objekt
 * @param {string} productXml - XML reprezentace produktu
 * @returns {Object} Objekt produktu
 */
function parseProductXml(productXml) {
  // Extrakce dat z produktu
  const kod = extractValue(productXml, "kod");
  const ean = extractValue(productXml, "ean");
  
  // Extrakce názvu a odstranění CDATA a HTML tagů
  const nazev = cleanText(extractValue(productXml, "nazev"));
  
  // Extrakce cen a převod na čísla
  const cenaBezDph = parseFloat(extractValue(productXml, "vasecenabezdph")) || 0;
  const cenaSDph = parseFloat(extractValue(productXml, "vasecenasdph")) || 0;
  
  // Získání dostupnosti a převod na celé číslo
  const dostupnost = parseInt(extractValue(productXml, "dostupnost")) || 0;
  
  // Další cenové údaje
  const euBezDph = parseFloat(extractValue(productXml, "eubezdph")) || 0;
  const eusDph = parseFloat(extractValue(productXml, "eusdph")) || 0;
  const remaBezDph = extractValue(productXml, "remabezdph");
  const remaDph = extractValue(productXml, "remadph");
  
  return {
    kod,
    ean,
    nazev,
    cena_bez_dph: cenaBezDph,
    cena_s_dph: cenaSDph,
    dostupnost,
    eu_bez_dph: euBezDph,
    eu_s_dph: eusDph,
    rema_bez_dph: remaBezDph ? parseFloat(remaBezDph) : null,
    rema_dph: remaDph ? parseFloat(remaDph) : null,
    source: "xml_cenik"
  };
}

/**
 * Extrahuje hodnotu z XML tagu
 * @param {string} xml - XML text
 * @param {string} tag - Název tagu
 * @returns {string} Hodnota tagu nebo prázdný řetězec
 */
function extractValue(xml, tag) {
  const regex = new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * Čistí text od CDATA a HTML tagů
 * @param {string} text - Text k vyčištění
 * @returns {string} Vyčištěný text
 */
function cleanText(text) {
  if (!text) return "";
  
  // Odstranění CDATA tagů
  const cdataMatch = text.match(/\<\!\[CDATA\[(.*?)\]\]\>/);
  if (cdataMatch) {
    text = cdataMatch[1].trim();
  }
  
  // Odstranění HTML tagů
  text = text.replace(/<[^>]*>/g, "");
  
  return text;
}

/**
 * Aktualizuje stav importu
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} importId - ID importu
 * @param {Object} updateData - Data k aktualizaci
 * @returns {Promise<void>}
 */
async function updateImportStatus(env, importId, updateData) {
  try {
    // Získání aktuálního stavu
    const currentStatus = activeImports.get(importId) || {};
    
    // Aktualizace stavu
    const updatedStatus = {
      ...currentStatus,
      ...updateData,
      lastUpdated: Date.now()
    };
    
    // Uložení do paměti a KV storage
    activeImports.set(importId, updatedStatus);
    await env.PRODUKTY.put(`import_status:${importId}`, JSON.stringify(updatedStatus));
    
  } catch (error) {
    console.error(`Error updating import status for ${importId}:`, error);
  }
}

/**
 * Získá stav importu
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} importId - ID importu
 * @returns {Promise<Object>} Stav importu
 */
export async function getImportStatus(env, importId) {
  try {
    // Nejprve zkusit z memory cache
    if (activeImports.has(importId)) {
      return activeImports.get(importId);
    }
    
    // Pokud není v cache, získat z KV storage
    const status = await env.PRODUKTY.get(`import_status:${importId}`);
    
    if (status) {
      return JSON.parse(status);
    }
    
    throw new Error(`Import s ID ${importId} nebyl nalezen`);
  } catch (error) {
    console.error(`Error getting import status for ${importId}:`, error);
    throw new Error(`Chyba při získávání stavu importu: ${error.message}`);
  }
}

/**
 * Získá seznam všech aktivních a nedávno dokončených importů
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @returns {Promise<Array>} Seznam importů
 */
export async function getActiveImports(env) {
  try {
    // Seznam klíčů - v reálné implementaci by to bylo komplexnější
    // Například pomocí List operace na KV storage
    // Zde zjednodušeně vracíme jen aktivní importy z paměti
    
    const memoryImports = Array.from(activeImports.values());
    
    // Seřazení podle času - nejnovější první
    return memoryImports.sort((a, b) => b.startTime - a.startTime);
  } catch (error) {
    console.error('Error getting active imports:', error);
    return [];
  }
}

/**
 * Zruší běžící import
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} importId - ID importu
 * @returns {Promise<Object>} Výsledek operace
 */
export async function cancelImport(env, importId) {
  try {
    const status = await getImportStatus(env, importId);
    
    // Import už je dokončený nebo selhal
    if (status.status === 'completed' || status.status === 'failed') {
      return {
        message: `Import je již ve stavu ${status.status}, nelze zrušit`,
        importId,
        status: status.status
      };
    }
    
    // Aktualizace stavu
    await updateImportStatus(env, importId, {
      status: 'cancelled',
      endTime: Date.now()
    });
    
    return {
      message: 'Import byl úspěšně zrušen',
      importId,
      status: 'cancelled'
    };
  } catch (error) {
    console.error(`Error cancelling import ${importId}:`, error);
    throw new Error(`Chyba při rušení importu: ${error.message}`);
  }
}
