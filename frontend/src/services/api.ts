// frontend/src/services/api.ts

// Používáme přímý login endpoint místo proxy
const LOGIN_URL = '/api/auth/login';
const API_URL = '/api/proxy'; // Pro ostatní API volání

export const api = {
  // Přihlášení uživatele
  login: async (email: string, password: string) => {
    try {
      console.log('Attempting to login with:', { email });
      
      const response = await fetch(LOGIN_URL, {
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
  
  // Ostatní API volání budou nadále používat proxy
  // Tady budou později další metody pro komunikaci s API
}
