// frontend/src/components/IntelekImport.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import DS from './DesignSystem';

// URL pro Intelek API
const URL_CENIK = "https://www.intelek.cz/export_cena.jsp?level=54003830&xml=true&x=PGC%2FbX15XeK%2FkGaBq7VN4A%3D%3D";
const URL_POPISKY = "http://www.intelek.cz/export_popis.jsp";

// Zmenšení velikosti dávky pro redukci timeoutů
const BATCH_SIZE = 50;

// Definice typů pro možnosti importu
type ImportType = 'url' | 'xml';
type ImportSource = 'cenik' | 'popisky';
type StatusType = 'info' | 'error' | 'success' | 'warning';

// Definice průběhu importu
interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
}

// Definice výsledku importu
interface ImportResult {
  source: ImportSource;
  imported: number;
  total: number;
  failed: boolean;
}

// Vlastnosti komponenty
interface IntelekImportProps {
  onImportComplete?: (result: ImportResult) => void;
  onClose?: () => void;
  isModal?: boolean;
}

// Bezpečnostní funkce pro přístup k vlastnostem témat
const getSafeColor = (colorObj: any, property: string, defaultValue = '#ffffff') => {
  if (!colorObj || !colorObj[property]) {
    console.warn(`Chybí vlastnost ${property} v barevném objektu`);
    return defaultValue;
  }
  return colorObj[property];
};

// Pomocné funkce pro práci s XML
function cleanText(text: string | null): string {
  if (!text) return "";
  
  // Odstranění CDATA tagů
  const cdataMatch = text.match(/\<\!\[CDATA\[(.*?)\]\]\>/);
  if (cdataMatch) {
    text = cdataMatch[1].trim();
  }
  
  // Odstranění HTML tagů
  text = text.replace(/<sub>(.*?)<\/sub>/gi, "$1");
  text = text.replace(/<[^>]*>/g, "");
  
  return text;
}

