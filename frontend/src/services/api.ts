// frontend/src/services/api.ts
const API_URL = 'https://broad-darkness-f0a6.hajn-tomas.workers.dev';

export const api = {
  // Přihlášení uživatele
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include', // Přidáno pro podporu cookies a autentizace
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Přihlášení selhalo');
    }
    
    return response.json();
  },
  
  // Tady budou později další metody pro komunikaci s API
}
