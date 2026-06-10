import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

/**
 * Contexto de Autenticação para gerenciar o estado global de login do usuário.
 */
const AuthContext = createContext();

/**
 * Provedor de Autenticação (Provider).
 * Envolve a aplicação para disponibilizar dados de sessão e métodos de login/logout.
 * 
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicialização: Tenta recuperar a sessão do armazenamento local
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { 
      setLoading(false); 
      return; 
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // Falha no parsing limpa o estado para segurança
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Realiza a autenticação do usuário e persiste os tokens.
   * 
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} Dados do usuário e tokens.
   */
  async function login(email, password) {
    const { data } = await authApi.login({ email, password });
    
    // Persistência segura em localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setUser(data.user);
    return data;
  }

  /**
   * Encerra a sessão do usuário, limpando tokens locais e tentando invalidar no servidor.
   */
  async function logout() {
    const rt = localStorage.getItem('refresh_token');
    if (rt) {
      // Tentativa de logout no backend (fail-safe)
      authApi.logout({ refresh_token: rt }).catch(() => {});
    }
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }

  /**
   * Atualiza os dados do usuário no estado e no armazenamento local.
   * 
   * @param {Object} userData - Novos dados do usuário.
   */
  function updateUser(userData) {
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook customizado para acessar o contexto de autenticação de forma simplificada.
 * @returns {{user: Object|null, loading: boolean, login: Function, logout: Function, isAuthenticated: boolean}}
 */
export const useAuth = () => useContext(AuthContext);
