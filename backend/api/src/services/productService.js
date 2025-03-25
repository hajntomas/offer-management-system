// backend/api/src/services/productService.js
// Optimalizovaná verze pro práci s velkým počtem produktů

/**
 * Vylepšený servis pro práci s produkty v Cloudflare KV Storage
 * - Optimalizace pro velké množství produktů
 * - Indexace a cachování
 * - Efektivní filtrace a stránkování
 */

import { createCacheKey } from '../utils/cacheUtils.js';

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
    
    // Invalidace cache
    await invalidateProductsCaches(env);
    
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
 * Optimalizováno pro velké množství produktů
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @returns {Promise<number>} Počet sloučených produktů
 */
export async function mergeProductData(env) {
  try {
    // Načtení produktů z jednotlivých zdrojů
    const cenikProducts = JSON.parse(await env.PRODUKTY.get('source_xml_cenik') || '[]');
    const popiskyProducts = JSON.parse(await env.PRODUKTY.get('source_xml_popisky') || '[]');
    const excelProducts = JSON.parse(await env.PRODUKTY.get('source_excel') || '[]');
    
    console.log(`Merging products: ${cenikProducts.length} from ceník, ${popiskyProducts.length} from popisky, ${excelProducts.length} from excel`);
    
    // Vytvoření map produktů podle kódu
    const productMap = new Map();
    
    // Nejprve zpracujeme data z ceníku (základ - ceny, dostupnost)
    for (const product of cenikProducts) {
      if (!product.kod) continue;
      productMap.set(product.kod, {
        ...product,
        merged_sources: ['xml_cenik']
      });
    }
    
    // Doplníme/aktualizujeme informace z popisků
    for (const product of popiskyProducts) {
      if (!product.kod) continue;
      
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
    }
    
    // Nakonec aplikujeme data z Excel souboru (priorita)
    for (const product of excelProducts) {
      if (!product.kod) continue;
      
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
    }
    
    // Konvertovat Map na pole produktů
    const mergedProducts = Array.from(productMap.values());
    console.log(`Total merged products: ${mergedProducts.length}`);
    
    // Vytvořit optimalizovaný katalog
    await createOptimizedCatalog(env, mergedProducts);
    
    // Aktualizace indexů pro vyhledávání
    await updateProductIndexes(env, mergedProducts);
    
    // Invalidace cache
    await invalidateProductsCaches(env);
    
    return mergedProducts.length;
  } catch (error) {
    console.error('Error merging product data:', error);
    throw new Error(`Chyba při slučování dat produktů: ${error.message}`);
  }
}

/**
 * Vytvoří optimalizovaný katalog produktů pro rychlejší vyhledávání
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {Array} mergedProducts - Seznam sloučených produktů
 * @returns {Promise<void>}
 */
