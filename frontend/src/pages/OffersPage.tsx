// frontend/src/pages/OffersPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DS from '../components/DesignSystem';
import { api, Offer, Product } from '../services/api';
import { OfferForm } from '../components/OfferForm';

export function OffersPage() {
  // State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [offerToEdit, setOfferToEdit] = useState<Offer | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Navigace
  const navigate = useNavigate();
  
  // Načtení dat při prvním renderu
  useEffect(() => {
    Promise.all([
      fetchOffers(),
      fetchProducts()
    ]);
  }, []);
  
  // Načtení nabídek
  const fetchOffers = async () => {
    try {
      const fetchedOffers = await api.getOffers();
      setOffers(fetchedOffers);
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání nabídek');
    }
  };
  
  // Načtení produktů
  const fetchProducts = async () => {
    try {
      const fetchedProducts = await api.getProducts();
      setProducts(fetchedProducts);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání produktů');
      setIsLoading(false);
    }
  };
  
  // Vytvoření nové nabídky
  const handleCreateOffer = async (offerData: Omit<Offer, 'id' | 'cislo' | 'datum_vytvoreni'>) => {
    try {
      const createdOffer = await api.createOffer(offerData);
      
      // Aktualizace seznamu nabídek
      setOffers([...offers, createdOffer]);
      
      // Zavření modalu a zobrazení úspěchu
      setIsCreateModalOpen(false);
      setSuccessMessage(`Nabídka ${createdOffer.cislo} byla úspěšně vytvořena`);
      
      // Automatické skrytí zprávy po 5 sekundách
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(`Chyba při vytváření nabídky: ${err.message}`);
    }
  };
  
  // Aktualizace existující nabídky
  const handleUpdateOffer = async (offerData: Omit<Offer, 'id' | 'cislo' | 'datum_vytvoreni'>) => {
    if (!offerToEdit) return;
    
    try {
      const updatedOffer = await api.updateOffer(offerToEdit.id, offerData);
      
      // Aktualizace seznamu nabídek
      setOffers(offers.map(offer => 
        offer.id === updatedOffer.id ? updatedOffer : offer
      ));
      
      // Zavření modalu a zobrazení úspěchu
      setIsEditModalOpen(false);
      setOfferToEdit(null);
      setSuccessMessage(`Nabídka ${updatedOffer.cislo} byla úspěšně aktualizována`);
      
      // Automatické skrytí zprávy po 5 sekundách
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(`Chyba při aktualizaci nabídky: ${err.message}`);
    }
  };
  
  // Smazání nabídky
  const handleDeleteOffer = async () => {
    if (!offerToDelete) return;
    
    try {
      await api.deleteOffer(offerToDelete.id);
      
      // Aktualizace seznamu nabídek
      setOffers(offers.filter(o => o.id !== offerToDelete.id));
      
      // Zavření modalu a zobrazení úspěchu
      setIsDeleteModalOpen(false);
      setOfferToDelete(null);
      setSuccessMessage(`Nabídka byla úspěšně smazána`);
      
      // Automatické skrytí zprávy po 5 sekundách
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setError(`Chyba při mazání nabídky: ${err.message}`);
      setIsDeleteModalOpen(false);
    }
  };
  
  // Nalezení produktu podle ID
  const getProductById = (id: string) => {
    return products.find(p => p.id === id || p.kod === id);
  };
  
  // Pomocná funkce pro formátování ceny
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '0 Kč';
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Formátování data
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };
  
  // Získání barev pro stav nabídky
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'aktivní':
        return { bg: DS.colors.success.light, text: DS.colors.success.hover };
      case 'nová':
        return { bg: DS.colors.info.light, text: DS.colors.info.hover };
      case 'odesláno':
        return { bg: DS.colors.warning.light, text: DS.colors.warning.hover };
      case 'schváleno':
        return { bg: DS.colors.success.light, text: DS.colors.success.hover };
      case 'zamítnuto':
        return { bg: DS.colors.danger.light, text: DS.colors.danger.hover };
      default:
        return { bg: DS.colors.gray[100], text: DS.colors.gray[700] };
    }
  };
  
  // Detail nabídky
  const OfferDetail = ({ offer }: { offer: Offer }) => (
    <>
      <DS.Grid columns={2} gap="md">
        <DS.GridItem span={1}>
          <div style={{ marginBottom: DS.spacing.md }}>
            <div style={{ fontSize: DS.fontSizes.sm, color: DS.colors.gray[600], marginBottom: DS.spacing.xs }}>
              Číslo nabídky
            </div>
            <div style={{ fontWeight: 'bold' }}>{offer.cislo}</div>
          </div>
        </DS.GridItem>
        <DS.GridItem span={1}>
          <div style={{ marginBottom: DS.spacing.md }}>
            <div style={{ fontSize: DS.fontSizes.sm, color: DS.colors.gray[600], marginBottom: DS.spacing.xs }}>
              Datum vytvoření
            </div>
            <div>{formatDate(offer.datum_vytvoreni)}</div>
          </div>
        </DS.GridItem>
        <DS.GridItem span={1}>
          <div style={{ marginBottom: DS.spacing.md }}>
            <div style={{ fontSize: DS.fontSizes.sm, color: DS.colors.gray[600], marginBottom: DS.spacing.xs }}>
              Zákazník
            </div>
            <div>{offer.zakaznik}</div>
          </div>
        </DS.GridItem>
        <DS.GridItem span={1}>
          <div style={{ marginBottom: DS.spacing.md }}>
            <div style={{ fontSize: DS.fontSizes.sm, color: DS.colors.gray[600], marginBottom: DS.spacing.xs }}>
              Platnost do
            </div>
            <div>{formatDate(offer.platnost_do)}</div>
          </div>
        </DS.GridItem>
        <DS.GridItem span={1}>
          <div style={{ marginBottom: DS.spacing.md }}>
            <div style={{ fontSize: DS.fontSizes.sm, color: DS.colors.gray[600], marginBottom: DS.spacing.xs }}>
              Stav
            </div>
            <div style={{
              display: 'inline-block',
              padding: `${DS.spacing.xs} ${DS.spacing.sm}`,
              borderRadius: DS.radii.full,
              backgroundColor: getStatusColors(offer.stav).bg,
              color: getStatusColors(offer.stav).text,
              fontWeight: 'bold',
              fontSize: DS.fontSizes.sm
            }}>
              {offer.stav}
            </div>
          </div>
        </DS.GridItem>
        <DS.GridItem span={1}>
          <div style={{ marginBottom: DS.spacing.md }}>
            <div style={{ fontSize: DS.fontSizes.sm, color: DS.colors.gray[600], marginBottom: DS.spacing.xs }}>
              Celková cena
            </div>
            <div style={{ fontWeight: 'bold' }}>{formatPrice(offer.celkova_cena_s_dph)}</div>
            <div style={{ fontSize: DS.fontSizes.xs, color: DS.colors.gray[600] }}>
              {formatPrice(offer.celkova_cena_bez_dph)} bez DPH
            </div>
          </div>
        </DS.GridItem>
      </DS.Grid>
      
      <div style={{ marginTop: DS.spacing.xl }}>
        <h3 style={{ 
          fontSize: DS.fontSizes.lg, 
          fontWeight: 'bold', 
          marginBottom: DS.spacing.md 
        }}>
          Položky nabídky
        </h3>
        
        {offer.polozky.length === 0 ? (
          <div style={{ 
            padding: DS.spacing.lg, 
            textAlign: 'center', 
            backgroundColor: DS.colors.gray[50],
            borderRadius: DS.radii.md
          }}>
            <p>Nabídka neobsahuje žádné položky</p>
          </div>
        ) : (
          <DS.Table
            columns={[
              { 
                key: 'product', 
                header: 'Produkt',
                width: '40%',
                render: (_, record) => {
                  const product = getProductById(record.produkt_id);
                  return (
                    <>
                      <div style={{ fontWeight: 'bold' }}>
                        {product?.nazev || 'Neznámý produkt'}
                      </div>
                      <div style={{ fontSize: DS.fontSizes.xs, color: DS.colors.gray[600] }}>
                        {product?.kod || record.produkt_id}
                      </div>
                    </>
                  );
                }
              },
              { 
                key: 'cena_s_dph', 
                header: 'Cena za kus',
                width: '20%',
                align: 'right',
                render: value => formatPrice(value)
              },
              { 
                key: 'pocet', 
                header: 'Počet',
                width: '15%',
                align: 'center',
                render: value => `${value} ks`
              },
              { 
                key: 'total', 
                header: 'Celkem',
                width: '25%',
                align: 'right',
                render: (_, record) => formatPrice(record.cena_s_dph * record.pocet)
              }
            ]}
            data={offer.polozky}
          />
        )}
      </div>
    </>
  );
  
  // Komponenta pro tabulku nabídek
  const OffersTable = () => (
    <DS.Table
      columns={[
        { 
          key: 'cislo', 
          header: 'Číslo',
          width: '15%'
        },
        { 
          key: 'nazev', 
          header: 'Název',
          width: '25%'
        },
        { 
          key: 'zakaznik', 
          header: 'Zákazník',
          width: '20%'
        },
        { 
          key: 'datum_vytvoreni', 
          header: 'Datum vytvoření',
          width: '15%',
          render: value => formatDate(value)
        },
        { 
          key: 'celkova_cena_s_dph', 
          header: 'Cena',
          width: '15%',
          align: 'right',
          render: value => formatPrice(value)
        },
        { 
          key: 'stav', 
          header: 'Stav',
          width: '10%',
          render: value => (
            <span style={{
              display: 'inline-block',
              padding: `${DS.spacing.xs} ${DS.spacing.sm}`,
              borderRadius: DS.radii.full,
              backgroundColor: getStatusColors(value).bg,
              color: getStatusColors(value).text,
              fontSize: DS.fontSizes.xs,
              fontWeight: 'bold'
            }}>
              {value}
            </span>
          )
        },
        { 
          key: 'actions', 
          header: 'Akce',
          render: (_, record) => (
            <div style={{ display: 'flex', gap: DS.spacing.xs, justifyContent: 'flex-end' }}>
              <DS.Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedOffer(record);
                  setIsDetailModalOpen(true);
                }}
              >
                Detail
              </DS.Button>
              <DS.Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOfferToEdit(record);
                  setIsEditModalOpen(true);
                }}
              >
                Upravit
              </DS.Button>
              <DS.Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setOfferToDelete(record);
                  setIsDeleteModalOpen(true);
                }}
              >
                Smazat
              </DS.Button>
            </div>
          )
        }
      ]}
      data={offers}
    />
  );
  
  return (
    <DS.PageLayout
      title="Správa nabídek"
      actions={
        <div style={{ display: 'flex', gap: DS.spacing.md }}>
          <DS.Button
            variant="secondary"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </DS.Button>
          <DS.Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Vytvořit nabídku
          </DS.Button>
        </div>
      }
    >
      {/* Status zprávy */}
      {error && (
        <DS.StatusMessage type="error">
          {error}
        </DS.StatusMessage>
      )}
      
      {successMessage && (
        <DS.StatusMessage type="success">
          {successMessage}
        </DS.StatusMessage>
      )}
      
      {/* Obsah stránky */}
      {isLoading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: DS.spacing['3xl'],
          color: DS.colors.primary.main 
        }}>
          <div>Načítání dat...</div>
        </div>
      ) : offers.length === 0 ? (
        <DS.Card>
          <div style={{ 
            textAlign: 'center', 
            padding: `${DS.spacing.xl} ${DS.spacing.md}` 
          }}>
            <h2 style={{ 
              fontSize: DS.fontSizes.xl, 
              fontWeight: 'bold', 
              marginBottom: DS.spacing.md 
            }}>
              Zatím nemáte žádné nabídky
            </h2>
            <p style={{ 
              color: DS.colors.gray[600], 
              marginBottom: DS.spacing.xl 
            }}>
              Začněte vytvořením nové nabídky pro vaše zákazníky.
            </p>
            <DS.Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Vytvořit první nabídku
            </DS.Button>
          </div>
        </DS.Card>
      ) : (
        <DS.Card>
          <OffersTable />
        </DS.Card>
      )}
      
      {/* Modal pro vytvoření nové nabídky */}
      <DS.Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Vytvořit novou nabídku"
        maxWidth="1200px"
      >
        <OfferForm
          availableProducts={products}
          onSubmit={handleCreateOffer}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </DS.Modal>
      
      {/* Modal pro úpravu nabídky */}
      <DS.Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setOfferToEdit(null);
        }}
        title={`Upravit nabídku ${offerToEdit?.cislo || ''}`}
        maxWidth="1200px"
      >
        {offerToEdit && (
          <OfferForm
            initialOffer={offerToEdit}
            availableProducts={products}
            onSubmit={handleUpdateOffer}
            onCancel={() => {
              setIsEditModalOpen(false);
              setOfferToEdit(null);
            }}
          />
        )}
      </DS.Modal>
      
      {/* Modal pro detail nabídky */}
      <DS.Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOffer(null);
        }}
        title={`Detail nabídky ${selectedOffer?.cislo || ''}`}
        maxWidth="800px"
        footer={
          <div style={{ display: 'flex', gap: DS.spacing.md }}>
            <DS.Button
              variant="outline"
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedOffer(null);
              }}
            >
              Zavřít
            </DS.Button>
            <DS.Button
              variant="success"
              onClick={() => alert('Export do PDF bude implementován v další fázi')}
            >
              Export PDF
            </DS.Button>
          </div>
        }
      >
        {selectedOffer && (
          <OfferDetail offer={selectedOffer} />
        )}
      </DS.Modal>
      
      {/* Modal pro potvrzení smazání nabídky */}
      <DS.Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setOfferToDelete(null);
        }}
        title="Smazat nabídku"
        maxWidth="500px"
        footer={
          <div style={{ display: 'flex', gap: DS.spacing.md }}>
            <DS.Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setOfferToDelete(null);
              }}
            >
              Zrušit
            </DS.Button>
            <DS.Button
              variant="danger"
              onClick={handleDeleteOffer}
            >
              Smazat
            </DS.Button>
          </div>
        }
      >
        <p style={{ marginBottom: DS.spacing.md }}>
          Opravdu chcete smazat nabídku <strong>{offerToDelete?.cislo}</strong> ({offerToDelete?.nazev})?
        </p>
        <p style={{ 
          backgroundColor: DS.colors.warning.light,
          padding: DS.spacing.md,
          borderRadius: DS.radii.md,
          color: DS.colors.warning.hover 
        }}>
          Tato akce je nevratná a všechna data spojená s touto nabídkou budou ztracena.
        </p>
      </DS.Modal>
    </DS.PageLayout>
  );
}
