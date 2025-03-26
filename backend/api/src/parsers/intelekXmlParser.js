// backend/api/src/parsers/intelekXmlParser.js
// Parser pro import produktů z XML feedu Intelek.cz

/**
 * Parsuje XML feed z Intelek.cz
 * @param {string} xmlText - XML text z feedu Intelek.cz
 * @returns {Array} Seznam produktů
 */
export function parseIntelekXmlProducts(xmlText) {
  try {
    console.log("Začátek parsování Intelek XML");
    // Pro lepší výkon použijeme regulární výrazy místo DOM parsování
    const products = [];
    const productRegex = /<product>([\s\S]*?)<\/product>/g;
    
    // Předkompilujeme regex pro extrakci hodnot
    const extractRegex = (tag) => new RegExp(`<${tag}>(.*?)<\\/${tag}>`, "i");
    const extractCDATA = (tag) => new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]><\\/${tag}>`, "i");
    
    // Cache pro často používané regex
    const tagRegexCache = {
      kod: extractRegex("kod"),
      ean: extractRegex("ean"),
      dostupnost: extractRegex("dostupnost"),
      eubezbph: extractRegex("eubezbph"),
      eusdph: extractRegex("eusdph"),
      vasecenabezdph: extractRegex("vasecenabezdph"),
      vasecenasdph: extractRegex("vasecenasdph"),
      remabezdph: extractRegex("remabezdph"),
      remadph: extractRegex("remadph")
    };
    
    // Speciální cache pro CDATA elementy
    const cdataRegexCache = {
      nazev: extractCDATA("nazev")
    };
    
    let match;
    let productCount = 0;
    while ((match = productRegex.exec(xmlText)) !== null) {
      productCount++;
      const productContent = match[1];
      
      // Extrakce dat z produktu s použitím cache
      const extractValue = (tag) => {
        const regex = tagRegexCache[tag] || extractRegex(tag);
        const match = productContent.match(regex);
        return match ? match[1].trim() : "";
      };
      
      // Extrakce CDATA hodnot (např. pro název)
      const extractCDATAValue = (tag) => {
        // Nejprve zkusíme CDATA verzi
        const cdataRegex = cdataRegexCache[tag] || extractCDATA(tag);
        let match = productContent.match(cdataRegex);
        
        if (match) {
          return match[1].trim();
        } else {
          // Pokud není CDATA, zkusíme normální tag
          const normalRegex = tagRegexCache[tag] || extractRegex(tag);
          match = productContent.match(normalRegex);
          return match ? match[1].trim() : "";
        }
      };
      
      const kod = extractValue("kod");
      
      // Přeskočíme produkty bez kódu
      if (!kod) continue;
      
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
        source: "intelek_xml"
      };
      
      // Přidání volitelných hodnot pouze pokud existují
      if (remaBezDph) {
        product.rema_bez_dph = parseNumberValue(remaBezDph);
      }
      
      if (remaDph) {
        product.rema_dph = parseNumberValue(remaDph);
      }
      
      // Přidání doplňkových informací
      product.kategorie = "Konektory a síťové prvky"; // Výchozí kategorie, ideálně by se měla získávat z kontextu
      product.vyrobce = extractManufacturer(nazev);
      
      // Přidání produktu do výsledků
      products.push(product);
    }
    
    console.log(`Dokončeno parsování Intelek XML. Zpracováno ${productCount} produktů, validních: ${products.length}`);
    
    return products;
  } catch (error) {
    console.error("Error parsing Intelek XML:", error);
    throw new Error(`Chyba při parsování XML feedu Intelek: ${error.message}`);
  }
}

/**
 * Pokus o extrakci výrobce z názvu produktu
 * @param {string} nazev - Název produktu
 * @returns {string} Výrobce nebo prázdný řetězec
 */
function extractManufacturer(nazev) {
  // Seznam známých výrobců, které lze detekovat v názvu
  const knownManufacturers = [
    'Intelek', 'TP-Link', 'D-Link', 'Cisco', 'HP', 'Dell', 'Lenovo', 'Zyxel',
    'Mikrotik', 'Ubiquiti', 'Netgear', 'Asus', 'Allied Telesis', 'Fortinet', 'Huawei'
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
  return "Intelek"; // Výchozí výrobce
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
 * Stahuje a parsuje XML data z Intelek.cz
 * @param {string} url - URL pro stažení dat (volitelné, jinak se použije výchozí URL)
 * @returns {Promise<Array>} Seznam produktů
 */
export async function fetchAndParseIntelekXml(url = null) {
  try {
    // Použití výchozí URL nebo zadané URL
    const targetUrl = url || prepareIntelekXmlUrl();
    
    console.log(`Stahování XML dat z URL: ${targetUrl}`);
    
    // Stažení XML dat
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    console.log(`Staženo ${xmlText.length} bytů XML dat`);
    
    // Parsování XML
    const products = parseIntelekXmlProducts(xmlText);
    
    return products;
  } catch (error) {
    console.error("Error fetching and parsing Intelek XML:", error);
    throw new Error(`Chyba při stahování nebo parsování XML feedu Intelek: ${error.message}`);
  }
}
