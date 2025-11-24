import { createContext } from 'react';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextType | null>(null);
