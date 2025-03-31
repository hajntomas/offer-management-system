// frontend/src/components/IntelekImport.tsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import DS from './DesignSystem';

// URL pro Intelek API - ověřené z Google Sheets kódu
const URL_CENIK = "https://www.intelek.cz/export_cena.jsp?level=54003830&xml=true&x=PGC%2FbX15XeK%2FkGaBq7VN4A%3D%3D";
const URL_POPISKY = "http://www.intelek.cz/export_popis.jsp";

// Definice typů pro možnosti importu
type ImportType = 'url' | 'xml';
type ImportSource = 'cenik' | 'popisky';

// Vlastnosti komponenty
interface IntelekImportProps {
  onImportComplete?: (result: any) => void;
  onClose?: () => void;
  isModal?: boolean;
}

// Pomocné funkce pro práci s XML - převzato z Google Sheets kódu
function extractXmlValue(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function cleanText(text: string): string {
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

// Hlavní komponenta pro import z Intelek
const IntelekImport: React.FC<IntelekImportProps> = ({ onImportComplete, onClose, isModal = false }) => {
  // Stav komponenty
  const [importType, setImportType] = useState<ImportType>('url');
  const [importSource, setImportSource] = useState<ImportSource>('cenik');
  const [customUrl, setCustomUrl] = useState<string>(URL_CENIK);
  const [xmlData, setXmlData] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [status, setStatus] = useState<{ type: 'info' | 'error' | 'success', message: string } | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Efekt pro nastavení výchozí URL podle zvoleného zdroje
  useEffect(() => {
    setCustomUrl(importSource === 'cenik' ? URL_CENIK : URL_POPISKY);
  }, [importSource]);

  // Handler pro test připojení
  const handleTestConnection = async () => {
    setStatus({ type: 'info', message: 'Testuji připojení...' });
    setIsImporting(true);

    try {
      let response;
      
      if (importType === 'url') {
        // Získání dat z URL
        response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: customUrl }),
        });
      } else {
        // Použití dat z textové oblasti
        if (!xmlData.trim()) {
          setStatus({ type: 'error', message: 'Zadejte XML data' });
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
        setStatus({ 
          type: 'error', 
          message: `Chyba: ${response.status} ${response.statusText}` 
        });
        setIsImporting(false);
        return;
      }

      const contentType = response.headers.get('Content-Type') || '';
      
      // Kontrola typu obsahu - očekáváme XML
      if (!contentType.includes('xml') && !contentType.includes('text/plain')) {
        setStatus({ 
          type: 'error', 
          message: `Neočekávaný typ obsahu: ${contentType}. Očekáváno XML.` 
        });
        setIsImporting(false);
        return;
      }

      // Získání textu XML
      const xmlContent = await response.text();
      
      // Kontrola zda jde skutečně o XML
      if (!xmlContent.includes('<?xml') && !xmlContent.includes('<product>')) {
        setStatus({ 
          type: 'error', 
          message: 'Odpověď neobsahuje platné XML data' 
        });
        setIsImporting(false);
        return;
      }

      // Základní test počtu produktů
      const productMatches = xmlContent.match(/<product>/g);
      const productCount = productMatches ? productMatches.length : 0;

      setStatus({ 
        type: 'success', 
        message: `Připojení úspěšné! Nalezeno ${productCount} produktů.` 
      });
    } catch (error) {
      console.error('Error testing connection:', error);
      setStatus({ 
        type: 'error', 
        message: `Chyba při testování připojení: ${error instanceof Error ? error.message : String(error)}` 
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handler pro import dat
  const handleImport = async () => {
    setStatus({ type: 'info', message: 'Importuji produkty...' });
    setIsImporting(true);

    try {
      let xmlContent: string;
      
      if (importType === 'url') {
        // Získání dat z URL
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: customUrl }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
        }
        
        xmlContent = await response.text();
      } else {
        // Použití dat z textové oblasti
        if (!xmlData.trim()) {
          setStatus({ type: 'error', message: 'Zadejte XML data' });
          setIsImporting(false);
          return;
        }
        
        xmlContent = xmlData;
      }

      // Zpracování XML
      const products = parseXmlToProducts(xmlContent, importSource);
      
      if (products.length === 0) {
        setStatus({ type: 'error', message: 'Nebyly nalezeny žádné produkty v XML datech' });
        setIsImporting(false);
        return;
      }

      // Odeslání na API
      let apiResponse;
      
      if (importSource === 'cenik') {
        apiResponse = await api.importXmlCenik(JSON.stringify(products));
      } else {
        apiResponse = await api.importXmlPopisky(JSON.stringify(products));
      }

      setStatus({ 
        type: 'success', 
        message: `Import dokončen! Importováno ${products.length} produktů.` 
      });

      // Callback pro rodičovskou komponentu
      if (onImportComplete) {
        onImportComplete({
          count: products.length,
          source: importSource,
          success: true
        });
      }
    } catch (error) {
      console.error('Error importing data:', error);
      setStatus({ 
        type: 'error', 
        message: `Chyba při importu: ${error instanceof Error ? error.message : String(error)}` 
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Převod XML na pole produktů
  const parseXmlToProducts = (xmlContent: string, source: ImportSource) => {
    const products = [];
    const productRegex = /<product>([\s\S]*?)<\/product>/g;
    let match;
    
    while ((match = productRegex.exec(xmlContent)) !== null) {
      const productContent = match[1];
      const product: Record<string, any> = {};
      
      // Extrakce základních dat
      product.kod = extractXmlValue(productContent, "kod");
      product.ean = extractXmlValue(productContent, "ean");
      
      // Název je v obou feedech
      const nazev = extractXmlValue(productContent, "nazev");
      product.nazev = cleanText(nazev);
      
      if (source === 'cenik') {
        // Ceník specifická data
        product.cena_bez_dph = parseFloat(extractXmlValue(productContent, "vasecenabezdph")) || 0;
        product.cena_s_dph = parseFloat(extractXmlValue(productContent, "vasecenasdph")) || 0;
        product.dostupnost = parseInt(extractXmlValue(productContent, "dostupnost")) || 0;
        
        // Další cenové údaje
        product.eu_bez_dph = parseFloat(extractXmlValue(productContent, "eubezdph")) || 0;
        product.eu_s_dph = parseFloat(extractXmlValue(productContent, "eusdph")) || 0;
        
        const remaBezDph = extractXmlValue(productContent, "remabezdph");
        product.rema_bez_dph = remaBezDph ? parseFloat(remaBezDph) : null;
        
        const remaDph = extractXmlValue(productContent, "remadph");
        product.rema_dph = remaDph ? parseFloat(remaDph) : null;
      } else {
        // Popisky specifická data
        const kategorie = extractXmlValue(productContent, "kategorie");
        product.kategorie = cleanText(kategorie);
        
        const vyrobce = extractXmlValue(productContent, "vyrobce");
        product.vyrobce = cleanText(vyrobce);
        
        product.dodani = extractXmlValue(productContent, "dodani");
        product.minodber = extractXmlValue(productContent, "minodber");
        product.jednotka = extractXmlValue(productContent, "jednotka");
        
        // Extrakce popisu a krátkého popisu
        const kratkyPopis = extractXmlValue(productContent, "kratkypopis");
        product.kratky_popis = cleanText(kratkyPopis);
        
        const popis = extractXmlValue(productContent, "popis");
        product.popis = cleanText(popis);
        
        // Získání URL obrázku
        let obrazek = extractXmlValue(productContent, "obrazek");
        if (!obrazek) {
          // Pokus najít obrazek s id="1" pokud existuje
          const obrazekMatch = productContent.match(/<obrazek id="1">(.*?)<\/obrazek>/);
          if (obrazekMatch) {
            obrazek = obrazekMatch[1];
          }
        }
        product.obrazek = obrazek;
        
        // Parametry - můžou být ve více elmentech
        const parametry: string[] = [];
        const paramRegex = /<parametr>([\s\S]*?)<\/parametr>/g;
        let paramMatch;
        
        while ((paramMatch = paramRegex.exec(productContent)) !== null) {
          const paramContent = paramMatch[1];
          const paramNazev = extractXmlValue(paramContent, "nazev");
          const paramHodnota = extractXmlValue(paramContent, "hodnota");
          
          if (paramNazev && paramHodnota) {
            parametry.push(`${paramNazev}: ${paramHodnota}`);
          }
        }
        product.parametry = parametry.join("\n");
        
        // Extrakce dokumentů
        const dokumenty: string[] = [];
        
        // Datasheets
        const datasheetRegex = /<datasheet id="[^"]*">(.*?)<\/datasheet>/g;
        let datasheetMatch;
        while ((datasheetMatch = datasheetRegex.exec(productContent)) !== null) {
          dokumenty.push(`Datasheet: ${datasheetMatch[1]}`);
        }
        
        // Manuals
        const manualRegex = /<manual id="[^"]*">(.*?)<\/manual>/g;
        let manualMatch;
        while ((manualMatch = manualRegex.exec(productContent)) !== null) {
          dokumenty.push(`Manual: ${manualMatch[1]}`);
        }
        
        product.dokumenty = dokumenty.join("\n");
      }
      
      // Přidání produktu do pole, jen pokud má kód
      if (product.kod) {
        products.push(product);
      }
    }
    
    return products;
  };

  // Renderování komponenty
  return (
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: DS.spacing.md }}>
        Import produktů z Intelek.cz
      </h2>
      
      {status && (
        <DS.StatusMessage
          type={status.type}
          style={{ marginBottom: DS.spacing.md }}
        >
          {status.message}
        </DS.StatusMessage>
      )}
      
      <div style={{ marginBottom: DS.spacing.md, display: 'flex', justifyContent: 'center', gap: DS.spacing.md }}>
        <DS.Button
          variant={importType === 'url' ? 'primary' : 'outline'}
          onClick={() => setImportType('url')}
        >
          Import z URL
        </DS.Button>
        <DS.Button
          variant={importType === 'xml' ? 'primary' : 'outline'}
          onClick={() => setImportType('xml')}
        >
          Import z XML dat
        </DS.Button>
      </div>
      
      <div style={{ marginBottom: DS.spacing.md, borderRadius: DS.radii.md, padding: DS.spacing.md, border: `1px solid ${DS.colors.gray[200]}` }}>
        {importType === 'url' ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: DS.spacing.sm }}>
              <div style={{ marginBottom: DS.spacing.sm }}>
                <label style={DS.forms.label}>Vyberte zdroj importu:</label>
                <div style={{ display: 'flex', gap: DS.spacing.sm }}>
                  <DS.Button
                    variant={importSource === 'cenik' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setImportSource('cenik')}
                  >
                    Ceník
                  </DS.Button>
                  <DS.Button
                    variant={importSource === 'popisky' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setImportSource('popisky')}
                  >
                    Popisky
                  </DS.Button>
                </div>
              </div>
              
              <div>
                <label style={DS.forms.label}>URL pro import</label>
                <DS.Input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="URL pro stažení XML"
                  disabled={isImporting}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: DS.spacing.sm }}>
              <div style={{ marginBottom: DS.spacing.sm }}>
                <label style={DS.forms.label}>Vyberte typ dat:</label>
                <div style={{ display: 'flex', gap: DS.spacing.sm }}>
                  <DS.Button
                    variant={importSource === 'cenik' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setImportSource('cenik')}
                  >
                    Ceník
                  </DS.Button>
                  <DS.Button
                    variant={importSource === 'popisky' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setImportSource('popisky')}
                  >
                    Popisky
                  </DS.Button>
                </div>
              </div>
              
              <div>
                <label style={DS.forms.label}>XML data</label>
                <textarea
                  value={xmlData}
                  onChange={(e) => setXmlData(e.target.value)}
                  placeholder="Vložte XML data..."
                  style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: DS.spacing.sm,
                    borderRadius: DS.radii.md,
                    border: `1px solid ${DS.colors.gray[300]}`,
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }}
                  disabled={isImporting}
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      <div onClick={() => setIsExpanded(!isExpanded)} style={{ 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: DS.spacing.md, 
        color: DS.colors.primary.main
      }}>
        <span style={{ marginRight: DS.spacing.xs }}>
          {isExpanded ? '▼' : '►'}
        </span>
        <span>Rozšířené možnosti</span>
      </div>
      
      {isExpanded && (
        <div style={{ 
          marginBottom: DS.spacing.md, 
          padding: DS.spacing.md, 
          backgroundColor: DS.colors.gray[100], 
          borderRadius: DS.radii.md 
        }}>
          <p style={{ fontSize: DS.fontSizes.sm, marginBottom: DS.spacing.md, color: DS.colors.gray[600] }}>
            <strong>Tipy pro import:</strong><br />
            - URL pro ceník: {URL_CENIK}<br />
            - URL pro popisky: {URL_POPISKY}<br />
            - Před importem doporučujeme otestovat připojení<br />
            - Pro větší množství dat použijte přímý import z XML<br />
          </p>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <DS.Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={isImporting}
        >
          Otestovat připojení
        </DS.Button>
        
        <div style={{ display: 'flex', gap: DS.spacing.sm }}>
          {isModal && (
            <DS.Button
              variant="outline"
              onClick={onClose}
              disabled={isImporting}
            >
              Zavřít
            </DS.Button>
          )}
          <DS.Button
            variant="primary"
            onClick={handleImport}
            disabled={isImporting || (importType === 'xml' && !xmlData.trim())}
          >
            {isImporting ? 'Importuji...' : 'Spustit import'}
          </DS.Button>
        </div>
      </div>
    </div>
  );
};

export default IntelekImport;
