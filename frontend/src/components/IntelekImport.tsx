// frontend/src/components/IntelekImport.tsx
import React, { useState, useEffect } from 'react';
import DS from '../components/DesignSystem';
import { api } from '../services/api';

// Rozšíření API služby o nové metody pro Intelek
declare module '../services/api' {
  interface ApiService {
    getIntelekXmlUrl(): Promise<{ url: string; level: string; token: string }>;
    testIntelekConnection(level: string, token: string): Promise<any>;
    importIntelekXml(options: { mode: 'url' | 'xml_data'; level?: string; token?: string; xml?: string }): Promise<any>;
  }
}

// Přidání nových metod do API
api.getIntelekXmlUrl = async function() {
  try {
    const response = await fetch('/api/products/intelek/url');
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error getting Intelek URL:', error);
    throw new Error(`Chyba při získávání URL pro Intelek XML: ${error.message}`);
  }
};

api.testIntelekConnection = async function(level: string, token: string) {
  try {
    const response = await fetch(`/api/products/intelek/test?level=${encodeURIComponent(level)}&token=${encodeURIComponent(token)}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    console.error('Error testing Intelek connection:', error);
    throw new Error(`Chyba při testování připojení k Intelek: ${error.message}`);
  }
};

api.importIntelekXml = async function(options) {
  try {
    const response = await fetch('/api/products/intelek/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error importing Intelek XML:', error);
    throw new Error(`Chyba při importu Intelek XML: ${error.message}`);
  }
};

interface IntelekImportProps {
  onImportComplete?: (result: any) => void;
  onClose?: () => void;
  isModal?: boolean;
}

const IntelekImport: React.FC<IntelekImportProps> = ({ onImportComplete, onClose, isModal = false }) => {
  // Stav pro konfiguraci
  const [level, setLevel] = useState<string>('54003830');
  const [token, setToken] = useState<string>('PGC%2FbX15XeK%2FkGaBq7VN4A%3D%3D');
  const [importMode, setImportMode] = useState<'url' | 'xml_data'>('url');
  const [xmlData, setXmlData] = useState<string>('');
  
  // Stav pro UI
  const [url, setUrl] = useState<string>('');
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  
  // Načtení výchozí konfigurace
  useEffect(() => {
    loadDefaultConfig();
  }, []);
  
  // Načtení výchozí konfigurace z API
  const loadDefaultConfig = async () => {
    try {
      const config = await api.getIntelekXmlUrl();
      setLevel(config.level);
      setToken(config.token);
      setUrl(config.url);
    } catch (err: any) {
      setError(`Chyba při načítání konfigurace: ${err.message}`);
    }
  };
  
  // Testování připojení k Intelek.cz
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    setError('');
    
    try {
      const result = await api.testIntelekConnection(level, token);
      setTestResult(result);
      
      if (!result.success) {
        setError(`Test připojení selhal: ${result.error}`);
      }
    } catch (err: any) {
      setError(`Chyba při testování připojení: ${err.message}`);
      setTestResult({ success: false });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  // Import produktů z Intelek XML
  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    setError('');
    
    try {
      let importOptions: any = {};
      
      if (importMode === 'url') {
        importOptions = {
          mode: 'url',
          level,
          token
        };
      } else {
        if (!xmlData.trim()) {
          throw new Error('XML data jsou prázdná');
        }
        
        importOptions = {
          mode: 'xml_data',
          xml: xmlData
        };
      }
      
      const result = await api.importIntelekXml(importOptions);
      setImportResult(result);
      
      if (onImportComplete) {
        onImportComplete(result);
      }
    } catch (err: any) {
      setError(`Chyba při importu: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Přepínání režimu importu
  const handleImportModeChange = (mode: 'url' | 'xml_data') => {
    setImportMode(mode);
    setImportResult(null);
    setError('');
  };
  
  // Formátování data a času
  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Komponenta pro zobrazení obsahu
  const IntelekImportContent = () => (
    <>
      {error && (
        <DS.StatusMessage type="error" style={{ marginBottom: DS.spacing.md }}>
          {error}
        </DS.StatusMessage>
      )}
      
      {importResult && importResult.message && (
        <DS.StatusMessage type="success" style={{ marginBottom: DS.spacing.md }}>
          {importResult.message} - Celkem importováno: {importResult.count} produktů
        </DS.StatusMessage>
      )}
      
      <DS.Card title="Import produktů z Intelek.cz">
        {/* Přepínač režimu importu */}
        <div style={{ marginBottom: DS.spacing.md }}>
          <div style={{ display: 'flex', gap: DS.spacing.sm, marginBottom: DS.spacing.md }}>
            <DS.Button
              variant={importMode === 'url' ? 'primary' : 'outline'}
              onClick={() => handleImportModeChange('url')}
            >
              Import z URL
            </DS.Button>
            <DS.Button
              variant={importMode === 'xml_data' ? 'primary' : 'outline'}
              onClick={() => handleImportModeChange('xml_data')}
            >
              Import z XML dat
            </DS.Button>
          </div>
          
          {/* Rozšířené možnosti - jen pro importování z URL */}
          {importMode === 'url' && (
            <div style={{ marginTop: DS.spacing.sm }}>
              <div 
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center',
                  marginBottom: DS.spacing.sm
                }}
              >
                <span style={{ fontWeight: 'bold', marginRight: DS.spacing.xs }}>
                  {isAdvancedMode ? '▼' : '►'}
                </span>
                <span>Rozšířené možnosti</span>
              </div>
              
              {isAdvancedMode && (
                <DS.Grid columns={2} gap="md">
                  <DS.GridItem span={1}>
                    <DS.Input
                      label="Level (kategorie)"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      placeholder="např. 54003830"
                    />
                  </DS.GridItem>
                  <DS.GridItem span={1}>
                    <DS.Input
                      label="Přístupový token"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Přístupový token pro Intelek.cz"
                    />
                  </DS.GridItem>
                </DS.Grid>
              )}
            </div>
          )}
          
          {/* XML Import sekce */}
          {importMode === 'xml_data' && (
            <div style={{ marginTop: DS.spacing.md }}>
              <label style={DS.forms.label}>XML data</label>
              <textarea
                value={xmlData}
                onChange={(e) => setXmlData(e.target.value)}
                placeholder="Vložte XML data z Intelek.cz"
                style={{ 
                  width: '100%', 
                  padding: DS.spacing.sm,
                  border: `1px solid ${DS.colors.gray[300]}`,
                  borderRadius: DS.radii.md,
                  minHeight: '200px'
                }}
                disabled={isImporting}
              />
            </div>
          )}
          
          {/* URL import sekce */}
          {importMode === 'url' && (
            <div style={{ marginTop: DS.spacing.md }}>
              <div style={{ marginBottom: DS.spacing.md }}>
                <label style={DS.forms.label}>URL pro import</label>
                <div style={{ 
                  padding: DS.spacing.sm,
                  border: `1px solid ${DS.colors.gray[300]}`,
                  borderRadius: DS.radii.md,
                  backgroundColor: DS.colors.gray[50],
                  overflowX: 'auto',
                  fontSize: DS.fontSizes.sm
                }}>
                  {url || `https://www.intelek.cz/export_cena.jsp?level=${level}&xml=true&x=${token}`}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: DS.spacing.md, marginBottom: DS.spacing.xl }}>
                <DS.Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                >
                  {isTestingConnection ? 'Testování...' : 'Otestovat připojení'}
                </DS.Button>
                
                <DS.Button
                  variant="primary"
                  onClick={handleImport}
                  disabled={isImporting}
                >
                  {isImporting ? 'Importování...' : 'Spustit import'}
                </DS.Button>
              </div>
              
              {/* Výsledek testu připojení */}
              {testResult && (
                <div style={{ 
                  marginBottom: DS.spacing.lg,
                  padding: DS.spacing.md,
                  border: `1px solid ${testResult.success ? DS.colors.success.main : DS.colors.danger.main}`,
                  borderRadius: DS.radii.md,
                  backgroundColor: testResult.success ? DS.colors.success.light : DS.colors.danger.light
                }}>
                  <h3 style={{ 
                    fontWeight: 'bold', 
                    marginBottom: DS.spacing.sm,
                    color: testResult.success ? DS.colors.success.hover : DS.colors.danger.hover
                  }}>
                    {testResult.success ? 'Připojení úspěšné' : 'Připojení selhalo'}
                  </h3>
                  
                  {testResult.success && testResult.isXml && (
                    <div>
                      <p style={{ marginBottom: DS.spacing.xs }}>XML data jsou k dispozici</p>
                      <p style={{ marginBottom: DS.spacing.xs }}>Velikost dat: {testResult.contentLength} bytů</p>
                      {testResult.preview && (
                        <div>
                          <p style={{ fontWeight: 'bold', marginBottom: DS.spacing.xs }}>Náhled:</p>
                          <pre style={{ 
                            fontSize: DS.fontSizes.xs,
                            padding: DS.spacing.sm,
                            backgroundColor: 'rgba(255, 255, 255, 0.5)',
                            borderRadius: DS.radii.sm,
                            overflowX: 'auto'
                          }}>
                            {testResult.preview}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!testResult.success && testResult.error && (
                    <p style={{ color: DS.colors.danger.hover }}>
                      Důvod: {testResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DS.Card>
      
      {/* Výsledek importu */}
      {importResult && (
        <DS.Card title="Výsledek importu" style={{ marginTop: DS.spacing.lg }}>
          <div style={{ marginBottom: DS.spacing.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: DS.spacing.xs }}>
              <span style={{ fontWeight: 'bold' }}>Stav:</span>
              <span>{importResult.error ? 'Chyba' : 'Úspěch'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: DS.spacing.xs }}>
              <span style={{ fontWeight: 'bold' }}>Počet importovaných produktů:</span>
              <span>{importResult.count || 0}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: DS.spacing.xs }}>
              <span style={{ fontWeight: 'bold' }}>Zdroj:</span>
              <span>{importResult.source || 'intelek_xml'}</span>
            </div>
            
            {importResult.timestamp && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: DS.spacing.xs }}>
                <span style={{ fontWeight: 'bold' }}>Čas importu:</span>
                <span>{formatDateTime(importResult.timestamp)}</span>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: DS.spacing.lg }}>
            <DS.Button
              variant="primary"
              onClick={handleImport}
              disabled={isImporting}
            >
              Importovat znovu
            </DS.Button>
          </div>
        </DS.Card>
      )}
      
      {/* Tlačítka pro modální verzi */}
      {isModal && onClose && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginTop: DS.spacing.xl
        }}>
          <DS.Button variant="outline" onClick={onClose}>
            Zavřít
          </DS.Button>
        </div>
      )}
    </>
  );
  
  // Vrací buď samostatnou komponentu nebo obsah pro modální okno
  if (isModal) {
    return <IntelekImportContent />;
  }
  
  return (
    <div style={DS.containers.page}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: DS.spacing.lg 
      }}>
        <h1 style={DS.typography.pageTitle}>Import z Intelek.cz</h1>
        
        {onClose && (
          <DS.Button variant="outline" onClick={onClose}>
            Zpět
          </DS.Button>
        )}
      </div>
      
      <IntelekImportContent />
    </div>
  );
};

export default IntelekImport;
