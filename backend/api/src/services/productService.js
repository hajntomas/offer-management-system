// backend/api/src/services/productService.js
// Service pro práci s produkty v KV Storage

/**
 * Uloží data produktů ze zdroje do KV Storage
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {Array} products - Seznam produktů k uložení
 * @param {string} source - Zdroj dat (xml_cenik, xml_popisky, excel)
 * @param {string} [filename] - Volitelný název souboru (pro Excel)
 * @returns {Promise<number>} Počet uložených produktů
 */
export async function storeProductsFromSource(env, products, source, filename = null) {
  try {
    // Získání aktuálních metadat o zdrojích
    const productSources = JSON.parse(await env.PRODUKTY.get('product_sources') || '{}');
    
    // Aktualizace metadat
    productSources.last_updated = new Date().toISOString();
    productSources[`last_import_${source}`] = new Date().toISOString();
    
    // Přidání do historie importů
    productSources.import_history = productSources.import_history || [];
    productSources.import_history.unshift({
      type: source,
      timestamp: new Date().toISOString(),
      products_count: products.length,
      filename: filename
    });
    
    // Omezení historie na posledních 20 importů
    if (productSources.import_history.length > 20) {
      productSources.import_history = productSources.import_history.slice(0, 20);
    }
    
    // Uložení metadat
    await env.PRODUKTY.put('product_sources', JSON.stringify(productSources));
    
    // Uložení produktů podle zdroje
    await env.PRODUKTY.put(`source_${source}`, JSON.stringify(products));
    
    // Automatické sloučení dat z různých zdrojů
    await mergeProductData(env);
    
    return products.length;
  } catch (error) {
    console.error(`Error storing products from ${source}:`, error);
    throw new Error(`Chyba při ukládání produktů ze zdroje ${source}: ${error.message}`);
  }
}

/**
 * Sloučí data ze všech zdrojů do jednoho produktového katalogu
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @returns {Promise<number>} Počet sloučených produktů
 */
