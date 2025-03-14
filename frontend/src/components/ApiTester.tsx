// frontend/src/components/ApiTester.tsx
// Komponenta pro testování a diagnostiku API

import { useState } from 'react';
import { api } from '../services/api';

type TestResult = {
  endpoint: string;
  success: boolean;
  status?: number;
  time?: string;
  data?: any;
  error?: string;
  timestamp: string;
};

export function ApiTester() {
  const [endpointToTest, setEndpointToTest] = useState('/products');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Předefinované endpointy pro testování
  const predefinedEndpoints = [
    { name: 'Root', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'Offers', path: '/offers' },
    { name: 'Backend API Directly', path: 'https://broad-darkness-f0a6.hajn-tomas.workers.dev/' },
    { name: 'API Diagnostic', path: '/api/diagnostic' }
  ];
  
  // Funkce pro testování endpointu
  const testEndpoint = async () => {
    setIsLoading(true);
    
    const startTime = Date.now();
    
    try {
      // Testovaný endpoint
      const data = await api.testEndpoint(endpointToTest);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Přidání výsledku testu
      setTestResults(prev => [
        {
          endpoint: endpointToTest,
          success: true,
          status: 200,
          time: `${duration}ms`,
          data,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
    } catch (error: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Přidání chybového výsledku
      setTestResults(prev => [
        {
          endpoint: endpointToTest,
          success: false,
          status: error.status,
          time: `${duration}ms`,
          error: error.message || 'Unknown error',
          data: error.details || error,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funkce pro zobrazení data v čitelném formátu
  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };
  
  // Funkce pro vyčištění výsledků
  const clearResults = () => {
    setTestResults([]);
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">API Tester</h2>
      
      <div className="mb-6">
        <div className="flex items-end space-x-2 mb-2">
          <div className="flex-grow">
            <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint URL
            </label>
            <input
              type="text"
              id="endpoint"
              value={endpointToTest}
              onChange={e => setEndpointToTest(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Např.: /products"
            />
          </div>
          <button
            onClick={testEndpoint}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testování...' : 'Testovat'}
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Vyčistit
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          {predefinedEndpoints.map((endpoint, index) => (
            <button
              key={index}
              onClick={() => setEndpointToTest(endpoint.path)}
              className="px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
            >
              {endpoint.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Výsledky testů</h3>
        
        {testResults.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Žádné výsledky testů. Otestujte některý endpoint.
          </div>
        ) : (
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-md ${
                  result.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{result.endpoint}</h4>
                    <span className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.success ? 'Úspěch' : 'Chyba'} - Status: {result.status || 'N/A'} - Čas: {result.time || 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
                
                {result.error && (
                  <div className="mb-2 p-2 bg-red-100 text-red-800 rounded text-sm">
                    {result.error}
                  </div>
                )}
                
                <div className="mt-2">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Data:</h5>
                  <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto">
                    {formatJson(result.data || {})}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
