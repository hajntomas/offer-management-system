// frontend/src/pages/DiagnosticsPage.tsx
// Stránka s nástroji pro diagnostiku API a systému

import { useEffect, useState } from 'react';
import { ApiTester } from '../components/ApiTester';

export function DiagnosticsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    // Ověření, zda je uživatel přihlášen
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    
    if (loggedIn) {
      // Načtení dat uživatele
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    
    // Získat základní informace o systému
    collectSystemInfo();
  }, []);

  // Získání základních informací o systému a prostředí
  const collectSystemInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      host: window.location.host,
      pathname: window.location.pathname,
      protocol: window.location.protocol,
      timestamp: new Date().toISOString(),
      apiUrl: '/api/proxy',
      authToken: localStorage.getItem('accessToken') ? 'Present' : 'Missing',
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    setSystemInfo(info);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Diagnostické nástroje
          </h1>
          <div className="flex items-center space-x-4">
            {isLoggedIn && user && (
              <>
                <span className="text-gray-700">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Odhlásit se
                </button>
              </>
            )}
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stav přihlášení */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Stav přihlášení</h2>
            <div className={`p-3 rounded-lg ${isLoggedIn ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {isLoggedIn ? 'Přihlášen' : 'Nepřihlášen'}
            </div>
            
            {isLoggedIn && user && (
              <div className="mt-4">
                <h3 className="text-md font-medium mb-2">Údaje uživatele</h3>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Jméno:</strong> {user.name}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Role:</strong> {user.role}</p>
                </div>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Token</h3>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                {localStorage.getItem('accessToken') ? (
                  <>
                    <p><strong>Status:</strong> <span className="text-green-600">Přítomen</span></p>
                    <p className="mt-1"><strong>Token:</strong></p>
                    <div className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {localStorage.getItem('accessToken')}
                    </div>
                  </>
                ) : (
                  <p><strong>Status:</strong> <span className="text-red-600">Chybí</span></p>
                )}
              </div>
            </div>
            
            {!isLoggedIn && (
              <div className="mt-4">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Přejít na přihlašovací stránku
                </button>
              </div>
            )}
          </div>
          
          {/* Systémové informace */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Systémové informace</h2>
            {systemInfo && (
              <div className="space-y-3 text-sm">
                <p><strong>User Agent:</strong> {systemInfo.userAgent}</p>
                <p><strong>Platforma:</strong> {systemInfo.platform}</p>
                <p><strong>Jazyk:</strong> {systemInfo.language}</p>
                <p><strong>Cookies:</strong> {systemInfo.cookiesEnabled ? 'Povoleny' : 'Zakázány'}</p>
                <p><strong>LocalStorage:</strong> {systemInfo.localStorage ? 'Dostupný' : 'Nedostupný'}</p>
                <p><strong>SessionStorage:</strong> {systemInfo.sessionStorage ? 'Dostupný' : 'Nedostupný'}</p>
                <p><strong>Rozlišení:</strong> {systemInfo.screenSize.width} x {systemInfo.screenSize.height}</p>
                <p><strong>Host:</strong> {systemInfo.host}</p>
                <p><strong>Path:</strong> {systemInfo.pathname}</p>
                <p><strong>Protokol:</strong> {systemInfo.protocol}</p>
                <p><strong>API URL:</strong> {systemInfo.apiUrl}</p>
                <p><strong>Auth Token:</strong> {systemInfo.authToken}</p>
                <p><strong>Čas:</strong> {new Date(systemInfo.timestamp).toLocaleString()}</p>
              </div>
            )}
          </div>
          
          {/* Rychlé akce */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Rychlé akce</h2>
            <div className="space-y-3">
              <button
                onClick={() => localStorage.clear()}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Vymazat LocalStorage
              </button>
              
              <button
                onClick={() => {
                  sessionStorage.clear();
                  alert('SessionStorage vymazán');
                }}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Vymazat SessionStorage
              </button>
              
              <button
                onClick={() => {
                  collectSystemInfo();
                  alert('Systémové informace aktualizovány');
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Aktualizovat systémové info
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Obnovit stránku
              </button>
              
              <button
                onClick={() => window.open('/api/diagnostic', '_blank')}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Spustit API diagnostiku
              </button>
            </div>
          </div>
        </div>

        {/* API Tester */}
        <ApiTester />
      </main>
    </div>
  );
}
