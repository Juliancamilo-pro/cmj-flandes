import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { getCollaboratorByEmail, getSubscriberByEmail, getSettings } from '../services/db';
import { Collaborator, SubscriberUser } from '../types';

const OWNER_EMAIL = 'trujillogordilooo@gmail.com';
export const AUTHOR_ACCESS_CODE = '111965400';

export type UserRole = 'owner' | 'collaborator' | 'subscriber' | 'public';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isCollaborator: boolean;
  isSubscriber: boolean;
  collaborator: Collaborator | null;
  subscriber: SubscriberUser | null;
  role: UserRole;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (email: string, pass: string) => Promise<void>;
  loginWithCode: (code: string) => boolean;
  loginCollaborator: (email: string, invitationCode: string) => Promise<{ success: boolean; message: string }>;
  loginSubscriber: (email: string) => Promise<{ success: boolean; message: string; subscriber?: SubscriberUser }>;
  setSubscriberSession: (sub: SubscriberUser | null) => void;
  logout: () => Promise<void>;
  ownerEmail: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isCollaborator: false,
  isSubscriber: false,
  collaborator: null,
  subscriber: null,
  role: 'public',
  loading: true,
  loginWithGoogle: async () => {},
  loginWithPassword: async () => {},
  loginWithCode: () => false,
  loginCollaborator: async () => ({ success: false, message: '' }),
  loginSubscriber: async () => ({ success: false, message: '' }),
  setSubscriberSession: () => {},
  logout: async () => {},
  ownerEmail: OWNER_EMAIL
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedCode = sessionStorage.getItem('jc_author_code') || localStorage.getItem('jc_author_code');
      return savedCode === AUTHOR_ACCESS_CODE;
    }
    return false;
  });
  const [isCollaborator, setIsCollaborator] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('jc_collaborator_session');
    }
    return false;
  });
  const [collaborator, setCollaborator] = useState<Collaborator | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('jc_collaborator_session');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return null;
  });
  const [isSubscriber, setIsSubscriber] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('jc_subscriber_session');
    }
    return false;
  });
  const [subscriber, setSubscriber] = useState<SubscriberUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('jc_subscriber_session');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Sync role
  const role: UserRole = isAdmin ? 'owner' : isCollaborator ? 'collaborator' : isSubscriber ? 'subscriber' : 'public';

  useEffect(() => {
    // Check code session
    const savedCode = sessionStorage.getItem('jc_author_code') || localStorage.getItem('jc_author_code');
    if (savedCode === AUTHOR_ACCESS_CODE) {
      setIsAdmin(true);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Verify if token service is operational; if not, safely sign out stale session
        try {
          await currentUser.getIdToken();
        } catch (tokenErr: any) {
          const errMsg = tokenErr?.message || '';
          if (errMsg.includes('token-service-api') || tokenErr?.code === 'auth/token-service-api-has-not-been-used-in-project') {
            await signOut(auth).catch(() => {});
            setUser(null);
            const hasValidCode = sessionStorage.getItem('jc_author_code') === AUTHOR_ACCESS_CODE || 
                                 localStorage.getItem('jc_author_code') === AUTHOR_ACCESS_CODE;
            setIsAdmin(hasValidCode);
            setLoading(false);
            return;
          }
        }

        setUser(currentUser);
        const isOwnerByEmail = currentUser.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
        if (isOwnerByEmail) {
          setIsAdmin(true);
        }

        try {
          // Check if admin document exists
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          const adminDoc = await getDoc(adminDocRef);
          
          if (isOwnerByEmail || (adminDoc && adminDoc.exists())) {
            setIsAdmin(true);
            if (isOwnerByEmail && (!adminDoc || !adminDoc.exists())) {
              setDoc(adminDocRef, {
                email: currentUser.email,
                role: 'owner',
                createdAt: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            }
          } else {
            // Check if collaborator
            if (currentUser.email) {
              const col = await getCollaboratorByEmail(currentUser.email);
              if (col && col.status === 'activo') {
                setIsCollaborator(true);
                setCollaborator(col);
                sessionStorage.setItem('jc_collaborator_session', JSON.stringify(col));
              }
            }

            const hasCode = sessionStorage.getItem('jc_author_code') === AUTHOR_ACCESS_CODE || 
                            localStorage.getItem('jc_author_code') === AUTHOR_ACCESS_CODE;
            if (!hasCode) {
              setIsAdmin(false);
            }
          }
        } catch (e) {
          // In offline mode or when network token API is warming up, gracefully fallback
          if (isOwnerByEmail) {
            setIsAdmin(true);
          } else {
            const hasCode = sessionStorage.getItem('jc_author_code') === AUTHOR_ACCESS_CODE || 
                            localStorage.getItem('jc_author_code') === AUTHOR_ACCESS_CODE;
            if (hasCode) {
              setIsAdmin(true);
            }
          }
        }
      } else {
        const hasValidCode = sessionStorage.getItem('jc_author_code') === AUTHOR_ACCESS_CODE || 
                             localStorage.getItem('jc_author_code') === AUTHOR_ACCESS_CODE;
        if (hasValidCode) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }

        // Restore collaborator session if active
        const savedCol = sessionStorage.getItem('jc_collaborator_session');
        if (savedCol) {
          try {
            const parsed = JSON.parse(savedCol);
            setCollaborator(parsed);
            setIsCollaborator(true);
          } catch (e) {}
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync collaborator permissions from database on mount & window focus so revoked permissions take effect immediately
  useEffect(() => {
    if (!isCollaborator || !collaborator?.email) return;
    let active = true;

    const syncCollaboratorPermissions = async () => {
      try {
        const fresh = await getCollaboratorByEmail(collaborator.email);
        if (!active) return;
        if (!fresh || fresh.status !== 'activo') {
          sessionStorage.removeItem('jc_collaborator_session');
          setIsCollaborator(false);
          setCollaborator(null);
          return;
        }
        setCollaborator(fresh);
        sessionStorage.setItem('jc_collaborator_session', JSON.stringify(fresh));
      } catch (e) {}
    };

    syncCollaboratorPermissions();
    window.addEventListener('focus', syncCollaboratorPermissions);
    return () => {
      active = false;
      window.removeEventListener('focus', syncCollaboratorPermissions);
    };
  }, [isCollaborator, collaborator?.email]);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithPassword = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithCode = (code: string): boolean => {
    const clean = code.trim();
    if (clean === AUTHOR_ACCESS_CODE) {
      sessionStorage.setItem('jc_author_code', AUTHOR_ACCESS_CODE);
      localStorage.setItem('jc_author_code', AUTHOR_ACCESS_CODE);
      setIsAdmin(true);
      setIsCollaborator(false);
      return true;
    }
    return false;
  };

  const loginCollaborator = async (email: string, invitationCode: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = invitationCode.trim();

    try {
      // 1. Verify invitation code
      const settings = await getSettings();
      const expectedCode = (settings.invitationCode || 'COLOMBIA2026').trim().toLowerCase();
      if (expectedCode !== cleanCode.toLowerCase()) {
        return { success: false, message: 'El código de acceso editorial es incorrecto.' };
      }

      // 2. Verify collaborator in database
      const col = await getCollaboratorByEmail(cleanEmail);
      if (!col) {
        return { 
          success: false, 
          message: 'No se encontró una cuenta de colaborador aprobada para este correo. Debes enviar primero tu solicitud en el panel de Colaboración.' 
        };
      }

      if (col.status !== 'activo') {
        return { success: false, message: 'Tu cuenta de colaborador se encuentra suspendida o inactiva.' };
      }

      // Login success
      setIsCollaborator(true);
      setCollaborator(col);
      sessionStorage.setItem('jc_collaborator_session', JSON.stringify(col));
      return { success: true, message: `Bienvenido al panel editorial, ${col.fullName}.` };
    } catch (e) {
      console.error('Error logging in collaborator:', e);
      return { success: false, message: 'Ocurrió un error al verificar tu cuenta de colaborador.' };
    }
  };

  const loginSubscriber = async (email: string): Promise<{ success: boolean; message: string; subscriber?: SubscriberUser }> => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const sub = await getSubscriberByEmail(cleanEmail);
      if (!sub) {
        return {
          success: false,
          message: 'No se encontró una suscripción registrada con este correo electrónico.'
        };
      }

      if (sub.status !== 'activa') {
        return {
          success: false,
          message: `Tu suscripción se encuentra actualmente con estado: «${sub.status}». Por favor renueva tu suscripción para continuar.`
        };
      }

      // Check expiration date
      const now = new Date();
      if (new Date(sub.endDate) < now) {
        return {
          success: false,
          message: 'Tu suscripción mensual ha expirado. Por favor efectúa la renovación para acceder a las funciones de autor.'
        };
      }

      setIsSubscriber(true);
      setSubscriber(sub);
      sessionStorage.setItem('jc_subscriber_session', JSON.stringify(sub));
      return { success: true, message: `¡Bienvenido de nuevo, ${sub.fullName}!`, subscriber: sub };
    } catch (e) {
      console.error('Error logging in subscriber:', e);
      return { success: false, message: 'Ocurrió un error al verificar la suscripción.' };
    }
  };

  const setSubscriberSession = (sub: SubscriberUser | null) => {
    if (sub) {
      setIsSubscriber(true);
      setSubscriber(sub);
      sessionStorage.setItem('jc_subscriber_session', JSON.stringify(sub));
    } else {
      setIsSubscriber(false);
      setSubscriber(null);
      sessionStorage.removeItem('jc_subscriber_session');
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('jc_author_code');
    localStorage.removeItem('jc_author_code');
    sessionStorage.removeItem('jc_collaborator_session');
    sessionStorage.removeItem('jc_subscriber_session');
    setIsAdmin(false);
    setIsCollaborator(false);
    setIsSubscriber(false);
    setCollaborator(null);
    setSubscriber(null);
    try {
      await signOut(auth);
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isCollaborator,
        isSubscriber,
        collaborator,
        subscriber,
        role,
        loading,
        loginWithGoogle,
        loginWithPassword,
        loginWithCode,
        loginCollaborator,
        loginSubscriber,
        setSubscriberSession,
        logout,
        ownerEmail: OWNER_EMAIL
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
