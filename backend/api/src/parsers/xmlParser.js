// backend/api/src/parsers/xmlParser.js
// Optimalizovaný parser pro XML produktové feedy

/**
 * Parsuje XML feed s ceníkem produktů
 * @param {string} xmlText - XML text z feedu ceníků
 * @returns {Array} Seznam produktů
 */
export function parseXmlCenikProducts(xmlText) {
  try {
    // Pro lepší výkon použijeme jeden komplexnější regex místo několika jednodušších
    const products = [];
    const productRegex = /<product>([\s\S]*?)<\/product>/g;
    
    // Předkompilujeme regex pro extrakci hodnot
    const extractRegex = (tag) => new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "i");
    
    // Cache pro často používané regex
    const tagRegexCache = {
      kod: extractRegex("kod"),
      ean: extractRegex("ean"),
      nazev: extractRegex("nazev"),
      vasecenabezdph: extractRegex("vasecenabezdph"),
      vasecenasdph: extractRegex("vasecenasdph"),
      dostupnost: extractRegex("dostupnost"),
      eubezdph: extractRegex("eubezdph"),
      eusdph: extractRegex("eusdph"),
      remabezdph: extractRegex("remabezdph"),
      remadph: extractRegex("remadph")
    };
    
    let match;
    while ((match = productRegex.exec(xmlText)) !== null) {
      const productContent = match[1];
      
      // Extrakce dat z produktu s použitím cache
      const extractValue = (tag) => {
        const regex = tagRegexCache[tag] || extractRegex(tag);
        const match = productContent.match(regex);
        return match ? match[1].trim() : "";
      };
      
      const kod = extractValue("kod");
      
      // Přeskočíme produkty bez kódu
      if (!kod) continue;
      
      // Získání všech hodnot najednou
      const ean = extractValue("ean");
      const nazev = cleanText(extractValue("nazev"));
      
      // Převod číselných hodnot s ošetřením null/undefined
      const parseNumberValue = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      };
      
      const cenaBezDph = parseNumberValue(extractValue("vasecenabezdph"));
      const cenaSDph = parseNumberValue(extractValue("vasecenasdph"));
      const dostupnost = parseInt(extractValue("dostupnost")) || 0;
      const euBezDph = parseNumberValue(extractValue("eubezdph"));
      const eusDph = parseNumberValue(extractValue("eusdph"));
      
      // Volitelné hodnoty
      const remaBezDph = extractValue("remabezdph");
      const remaDph = extractValue("remadph");
      
      products.push({
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
      });
    }
    
    return products;
  } catch (error) {
    console.error("Error parsing XML ceník:", error);
    throw new Error("Neplatný XML formát ceníku");
  }
}

/**
 * Parsuje XML feed s popisky produktů - optimalizovaná verze
 * @param {string} xmlText - XML text z feedu popisků
 * @returns {Array} Seznam produktů s popisky
 */
