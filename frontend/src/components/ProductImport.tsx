// frontend/src/components/ProductImport.tsx
import { useState, useRef } from 'react';
import { api } from '../services/api';

// Typ pro historii importů
type ImportHistoryItem = {
  type: string;
  timestamp: string;
  products_count: number;
  filename?: string;
};

// Typy importů
enum ImportType {
  XML_CENIK = 'xml_cenik',
  XML_POPISKY = 'xml_popisky',
  EXCEL = 'excel'
}

interface ProductImportProps {
  onImportComplete?: () => void;
}

export function ProductImport({ onImportComplete }: ProductImportProps) {
  // Stav pro aktivní záložku
  const [activeTab, setActiveTab] = useState<ImportType>(ImportType.XML_CENIK);
  
  // Data pro import
  const [importXmlCenik, setImportXmlCenik] = useState('');
  const [importXmlPopisky, setImportXmlPopisky] = useState('');
  const [importExcelFile, setImportExcelFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Status importu
  const [importStatus, setImportStatus] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  // Historie importů
  const [showImportHistory, setShowImportHistory] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  
  // Načtení historie importů
  const fetchImportHistory = async () => {
    try {
      const history = await api.getProductImportHistory();
      
      if (history && history.import_history) {
        setImportHistory(history.import_history);
      } else {
        setImportHistory([]);
      }
    } catch (err) {
      console.error('Chyba při načítání historie importů:', err);
      setImportHistory([]);
    }
  };
  
  // Import produktů z XML ceníku
  const handleImportXmlCenik = async () => {
    if (!importXmlCenik.trim()) {
      setImportStatus('Zadejte XML data');
      return;
    }
    
    setImportStatus('Importuji...');
    setIsImporting(true);
    
    try {
      const result = await api.importXmlCenik(importXmlCenik);
      setImportStatus(`Import dokončen: ${result.count} produktů`);
      setTimeout(() => {
        setImportXmlCenik('');
        setImportStatus('');
        if (onImportComplete) onImportComplete();
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Import produktů z XML popisků
  const handleImportXmlPopisky = async () => {
    if (!importXmlPopisky.trim()) {
      setImportStatus('Zadejte XML data');
      return;
    }
    
    setImportStatus('Importuji...');
    setIsImporting(true);
    
    try {
      const result = await api.importXmlPopisky(importXmlPopisky);
      setImportStatus(`Import dokončen: ${result.count} produktů`);
      setTimeout(() => {
        setImportXmlPopisky('');
        setImportStatus('');
        if (onImportComplete) onImportComplete();
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Import produktů z Excel souboru
  const handleImportExcel = async () => {
    if (!importExcelFile) {
      setImportStatus('Vyberte Excel soubor');
      return;
    }
    
    setImportStatus('Importuji...');
    setIsImporting(true);
    
    try {
      const result = await api.importExcel(importExcelFile);
      setImportStatus(`Import dokončen: ${result.count} produktů z ${result.filename}`);
      setTimeout(() => {
        setImportExcelFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setImportStatus('');
        if (onImportComplete) onImportComplete();
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Ruční sloučení dat produktů
  const handleMergeProductData = async () => {
    setImportStatus('Slučuji data...');
    setIsImporting(true);
    
    try {
      const result = await api.mergeProductData();
      setImportStatus(`Sloučení dokončeno: ${result.count} produktů`);
      setTimeout(() => {
        setImportStatus('');
        if (onImportComplete) onImportComplete();
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Pomocná funkce pro formátování data
  const formatDate = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleString();
    } catch (e) {
      return isoDate;
    }
  };
  
  // Pomocná funkce pro formátování velikosti souboru
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  };
  
  // Získání názvu typu importu
  const getImportTypeName = (type: string): string => {
    switch (type) {
      case 'xml_cenik': return 'XML Ceník';
      case 'xml_popisky': return 'XML Popisky';
      case 'excel': return 'Excel';
      default: return type;
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg">
      {/* Záhlaví */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-medium text-gray-900">Import produktů</h2>
      </div>
      
      {/* Záložky */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px" aria-label="Tabs">
          <button
            onClick={() => setActiveTab(ImportType.XML_CENIK)}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === ImportType.XML_CENIK
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            XML Ceník
          </button>
          <button
            onClick={() => setActiveTab(ImportType.XML_POPISKY)}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === ImportType.XML_POPISKY
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            XML Popisky
          </button>
          <button
            onClick={() => setActiveTab(ImportType.EXCEL)}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === ImportType.EXCEL
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Excel
          </button>
        </nav>
      </div>
      
      {/* Status importu */}
      {importStatus && (
        <div className={`m-6 p-4 rounded-md ${
          importStatus.startsWith('Chyba') 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : importStatus.startsWith('Import') || importStatus.startsWith('Sloučení')
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          {importStatus}
        </div>
      )}
      
      {/* Obsah záložek */}
      <div className="px-6 py-4">
        {/* XML Ceník */}
        {activeTab === ImportType.XML_CENIK && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              XML data ceníku
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Vložte XML data s ceníkem produktů. Zpracují se zejména kódy, EAN, ceny a dostupnost produktů.
            </p>
            <textarea
              rows={10}
              value={importXmlCenik}
              onChange={e => setImportXmlCenik(e.target.value)}
              placeholder="Vložte XML data produktového ceníku..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isImporting}
            ></textarea>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={handleImportXmlCenik}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                disabled={isImporting || !importXmlCenik.trim()}
              >
                {isImporting ? 'Importuji...' : 'Importovat ceník'}
              </button>
            </div>
          </div>
        )}
        
        {/* XML Popisky */}
        {activeTab === ImportType.XML_POPISKY && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              XML data popisků
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Vložte XML data s popisky produktů. Zpracují se zejména popisy, kategorie, parametry a odkazy na obrázky.
            </p>
            <textarea
              rows={10}
              value={importXmlPopisky}
              onChange={e => setImportXmlPopisky(e.target.value)}
              placeholder="Vložte XML data s popisky produktů..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isImporting}
            ></textarea>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={handleImportXmlPopisky}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                disabled={isImporting || !importXmlPopisky.trim()}
              >
                {isImporting ? 'Importuji...' : 'Importovat popisky'}
              </button>
            </div>
          </div>
        )}
        
        {/* Excel */}
        {activeTab === ImportType.EXCEL && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excel soubor
            </label>
            <p className="text-sm text-gray-500 mb-4">
              Nahrajte Excel soubor (XLSX nebo XLS) s produkty. Excel má nejvyšší prioritu a přepíše data z XML souborů.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={e => setImportExcelFile(e.target.files ? e.target.files[0] : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isImporting}
            />
            {importExcelFile && (
              <p className="mt-2 text-sm text-gray-600">
                Vybraný soubor: {importExcelFile.name} ({formatFileSize(importExcelFile.size)})
              </p>
            )}
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={handleImportExcel}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                disabled={isImporting || !importExcelFile}
              >
                {isImporting ? 'Importuji...' : 'Importovat Excel'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Dodatečné akce */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            <button
              onClick={handleMergeProductData}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
              disabled={isImporting}
            >
              {isImporting && importStatus.startsWith('Slučuji') ? 'Slučuji...' : 'Sloučit data manuálně'}
            </button>
            <button
              onClick={() => {
                fetchImportHistory();
                setShowImportHistory(true);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              disabled={isImporting}
            >
              Historie importů
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Data jsou slučována automaticky při každém importu</p>
          </div>
        </div>
      </div>
      
      {/* Modal pro historii importů */}
      {showImportHistory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Historie importů produktů</h3>
              <button
                onClick={() => setShowImportHistory(false)}
                className="text-gray-400 hover:text-gray-500 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {importHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Žádná historie importů nebyla nalezena.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum a čas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Počet produktů</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soubor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importHistory.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(item.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getImportTypeName(item.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.products_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                          {item.filename || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowImportHistory(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