async function createOptimizedCatalog(env, mergedProducts) {
  try {
    console.log("Creating optimized catalog...");
    const startTime = Date.now();
    
    // Vytvoření zjednodušeného katalogu pro rychlé zobrazení
    const catalog = {
      last_updated: new Date().toISOString(),
      total_products: mergedProducts.length,
      products: mergedProducts.map(product => ({
        id: product.id || product.kod,
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
    
    // 1. Optimalizace: Ukládání produktů po skupinách dle kategorií
    const categorySets = new Map();
    
    // Rozdělení produktů podle kategorie
    mergedProducts.forEach(product => {
      if (!product.kategorie) return;
      
      if (!categorySets.has(product.kategorie)) {
        categorySets.set(product.kategorie, []);
      }
      categorySets.get(product.kategorie).push(product);
    });
    
    // Ukládání produktů po kategoriích
    const categoryPromises = [];
    categorySets.forEach(async (products, category) => {
      categoryPromises.push(
        env.PRODUKTY.put(`category_products:${category}`, JSON.stringify(products))
      );
    });
    await Promise.all(categoryPromises);
    
    // 2. Optimalizace: Ukládání produktů po skupinách dle výrobce
    const manufacturerSets = new Map();
    
    // Rozdělení produktů podle výrobce
    mergedProducts.forEach(product => {
      if (!product.vyrobce) return;
      
      if (!manufacturerSets.has(product.vyrobce)) {
        manufacturerSets.set(product.vyrobce, []);
      }
      manufacturerSets.get(product.vyrobce).push(product);
    });
    
    // Ukládání produktů po výrobcích
    const manufacturerPromises = [];
    manufacturerSets.forEach(async (products, manufacturer) => {
      manufacturerPromises.push(
        env.PRODUKTY.put(`manufacturer_products:${manufacturer}`, JSON.stringify(products))
      );
    });
    await Promise.all(manufacturerPromises);
    
    // 3. Optimalizace: Ukládání produktů po skupinách kódů (pro detail)
    // Rozdělit produkty do skupin po 50 pro uložení detailů
    const productChunks = chunkArray(mergedProducts, 50);
    
    const productPromises = [];
    for (let i = 0; i < productChunks.length; i++) {
      const chunk = productChunks[i];
      const chunkId = `product_chunk_${i}`;
      
      // Uložení celého chunku
      productPromises.push(env.PRODUKTY.put(chunkId, JSON.stringify(chunk)));
      
      // Uložení id chunků k produktům
      for (const product of chunk) {
        productPromises.push(
          env.PRODUKTY.put(`product_chunk_mapping:${product.kod}`, chunkId)
        );
      }
    }
    
    // Uložení jednotlivých produktů pro přímý přístup
    const detailPromises = [];
    for (const product of mergedProducts) {
      detailPromises.push(
        env.PRODUKTY.put(`products:${product.kod}`, JSON.stringify(product))
      );
    }
    
    // Spuštění všech promise najednou
    await Promise.all([...productPromises, ...detailPromises]);
    
    const endTime = Date.now();
    console.log(`Optimized catalog created in ${endTime - startTime}ms`);
    
  } catch (error) {
    console.error('Error creating optimized catalog:', error);
    throw new Error(`Chyba při vytváření optimalizovaného katalogu: ${error.message}`);
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
    console.log("Updating product indexes...");
    const startTime = Date.now();
    
    // Vytvoření indexů pro kategorie a výrobce
    const categoryMap = new Map();
    const manufacturerMap = new Map();
    
    // Vytvoření seznamu všech kategorií a výrobců
    const allCategories = new Set();
    const allManufacturers = new Set();
    
    // Cenové rozsahy pro filtrování
    let minPrice = Number.MAX_SAFE_INTEGER;
    let maxPrice = 0;
    
    // Procházení produktů a sestavení indexů
    products.forEach(product => {
      // Aktualizace cenových rozsahů
      if (product.cena_s_dph && product.cena_s_dph > 0) {
        minPrice = Math.min(minPrice, product.cena_s_dph);
        maxPrice = Math.max(maxPrice, product.cena_s_dph);
      }
      
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
    
    // Uložení informace o cenovém rozsahu
    await env.PRODUKTY.put('product_price_range', JSON.stringify({
      min_price: minPrice === Number.MAX_SAFE_INTEGER ? 0 : minPrice,
      max_price: maxPrice
    }));
    
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
    
    const endTime = Date.now();
    console.log(`Product indexes updated in ${endTime - startTime}ms`);
    
  } catch (error) {
    console.error('Error updating product indexes:', error);
    throw new Error(`Chyba při aktualizaci indexů produktů: ${error.message}`);
  }
}

/**
 * Získá seznam všech produktů s možností filtrování a stránkování
 * Optimalizace pro velké množství produktů
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {Object} options - Možnosti filtrování
 * @returns {Promise<Object>} Seznam produktů a metadata
 */
export async function getProducts(env, options = {}) {
  try {
    const { kategorie, vyrobce, search, priceMin, priceMax, inStock = false, page = 1, limit = 50, sort } = options;
    
    // 1. Optimalizace: Pokud hledáme podle kategorie nebo výrobce, použijeme předpřipravené seznamy
    if (kategorie && !search && !vyrobce && !priceMin && !priceMax && !inStock && !sort) {
      return getCachedCategoryProducts(env, kategorie, page, limit);
    }
    
    if (vyrobce && !search && !kategorie && !priceMin && !priceMax && !inStock && !sort) {
      return getCachedManufacturerProducts(env, vyrobce, page, limit);
    }
    
    // 2. Pokus o získání výsledků z cache pro kombinaci filtrů
    if (!sort) { // Cache funguje jen pro výchozí řazení
      const cacheKey = createCacheKey('products_filter', { kategorie, vyrobce, search, priceMin, priceMax, inStock, page, limit });
      const cachedResult = await env.PRODUKTY.get(cacheKey);
      
      if (cachedResult) {
        console.log(`Cache hit for ${cacheKey}`);
        return JSON.parse(cachedResult);
      }
    }
    
    // 3. Standardní přístup - načíst katalog a filtrovat
    const startTime = Date.now();
    console.log(`Getting products with filters: ${JSON.stringify(options)}`);
    
    const productCatalog = JSON.parse(await env.PRODUKTY.get('product_catalog') || '{"products":[]}');
    let products = productCatalog.products || [];
    
    // Filtrování podle možností
    if (kategorie) {
      const categoryIndex = JSON.parse(await env.PRODUKTY.get(`product_index_kategorie:${kategorie}`) || '[]');
      products = products.filter(p => categoryIndex.includes(p.kod));
    }
    
    if (vyrobce) {
      const manufacturerIndex = JSON.parse(await env.PRODUKTY.get(`product_index_vyrobce:${vyrobce}`) || '[]');
      products = products.filter(p => manufacturerIndex.includes(p.kod));
    }
    
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.kod.toLowerCase().includes(searchLower) || 
        p.nazev.toLowerCase().includes(searchLower)
      );
    }
    
    if (priceMin !== undefined && priceMin !== null && priceMin !== '') {
      const min = parseFloat(priceMin);
      if (!isNaN(min)) {
        products = products.filter(p => p.cena_s_dph >= min);
      }
    }
    
    if (priceMax !== undefined && priceMax !== null && priceMax !== '') {
      const max = parseFloat(priceMax);
      if (!isNaN(max)) {
        products = products.filter(p => p.cena_s_dph <= max);
      }
    }
    
    if (inStock) {
      products = products.filter(p => {
        if (typeof p.dostupnost === 'number') {
          return p.dostupnost > 0;
        }
        const dostupnostLower = String(p.dostupnost).toLowerCase();
        return dostupnostLower.includes('skladem') || dostupnostLower.includes('dostupné');
      });
    }
    
    // Řazení výsledků
    if (sort) {
      const { field, direction } = sort;
      products.sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];
        
        // Normalizace pro řazení
        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();
        
        if (valueA < valueB) return direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Počet produktů a stránek
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / limit);
    
    // Stránkování
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    const endTime = Date.now();
    console.log(`Products retrieved and filtered in ${endTime - startTime}ms`);
    
    // 4. Vytvoření výsledku
    const result = {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages
      },
      lastUpdated: productCatalog.lastUpdated
    };
    
    // 5. Uložení do cache pro příští použití (jen pokud není řazení)
    if (!sort) {
      const cacheKey = createCacheKey('products_filter', { kategorie, vyrobce, search, priceMin, priceMax, inStock, page, limit });
      await env.PRODUKTY.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 }); // 1 hodina
    }
    
    return result;
  } catch (error) {
    console.error('Error getting products:', error);
    throw new Error(`Chyba při získávání produktů: ${error.message}`);
  }
}