export function parseXmlPopiskyProducts(xmlText) {
  try {
    const products = [];
    const productRegex = /<product>([\s\S]*?)<\/product>/g;
    
    // Předkompilované regex pro nejčastější tagy
    const tagRegexCache = {
      kod: /<kod>(.*?)<\/kod>/i,
      ean: /<ean>(.*?)<\/ean>/i,
      nazev: /<nazev>(.*?)<\/nazev>/i,
      kategorie: /<kategorie>(.*?)<\/kategorie>/i,
      vyrobce: /<vyrobce>(.*?)<\/vyrobce>/i,
      dodani: /<dodani>(.*?)<\/dodani>/i,
      minodber: /<minodber>(.*?)<\/minodber>/i,
      jednotka: /<jednotka>(.*?)<\/jednotka>/i,
      kratkypopis: /<kratkypopis>(.*?)<\/kratkypopis>/i,
      popis: /<popis>(.*?)<\/popis>/i,
      obrazek: /<obrazek>(.*?)<\/obrazek>/i
    };
    
    let match;
    while ((match = productRegex.exec(xmlText)) !== null) {
      const productContent = match[1];
      
      // Extrakce hodnoty s použitím předkompilovaného regexu
      const extractValue = (tag) => {
        const regex = tagRegexCache[tag] || new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "i");
        const match = productContent.match(regex);
        return match ? match[1].trim() : "";
      };
      
      const kod = extractValue("kod");
      
      // Přeskočíme produkty bez kódu
      if (!kod) continue;
      
      // Extrakce základních dat
      const product = {
        kod,
        ean: extractValue("ean"),
        nazev: cleanText(extractValue("nazev")),
        kategorie: cleanText(extractValue("kategorie")),
        vyrobce: cleanText(extractValue("vyrobce")),
        dodani: extractValue("dodani"),
        minodber: extractValue("minodber"),
        jednotka: extractValue("jednotka"),
        kratky_popis: cleanText(extractValue("kratkypopis")),
        popis: cleanText(extractValue("popis")),
        source: "xml_popisky"
      };
      
      // Získání URL obrázku - optimalizováno
      let obrazek = extractValue("obrazek");
      if (!obrazek) {
        // Pokus najít obrazek s id="1" pokud existuje
        const obrazekWithIdRegex = /<obrazek id="1">(.*?)<\/obrazek>/;
        const obrazekMatch = productContent.match(obrazekWithIdRegex);
        if (obrazekMatch) {
          obrazek = obrazekMatch[1];
        }
      }
      product.obrazek = obrazek;
      
      // Extrakce parametrů a dokumentů - optimalizováno
      product.parametry = extractParametersFromXml(productContent);
      product.dokumenty = extractDocumentsFromXml(productContent);
      
      products.push(product);
    }
    
    return products;
  } catch (error) {
    console.error("Error parsing XML popisky:", error);
    throw new Error("Neplatný XML formát popisků");
  }
}

/**
 * Extrahuje parametry z XML - optimalizovaná verze
 * @param {string} productContent - XML obsah produktu
 * @returns {string} Textová reprezentace parametrů
 */
function extractParametersFromXml(productContent) {
  // Využití vícenásobného zachycení v regexu pro lepší výkon
  const paramRegex = /<parametr>[\s\S]*?<nazev>(.*?)<\/nazev>[\s\S]*?<hodnota>(.*?)<\/hodnota>[\s\S]*?<\/parametr>/g;
  
  let parametryText = "";
  let match;
  
  while ((match = paramRegex.exec(productContent)) !== null) {
    const paramNazev = match[1].trim();
    const paramHodnota = match[2].trim();
    
    if (paramNazev && paramHodnota) {
      parametryText += `${paramNazev}: ${paramHodnota}\n`;
    }
  }
  
  return parametryText;
}

/**
 * Extrahuje dokumenty z XML - optimalizovaná verze
 * @param {string} productContent - XML obsah produktu
 * @returns {string} Textová reprezentace dokumentů
 */
function extractDocumentsFromXml(productContent) {
  // Sestavení řetězce v jednom průchodu
  const documents = [];
  
  // Datasheets
  const datasheetRegex = /<datasheet id="[^"]*">(.*?)<\/datasheet>/g;
  let match;
  while ((match = datasheetRegex.exec(productContent)) !== null) {
    documents.push(`Datasheet: ${match[1]}`);
  }
  
  // Manuals
  const manualRegex = /<manual id="[^"]*">(.*?)<\/manual>/g;
  while ((match = manualRegex.exec(productContent)) !== null) {
    documents.push(`Manual: ${match[1]}`);
  }
  
  return documents.length > 0 ? documents.join("\n") : "";
}

/**
 * Čistí text od CDATA a HTML tagů - optimalizováno
 * @param {string} text - Text k vyčištění
 * @returns {string} Vyčištěný text
 */
