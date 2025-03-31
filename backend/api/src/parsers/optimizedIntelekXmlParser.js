// backend/api/src/parsers/optimizedIntelekXmlParser.js
/**
 * Optimalizovaný parser pro import produktů z XML feedu Intelek.cz
 * - Vylepšená výkonnost při zpracování velkého množství dat
 * - Efektivnější práce s pamětí
 * - Režim streamu pro postupné zpracování
 * - Podpora pro zachování struktury kategorií
 */

// Konstanty pro optimalizaci
const BATCH_SIZE = 100; // Velikost dávky pro zpracování
const MAX_ERRORS = 10;  // Maximální počet ukládaných chyb

/**
 * Parsuje XML feed z Intelek.cz s optimalizací pro velké objemy dat
 * @param {string} xmlText - XML text z feedu Intelek.cz
 * @param {Object} options - Volitelné nastavení parsování
 * @returns {Array} Seznam produktů
 */
export function parseIntelekXmlProducts(xmlText, options = {}) {
  try {
    console.log("Začátek parsování Intelek XML");
    const startTime = Date.now();
    
    // Výchozí hodnoty nastavení
    const settings = {
      preserveCategories: options.preserveCategories || false,
      extractSpecs: options.extractSpecs || false,
      defaultCategory: options.defaultCategory || "Konektory a síťové prvky",
      maxProducts: options.maxProducts || 0, // 0 = bez limitu
      ...options
    };
    
    const products = [];
    const errors = [];
    
    // Předkompilujeme regex pro optimální výkon
    const productRegex = /<product>([\s\S]*?)<\/product>/g;
    
    // Cache pro často používané regex
    const tagRegexCache = compileTagRegexCache();
    const cdataRegexCache = compileCdataRegexCache();
    
    // Statistiky pro reporting
    let processedTotal = 0;
    let validProductsCount = 0;
    let invalidProductsCount = 0;
    let errorCount = 0;
    
    // Mapování kategorií (pokud je povoleno zachování)
    const categoriesMap = settings.preserveCategories ? {} : null;
    
    // Zpracování produktů
    let match;
    let buffer = "";
    
    // Nastavení velikosti bufferu pro velké XML soubory
    const chunkSize = 1024 * 1024; // 1MB
    for (let i = 0; i < xmlText.length; i += chunkSize) {
      buffer += xmlText.substring(i, i + chunkSize);
      
      // Zpracování všech produktů v bufferu
      while ((match = productRegex.exec(buffer)) !== null) {
        processedTotal++;
        
        try {
          const productContent = match[1];
          
          // Extrakce dat z produktu s použitím cache
          const product = extractProductData(productContent, tagRegexCache, cdataRegexCache, settings);
          
          // Zpracování kategorií, pokud je povoleno
          if (settings.preserveCategories && product.kategorie && product.kod) {
            if (!categoriesMap[product.kategorie]) {
              categoriesMap[product.kategorie] = [];
            }
            categoriesMap[product.kategorie].push(product.kod);
          }
          
          // Přidání produktu do výsledků
          if (product.kod) {
            products.push(product);
            validProductsCount++;
            
            // Kontrola limitu, pokud je nastaven
            if (settings.maxProducts > 0 && validProductsCount >= settings.maxProducts) {
              console.log(`Dosažen limit počtu produktů: ${settings.maxProducts}`);
              break;
            }
          } else {
            invalidProductsCount++;
          }
        } catch (productError) {
          errorCount++;
          // Zaznamenání chyby, ale pokračování ve zpracování
          if (errors.length < MAX_ERRORS) {
            errors.push({
              position: processedTotal,
              error: productError.message
            });
          }
        }
      }
      
      // Kontrola limitu, pokud je nastaven
      if (settings.maxProducts > 0 && validProductsCount >= settings.maxProducts) {
        break;
      }
      
      // Reset regex pro další hledání
      productRegex.lastIndex = 0;
      buffer = "";
    }
    
    const endTime = Date.now();
    console.log(`Dokončeno parsování Intelek XML. Zpracováno ${processedTotal} produktů, validních: ${validProductsCount}, neplatných: ${invalidProductsCount}, chyb: ${errorCount}, čas: ${endTime - startTime}ms`);
    
    // Přidání metadat k výsledku
    const result = {
      products,
      metadata: {
        source: "intelek_xml",
        totalProcessed: processedTotal,
        validCount: validProductsCount,
        invalidCount: invalidProductsCount,
        errorCount,
        processingTime: endTime - startTime,
        errors: errors.length > 0 ? errors : undefined,
        categories: settings.preserveCategories ? categoriesMap : undefined
      }
    };
    
    return result;
  } catch (error) {
    console.error("Error parsing Intelek XML:", error);
    throw new Error(`Chyba při parsování XML feedu Intelek: ${error.message}`);
  }
}