/**
 * Získá seznam produktů z dané kategorie s využitím cache
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} kategorie - Kategorie produktů
 * @param {number} page - Číslo stránky
 * @param {number} limit - Počet produktů na stránku
 * @returns {Promise<Object>} Seznam produktů a metadata
 */
async function getCachedCategoryProducts(env, kategorie, page, limit) {
  try {
    const cacheKey = `products_category:${kategorie}:${page}:${limit}`;
    const cachedResult = await env.PRODUKTY.get(cacheKey);
    
    if (cachedResult) {
      console.log(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedResult);
    }
    
    // Získání produktů z kategorie
    const categoryProducts = JSON.parse(await env.PRODUKTY.get(`category_products:${kategorie}`) || '[]');
    
    // Stránkování
    const totalProducts = categoryProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProducts = categoryProducts.slice(startIndex, endIndex);
    
    // Vytvoření výsledku
    const result = {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Uložení do cache
    await env.PRODUKTY.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 }); // 1 hodina
    
    return result;
  } catch (error) {
    console.error(`Error getting cached category products for ${kategorie}:`, error);
    // Fallback na standardní metodu
    return getProducts(env, { kategorie, page, limit });
  }
}

/**
 * Získá seznam produktů od daného výrobce s využitím cache
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} vyrobce - Výrobce produktů
 * @param {number} page - Číslo stránky
 * @param {number} limit - Počet produktů na stránku
 * @returns {Promise<Object>} Seznam produktů a metadata
 */
