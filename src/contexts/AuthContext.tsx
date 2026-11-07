import React, { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  linkWithCredential,
  OAuthProvider,
  type AuthCredential,
  type User,
} from 'firebase/auth';
import { auth, googleProvider, microsoftProvider } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pendingCredentialRef = useRef<AuthCredential | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (pendingCredentialRef.current) {
        try {
          await linkWithCredential(result.user, pendingCredentialRef.current);
        } catch (linkErr) {
          console.warn('Account credential linking skipped:', linkErr);
        } finally {
          pendingCredentialRef.current = null;
        }
      }
    } catch (err: any) {
      if (err?.code === 'auth/account-exists-with-different-credential') {
        const cred = OAuthProvider.credentialFromError(err);
        if (cred) pendingCredentialRef.current = cred;
      }
      throw err;
    }
  };

  const signInWithMicrosoft = async () => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    try {
      const result = await signInWithPopup(auth, microsoftProvider);
      if (pendingCredentialRef.current) {
        try {
          await linkWithCredential(result.user, pendingCredentialRef.current);
        } catch (linkErr) {
          console.warn('Account credential linking skipped:', linkErr);
        } finally {
          pendingCredentialRef.current = null;
        }
      }
    } catch (err: any) {
      if (err?.code === 'auth/account-exists-with-different-credential') {
        const cred = OAuthProvider.credentialFromError(err);
        if (cred) pendingCredentialRef.current = cred;
      }
      throw err;
    }
  };

  const signOut = async () => {
    if (!auth) throw new Error('Firebase Auth is not initialized');
    await firebaseSignOut(auth);
  };

  const getIdToken = async () => {
    if (!currentUser) return null;
    return await currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        signInWithGoogle,
        signInWithMicrosoft,
        signOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