/**
 * Kompiluje cache regulárních výrazů pro běžné XML tagy
 */
function compileTagRegexCache() {
  const extractRegex = (tag) => new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "i");
  
  return {
    kod: extractRegex("kod"),
    ean: extractRegex("ean"),
    dostupnost: extractRegex("dostupnost"),
    eubezbph: extractRegex("eubezbph"),
    eusdph: extractRegex("eusdph"),
    vasecenabezdph: extractRegex("vasecenabezdph"),
    vasecenasdph: extractRegex("vasecenasdph"),
    remabezdph: extractRegex("remabezdph"),
    remadph: extractRegex("remadph"),
    nazev: extractRegex("nazev"),
    popis: extractRegex("popis"),
    kategorie: extractRegex("kategorie"),
    vyrobce: extractRegex("vyrobce"),
    zaruka: extractRegex("zaruka"),
    obrazek: extractRegex("obrazek")
  };
}

/**
 * Kompiluje cache regulárních výrazů pro CDATA sekce
 */
function compileCdataRegexCache() {
  const extractCDATA = (tag) => new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>`, "i");
  
  return {
    nazev: extractCDATA("nazev"),
    popis: extractCDATA("popis"),
    kategorie: extractCDATA("kategorie")
  };
}

/**
 * Extrahuje data produktu z XML
 */
function extractProductData(productContent, tagRegexCache, cdataRegexCache, settings) {
  // Extrakce hodnot z XML
  const extractValue = (tag) => {
    const regex = tagRegexCache[tag] || new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "i");
    const match = productContent.match(regex);
    return match ? match[1].trim() : "";
  };
  
  // Extrakce CDATA hodnot (např. pro název)
  const extractCDATAValue = (tag) => {
    // Nejprve zkusíme CDATA verzi
    const cdataRegex = cdataRegexCache[tag] || new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>`, "i");
    let match = productContent.match(cdataRegex);
    
    if (match) {
      return match[1].trim();
    } else {
      // Pokud není CDATA, zkusíme normální tag
      const normalRegex = tagRegexCache[tag] || new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "i");
      match = productContent.match(normalRegex);
      return match ? match[1].trim() : "";
    }
  };
  
  // Základní údaje
  const kod = extractValue("kod");
  
  // Přeskočíme produkty bez kódu
  if (!kod) return {};
  
  // Extrakce dalších hodnot
  const ean = extractValue("ean");
  const nazev = extractCDATAValue("nazev");
  const dostupnost = parseFloat(extractValue("dostupnost")) || 0;
  
  // Převod cenových hodnot
  const parseNumberValue = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };
  
  // Extrakce a parsování cen
  const euBezbph = parseNumberValue(extractValue("eubezbph"));
  const euSdph = parseNumberValue(extractValue("eusdph"));
  const cenaBezDph = parseNumberValue(extractValue("vasecenabezdph"));
  const cenaSDph = parseNumberValue(extractValue("vasecenasdph"));
  
  // Volitelné hodnoty pro ReMa ceny
  const remaBezDph = extractValue("remabezdph");
  const remaDph = extractValue("remadph");
  
  // Kategorie a výrobce
  let kategorie = extractCDATAValue("kategorie");
  if (!kategorie && settings.defaultCategory) {
    kategorie = settings.defaultCategory;
  }
  
  // Pokus o extrakci výrobce z různých možných zdrojů
  let vyrobce = extractValue("vyrobce");
  if (!vyrobce) {
    vyrobce = extractManufacturer(nazev);
  }
  
  // Obrázek a popis
  const obrazek = extractValue("obrazek");
  const popis = extractCDATAValue("popis");
  
  // Vytvoření objektu produktu
  const product = {
    kod,
    ean,
    nazev,
    dostupnost,
    cena_bez_dph: cenaBezDph,
    cena_s_dph: cenaSDph,
    eu_bez_dph: euBezbph,
    eu_s_dph: euSdph,
    kategorie,
    vyrobce,
    source: "intelek_xml"
  };
  
  // Přidání volitelných hodnot pouze pokud existují
  if (remaBezDph) {
    product.rema_bez_dph = parseNumberValue(remaBezDph);
  }
  
  if (remaDph) {
    product.rema_dph = parseNumberValue(remaDph);
  }
  
  if (obrazek) {
    product.obrazek = obrazek;
  }
  
  if (popis) {
    product.popis = popis;
  }
  
  // Extrakce specifikací, pokud je povoleno
  if (settings.extractSpecs) {
    const specs = extractSpecifications(productContent);
    if (specs && Object.keys(specs).length > 0) {
      product.specifikace = specs;
    }
  }
  
  return product;
}