export async function mergeProductData(env) {
  try {
    // Načtení produktů z jednotlivých zdrojů
    const cenikProducts = JSON.parse(await env.PRODUKTY.get('source_xml_cenik') || '[]');
    const popiskyProducts = JSON.parse(await env.PRODUKTY.get('source_xml_popisky') || '[]');
    const excelProducts = JSON.parse(await env.PRODUKTY.get('source_excel') || '[]');
    
    // Vytvoření map produktů podle kódu
    const productMap = new Map();
    
    // Nejprve zpracujeme data z ceníku (základ - ceny, dostupnost)
    cenikProducts.forEach(product => {
      if (!product.kod) return;
      productMap.set(product.kod, {
        ...product,
        merged_sources: ['xml_cenik']
      });
    });
    
    // Doplníme/aktualizujeme informace z popisků
    popiskyProducts.forEach(product => {
      if (!product.kod) return;
      
      if (productMap.has(product.kod)) {
        // Existující produkt - doplníme popisové údaje
        const existingProduct = productMap.get(product.kod);
        productMap.set(product.kod, {
          ...existingProduct,
          // Prioritně zachováme údaje z ceníku a doplníme ostatní z popisků
          kategorie: existingProduct.kategorie || product.kategorie,
          vyrobce: existingProduct.vyrobce || product.vyrobce,
          dodani: existingProduct.dodani || product.dodani,
          minodber: existingProduct.minodber || product.minodber,
          jednotka: existingProduct.jednotka || product.jednotka,
          popis: existingProduct.popis || product.popis,
          kratky_popis: existingProduct.kratky_popis || product.kratky_popis,
          obrazek: existingProduct.obrazek || product.obrazek,
          parametry: existingProduct.parametry || product.parametry,
          dokumenty: existingProduct.dokumenty || product.dokumenty,
          // Přidání zdroje
          merged_sources: [...existingProduct.merged_sources, 'xml_popisky']
        });
      } else {
        // Nový produkt - přidáme jen z popisků
        productMap.set(product.kod, {
          ...product,
          merged_sources: ['xml_popisky']
        });
      }
    });
    
    // Nakonec aplikujeme data z Excel souboru (priorita)
    excelProducts.forEach(product => {
      if (!product.kod) return;
      
      if (productMap.has(product.kod)) {
        // Existující produkt - přepíšeme Excel daty (nejvyšší priorita)
        const existingProduct = productMap.get(product.kod);
        productMap.set(product.kod, {
          ...existingProduct,
          // Zachováme pouze ID, jinak vše z Excelu přepíše data z XML
          nazev: product.nazev || existingProduct.nazev,
          ean: product.ean || existingProduct.ean,
          cena_bez_dph: product.cena_bez_dph || existingProduct.cena_bez_dph,
          cena_s_dph: product.cena_s_dph || existingProduct.cena_s_dph,
          dostupnost: typeof product.dostupnost === 'number' ? product.dostupnost : existingProduct.dostupnost,
          kategorie: product.kategorie || existingProduct.kategorie,
          vyrobce: product.vyrobce || existingProduct.vyrobce,
          dodani: product.dodani || existingProduct.dodani,
          minodber: product.minodber || existingProduct.minodber,
          jednotka: product.jednotka || existingProduct.jednotka,
          popis: product.popis || existingProduct.popis,
          kratky_popis: product.kratky_popis || existingProduct.kratky_popis,
          obrazek: product.obrazek || existingProduct.obrazek,
          parametry: product.parametry || existingProduct.parametry,
          dokumenty: product.dokumenty || existingProduct.dokumenty,
          // Přidání zdroje
          merged_sources: [...existingProduct.merged_sources, 'excel']
        });
      } else {
        // Nový produkt - přidáme jen z Excelu
        productMap.set(product.kod, {
          ...product,
          merged_sources: ['excel']
        });
      }
    });
    
    // Konvertovat Map na pole produktů
    const mergedProducts = Array.from(productMap.values());
    
    // Vytvořit zjednodušený katalog pro rychlé zobrazení
    const catalog = {
      last_updated: new Date().toISOString(),
      total_products: mergedProducts.length,
      products: mergedProducts.map(product => ({
        kod: product.kod,
        nazev: product.nazev,
        cena_bez_dph: product.cena_bez_dph,
        cena_s_dph: product.cena_s_dph,
        dostupnost: product.dostupnost,
        kategorie: product.kategorie,
        vyrobce: product.vyrobce,
        merged_sources: product.merged_sources
      }))
    };
    
    // Uložit katalog
    await env.PRODUKTY.put('product_catalog', JSON.stringify(catalog));
    
    // Uložit jednotlivé produkty ve skupinách pro efektivnější zpracování
    const productChunks = chunkArray(mergedProducts, 50);
    
    for (const chunk of productChunks) {
      const promises = chunk.map(product => 
        env.PRODUKTY.put(`products:${product.kod}`, JSON.stringify(product))
      );
      await Promise.all(promises);
    }
    
    // Aktualizace indexů pro vyhledávání
    await updateProductIndexes(env, mergedProducts);
    
    return mergedProducts.length;
  } catch (error) {
    console.error('Error merging product data:', error);
    throw new Error(`Chyba při slučování dat produktů: ${error.message}`);
  }
}

/**
 * Vytvoří a aktualizuje indexy pro rychlejší vyhledávání produktů
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {Array} products - Seznam produktů
 * @returns {Promise<void>}
 */
async function updateProductIndexes(env, products) {
  try {
    // Vytvoření indexů pro kategorie a výrobce
    const categoryMap = new Map();
    const manufacturerMap = new Map();
    
    // Vytvoření seznamu všech kategorií a výrobců
    const allCategories = new Set();
    const allManufacturers = new Set();
    
    // Procházení produktů a sestavení indexů
    products.forEach(product => {
      if (product.kategorie) {
        allCategories.add(product.kategorie);
        if (!categoryMap.has(product.kategorie)) {
          categoryMap.set(product.kategorie, []);
        }
        categoryMap.get(product.kategorie).push(product.kod);
      }
      
      if (product.vyrobce) {
        allManufacturers.add(product.vyrobce);
        if (!manufacturerMap.has(product.vyrobce)) {
          manufacturerMap.set(product.vyrobce, []);
        }
        manufacturerMap.get(product.vyrobce).push(product.kod);
      }
    });
    
    // Uložení seznamů kategorií a výrobců
    await env.PRODUKTY.put('product_categories', JSON.stringify(Array.from(allCategories)));
    await env.PRODUKTY.put('product_manufacturers', JSON.stringify(Array.from(allManufacturers)));
    
    // Uložení indexů po kategoriích
    const categoryPromises = [];
    categoryMap.forEach((produkty, kategorie) => {
      categoryPromises.push(
        env.PRODUKTY.put(`product_index_kategorie:${kategorie}`, JSON.stringify(produkty))
      );
    });
    
    // Uložení indexů po výrobcích
    const manufacturerPromises = [];
    manufacturerMap.forEach((produkty, vyrobce) => {
      manufacturerPromises.push(
        env.PRODUKTY.put(`product_index_vyrobce:${vyrobce}`, JSON.stringify(produkty))
      );
    });
    
    // Čekání na dokončení všech zápisů
    await Promise.all([...categoryPromises, ...manufacturerPromises]);
  } catch (error) {
    console.error('Error updating product indexes:', error);
    throw new Error(`Chyba při aktualizaci indexů produktů: ${error.message}`);
  }
}

