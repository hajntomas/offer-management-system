// frontend/src/pages/ProductsPage.tsx
import { useEffect, useState, useRef } from 'react';
import { api, Product, ProductFilterOptions } from '../services/api';
import { ProductDetail } from '../components/ProductDetail';

// Definujeme vlastní styly přímo v komponentě
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    background: '#fff',
    padding: '15px 20px',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  button: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
    color: 'white'
  },
  greenButton: {
    backgroundColor: '#10b981',
    color: 'white'
  },
  filterBox: {
    background: '#fff',
    padding: '15px',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    marginBottom: '15px'
  },
  filterItem: {
    flexGrow: 1,
    minWidth: '200px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px'
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#fff'
  },
  checkbox: {
    marginRight: '8px'
  },
  viewToggle: {
    display: 'flex',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  viewToggleButton: {
    padding: '8px 16px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#fff'
  },
  viewToggleActive: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  productContent: {
    padding: '15px',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  productHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px'
  },
  productTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '0',
    marginBottom: '5px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  availabilityBadge: {
    padding: '4px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  inStockBadge: {
    backgroundColor: '#d1fae5',
    color: '#047857'
  },
  outOfStockBadge: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c'
  },
  productInfo: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '5px'
  },
  productDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '10px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  productPrice: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: '15px'
  },
  priceBlock: {
    display: 'flex',
    flexDirection: 'column'
  },
  priceMain: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  priceSecondary: {
    fontSize: '12px',
    color: '#6b7280'
  },
  productTable: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '5px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tableHeader: {
    padding: '12px 15px',
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#4b5563',
    textTransform: 'uppercase'
  },
  tableCell: {
    padding: '12px 15px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '14px'
  },
  loadingSpinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    color: '#3b82f6'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    margin: '20px 0'
  },
  paginationButton: {
    padding: '8px 16px',
    margin: '0 4px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  paginationActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6'
  },
  emptyMessage: {
    backgroundColor: '#fff',
    padding: '30px',
    textAlign: 'center',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  modal: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    zIndex: 50
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '5px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0'
  },
  modalBody: {
    padding: '20px',
    overflowY: 'auto'
  },
  modalFooter: {
    padding: '15px 20px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  modalCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer'
  },
  statusMessage: {
    padding: '12px 15px',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  successMessage: {
    backgroundColor: '#d1fae5',
    color: '#047857'
  },
  errorMessage: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c'
  }
};

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
  
  // Získání stylu pro dostupnost
  const getAvailabilityStyle = (availability: string | number) => {
    if (typeof availability === 'number') {
      if (availability <= 0) return { ...styles.availabilityBadge, ...styles.outOfStockBadge };
      return { ...styles.availabilityBadge, ...styles.inStockBadge };
    }
    
    const availabilityLower = String(availability).toLowerCase();
    if (availabilityLower.includes('skladem')) return { ...styles.availabilityBadge, ...styles.inStockBadge };
    return { ...styles.availabilityBadge, ...styles.outOfStockBadge };
  };
  
  // Pomocná funkce pro formátování data
  const formatDate = (isoDate: string) => {
    try {
      return new Date(isoDate).toLocaleString();
    } catch (e) {
      return isoDate;
    }
  };
  
  return (
    <div style={styles.container}>
      {/* Záhlaví stránky */}
      <div style={styles.header}>
        <h1 style={styles.title}>Katalog produktů</h1>
        <div style={styles.buttonGroup}>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            style={{...styles.button, ...styles.secondaryButton}}
          >
            Dashboard
          </button>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setImportModalOpen(!importModalOpen)} 
              style={{...styles.button, ...styles.greenButton}}
            >
              Import
            </button>
            {importModalOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '40px',
                width: '200px',
                backgroundColor: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
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
                      padding: '8px 16px',
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
                      padding: '8px 16px',
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
                      padding: '8px 16px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    Import Excel
                  </button>
                  <hr style={{ margin: '5px 0', borderTop: '1px solid #e5e7eb' }} />
                  <button
                    onClick={() => {
                      setImportModalOpen(false);
                      handleMergeProductData();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 16px',
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
                      padding: '8px 16px',
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
        </div>
      </div>
      
      {/* Stavové zprávy */}
      {error && (
        <div style={{...styles.statusMessage, ...styles.errorMessage}}>
          {error}
        </div>
      )}
      
      {importStatus && (
        <div style={{
          ...styles.statusMessage, 
          ...(importStatus.startsWith('Chyba') ? styles.errorMessage : styles.successMessage)
        }}>
          {importStatus}
        </div>
      )}
      
      {/* Filtrování a vyhledávání */}
      <div style={styles.filterBox}>
        <div style={styles.filterRow}>
          <div style={styles.filterItem}>
            <label htmlFor="search" style={styles.label}>Vyhledávání</label>
            <div style={{ display: 'flex' }}>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Hledat podle názvu, kódu nebo popisu..."
                style={{ ...styles.input, borderRadius: '4px 0 0 4px' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <button
                onClick={handleSearch}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  borderRadius: '0 4px 4px 0',
                  padding: '8px 16px'
                }}
              >
                Hledat
              </button>
            </div>
          </div>
          
          <div style={styles.filterItem}>
            <label htmlFor="viewMode" style={styles.label}>Zobrazení</label>
            <div style={styles.viewToggle}>
              <button
                onClick={() => setViewMode('standard')}
                style={{
                  ...styles.viewToggleButton,
                  ...(viewMode === 'standard' ? styles.viewToggleActive : {})
                }}
              >
                Standardní
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  ...styles.viewToggleButton,
                  ...(viewMode === 'table' ? styles.viewToggleActive : {})
                }}
              >
                Tabulka
              </button>
              <button
                onClick={() => setViewMode('compact')}
                style={{
                  ...styles.viewToggleButton,
                  ...(viewMode === 'compact' ? styles.viewToggleActive : {})
                }}
              >
                Kompaktní
              </button>
            </div>
          </div>
        </div>
        
        <div style={styles.filterRow}>
          <div style={styles.filterItem}>
            <label htmlFor="category" style={styles.label}>Kategorie</label>
            <select
              id="category"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={styles.select}
            >
              <option value="">Všechny kategorie</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div style={styles.filterItem}>
            <label htmlFor="manufacturer" style={styles.label}>Výrobce</label>
            <select
              id="manufacturer"
              value={filterManufacturer}
              onChange={e => setFilterManufacturer(e.target.value)}
              style={styles.select}
            >
              <option value="">Všichni výrobci</option>
              {manufacturers.map(manufacturer => (
                <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
              ))}
            </select>
          </div>
          
          <div style={styles.filterItem}>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '25px' }}>
              <input
                type="checkbox"
                id="inStock"
                checked={filterInStock}
                onChange={e => setFilterInStock(e.target.checked)}
                style={styles.checkbox}
              />
              <label htmlFor="inStock">Pouze skladem</label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Zobrazení seznamu produktů */}
      {isLoading ? (
        <div style={styles.loadingSpinner}>
          <div>Načítání produktů...</div>
        </div>
      ) : products.length === 0 ? (
        <div style={styles.emptyMessage}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Žádné produkty</h3>
          <p style={{ color: '#6b7280' }}>Nebyly nalezeny žádné produkty odpovídající zadaným kritériím.</p>
        </div>
      ) : (
        <>
          {/* Standardní zobrazení */}
          {viewMode === 'standard' && (
            <>
              <div style={styles.productGrid}>
                {products.map(product => (
                  <div key={product.kod} style={styles.productCard}>
                    <div style={styles.productContent}>
                      <div style={styles.productHeader}>
                        <h3 style={styles.productTitle} title={product.nazev}>
                          {product.nazev}
                        </h3>
                        <span style={getAvailabilityStyle(product.dostupnost)}>
                          {formatAvailability(product.dostupnost)}
                        </span>
                      </div>
                      <p style={styles.productInfo}>Kód: {product.kod}</p>
                      {product.vyrobce && <p style={styles.productInfo}>Výrobce: {product.vyrobce}</p>}
                      {product.kategorie && <p style={styles.productInfo}>Kategorie: {product.kategorie}</p>}
                      
                      {product.kratky_popis ? (
                        <p style={styles.productDescription} title={product.kratky_popis}>
                          {product.kratky_popis}
                        </p>
                      ) : product.popis ? (
                        <p style={styles.productDescription} title={product.popis}>
                          {product.popis}
                        </p>
                      ) : null}
                      
                      <div style={styles.productPrice}>
                        <div style={styles.priceBlock}>
                          <span style={styles.priceMain}>
                            {formatPrice(product.cena_s_dph)}
                          </span>
                          <span style={styles.priceSecondary}>
                            {formatPrice(product.cena_bez_dph)} bez DPH
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedProductId(product.id || product.kod)}
                          style={{...styles.button, ...styles.primaryButton}}
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Stránkování */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      ...styles.paginationButton,
                      opacity: page === 1 ? 0.5 : 1,
                      cursor: page === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Předchozí
                  </button>
                  
                  <span style={{
                    ...styles.paginationButton,
                    cursor: 'default'
                  }}>
                    Stránka {page} z {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      ...styles.paginationButton,
                      opacity: page === totalPages ? 0.5 : 1,
                      cursor: page === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Další
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Tabulkové zobrazení */}
          {viewMode === 'table' && (
            <>
              <table style={styles.productTable}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Kód</th>
                    <th style={styles.tableHeader}>Název</th>
                    <th style={styles.tableHeader}>Kategorie</th>
                    <th style={styles.tableHeader}>Výrobce</th>
                    <th style={styles.tableHeader}>Cena bez DPH</th>
                    <th style={styles.tableHeader}>Cena s DPH</th>
                    <th style={styles.tableHeader}>Dostupnost</th>
                    <th style={styles.tableHeader}>Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.kod}>
                      <td style={styles.tableCell}>{product.kod}</td>
                      <td style={{ ...styles.tableCell, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.nazev}</td>
                      <td style={styles.tableCell}>{product.kategorie || '-'}</td>
                      <td style={styles.tableCell}>{product.vyrobce || '-'}</td>
                      <td style={{ ...styles.tableCell, textAlign: 'right' }}>{formatPrice(product.cena_bez_dph)}</td>
                      <td style={{ ...styles.tableCell, textAlign: 'right', fontWeight: 'bold' }}>{formatPrice(product.cena_s_dph)}</td>
                      <td style={styles.tableCell}>
                        <span style={getAvailabilityStyle(product.dostupnost)}>
                          {formatAvailability(product.dostupnost)}
                        </span>
                      </td>
                      <td style={styles.tableCell}>
                        <button
                          onClick={() => setSelectedProductId(product.id || product.kod)}
                          style={{...styles.button, ...styles.primaryButton, padding: '4px 8px', fontSize: '12px'}}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Stránkování */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      ...styles.paginationButton,
                      opacity: page === 1 ? 0.5 : 1,
                      cursor: page === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Předchozí
                  </button>
                  
                  <span style={{
                    ...styles.paginationButton,
                    cursor: 'default'
                  }}>
                    Stránka {page} z {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      ...styles.paginationButton,
                      opacity: page === totalPages ? 0.5 : 1,
                      cursor: page === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Další
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Kompaktní zobrazení */}
          {viewMode === 'compact' && (
            <div style={{ ...styles.productTable, display: 'block' }}>
              {products.map(product => (
                <div 
                  key={product.kod} 
                  style={{
                    padding: '10px 15px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fff'
                  }}
                >
                  <div style={{ flex: '1' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '14px', 
                        color: '#6b7280', 
                        marginRight: '10px', 
                        width: '100px'
                      }}>
                        {product.kod}
                      </span>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{product.nazev}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {product.kategorie && <span style={{ marginRight: '10px' }}>{product.kategorie}</span>}
                          {product.vyrobce && <span>{product.vyrobce}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '20px'
                  }}>
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      width: '120px',
                      textAlign: 'right'
                    }}>
                      {formatPrice(product.cena_s_dph)}
                    </span>
                    <span style={getAvailabilityStyle(product.dostupnost)}>
                      {formatAvailability(product.dostupnost)}
                    </span>
                    <button
                      onClick={() => setSelectedProductId(product.id || product.kod)}
                      style={{...styles.button, ...styles.primaryButton, padding: '4px 8px', fontSize: '12px'}}
                    >
                      Detail
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Stránkování */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      ...styles.paginationButton,
                      opacity: page === 1 ? 0.5 : 1,
                      cursor: page === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Předchozí
                  </button>
                  
                  <span style={{
                    ...styles.paginationButton,
                    cursor: 'default'
                  }}>
                    Stránka {page} z {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      ...styles.paginationButton,
                      opacity: page === totalPages ? 0.5 : 1,
                      cursor: page === totalPages ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Další
                  </button>
                </div>
              )}
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
      {isXmlCenikModalOpen && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Import produktů z XML ceníku</h3>
              <button
                onClick={() => {
                  setIsXmlCenikModalOpen(false);
                  setImportXmlCenik('');
                  setImportStatus('');
                }}
                style={styles.modalCloseButton}
              >
                &times;
              </button>
            </div>
            <div style={styles.modalBody}>
              <label style={{ ...styles.label, marginBottom: '10px' }}>
                XML data ceníku
              </label>
              <textarea
                rows={10}
                value={importXmlCenik}
                onChange={e => setImportXmlCenik(e.target.value)}
                placeholder="Vložte XML data produktového ceníku..."
                style={{ 
                  width: '100%', 
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '200px'
                }}
                disabled={isImporting}
              ></textarea>
              {importStatus && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  ...(importStatus.startsWith('Chyba') 
                    ? { backgroundColor: '#fee2e2', color: '#b91c1c' } 
                    : { backgroundColor: '#d1fae5', color: '#047857' })
                }}>
                  {importStatus}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  setIsXmlCenikModalOpen(false);
                  setImportXmlCenik('');
                  setImportStatus('');
                }}
                style={{
                  ...styles.button,
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  color: '#6b7280'
                }}
                disabled={isImporting}
              >
                Zrušit
              </button>
              <button
                onClick={handleImportXmlCenik}
                style={{...styles.button, ...styles.primaryButton}}
                disabled={isImporting}
              >
                {isImporting ? 'Importuji...' : 'Importovat'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pro import XML popisků */}
      {isXmlPopiskyModalOpen && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Import produktů z XML popisků</h3>
              <button
                onClick={() => {
                  setIsXmlPopiskyModalOpen(false);
                  setImportXmlPopisky('');
                  setImportStatus('');
                }}
                style={styles.modalCloseButton}
              >
                &times;
              </button>
            </div>
            <div style={styles.modalBody}>
              <label style={{ ...styles.label, marginBottom: '10px' }}>
                XML data popisků
              </label>
              <textarea
                rows={10}
                value={importXmlPopisky}
                onChange={e => setImportXmlPopisky(e.target.value)}
                placeholder="Vložte XML data s popisky produktů..."
                style={{ 
                  width: '100%', 
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  minHeight: '200px'
                }}
                disabled={isImporting}
              ></textarea>
              {importStatus && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  ...(importStatus.startsWith('Chyba') 
                    ? { backgroundColor: '#fee2e2', color: '#b91c1c' } 
                    : { backgroundColor: '#d1fae5', color: '#047857' })
                }}>
                  {importStatus}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  setIsXmlPopiskyModalOpen(false);
                  setImportXmlPopisky('');
                  setImportStatus('');
                }}
                style={{
                  ...styles.button,
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  color: '#6b7280'
                }}
                disabled={isImporting}
              >
                Zrušit
              </button>
              <button
                onClick={handleImportXmlPopisky}
                style={{...styles.button, ...styles.primaryButton}}
                disabled={isImporting}
              >
                {isImporting ? 'Importuji...' : 'Importovat'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pro import Excel souboru */}
      {isExcelModalOpen && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Import produktů z Excel souboru</h3>
              <button
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setImportExcelFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  setImportStatus('');
                }}
                style={styles.modalCloseButton}
              >
                &times;
              </button>
            </div>
            <div style={styles.modalBody}>
              <label style={{ ...styles.label, marginBottom: '10px' }}>
                Excel soubor
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                onChange={e => setImportExcelFile(e.target.files ? e.target.files[0] : null)}
                style={{ 
                  width: '100%', 
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                disabled={isImporting}
              />
              {importExcelFile && (
                <p style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
                  Vybraný soubor: {importExcelFile.name} ({formatFileSize(importExcelFile.size)})
                </p>
              )}
              {importStatus && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  ...(importStatus.startsWith('Chyba') 
                    ? { backgroundColor: '#fee2e2', color: '#b91c1c' } 
                    : { backgroundColor: '#d1fae5', color: '#047857' })
                }}>
                  {importStatus}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setImportExcelFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  setImportStatus('');
                }}
                style={{
                  ...styles.button,
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  color: '#6b7280'
                }}
                disabled={isImporting}
              >
                Zrušit
              </button>
              <button
                onClick={handleImportExcel}
                style={{
                  ...styles.button, 
                  ...styles.primaryButton,
                  opacity: (!importExcelFile || isImporting) ? 0.5 : 1
                }}
                disabled={!importExcelFile || isImporting}
              >
                {isImporting ? 'Importuji...' : 'Importovat'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pro historii importů */}
      {showImportHistory && (
        <div style={styles.modal}>
          <div style={{...styles.modalContent, maxWidth: '800px'}}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Historie importů produktů</h3>
              <button
                onClick={() => setShowImportHistory(false)}
                style={styles.modalCloseButton}
              >
                &times;
              </button>
            </div>
            <div style={styles.modalBody}>
              {importHistory.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px 0' }}>
                  Žádná historie importů nebyla nalezena.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{
                        padding: '8px 16px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#4b5563'
                      }}>
                        Datum a čas
                      </th>
                      <th style={{
                        padding: '8px 16px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#4b5563'
                      }}>
                        Typ
                      </th>
                      <th style={{
                        padding: '8px 16px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#4b5563'
                      }}>
                        Počet produktů
                      </th>
                      <th style={{
                        padding: '8px 16px',
                        textAlign: 'left',
                        borderBottom: '1px solid #e5e7eb',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#4b5563'
                      }}>
                        Soubor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {importHistory.map((item, index) => (
                      <tr key={index}>
                        <td style={{
                          padding: '8px 16px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px'
                        }}>
                          {formatDate(item.timestamp)}
                        </td>
                        <td style={{
                          padding: '8px 16px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px'
                        }}>
                          {item.type === 'xml_cenik' ? 'XML Ceník' :
                          item.type === 'xml_popisky' ? 'XML Popisky' :
                          item.type === 'excel' ? 'Excel' : item.type}
                        </td>
                        <td style={{
                          padding: '8px 16px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px'
                        }}>
                          {item.products_count}
                        </td>
                        <td style={{
                          padding: '8px 16px',
                          textAlign: 'left',
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '14px'
                        }}>
                          {item.filename || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowImportHistory(false)}
                style={{...styles.button, ...styles.primaryButton}}
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

// Pomocná funkce pro formátování velikosti souboru
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}
