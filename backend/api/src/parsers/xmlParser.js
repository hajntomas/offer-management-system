// backend/api/src/parsers/xmlParser.js
// Parser pro XML produktové feedy

/**
 * Parsuje XML feed s ceníkem produktů
 * @param {string} xmlText - XML text z feedu ceníků
 * @returns {Array} Seznam produktů
 */
export function parseXmlCenikProducts(xmlText) {
  try {
    // Hledání celých produktových elementů
    const productRegex = /<product>([\s\S]*?)<\/product>/g;
    const products = [];
    let match;
    
    while ((match = productRegex.exec(xmlText)) !== null) {
      const productContent = match[1];
      
      // Extrakce dat z produktu
      const kod = extractXmlValue(productContent, "kod");
      const ean = extractXmlValue(productContent, "ean");
      
      // Extrakce názvu a odstranění CDATA a HTML tagů
      const nazev = cleanText(extractXmlValue(productContent, "nazev"));
      
      // Extrakce cen a převod na čísla
      const cenaBezDph = parseFloat(extractXmlValue(productContent, "vasecenabezdph")) || 0;
      const cenaSDph = parseFloat(extractXmlValue(productContent, "vasecenasdph")) || 0;
      
      // Získání dostupnosti a převod na celé číslo
      const dostupnost = parseInt(extractXmlValue(productContent, "dostupnost")) || 0;
      
      // Další cenové údaje
      const euBezDph = parseFloat(extractXmlValue(productContent, "eubezdph")) || 0;
      const eusDph = parseFloat(extractXmlValue(productContent, "eusdph")) || 0;
      const remaBezDph = extractXmlValue(productContent, "remabezdph");
      const remaDph = extractXmlValue(productContent, "remadph");
      
      // Přidání do pole produktů
      if (kod) {
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
    }
    
    return products;
  } catch (error) {
    console.error("Error parsing XML ceník:", error);
    throw new Error("Neplatný XML formát ceníku");
  }
}

/**
 * Parsuje XML feed s popisky produktů
 * @param {string} xmlText - XML text z feedu popisků
 * @returns {Array} Seznam produktů s popisky
 */
export function parseXmlPopiskyProducts(xmlText) {
  try {
    // Hledání celých produktových elementů
    const productRegex = /<product>([\s\S]*?)<\/product>/g;
    const products = [];
    let match;
    
    while ((match = productRegex.exec(xmlText)) !== null) {
      const productContent = match[1];
      
      // Extrakce základních dat
      const kod = extractXmlValue(productContent, "kod");
      const ean = extractXmlValue(productContent, "ean");
      
      // Extrakce názvu a odstranění CDATA a HTML tagů
      const nazev = cleanText(extractXmlValue(productContent, "nazev"));
      
      // Extrakce dalších polí
      const kategorie = cleanText(extractXmlValue(productContent, "kategorie"));
      const vyrobce = cleanText(extractXmlValue(productContent, "vyrobce"));
      const dodani = extractXmlValue(productContent, "dodani");
      const minodber = extractXmlValue(productContent, "minodber");
      const jednotka = extractXmlValue(productContent, "jednotka");
      
      // Extrakce popisu a krátkého popisu
      const kratkyPopis = cleanText(extractXmlValue(productContent, "kratkypopis"));
      const popis = cleanText(extractXmlValue(productContent, "popis"));
      
      // Získání URL obrázku
      let obrazek = extractXmlValue(productContent, "obrazek");
      if (!obrazek) {
        // Pokus najít obrazek s id="1" pokud existuje
        const obrazekMatch = productContent.match(/<obrazek id="1">(.*?)<\/obrazek>/);
        if (obrazekMatch) {
          obrazek = obrazekMatch[1];
        }
      }
      
      // Extrakce parametrů
      const parametryText = extractParametersFromXml(productContent);
      
      // Extrakce dokumentů (datasheets, manuals)
      const dokumentyText = extractDocumentsFromXml(productContent);
      
      // Přidání do pole produktů
      if (kod) {
        products.push({
          kod,
          ean,
          nazev,
          kategorie,
          vyrobce,
          dodani,
          minodber,
          jednotka,
          popis,
          kratky_popis: kratkyPopis,
          obrazek,
          parametry: parametryText,
          dokumenty: dokumentyText,
          source: "xml_popisky"
        });
      }
    }
    
    return products;
  } catch (error) {
    console.error("Error parsing XML popisky:", error);
    throw new Error("Neplatný XML formát popisků");
  }
}

/**
 * Extrahuje hodnotu z XML tagu
 * @param {string} text - XML text
 * @param {string} tag - Název tagu
 * @returns {string} Hodnota tagu nebo prázdný řetězec
 */
function extractXmlValue(text, tag) {
  const regex = new RegExp("<" + tag + ">(.*?)<\\/" + tag + ">", "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

/**
 * Extrahuje parametry z XML
 * @param {string} productContent - XML obsah produktu
 * @returns {string} Textová reprezentace parametrů
 */
function extractParametersFromXml(productContent) {
  let parametryText = "";
  const paramRegex = /<parametr>([\s\S]*?)<\/parametr>/g;
  let paramMatch;
  
  while ((paramMatch = paramRegex.exec(productContent)) !== null) {
    const paramContent = paramMatch[1];
    const paramNazev = extractXmlValue(paramContent, "nazev");
    const paramHodnota = extractXmlValue(paramContent, "hodnota");
    
    if (paramNazev && paramHodnota) {
      parametryText += paramNazev + ": " + paramHodnota + "\n";
    }
  }
  
  return parametryText;
}

/**
 * Extrahuje dokumenty z XML
 * @param {string} productContent - XML obsah produktu
 * @returns {string} Textová reprezentace dokumentů
 */
function extractDocumentsFromXml(productContent) {
  let dokumentyText = "";
  
  // Datasheets
  const datasheetRegex = /<datasheet id="[^"]*">(.*?)<\/datasheet>/g;
  let datasheetMatch;
  while ((datasheetMatch = datasheetRegex.exec(productContent)) !== null) {
    dokumentyText += "Datasheet: " + datasheetMatch[1] + "\n";
  }
  
  // Manuals
  const manualRegex = /<manual id="[^"]*">(.*?)<\/manual>/g;
  let manualMatch;
  while ((manualMatch = manualRegex.exec(productContent)) !== null) {
    dokumentyText += "Manual: " + manualMatch[1] + "\n";
  }
  
  return dokumentyText;
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
  
  // Odstranění HTML tagů, zejména <sub> a </sub>
  text = text.replace(/<sub>(.*?)<\/sub>/gi, "$1"); // Speciálně pro <sub> tagy
  text = text.replace(/<[^>]*>/g, ""); // Odstranění všech ostatních HTML tagů
  
  return text;
}

// backend/api/src/parsers/excelParser.js
// Parser pro Excel soubory

/**
 * Parsuje Excel soubor produktů
 * @param {ArrayBuffer} buffer - Data souboru Excel
 * @returns {Array} Seznam produktů
 */
export async function parseExcelProducts(buffer) {
  try {
    // Importovat xlsx knihovnu pouze když je potřeba (lazy loading)
    const XLSX = await import('xlsx');
    
    // Načtení Excel souboru
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    
    // Získání prvního listu
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Převod na JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // Mapování dat na formát produktů
    return jsonData.map(row => {
      // Vytvoření produktu s kontrolou existence polí
      return {
        kod: String(row['Kód'] || row['kod'] || ''),
        ean: String(row['EAN'] || row['ean'] || ''),
        nazev: String(row['Název'] || row['nazev'] || ''),
        cena_bez_dph: parseNumericValue(row['Cena bez DPH'] || row['cena_bez_dph']),
        cena_s_dph: parseNumericValue(row['Cena s DPH'] || row['cena_s_dph']),
        dostupnost: parseInt(String(row['Dostupnost'] || row['dostupnost'] || '0')),
        kategorie: String(row['Kategorie'] || row['kategorie'] || ''),
        vyrobce: String(row['Výrobce'] || row['vyrobce'] || ''),
        dodani: String(row['Dodání'] || row['dodani'] || ''),
        minodber: String(row['Min. odběr'] || row['minodber'] || ''),
        jednotka: String(row['Jednotka'] || row['jednotka'] || ''),
        popis: String(row['Popis'] || row['popis'] || ''),
        kratky_popis: String(row['Krátký popis'] || row['kratky_popis'] || ''),
        obrazek: String(row['Obrázek'] || row['obrazek'] || ''),
        parametry: String(row['Parametry'] || row['parametry'] || ''),
        dokumenty: String(row['Dokumenty'] || row['dokumenty'] || ''),
        source: "excel"
      };
    }).filter(product => product.kod); // Filtrovat produkty bez kódu
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