function cleanText(text) {
  if (!text) return "";
  
  // Použití jednoho regexu pro odstranění CDATA
  text = text.replace(/\<\!\[CDATA\[(.*?)\]\]\>/, "$1");
  
  // Odstranění HTML tagů v jednom kroku
  return text.replace(/<[^>]*>/g, "").trim();
}

// Optimalizované parsování Excel souborů
/**
 * Parsuje Excel soubor produktů
 * @param {ArrayBuffer} buffer - Data souboru Excel
 * @returns {Promise<Array>} Seznam produktů
 */
export async function parseExcelProducts(buffer) {
  try {
    // Importovat xlsx knihovnu pouze když je potřeba (lazy loading)
    const XLSX = await import('xlsx');
    
    // Načtení Excel souboru s optimalizovaným nastavením
    const workbook = XLSX.read(new Uint8Array(buffer), { 
      type: 'array',
      cellDates: true,  // Správné formátování dat
      cellNF: false,    // Neukládat formát čísel pro úsporu paměti
      cellText: false   // Neukládat originální text buněk pro úsporu paměti
    });
    
    // Získání prvního listu
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Převod na JSON s definovanými hlavičkami pro rychlejší zpracování
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',  // Výchozí hodnota pro prázdné buňky
      raw: false   // Parsování hodnot podle typu buňky
    });
    
    // Předem definovaná mapování názvů sloupců pro zrychlení přístupu
    const columnMappings = {
      kod: ['Kód', 'kod'],
      ean: ['EAN', 'ean'],
      nazev: ['Název', 'nazev'],
      cena_bez_dph: ['Cena bez DPH', 'cena_bez_dph'],
      cena_s_dph: ['Cena s DPH', 'cena_s_dph'],
      dostupnost: ['Dostupnost', 'dostupnost'],
      kategorie: ['Kategorie', 'kategorie'],
      vyrobce: ['Výrobce', 'vyrobce'],
      dodani: ['Dodání', 'dodani'],
      minodber: ['Min. odběr', 'minodber'],
      jednotka: ['Jednotka', 'jednotka'],
      popis: ['Popis', 'popis'],
      kratky_popis: ['Krátký popis', 'kratky_popis'],
      obrazek: ['Obrázek', 'obrazek'],
      parametry: ['Parametry', 'parametry'],
      dokumenty: ['Dokumenty', 'dokumenty']
    };
    
    // Optimalizované mapování dat s předem definovanými sloupci
    return jsonData
      .map(row => {
        const product = { source: "excel" };
        
        // Mapování hodnot s optimalizovaným přístupem
        Object.entries(columnMappings).forEach(([key, possibleColumns]) => {
          let value = null;
          
          // Najít první existující hodnotu podle možných názvů sloupců
          for (const column of possibleColumns) {
            if (row[column] !== undefined) {
              value = row[column];
              break;
            }
          }
          
          // Zpracování podle typu pole
          if (value !== null) {
            if (['cena_bez_dph', 'cena_s_dph'].includes(key)) {
              product[key] = parseNumericValue(value);
            } else if (key === 'dostupnost') {
              product[key] = parseInt(String(value || '0'));
            } else {
              product[key] = String(value || '');
            }
          }
        });
        
        return product;
      })
      .filter(product => product.kod); // Filtrovat produkty bez kódu
  } catch (error) {
    console.error('Error parsing Excel:', error);
    throw new Error(`Chyba při zpracování Excel souboru: ${error.message}`);
  }
}

/**
 * Pomocná funkce pro zpracování numerických hodnot
 * @param {*} value - Hodnota k převodu
 * @returns {number} Číselná hodnota nebo 0
 */
function parseNumericValue(value) {
  if (value === undefined || value === null) return 0;
  
  // Pokud je to číslo, vrátíme ho přímo
  if (typeof value === 'number') return value;
  
  // Převod na string a úprava formátu
  const strValue = String(value).replace(/\s+/g, '').replace(',', '.');
  
  // Pokus o převod na číslo
  const numValue = parseFloat(strValue);
  return isNaN(numValue) ? 0 : numValue;
}
