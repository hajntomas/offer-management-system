import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Ověření, zda je uživatel přihlášen
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    
    if (!loggedIn) {
      window.location.href = '/login';
    } else {
      // Načtení dat uživatele
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
  };

  if (!isLoggedIn || !user) {
    return <div className="p-4">Načítání...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">
              {user.name} ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Odhlásit se
            </button>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center bg-white">
              <h2 className="text-xl font-semibold mb-4">Vítejte v systému správy nabídek</h2>
              <p className="text-gray-600 mb-8">Toto je zjednodušená verze dashboardu, která bude později rozšířena.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-800 mb-2">Produkty</h3>
                  <p className="text-sm text-blue-600">Přidávejte a spravujte své produkty</p>
                   <button 
    onClick={() => navigate('/products')}
    className="mt-4 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
  >
    Spravovat produkty
  </button>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-medium text-green-800 mb-2">Nabídky</h3>
                  <p className="text-sm text-green-600">Vytvářejte a upravujte nabídky</p>
                  <button 
                    onClick={() => window.location.href = '/offers'}
                    className="mt-4 px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                  >
                    Vytvořit nabídku
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
