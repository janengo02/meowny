import { useState, useEffect, type ReactNode } from 'react';
import { AuthContext } from '../context/AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.electron
      .getUser()
      .then((existingUser) => {
        setUser(existingUser);
      })
      .catch(() => {
        // No existing session
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
  };

  const logout = async () => {
    await window.electron.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