/**
 * Získá seznam všech produktů s možností filtrování a stránkování
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {Object} options - Možnosti filtrování
 * @returns {Promise<Object>} Seznam produktů a metadata
 */
export async function getProducts(env, options = {}) {
  try {
    const { kategorie, vyrobce, search, page = 1, limit = 50 } = options;
    
    // Získání katalogu produktů
    const productCatalog = JSON.parse(await env.PRODUKTY.get('product_catalog') || '{"products":[]}');
    let products = productCatalog.products;
    
    // Filtrování podle kategorie
    if (kategorie) {
      const categoryIndex = JSON.parse(await env.PRODUKTY.get(`product_index_kategorie:${kategorie}`) || '[]');
      products = products.filter(p => categoryIndex.includes(p.kod));
    }
    
    // Filtrování podle výrobce
    if (vyrobce) {
      const manufacturerIndex = JSON.parse(await env.PRODUKTY.get(`product_index_vyrobce:${vyrobce}`) || '[]');
      products = products.filter(p => manufacturerIndex.includes(p.kod));
    }
    
    // Filtrování podle vyhledávání
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.kod.toLowerCase().includes(searchLower) || 
        p.nazev.toLowerCase().includes(searchLower)
      );
    }
    
    // Získání počtu stránek
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Stránkování
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages
      },
      lastUpdated: productCatalog.last_updated
    };
  } catch (error) {
    console.error('Error getting products:', error);
    throw new Error(`Chyba při získávání produktů: ${error.message}`);
  }
}

/**
 * Získá detail produktu podle kódu
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} kod - Kód produktu
 * @returns {Promise<Object>} Detail produktu
 */
export async function getProductDetail(env, kod) {
  try {
    const productDetail = await env.PRODUKTY.get(`products:${kod}`);
    if (!productDetail) {
      throw new Error(`Produkt s kódem ${kod} nebyl nalezen`);
    }
    return JSON.parse(productDetail);
  } catch (error) {
    console.error(`Error getting product detail for ${kod}:`, error);
    throw new Error(`Chyba při získávání detailu produktu: ${error.message}`);
  }
}

/**
 * Získá seznam všech kategorií produktů
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @returns {Promise<Array>} Seznam kategorií
 */
export async function getProductCategories(env) {
  try {
    const categories = await env.PRODUKTY.get('product_categories');
    return JSON.parse(categories || '[]');
  } catch (error) {
    console.error('Error getting product categories:', error);
    throw new Error(`Chyba při získávání kategorií produktů: ${error.message}`);
  }
}

/**
 * Získá seznam všech výrobců produktů
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @returns {Promise<Array>} Seznam výrobců
 */
export async function getProductManufacturers(env) {
  try {
    const manufacturers = await env.PRODUKTY.get('product_manufacturers');
    return JSON.parse(manufacturers || '[]');
  } catch (error) {
    console.error('Error getting product manufacturers:', error);
    throw new Error(`Chyba při získávání výrobců produktů: ${error.message}`);
  }
}

/**
 * Získá historii importů produktů
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @returns {Promise<Object>} Historie importů
 */
export async function getProductImportHistory(env) {
  try {
    const sources = await env.PRODUKTY.get('product_sources');
    return JSON.parse(sources || '{"import_history":[]}');
  } catch (error) {
    console.error('Error getting product import history:', error);
    throw new Error(`Chyba při získávání historie importů produktů: ${error.message}`);
  }
}

/**
 * Rozdělí pole na menší části (chunky)
 * @param {Array} array - Pole k rozdělení
 * @param {number} chunkSize - Velikost části
 * @returns {Array} Pole polí (chunků)
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
