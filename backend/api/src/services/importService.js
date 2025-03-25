// backend/api/src/services/importService.js
// Optimalizovaná služba pro dávkové zpracování importů produktů

/**
 * Služba zajišťující dávkové zpracování importů pro velký počet produktů
 * - Průběžné reportování stavu
 * - Zpracování na pozadí
 * - Efektivnější využití paměti
 * - Optimalizovaná logika zpracování
 */

import { storeProductsFromSource, mergeProductData } from './productService.js';

// Struktura pro sledování průběhu importu - použití WeakMap pro lepší GC
const activeImports = new Map();

// Konstanty pro optimalizaci
const BATCH_SIZE = 100; // Velikost dávky pro zpracování
const MAX_ERRORS = 10;  // Maximální počet ukládaných chyb
const PROCESS_DELAY = 10; // ms mezi dávkami pro uvolnění event loop

/**
 * Generuje unikátní ID importu
 * @returns {string} Unikátní ID importu
 */
function generateImportId() {
  return `import_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Spustí import XML ceníku s dávkovým zpracováním
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} xml - XML data k importu
 * @param {string} [importId] - Volitelné unikátní ID importu
 * @returns {Promise<Object>} Informace o zahájení importu
 */
export async function startBatchXmlCenikImport(env, xml, importId = generateImportId()) {
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
      errors: [],
      lastUpdated: Date.now()
    };
    
    // Uložení stavu importu
    activeImports.set(importId, importStatus);
    await env.PRODUKTY.put(`import_status:${importId}`, JSON.stringify(importStatus));
    
    // Spuštění importu na pozadí - Promise pro pozdější čekání na dokončení
    const importPromise = processBatchXmlCenikImport(env, xml, importId).catch(error => {
      console.error(`Error in batch import ${importId}:`, error);
      
      // Aktualizace stavu v případě chyby
      updateImportStatus(env, importId, {
        status: 'failed',
        endTime: Date.now(),
        errorCount: 1,
        errors: [error.message]
      });
    });
    
    // Vrácení informací o importu bez čekání na dokončení
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
 * Zpracování XML ceníku v dávkách - optimalizovaná verze
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} xml - XML data k importu
 * @param {string} importId - Unikátní ID importu
 * @returns {Promise<void>}
 */
async function processBatchXmlCenikImport(env, xml, importId) {
  try {
    console.log(`[Import ${importId}] Starting XML cenik import`);
    
    // Fáze 1: Rychlá extrakce produktů z XML pomocí regulárního výrazu
    const extractStartTime = Date.now();
    console.log(`[Import ${importId}] Extracting products from XML`);
    
    const productRegex = /<product>([\s\S]*?)<\/product>/g;
    
    // Použijeme Array.from s iterátorem pro efektivnější práci s pamětí
    const productMatches = Array.from(
      { 
        // Funkce, která vytváří iterátor všech výskytů
        [Symbol.iterator]: function* () {
          let match;
          while ((match = productRegex.exec(xml)) !== null) {
            yield match[0];
          }
        }
      }
    );
    
    const totalProducts = productMatches.length;
    const extractEndTime = Date.now();
    
    console.log(`[Import ${importId}] Found ${totalProducts} products in XML in ${extractEndTime - extractStartTime}ms`);
    
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
    
    // Předkompilování často používaných regulárních výrazů pro lepší výkon
    const tagRegexes = {
      kod: /<kod>(.*?)<\/kod>/i,
      ean: /<ean>(.*?)<\/ean>/i,
      nazev: /<nazev>(.*?)<\/nazev>/i,
      vasecenabezdph: /<vasecenabezdph>(.*?)<\/vasecenabezdph>/i,
      vasecenasdph: /<vasecenasdph>(.*?)<\/vasecenasdph>/i,
      dostupnost: /<dostupnost>(.*?)<\/dostupnost>/i,
      eubezdph: /<eubezdph>(.*?)<\/eubezdph>/i,
      eusdph: /<eusdph>(.*?)<\/eusdph>/i,
      remabezdph: /<remabezdph>(.*?)<\/remabezdph>/i,
      remadph: /<remadph>(.*?)<\/remadph>/i
    };
    
    const processStartTime = Date.now();
    
    // Zpracování po dávkách - optimalizovaná verze
    for (let i = 0; i < productMatches.length; i += BATCH_SIZE) {
      const batchStart = i;
      const batchEnd = Math.min(i + BATCH_SIZE, productMatches.length);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(productMatches.length / BATCH_SIZE);
      
      console.log(`[Import ${importId}] Processing batch ${batchNumber} of ${totalBatches} (${batchStart}-${batchEnd-1})`);
      
      // Zpracování jednotlivých produktů v dávce s optimalizovaným parsováním
      const batchProducts = [];
      
      for (let j = batchStart; j < batchEnd; j++) {
        try {
          const productXml = productMatches[j];
          
          // Extrakce dat produktu s použitím předkompilovaných regexů
          const extractValue = (tagName) => {
            const regex = tagRegexes[tagName] || new RegExp(`<${tagName}>(.*?)<\\/${tagName}>`, "i");
            const match = productXml.match(regex);
            return match ? match[1].trim() : "";
          };
          
          const kod = extractValue("kod");
          
          // Přeskočíme produkty bez kódu
          if (!kod) {
            errors.push(`Produkt na pozici ${j + 1} nemá kód`);
            continue;
          }
          
          const product = {
            kod,
            ean: extractValue("ean"),
            nazev: cleanText(extractValue("nazev")),
            cena_bez_dph: parseFloat(extractValue("vasecenabezdph")) || 0,
            cena_s_dph: parseFloat(extractValue("vasecenasdph")) || 0,
            dostupnost: parseInt(extractValue("dostupnost")) || 0,
            eu_bez_dph: parseFloat(extractValue("eubezdph")) || 0,
            eu_s_dph: parseFloat(extractValue("eusdph")) || 0,
            source: "xml_cenik"
          };
          
          // Volitelné pole s ošetřením null
          const remaBezDph = extractValue("remabezdph");
          if (remaBezDph) product.rema_bez_dph = parseFloat(remaBezDph);
          
          const remaDph = extractValue("remadph");
          if (remaDph) product.rema_dph = parseFloat(remaDph);
          
          batchProducts.push(product);
        } catch (error) {
          console.error(`Error parsing product at position ${j + 1}:`, error);
          if (errors.length < MAX_ERRORS) {
            errors.push(`Chyba při zpracování produktu na pozici ${j + 1}: ${error.message}`);
          }
        }
      }
      
      // Efektivnější přidání všech produktů najednou
      allProducts.push(...batchProducts);
      
      // Aktualizace stavu importu
      const processedProducts = allProducts.length;
      const progress = Math.min(95, (processedProducts / totalProducts) * 90); // Max 95% pro fázi zpracování
      
      updateImportStatus(env, importId, {
        progress,
        processedProducts,
        errorCount: errors.length,
        errors: errors.slice(0, MAX_ERRORS) // Omezení počtu chyb kvůli velikosti
      });
      
      // Pauza mezi dávkami, aby se uvolnil event loop (v případě velkého XML)
      await new Promise(resolve => setTimeout(resolve, PROCESS_DELAY));
    }
    
    const processEndTime = Date.now();
    console.log(`[Import ${importId}] Processed ${allProducts.length} products in ${processEndTime - processStartTime}ms`);
    
    // Fáze 3: Uložení produktů do KV Storage - dávkově
    console.log(`[Import ${importId}] Storing ${allProducts.length} products in KV Storage`);
    
    updateImportStatus(env, importId, {
      status: 'storing',
      progress: 95
    });
    
    const storeStartTime = Date.now();
    
    // Efektivnější ukládání ve větších dávkách
    const storeResult = await storeProductsFromSource(env, allProducts, "xml_cenik", null, true);
    
    const storeEndTime = Date.now();
    console.log(`[Import ${importId}] Stored products in ${storeEndTime - storeStartTime}ms`);
    
    // Fáze 4: Dokončení importu
    console.log(`[Import ${importId}] Import completed successfully in ${Date.now() - extractStartTime}ms total`);
    
    updateImportStatus(env, importId, {
      status: 'completed',
      progress: 100,
      endTime: Date.now(),
      errorCount: errors.length,
      errors: errors.slice(0, MAX_ERRORS),
      storedCount: storeResult.count
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
    
    throw error; // Re-throw pro zpracování volajícím
  }
}

/**
 * Čistí text od CDATA a HTML tagů - optimalizovaná verze
 * @param {string} text - Text k vyčištění
 * @returns {string} Vyčištěný text
 */
function cleanText(text) {
  if (!text) return "";
  
  // Nejprve zkontrolujeme, zda text obsahuje CDATA nebo HTML tagy
  if (text.includes('CDATA') || text.includes('<')) {
    // Pouze když je potřeba, provedeme nahrazení
    text = text.replace(/\<\!\[CDATA\[(.*?)\]\]\>/, "$1")
               .replace(/<[^>]*>/g, "");
  }
  
  return text.trim();
}

/**
 * Aktualizuje stav importu s optimalizací pro snížení počtu zápisů do KV
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} importId - ID importu
 * @param {Object} updateData - Data k aktualizaci
 * @returns {Promise<void>}
 */
async function updateImportStatus(env, importId, updateData) {
  try {
    // Získání aktuálního stavu z paměti
    const currentStatus = activeImports.get(importId) || {};
    
    // Aktualizace stavu
    const updatedStatus = {
      ...currentStatus,
      ...updateData,
      lastUpdated: Date.now()
    };
    
    // Uložení do paměti
    activeImports.set(importId, updatedStatus);
    
    // Omezení počtu zápisů do KV - provádíme zápis pouze pokud:
    // 1. Uplynula dostatečná doba od posledního zápisu (min 2 sekundy)
    // 2. Změnil se status nebo progress skočil o více než 5%
    // 3. Vždy zapíšeme při dokončení nebo chybě
    const shouldWrite = 
      !currentStatus.lastKVUpdate || 
      (updatedStatus.lastUpdated - (currentStatus.lastKVUpdate || 0) > 2000) ||
      (currentStatus.status !== updatedStatus.status) ||
      (Math.abs((currentStatus.progress || 0) - (updatedStatus.progress || 0)) >= 5) ||
      ['completed', 'failed', 'cancelled'].includes(updatedStatus.status);
    
    if (shouldWrite) {
      // Uložení do KV storage
      await env.PRODUKTY.put(`import_status:${importId}`, JSON.stringify(updatedStatus));
      updatedStatus.lastKVUpdate = Date.now();
      activeImports.set(importId, updatedStatus);
    }
    
  } catch (error) {
    console.error(`Error updating import status for ${importId}:`, error);
  }
}

/**
 * Získá stav importu s optimalizací cachování
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
      const parsedStatus = JSON.parse(status);
      // Uložit do memory cache pro příští použití
      activeImports.set(importId, parsedStatus);
      return parsedStatus;
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
    // Seznam klíčů importů - v tomto případě hledáme ve KV Storage
    // Získání všech klíčů začínajících s "import_status:"
    const { keys } = await env.PRODUKTY.list({ prefix: 'import_status:' });
    
    // Paralelní načtení dat pro všechny importy
    const importPromises = keys.map(async (key) => {
      try {
        const statusData = await env.PRODUKTY.get(key.name);
        if (statusData) {
          const status = JSON.parse(statusData);
          // Přidání do memory cache
          activeImports.set(status.id, status);
          return status;
        }
        return null;
      } catch (error) {
        console.error(`Error loading import status for ${key.name}:`, error);
        return null;
      }
    });
    
    // Počkáme na všechny promise a odfiltrujeme null hodnoty
    const imports = (await Promise.all(importPromises)).filter(Boolean);
    
    // Seřazení podle času - nejnovější první
    return imports.sort((a, b) => b.startTime - a.startTime);
  } catch (error) {
    console.error('Error getting active imports:', error);
    
    // Záložní řešení - vrátíme alespoň ty, které jsou v paměti
    const memoryImports = Array.from(activeImports.values());
    return memoryImports.sort((a, b) => b.startTime - a.startTime);
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
    if (['completed', 'failed', 'cancelled'].includes(status.status)) {
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

/**
 * Vyčistí staré záznamy o importech
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {number} maxAgeHours - Maximální stáří v hodinách (výchozí 48)
 * @returns {Promise<{removed: number}>} Počet odstraněných záznamů
 */
export async function cleanupOldImports(env, maxAgeHours = 48) {
  try {
    // Najít všechny importy
    const { keys } = await env.PRODUKTY.list({ prefix: 'import_status:' });
    
    // Aktuální čas minus max stáří v ms
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    let removedCount = 0;
    
    // Pro každý klíč kontrolujeme stáří
    for (const key of keys) {
      try {
        const statusJson = await env.PRODUKTY.get(key.name);
        if (statusJson) {
          const status = JSON.parse(statusJson);
          
          // Kontrola stáří podle startTime nebo lastUpdated
          const importTime = status.endTime || status.lastUpdated || status.startTime;
          
          // Odstranění starých dokončených, zrušených nebo chybových importů
          if (importTime < cutoffTime && 
              ['completed', 'failed', 'cancelled'].includes(status.status)) {
            await env.PRODUKTY.delete(key.name);
            removedCount++;
            
            // Odstranění z memory cache
            if (status.id && activeImports.has(status.id)) {
              activeImports.delete(status.id);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing import key ${key.name}:`, error);
      }
    }
    
    console.log(`Cleaned up ${removedCount} old import records`);
    return { removed: removedCount };
  } catch (error) {
    console.error('Error cleaning up old imports:', error);
    throw new Error(`Chyba při čištění starých importů: ${error.message}`);
  }
}
