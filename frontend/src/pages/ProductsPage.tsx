// frontend/src/pages/ProductsPage.tsx
import { useEffect, useState, useRef } from 'react';
import { api, Product, ProductFilterOptions } from '../services/api';
import { ProductDetail } from '../components/ProductDetail';
import EnhancedIntelekImport from '../components/EnhancedIntelekImport';
import DS from '../components/DesignSystem';

// Typy zobrazení seznamu produktů
type ViewMode = 'standard' | 'table' | 'compact';

export function ProductsPage() {
  // Stav
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterManufacturer, setFilterManufacturer] = useState('');
  const [filterInStock, setFilterInStock] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  
  // Import modaly
  const [isXmlCenikModalOpen, setIsXmlCenikModalOpen] = useState(false);
  const [isXmlPopiskyModalOpen, setIsXmlPopiskyModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isIntelekModalOpen, setIsIntelekModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
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
  const [importHistory, setImportHistory] = useState<any[]>([]);
  
  // Načtení produktů
  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchManufacturers();
  }, [page, filterCategory, filterManufacturer, filterInStock]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    
    const options: ProductFilterOptions = {
      page,
      limit: 12,
      kategorie: filterCategory || undefined,
      vyrobce: filterManufacturer || undefined,
      search: searchTerm || undefined,
      inStock: filterInStock
    };
    
    try {
      const result = await api.getProducts(options);
      
      // Zpracování výsledků od API
      if (Array.isArray(result)) {
        setProducts(result);
        setTotalPages(1);
      } else if (result && typeof result === 'object') {
        if (Array.isArray(result.products)) {
          setProducts(result.products);
          if (result.pagination) {
            setTotalPages(result.pagination.totalPages || 1);
          }
        } else {
          setProducts([]);
          setTotalPages(1);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání produktů');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const categories = await api.getProductCategories();
      setCategories(categories || []);
    } catch (err) {
      console.error('Chyba při načítání kategorií:', err);
    }
  };
  
  const fetchManufacturers = async () => {
    try {
      const manufacturers = await api.getProductManufacturers();
      setManufacturers(manufacturers || []);
    } catch (err) {
      console.error('Chyba při načítání výrobců:', err);
    }
  };
  
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
  
  // Vyhledávání
  const handleSearch = () => {
    setPage(1); // Reset stránky při novém vyhledávání
    fetchProducts();
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
        setIsXmlCenikModalOpen(false);
        setImportXmlCenik('');
        setImportStatus('');
        fetchProducts(); // Znovu načíst produkty
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
        setIsXmlPopiskyModalOpen(false);
        setImportXmlPopisky('');
        setImportStatus('');
        fetchProducts(); // Znovu načíst produkty
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
        setIsExcelModalOpen(false);
        setImportExcelFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setImportStatus('');
        fetchProducts(); // Znovu načíst produkty
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Handler pro dokončení importu z Intelek
  const handleIntelekImportComplete = (result) => {
    // Aktualizace přehledu produktů po importu
    fetchProducts();
    // Zobrazení úspěšné zprávy
    setImportStatus(`Import z Intelek.cz dokončen: ${result.count} produktů`);
    // Automatické zavření modalu po 2 sekundách
    setTimeout(() => {
      setIsIntelekModalOpen(false);
      setImportStatus('');
    }, 2000);
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
        fetchProducts(); // Znovu načíst produkty
      }, 2000);
    } catch (err: any) {
      setImportStatus(`Chyba: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  
  // Formátování ceny
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '0 Kč';
    return `${new Intl.NumberFormat('cs-CZ').format(price)} Kč`;
  };
  
  // Formátování dostupnosti
  const formatAvailability = (availability: string | number): string => {
    if (typeof availability === 'number') {
      if (availability <= 0) return 'Není skladem';
      if (availability < 5) return `Skladem (${availability} ks)`;
      if (availability < 20) return 'Skladem';
      return 'Dostatek skladem';
    }
    return availability;
  };
  
  // Získání typu dostupnosti pro styling
  const getAvailabilityType = (availability: string | number): 'success' | 'error' | 'warning' => {
    if (typeof availability === 'number') {
      if (availability <= 0) return 'error';
      if (availability < 5) return 'warning';
      return 'success';
    }
    
    const availabilityLower = String(availability).toLowerCase();
    if (availabilityLower.includes('skladem')) return 'success';
    return 'error';
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
  
  // Generování typů importů
  const getImportTypeName = (type: string): string => {
    switch (type) {
      case 'xml_cenik': return 'XML Ceník';
      case 'xml_popisky': return 'XML Popisky';
      case 'excel': return 'Excel';
      case 'intelek': return 'Intelek.cz';
      default: return type;
    }
  };
  
  // Tabulka s historií importů pro použití v modalu
  const ImportHistoryTable = () => (
    <DS.Table
      columns={[
        { key: 'timestamp', header: 'Datum a čas', render: (value) => formatDate(value) },
        { key: 'type', header: 'Typ', render: (value) => getImportTypeName(value) },
        { key: 'products_count', header: 'Počet produktů' },
        { key: 'filename', header: 'Soubor', render: (value) => value || '-' }
      ]}
      data={importHistory}
    />
  );
  
  // Dropdown menu pro import
  const ImportDropdown = () => (
    <div style={{ position: 'relative' }}>
      <DS.Button 
        variant="success"
        onClick={() => setImportModalOpen(!importModalOpen)}
      >
        Import
      </DS.Button>
      
      {importModalOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '40px',
          width: '200px',
          backgroundColor: '#fff',
          border: `1px solid ${DS.colors.gray[200]}`,
          borderRadius: DS.radii.md,
          boxShadow: DS.shadows.md,
          zIndex: 10
        }}>
          <div style={{ padding: '5px 0' }}>
            <button
              onClick={() => {
                setImportModalOpen(false);
                setIsXmlCenikModalOpen(true);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: `${DS.spacing.sm} ${DS.spacing.md}`,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              Import XML ceníku
            </button>
            <button
              onClick={() => {
                setImportModalOpen(false);
                setIsXmlPopiskyModalOpen(true);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: `${DS.spacing.sm} ${DS.spacing.md}`,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              Import XML popisků
            </button>
            <button
              onClick={() => {
                setImportModalOpen(false);
                setIsExcelModalOpen(true);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: `${DS.spacing.sm} ${DS.spacing.md}`,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              Import Excel
            </button>
            <button
              onClick={() => {
                setImportModalOpen(false);
                setIsIntelekModalOpen(true);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: `${DS.spacing.sm} ${DS.spacing.md}`,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                // Zvýraznění nové položky
                backgroundColor: DS.colors.info.light,
                fontWeight: 'bold',
                color: DS.colors.info.main
              }}
            >
              Import z Intelek.cz
            </button>
            <hr style={{ margin: '5px 0', borderTop: `1px solid ${DS.colors.gray[200]}` }} />
            <button
              onClick={() => {
                setImportModalOpen(false);
                handleMergeProductData();
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: `${DS.spacing.sm} ${DS.spacing.md}`,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              Sloučit data
            </button>
            <button
              onClick={() => {
                setImportModalOpen(false);
                fetchImportHistory();
                setShowImportHistory(true);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: `${DS.spacing.sm} ${DS.spacing.md}`,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              Historie importů
            </button>
          </div>
        </div>
      )}
    </div>
  );
  
  // Vykreslení stránky s design systémem
  return (
    <DS.PageLayout 
      title="Katalog produktů"
      actions={
        <div style={{ display: 'flex', gap: DS.spacing.md }}>
          <DS.Button 
            variant="secondary"
            onClick={() => window.location.href = '/dashboard'}
          >
            Dashboard
          </DS.Button>
          <ImportDropdown />
        </div>
      }
    >
      {/* Stavové zprávy */}
      {error && (
        <DS.StatusMessage type="error">
          {error}
        </DS.StatusMessage>
      )}
      
      {importStatus && (
        <DS.StatusMessage 
          type={importStatus.startsWith('Chyba') ? 'error' : 'success'}
        >
          {importStatus}
        </DS.StatusMessage>
      )}
      
      {/* Filtrování a vyhledávání */}
      <DS.Card>
        <DS.Grid columns={2} gap="md">
          <DS.GridItem span={2}>
            <DS.Input
              label="Vyhledávání"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hledat podle názvu, kódu nebo popisu..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              style={{ display: 'flex', flexGrow: 1 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: DS.spacing.sm }}>
              <DS.Button 
                variant="primary"
                onClick={handleSearch}
              >
                Vyhledat
              </DS.Button>
            </div>
          </DS.GridItem>
          
          <DS.GridItem>
            <DS.Select
              label="Kategorie"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: '', label: 'Všechny kategorie' },
                ...categories.map(category => ({ value: category, label: category }))
              ]}
            />
          </DS.GridItem>
          
          <DS.GridItem>
            <DS.Select
              label="Výrobce"
              value={filterManufacturer}
              onChange={(e) => setFilterManufacturer(e.target.value)}
              options={[
                { value: '', label: 'Všichni výrobci' },
                ...manufacturers.map(manufacturer => ({ value: manufacturer, label: manufacturer }))
              ]}
            />
          </DS.GridItem>
        </DS.Grid>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: DS.spacing.md 
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="inStock"
              checked={filterInStock}
              onChange={(e) => setFilterInStock(e.target.checked)}
              style={DS.forms.checkbox}
            />
            <label htmlFor="inStock" style={{ fontSize: DS.fontSizes.sm }}>
              Pouze skladem
            </label>
          </div>
          
          <div>
            <DS.Button
              variant={viewMode === 'standard' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('standard')}
              style={{ borderRadius: '4px 0 0 4px' }}
            >
              Standardní
            </DS.Button>
            <DS.Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              style={{ borderRadius: '0' }}
            >
              Tabulka
            </DS.Button>
            <DS.Button
              variant={viewMode === 'compact' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('compact')}
              style={{ borderRadius: '0 4px 4px 0' }}
            >
              Kompaktní
            </DS.Button>
          </div>
        </div>
      </DS.Card>
      
      {/* Zobrazení seznamu produktů */}
      {isLoading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: DS.spacing['3xl'],
          color: DS.colors.primary.main
        }}>
          <div>Načítání produktů...</div>
        </div>
      ) : products.length === 0 ? (
        <DS.Card>
          <div style={{ textAlign: 'center', padding: DS.spacing.xl }}>
            <h3 style={{ 
              fontSize: DS.fontSizes.xl, 
              fontWeight: 'bold', 
              marginBottom: DS.spacing.md 
            }}>
              Žádné produkty
            </h3>
            <p style={{ color: DS.colors.gray[600] }}>
              Nebyly nalezeny žádné produkty odpovídající zadaným kritériím.
            </p>
          </div>
        </DS.Card>
      ) : (
        <>
          {/* Standardní zobrazení */}
          {viewMode === 'standard' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: DS.spacing.lg,
              marginBottom: DS.spacing.lg
            }}>
              {products.map(product => (
                <DS.Card key={product.kod}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: DS.spacing.sm
                  }}>
                    <h3 style={{
                      fontSize: DS.fontSizes.lg,
                      fontWeight: 'bold',
                      marginTop: 0,
                      marginBottom: DS.spacing.xs,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={product.nazev}>
                      {product.nazev}
                    </h3>
                    <div style={{
                      padding: `${DS.spacing.xs} ${DS.spacing.sm}`,
                      borderRadius: DS.radii.full,
                      fontSize: DS.fontSizes.xs,
                      fontWeight: 'bold',
                      backgroundColor: DS.colors[getAvailabilityType(product.dostupnost)].light,
                      color: DS.colors[getAvailabilityType(product.dostupnost)].hover
                    }}>
                      {formatAvailability(product.dostupnost)}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: DS.fontSizes.sm, color: DS.colors.gray[600], marginBottom: DS.spacing.xs }}>
                    Kód: {product.kod}
                  </div>
                  
                  {product.vyrobce && (
                    <div style={{ fontSize: DS.fontSizes.sm, color: DS.colors.gray[600], marginBottom: DS.spacing.xs }}>
                      Výrobce: {product.vyrobce}
                    </div>
                  )}
                  
                  {product.kategorie && (
                    <div style={{ fontSize: DS.fontSizes.sm, color: DS.colors.gray[600], marginBottom: DS.spacing.xs }}>
                      Kategorie: {product.kategorie}
                    </div>
                  )}
                  
                  {(product.kratky_popis || product.popis) && (
                    <div style={{
                      fontSize: DS.fontSizes.sm,
                      color: DS.colors.gray[600],
                      marginTop: DS.spacing.md,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }} title={product.kratky_popis || product.popis}>
                      {product.kratky_popis || product.popis}
                    </div>
                  )}
                  
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: DS.spacing.md,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                  }}>
                    <div>
                      <div style={{ fontSize: DS.fontSizes.lg, fontWeight: 'bold' }}>
                        {formatPrice(product.cena_s_dph)}
                      </div>
                      <div style={{ fontSize: DS.fontSizes.xs, color: DS.colors.gray[600] }}>
                        {formatPrice(product.cena_bez_dph)} bez DPH
                      </div>
                    </div>
                    <DS.Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedProductId(product.id || product.kod)}
                    >
                      Detail
                    </DS.Button>
                  </div>
                </DS.Card>
              ))}
            </div>
          )}
          
          {/* Tabulkové zobrazení */}
          {viewMode === 'table' && (
            <DS.Table
              columns={[
                { key: 'kod', header: 'Kód', width: '10%' },
                { key: 'nazev', header: 'Název', width: '25%' },
                { key: 'kategorie', header: 'Kategorie', width: '10%', render: value => value || '-' },
                { key: 'vyrobce', header: 'Výrobce', width: '10%', render: value => value || '-' },
                { 
                  key: 'cena_bez_dph', 
                  header: 'Cena bez DPH', 
                  width: '12%', 
                  align: 'right',
                  render: value => formatPrice(value) 
                },
                { 
                  key: 'cena_s_dph', 
                  header: 'Cena s DPH', 
                  width: '12%', 
                  align: 'right',
                  render: value => formatPrice(value) 
                },
                { 
                  key: 'dostupnost', 
                  header: 'Dostupnost', 
                  width: '13%',
                  render: (value, record) => (
                    <div style={{
                      display: 'inline-block',
                      padding: `${DS.spacing.xs} ${DS.spacing.sm}`,
                      borderRadius: DS.radii.full,
                      fontSize: DS.fontSizes.xs,
                      fontWeight: 'bold',
                      backgroundColor: DS.colors[getAvailabilityType(value)].light,
                      color: DS.colors[getAvailabilityType(value)].hover
                    }}>
                      {formatAvailability(value)}
                    </div>
                  )
                },
                { 
                  key: 'actions', 
                  header: 'Akce', 
                  width: '8%',
                  render: (_, record) => (
                    <DS.Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedProductId(record.id || record.kod)}
                    >
                      Detail
                    </DS.Button>
                  )
                },
              ]}
              data={products}
            />
          )}
          
          {/* Kompaktní zobrazení */}
          {viewMode === 'compact' && (
            <div style={{ 
              backgroundColor: '#fff',
              borderRadius: DS.radii.md,
              overflow: 'hidden',
              boxShadow: DS.shadows.sm 
            }}>
              {products.map(product => (
                <div 
                  key={product.kod} 
                  style={{
                    padding: `${DS.spacing.sm} ${DS.spacing.md}`,
                    borderBottom: `1px solid ${DS.colors.gray[200]}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: '1' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: DS.fontSizes.sm, 
                        color: DS.colors.gray[600], 
                        marginRight: DS.spacing.md, 
                        minWidth: '100px'
                      }}>
                        {product.kod}
                      </span>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{product.nazev}</div>
                        <div style={{ fontSize: DS.fontSizes.xs, color: DS.colors.gray[600] }}>
                          {product.kategorie && <span style={{ marginRight: DS.spacing.md }}>{product.kategorie}</span>}
                          {product.vyrobce && <span>{product.vyrobce}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: DS.spacing.lg
                  }}>
                    <span style={{ 
                      fontWeight: 'bold',
                      minWidth: '120px',
                      textAlign: 'right'
                    }}>
                      {formatPrice(product.cena_s_dph)}
                    </span>
                    <div style={{
                      padding: `${DS.spacing.xs} ${DS.spacing.sm}`,
                      borderRadius: DS.radii.full,
                      fontSize: DS.fontSizes.xs,
                      fontWeight: 'bold',
                      backgroundColor: DS.colors[getAvailabilityType(product.dostupnost)].light,
                      color: DS.colors[getAvailabilityType(product.dostupnost)].hover
                    }}>
                      {formatAvailability(product.dostupnost)}
                    </div>
                    <DS.Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedProductId(product.id || product.kod)}
                    >
                      Detail
                    </DS.Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Stránkování */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              margin: `${DS.spacing.lg} 0` 
            }}>
              <DS.Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ marginRight: DS.spacing.xs }}
              >
                Předchozí
              </DS.Button>
              
              <span style={{
                padding: `${DS.spacing.sm} ${DS.spacing.md}`,
                margin: `0 ${DS.spacing.xs}`,
                border: `1px solid ${DS.colors.gray[300]}`,
                backgroundColor: '#fff',
                borderRadius: DS.radii.md,
                cursor: 'default'
              }}>
                Stránka {page} z {totalPages}
              </span>
              
              <DS.Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ marginLeft: DS.spacing.xs }}
              >
                Další
              </DS.Button>
            </div>
          )}
        </>
      )}
      
      {/* Detail produktu */}
      {selectedProductId && (
        <ProductDetail
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}
      
      {/* Modal pro import XML ceníku */}
      <DS.Modal
        isOpen={isXmlCenikModalOpen}
        onClose={() => {
          setIsXmlCenikModalOpen(false);
          setImportXmlCenik('');
          setImportStatus('');
        }}
        title="Import produktů z XML ceníku"
        maxWidth="600px"
        footer={
          <>
            <DS.Button
              variant="outline"
              onClick={() => {
                setIsXmlCenikModalOpen(false);
                setImportXmlCenik('');
                setImportStatus('');
              }}
              disabled={isImporting}
            >
              Zrušit
            </DS.Button>
            <DS.Button
              variant="primary"
              onClick={handleImportXmlCenik}
              disabled={isImporting}
            >
              {isImporting ? 'Importuji...' : 'Importovat'}
            </DS.Button>
          </>
        }
      >
        <label style={DS.forms.label}>
          XML data ceníku
        </label>
        <textarea
          rows={10}
          value={importXmlCenik}
          onChange={e => setImportXmlCenik(e.target.value)}
          placeholder="Vložte XML data produktového ceníku..."
          style={{ 
            width: '100%', 
            padding: DS.spacing.sm,
            border: `1px solid ${DS.colors.gray[300]}`,
            borderRadius: DS.radii.md,
            minHeight: '200px'
          }}
          disabled={isImporting}
        />
        
        {importStatus && (
          <DS.StatusMessage 
            type={importStatus.startsWith('Chyba') ? 'error' : 'success'}
            style={{ marginTop: DS.spacing.md }}
          >
            {importStatus}
          </DS.StatusMessage>
        )}
      </DS.Modal>
      
      {/* Modal pro import XML popisků */}
      <DS.Modal
        isOpen={isXmlPopiskyModalOpen}
        onClose={() => {
          setIsXmlPopiskyModalOpen(false);
          setImportXmlPopisky('');
          setImportStatus('');
        }}
        title="Import produktů z XML popisků"
        maxWidth="600px"
        footer={
          <>
            <DS.Button
              variant="outline"
              onClick={() => {
                setIsXmlPopiskyModalOpen(false);
                setImportXmlPopisky('');
                setImportStatus('');
              }}
              disabled={isImporting}
            >
              Zrušit
            </DS.Button>
            <DS.Button
              variant="primary"
              onClick={handleImportXmlPopisky}
              disabled={isImporting}
            >
              {isImporting ? 'Importuji...' : 'Importovat'}
            </DS.Button>
          </>
        }
      >
        <label style={DS.forms.label}>
          XML data popisků
        </label>
        <textarea
          rows={10}
          value={importXmlPopisky}
          onChange={e => setImportXmlPopisky(e.target.value)}
          placeholder="Vložte XML data s popisky produktů..."
          style={{ 
            width: '100%', 
            padding: DS.spacing.sm,
            border: `1px solid ${DS.colors.gray[300]}`,
            borderRadius: DS.radii.md,
            minHeight: '200px'
          }}
          disabled={isImporting}
        />
        
        {importStatus && (
          <DS.StatusMessage 
            type={importStatus.startsWith('Chyba') ? 'error' : 'success'}
            style={{ marginTop: DS.spacing.md }}
          >
            {importStatus}
          </DS.StatusMessage>
        )}
      </DS.Modal>
      
      {/* Modal pro import Excel souboru */}
      <DS.Modal
        isOpen={isExcelModalOpen}
        onClose={() => {
          setIsExcelModalOpen(false);
          setImportExcelFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setImportStatus('');
        }}
        title="Import produktů z Excel souboru"
        maxWidth="600px"
        footer={
          <>
            <DS.Button
              variant="outline"
              onClick={() => {
                setIsExcelModalOpen(false);
                setImportExcelFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setImportStatus('');
              }}
              disabled={isImporting}
            >
              Zrušit
            </DS.Button>
            <DS.Button
              variant="primary"
              onClick={handleImportExcel}
              disabled={!importExcelFile || isImporting}
            >
              {isImporting ? 'Importuji...' : 'Importovat'}
            </DS.Button>
          </>
        }
      >
        <label style={DS.forms.label}>
          Excel soubor
        </label>
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx,.xls"
          onChange={e => setImportExcelFile(e.target.files ? e.target.files[0] : null)}
          style={{ 
            width: '100%', 
            padding: DS.spacing.sm,
            border: `1px solid ${DS.colors.gray[300]}`,
            borderRadius: DS.radii.md
          }}
          disabled={isImporting}
        />
        
        {importExcelFile && (
          <p style={{ marginTop: DS.spacing.sm, fontSize: DS.fontSizes.sm, color: DS.colors.gray[600] }}>
            Vybraný soubor: {importExcelFile.name} ({formatFileSize(importExcelFile.size)})
          </p>
        )}
        
        {importStatus && (
          <DS.StatusMessage 
            type={importStatus.startsWith('Chyba') ? 'error' : 'success'}
            style={{ marginTop: DS.spacing.md }}
          >
            {importStatus}
          </DS.StatusMessage>
        )}
      </DS.Modal>
      
      {/* Modal pro import z Intelek.cz */}
      <DS.Modal
        isOpen={isIntelekModalOpen}
        onClose={() => setIsIntelekModalOpen(false)}
        title="Import produktů z Intelek.cz"
        maxWidth="900px"
      >
        <EnhancedIntelekImport 
          onImportComplete={handleIntelekImportComplete}
          onClose={() => setIsIntelekModalOpen(false)}
          isModal={true}
        />
      </DS.Modal>
      
      {/* Modal pro historii importů */}
      <DS.Modal
        isOpen={showImportHistory}
        onClose={() => setShowImportHistory(false)}
        title="Historie importů produktů"
        maxWidth="800px"
        footer={
          <DS.Button
            variant="primary"
            onClick={() => setShowImportHistory(false)}
          >
            Zavřít
          </DS.Button>
        }
      >
        {importHistory.length === 0 ? (
          <p style={{ textAlign: 'center', color: DS.colors.gray[600], padding: `${DS.spacing.lg} 0` }}>
            Žádná historie importů nebyla nalezena.
          </p>
        ) : (
          <ImportHistoryTable />
        )}
      </DS.Modal>
    </DS.PageLayout>
  );
}
