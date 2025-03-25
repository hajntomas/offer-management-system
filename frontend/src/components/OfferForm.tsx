// frontend/src/components/OfferForm.tsx
import React, { useState, useEffect } from 'react';
import DS from '../components/DesignSystem';
import { Product, Offer, OfferItem } from '../services/api';
import { aiService, AiProductSuggestion } from '../services/aiService';

interface OfferFormProps {
  initialOffer?: Partial<Offer>;
  availableProducts: Product[];
  onSubmit: (offer: Omit<Offer, 'id' | 'cislo' | 'datum_vytvoreni'>) => void;
  onCancel: () => void;
}

export const OfferForm: React.FC<OfferFormProps> = ({
  initialOffer,
  availableProducts,
  onSubmit,
  onCancel
}) => {
  // Inicializace formuláře - buď s daty z initialOffer nebo s prázdnými hodnotami
  const [formData, setFormData] = useState<Omit<Offer, 'id' | 'cislo' | 'datum_vytvoreni'>>({
    nazev: initialOffer?.nazev || '',
    zakaznik: initialOffer?.zakaznik || '',
    platnost_do: initialOffer?.platnost_do || getDefaultExpiryDate(),
    celkova_cena_bez_dph: initialOffer?.celkova_cena_bez_dph || 0,
    celkova_cena_s_dph: initialOffer?.celkova_cena_s_dph || 0,
    polozky: initialOffer?.polozky || [],
    stav: initialOffer?.stav || 'nová'
  });
  
  // State pro AI asistenta
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    industry: '',
    size: '',
    requirements: ''
  });
  
  // State pro UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filter produktů při vyhledávání
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = availableProducts.filter(product => 
      product.nazev.toLowerCase().includes(searchLower) || 
      product.kod.toLowerCase().includes(searchLower)
    );
    
    setFilteredProducts(filtered.slice(0, 10)); // Omezení na 10 výsledků pro lepší výkon
  }, [searchTerm, availableProducts]);
  
  // Aktualizace celkové ceny při změně položek
  useEffect(() => {
    updateTotals();
  }, [formData.polozky]);
  
  // Pomocná funkce pro získání výchozího data splatnosti (30 dní od dnes)
  function getDefaultExpiryDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }
  
  // Aktualizace celkové ceny nabídky
  const updateTotals = () => {
    const totals = formData.polozky.reduce((acc, item) => ({
      celkova_cena_bez_dph: acc.celkova_cena_bez_dph + (item.cena_bez_dph * item.pocet),
      celkova_cena_s_dph: acc.celkova_cena_s_dph + (item.cena_s_dph * item.pocet)
    }), { celkova_cena_bez_dph: 0, celkova_cena_s_dph: 0 });
    
    setFormData(prevData => ({
      ...prevData,
      celkova_cena_bez_dph: totals.celkova_cena_bez_dph,
      celkova_cena_s_dph: totals.celkova_cena_s_dph
    }));
  };
  
  // Aktualizace hodnot formuláře
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Resetování chyby pro toto pole při změně
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Přidání produktu do nabídky
  const addProductToOffer = (product: Product, count: number = 1) => {
    const existingItemIndex = formData.polozky.findIndex(
      item => item.produkt_id === product.id || item.produkt_id === product.kod
    );
    
    let updatedItems;
    
    if (existingItemIndex >= 0) {
      // Aktualizace počtu existující položky
      updatedItems = [...formData.polozky];
      updatedItems[existingItemIndex].pocet += count;
    } else {
      // Přidání nové položky
      updatedItems = [
        ...formData.polozky,
        {
          produkt_id: product.id || product.kod,
          pocet: count,
          cena_bez_dph: product.cena_bez_dph,
          cena_s_dph: product.cena_s_dph
        }
      ];
    }
    
    setFormData(prevData => ({
      ...prevData,
      polozky: updatedItems
    }));
    
    setSearchTerm('');
    setSelectedProduct(null);
    setQuantity(1);
    
    // Zobrazení potvrzení
    setSuccessMessage(`Produkt ${product.nazev} přidán do nabídky`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  // Odebrání produktu z nabídky
  const removeProductFromOffer = (productId: string) => {
    const updatedItems = formData.polozky.filter(item => item.produkt_id !== productId);
    
    setFormData(prevData => ({
      ...prevData,
      polozky: updatedItems
    }));
  };
  
  // Aktualizace množství položky
  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    const updatedItems = formData.polozky.map(item => 
      item.produkt_id === productId 
        ? { ...item, pocet: quantity } 
        : item
    );
    
    setFormData(prevData => ({
      ...prevData,
      polozky: updatedItems
    }));
  };
  
  // Nalezení produktu podle ID
  const getProductById = (id: string): Product | undefined => {
    return availableProducts.find(p => p.id === id || p.kod === id);
  };
  
  // Formátování ceny
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '0,00 Kč';
    return `${price.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kč`;
  };
  
  // AI asistence
  const handleAiAssistance = async () => {
    if (!aiQuery.trim()) {
      setFormErrors(prev => ({ ...prev, aiQuery: 'Zadejte dotaz pro AI asistenta' }));
      return;
    }
    
    setIsAiLoading(true);
    setAiResponse(null);
    setFormErrors(prev => ({ ...prev, aiQuery: '' }));
    
    try {
      // Příprava kontextu pro AI
      const context = {
        products: availableProducts,
        customerInfo: {
          name: formData.zakaznik,
          industry: customerInfo.industry,
          size: customerInfo.size
        },
        currentOffer: formData,
        userPreferences: {
          requirements: customerInfo.requirements.split(',').map(r => r.trim())
        }
      };
      
      // Volání AI API
      const response = await aiService.getSuggestions(aiQuery, context);
      setAiResponse(response);
      
    } catch (err: any) {
      setFormErrors(prev => ({ ...prev, aiQuery: `Chyba AI: ${err.message}` }));
    } finally {
      setIsAiLoading(false);
    }
  };
  
  // Zpracování doporučení AI
  const handleAddRecommendedProduct = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId || p.kod === productId);
    if (product) {
      addProductToOffer(product);
    }
  };
  
  // Validace a odeslání formuláře
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Základní validace
    const errors: Record<string, string> = {};
    
    if (!formData.nazev) {
      errors.nazev = 'Zadejte název nabídky';
    }
    
    if (!formData.zakaznik) {
      errors.zakaznik = 'Zadejte zákazníka';
    }
    
    if (formData.polozky.length === 0) {
      errors.polozky = 'Přidejte alespoň jednu položku do nabídky';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Odeslání formuláře
    onSubmit(formData);
  };
  
  // Vytvoření textu pro nabídku pomocí AI
  const handleGenerateOfferText = async () => {
    if (formData.polozky.length === 0) {
      setFormErrors(prev => ({ ...prev, polozky: 'Přidejte produkty do nabídky pro vygenerování textu' }));
      return;
    }
    
    setIsAiLoading(true);
    
    try {
      // Příprava detailů nabídky pro AI
      const offerDetails = {
        nazev: formData.nazev,
        zakaznik: formData.zakaznik,
        produkty: formData.polozky.map(item => {
          const product = getProductById(item.produkt_id);
          return {
            nazev: product?.nazev || 'Neznámý produkt',
            pocet: item.pocet,
            cena: item.cena_s_dph
          };
        }),
        poznamky: customerInfo.requirements
      };
      
      // Generování textu
      const offerText = await aiService.generateOfferText(offerDetails);
      
      // Nastavení odpovědi AI
      setAiResponse({
        message: 'Vygenerovaný text nabídky:',
        text: offerText
      });
      
    } catch (err: any) {
      setFormErrors(prev => ({ ...prev, aiQuery: `Chyba při generování textu: ${err.message}` }));
    } finally {
      setIsAiLoading(false);
    }
  };
  
  // Komponenta pro zobrazení položek nabídky
  const OfferItems = () => {
    if (formData.polozky.length === 0) {
      return (
        <div style={{ 
          padding: DS.spacing.lg, 
          textAlign: 'center', 
          backgroundColor: DS.colors.gray[50],
          borderRadius: DS.radii.md,
          marginBottom: DS.spacing.md
        }}>
          <p>Zatím nebyly přidány žádné položky do nabídky</p>
        </div>
      );
    }
    
    return (
      <div style={{ marginBottom: DS.spacing.lg }}>
        <DS.Table
          columns={[
            { 
              key: 'produkt', 
              header: 'Produkt', 
              width: '35%',
              render: (_, record) => {
                const product = getProductById(record.produkt_id);
                return (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{product?.nazev || 'Neznámý produkt'}</div>
                    <div style={{ fontSize: DS.fontSizes.xs, color: DS.colors.gray[600] }}>
                      {product?.kod || record.produkt_id}
                    </div>
                  </div>
                );
              }
            },
            { 
              key: 'cena_s_dph', 
              header: 'Cena za kus', 
              width: '15%',
              align: 'right',
              render: (value) => formatPrice(value)
            },
            { 
              key: 'pocet', 
              header: 'Počet', 
              width: '20%',
              align: 'center',
              render: (value, record) => (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <button
                    onClick={() => updateItemQuantity(record.produkt_id, value - 1)}
                    style={{
                      padding: `${DS.spacing.xs} ${DS.spacing.sm}`,
                      border: `1px solid ${DS.colors.gray[300]}`,
                      borderRadius: `${DS.radii.md} 0 0 ${DS.radii.md}`,
                      backgroundColor: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={value}
                    onChange={(e) => updateItemQuantity(record.produkt_id, parseInt(e.target.value) || 1)}
                    style={{
                      width: '50px',
                      textAlign: 'center',
                      border: `1px solid ${DS.colors.gray[300]}`,
                      borderLeft: 'none',
                      borderRight: 'none',
                      padding: `${DS.spacing.xs} 0`
                    }}
                  />
                  <button
                    onClick={() => updateItemQuantity(record.produkt_id, value + 1)}
                    style={{
                      padding: `${DS.spacing.xs} ${DS.spacing.sm}`,
                      border: `1px solid ${DS.colors.gray[300]}`,
                      borderRadius: `0 ${DS.radii.md} ${DS.radii.md} 0`,
                      backgroundColor: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
              )
            },
            { 
              key: 'total', 
              header: 'Celkem', 
              width: '15%',
              align: 'right',
              render: (_, record) => formatPrice(record.cena_s_dph * record.pocet)
            },
            { 
              key: 'actions', 
              header: 'Akce', 
              width: '15%',
              render: (_, record) => (
                <DS.Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeProductFromOffer(record.produkt_id)}
                >
                  Odebrat
                </DS.Button>
              )
            }
          ]}
          data={formData.polozky}
          style={{ marginBottom: DS.spacing.sm }}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          marginTop: DS.spacing.md,
          borderTop: `1px solid ${DS.colors.gray[200]}`,
          paddingTop: DS.spacing.md
        }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: DS.spacing.xs }}>
              <span style={{ marginRight: DS.spacing.md, color: DS.colors.gray[700] }}>Cena bez DPH:</span>
              <span style={{ fontWeight: 'bold' }}>{formatPrice(formData.celkova_cena_bez_dph)}</span>
            </div>
            <div>
              <span style={{ marginRight: DS.spacing.md, color: DS.colors.gray[700] }}>Cena s DPH:</span>
              <span style={{ fontWeight: 'bold', fontSize: DS.fontSizes.lg }}>{formatPrice(formData.celkova_cena_s_dph)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: DS.spacing.lg }}>
        <DS.Grid columns={2} gap="lg">
          <DS.GridItem span={1}>
            <DS.Input
              label="Název nabídky"
              name="nazev"
              value={formData.nazev}
              onChange={handleInputChange}
              error={formErrors.nazev}
            />
          </DS.GridItem>
          <DS.GridItem span={1}>
            <DS.Input
              label="Zákazník"
              name="zakaznik"
              value={formData.zakaznik}
              onChange={handleInputChange}
              error={formErrors.zakaznik}
            />
          </DS.GridItem>
          <DS.GridItem span={1}>
            <DS.Input
              label="Platnost do"
              name="platnost_do"
              type="date"
              value={formData.platnost_do}
              onChange={handleInputChange}
            />
          </DS.GridItem>
          <DS.GridItem span={1}>
            <DS.Select
              label="Stav nabídky"
              name="stav"
              value={formData.stav}
              onChange={handleInputChange}
              options={[
                { value: 'nová', label: 'Nová' },
                { value: 'aktivní', label: 'Aktivní' },
                { value: 'odesláno', label: 'Odesláno' },
                { value: 'schváleno', label: 'Schváleno' },
                { value: 'zamítnuto', label: 'Zamítnuto' }
              ]}
            />
          </DS.GridItem>
        </DS.Grid>
      </div>
      
      {/* Rozšířené informace o zákazníkovi */}
      <DS.Card title="Informace o zákazníkovi a požadavcích">
        <div style={{ marginBottom: DS.spacing.md }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: DS.spacing.sm,
            cursor: 'pointer'
          }} onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}>
            <span style={{ fontWeight: 'bold', marginRight: DS.spacing.sm }}>
              {showAdvancedOptions ? '▼' : '►'} Rozšířené informace
            </span>
            <span style={{ fontSize: DS.fontSizes.sm, color: DS.colors.gray[600] }}>
              (volitelné, pomůže AI asistentovi s lepšími doporučeními)
            </span>
          </div>
          
          {showAdvancedOptions && (
            <DS.Grid columns={2} gap="md">
              <DS.GridItem span={1}>
                <DS.Input
                  label="Oblast podnikání zákazníka"
                  value={customerInfo.industry}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="Např. zdravotnictví, IT, vzdělávání..."
                />
              </DS.GridItem>
              <DS.GridItem span={1}>
                <DS.Input
                  label="Velikost zákazníka"
                  value={customerInfo.size}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="Např. malá firma, střední podnik, korporace..."
                />
              </DS.GridItem>
              <DS.GridItem span={2}>
                <div style={DS.forms.fieldGroup}>
                  <label style={DS.forms.label}>
                    Požadavky zákazníka
                  </label>
                  <textarea
                    value={customerInfo.requirements}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, requirements: e.target.value }))}
                    placeholder="Zadejte specifické požadavky zákazníka..."
                    style={{ 
                      width: '100%', 
                      padding: DS.spacing.sm,
                      border: `1px solid ${DS.colors.gray[300]}`,
                      borderRadius: DS.radii.md,
                      minHeight: '80px'
                    }}
                  />
                </div>
              </DS.GridItem>
            </DS.Grid>
          )}
        </div>
      </DS.Card>
      
      {/* Přidání produktů */}
      <DS.Card title="Položky nabídky" style={{ marginTop: DS.spacing.lg }}>
        {formErrors.polozky && (
          <DS.StatusMessage type="error" style={{ marginBottom: DS.spacing.md }}>
            {formErrors.polozky}
          </DS.StatusMessage>
        )}
        
        {successMessage && (
          <DS.StatusMessage type="success" style={{ marginBottom: DS.spacing.md }}>
            {successMessage}
          </DS.StatusMessage>
        )}
        
        <div style={{ marginBottom: DS.spacing.lg }}>
          <label style={DS.forms.label}>
            Vyhledat a přidat produkt
          </label>
          <div style={{ display: 'flex', marginBottom: DS.spacing.xs }}>
            <div style={{ flexGrow: 1, position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Vyhledat produkt podle názvu nebo kódu..."
                style={DS.forms.input}
              />
              
              {/* Dropdown s výsledky vyhledávání */}
              {searchTerm && filteredProducts.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  border: `1px solid ${DS.colors.gray[300]}`,
                  borderTop: 'none',
                  borderRadius: `0 0 ${DS.radii.md} ${DS.radii.md}`,
                  zIndex: 10,
                  maxHeight: '300px',
                  overflowY: 'auto',
                  boxShadow: DS.shadows.md
                }}>
                  {filteredProducts.map(product => (
                    <div
                      key={product.kod}
                      onClick={() => {
                        setSelectedProduct(product);
                        setSearchTerm('');
                      }}
                      style={{
                        padding: DS.spacing.sm,
                        borderBottom: `1px solid ${DS.colors.gray[200]}`,
                        cursor: 'pointer',
                        ':hover': {
                          backgroundColor: DS.colors.gray[50]
                        }
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>{product.nazev}</div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: DS.fontSizes.sm, 
                        color: DS.colors.gray[600] 
                      }}>
                        <span>{product.kod}</span>
                        <span>{formatPrice(product.cena_s_dph)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              marginLeft: DS.spacing.sm,
              borderRadius: DS.radii.md,
              border: `1px solid ${DS.colors.gray[300]}`,
              padding: `0 ${DS.spacing.xs}`
            }}>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                style={{
                  width: '60px',
                  border: 'none',
                  padding: DS.spacing.sm,
                  textAlign: 'center'
                }}
              />
              <span style={{ color: DS.colors.gray[600], fontSize: DS.fontSizes.sm }}>ks</span>
            </div>
            
            <DS.Button
              style={{ marginLeft: DS.spacing.sm }}
              onClick={() => {
                if (selectedProduct) {
                  addProductToOffer(selectedProduct, quantity);
                }
              }}
              disabled={!selectedProduct}
            >
              Přidat
            </DS.Button>
          </div>
        </div>
        
        {/* Seznam položek nabídky */}
        <OfferItems />
      </DS.Card>
      
      {/* AI asistent */}
      <DS.Card title="AI asistent pro tvorbu nabídek" style={{ marginTop: DS.spacing.lg }}>
        <div style={{ marginBottom: DS.spacing.md }}>
          <div style={{ display: 'flex', marginBottom: DS.spacing.sm }}>
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="Zeptejte se AI asistenta nebo požádejte o doporučení..."
              style={{ ...DS.forms.input, flexGrow: 1 }}
            />
            <DS.Button
              style={{ marginLeft: DS.spacing.sm }}
              onClick={handleAiAssistance}
              disabled={isAiLoading}
            >
              {isAiLoading ? 'Generuji...' : 'Zeptat se'}
            </DS.Button>
          </div>
          
          {formErrors.aiQuery && (
            <div style={{ color: DS.colors.danger.main, fontSize: DS.fontSizes.sm }}>
              {formErrors.aiQuery}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: DS.spacing.sm, marginTop: DS.spacing.sm }}>
            <DS.Button
              variant="outline"
              size="sm"
              onClick={() => setAiQuery('Doporuč mi produkty pro tohoto zákazníka')}
            >
              Doporučit produkty
            </DS.Button>
            <DS.Button
              variant="outline"
              size="sm"
              onClick={() => setAiQuery('Jak optimalizovat tuto nabídku?')}
            >
              Optimalizovat nabídku
            </DS.Button>
            <DS.Button
              variant="outline"
              size="sm"
              onClick={handleGenerateOfferText}
            >
              Generovat text nabídky
            </DS.Button>
          </div>
        </div>
        
        {/* Odpověď AI */}
        {aiResponse && (
          <div style={{ 
            marginTop: DS.spacing.md, 
            padding: DS.spacing.md, 
            backgroundColor: DS.colors.primary.light, 
            borderRadius: DS.radii.md,
            border: `1px solid ${DS.colors.primary.main}`
          }}>
            <h3 style={{ 
              fontSize: DS.fontSizes.md, 
              fontWeight: 'bold', 
              marginBottom: DS.spacing.sm,
              color: DS.colors.primary.dark
            }}>
              Odpověď AI asistenta:
            </h3>
            
            <p style={{ marginBottom: DS.spacing.md }}>
              {aiResponse.message}
            </p>
            
            {/* Doporučené produkty */}
            {aiResponse.products && aiResponse.products.length > 0 && (
              <div style={{ marginTop: DS.spacing.md }}>
                <h4 style={{ 
                  fontSize: DS.fontSizes.sm, 
                  fontWeight: 'bold', 
                  marginBottom: DS.spacing.sm,
                  color: DS.colors.gray[800]
                }}>
                  Doporučené produkty:
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: DS.spacing.md 
                }}>
                  {aiResponse.products.map((product: AiProductSuggestion) => {
                    const fullProduct = getProductById(product.id);
                    if (!fullProduct) return null;
                    
                    return (
                      <div key={product.id} style={{ 
                        border: `1px solid ${DS.colors.gray[200]}`,
                        borderRadius: DS.radii.md,
                        padding: DS.spacing.md,
                        backgroundColor: '#fff'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: DS.spacing.xs }}>
                          {product.nazev}
                        </div>
                        <div style={{ 
                          fontSize: DS.fontSizes.sm, 
                          color: DS.colors.gray[600], 
                          marginBottom: DS.spacing.sm 
                        }}>
                          {product.reason}
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center' 
                        }}>
                          <div style={{ fontWeight: 'bold' }}>
                            {formatPrice(fullProduct.cena_s_dph)}
                          </div>
                          <DS.Button
                            variant="success"
                            size="sm"
                            onClick={() => handleAddRecommendedProduct(product.id)}
                          >
                            Přidat
                          </DS.Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Vygenerovaný text */}
            {aiResponse.text && (
              <div style={{ marginTop: DS.spacing.md }}>
                <h4 style={{ 
                  fontSize: DS.fontSizes.sm, 
                  fontWeight: 'bold', 
                  marginBottom: DS.spacing.sm,
                  color: DS.colors.gray[800]
                }}>
                  Vygenerovaný text:
                </h4>
                <div style={{ 
                  backgroundColor: '#fff', 
                  padding: DS.spacing.md, 
                  borderRadius: DS.radii.md,
                  border: `1px solid ${DS.colors.gray[200]}`,
                  whiteSpace: 'pre-line'
                }}>
                  {aiResponse.text}
                </div>
              </div>
            )}
          </div>
        )}
      </DS.Card>
      
      {/* Tlačítka formuláře */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: DS.spacing.md, 
        marginTop: DS.spacing.xl,
        marginBottom: DS.spacing.xl
      }}>
        <DS.Button
          variant="outline"
          type="button"
          onClick={onCancel}
        >
          Zrušit
        </DS.Button>
        <DS.Button
          variant="primary"
          type="submit"
        >
          {initialOffer ? 'Aktualizovat nabídku' : 'Vytvořit nabídku'}
        </DS.Button>
      </div>
    </form>
  );
};
