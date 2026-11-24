import { createContext, useContext, useState, type ReactNode } from 'react';

export interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'CLIENT';
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, userData: UserData) => void;
  updateUser: (userData: UserData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<UserData | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (newToken: string, userData: UserData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const updateUser = (updatedData: UserData) => {
    localStorage.setItem('user', JSON.stringify(updatedData));
    setUser(updatedData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Exportamos el hook aquí mismo para mantenerlo simple y sin errores
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}