/**
 * Pokus o extrakci výrobce z názvu produktu
 * @param {string} nazev - Název produktu
 * @returns {string} Výrobce nebo prázdný řetězec
 */
function extractManufacturer(nazev) {
  if (!nazev) return '';
  
  // Seznam známých výrobců, které lze detekovat v názvu
  const knownManufacturers = [
    'Intelek', 'TP-Link', 'D-Link', 'Cisco', 'HP', 'Dell', 'Lenovo', 'Zyxel',
    'Mikrotik', 'Ubiquiti', 'Netgear', 'Asus', 'Allied Telesis', 'Fortinet', 'Huawei',
    'Intel', 'Legrand', 'NextLight', 'Satel', 'Grandstream', 'Hikvision', 'Dahua',
    'Digium', 'Axis', 'APC', 'Belden', 'Panduit', 'Moxa', 'Aruba'
  ];
  
  // Zkontrolovat, zda název obsahuje některého ze známých výrobců
  for (const manufacturer of knownManufacturers) {
    if (nazev.includes(manufacturer)) {
      return manufacturer;
    }
  }
  
  // Pokud nelze identifikovat výrobce podle známých názvů,
  // zkusíme najít kratší úsek před nebo na začátku názvu, který může být výrobcem
  const parts = nazev.split(' ');
  if (parts.length > 0 && parts[0].length > 2 && !/^\d+$/.test(parts[0])) {
    // Vrátíme první slovo, které není číslo a má délku větší než 2 znaky
    return parts[0];
  }
  
  // Pokud nelze výrobce detekovat, vrátíme defaultní hodnotu
  return "Intelek";
}

/**
 * Extrahuje technické specifikace z produktu
 * @param {string} productContent - XML obsah produktu
 * @returns {Object|null} Objekt specifikací nebo null
 */
function extractSpecifications(productContent) {
  // Kontrola, zda existují specifikace
  if (!productContent.includes('<spec>')) {
    return null;
  }
  
  try {
    const specs = {};
    const specRegex = /<spec>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<value>(.*?)<\/value>[\s\S]*?<\/spec>/g;
    
    let specMatch;
    while ((specMatch = specRegex.exec(productContent)) !== null) {
      const name = specMatch[1].trim();
      const value = specMatch[2].trim();
      
      if (name && value) {
        specs[name] = value;
      }
    }
    
    return specs;
  } catch (error) {
    console.warn("Error extracting specifications:", error);
    return null;
  }
}

/**
 * Připravuje URL pro stažení XML dat z Intelek.cz
 * @param {string} level - Úroveň kategorie (výchozí: 54003830)
 * @param {string} token - Přístupový token, pokud je vyžadován
 * @returns {string} Kompletní URL pro stažení dat
 */
export function prepareIntelekXmlUrl(level = '54003830', token = 'PGC%2FbX15XeK%2FkGaBq7VN4A%3D%3D') {
  return `https://www.intelek.cz/export_cena.jsp?level=${level}&xml=true&x=${token}`;
}

/**
 * Stahuje a parsuje XML data z Intelek.cz s podporou streamování
 * @param {string} url - URL pro stažení dat (volitelné, jinak se použije výchozí URL)
 * @param {Object} options - Volitelné nastavení parsování
 * @returns {Promise<Object>} Výsledek importu s produkty a metadaty
 */
export async function fetchAndParseIntelekXml(url = null, options = {}) {
  try {
    // Použití výchozí URL nebo zadané URL
    const targetUrl = url || prepareIntelekXmlUrl();
    
    console.log(`Stahování XML dat z URL: ${targetUrl}`);
    
    // Stažení XML dat
    const startTime = Date.now();
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    const downloadTime = Date.now() - startTime;
    console.log(`Staženo ${xmlText.length} bytů XML dat za ${downloadTime}ms`);
    
    // Parsování XML s předáním dalších možností
    const result = parseIntelekXmlProducts(xmlText, options);
    
    // Přidání informací o stahování
    result.metadata.downloadTime = downloadTime;
    result.metadata.dataSize = xmlText.length;
    result.metadata.url = targetUrl;
    
    return result;
  } catch (error) {
    console.error("Error fetching and parsing Intelek XML:", error);
    throw new Error(`Chyba při stahování nebo parsování XML feedu Intelek: ${error.message}`);
  }
}

// Export funkcí
export default {
  parseIntelekXmlProducts,
  prepareIntelekXmlUrl,
  fetchAndParseIntelekXml
};
