import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CmjAction, CmjMember, CmjModule, RolePermissions } from '../types/cmj';
import { cmjApi, setStoredToken } from '../services/cmjApi';
import { testFirestoreConnection } from '../firebase';

interface CmjAuthContextValue {
  user: CmjMember | null;
  permissions: RolePermissions | null;
  loading: boolean;
  can: (module: CmjModule, action: CmjAction) => boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticatedSession: (token: string, user: CmjMember, permissions: RolePermissions) => void;
}

const CmjAuthContext = createContext<CmjAuthContextValue>({
  user: null,
  permissions: null,
  loading: true,
  can: () => false,
  refreshAuth: async () => {},
  logout: async () => {},
  setAuthenticatedSession: () => {},
});

export const CmjAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CmjMember | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await cmjApi.me();
      if (res.authenticated && res.user) {
        setUser(res.user);
        setPermissions(res.permissions);
      } else {
        setUser(null);
        setPermissions(null);
      }
    } catch {
      setUser(null);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    testFirestoreConnection();
    refreshAuth();
  }, [refreshAuth]);

  const can = useCallback(
    (module: CmjModule, action: CmjAction): boolean => {
      if (!user) return false;
      if (user.role === 'admin_principal') return true;
      if (!permissions) return false;
      return Array.isArray(permissions[module]) && permissions[module].includes(action);
    },
    [user, permissions]
  );

  const setAuthenticatedSession = useCallback(
    (token: string, nextUser: CmjMember, nextPermissions: RolePermissions) => {
      setStoredToken(token);
      setUser(nextUser);
      setPermissions(nextPermissions);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await cmjApi.logout();
    } catch {
      // Ignore logout network error
    }
    setStoredToken(null);
    setUser(null);
    setPermissions(null);
  }, []);

  return (
    <CmjAuthContext.Provider
      value={{
        user,
        permissions,
        loading,
        can,
        refreshAuth,
        logout,
        setAuthenticatedSession,
      }}
    >
      {children}
    </CmjAuthContext.Provider>
  );
};

export const useCmjAuth = () => useContext(CmjAuthContext);