async function getCachedManufacturerProducts(env, vyrobce, page, limit) {
  try {
    const cacheKey = `products_manufacturer:${vyrobce}:${page}:${limit}`;
    const cachedResult = await env.PRODUKTY.get(cacheKey);
    
    if (cachedResult) {
      console.log(`Cache hit for ${cacheKey}`);
      return JSON.parse(cachedResult);
    }
    
    // Získání produktů od výrobce
    const manufacturerProducts = JSON.parse(await env.PRODUKTY.get(`manufacturer_products:${vyrobce}`) || '[]');
    
    // Stránkování
    const totalProducts = manufacturerProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProducts = manufacturerProducts.slice(startIndex, endIndex);
    
    // Vytvoření výsledku
    const result = {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Uložení do cache
    await env.PRODUKTY.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 }); // 1 hodina
    
    return result;
  } catch (error) {
    console.error(`Error getting cached manufacturer products for ${vyrobce}:`, error);
    // Fallback na standardní metodu
    return getProducts(env, { vyrobce, page, limit });
  }
}

/**
 * Získá detail produktu podle kódu s optimalizací pro rychlé čtení
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @param {string} kod - Kód produktu
 * @returns {Promise<Object>} Detail produktu
 */
export async function getProductDetail(env, kod) {
  try {
    // 1. Pokus o získání z cache
    const cacheKey = `product_detail:${kod}`;
    const cachedProduct = await env.PRODUKTY.get(cacheKey);
    
    if (cachedProduct) {
      console.log(`Cache hit for product detail: ${kod}`);
      return JSON.parse(cachedProduct);
    }
    
    // 2. Pokus o získání přímo z KV
    const productDetail = await env.PRODUKTY.get(`products:${kod}`);
    if (productDetail) {
      const product = JSON.parse(productDetail);
      
      // Uložení do cache
      await env.PRODUKTY.put(cacheKey, productDetail, { expirationTtl: 3600 }); // 1 hodina
      
      return product;
    }
    
    // 3. Pokud produkt nebyl nalezen, zkusíme najít jeho chunk
    const chunkId = await env.PRODUKTY.get(`product_chunk_mapping:${kod}`);
    if (chunkId) {
      const chunk = JSON.parse(await env.PRODUKTY.get(chunkId) || '[]');
      const product = chunk.find(p => p.kod === kod);
      
      if (product) {
        // Uložení do cache
        await env.PRODUKTY.put(cacheKey, JSON.stringify(product), { expirationTtl: 3600 }); // 1 hodina
        
        return product;
      }
    }
    
    throw new Error(`Produkt s kódem ${kod} nebyl nalezen`);
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
 * Získá cenový rozsah produktů
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @returns {Promise<Object>} Cenový rozsah (min_price, max_price)
 */
export async function getProductPriceRange(env) {
  try {
    const priceRange = await env.PRODUKTY.get('product_price_range');
    return JSON.parse(priceRange || '{"min_price":0,"max_price":0}');
  } catch (error) {
    console.error('Error getting product price range:', error);
    throw new Error(`Chyba při získávání cenového rozsahu produktů: ${error.message}`);
  }
}

/**
 * Invaliduje všechny produktové cache
 * @param {Object} env - Prostředí Cloudflare Worker s KV Storage
 * @returns {Promise<void>}
 */
async function invalidateProductsCaches(env) {
  try {
    // Seznam klíčů k invalidaci
    // V reálné implementaci by se to řešilo komplexněji
    const cacheKeys = [
      'products_filter',
      'products_category',
      'products_manufacturer',
      'product_detail'
    ];
    
    // Vytvoření invalidačního záznamu
    await env.PRODUKTY.put('cache_invalidation_timestamp', Date.now().toString());
    
    console.log('Product caches invalidated');
  } catch (error) {
    console.error('Error invalidating caches:', error);
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

// backend/api/src/utils/cacheUtils.js
/**
 * Vytvoří klíč pro cache na základě parametrů
 * @param {string} prefix - Prefix klíče
 * @param {Object} params - Parametry pro vytvoření unikátního klíče
 * @returns {string} Klíč pro cache
 */
export function createCacheKey(prefix, params) {
  const normalizedParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}:${value}`)
    .sort()
    .join('_');
  
  return `${prefix}_${normalizedParams}`;
}
