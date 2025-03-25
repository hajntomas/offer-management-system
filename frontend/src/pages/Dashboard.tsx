// frontend/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DS from '../components/DesignSystem';
import { api, Offer, Product } from '../services/api';

// Typ pro statistiky
interface DashboardStats {
  totalOffers: number;
  activeOffers: number;
  pendingOffers: number;
  productCount: number;
  totalValue: number;
  recentOffers: Offer[];
  topProducts: { 
    product: Product;
    count: number;
    value: number;
  }[];
}

export function Dashboard() {
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOffers: 0,
    activeOffers: 0,
    pendingOffers: 0,
    productCount: 0,
    totalValue: 0,
    recentOffers: [],
    topProducts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigace
  const navigate = useNavigate();

  // Kontrola přihlášení a načtení statistik
  useEffect(() => {
    // Ověření, zda je uživatel přihlášen
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    
    if (!loggedIn) {
      navigate('/login');
    } else {
      // Načtení dat uživatele
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      // Načtení statistik
      loadDashboardData();
    }
  }, [navigate]);
  
  // Načtení dat pro dashboard
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Načtení nabídek
      const offers = await api.getOffers();
      
      // Načtení produktů
      const products = await api.getProducts();
      
      // Výpočet statistik
      const activeOffers = offers.filter(o => o.stav === 'aktivní').length;
      const pendingOffers = offers.filter(o => o.stav === 'nová').length;
      const totalValue = offers.reduce((sum, offer) => sum + offer.celkova_cena_s_dph, 0);
      
      // Získání posledních 5 nabídek
      const recentOffers = [...offers]
        .sort((a, b) => new Date(b.datum_vytvoreni).getTime() - new Date(a.datum_vytvoreni).getTime())
        .slice(0, 5);
      
      // Výpočet nejčastěji nabízených produktů
      const productCounts: Record<string, { count: number, value: number, product?: Product }> = {};
      
      offers.forEach(offer => {
        offer.polozky.forEach(item => {
          if (!productCounts[item.produkt_id]) {
            productCounts[item.produkt_id] = { 
              count: 0, 
              value: 0,
              product: products.find(p => p.id === item.produkt_id || p.kod === item.produkt_id)
            };
          }
          
          productCounts[item.produkt_id].count += item.pocet;
          productCounts[item.produkt_id].value += item.cena_s_dph * item.pocet;
        });
      });
      
      // Seřazení podle počtu
      const topProducts = Object.entries(productCounts)
        .filter(([_, data]) => data.product) // Filtrování neexistujících produktů
        .map(([id, data]) => ({
          product: data.product!,
          count: data.count,
          value: data.value
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Nastavení statistik
      setStats({
        totalOffers: offers.length,
        activeOffers,
        pendingOffers,
        productCount: products.length,
        totalValue,
        recentOffers,
        topProducts
      });
      
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání dat');
      setIsLoading(false);
    }
  };

  // Odhlášení
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  // Formátování ceny
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Formátování data
  const formatDate = (dateString: string) => {
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

  return (
    <DS.PageLayout
      title="Dashboard"
      actions={
        <div style={{ display: 'flex', gap: DS.spacing.md, alignItems: 'center' }}>
          {user && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: DS.colors.gray[100],
              padding: `${DS.spacing.xs} ${DS.spacing.md}`,
              borderRadius: DS.radii.md,
              marginRight: DS.spacing.md
            }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                backgroundColor: DS.colors.primary.main,
                color: DS.colors.primary.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginRight: DS.spacing.sm
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                <div style={{ fontSize: DS.fontSizes.xs, color: DS.colors.gray[600] }}>
                  {user.role === 'admin' ? 'Administrátor' : 'Obchodník'}
                </div>
              </div>
            </div>
          )}
          <DS.Button
            variant="outline"
            onClick={handleLogout}
          >
            Odhlásit
          </DS.Button>
        </div>
      }
    >
      {/* Chybové hlášení */}
      {error && (
        <DS.StatusMessage type="error">
          {error}
        </DS.StatusMessage>
      )}

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
      ) : (
        <>
          {/* Statistické karty */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: DS.spacing.md,
            marginBottom: DS.spacing.xl
          }}>
            <DS.Card>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: DS.spacing.md 
              }}>
                <div style={{ color: DS.colors.gray[600], marginBottom: DS.spacing.sm }}>
                  Celkový počet nabídek
                </div>
                <div style={{ 
                  fontSize: DS.fontSizes['3xl'], 
                  fontWeight: 'bold', 
                  color: DS.colors.primary.main 
                }}>
                  {stats.totalOffers}
                </div>
              </div>
            </DS.Card>
            
            <DS.Card>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: DS.spacing.md 
              }}>
                <div style={{ color: DS.colors.gray[600], marginBottom: DS.spacing.sm }}>
                  Aktivní nabídky
                </div>
                <div style={{ 
                  fontSize: DS.fontSizes['3xl'], 
                  fontWeight: 'bold', 
                  color: DS.colors.success.main 
                }}>
                  {stats.activeOffers}
                </div>
              </div>
            </DS.Card>
            
            <DS.Card>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: DS.spacing.md 
              }}>
                <div style={{ color: DS.colors.gray[600], marginBottom: DS.spacing.sm }}>
                  Počet produktů
                </div>
                <div style={{ 
                  fontSize: DS.fontSizes['3xl'], 
                  fontWeight: 'bold', 
                  color: DS.colors.info.main 
                }}>
                  {stats.productCount}
                </div>
              </div>
            </DS.Card>
            
            <DS.Card>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                padding: DS.spacing.md 
              }}>
                <div style={{ color: DS.colors.gray[600], marginBottom: DS.spacing.sm }}>
                  Celková hodnota
                </div>
                <div style={{ 
                  fontSize: DS.fontSizes['3xl'], 
                  fontWeight: 'bold', 
                  color: DS.colors.primary.dark 
                }}>
                  {formatPrice(stats.totalValue)}
                </div>
              </div>
            </DS.Card>
          </div>
          
          {/* Rychlé akce */}
          <DS.Card title="Rychlé akce" style={{ marginBottom: DS.spacing.xl }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: DS.spacing.lg,
              padding: DS.spacing.md
            }}>
              <div 
                onClick={() => navigate('/offers')}
                style={{ 
                  backgroundColor: DS.colors.primary.light,
                  borderRadius: DS.radii.lg,
                  padding: DS.spacing.lg,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  ':hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: DS.shadows.md
                  }
                }}
              >
                <div style={{ 
                  fontSize: DS.fontSizes.xl,
                  fontWeight: 'bold',
                  color: DS.colors.primary.main,
                  marginBottom: DS.spacing.sm
                }}>
                  Správa nabídek
                </div>
                <div style={{ color: DS.colors.gray[600] }}>
                  Vytvářejte a spravujte nabídky
                </div>
              </div>
              
              <div 
                onClick={() => navigate('/products')}
                style={{ 
                  backgroundColor: DS.colors.success.light,
                  borderRadius: DS.radii.lg,
                  padding: DS.spacing.lg,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  ':hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: DS.shadows.md
                  }
                }}
              >
                <div style={{ 
                  fontSize: DS.fontSizes.xl,
                  fontWeight: 'bold',
                  color: DS.colors.success.main,
                  marginBottom: DS.spacing.sm
                }}>
                  Katalog produktů
                </div>
                <div style={{ color: DS.colors.gray[600] }}>
                  Procházejte a spravujte produkty
                </div>
              </div>
              
              <div 
                onClick={() => navigate('/offers')}
                style={{ 
                  backgroundColor: DS.colors.warning.light,
                  borderRadius: DS.radii.lg,
                  padding: DS.spacing.lg,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  ':hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: DS.shadows.md
                  }
                }}
              >
                <div style={{ 
                  fontSize: DS.fontSizes.xl,
                  fontWeight: 'bold',
                  color: DS.colors.warning.main,
                  marginBottom: DS.spacing.sm
                }}>
                  Vytvořit nabídku
                </div>
                <div style={{ color: DS.colors.gray[600] }}>
                  Rychlé vytvoření nové nabídky
                </div>
              </div>
            </div>
          </DS.Card>
          
          {/* Dvousloupcový layout pro poslední sekce */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
            gap: DS.spacing.xl,
            marginBottom: DS.spacing.xl
          }}>
            {/* Poslední nabídky */}
            <DS.Card title="Poslední nabídky">
              {stats.recentOffers.length === 0 ? (
                <div style={{ 
                  padding: DS.spacing.lg, 
                  textAlign: 'center', 
                  color: DS.colors.gray[600] 
                }}>
                  Žádné nabídky k zobrazení
                </div>
              ) : (
                <DS.Table
                  columns={[
                    { key: 'cislo', header: 'Číslo', width: '20%' },
                    { key: 'zakaznik', header: 'Zákazník', width: '30%' },
                    { 
                      key: 'datum_vytvoreni', 
                      header: 'Datum', 
                      width: '20%',
                      render: value => formatDate(value)
                    },
                    { 
                      key: 'celkova_cena_s_dph', 
                      header: 'Cena', 
                      width: '20%',
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
                          fontSize: DS.fontSizes.xs,
                          backgroundColor: getStatusColors(value).bg,
                          color: getStatusColors(value).text
                        }}>
                          {value}
                        </span>
                      )
                    }
                  ]}
                  data={stats.recentOffers}
                />
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginTop: DS.spacing.md 
              }}>
                <DS.Button
                  variant="outline"
                  onClick={() => navigate('/offers')}
                >
                  Zobrazit všechny nabídky
                </DS.Button>
              </div>
            </DS.Card>
            
            {/* Nejprodávanější produkty */}
            <DS.Card title="Nejčastěji nabízené produkty">
              {stats.topProducts.length === 0 ? (
                <div style={{ 
                  padding: DS.spacing.lg, 
                  textAlign: 'center', 
                  color: DS.colors.gray[600] 
                }}>
                  Žádné produkty k zobrazení
                </div>
              ) : (
                <DS.Table
                  columns={[
                    { 
                      key: 'product', 
                      header: 'Produkt', 
                      width: '40%',
                      render: (_, record) => (
                        <>
                          <div style={{ fontWeight: 'bold' }}>
                            {record.product.nazev}
                          </div>
                          <div style={{ fontSize: DS.fontSizes.xs, color: DS.colors.gray[600] }}>
                            {record.product.kod}
                          </div>
                        </>
                      )
                    },
                    { 
                      key: 'count', 
                      header: 'Počet', 
                      width: '20%',
                      align: 'center',
                      render: value => `${value} ks`
                    },
                    { 
                      key: 'value', 
                      header: 'Hodnota', 
                      width: '40%',
                      align: 'right',
                      render: value => formatPrice(value)
                    }
                  ]}
                  data={stats.topProducts}
                />
              )}
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                marginTop: DS.spacing.md 
              }}>
                <DS.Button
                  variant="outline"
                  onClick={() => navigate('/products')}
                >
                  Zobrazit všechny produkty
                </DS.Button>
              </div>
            </DS.Card>
          </div>
        </>
      )}
    </DS.PageLayout>
  );
}
