// frontend/src/services/api.ts

// Použití relativní URL pro API volání - toto bude zachyceno Pages Functions
// Použijeme /api/proxy jako vstupní bod
const API_URL = '/api/proxy';

export const api = {
  // Přihlášení uživatele
  login: async (email: string, password: string) => {
    try {
      console.log('Attempting to login with:', { email });
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Login failed:', errorData);
        throw new Error(errorData.error || `Přihlášení selhalo (${response.status})`);
      }
      
      const data = await response.json();
      console.log('Login successful');
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Tady budou později další metody pro komunikaci s API
}