// Hlavní komponenta pro import z Intelek
const IntelekImport: React.FC<IntelekImportProps> = ({ onImportComplete, onClose, isModal = false }) => {
  // Stav komponenty
  const [importType, setImportType] = useState<ImportType>('url');
  const [importSource, setImportSource] = useState<ImportSource>('cenik');
  const [customUrl, setCustomUrl] = useState<string>(URL_CENIK);
  const [xmlData, setXmlData] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: StatusType, message: string } | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  // Efekt pro nastavení výchozí URL podle zvoleného zdroje
  useEffect(() => {
    setCustomUrl(importSource === 'cenik' ? URL_CENIK : URL_POPISKY);
  }, [importSource]);

  // Aktualizace statusu se správným typem
  const updateStatus = useCallback((message: string, type: StatusType = 'info') => {
    setStatus({ type, message });
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  // Handler pro test připojení
  const handleTestConnection = async () => {
    updateStatus('Testuji připojení...', 'info');
    setIsImporting(true);

    try {
      let response;
      
      if (importType === 'url') {
        // Získání dat z URL
        response = await fetch('/api/intelek-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: customUrl }),
        });
      } else {
        // Použití dat z textové oblasti
        if (!xmlData.trim()) {
          updateStatus('Zadejte XML data', 'error');
          setIsImporting(false);
          return;
        }
        
        // Simulace úspěšné odpovědi s XML daty
        response = new Response(xmlData, {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        });
      }

      if (!response.ok) {
        updateStatus(`Chyba: ${response.status} ${response.statusText}`, 'error');
        setIsImporting(false);
        return;
      }

      const contentType = response.headers.get('Content-Type') || '';
      
      // Kontrola typu obsahu - očekáváme XML
      if (!contentType.includes('xml') && !contentType.includes('text/plain')) {
        updateStatus(`Neočekávaný typ obsahu: ${contentType}. Očekáváno XML.`, 'error');
        setIsImporting(false);
        return;
      }

      // Získání textu XML
      const xmlContent = await response.text();
      
      // Kontrola validního XML obsahu
      if (!xmlContent.includes('<?xml') && 
          !xmlContent.includes('<product>') && 
          !xmlContent.includes('<SHOPITEM>')) {
        updateStatus('Odpověď neobsahuje platné XML data', 'error');
        setIsImporting(false);
        return;
      }

      // Počítání produktů - robustní způsob detekce jak pro formát <product>, tak <SHOPITEM>
      const productMatches = (xmlContent.match(/<product>/g) || []).length;
      const shopitemMatches = (xmlContent.match(/<SHOPITEM>/g) || []).length;
      const productCount = productMatches + shopitemMatches;

      updateStatus(`Připojení úspěšné! Nalezeno ${productCount} produktů.`, 'success');
    } catch (error) {
      console.error('Error testing connection:', error);
      updateStatus(`Chyba při testování připojení: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Parsování XML pomocí DOMParser (spolehlivější než regex)
  const parseXmlToProducts = (xmlContent: string, source: ImportSource) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      const products = [];
      
      // Kontrola chyb při parsování
      if (xmlDoc.querySelector('parsererror')) {
        throw new Error('Chyba při parsování XML dokumentu');
      }
      
      // Nejdřív zkusíme Intelek formát (product)
      const intelekItems = xmlDoc.querySelectorAll('product');
      
      if (intelekItems.length > 0) {
        // Zpracování ve formátu Intelek
        for (let i = 0; i < intelekItems.length; i++) {
          const item = intelekItems[i];
          const product: Record<string, any> = {};
          
          // Bezpečná extrakce textu z elementu
          const getElementText = (parent: Element, tagName: string): string => {
            const element = parent.querySelector(tagName);
            return element ? cleanText(element.textContent) : '';
          };
          
          // Extrakce základních dat
          product.kod = getElementText(item, 'kod');
          product.ean = getElementText(item, 'ean');
          product.nazev = getElementText(item, 'nazev');
          
          if (source === 'cenik') {
            // Ceník specifická data
            product.cena_bez_dph = parseFloat(getElementText(item, 'vasecenabezdph')) || 0;
            product.cena_s_dph = parseFloat(getElementText(item, 'vasecenasdph')) || 0;
            product.dostupnost = parseInt(getElementText(item, 'dostupnost')) || 0;
            product.eu_bez_dph = parseFloat(getElementText(item, 'eubezdph')) || 0;
            product.eu_s_dph = parseFloat(getElementText(item, 'eusdph')) || 0;
          } else {
            // Popisky specifická data
            product.kategorie = getElementText(item, 'kategorie');
            product.vyrobce = getElementText(item, 'vyrobce');
            product.dodani = getElementText(item, 'dodani');
            product.minodber = getElementText(item, 'minodber');
            product.jednotka = getElementText(item, 'jednotka');
            product.kratky_popis = getElementText(item, 'kratkypopis');
            product.popis = getElementText(item, 'popis');
            
            // Získání URL obrázku
            const obrazek = getElementText(item, 'obrazek');
            const obrazek1 = item.querySelector('obrazek[id="1"]');
            product.obrazek = obrazek || (obrazek1 ? cleanText(obrazek1.textContent) : '');
          }
          
          // Přidání produktu do pole, jen pokud má kód
          if (product.kod) {
            products.push(product);
          }
        }
      } else {
        // Zkusíme alternativní formát (SHOPITEM)
        const shopItems = xmlDoc.querySelectorAll('SHOPITEM');
        
        for (let i = 0; i < shopItems.length; i++) {
          const item = shopItems[i];
          const product: Record<string, any> = {};
          
          // Bezpečná extrakce textu z elementu
          const getElementText = (parent: Element, tagName: string): string => {
            const element = parent.querySelector(tagName);
            return element ? cleanText(element.textContent) : '';
          };
          
          // Extrakce základních dat
          product.kod = getElementText(item, 'CODE') || getElementText(item, 'PRODUCTNO');
          product.ean = getElementText(item, 'EAN');
          product.nazev = getElementText(item, 'PRODUCT');
          
          if (source === 'cenik') {
            // Ceník specifická data
            product.cena_bez_dph = parseFloat(getElementText(item, 'PRICE')) || 0;
            product.cena_s_dph = parseFloat(getElementText(item, 'PRICE_VAT')) || 0;
            product.dostupnost = getElementText(item, 'DELIVERY_DATE') || 0;
          } else {
            // Popisky specifická data
            product.kategorie = getElementText(item, 'CATEGORYTEXT');
            product.vyrobce = getElementText(item, 'MANUFACTURER');
            product.kratky_popis = getElementText(item, 'DESCRIPTION_SHORT');
            product.popis = getElementText(item, 'DESCRIPTION');
            product.obrazek = getElementText(item, 'IMGURL');
            
            // Parametry
            const params = item.querySelectorAll('PARAM');
            const parametry: string[] = [];
            params.forEach(param => {
              const nazev = getElementText(param, 'PARAM_NAME');
              const hodnota = getElementText(param, 'VAL');
              if (nazev && hodnota) {
                parametry.push(`${nazev}: ${hodnota}`);
              }
            });
            product.parametry = parametry.join("\n");
          }
          
          // Přidání produktu do pole, jen pokud má kód
          if (product.kod) {
            products.push(product);
          }
        }
      }
      
      return products;
    } catch (error) {
      console.error('Chyba při parsování XML:', error);
      throw new Error(`Nepodařilo se zpracovat XML: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Handler pro import dat
  const handleImport = async () => {
    updateStatus('Začínám import...', 'info');
    setIsImporting(true);
    setImportProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches: 0
    });

    try {
      let xmlContent = '';
      
      // Získání XML podle zvoleného zdroje
      if (importType === 'url') {
        // Získání dat z URL přes proxy
        const response = await fetch('/api/intelek-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: customUrl }),
        });

        if (!response.ok) {
          throw new Error(`Chyba při načítání dat: ${response.status} ${response.statusText}`);
        }

        xmlContent = await response.text();
      } else {
        // Použití zadaných XML dat
        if (!xmlData.trim()) {
          updateStatus('Zadejte XML data', 'error');
          setIsImporting(false);
          return;
        }
        xmlContent = xmlData;
      }

      // Zpracování XML na produkty
      const products = parseXmlToProducts(xmlContent, importSource);
      
      if (products.length === 0) {
        updateStatus('Nebyly nalezeny žádné produkty k importu', 'error');
        setIsImporting(false);
        return;
      }

      console.log(`Zpracováno ${products.length} produktů z XML`);
      
      // Rozdělení produktů do dávek - zmenšené dávky pro lepší výkon
      const totalBatches = Math.ceil(products.length / BATCH_SIZE);
      let importedCount = 0;
      let failedBatches = 0;
      
      // Aktualizace progress
      setImportProgress({
        total: products.length,
        processed: 0,
        successful: 0,
        failed: 0,
        currentBatch: 0,
        totalBatches
      });
      
      // Timestamp pro identifikaci importu
      const importTimestamp = new Date().toISOString();
      
      // Dávkové zpracování
      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min((i + 1) * BATCH_SIZE, products.length);
        const batch = products.slice(start, end);
        
        // Aktualizace progress
        setImportProgress(prev => {
          if (!prev) return null;
          return {
            ...prev,
            currentBatch: i + 1
          };
        });
        
        updateStatus(`Importuji dávku ${i + 1}/${totalBatches} (${batch.length} produktů)...`, 'info');
        
        try {
          // Příprava dat pro odeslání
          const importData = {
            source: importSource,
            products: batch,
            totalCount: products.length,
            batchNumber: i + 1,
            totalBatches: totalBatches,
            timestamp: importTimestamp
          };
          
          // Odeslání dávky na server
          const apiMethod = importSource === 'cenik' 
            ? api.importXmlCenik 
            : api.importXmlPopisky;
          
          // KLÍČOVÁ ZMĚNA: Předáváme data přímo, ne jako stringifikovaný JSON
          const response = await apiMethod(importData);
          
          console.log(`Dávka ${i + 1}/${totalBatches} úspěšně importována:`, response);
          
          // Aktualizace počítadla
          if (response && response.count) {
            importedCount += response.count;
            
            // Aktualizace progress
            setImportProgress(prev => {
              if (!prev) return null;
              return {
                ...prev,
                processed: Math.min(prev.processed + batch.length, prev.total),
                successful: importedCount
              };
            });
          }
        } catch (error) {
          console.error(`Chyba při importu dávky ${i + 1}/${totalBatches}:`, error);
          failedBatches++;
          
          // Aktualizace progress s chybou
          setImportProgress(prev => {
            if (!prev) return null;
            return {
              ...prev,
              processed: Math.min(prev.processed + batch.length, prev.total),
              failed: prev.failed + batch.length
            };
          });
        }
        
        // Delší zpoždění mezi dávkami pro snížení rizika timeoutů
        if (i < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Konečný status
      if (failedBatches === 0) {
        updateStatus(`Import z ${importSource === 'cenik' ? 'ceníku' : 'popisků'} dokončen: ${importedCount} produktů`, 'success');
      } else if (failedBatches < totalBatches) {
        updateStatus(`Import částečně úspěšný: ${importedCount} produktů. ${failedBatches} dávek selhalo.`, 'warning');
      } else {
        updateStatus(`Import selhal: všechny dávky měly chybu.`, 'error');
      }
      
      // Volání callback funkce, pokud byla poskytnuta
      if (onImportComplete) {
        onImportComplete({
          source: importSource,
          total: products.length,
          imported: importedCount,
          failed: failedBatches > 0
        });
      }
      
    } catch (error) {
      console.error('Chyba při importu:', error);
      updateStatus(`Import selhal: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Sloučení dat z obou zdrojů (ceník + popisky)
  const handleMergeProducts = async () => {
    updateStatus('Začínám slučování dat...', 'info');
    setIsImporting(true);
    
    try {
      const response = await api.mergeProductData();
      
      if (response && response.count) {
        updateStatus(`Sloučení dokončeno: ${response.count} produktů aktualizováno`, 'success');
      } else {
        updateStatus(`Sloučení dokončeno, ale nebyly vráceny počty produktů`, 'warning');
      }
    } catch (error) {
      console.error('Chyba při slučování produktů:', error);
      updateStatus(`Sloučení selhalo: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Diagnostika API koncových bodů
  const runDiagnostics = async () => {
    updateStatus('Spouštím diagnostiku...', 'info');
    setIsImporting(true);
    
    try {
      // 1. Test proxy endpointu
      console.log("Test 1: Kontrola proxy endpoint");
      updateStatus('Test 1: Kontrola proxy endpoint...', 'info');
      
      const proxyTest = await fetch('/api/intelek-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: URL_CENIK }),
      });
      
      console.log(`Proxy test response status: ${proxyTest.status}`);
      if (!proxyTest.ok) {
        const errorText = await proxyTest.text();
        console.log(`Proxy error: ${errorText}`);
        throw new Error(`Proxy endpoint není funkční: ${proxyTest.status} ${proxyTest.statusText}`);
      }
      
      // 2. Test importního endpointu s minimálními daty
      console.log("Test 2: Kontrola importního endpoint");
      updateStatus('Test 2: Kontrola importního endpointu...', 'info');
      
      const sampleProduct = {
        kod: "TEST-PRODUKT",
        nazev: "Testovací produkt",
        cena_bez_dph: 100,
        cena_s_dph: 121,
        dostupnost: 10
      };
      
      // DŮLEŽITÉ: Předáváme data jako objekt, ne stringifikovaný JSON
      const importTest = await api.importXmlCenik({
        source: 'test',
        products: [sampleProduct],
        totalCount: 1,
        batchNumber: 1,
        totalBatches: 1,
        timestamp: new Date().toISOString()
      });
      
      console.log("Import test response:", importTest);
      if (!importTest || !importTest.count) {
        throw new Error("Import endpoint není funkční nebo nevrací očekávanou odpověď");
      }
      
      // 3. Test čtení z KV storage
      console.log("Test 3: Kontrola čtení z KV storage");
      updateStatus('Test 3: Kontrola čtení z KV storage...', 'info');
      
      const productTest = await api.getProduct(sampleProduct.kod);
      console.log("Get product response:", productTest);
      
      // Výsledek diagnostiky
      updateStatus(`Diagnostika dokončena úspěšně. Všechny testy prošly.`, 'success');
      
    } catch (error) {
      console.error("Diagnostika selhala:", error);
      updateStatus(`Diagnostika selhala: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Renderování komponenty - s defensivním přístupem k vlastnostem témat
  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        Import produktů z Intelek.cz
      </h2>
      
      {status && (
        <div style={{ 
          padding: '0.75rem',
          borderRadius: '0.375rem',
          marginBottom: '1rem',
          backgroundColor: 
            status.type === 'error' ? '#fee2e2' : 
            status.type === 'success' ? '#d1fae5' : 
            status.type === 'warning' ? '#fef3c7' : 
            '#e0f2fe',
          color: 
            status.type === 'error' ? '#7f1d1d' : 
            status.type === 'success' ? '#064e3b' : 
            status.type === 'warning' ? '#78350f' : 
            '#0c4a6e',
        }}>
          {status.message}
        </div>
      )}
      
      {importProgress && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.375rem',
          textAlign: 'center'
        }}>
          <div>
            Průběh importu: {importProgress.currentBatch} z {importProgress.totalBatches} dávek
          </div>
          <div>
            Zpracováno {importProgress.processed} z {importProgress.total} produktů
            {importProgress.successful > 0 && (
              <span> ({importProgress.successful} úspěšně, {importProgress.failed} neúspěšně)</span>
            )}
          </div>
          <div style={{
            width: '100%',
            height: '10px',
            backgroundColor: '#d1d5db',
            borderRadius: '0.25rem',
            overflow: 'hidden',
            marginTop: '0.5rem'
          }}>
            <div style={{
              width: `${Math.max(1, (importProgress.processed / Math.max(1, importProgress.total)) * 100)}%`,
              height: '100%',
              backgroundColor: importProgress.failed > 0 ? 
                '#f59e0b' : // amber-500 
                '#3b82f6', // blue-500
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}
      
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => setImportType('url')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: importType === 'url' ? '#3b82f6' : 'transparent',
            color: importType === 'url' ? 'white' : '#1f2937',
            border: `1px solid ${importType === 'url' ? '#3b82f6' : '#d1d5db'}`,
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Import z URL
        </button>
        <button
          onClick={() => setImportType('xml')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: importType === 'xml' ? '#3b82f6' : 'transparent',
            color: importType === 'xml' ? 'white' : '#1f2937',
            border: `1px solid ${importType === 'xml' ? '#3b82f6' : '#d1d5db'}`,
            borderRadius: '0.375rem',
            cursor: 'pointer'
          }}
        >
          Import z XML dat
        </button>
      </div>
      
      <div style={{ 
        marginBottom: '1rem', 
        borderRadius: '0.375rem', 
        padding: '1rem', 
        border: '1px solid #e5e7eb' 
      }}>
        {importType === 'url' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                  Vyberte zdroj importu:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setImportSource('cenik')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: importSource === 'cenik' ? '#3b82f6' : 'transparent',
                      color: importSource === 'cenik' ? 'white' : '#1f2937',
                      border: `1px solid ${importSource === 'cenik' ? '#3b82f6' : '#d1d5db'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Ceník
                  </button>
                  <button
                    onClick={() => setImportSource('popisky')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: importSource === 'popisky' ? '#3b82f6' : 'transparent',
                      color: importSource === 'popisky' ? 'white' : '#1f2937',
                      border: `1px solid ${importSource === 'popisky' ? '#3b82f6' : '#d1d5db'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Popisky
                  </button>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                  URL pro import
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="URL pro stažení XML"
                  disabled={isImporting}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    backgroundColor: isImporting ? '#f3f4f6' : 'white'
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                  Vyberte typ dat:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setImportSource('cenik')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: importSource === 'cenik' ? '#3b82f6' : 'transparent',
                      color: importSource === 'cenik' ? 'white' : '#1f2937',
                      border: `1px solid ${importSource === 'cenik' ? '#3b82f6' : '#d1d5db'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Ceník
                  </button>
                  <button
                    onClick={() => setImportSource('popisky')}
                    style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: importSource === 'popisky' ? '#3b82f6' : 'transparent',
                      color: importSource === 'popisky' ? 'white' : '#1f2937',
                      border: `1px solid ${importSource === 'popisky' ? '#3b82f6' : '#d1d5db'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Popisky
                  </button>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
                  XML data
                </label>
                <textarea
                  value={xmlData}
                  onChange={(e) => setXmlData(e.target.value)}
                  placeholder="Vložte XML data..."
                  disabled={isImporting}
                  style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    backgroundColor: isImporting ? '#f3f4f6' : 'white'
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      <div 
        onClick={() => setIsExpanded(!isExpanded)} 
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '1rem', 
          color: '#3b82f6'
        }}
      >
        <span style={{ marginRight: '0.25rem' }}>
          {isExpanded ? '▼' : '►'}
        </span>
        <span>Rozšířené možnosti</span>
      </div>
      
      {isExpanded && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '0.375rem' 
        }}>
          <p style={{ 
            fontSize: '0.875rem', 
            marginBottom: '1rem', 
            color: '#4b5563' 
          }}>
            <strong>Tipy pro import:</strong><br />
            - URL pro ceník: {URL_CENIK}<br />
            - URL pro popisky: {URL_POPISKY}<br />
            - Pro větší množství dat použijte přímý import z XML<br />
            - Po importu ceníku a popisků použijte sloučení<br />
          </p>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={runDiagnostics}
              disabled={isImporting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: '#1f2937',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: isImporting ? 'not-allowed' : 'pointer',
                opacity: isImporting ? 0.7 : 1
              }}
            >
              Diagnostika
            </button>
            
            <button
              onClick={handleMergeProducts}
              disabled={isImporting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: '1px solid #10b981',
                borderRadius: '0.375rem',
                cursor: isImporting ? 'not-allowed' : 'pointer',
                opacity: isImporting ? 0.7 : 1
              }}
            >
              Sloučit produkty
            </button>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={handleTestConnection}
          disabled={isImporting}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: '#1f2937',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            cursor: isImporting ? 'not-allowed' : 'pointer',
            opacity: isImporting ? 0.7 : 1
          }}
        >
          Otestovat připojení
        </button>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isModal && (
            <button
              onClick={onClose}
              disabled={isImporting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: '#1f2937',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: isImporting ? 'not-allowed' : 'pointer',
                opacity: isImporting ? 0.7 : 1
              }}
            >
              Zavřít
            </button>
          )}
          <button
            onClick={handleImport}
            disabled={isImporting || (importType === 'xml' && !xmlData.trim())}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: '1px solid #3b82f6',
              borderRadius: '0.375rem',
              cursor: (isImporting || (importType === 'xml' && !xmlData.trim())) ? 'not-allowed' : 'pointer',
              opacity: (isImporting || (importType === 'xml' && !xmlData.trim())) ? 0.7 : 1
            }}
          >
            {isImporting ? 'Importuji...' : 'Spustit import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntelekImport;
