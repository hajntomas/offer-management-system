import { useEffect, useState } from 'react';

type Product = {
  id: string;
  kod: string;
  nazev: string;
  cena_bez_dph: number;
  cena_s_dph: number;
  dostupnost: string;
  kategorie: string;
  vyrobce: string;
  popis: string;
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/proxy/products', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Chyba při načítání produktů: ${response.status}`);
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err: any) {
        setError(err.message || 'Chyba při načítání produktů');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return <div className="p-6">Načítání produktů...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Katalog produktů</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="border rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{product.nazev}</h2>
            <p className="text-sm text-gray-600">Kód: {product.kod}</p>
            <p className="my-2">{product.popis.substring(0, 100)}...</p>
            <div className="mt-4 flex justify-between items-center">
              <div>
                <p className="font-bold">{product.cena_s_dph.toLocaleString()} Kč</p>
                <p className="text-sm text-gray-600">{product.cena_bez_dph.toLocaleString()} Kč bez DPH</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${product.dostupnost === 'skladem' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {product.dostupnost}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
